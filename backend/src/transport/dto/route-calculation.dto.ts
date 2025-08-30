import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export enum TransportMode {
  DRIVING = 'driving',
  WALKING = 'walking',
  CYCLING = 'cycling',
  PUBLIC_TRANSPORT = 'publicTransport',
}

export class RouteCalculationDto {
  @ApiProperty({
    description: 'Total distance in meters',
    example: 15000,
  })
  @IsNumber()
  distance: number;

  @ApiProperty({
    description: 'Estimated duration in seconds',
    example: 1800,
  })
  @IsNumber()
  duration: number;

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
    description: 'Turn-by-turn instructions',
    example: ['Head north on Liberation Road', 'Turn right onto Ring Road'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  instructions?: string[];

  @ApiPropertyOptional({
    description: 'Estimated cost in GHS',
    example: 25.5,
  })
  @IsOptional()
  @IsNumber()
  cost?: number;
}

export class RouteQueryDto {
  @ApiProperty({
    description: 'Starting latitude',
    example: 5.6037,
  })
  @IsNumber()
  start_lat: number;

  @ApiProperty({
    description: 'Starting longitude',
    example: -0.187,
  })
  @IsNumber()
  start_lng: number;

  @ApiProperty({
    description: 'Ending latitude',
    example: 5.62,
  })
  @IsNumber()
  end_lat: number;

  @ApiProperty({
    description: 'Ending longitude',
    example: -0.17,
  })
  @IsNumber()
  end_lng: number;

  @ApiPropertyOptional({
    description: 'Transport mode',
    enum: TransportMode,
    example: TransportMode.DRIVING,
  })
  @IsOptional()
  @IsEnum(TransportMode)
  mode?: TransportMode;
}
