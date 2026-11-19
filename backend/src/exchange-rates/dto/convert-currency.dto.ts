import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsDefined, IsIn, IsNumber, IsPositive } from 'class-validator';
import { SUPPORTED_CURRENCIES } from './historical-query.dto';

/** Every currency the conversion supports: the cedi and the foreign ones */
export const CONVERTIBLE_CURRENCIES = ['GHS', ...SUPPORTED_CURRENCIES];

const toUpperCase = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toUpperCase() : value;

export class ConvertCurrencyDto {
  @ApiProperty({
    description: 'The currency to convert from',
    example: 'GHS',
    enum: CONVERTIBLE_CURRENCIES,
  })
  @Transform(toUpperCase)
  @IsDefined()
  @IsIn(CONVERTIBLE_CURRENCIES)
  from: string;

  @ApiProperty({
    description: 'The currency to convert to',
    example: 'USD',
    enum: CONVERTIBLE_CURRENCIES,
  })
  @Transform(toUpperCase)
  @IsDefined()
  @IsIn(CONVERTIBLE_CURRENCIES)
  to: string;

  @ApiProperty({
    description: 'The amount to convert. Must be greater than zero.',
    example: 100,
    exclusiveMinimum: true,
    minimum: 0,
  })
  @IsDefined()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @IsPositive()
  amount: number;
}
