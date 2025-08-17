import { ApiProperty } from '@nestjs/swagger';

export class ExchangeRateDto {
  @ApiProperty() baseCurrency: string;
  @ApiProperty() targetCurrency: string;
  @ApiProperty() rate: number;
  @ApiProperty() provider: string;
  @ApiProperty() timestamp: Date;
}
