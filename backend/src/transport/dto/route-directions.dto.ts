import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';

export enum RouteProfile {
  DRIVING_CAR = 'driving-car',
  DRIVING_HGV = 'driving-hgv',
  CYCLING_REGULAR = 'cycling-regular',
  FOOT_WALKING = 'foot-walking',
  WHEELCHAIR = 'wheelchair',
}

export class RouteDirectionsQueryDto {
  @ApiPropertyOptional({
    description:
      'Starting point latitude (required if start_name not provided)',
    example: 5.6037,
  })
  @ValidateIf((o: RouteDirectionsQueryDto) => !o.start_name)
  @IsLatitude()
  start_lat?: number;

  @ApiPropertyOptional({
    description:
      'Starting point longitude (required if start_name not provided)',
    example: -0.187,
  })
  @ValidateIf((o: RouteDirectionsQueryDto) => !o.start_name)
  @IsLongitude()
  start_lng?: number;

  @ApiPropertyOptional({
    description: 'Starting place name (required if coordinates not provided)',
    example: 'Kwame Nkrumah Circle, Accra',
  })
  @ValidateIf((o: RouteDirectionsQueryDto) => !o.start_lat && !o.start_lng)
  @IsString()
  start_name?: string;

  @ApiPropertyOptional({
    description: 'Destination latitude (required if end_name not provided)',
    example: 6.6885,
  })
  @ValidateIf((o: RouteDirectionsQueryDto) => !o.end_name)
  @IsLatitude()
  end_lat?: number;

  @ApiPropertyOptional({
    description: 'Destination longitude (required if end_name not provided)',
    example: -1.6244,
  })
  @ValidateIf((o: RouteDirectionsQueryDto) => !o.end_name)
  @IsLongitude()
  end_lng?: number;

  @ApiPropertyOptional({
    description:
      'Destination place name (required if coordinates not provided)',
    example: 'Kumasi Central Market',
  })
  @ValidateIf((o: RouteDirectionsQueryDto) => !o.end_lat && !o.end_lng)
  @IsString()
  end_name?: string;

  @ApiPropertyOptional({
    description: 'Route profile/transport mode',
    enum: RouteProfile,
    example: RouteProfile.DRIVING_CAR,
  })
  @IsOptional()
  @IsEnum(RouteProfile)
  profile?: RouteProfile;

  @ApiPropertyOptional({
    description: 'Include turn-by-turn instructions',
    example: true,
  })
  @IsOptional()
  instructions?: boolean;

  @ApiPropertyOptional({
    description: 'Include route geometry',
    example: true,
  })
  @IsOptional()
  geometry?: boolean;
}

export class RouteStep {
  @ApiProperty({
    description: 'Step instruction',
    example: 'Head north on Liberation Road',
  })
  instruction: string;

  @ApiProperty({
    description: 'Distance for this step in meters',
    example: 250,
  })
  distance: number;

  @ApiProperty({
    description: 'Duration for this step in seconds',
    example: 30,
  })
  duration: number;

  @ApiPropertyOptional({
    description: 'Step coordinates [lat, lng]',
    example: [5.6037, -0.187],
  })
  @IsOptional()
  coordinates?: [number, number];

  @ApiPropertyOptional({
    description: 'Maneuver type',
    example: 'turn-right',
  })
  @IsOptional()
  maneuver?: string;
}

export class RouteDirectionsResponseDto {
  @ApiProperty({
    description: 'Total distance in meters',
    example: 156000,
  })
  @IsNumber()
  distance: number;

  @ApiProperty({
    description: 'Total duration in seconds',
    example: 7200,
  })
  @IsNumber()
  duration: number;

  @ApiPropertyOptional({
    description: 'Route geometry coordinates [[lat, lng], ...]',
    example: [
      [5.6037, -0.187],
      [5.62, -0.17],
    ],
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  geometry?: [number, number][];

  @ApiPropertyOptional({
    description: 'Turn-by-turn directions',
    type: [RouteStep],
  })
  @IsOptional()
  @IsArray()
  steps?: RouteStep[];

  @ApiProperty({
    description: 'Starting point information',
    example: {
      coordinates: [5.6037, -0.187],
      name: 'Kwame Nkrumah Circle, Accra',
      resolved_from: 'coordinates',
    },
  })
  start: {
    coordinates: [number, number];
    name?: string;
    resolved_from: 'coordinates' | 'geocoding';
  };

  @ApiProperty({
    description: 'Destination point information',
    example: {
      coordinates: [6.6885, -1.6244],
      name: 'Kumasi Central Market',
      resolved_from: 'geocoding',
    },
  })
  end: {
    coordinates: [number, number];
    name?: string;
    resolved_from: 'coordinates' | 'geocoding';
  };

  @ApiProperty({
    description: 'Route profile used',
    example: 'driving-car',
  })
  profile: string;

  @ApiPropertyOptional({
    description: 'Estimated fuel cost in GHS (for driving profiles)',
    example: 45.5,
  })
  @IsOptional()
  @IsNumber()
  estimated_cost?: number;

  @ApiProperty({
    description: 'Data provider used',
    example: 'OpenRouteService',
  })
  provider: string;
}

export class GeocodingResult {
  @ApiProperty({
    description: 'Location coordinates [lat, lng]',
    example: [5.6037, -0.187],
  })
  coordinates: [number, number];

  @ApiProperty({
    description: 'Formatted address or place name',
    example: 'Kwame Nkrumah Circle, Accra, Greater Accra Region, Ghana',
  })
  display_name: string;

  @ApiPropertyOptional({
    description: 'Place importance score (0-1)',
    example: 0.85,
  })
  @IsOptional()
  importance?: number;

  @ApiPropertyOptional({
    description: 'Place type (city, town, village, etc.)',
    example: 'city',
  })
  @IsOptional()
  place_type?: string;
}
