import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class BankSearchQueryDto {
  @ApiProperty({
    description: 'Search query for bank name or type',
    required: false,
    example: 'GCB',
  })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiProperty({
    description: 'Latitude for location-based search',
    required: false,
    example: 5.6037,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lat?: number;

  @ApiProperty({
    description: 'Longitude for location-based search',
    required: false,
    example: -0.187,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lng?: number;

  @ApiProperty({
    description: 'Search radius in kilometers (default: 5km)',
    required: false,
    minimum: 0.1,
    maximum: 50,
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.1)
  @Max(50)
  radius?: number = 5;

  @ApiProperty({
    description: 'Type of banking facility',
    required: false,
    enum: ['bank', 'atm', 'both'],
    example: 'both',
  })
  @IsOptional()
  @IsString()
  @IsIn(['bank', 'atm', 'both'])
  type?: 'bank' | 'atm' | 'both' = 'both';

  @ApiProperty({
    description: 'Number of results to return (max 100)',
    required: false,
    minimum: 1,
    maximum: 100,
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
