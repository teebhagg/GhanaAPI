/* eslint-disable @typescript-eslint/no-unused-vars */

/* eslint-disable @typescript-eslint/require-await */
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import type { Cache } from 'cache-manager';
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
} from './providers/rate-provider.interface';

@Injectable()
export class ExchangeRatesService {
  private readonly supportedCurrencies = ['USD', 'EUR', 'GBP', 'NGN'];
  private readonly base = 'GHS';

  constructor(
    private readonly exchangeRateApi: ExchangeRateApiProvider,
    private readonly fixer: FixerProvider,
    private readonly bog: BankOfGhanaProvider,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
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
    await this.cache.set(cacheKey, merged.data, 30 * 60);
    return merged.data as ExchangeRateDto[];
  }

  async getHistoricalRates(
    from: Date,
    to: Date,
    currency: string,
  ): Promise<HistoricalRateDto[]> {
    // External historical API integration can be added in a later phase.
    return [];
  }

  @Cron('0 */30 * * * *') // every 30 minutes
  async updateExchangeRates() {
    // No DB persistence in Phase 1; rely on cache + on-demand fetch.
    return;
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

    console.warn('[ExchangeRates] All providers failed:', errors.join(' | '));
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

    await this.cache.set(cacheKey, result, 30 * 60);
    if (!result.success) {
      throw AppException.rateProviderFailed(result.message);
    }
    return result.data[0] as ConversionResult;
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
