import {
  Injectable,
  Inject,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom } from 'rxjs';
import {
  FailureReport,
  HealthState,
  ServiceHealth,
} from '../common/health/service-health';
import { describeFailure } from '../common/health/upstream-failure';
import { ExchangeRatesService } from '../exchange-rates/exchange-rates.service';

// How long a price set stays in the cache (cache-manager v5 uses ms)
const CACHE_TTL_MS = 60_000;

@Injectable()
export class CryptoService {
  private readonly logger = new Logger(CryptoService.name);

  // What the last real upstream attempt did, for the /status endpoint. The
  // price cache only lasts 60 s and would forget an outage.
  private lastUpstreamFailed = false;
  private lastFailure: FailureReport | null = null;
  private lastUpstreamOkAt: number | null = null;

  constructor(
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    private readonly httpService: HttpService,
    private readonly exchangeRatesService: ExchangeRatesService,
  ) {}

  /** For the /status endpoint. Never calls CoinGecko. */
  getHealth(): ServiceHealth {
    // A failed request can overlap one that cached prices. Those prices stay
    // usable until the cache entry expires, so the outage is only degraded.
    const cachedPricesUsable =
      this.lastUpstreamOkAt !== null &&
      Date.now() - this.lastUpstreamOkAt < CACHE_TTL_MS;
    const status: HealthState = !this.lastUpstreamFailed
      ? 'healthy'
      : cachedPricesUsable
        ? 'degraded'
        : 'unhealthy';

    return {
      status,
      asOf: this.lastUpstreamOkAt
        ? new Date(this.lastUpstreamOkAt).toISOString()
        : null,
      ...(this.lastFailure &&
        status !== 'healthy' && { lastFailure: this.lastFailure }),
      detail:
        status === 'degraded'
          ? 'The last attempt to get crypto prices failed; serving cached prices'
          : status === 'unhealthy'
            ? 'The last attempt to get crypto prices failed'
            : this.lastUpstreamOkAt
              ? undefined
              : 'No crypto prices requested since the server started',
    };
  }

  async getCryptoPrices(ids: string[] = ['bitcoin', 'ethereum']) {
    const idsString = ids.sort().join(',');
    const cacheKey = `crypto:prices:${idsString}`;

    // Check cache
    const cached = await this.cache.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from CoinGecko. On failure, throw: never substitute invented prices.
    const url = `https://api.coingecko.com/api/v3/simple/price`;
    let coinGeckoData: any;

    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          params: {
            ids: idsString,
            vs_currencies: 'usd',
          },
        }).pipe(
          catchError((error) => {
            this.logger.warn(`CoinGecko API error: ${error.message}`);
            throw error;
          })
        )
      );
      coinGeckoData = response.data;
    } catch (error) {
      this.lastUpstreamFailed = true;
      this.lastFailure = {
        reason: describeFailure(error),
        at: new Date(Date.now()).toISOString(),
        scope: 'coingecko',
      };
      throw new ServiceUnavailableException(
        'Crypto prices are temporarily unavailable from the upstream provider',
      );
    }

    // Convert USD prices to GHS. A failed conversion is an error, not an estimate.
    // The rate is fetched once for an amount of 1, so the conversion cache key
    // is the same for every request instead of one entry per price.
    const priced = ids.filter((id) => coinGeckoData[id]?.usd);
    const results = {};
    if (priced.length) {
      let usdToGhs: number;
      try {
        const conversion = await this.exchangeRatesService.convertCurrency({
          from: 'USD',
          to: 'GHS',
          amount: 1,
        });
        usdToGhs = conversion.rate;
        if (!Number.isFinite(usdToGhs)) {
          throw new Error('Conversion returned no usable rate');
        }
      } catch (error) {
        this.logger.warn(`Failed to convert USD to GHS: ${error.message}`);
        this.lastUpstreamFailed = true;
        this.lastFailure = {
          reason: describeFailure(error),
          at: new Date(Date.now()).toISOString(),
          scope: 'usd-to-ghs',
        };
        throw new ServiceUnavailableException(
          'Crypto GHS conversion is temporarily unavailable',
        );
      }

      for (const id of priced) {
        const usdPrice = coinGeckoData[id].usd;
        results[id] = { usd: usdPrice, ghs: usdPrice * usdToGhs };
      }
    }

    const responseData = {
      source: 'coingecko',
      data: results,
      timestamp: new Date().toISOString(),
    };

    this.lastUpstreamFailed = false;
    this.lastFailure = null;
    this.lastUpstreamOkAt = Date.now();

    // Cache results for 60 seconds. Errors above return before this point, so they are never cached.
    await this.cache.set(cacheKey, responseData, CACHE_TTL_MS);

    return responseData;
  }
}
