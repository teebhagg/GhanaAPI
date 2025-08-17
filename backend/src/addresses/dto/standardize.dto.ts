import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class StandardizeDto {
  @ApiProperty() @IsString() @MinLength(3) rawAddress: string;
}
