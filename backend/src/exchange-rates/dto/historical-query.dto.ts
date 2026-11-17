import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsIn, IsInt, IsISO8601, IsOptional, Max, Min } from 'class-validator';

export const SUPPORTED_CURRENCIES = [
  'USD',
  'EUR',
  'GBP',
  'NGN',
  'CHF',
  'JPY',
  'CNY',
];

export const HISTORICAL_GRANULARITIES = ['daily', 'raw'] as const;
export type HistoricalGranularity = (typeof HISTORICAL_GRANULARITIES)[number];

export const HISTORICAL_DEFAULT_LIMIT = 400;
export const HISTORICAL_MAX_LIMIT = 1000;

export class HistoricalQueryDto {
  @ApiProperty({ example: '2026-01-01' })
  @IsISO8601()
  from: string;

  @ApiProperty({ example: '2026-11-15' })
  @IsISO8601()
  to: string;

  @ApiProperty({ example: 'USD', enum: SUPPORTED_CURRENCIES })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toUpperCase() : value,
  )
  @IsIn(SUPPORTED_CURRENCIES)
  currency: string;

  @ApiPropertyOptional({
    enum: HISTORICAL_GRANULARITIES,
    default: 'daily',
    description:
      'daily returns the last snapshot of each day (up to 5 years); raw returns every stored snapshot (up to 366 days)',
  })
  @IsOptional()
  @IsIn(HISTORICAL_GRANULARITIES)
  granularity?: HistoricalGranularity;

  @ApiPropertyOptional({
    default: HISTORICAL_DEFAULT_LIMIT,
    maximum: HISTORICAL_MAX_LIMIT,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(HISTORICAL_MAX_LIMIT)
  limit?: number;
}
