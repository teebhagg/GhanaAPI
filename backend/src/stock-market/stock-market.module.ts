import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { GSEApiProvider } from './providers/gse-api.provider';
import { StockMarketController } from './stock-market.controller';
import { StockMarketService } from './stock-market.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 3,
    }),
    CacheModule.register({
      ttl: 5 * 60 * 1000, // 5 minutes
      max: 100,
    }),
    ScheduleModule.forRoot(),
  ],
  controllers: [StockMarketController],
  providers: [StockMarketService, GSEApiProvider],
  exports: [StockMarketService],
})
export class StockMarketModule {}
