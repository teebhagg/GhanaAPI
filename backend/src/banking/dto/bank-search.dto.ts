import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { blankIsInvalid } from '../../common/validation/blank-is-invalid';

export class BankSearchQueryDto {
  @ApiProperty({
    description: 'Search query for bank name or type',
    required: false,
    example: 'GCB',
  })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiProperty({
    description: 'Latitude for location-based search, from -90 to 90',
    required: false,
    example: 5.6037,
    minimum: -90,
    maximum: 90,
  })
  @IsOptional()
  @Type(() => Number)
  @Transform(blankIsInvalid)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(-90)
  @Max(90)
  lat?: number;

  @ApiProperty({
    description: 'Longitude for location-based search, from -180 to 180',
    required: false,
    example: -0.187,
    minimum: -180,
    maximum: 180,
  })
  @IsOptional()
  @Type(() => Number)
  @Transform(blankIsInvalid)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(-180)
  @Max(180)
  lng?: number;

  @ApiProperty({
    description: 'Search radius in kilometers (default: 5km)',
    required: false,
    minimum: 0.1,
    maximum: 50,
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.1)
  @Max(50)
  radius?: number = 5;

  @ApiProperty({
    description: 'Type of banking facility',
    required: false,
    enum: ['bank', 'atm', 'both'],
    example: 'both',
  })
  @IsOptional()
  @IsString()
  @IsIn(['bank', 'atm', 'both'])
  type?: 'bank' | 'atm' | 'both' = 'both';

  @ApiProperty({
    description: 'Number of results to return (max 100)',
    required: false,
    minimum: 1,
    maximum: 100,
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

/** Query of `GET /banking/nearby`: where to look, how far, and how many */
export class NearbyBanksQueryDto {
  @ApiProperty({
    description: 'Latitude, from -90 to 90 (and inside Ghana)',
    example: 5.6037,
    minimum: -90,
    maximum: 90,
  })
  @Type(() => Number)
  @Transform(blankIsInvalid)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(-90)
  @Max(90)
  lat: number;

  @ApiProperty({
    description: 'Longitude, from -180 to 180 (and inside Ghana)',
    example: -0.187,
    minimum: -180,
    maximum: 180,
  })
  @Type(() => Number)
  @Transform(blankIsInvalid)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(-180)
  @Max(180)
  lng: number;

  @ApiProperty({
    description: 'Search radius in kilometers, from 0.1 to 50 (default: 5)',
    required: false,
    minimum: 0.1,
    maximum: 50,
    default: 5,
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @Transform(blankIsInvalid)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0.1)
  @Max(50)
  radius?: number = 5;

  @ApiProperty({
    description: 'Maximum number of results, from 1 to 100 (default: 10)',
    required: false,
    minimum: 1,
    maximum: 100,
    default: 10,
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @Transform(blankIsInvalid)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(1)
  @Max(100)
  limit?: number = 10;
}
