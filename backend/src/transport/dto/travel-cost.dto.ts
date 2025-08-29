import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsObject, IsOptional, IsString } from 'class-validator';

export class TravelCostQueryDto {
  @ApiProperty({
    description: 'Distance in kilometers',
    example: 15.5,
  })
  @IsNumber()
  distance: number;

  @ApiPropertyOptional({
    description: 'Transport mode',
    example: 'car',
    enum: ['car', 'taxi', 'trotro', 'bus'],
  })
  @IsOptional()
  @IsString()
  mode?: string;

  @ApiPropertyOptional({
    description: 'Fuel efficiency in km/l for car mode',
    example: 12,
  })
  @IsOptional()
  @IsNumber()
  fuel_efficiency?: number;
}

export class TravelCostDataDto {
  @ApiProperty({
    description: 'Distance in kilometers',
    example: 15.5,
  })
  @IsNumber()
  distance: number;

  @ApiProperty({
    description: 'Transport mode used for calculation',
    example: 'car',
  })
  @IsString()
  mode: string;

  @ApiPropertyOptional({
    description: 'Fuel cost for car travel (only for car mode)',
    example: 19.38,
  })
  @IsOptional()
  @IsNumber()
  fuelCost?: number;

  @ApiPropertyOptional({
    description: 'Estimated fare for public transport (not for car mode)',
    example: 25.5,
  })
  @IsOptional()
  @IsNumber()
  estimatedFare?: number;

  @ApiProperty({
    description: 'Currency of the cost',
    example: 'GHS',
  })
  @IsString()
  currency: string;

  @ApiProperty({
    description: 'Detailed cost breakdown',
    example: {
      fuelNeeded: '1.29L',
      fuelPrice: '15.20 GHS/L',
      fuelEfficiency: '12 km/L',
    },
  })
  @IsObject()
  breakdown: Record<string, string | number>;
}

export class TravelCostResponseDto {
  @ApiProperty({
    description: 'Request success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Travel cost calculation data',
    type: TravelCostDataDto,
  })
  data: TravelCostDataDto;
}
