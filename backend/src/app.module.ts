import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AddressesModule } from './addresses/addresses.module';
import { LocationsModule } from './locations/locations.module';
import { ExchangeRatesModule } from './exchange-rates/exchange-rates.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CacheModule.register({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AddressesModule,
    LocationsModule,
    ExchangeRatesModule,
    // TODO: AddressesModule, LocationsModule, ExchangeRatesModule (next steps)
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
