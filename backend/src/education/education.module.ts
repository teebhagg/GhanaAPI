import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EducationController } from './education.controller';
import { EducationService } from './education.service';
import { SchoolDataProviderService } from './services/school-data-provider.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
    ConfigModule,
    CacheModule.register({
      ttl: 3600000, // 1 hour default TTL in milliseconds
      max: 100, // maximum number of items in cache
    }),
  ],
  controllers: [EducationController],
  providers: [EducationService, SchoolDataProviderService],
  exports: [EducationService, SchoolDataProviderService],
})
export class EducationModule {}
