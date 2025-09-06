/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { HttpService } from '@nestjs/axios';
import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  Inject,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { firstValueFrom } from 'rxjs';
import * as cheerio from 'cheerio';

export interface FuelPrice {
  petrol: number;
  diesel: number;
  lpg?: number;
  currency: string;
  lastUpdated: string;
  source: string;
}

@Injectable()
export class FuelPriceService {
  private readonly logger = new Logger(FuelPriceService.name);
  private readonly fuelPriceApis = ['cedirates-scraper'];
  private readonly FUEL_PRICE_CACHE_KEY = 'fuel_prices';

  constructor(
    private readonly httpService: HttpService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  /**
   * Calculate TTL (time-to-live) in seconds until 11:59 PM today
   * If it's already past 11:59 PM, calculate until 11:59 PM tomorrow
   */
  private getCacheTTL(): number {
    const now = new Date();
    const targetTime = new Date();

    // Set target time to 11:59:59 PM today
    targetTime.setHours(23, 59, 59, 999);

    // If we're already past 11:59 PM, set target to tomorrow
    if (now > targetTime) {
      targetTime.setDate(targetTime.getDate() + 1);
    }

    const timeDiff = targetTime.getTime() - now.getTime();
    const ttlSeconds = Math.ceil(timeDiff / 1000);

    this.logger.debug(
      `Cache TTL calculated: ${ttlSeconds} seconds until ${targetTime.toISOString()}`,
    );
    return ttlSeconds;
  }

  async getFuelPrices(): Promise<FuelPrice> {
    // Check cache first
    const cachedPrices = await this.cacheManager.get<FuelPrice>(
      this.FUEL_PRICE_CACHE_KEY,
    );
    if (cachedPrices) {
      this.logger.debug('Returning cached fuel prices');
      return cachedPrices;
    }

    this.logger.debug('No cached fuel prices found, fetching from API');

    // Fetch fresh data
    for (const api of this.fuelPriceApis) {
      try {
        let fuelPrices: FuelPrice;

        switch (api) {
          case 'cedirates-scraper':
            fuelPrices = await this.getFuelPricesFromCediRates();
            break;
          default:
            continue;
        }

        // Cache the result with TTL until 11:59 PM
        const ttl = this.getCacheTTL();
        await this.cacheManager.set(
          this.FUEL_PRICE_CACHE_KEY,
          fuelPrices,
          ttl * 1000,
        ); // TTL in milliseconds

        this.logger.log(`Cached fuel prices for ${ttl} seconds until 11:59 PM`);
        return fuelPrices;
      } catch (error) {
        this.logger.warn(`Fuel prices from ${api} failed: ${error.message}`);
        continue;
      }
    }

    throw new HttpException(
      'All fuel price APIs failed',
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }

  private async getFuelPricesFromCediRates(): Promise<FuelPrice> {
    const url = 'https://cedirates.com/fuel-prices/gh/';
    const response = await firstValueFrom(
      this.httpService.get(url, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; GhanaAPI/1.0)',
        },
      }),
    );

    return this.parseCediRatesFuelPrices(response.data);
  }

  private parseCediRatesFuelPrices(html: string): FuelPrice {
    try {
      const $ = cheerio.load(html);

      // Target companies: Shell, Goil, Total, Star Oil (preprocessed to lowercase)
      const targetCompanies = ['Shell', 'Goil', 'Total', 'Star Oil'];
      const targetCompaniesLower = targetCompanies.map((company) =>
        company.toLowerCase(),
      );
      const petrolPrices: number[] = [];
      const dieselPrices: number[] = [];

      // Parse fuel prices from CediRates table
      $('table tr').each((index, element) => {
        const row = $(element);
        const cells = row.find('td');

        // Need at least 4 cells (company name, petrol, diesel, premium)
        if (cells.length >= 4) {
          const companyName = cells.eq(1).text().trim().replace(/Get$/, ''); // Remove "Get" suffix
          const companyNameLower = companyName.toLowerCase();
          const petrolText = cells.eq(2).text().trim();
          const dieselText = cells.eq(3).text().trim();

          // Check if this company is one of our targets (using preprocessed lowercase array)
          const isTargetCompany = targetCompaniesLower.some((target) =>
            companyNameLower.includes(target),
          );

          if (isTargetCompany) {
            // Extract petrol price
            const petrolPrice = parseFloat(petrolText.replace(/[^\d.]/g, ''));

            // Extract diesel price
            const dieselPrice = parseFloat(dieselText.replace(/[^\d.]/g, ''));

            if (!isNaN(petrolPrice) && petrolPrice > 0) {
              petrolPrices.push(petrolPrice);
            }

            if (!isNaN(dieselPrice) && dieselPrice > 0) {
              dieselPrices.push(dieselPrice);
            }
          }
        }
      });

      // Calculate averages
      const avgPetrol =
        petrolPrices.length > 0
          ? petrolPrices.reduce((sum, price) => sum + price, 0) /
            petrolPrices.length
          : 0;

      const avgDiesel =
        dieselPrices.length > 0
          ? dieselPrices.reduce((sum, price) => sum + price, 0) /
            dieselPrices.length
          : 0;

      return {
        petrol: Math.round(avgPetrol * 100) / 100, // Round to 2 decimal places
        diesel: Math.round(avgDiesel * 100) / 100,
        currency: 'GHS',
        lastUpdated: new Date().toISOString(),
        source: 'CediRates.com (Shell, Goil, Total, Star Oil Average)',
      };
    } catch (error) {
      this.logger.error(`Failed to parse CediRates HTML: ${error.message}`);
      throw error;
    }
  }
}
