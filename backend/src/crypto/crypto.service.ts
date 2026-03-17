import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom } from 'rxjs';
import { ExchangeRatesService } from '../exchange-rates/exchange-rates.service';

@Injectable()
export class CryptoService {
  private readonly logger = new Logger(CryptoService.name);

  constructor(
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    private readonly httpService: HttpService,
    private readonly exchangeRatesService: ExchangeRatesService,
  ) {}

  async getCryptoPrices(ids: string[] = ['bitcoin', 'ethereum']) {
    const idsString = ids.sort().join(',');
    const cacheKey = `crypto:prices:${idsString}`;
    
    // Check cache
    const cached = await this.cache.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

    // Try fetching from CoinGecko
    const url = `https://api.coingecko.com/api/v3/simple/price`;
    let coinGeckoData: any = null;
    let fallbackUsed = false;

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
      this.logger.warn('Failed to fetch from CoinGecko, using fallback simulated data');
      // Automatic fallback in case CoinGecko rate limits
      fallbackUsed = true;
      coinGeckoData = this.getFallbackData(ids);
    }

    // Convert USD prices to GHS using improved exchange rate service
    const results = {};
    for (const id of ids) {
      if (coinGeckoData[id] && coinGeckoData[id].usd) {
        const usdPrice = coinGeckoData[id].usd;
        
        let ghsPrice = 0;
        try {
          const conversion = await this.exchangeRatesService.convertCurrency({
            from: 'USD',
            to: 'GHS',
            amount: usdPrice
          });
          ghsPrice = conversion.result;
        } catch (error) {
          this.logger.warn(`Failed to convert USD to GHS: ${error.message}`);
          // If conversion fails, maybe use an approximate rate
          ghsPrice = usdPrice * 15.0; // dummy fallback rate
        }

        results[id] = {
          usd: usdPrice,
          ghs: ghsPrice,
        };
      }
    }

    const responseData = {
      source: fallbackUsed ? 'fallback' : 'coingecko',
      data: results,
      timestamp: new Date().toISOString(),
    };

    // Cache results for 60 seconds
    await this.cache.set(cacheKey, responseData, 60);

    return responseData;
  }

  private getFallbackData(ids: string[]) {
    // Provide some recent realistic dummy values if API is rate limited
    const fallbackStore: Record<string, { usd: number }> = {
      bitcoin: { usd: 65000 },
      ethereum: { usd: 3500 },
      solana: { usd: 150 },
      cardano: { usd: 0.5 },
      binancecoin: { usd: 600 },
      ripple: { usd: 0.6 },
    };

    const result: Record<string, { usd: number }> = {};
    for (const id of ids) {
      result[id] = fallbackStore[id] || { usd: 100 }; // Default dummy
    }
    return result;
  }
}
