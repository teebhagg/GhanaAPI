import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDefined, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class ConvertCurrencyDto {
  @ApiProperty({ description: 'The currency to convert from', example: 'GHS' })
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  from: string;

  @ApiProperty({ description: 'The currency to convert to', example: 'USD' })
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  to: string;

  @ApiProperty({ description: 'The amount to convert', example: 100 })
  @IsDefined()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  amount: number;
}
