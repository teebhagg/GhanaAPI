import { ApiProperty } from '@nestjs/swagger';

export class HistoricalRateDto {
  @ApiProperty() baseCurrency: string;
  @ApiProperty() targetCurrency: string;
  @ApiProperty() rate: number;
  @ApiProperty() date: Date;
  @ApiProperty() provider: string;
}
