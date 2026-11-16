/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  HttpException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import type { Cache } from 'cache-manager';
import { LastGoodCache } from '../common/resilience/last-good-cache';
import { SECTORS } from './data/sectors.data';
import { StockSearchQueryDto } from './dto/stock-search-query.dto';
import {
  MarketSummaryDto,
  SectorPerformanceDto,
  StockSearchResponseDto,
} from './dto/stock-search-response.dto';
import { StockDto } from './dto/stock.dto';
import { RawStockData } from './interfaces/stock-data.interface';
import { GSEApiProvider } from './providers/gse-api.provider';

@Injectable()
export class StockMarketService {
  private readonly logger = new Logger(StockMarketService.name);
  private readonly STOCKS_KEY = 'all';
  private readonly MARKET_SUMMARY_CACHE_KEY = 'gse_market_summary';
  // Prices are fresh for 5 minutes. When the upstream fails, the last good
  // prices are served (flagged stale) for up to 24 hours, then a 503.
  private readonly stocksCache = new LastGoodCache<RawStockData[]>({
    label: 'Stock data',
    freshMs: 5 * 60 * 1000,
    maxStaleMs: 24 * 60 * 60 * 1000,
    backoffMs: 2 * 60 * 1000,
  });

  constructor(
    private readonly stockDataProvider: GSEApiProvider,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  /**
   * Search for stocks based on query parameters
   */
  async searchStocks(
    query: StockSearchQueryDto,
  ): Promise<StockSearchResponseDto> {
    try {
      this.logger.log(`Searching stocks with query: ${JSON.stringify(query)}`);

      let stocks = await this.getAllStocks();

      // Apply filters
      if (query.q) {
        const searchTerm = query.q.toLowerCase();
        stocks = stocks.filter(
          (stock) =>
            stock.symbol.toLowerCase().includes(searchTerm) ||
            stock.name.toLowerCase().includes(searchTerm),
        );
      }

      if (query.sector) {
        stocks = stocks.filter(
          (stock) => stock.sector.toLowerCase() === query.sector!.toLowerCase(),
        );
      }

      if (query.minPrice !== undefined) {
        stocks = stocks.filter((stock) => stock.price >= query.minPrice!);
      }

      if (query.maxPrice !== undefined) {
        stocks = stocks.filter((stock) => stock.price <= query.maxPrice!);
      }

      if (query.minMarketCap !== undefined) {
        stocks = stocks.filter(
          (stock) => stock.marketCap >= query.minMarketCap!,
        );
      }

      if (query.maxMarketCap !== undefined) {
        stocks = stocks.filter(
          (stock) => stock.marketCap <= query.maxMarketCap!,
        );
      }

      // Apply sorting
      if (query.sortBy) {
        stocks = this.sortStocks(
          stocks,
          query.sortBy,
          query.sortOrder || 'desc',
        );
      }

      // Apply limit
      const total = stocks.length;
      const limit = query.limit || 20;
      stocks = stocks.slice(0, limit);

      const response: StockSearchResponseDto = {
        data: stocks.map((stock) => this.toStockDto(stock)),
        meta: {
          total,
          page: 1,
          limit,
          searchQuery: query.q,
        },
        source: 'Ghana Stock Exchange API (https://dev.kwayisi.org/apis/gse)',
        timestamp: new Date().toISOString(),
      };

      this.logger.log(`Found ${stocks.length} stocks matching search criteria`);
      return response;
    } catch (error) {
      this.logger.error('Error searching stocks:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new Error(`Failed to search stocks: ${error.message}`);
    }
  }

  /**
   * Get a specific stock by symbol
   */
  async getStock(symbol: string): Promise<StockDto> {
    try {
      this.logger.log(`Getting stock data for symbol: ${symbol}`);

      // Look the symbol up in the cached list: one shared upstream fetch, no
      // extra per-symbol upstream calls, and the same last-good fallback.
      const stocks = await this.getAllStocks();
      const rawStock = stocks.find(
        (stock) => stock.symbol.toUpperCase() === symbol.toUpperCase(),
      );
      if (!rawStock) {
        throw new NotFoundException(
          `Stock symbol '${symbol}' not found on Ghana Stock Exchange`,
        );
      }
      return this.toStockDto(rawStock);
    } catch (error) {
      this.logger.error(`Error getting stock ${symbol}:`, error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new Error(
        `Failed to get stock data for ${symbol}: ${error.message}`,
      );
    }
  }

  /**
   * Get all stocks. Served from memory; refreshed from the upstream at most
   * once at a time. Throws 503 when there is no usable data.
   */
  async getAllStocks(): Promise<RawStockData[]> {
    const { data } = await this.stocksCache.get(this.STOCKS_KEY, () =>
      this.stockDataProvider.fetchAllStocks(),
    );
    return data;
  }

  /**
   * When the stock data was last fetched, and whether it is past its 5 minute
   * freshness. Stale data is still real data from the last successful fetch.
   */
  getFreshness(): { asOf: string | null; stale: boolean } {
    const entry = this.stocksCache.peek(this.STOCKS_KEY);
    return entry
      ? { asOf: entry.asOf.toISOString(), stale: entry.stale }
      : { asOf: null, stale: false };
  }

  /**
   * Get stocks by sector
   */
  async getStocksBySector(sector: string): Promise<StockDto[]> {
    try {
      this.logger.log(`Getting stocks for sector: ${sector}`);

      const stocks = await this.getAllStocks();
      const sectorStocks = stocks.filter(
        (stock) => stock.sector.toLowerCase() === sector.toLowerCase(),
      );

      return sectorStocks.map((stock) => this.toStockDto(stock));
    } catch (error) {
      this.logger.error(`Error getting stocks for sector ${sector}:`, error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new Error(
        `Failed to get stocks for sector ${sector}: ${error.message}`,
      );
    }
  }

  /**
   * Get market summary
   */
  async getMarketSummary(): Promise<MarketSummaryDto> {
    try {
      // Try cache first
      let summary = await this.cacheManager.get<MarketSummaryDto>(
        this.MARKET_SUMMARY_CACHE_KEY,
      );

      if (!summary) {
        this.logger.log('Generating market summary');

        const stocks = await this.getAllStocks();
        const indices = await this.stockDataProvider.fetchMarketIndices(stocks);
        const marketStatus = this.stockDataProvider.getMarketStatus();

        // Calculate market statistics
        const totalVolume = stocks.reduce(
          (sum, stock) => sum + stock.volume,
          0,
        );
        const totalMarketCap = stocks.reduce(
          (sum, stock) => sum + stock.marketCap,
          0,
        );

        const advancing = stocks.filter((stock) => stock.change > 0).length;
        const declining = stocks.filter((stock) => stock.change < 0).length;
        const unchanged = stocks.filter((stock) => stock.change === 0).length;

        summary = {
          indexValue: indices.gseComposite.value,
          indexChange: indices.gseComposite.change,
          indexChangePercent: indices.gseComposite.changePercent,
          totalVolume,
          totalMarketCap,
          advancing,
          declining,
          unchanged,
          marketStatus: marketStatus.isOpen ? 'OPEN' : 'CLOSED',
          lastUpdated: new Date().toISOString(),
          nextMarketOpen: marketStatus.nextOpen.toISOString(),
          marketClose: marketStatus.nextClose.toISOString(),
        };

        // Cache for 2 minutes
        await this.cacheManager.set(
          this.MARKET_SUMMARY_CACHE_KEY,
          summary,
          2 * 60 * 1000,
        );
      }

      return summary;
    } catch (error) {
      this.logger.error('Error getting market summary:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new Error(`Failed to get market summary: ${error.message}`);
    }
  }

  /**
   * Get sector performance
   */
  async getSectorPerformance(): Promise<SectorPerformanceDto[]> {
    try {
      this.logger.log('Calculating sector performance');

      const stocks = await this.getAllStocks();
      const sectorData: Record<string, RawStockData[]> = {};

      // Group stocks by sector
      stocks.forEach((stock) => {
        if (!sectorData[stock.sector]) {
          sectorData[stock.sector] = [];
        }
        sectorData[stock.sector].push(stock);
      });

      // Calculate performance for each sector
      const sectorPerformance: SectorPerformanceDto[] = [];

      for (const [sector, sectorStocks] of Object.entries(sectorData)) {
        const avgChangePercent =
          sectorStocks.reduce((sum, stock) => sum + stock.changePercent, 0) /
          sectorStocks.length;
        const marketCap = sectorStocks.reduce(
          (sum, stock) => sum + stock.marketCap,
          0,
        );
        const volume = sectorStocks.reduce(
          (sum, stock) => sum + stock.volume,
          0,
        );

        // Find top performer
        const topPerformer = sectorStocks.reduce((best, current) =>
          current.changePercent > best.changePercent ? current : best,
        );

        sectorPerformance.push({
          sector,
          stockCount: sectorStocks.length,
          avgChangePercent: Math.round(avgChangePercent * 100) / 100,
          marketCap: Math.round(marketCap),
          volume,
          topPerformer: this.toStockDto(topPerformer),
        });
      }

      // Sort by average change percent (best performing first)
      return sectorPerformance.sort(
        (a, b) => b.avgChangePercent - a.avgChangePercent,
      );
    } catch (error) {
      this.logger.error('Error calculating sector performance:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new Error(
        `Failed to calculate sector performance: ${error.message}`,
      );
    }
  }

  /**
   * Get list of available sectors
   */
  getSectors(): string[] {
    return SECTORS;
  }

  /**
   * Update stock data cache (runs every 5 minutes during market hours)
   */
  @Cron('0 */1 * * *') // Every 1 hour
  async updateStockDataCache() {
    try {
      const marketStatus = this.stockDataProvider.getMarketStatus();

      // Only update during market hours or extended hours
      if (marketStatus.isOpen) {
        this.logger.log('Updating stock data cache during market hours');

        // Refresh the stocks (shares an in-flight request, respects backoff,
        // and keeps serving the last good data if it fails)
        await this.stocksCache.refresh(this.STOCKS_KEY, () =>
          this.stockDataProvider.fetchAllStocks(),
        );
        await this.cacheManager.del(this.MARKET_SUMMARY_CACHE_KEY);
        await this.getMarketSummary();

        this.logger.log('Stock data cache updated successfully');
      }
    } catch (error) {
      this.logger.error('Error updating stock data cache:', error);
    }
  }

  /**
   * Convert raw stock data to DTO
   */
  private toStockDto(rawStock: RawStockData): StockDto {
    return {
      symbol: rawStock.symbol,
      name: rawStock.name,
      price: rawStock.price,
      change: rawStock.change,
      changePercent: rawStock.changePercent,
      previousClose: rawStock.previousClose,
      volume: rawStock.volume,
      marketCap: rawStock.marketCap,
      sector: rawStock.sector,
      dayHigh: rawStock.dayHigh,
      dayLow: rawStock.dayLow,
      weekHigh52: rawStock.weekHigh52,
      weekLow52: rawStock.weekLow52,
      peRatio: rawStock.peRatio,
      dividendYield: rawStock.dividendYield,
      lastTradingTime: rawStock.lastTradingTime,
      status: rawStock.status,
    };
  }

  /**
   * Sort stocks by specified field
   */
  private sortStocks(
    stocks: RawStockData[],
    sortBy: string,
    order: 'asc' | 'desc',
  ): RawStockData[] {
    return stocks.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'change':
          comparison = a.change - b.change;
          break;
        case 'changePercent':
          comparison = a.changePercent - b.changePercent;
          break;
        case 'volume':
          comparison = a.volume - b.volume;
          break;
        case 'marketCap':
          comparison = a.marketCap - b.marketCap;
          break;
        case 'symbol':
          comparison = a.symbol.localeCompare(b.symbol);
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        default:
          comparison = 0;
      }

      return order === 'desc' ? -comparison : comparison;
    });
  }
}
