import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { blankIsInvalid } from '../../common/validation/blank-is-invalid';

const FINITE = { allowNaN: false, allowInfinity: false };

export class NearbyStopsQueryDto {
  @ApiProperty({
    description: 'Latitude in degrees, from -90 to 90 (and inside Ghana)',
    example: 5.6037,
    minimum: -90,
    maximum: 90,
  })
  @Type(() => Number)
  @Transform(blankIsInvalid)
  @IsNumber(FINITE)
  @Min(-90)
  @Max(90)
  lat: number;

  @ApiProperty({
    description: 'Longitude in degrees, from -180 to 180 (and inside Ghana)',
    example: -0.187,
    minimum: -180,
    maximum: 180,
  })
  @Type(() => Number)
  @Transform(blankIsInvalid)
  @IsNumber(FINITE)
  @Min(-180)
  @Max(180)
  lng: number;

  @ApiPropertyOptional({
    description: 'Search radius in meters, greater than 0 (default: 1000)',
    example: 1000,
    default: 1000,
  })
  @IsOptional()
  @Type(() => Number)
  @Transform(blankIsInvalid)
  @IsNumber(FINITE)
  @IsPositive()
  radius?: number = 1000;

  @ApiPropertyOptional({
    description: 'Filter by stop type',
    example: 'bus_stop',
  })
  @IsOptional()
  @IsString()
  type?: string;
}

export class NearbyStopDto {
  @ApiPropertyOptional({
    description: 'Stop ID',
    example: 'stop_001',
  })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({
    description: 'Stop name',
    example: 'Kwame Nkrumah Circle',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Stop coordinates [latitude, longitude]',
    example: [5.6037, -0.187],
    type: [Number],
  })
  coordinates: [number, number];

  @ApiProperty({
    description: 'Stop type',
    example: 'bus_stop',
  })
  @IsString()
  type: string;

  @ApiProperty({
    description: 'Distance from search point in meters',
    example: 250,
  })
  @IsNumber()
  distance: number;

  @ApiPropertyOptional({
    description: 'Routes serving this stop',
    example: ['route_001', 'route_002'],
    type: [String],
  })
  @IsOptional()
  routes?: string[];
}
