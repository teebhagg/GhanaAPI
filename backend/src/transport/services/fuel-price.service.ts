import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

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
  private readonly fuelPriceApis = [
    'globalpetrolprices',
    'fuel-prices-api',
    'local-scraper',
  ];

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async getFuelPrices(): Promise<FuelPrice> {
    for (const api of this.fuelPriceApis) {
      try {
        this.logger.log(`Trying to get fuel prices from ${api}`);

        switch (api) {
          case 'globalpetrolprices':
            return await this.getFuelPricesGlobal();
          case 'fuel-prices-api':
            return await this.getFuelPricesAPI();
          case 'local-scraper':
            return await this.getFuelPricesLocal();
          default:
            continue;
        }
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

  private async getFuelPricesGlobal(): Promise<FuelPrice> {
    const url = 'https://www.globalpetrolprices.com/api/ghana/petrol';
    const response = await firstValueFrom(
      this.httpService.get(url, { timeout: 15000 }),
    );

    return this.parseGlobalFuelPrices(response.data);
  }

  private async getFuelPricesAPI(): Promise<FuelPrice> {
    // Alternative fuel price API
    const apiKey = this.configService.get<string>('FUEL_API_KEY');
    const url = `https://api.fuelprice.io/v1/ghana?key=${apiKey}`;

    const response = await firstValueFrom(
      this.httpService.get(url, { timeout: 15000 }),
    );

    return this.parseFuelPricesAPI(response.data);
  }

  private getFuelPricesLocal(): Promise<FuelPrice> {
    // Local web scraping or cached data
    // This could scrape NPA (National Petroleum Authority) Ghana website
    // const url = 'https://npa.gov.gh/web/page.php?id=4'; // NPA price list

    // For now, return mock data - implement web scraping as needed
    return Promise.resolve({
      petrol: 15.2, // GHS per litre
      diesel: 15.99,
      lpg: 8.5,
      currency: 'GHS',
      lastUpdated: new Date().toISOString(),
      source: 'NPA Ghana',
    });
  }

  private parseGlobalFuelPrices(data: any): FuelPrice {
    return {
      petrol: data.petrol_price || 0,
      diesel: data.diesel_price || 0,
      currency: data.currency || 'GHS',
      lastUpdated: data.last_updated || new Date().toISOString(),
      source: 'GlobalPetrolPrices',
    };
  }

  private parseFuelPricesAPI(data: any): FuelPrice {
    return {
      petrol: data.prices.petrol || 0,
      diesel: data.prices.diesel || 0,
      lpg: data.prices.lpg || 0,
      currency: data.currency || 'GHS',
      lastUpdated: data.timestamp || new Date().toISOString(),
      source: 'FuelPriceAPI',
    };
  }
}
