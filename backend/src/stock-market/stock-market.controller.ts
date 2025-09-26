import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  Param,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { StockSearchQueryDto } from './dto/stock-search-query.dto';
import {
  MarketSummaryDto,
  SectorPerformanceDto,
  StockSearchResponseDto,
} from './dto/stock-search-response.dto';
import { StockDto } from './dto/stock.dto';
import { StockMarketService } from './stock-market.service';

@ApiTags('Stock Market Data')
@Controller('stock-market')
export class StockMarketController {
  private readonly logger = new Logger(StockMarketController.name);

  constructor(private readonly stockMarketService: StockMarketService) {}

  @Get('search')
  @ApiOperation({
    summary: 'Search for stocks on Ghana Stock Exchange',
    description:
      'Search for stocks by symbol, company name, sector, price range, or market cap. Supports filtering and sorting.',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved stock data',
    type: StockSearchResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid query parameters',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async searchStocks(
    @Query() query: StockSearchQueryDto,
  ): Promise<StockSearchResponseDto> {
    try {
      return await this.stockMarketService.searchStocks(query);
    } catch (error) {
      this.logger.error('Error searching stocks:', error);
      throw new HttpException(
        'Failed to search stocks',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('stock/:symbol')
  @ApiOperation({
    summary: 'Get specific stock data by symbol',
    description:
      'Retrieve detailed information for a specific stock using its symbol/ticker.',
  })
  @ApiParam({
    name: 'symbol',
    description: 'Stock symbol (e.g., "GCB", "MTNGH", "GOIL")',
    example: 'GCB',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved stock data',
    type: StockDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Stock symbol not found',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async getStock(@Param('symbol') symbol: string): Promise<StockDto> {
    try {
      return await this.stockMarketService.getStock(symbol);
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new HttpException(
          `Stock symbol '${symbol}' not found on Ghana Stock Exchange`,
          HttpStatus.NOT_FOUND,
        );
      }
      this.logger.error(`Error getting stock ${symbol}:`, error);
      throw new HttpException(
        `Failed to retrieve stock data for ${symbol}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('all')
  @ApiOperation({
    summary: 'Get all stocks on Ghana Stock Exchange',
    description: 'Retrieve current data for all listed stocks on GSE.',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved all stock data',
    type: [StockDto],
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async getAllStocks(): Promise<StockDto[]> {
    try {
      const rawStocks = await this.stockMarketService.getAllStocks();
      return rawStocks.map((stock) => ({
        symbol: stock.symbol,
        name: stock.name,
        price: stock.price,
        change: stock.change,
        changePercent: stock.changePercent,
        previousClose: stock.previousClose,
        volume: stock.volume,
        marketCap: stock.marketCap,
        sector: stock.sector,
        dayHigh: stock.dayHigh,
        dayLow: stock.dayLow,
        weekHigh52: stock.weekHigh52,
        weekLow52: stock.weekLow52,
        peRatio: stock.peRatio,
        dividendYield: stock.dividendYield,
        lastTradingTime: stock.lastTradingTime,
        status: stock.status,
      }));
    } catch (error) {
      this.logger.error('Error getting all stocks:', error);
      throw new HttpException(
        'Failed to retrieve stock data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('sector/:sector')
  @ApiOperation({
    summary: 'Get stocks by sector',
    description:
      'Retrieve all stocks in a specific sector (e.g., Banking, Mining, Telecommunications).',
  })
  @ApiParam({
    name: 'sector',
    description:
      'Sector name (e.g., "Banking", "Mining", "Telecommunications")',
    example: 'Banking',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved stocks for the sector',
    type: [StockDto],
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async getStocksBySector(
    @Param('sector') sector: string,
  ): Promise<StockDto[]> {
    try {
      return await this.stockMarketService.getStocksBySector(sector);
    } catch (error) {
      this.logger.error(`Error getting stocks for sector ${sector}:`, error);
      throw new HttpException(
        `Failed to retrieve stocks for sector: ${sector}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('market-summary')
  @ApiOperation({
    summary: 'Get Ghana Stock Exchange market summary',
    description:
      'Retrieve current market overview including indices, volume, market cap, and trading statistics.',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved market summary',
    type: MarketSummaryDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async getMarketSummary(): Promise<MarketSummaryDto> {
    try {
      return await this.stockMarketService.getMarketSummary();
    } catch (error) {
      this.logger.error('Error getting market summary:', error);
      throw new HttpException(
        'Failed to retrieve market summary',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('sector-performance')
  @ApiOperation({
    summary: 'Get sector performance analysis',
    description:
      'Retrieve performance metrics for all sectors including top performers and market cap breakdown.',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved sector performance data',
    type: [SectorPerformanceDto],
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async getSectorPerformance(): Promise<SectorPerformanceDto[]> {
    try {
      return await this.stockMarketService.getSectorPerformance();
    } catch (error) {
      this.logger.error('Error getting sector performance:', error);
      throw new HttpException(
        'Failed to retrieve sector performance data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('sectors')
  @ApiOperation({
    summary: 'Get list of available sectors',
    description:
      'Retrieve all available stock sectors on Ghana Stock Exchange.',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved sector list',
    schema: {
      type: 'array',
      items: {
        type: 'string',
      },
      example: [
        'Banking',
        'Insurance',
        'Mining',
        'Telecommunications',
        'Manufacturing',
      ],
    },
  })
  getSectors(): string[] {
    return this.stockMarketService.getSectors();
  }
}
