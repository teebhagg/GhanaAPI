import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class StockDto {
  @ApiProperty({
    description: 'Stock symbol/ticker code',
    example: 'GCB',
  })
  @IsString()
  symbol: string;

  @ApiProperty({
    description: 'Company name',
    example: 'GCB Bank Limited',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Current stock price in GHS',
    example: 4.5,
  })
  @IsNumber()
  price: number;

  @ApiProperty({
    description: 'Change from previous close in GHS',
    example: 0.15,
  })
  @IsNumber()
  change: number;

  @ApiProperty({
    description: 'Percentage change from previous close',
    example: 3.45,
  })
  @IsNumber()
  changePercent: number;

  @ApiProperty({
    description: 'Previous closing price in GHS',
    example: 4.35,
  })
  @IsNumber()
  previousClose: number;

  @ApiProperty({
    description: 'Trading volume',
    example: 125000,
  })
  @IsNumber()
  volume: number;

  @ApiProperty({
    description: 'Market capitalization in GHS',
    example: 2500000000,
  })
  @IsNumber()
  marketCap: number;

  @ApiProperty({
    description: 'Sector classification',
    example: 'Banking',
  })
  @IsString()
  sector: string;

  @ApiProperty({
    description: "Day's high price",
    example: 4.65,
  })
  @IsNumber()
  dayHigh: number;

  @ApiProperty({
    description: "Day's low price",
    example: 4.4,
  })
  @IsNumber()
  dayLow: number;

  @ApiProperty({
    description: '52-week high price',
    example: 5.2,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  weekHigh52?: number;

  @ApiProperty({
    description: '52-week low price',
    example: 3.8,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  weekLow52?: number;

  @ApiProperty({
    description: 'Price-to-earnings ratio',
    example: 8.5,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  peRatio?: number;

  @ApiProperty({
    description: 'Dividend yield percentage',
    example: 12.5,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  dividendYield?: number;

  @ApiProperty({
    description: 'Last trading timestamp',
    example: '2024-01-15T16:00:00Z',
  })
  @IsString()
  lastTradingTime: string;

  @ApiProperty({
    description: 'Trading status',
    example: 'CLOSED',
    enum: ['OPEN', 'CLOSED', 'SUSPENDED', 'HALTED'],
  })
  @IsString()
  status: 'OPEN' | 'CLOSED' | 'SUSPENDED' | 'HALTED';
}
