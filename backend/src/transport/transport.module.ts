import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FuelPriceService } from './services/fuel-price.service';
import { GeocodingService } from './services/geocoding.service';
import { RoutingService } from './services/routing.service';
import { TransportRoutesService } from './services/transport-routes.service';
import { TransportStopsService } from './services/transport-stops.service';
import { TransportController } from './transport.controller';
import { TransportService } from './transport.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
    ConfigModule,
  ],
  controllers: [TransportController],
  providers: [
    TransportService,
    GeocodingService,
    FuelPriceService,
    TransportRoutesService,
    TransportStopsService,
    RoutingService,
  ],
  exports: [
    TransportService,
    GeocodingService,
    FuelPriceService,
    TransportRoutesService,
    TransportStopsService,
    RoutingService,
  ],
})
export class TransportModule {}
