import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class FuelPriceDto {
  @ApiProperty({
    description: 'Petrol price per litre in GHS',
    example: 15.2,
  })
  @IsNumber()
  petrol: number;

  @ApiProperty({
    description: 'Diesel price per litre in GHS',
    example: 15.99,
  })
  @IsNumber()
  diesel: number;

  @ApiPropertyOptional({
    description: 'LPG price per litre in GHS',
    example: 8.5,
  })
  @IsOptional()
  @IsNumber()
  lpg?: number;

  @ApiProperty({
    description: 'Currency code',
    example: 'GHS',
  })
  @IsString()
  currency: string;

  @ApiProperty({
    description: 'Last updated timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  @IsString()
  lastUpdated: string;

  @ApiProperty({
    description: 'Data source',
    example: 'NPA Ghana',
  })
  @IsString()
  source: string;
}

export class TravelCostDto {
  @ApiProperty({
    description: 'Distance in kilometers',
    example: 15.5,
  })
  @IsNumber()
  distance: number;

  @ApiProperty({
    description: 'Transport mode',
    example: 'car',
  })
  @IsString()
  mode: string;

  @ApiPropertyOptional({
    description: 'Fuel cost for car travel',
    example: 19.38,
  })
  @IsOptional()
  @IsNumber()
  fuelCost?: number;

  @ApiPropertyOptional({
    description: 'Estimated fare for public transport',
    example: 25.5,
  })
  @IsOptional()
  @IsNumber()
  estimatedFare?: number;

  @ApiProperty({
    description: 'Currency',
    example: 'GHS',
  })
  @IsString()
  currency: string;

  @ApiProperty({
    description: 'Cost breakdown details',
    example: {
      fuelNeeded: '1.29L',
      fuelPrice: '15.20 GHS/L',
      fuelEfficiency: '12 km/L',
    },
  })
  breakdown: Record<string, string | number>;
}
