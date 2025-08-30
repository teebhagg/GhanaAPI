// src/transport/dto/transport.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import {
  IsNumber,
  IsString,
  IsOptional,
  IsEnum,
  Min,
  Max,
} from 'class-validator';

export enum TransportModeDto {
  DRIVING = 'driving',
  WALKING = 'walking',
  CYCLING = 'cycling',
  PUBLIC_TRANSPORT = 'publicTransport',
}

export enum CityDto {
  ACCRA = 'accra',
  KUMASI = 'kumasi',
  TAMALE = 'tamale',
  TAKORADI = 'takoradi',
}

export class RouteCalculationDto {
  @ApiProperty({
    description: 'Starting latitude',
    minimum: 4.5,
    maximum: 11.5,
  })
  @IsNumber()
  @Min(4.5)
  @Max(11.5)
  start_lat: number;

  @ApiProperty({
    description: 'Starting longitude',
    minimum: -3.5,
    maximum: 1.5,
  })
  @IsNumber()
  @Min(-3.5)
  @Max(1.5)
  start_lng: number;

  @ApiProperty({ description: 'Ending latitude', minimum: 4.5, maximum: 11.5 })
  @IsNumber()
  @Min(4.5)
  @Max(11.5)
  end_lat: number;

  @ApiProperty({ description: 'Ending longitude', minimum: -3.5, maximum: 1.5 })
  @IsNumber()
  @Min(-3.5)
  @Max(1.5)
  end_lng: number;

  @ApiProperty({
    enum: TransportModeDto,
    required: false,
    default: TransportModeDto.DRIVING,
  })
  @IsEnum(TransportModeDto)
  @IsOptional()
  mode?: TransportModeDto;
}

export class TransportRoutesDto {
  @ApiProperty({ enum: CityDto, required: false, default: CityDto.ACCRA })
  @IsEnum(CityDto)
  @IsOptional()
  city?: CityDto;
}

export class TransportStopsDto {
  @ApiProperty({ enum: CityDto, required: false, default: CityDto.ACCRA })
  @IsEnum(CityDto)
  @IsOptional()
  city?: CityDto;

  @ApiProperty({ description: 'Filter by stop type', required: false })
  @IsString()
  @IsOptional()
  type?: string;
}

export class NearbyStopsDto {
  @ApiProperty({ description: 'Latitude', minimum: 4.5, maximum: 11.5 })
  @IsNumber()
  @Min(4.5)
  @Max(11.5)
  lat: number;

  @ApiProperty({ description: 'Longitude', minimum: -3.5, maximum: 1.5 })
  @IsNumber()
  @Min(-3.5)
  @Max(1.5)
  lng: number;

  @ApiProperty({
    description: 'Search radius in meters',
    required: false,
    default: 1000,
  })
  @IsNumber()
  @IsOptional()
  @Min(100)
  @Max(50000)
  radius?: number;

  @ApiProperty({ description: 'Filter by stop type', required: false })
  @IsString()
  @IsOptional()
  type?: string;
}

export class TravelCostDto {
  @ApiProperty({ description: 'Distance in kilometers', minimum: 0.1 })
  @IsNumber()
  @Min(0.1)
  distance: number;

  @ApiProperty({
    description: 'Transport mode',
    enum: ['car', 'taxi', 'trotro', 'bus'],
    required: false,
    default: 'car',
  })
  @IsString()
  @IsOptional()
  mode?: string;

  @ApiProperty({
    description: 'Fuel efficiency in km/l',
    required: false,
    default: 12,
  })
  @IsNumber()
  @IsOptional()
  @Min(5)
  @Max(30)
  fuel_efficiency?: number;
}

// Response DTOs
export class TransportRouteResponseDto {
  @ApiProperty()
  id?: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: ['bus', 'trotro', 'taxi', 'metro', 'ferry'] })
  type: string;

  @ApiProperty({
    type: [Number],
    description: 'Array of [lat, lng] coordinate pairs',
  })
  coordinates: [number, number][];

  @ApiProperty({ type: [Object], required: false })
  stops?: any[];

  @ApiProperty({ required: false })
  distance?: number;

  @ApiProperty({ required: false })
  duration?: number;
}

export class TransportStopResponseDto {
  @ApiProperty()
  id?: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ type: [Number], description: '[lat, lng]' })
  coordinates: [number, number];

  @ApiProperty()
  type: string;

  @ApiProperty({ type: [String], required: false })
  routes?: string[];
}

export class FuelPriceResponseDto {
  @ApiProperty()
  petrol: number;

  @ApiProperty()
  diesel: number;

  @ApiProperty({ required: false })
  lpg?: number;

  @ApiProperty()
  currency: string;

  @ApiProperty()
  lastUpdated: string;

  @ApiProperty()
  source: string;
}

export class RouteCalculationResponseDto {
  @ApiProperty()
  distance: number;

  @ApiProperty()
  duration: number;

  @ApiProperty({
    type: [Number],
    description: 'Array of [lat, lng] coordinate pairs',
  })
  coordinates: [number, number][];

  @ApiProperty({ type: [String], required: false })
  instructions?: string[];

  @ApiProperty({ required: false })
  cost?: number;
}

export class ApiResponseDto<T> {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  data: T;

  @ApiProperty({ required: false })
  count?: number;

  @ApiProperty({ required: false })
  message?: string;

  @ApiProperty({ required: false })
  error?: string;
}
