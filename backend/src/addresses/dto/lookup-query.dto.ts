import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsNumber, Max, Min } from 'class-validator';
import { blankIsInvalid } from '../../common/validation/blank-is-invalid';

export class LookupQueryDto {
  @ApiProperty({
    description: 'Latitude in degrees, from -90 to 90',
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
    description: 'Longitude in degrees, from -180 to 180',
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
}
