import { Module } from '@nestjs/common';
import { DatabaseModule } from '../common/database/database.module';
import { ExchangeRatesService } from './exchange-rates.service';
import { ExchangeRatesController } from './exchange-rates.controller';
import { BankOfGhanaProvider } from './providers/bank-of-ghana.provider';
import { ExchangeRateApiProvider } from './providers/exchangerateapi.provider';
import { FixerProvider } from './providers/fixer.provider';

@Module({
  imports: [DatabaseModule],
  providers: [
    ExchangeRatesService,
    BankOfGhanaProvider,
    ExchangeRateApiProvider,
    FixerProvider,
  ],
  controllers: [ExchangeRatesController],
})
export class ExchangeRatesModule {}
