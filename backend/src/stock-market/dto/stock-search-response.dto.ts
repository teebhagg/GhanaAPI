import { ApiProperty } from '@nestjs/swagger';
import { StockDto } from './stock.dto';

export class StockSearchResponseDto {
  @ApiProperty({
    description: 'Array of stock data matching the search criteria',
    type: [StockDto],
  })
  data: StockDto[];

  @ApiProperty({
    description: 'Search metadata',
    type: 'object',
    properties: {
      total: {
        type: 'number',
        description: 'Total number of stocks found',
        example: 45,
      },
      page: {
        type: 'number',
        description: 'Current page number',
        example: 1,
      },
      limit: {
        type: 'number',
        description: 'Number of results per page',
        example: 20,
      },
      searchQuery: {
        type: 'string',
        description: 'Original search query',
        example: 'GCB',
      },
    },
  })
  meta: {
    total: number;
    page: number;
    limit: number;
    searchQuery?: string;
  };

  @ApiProperty({
    description: 'Data source information',
    example: 'Ghana Stock Exchange + Market Data Providers',
  })
  source: string;

  @ApiProperty({
    description: 'Response timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  timestamp: string;
}

export class MarketSummaryDto {
  @ApiProperty({
    description: 'Market index value',
    example: 3245.67,
  })
  indexValue: number;

  @ApiProperty({
    description: 'Index change from previous close',
    example: 15.43,
  })
  indexChange: number;

  @ApiProperty({
    description: 'Index percentage change',
    example: 0.48,
  })
  indexChangePercent: number;

  @ApiProperty({
    description: 'Total market volume',
    example: 2500000,
  })
  totalVolume: number;

  @ApiProperty({
    description: 'Total market capitalization in GHS',
    example: 75000000000,
  })
  totalMarketCap: number;

  @ApiProperty({
    description: 'Number of advancing stocks',
    example: 25,
  })
  advancing: number;

  @ApiProperty({
    description: 'Number of declining stocks',
    example: 15,
  })
  declining: number;

  @ApiProperty({
    description: 'Number of unchanged stocks',
    example: 5,
  })
  unchanged: number;

  @ApiProperty({
    description: 'Market status',
    example: 'CLOSED',
    enum: ['OPEN', 'CLOSED', 'PRE_MARKET', 'AFTER_HOURS'],
  })
  marketStatus: 'OPEN' | 'CLOSED' | 'PRE_MARKET' | 'AFTER_HOURS';

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-15T16:00:00Z',
  })
  lastUpdated: string;

  @ApiProperty({
    description: 'Next market open time',
    example: '2024-01-16T09:00:00Z',
    required: false,
  })
  nextMarketOpen?: string;

  @ApiProperty({
    description: 'Current/Last market close time',
    example: '2024-01-15T16:00:00Z',
    required: false,
  })
  marketClose?: string;
}

export class SectorPerformanceDto {
  @ApiProperty({
    description: 'Sector name',
    example: 'Banking',
  })
  sector: string;

  @ApiProperty({
    description: 'Number of stocks in sector',
    example: 8,
  })
  stockCount: number;

  @ApiProperty({
    description: 'Average sector price change percentage',
    example: 2.15,
  })
  avgChangePercent: number;

  @ApiProperty({
    description: 'Total sector market cap in GHS',
    example: 25000000000,
  })
  marketCap: number;

  @ApiProperty({
    description: 'Sector volume',
    example: 850000,
  })
  volume: number;

  @ApiProperty({
    description: 'Top performing stock in sector',
    type: StockDto,
  })
  topPerformer: StockDto;
}
