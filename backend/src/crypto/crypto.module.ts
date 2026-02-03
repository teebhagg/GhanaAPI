import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CryptoGateway } from './crypto.gateway';
import { CryptoService } from './crypto.service';

@Module({
  imports: [ConfigModule],
  providers: [CryptoGateway, CryptoService],
})
export class CryptoModule {}
