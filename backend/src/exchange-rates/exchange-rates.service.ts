import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../common/database/prisma.service';
import { AppException } from '../common/exceptions/app-exception';
import { ConvertCurrencyDto } from './dto/convert-currency.dto';
import { ExchangeRateDto } from './dto/exchange-rate.dto';
import { HistoricalRateDto } from './dto/historical-rate.dto';
import { BankOfGhanaProvider } from './providers/bank-of-ghana.provider';
import { ExchangeRateApiProvider } from './providers/exchangerateapi.provider';
import { FixerProvider } from './providers/fixer.provider';
import {
  ConversionResult,
  FallbackResult,
  RateData,
} from './providers/rate-provider.interface';

@Injectable()
export class ExchangeRatesService {
  private readonly logger = new Logger(ExchangeRatesService.name);
  private readonly supportedCurrencies = [
    'USD',
    'EUR',
    'GBP',
    'NGN',
    'CHF',
    'JPY',
    'CNY',
  ];
  private readonly base = 'GHS';

  constructor(
    private readonly exchangeRateApi: ExchangeRateApiProvider,
    private readonly fixer: FixerProvider,
    private readonly bog: BankOfGhanaProvider,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    private readonly prisma: PrismaService,
  ) {}

  async getCurrentRates(currencies?: string[]): Promise<ExchangeRateDto[]> {
    const list = (
      currencies?.length ? currencies : this.supportedCurrencies
    ).map((c) => c.toUpperCase());
    const cacheKey = `fx:current:${[...list].sort().join(',')}`;
    const cached = await this.cache.get<ExchangeRateDto[]>(cacheKey);
    if (cached) return cached;

    const providers = [
      () => this.bog.fetchRates(this.base, list),
      () => this.exchangeRateApi.fetchRates(this.base, list),
      () => this.fixer.fetchRates(this.base, list),
    ];

    const merged = await this.getDataWithFallback(providers);
    if (!merged.success) {
      // prefer BoG-specific error code when scraping fails
      throw AppException.rateProviderFailed(merged.message);
    }

    const rates = this.mapToExchangeRateDtos(merged.data as RateData[]);

    await this.persistRates(rates);

    // Only cache when successful
    await this.cache.set(cacheKey, rates, 30 * 60);
    return rates;
  }

  async getHistoricalRates(
    from: Date,
    to: Date,
    currency: string,
  ): Promise<HistoricalRateDto[]> {
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      throw AppException.badRequest('Invalid date range provided');
    }

    if (from > to) {
      throw AppException.badRequest('`from` date must be before `to` date');
    }

    console.log(from, to, currency);

    const code = currency.toUpperCase();

    // Check if today is in the requested date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    const toDateOnly = new Date(to);
    toDateOnly.setHours(23, 59, 59, 999);

    const todayInRange =
      today >= from && today <= toDateOnly && todayEnd <= toDateOnly;

    // If today is in range, check if today's data exists
    if (todayInRange) {
      const todayDataExists = await this.prisma.exchangeRateHistory.findFirst({
        where: {
          baseCurrency: this.base,
          targetCurrency: code,
          sourceTimestamp: {
            gte: today,
            lte: todayEnd,
          },
        },
      });

      // If today's data doesn't exist, fetch and store it
      if (!todayDataExists) {
        this.logger.log(
          `Today's exchange rate for ${code} not found in database, fetching from BoG...`,
        );
        try {
          // Fetch current rates for this currency (will auto-persist via persistRates)
          await this.getCurrentRates([code]);
          this.logger.log(
            `Successfully fetched and stored today's exchange rate for ${code}`,
          );
        } catch (error) {
          this.logger.warn(
            `Failed to fetch today's exchange rate for ${code}: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
          // Continue with existing historical data even if fetch fails
        }
      }
    }

    // Fetch historical data (may include today's data if it was just added)
    const history = await this.prisma.exchangeRateHistory.findMany({
      where: {
        baseCurrency: this.base,
        targetCurrency: code,
        sourceTimestamp: {
          gte: from,
          lte: to,
        },
      },
      orderBy: {
        sourceTimestamp: 'asc',
      },
    });

    return history.map((record) => ({
      baseCurrency: record.baseCurrency,
      targetCurrency: record.targetCurrency,
      rate: Number(record.rate),
      provider: record.provider,
      date: record.sourceTimestamp,
    }));
  }

  @Cron('0 */30 * * * *') // every 30 minutes
  async updateExchangeRates() {
    try {
      await this.getCurrentRates();
    } catch (error) {
      this.logger.warn(
        `Scheduled rate update failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private async getDataWithFallback(
    providers: Array<() => Promise<any[]>>,
  ): Promise<FallbackResult> {
    const errors: string[] = [];
    for (const p of providers) {
      try {
        const res = await p();
        if (Array.isArray(res))
          return { success: true, message: '', data: res }; // even if empty, don't 500
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        errors.push(msg);
        continue;
      }
    }
    // All threw: surface combined message to logs; return empty to avoid 500s in MVP

    this.logger.warn(
      `[ExchangeRates] All providers failed: ${errors.join(' | ')}`,
    );
    return { success: false, message: errors.join(' | '), data: [] };
  }

  async convertCurrency(body: ConvertCurrencyDto) {
    const cacheKey = `fx:convert:${body.from}:${body.to}:${body.amount}`;
    const cached = await this.cache.get<ConversionResult>(cacheKey);
    if (cached) return cached;

    const providers = [
      () => this.bog.convertCurrency(body),
      () => this.exchangeRateApi.convertCurrency(body),
      () => this.fixer.convertCurrency(body),
    ];

    const result = await this.getDataWithFallbackForConversion(providers);

    if (!result.success) {
      throw AppException.rateProviderFailed(result.message);
    }

    const conversion = result.data[0] as ConversionResult;

    // Only cache when successful
    await this.cache.set(cacheKey, conversion, 30 * 60);
    return conversion;
  }

  private mapToExchangeRateDtos(rates: RateData[]): ExchangeRateDto[] {
    return rates
      .filter((rate) => Number.isFinite(rate.rate))
      .map((rate) => {
        const timestamp = rate.timestamp ?? new Date();
        const target = rate.targetCurrency?.toUpperCase?.();
        return {
          baseCurrency: rate.baseCurrency ?? this.base,
          targetCurrency: target ?? rate.targetCurrency,
          rate: rate.rate,
          provider: rate.provider,
          timestamp,
        };
      });
  }

  private async persistRates(rates: ExchangeRateDto[]) {
    if (!rates.length) return;

    try {
      await this.prisma.exchangeRateHistory.createMany({
        data: rates.map((rate) => ({
          baseCurrency: rate.baseCurrency,
          targetCurrency: rate.targetCurrency,
          rate: rate.rate,
          provider: rate.provider,
          sourceTimestamp: rate.timestamp,
        })),
        skipDuplicates: true,
      });
    } catch (error) {
      this.logger.warn(
        `Failed to persist exchange rate history: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private async getDataWithFallbackForConversion(
    providers: Array<() => Promise<ConversionResult>>,
  ): Promise<FallbackResult> {
    for (const p of providers) {
      try {
        const res = await p();
        if (res) return { success: true, message: '', data: [res] };
      } catch {
        continue;
      }
    }
    return { success: false, message: 'All providers failed', data: [] };
  }
}
