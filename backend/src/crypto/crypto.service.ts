import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError, AxiosInstance } from 'axios';
import { CoinMarketData } from './entities/crypto.entity';

export interface CoinListItem {
  id: string;
  symbol: string;
  name: string;
}

export interface CoinPriceData {
  [coinId: string]: {
    usd: number;
    ghs: number;
    eur: number;
  };
}

export interface GetAllCoinsResponse {
  data: CoinMarketData[];
  page: number;
  total: number;
}

@Injectable()
export class CryptoService {
  private readonly logger = new Logger(CryptoService.name);
  private readonly axiosInstance: AxiosInstance;
  private readonly baseUrl: string;
  private readonly requestTimeout: number;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl =
      this.configService.get<string>('COINGECKO_API_URL') ||
      'https://api.coingecko.com/api/v3';
    this.requestTimeout =
      this.configService.get<number>('COINGECKO_REQUEST_TIMEOUT') || 10000;

    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      timeout: this.requestTimeout,
      headers: {
        Accept: 'application/json',
      },
    });
  }

  async findAll(): Promise<CoinListItem[]> {
    try {
      const response =
        await this.axiosInstance.get<CoinListItem[]>('/coins/list');
      this.logger.debug(`Fetched ${response.data.length} coins from list`);
      return response.data;
    } catch (error) {
      this.handleAxiosError(error, 'findAll');
      throw error;
    }
  }

  async findOne(id: string): Promise<CoinPriceData> {
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      throw new Error('Invalid crypto ID provided');
    }

    try {
      const sanitizedId = encodeURIComponent(id.trim());
      const url = `/simple/price?ids=${sanitizedId}&vs_currencies=usd,ghs,eur`;
      const response = await this.axiosInstance.get<CoinPriceData>(url);

      if (!response.data || Object.keys(response.data).length === 0) {
        throw new Error(`No data found for crypto ID: ${id}`);
      }

      return response.data;
    } catch (error) {
      this.handleAxiosError(error, 'findOne', { id });
      throw error;
    }
  }

  async getAllCoins(
    page: number = 1,
    perPage: number = 10,
  ): Promise<GetAllCoinsResponse> {
    // Ensure perPage is within 1-250 bounds
    const limit = Math.min(Math.max(perPage, 1), 250);
    const validPage = Math.max(page, 1);
    const url = `/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=${validPage}&sparkline=false`;

    try {
      const response = await this.axiosInstance.get<CoinMarketData[]>(url);

      if (!Array.isArray(response.data)) {
        throw new Error('Invalid response format from CoinGecko API');
      }

      this.logger.debug(
        `Fetched ${response.data.length} coins (Page: ${validPage}, Limit: ${limit})`,
      );

      return {
        data: response.data,
        page: validPage,
        total: response.data.length,
      };
    } catch (error) {
      this.handleAxiosError(error, 'getAllCoins', { page, perPage });
      throw error;
    }
  }

  private handleAxiosError(
    error: unknown,
    method: string,
    context?: Record<string, unknown>,
  ): void {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

      if (axiosError.response) {
        // API responded with error status
        const status = axiosError.response.status;
        const statusText = axiosError.response.statusText;

        if (status === 429) {
          this.logger.warn(`Rate limit exceeded for ${method}`, context);
        } else if (status === 404) {
          this.logger.warn(`Resource not found for ${method}`, context);
        } else {
          this.logger.error(
            `API error in ${method}: ${status} ${statusText}`,
            context,
          );
        }
      } else if (axiosError.request) {
        // Request made but no response received
        this.logger.error(
          `No response received for ${method} (timeout or network error)`,
          context,
        );
      } else {
        // Error in request setup
        this.logger.error(
          `Request setup error in ${method}: ${axiosError.message}`,
          context,
        );
      }
    } else {
      this.logger.error(
        `Unexpected error in ${method}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        context,
      );
    }
  }

  // update(id: number, updateCryptoDto: UpdateCryptoDto) {
  //   return `This action updates a #${id} crypto`;
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} crypto`;
  // }
}
