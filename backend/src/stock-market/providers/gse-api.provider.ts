import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { firstValueFrom, timeout } from 'rxjs';
import {
  MarketIndices,
  MarketStatus,
  RawStockData,
} from '../interfaces/stock-data.interface';

export interface GSELiveData {
  name: string;
  price: number;
  change: number;
  volume: number;
}

export interface GSEEquityData {
  capital: number;
  company: {
    address: string;
    directors: Array<{
      name: string;
      position: string | null;
    }>;
    email: string;
    facsimile: string | null;
    industry: string;
    name: string;
    sector: string;
    telephone: string;
    website: string;
  };
  dps: number | null;
  eps: number | null;
  name: string;
  price: number;
  shares: number;
}

@Injectable()
export class GSEApiProvider {
  private readonly logger = new Logger(GSEApiProvider.name);
  private readonly baseUrl = 'https://dev.kwayisi.org/apis/gse';
  private readonly requestTimeout = 10000; // 10 seconds
  private readonly maxRetries = 3;

  constructor(private readonly httpService: HttpService) {}

  /**
   * Fetch all stocks from GSE API
   */
  async fetchAllStocks(): Promise<RawStockData[]> {
    try {
      this.logger.log('Fetching all stocks from GSE API');

      // Get live data for all stocks
      const liveData = await this.fetchLiveData();

      // Get detailed data for a subset of stocks to optimize performance
      const detailedStocks = await this.fetchDetailedStocks(
        liveData.slice(0, 20),
      ); // First 20 stocks

      // Combine live data with detailed data where available
      const stocks: RawStockData[] = liveData.map((live) => {
        const detailed = detailedStocks.find((d) => d?.name === live.name);

        return this.mapToRawStockData(live, detailed);
      });

      this.logger.log(
        `Successfully fetched ${stocks.length} stocks from GSE API`,
      );
      return stocks;
    } catch (error) {
      this.logger.error('Error fetching all stocks from GSE API:', error);
      throw new HttpException(
        `Failed to fetch stock data from GSE API: ${error.message}`,
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Fetch a specific stock by symbol
   */
  async fetchStock(symbol: string): Promise<RawStockData> {
    try {
      this.logger.log(`Fetching stock ${symbol} from GSE API`);

      // Try to get detailed equity data first
      let equityData: GSEEquityData | null = null;
      try {
        equityData = await this.makeRequest<GSEEquityData>(
          `/equities/${symbol.toUpperCase()}`,
        );
      } catch (error) {
        this.logger.warn(
          `Failed to get detailed data for ${symbol}, falling back to live data`,
        );
      }

      // Get live data
      const liveData = await this.makeRequest<GSELiveData>(
        `/live/${symbol.toUpperCase()}`,
      );

      const stock = this.mapToRawStockData(liveData, equityData);

      this.logger.log(`Successfully fetched stock ${symbol} from GSE API`);
      return stock;
    } catch (error) {
      this.logger.error(`Error fetching stock ${symbol} from GSE API:`, error);
      throw new HttpException(
        `Failed to fetch stock ${symbol} from GSE API: ${error.message}`,
        HttpStatus.NOT_FOUND,
      );
    }
  }

  /**
   * Get market indices (simulated from available data)
   */
  async fetchMarketIndices(): Promise<MarketIndices> {
    try {
      // Since GSE API doesn't provide indices, we'll calculate from live data
      const liveData = await this.fetchLiveData();

      const totalChange = liveData.reduce(
        (sum, stock) => sum + stock.change,
        0,
      );
      const avgChange = totalChange / liveData.length;
      const avgChangePercent =
        (avgChange / liveData.reduce((sum, stock) => sum + stock.price, 0)) *
        liveData.length *
        100;

      return {
        gseComposite: {
          value: 2500.0 + avgChange * 10, // Simulated base value
          change: avgChange,
          changePercent: Math.round(avgChangePercent * 100) / 100,
          lastUpdated: new Date().toISOString(),
        },
        gseAllShare: {
          value: 2450.0 + avgChange * 9.5, // Simulated
          change: avgChange * 0.95,
          changePercent: Math.round(avgChangePercent * 0.95 * 100) / 100,
          lastUpdated: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.logger.error('Error calculating market indices:', error);
      // Return default values if API fails
      return {
        gseComposite: {
          value: 2500.0,
          change: 0,
          changePercent: 0,
          lastUpdated: new Date().toISOString(),
        },
        gseAllShare: {
          value: 2450.0,
          change: 0,
          changePercent: 0,
          lastUpdated: new Date().toISOString(),
        },
      };
    }
  }

  /**
   * Get market status (Ghana Stock Exchange hours: 10:00 AM - 3:00 PM GMT)
   */
  getMarketStatus(): MarketStatus {
    const now = new Date();
    const ghanaTime = new Date(
      now.toLocaleString('en-US', { timeZone: 'Africa/Accra' }),
    );

    const currentDay = ghanaTime.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const currentHour = ghanaTime.getHours();
    const currentMinute = ghanaTime.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;

    // Market hours: Monday to Friday, 10:00 AM to 3:00 PM
    const marketOpenTime = 10 * 60; // 10:00 AM in minutes
    const marketCloseTime = 15 * 60; // 3:00 PM in minutes

    const isWeekday = currentDay >= 1 && currentDay <= 5; // Monday to Friday
    const isDuringMarketHours =
      currentTimeInMinutes >= marketOpenTime &&
      currentTimeInMinutes < marketCloseTime;

    const isOpen = isWeekday && isDuringMarketHours;

    // Calculate next market open/close
    let nextOpen = new Date(ghanaTime);
    let nextClose = new Date(ghanaTime);

    if (isOpen) {
      // Market is open, next close is today at 3:00 PM
      nextClose.setHours(15, 0, 0, 0);
    } else {
      // Market is closed, find next open
      if (isWeekday && currentTimeInMinutes < marketOpenTime) {
        // Today before market opens
        nextOpen.setHours(10, 0, 0, 0);
        nextClose.setHours(15, 0, 0, 0);
      } else {
        // After market hours or weekend
        const daysUntilMonday = currentDay === 0 ? 1 : currentDay === 6 ? 2 : 1;
        nextOpen.setDate(nextOpen.getDate() + daysUntilMonday);
        nextOpen.setHours(10, 0, 0, 0);
        nextClose.setDate(nextClose.getDate() + daysUntilMonday);
        nextClose.setHours(15, 0, 0, 0);
      }
    }

    return {
      isOpen,
      nextOpen,
      nextClose,
      timezone: 'Africa/Accra',
      lastUpdated: new Date(),
    };
  }

  /**
   * Fetch live data for all stocks
   */
  private async fetchLiveData(): Promise<GSELiveData[]> {
    return await this.makeRequest<GSELiveData[]>('/live');
  }

  /**
   * Fetch detailed equity data for multiple stocks
   */
  private async fetchDetailedStocks(
    liveStocks: GSELiveData[],
  ): Promise<Array<GSEEquityData | null>> {
    const promises = liveStocks.map(async (stock) => {
      try {
        return await this.makeRequest<GSEEquityData>(`/equities/${stock.name}`);
      } catch (error) {
        this.logger.warn(
          `Failed to get detailed data for ${stock.name}: ${error.message}`,
        );
        return null;
      }
    });

    return await Promise.allSettled(promises).then((results) =>
      results.map((result) =>
        result.status === 'fulfilled' ? result.value : null,
      ),
    );
  }

  /**
   * Make HTTP request with retry logic and timeout
   */
  private async makeRequest<T>(endpoint: string, retryCount = 0): Promise<T> {
    try {
      const url = `${this.baseUrl}${endpoint}`;

      const response = await firstValueFrom(
        this.httpService.get<T>(url).pipe(timeout(this.requestTimeout)),
      );

      return response.data;
    } catch (error) {
      if (retryCount < this.maxRetries && this.isRetryableError(error)) {
        this.logger.warn(
          `Request failed, retrying (${retryCount + 1}/${this.maxRetries}): ${error.message}`,
        );
        await this.delay(1000 * (retryCount + 1)); // Exponential backoff
        return this.makeRequest<T>(endpoint, retryCount + 1);
      }

      throw error;
    }
  }

  /**
   * Check if an error is retryable
   */
  private isRetryableError(error: any): boolean {
    const retryableCodes = [408, 429, 500, 502, 503, 504];
    return (
      retryableCodes.includes(error?.response?.status) ||
      error.code === 'ETIMEDOUT'
    );
  }

  /**
   * Delay utility for retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Map GSE API data to our internal format
   */
  private mapToRawStockData(
    liveData: GSELiveData,
    equityData?: GSEEquityData | null,
  ): RawStockData {
    const price = liveData.price;
    const change = liveData.change;
    const changePercent = price > 0 ? (change / (price - change)) * 100 : 0;

    // Calculate estimates for missing data
    const volume = liveData.volume;
    const marketCap =
      equityData?.capital || (equityData?.shares || 1000000) * price;
    const previousClose = price - change;

    // Estimate day high/low based on current price and change
    const volatility = Math.abs(changePercent) * 0.02; // 2% of change percentage as volatility
    const dayHigh = price + (price * volatility) / 100;
    const dayLow = price - (price * volatility) / 100;

    // Estimate 52-week range
    const yearlyVolatility = 20; // 20% yearly volatility estimate
    const weekHigh52 = price * (1 + yearlyVolatility / 100);
    const weekLow52 = price * (1 - yearlyVolatility / 100);

    // Calculate PE ratio and dividend yield from available data
    const eps = equityData?.eps || null;
    const dps = equityData?.dps || null;
    const peRatio = eps && eps > 0 ? price / eps : null;
    const dividendYield = dps && price > 0 ? (dps / price) * 100 : null;

    return {
      symbol: liveData.name,
      name: equityData?.company?.name || liveData.name,
      price: Math.round(price * 100) / 100,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
      previousClose: Math.round(previousClose * 100) / 100,
      volume,
      marketCap: Math.round(marketCap),
      sector: equityData?.company?.sector || 'Unknown',
      dayHigh: Math.round(dayHigh * 100) / 100,
      dayLow: Math.round(dayLow * 100) / 100,
      weekHigh52: Math.round(weekHigh52 * 100) / 100,
      weekLow52: Math.round(weekLow52 * 100) / 100,
      peRatio: peRatio ? Math.round(peRatio * 100) / 100 : undefined,
      dividendYield: dividendYield
        ? Math.round(dividendYield * 100) / 100
        : undefined,
      lastTradingTime: new Date().toISOString(),
      status: volume > 0 ? 'OPEN' : 'CLOSED',
      // Additional company data
      companyInfo: equityData?.company
        ? {
            address: equityData.company.address,
            email: equityData.company.email,
            phone: equityData.company.telephone,
            website: equityData.company.website,
            industry: equityData.company.industry,
            sharesOutstanding: equityData.shares,
            earningsPerShare: equityData.eps,
            dividendPerShare: equityData.dps,
          }
        : undefined,
    };
  }
}
