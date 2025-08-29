import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class TransportStopDetailDto {
  @ApiPropertyOptional({
    description: 'Unique stop identifier',
    example: 'stop_001',
  })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({
    description: 'Name of the transport stop',
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
    description: 'Type of transport stop',
    example: 'bus_stop',
    enum: ['bus_stop', 'platform', 'station', 'halt', 'tram_stop'],
  })
  @IsString()
  type: string;

  @ApiPropertyOptional({
    description: 'Routes that serve this stop',
    example: ['circle_line', 'kantamanto_route'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  routes?: string[];

  @ApiPropertyOptional({
    description: 'Operating hours for the stop',
    example: '05:00-22:00',
  })
  @IsOptional()
  @IsString()
  operatingHours?: string;

  @ApiPropertyOptional({
    description: 'Facilities available at the stop',
    example: ['shelter', 'seating', 'lighting'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  facilities?: string[];
}

export class TransportStopsQueryDto {
  @ApiPropertyOptional({
    description: 'City to get stops for',
    example: 'accra',
    enum: ['accra', 'kumasi', 'tamale', 'takoradi'],
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    description: 'Filter by stop type',
    example: 'bus_stop',
    enum: ['bus_stop', 'platform', 'station', 'halt', 'tram_stop'],
  })
  @IsOptional()
  @IsString()
  type?: string;
}

export class TransportStopsResponseDto {
  @ApiProperty({
    description: 'Request success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Array of transport stops',
    type: [TransportStopDetailDto],
  })
  data: TransportStopDetailDto[];

  @ApiProperty({
    description: 'Total number of stops returned',
    example: 25,
  })
  count: number;

  @ApiProperty({
    description: 'City for which stops were retrieved',
    example: 'accra',
  })
  city: string;

  @ApiPropertyOptional({
    description: 'Stop type filter applied',
    example: 'bus_stop',
  })
  type?: string;
}
