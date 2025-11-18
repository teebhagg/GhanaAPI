import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ExchangeRatesService } from './exchange-rates.service';
import { HistoricalRateDto } from './dto/historical-rate.dto';
import { ConvertCurrencyDto } from './dto/convert-currency.dto';

@Controller('exchange-rates')
@ApiTags('Exchange Rates')
export class ExchangeRatesController {
  constructor(private readonly exchangeRatesService: ExchangeRatesService) {}

  @Get('current')
  @ApiOperation({ summary: 'Get current exchange rates' })
  @ApiQuery({ name: 'currencies', required: false })
  getCurrentRates(@Query('currencies') currencies?: string) {
    const list = currencies
      ?.split(',')
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);
    return this.exchangeRatesService.getCurrentRates(list);
  }

  @Get('historical')
  @ApiOperation({
    summary: 'Get historical exchange rates from stored snapshots',
  })
  getHistoricalRates(
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('currency') currency: string,
  ) {
    return this.exchangeRatesService.getHistoricalRates(
      new Date(from),
      new Date(to),
      currency,
    );
  }

  @Get(':currency/trend')
  @ApiOperation({
    summary: 'Get 7-day exchange rate trend for a currency',
  })
  getTrend(@Param('currency') currency: string) {
    const now = new Date();
    const from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return this.exchangeRatesService.getHistoricalRates(
      from,
      now,
      currency,
    ) as unknown as HistoricalRateDto[];
  }

  @Post('convert')
  @ApiOperation({ summary: 'Convert currency' })
  convertCurrency(@Body() body: ConvertCurrencyDto) {
    return this.exchangeRatesService.convertCurrency(body);
  }
}
