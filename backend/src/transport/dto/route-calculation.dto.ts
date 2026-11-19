import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { blankIsInvalid } from '../../common/validation/blank-is-invalid';

export enum TransportMode {
  DRIVING = 'driving',
  WALKING = 'walking',
  CYCLING = 'cycling',
  PUBLIC_TRANSPORT = 'publicTransport',
}

const coordinate = (description: string, example: number, limit: number) =>
  ApiProperty({ description, example, minimum: -limit, maximum: limit });

/** Query of `GET /transport/route-calculation` */
export class RouteCalculationQueryDto {
  @coordinate(
    'Starting latitude, from -90 to 90 (and inside Ghana)',
    5.6037,
    90,
  )
  @Type(() => Number)
  @Transform(blankIsInvalid)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(-90)
  @Max(90)
  start_lat: number;

  @coordinate(
    'Starting longitude, from -180 to 180 (and inside Ghana)',
    -0.187,
    180,
  )
  @Type(() => Number)
  @Transform(blankIsInvalid)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(-180)
  @Max(180)
  start_lng: number;

  @coordinate('Ending latitude, from -90 to 90 (and inside Ghana)', 6.6885, 90)
  @Type(() => Number)
  @Transform(blankIsInvalid)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(-90)
  @Max(90)
  end_lat: number;

  @coordinate(
    'Ending longitude, from -180 to 180 (and inside Ghana)',
    -1.6244,
    180,
  )
  @Type(() => Number)
  @Transform(blankIsInvalid)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(-180)
  @Max(180)
  end_lng: number;

  @ApiPropertyOptional({
    description: 'Transport mode (default: driving)',
    enum: TransportMode,
    default: TransportMode.DRIVING,
  })
  @IsOptional()
  @IsEnum(TransportMode)
  mode?: TransportMode = TransportMode.DRIVING;
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
