import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';
import { CryptoService } from './crypto.service';
import { CryptoController } from './crypto.controller';
import { ExchangeRatesModule } from '../exchange-rates/exchange-rates.module';

@Module({
  imports: [
    HttpModule,
    CacheModule.register({ ttl: 60 }),
    ExchangeRatesModule,
  ],
  controllers: [CryptoController],
  providers: [CryptoService],
})
export class CryptoModule {}
