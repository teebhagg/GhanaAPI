import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AddressesModule } from './addresses/addresses.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BankingModule } from './banking/banking.module';
import { ExchangeRatesModule } from './exchange-rates/exchange-rates.module';
import { LocationsModule } from './locations/locations.module';
import { StockMarketModule } from './stock-market/stock-market.module';
import { TransportModule } from './transport/transport.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CacheModule.register({ isGlobal: true }),
    ScheduleModule.forRoot(),
    TransportModule,
    AddressesModule,
    LocationsModule,
    ExchangeRatesModule,
    BankingModule,
    StockMarketModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
