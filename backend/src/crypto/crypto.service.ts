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
import { ServiceHealth } from '../common/health/service-health';
import { ExchangeRatesService } from '../exchange-rates/exchange-rates.service';

@Injectable()
export class CryptoService {
  private readonly logger = new Logger(CryptoService.name);

  // What the last real upstream attempt did, for the /status endpoint. The
  // price cache only lasts 60 s and would forget an outage.
  private lastUpstreamFailed = false;
  private lastUpstreamOkAt: number | null = null;

  constructor(
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    private readonly httpService: HttpService,
    private readonly exchangeRatesService: ExchangeRatesService,
  ) {}

  /** For the /status endpoint. Never calls CoinGecko. */
  getHealth(): ServiceHealth {
    return {
      status: this.lastUpstreamFailed ? 'unhealthy' : 'healthy',
      asOf: this.lastUpstreamOkAt
        ? new Date(this.lastUpstreamOkAt).toISOString()
        : null,
      detail: this.lastUpstreamFailed
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
    } catch {
      this.lastUpstreamFailed = true;
      throw new ServiceUnavailableException(
        'Crypto prices are temporarily unavailable from the upstream provider',
      );
    }

    // Convert USD prices to GHS. A failed conversion is an error, not an estimate.
    const results = {};
    for (const id of ids) {
      if (coinGeckoData[id] && coinGeckoData[id].usd) {
        const usdPrice = coinGeckoData[id].usd;

        let ghsPrice: number;
        try {
          const conversion = await this.exchangeRatesService.convertCurrency({
            from: 'USD',
            to: 'GHS',
            amount: usdPrice
          });
          ghsPrice = conversion.result;
        } catch (error) {
          this.logger.warn(`Failed to convert USD to GHS: ${error.message}`);
          this.lastUpstreamFailed = true;
          throw new ServiceUnavailableException(
            'Crypto GHS conversion is temporarily unavailable',
          );
        }

        results[id] = {
          usd: usdPrice,
          ghs: ghsPrice,
        };
      }
    }

    const responseData = {
      source: 'coingecko',
      data: results,
      timestamp: new Date().toISOString(),
    };

    this.lastUpstreamFailed = false;
    this.lastUpstreamOkAt = Date.now();

    // Cache results for 60 seconds. Errors above return before this point, so they are never cached.
    await this.cache.set(cacheKey, responseData, 60000); // cache-manager v5 uses ms

    return responseData;
  }
}
