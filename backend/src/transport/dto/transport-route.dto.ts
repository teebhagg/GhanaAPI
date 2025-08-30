import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export enum TransportType {
  BUS = 'bus',
  TROTRO = 'trotro',
  TAXI = 'taxi',
  METRO = 'metro',
  FERRY = 'ferry',
}

export class TransportStopDto {
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
  @IsArray()
  @IsNumber({}, { each: true })
  coordinates: [number, number];

  @ApiProperty({
    description: 'Stop type',
    example: 'bus_stop',
  })
  @IsString()
  type: string;

  @ApiPropertyOptional({
    description: 'Routes serving this stop',
    example: ['route_001', 'route_002'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  routes?: string[];
}

export class TransportRouteDto {
  @ApiPropertyOptional({
    description: 'Route ID',
    example: 'route_001',
  })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({
    description: 'Route name',
    example: 'Circle - Tema Station',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Transport type',
    enum: TransportType,
    example: TransportType.TROTRO,
  })
  @IsEnum(TransportType)
  type: TransportType;

  @ApiProperty({
    description: 'Route coordinates [latitude, longitude][]',
    example: [
      [5.6037, -0.187],
      [5.62, -0.17],
    ],
    type: [Number],
  })
  @IsArray()
  coordinates: [number, number][];

  @ApiPropertyOptional({
    description: 'Stops along the route',
    type: [TransportStopDto],
  })
  @IsOptional()
  @IsArray()
  stops?: TransportStopDto[];

  @ApiPropertyOptional({
    description: 'Total route distance in meters',
    example: 15000,
  })
  @IsOptional()
  @IsNumber()
  distance?: number;

  @ApiPropertyOptional({
    description: 'Estimated travel duration in seconds',
    example: 1800,
  })
  @IsOptional()
  @IsNumber()
  duration?: number;
}
