import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BankingController } from './banking.controller';
import { BankingService } from './banking.service';
import { BankDataProviderService } from './services/bank-data-provider.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
    ConfigModule,
  ],
  controllers: [BankingController],
  providers: [BankingService, BankDataProviderService],
  exports: [BankingService, BankDataProviderService],
})
export class BankingModule {}
