import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export const STOCK_SORT_FIELDS = [
  'price',
  'change',
  'changePercent',
  'volume',
  'marketCap',
  'symbol',
  'name',
] as const;
export const STOCK_SORT_ORDERS = ['asc', 'desc'] as const;

export class StockSearchQueryDto {
  @ApiProperty({
    description: 'Stock symbol or company name to search for',
    example: 'GCB',
    required: false,
  })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiProperty({
    description: 'Stock sector filter',
    example: 'Banking',
    required: false,
    enum: [
      'Banking',
      'Insurance',
      'Manufacturing',
      'Mining',
      'Oil & Gas',
      'Telecommunications',
      'Agriculture',
      'Real Estate',
      'Technology',
      'Utilities',
      'Consumer Goods',
      'Healthcare',
    ],
  })
  @IsOptional()
  @IsString()
  sector?: string;

  @ApiProperty({
    description: 'Minimum stock price in GHS',
    example: 1.0,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiProperty({
    description: 'Maximum stock price in GHS',
    example: 50.0,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiProperty({
    description: 'Minimum market cap in GHS',
    example: 1000000,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @Min(0)
  minMarketCap?: number;

  @ApiProperty({
    description: 'Maximum market cap in GHS',
    example: 10000000000,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @Min(0)
  maxMarketCap?: number;

  @ApiProperty({
    description: 'Sort stocks by field',
    example: 'marketCap',
    required: false,
    enum: STOCK_SORT_FIELDS,
  })
  @IsOptional()
  @IsIn(STOCK_SORT_FIELDS)
  sortBy?:
    | 'price'
    | 'change'
    | 'changePercent'
    | 'volume'
    | 'marketCap'
    | 'symbol'
    | 'name';

  @ApiProperty({
    description: 'Sort order',
    example: 'desc',
    required: false,
    enum: STOCK_SORT_ORDERS,
  })
  @IsOptional()
  @IsIn(STOCK_SORT_ORDERS)
  sortOrder?: 'asc' | 'desc';

  @ApiProperty({
    description: 'Maximum number of results to return',
    example: 20,
    minimum: 1,
    maximum: 100,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
