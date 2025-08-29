/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import {
  RouteDirectionsQueryDto,
  RouteDirectionsResponseDto,
  RouteProfile,
} from './dto/route-directions.dto';
import { FuelPrice, FuelPriceService } from './services/fuel-price.service';
import { GeocodingService } from './services/geocoding.service';
import { RouteCalculation, RoutingService } from './services/routing.service';
import {
  TransportRoute,
  TransportRoutesService,
} from './services/transport-routes.service';
import {
  TransportStop,
  TransportStopsService,
} from './services/transport-stops.service';

@Injectable()
export class TransportService {
  private readonly logger = new Logger(TransportService.name);

  constructor(
    private readonly geocodingService: GeocodingService,
    private readonly fuelPriceService: FuelPriceService,
    private readonly transportRoutesService: TransportRoutesService,
    private readonly transportStopsService: TransportStopsService,
    private readonly routingService: RoutingService,
  ) {}

  // ===== TRANSPORT ROUTES & STOPS =====

  async getPublicTransportRoutes(
    city: string = 'accra',
  ): Promise<TransportRoute[]> {
    return this.transportRoutesService.getPublicTransportRoutes(city);
  }

  async getTransportStops(
    city: string = 'accra',
    pickup?: string,
    destination?: string,
    pickupCoordinates?: [number, number],
    destinationCoordinates?: [number, number],
    type?: string,
  ): Promise<TransportStop[]> {
    return this.transportStopsService.getTransportStops(
      city,
      pickup,
      destination,
      pickupCoordinates,
      destinationCoordinates,
      type,
    );
  }

  // ===== ROUTE CALCULATION =====

  async calculateRoute(
    start: [number, number],
    end: [number, number],
    mode: string = 'driving',
  ): Promise<RouteCalculation> {
    return this.routingService.calculateRoute(start, end, mode);
  }

  // ===== ROUTE DIRECTIONS =====

  async getRouteDirections(
    query: RouteDirectionsQueryDto,
  ): Promise<RouteDirectionsResponseDto> {
    // Validate input - ensure we have either coordinates or names for both start and end
    this.validateRouteDirectionsInput(query);

    // Resolve coordinates for start and end points
    const startPoint = await this.resolveLocationCoordinates(
      query.start_lat,
      query.start_lng,
      query.start_name,
    );
    const endPoint = await this.resolveLocationCoordinates(
      query.end_lat,
      query.end_lng,
      query.end_name,
    );

    // Validate coordinates are within Ghana
    this.routingService.validateGhanaCoordinates(
      startPoint.coordinates[0],
      startPoint.coordinates[1],
    );
    this.routingService.validateGhanaCoordinates(
      endPoint.coordinates[0],
      endPoint.coordinates[1],
    );

    // Get route directions using fallback APIs
    const routeData = await this.routingService.getRouteWithFallback(
      startPoint.coordinates,
      endPoint.coordinates,
      query.profile || RouteProfile.DRIVING_CAR,
      query.instructions,
      query.geometry,
    );

    // Calculate estimated cost for driving profiles
    let estimatedCost: number | undefined;
    if (query.profile?.includes('driving')) {
      try {
        const fuelPrices = await this.getFuelPrices();
        const distanceKm = routeData.distance / 1000;
        const fuelEfficiency = 12; // km/L default
        const fuelNeeded = distanceKm / fuelEfficiency;
        estimatedCost = fuelNeeded * fuelPrices.petrol;
      } catch (error) {
        this.logger.warn('Could not calculate fuel cost:', error);
      }
    }

    return {
      distance: routeData.distance,
      duration: routeData.duration,
      geometry: routeData.geometry,
      steps: routeData.steps,
      start: startPoint,
      end: endPoint,
      profile: query.profile || RouteProfile.DRIVING_CAR,
      estimated_cost: estimatedCost,
      provider: routeData.provider,
    };
  }

  // ===== FUEL PRICES =====

  async getFuelPrices(): Promise<FuelPrice> {
    return this.fuelPriceService.getFuelPrices();
  }

  // ===== ROUTE DIRECTIONS HELPER METHODS =====

  private validateRouteDirectionsInput(query: RouteDirectionsQueryDto): void {
    const hasStartCoords =
      query.start_lat !== undefined && query.start_lng !== undefined;
    const hasStartName =
      query.start_name !== undefined && query.start_name.trim() !== '';
    const hasEndCoords =
      query.end_lat !== undefined && query.end_lng !== undefined;
    const hasEndName =
      query.end_name !== undefined && query.end_name.trim() !== '';

    // Check start point
    if (!hasStartCoords && !hasStartName) {
      throw new HttpException(
        'Either start coordinates (start_lat, start_lng) or start_name must be provided',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (hasStartCoords && hasStartName) {
      throw new HttpException(
        'Provide either start coordinates OR start_name, not both',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Check end point
    if (!hasEndCoords && !hasEndName) {
      throw new HttpException(
        'Either end coordinates (end_lat, end_lng) or end_name must be provided',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (hasEndCoords && hasEndName) {
      throw new HttpException(
        'Provide either end coordinates OR end_name, not both',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Ensure both coordinates are provided if using coordinates
    if (
      (query.start_lat !== undefined && query.start_lng === undefined) ||
      (query.start_lat === undefined && query.start_lng !== undefined)
    ) {
      throw new HttpException(
        'Both start_lat and start_lng must be provided when using coordinates',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (
      (query.end_lat !== undefined && query.end_lng === undefined) ||
      (query.end_lat === undefined && query.end_lng !== undefined)
    ) {
      throw new HttpException(
        'Both end_lat and end_lng must be provided when using coordinates',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private async resolveLocationCoordinates(
    lat?: number,
    lng?: number,
    name?: string,
  ): Promise<{
    coordinates: [number, number];
    name?: string;
    resolved_from: 'coordinates' | 'geocoding';
  }> {
    // If coordinates are provided, use them directly
    if (lat !== undefined && lng !== undefined) {
      return {
        coordinates: [lat, lng],
        resolved_from: 'coordinates',
      };
    }

    // If name is provided, geocode it
    if (name && name.trim() !== '') {
      const geocodingResult = await this.geocodingService.geocodeLocation(
        name.trim(),
      );
      return {
        coordinates: geocodingResult.coordinates,
        name: geocodingResult.display_name,
        resolved_from: 'geocoding',
      };
    }

    throw new HttpException(
      'Either coordinates or location name must be provided',
      HttpStatus.BAD_REQUEST,
    );
  }
}
export type { FuelPrice, RouteCalculation, TransportStop };
