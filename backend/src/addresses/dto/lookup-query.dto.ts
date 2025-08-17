import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class LookupQueryDto {
  @ApiProperty() @Type(() => Number) @IsNumber() lat: number;
  @ApiProperty() @Type(() => Number) @IsNumber() lng: number;
}
