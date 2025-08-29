import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class NearbyStopsQueryDto {
  @ApiProperty({
    description: 'Latitude coordinate',
    example: 5.6037,
  })
  @IsNumber()
  lat: number;

  @ApiProperty({
    description: 'Longitude coordinate',
    example: -0.187,
  })
  @IsNumber()
  lng: number;

  @ApiPropertyOptional({
    description: 'Search radius in meters (default: 1000)',
    example: 1000,
  })
  @IsOptional()
  @IsNumber()
  radius?: number;

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
