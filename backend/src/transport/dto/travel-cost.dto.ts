import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsNumber,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';
import { blankIsInvalid } from '../../common/validation/blank-is-invalid';

export const TRAVEL_COST_MODES = ['car', 'taxi', 'trotro', 'bus'];

export class TravelCostQueryDto {
  @ApiProperty({
    description: 'Distance in kilometers, 0 or more',
    example: 15.5,
    minimum: 0,
  })
  @Type(() => Number)
  @Transform(blankIsInvalid)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  distance: number;

  @ApiPropertyOptional({
    description: 'Transport mode (not case sensitive)',
    example: 'car',
    enum: TRAVEL_COST_MODES,
    default: 'car',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsIn(TRAVEL_COST_MODES)
  mode?: string = 'car';

  @ApiPropertyOptional({
    description: 'Fuel efficiency in km/l for car mode, greater than 0',
    example: 12,
    default: 12,
  })
  @IsOptional()
  @Type(() => Number)
  @Transform(blankIsInvalid)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @IsPositive()
  fuel_efficiency?: number = 12;
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
