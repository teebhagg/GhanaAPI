import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  ParseFloatPipe,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  RouteDirectionsQueryDto,
  RouteDirectionsResponseDto,
} from './dto/route-directions.dto';
import {
  FuelPriceDto,
  TravelCostDto,
} from './dto/fuel-price.dto';
import {
  TravelCostQueryDto,
  TravelCostResponseDto,
} from './dto/travel-cost.dto';
import {
  NearbyStopsQueryDto,
  NearbyStopDto,
} from './dto/nearby-stops.dto';
import {
  TransportStopsQueryDto,
  TransportStopsResponseDto,
} from './dto/transport-stop.dto';
import {
  RouteCalculationDto,
} from './dto/route-calculation.dto';
import {
  FuelPrice,
  RouteCalculation,
  TransportService,
  TransportStop,
} from './transport.service';
import {
  ErrorResponseDto,
  ValidationErrorResponseDto,
} from './dto/error-response.dto';

enum TransportMode {
  DRIVING = 'driving',
  WALKING = 'walking',
  CYCLING = 'cycling',
  PUBLIC_TRANSPORT = 'publicTransport',
}

const TAXI_BASE_FARE = 5;
const TAXI_PER_KM_RATE = 2.5;
const TROTRO_RATE = 1.5;
const BUS_RATE = 1.0;

@ApiTags('Transport & Logistics')
@Controller('transport')
export class TransportController {
  constructor(private readonly transportService: TransportService) {}



  @Get('stops')
  @ApiOperation({
    summary: 'Get transport stops',
    description:
      'Retrieve transport stops (bus stops, stations, etc.) for a specific city',
  })
  @ApiQuery({
    name: 'city',
    enum: ['accra', 'kumasi', 'tamale', 'takoradi'],
    required: false,
    description: 'City to get stops for (default: accra)',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    description: 'Filter by stop type (bus_stop, platform, station)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of transport stops',
    type: TransportStopsResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid query parameters',
    type: ValidationErrorResponseDto,
  })
  @ApiResponse({
    status: 503,
    description: 'Service unavailable',
    type: ErrorResponseDto,
  })
  async getStops(
    @Query('city') city: string = 'accra',
    @Query('type') type?: string,
  ): Promise<{
    success: boolean;
    data: TransportStop[];
    count: number;
    city: string;
    type?: string;
  }> {
    try {
      const stops = await this.transportService.getTransportStops(
        city.toLowerCase(),
        type,
      );

      return {
        success: true,
        data: stops,
        count: stops.length,
        city: city.toLowerCase(),
        ...(type && { type }),
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch transport stops',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  @Get('nearby-stops')
  @ApiOperation({
    summary: 'Find nearby transport stops',
    description:
      'Find transport stops within a specified radius of given coordinates',
  })
  @ApiQuery({
    name: 'lat',
    type: 'number',
    description: 'Latitude',
  })
  @ApiQuery({
    name: 'lng',
    type: 'number',
    description: 'Longitude',
  })
  @ApiQuery({
    name: 'radius',
    type: 'number',
    required: false,
    description: 'Search radius in meters (default: 1000)',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    description: 'Filter by stop type',
  })
  @ApiResponse({
    status: 200,
    description: 'Nearby transport stops',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/NearbyStopDto' },
        },
        count: { type: 'number', example: 5 },
        center: { 
          type: 'array', 
          items: { type: 'number' },
          example: [5.6037, -0.187],
          minItems: 2,
          maxItems: 2,
        },
        radius: { type: 'number', example: 1000 },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid coordinates or outside Ghana boundaries',
    type: ValidationErrorResponseDto,
  })
  @ApiResponse({
    status: 503,
    description: 'Service unavailable',
    type: ErrorResponseDto,
  })
  async getNearbyStops(
    @Query('lat', ParseFloatPipe) lat: number,
    @Query('lng', ParseFloatPipe) lng: number,
    @Query('radius') radius: number = 1000,
    @Query('type') type?: string,
  ): Promise<{
    success: boolean;
    data: (TransportStop & { distance: number })[];
    count: number;
    center: [number, number];
    radius: number;
  }> {
    try {
      this.validateGhanaCoordinates(lat, lng);

      // Get all stops for the nearest city
      const city = this.getNearestCity(lat, lng);
      const allStops = await this.transportService.getTransportStops(
        city,
        type,
      );

      // Calculate distances and filter by radius
      const nearbyStops = allStops
        .map((stop) => ({
          ...stop,
          distance: this.calculateDistance(
            lat,
            lng,
            stop.coordinates[0],
            stop.coordinates[1],
          ),
        }))
        .filter((stop) => stop.distance <= radius)
        .sort((a, b) => a.distance - b.distance);

      return {
        success: true,
        data: nearbyStops,
        count: nearbyStops.length,
        center: [lat, lng],
        radius,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to find nearby stops',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  @Get('route-calculation')
  @ApiOperation({
    summary: 'Calculate route between two points',
    description:
      'Calculate optimal route, distance, and duration between start and end coordinates',
  })
  @ApiQuery({
    name: 'start_lat',
    type: 'number',
    description: 'Starting latitude',
  })
  @ApiQuery({
    name: 'start_lng',
    type: 'number',
    description: 'Starting longitude',
  })
  @ApiQuery({
    name: 'end_lat',
    type: 'number',
    description: 'Ending latitude',
  })
  @ApiQuery({
    name: 'end_lng',
    type: 'number',
    description: 'Ending longitude',
  })
  @ApiQuery({
    name: 'mode',
    enum: TransportMode,
    required: false,
    description: 'Transport mode (default: driving)',
  })
  @ApiResponse({
    status: 200,
    description: 'Route calculation result',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: { $ref: '#/components/schemas/RouteCalculationDto' },
        start: { 
          type: 'array', 
          items: { type: 'number' },
          example: [5.6037, -0.187],
          minItems: 2,
          maxItems: 2,
        },
        end: { 
          type: 'array', 
          items: { type: 'number' },
          example: [6.6885, -1.6244],
          minItems: 2,
          maxItems: 2,
        },
        mode: { type: 'string', example: 'driving' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid coordinates or outside Ghana boundaries',
    type: ValidationErrorResponseDto,
  })
  @ApiResponse({
    status: 503,
    description: 'Service unavailable',
    type: ErrorResponseDto,
  })
  async calculateRoute(
    @Query('start_lat', ParseFloatPipe) startLat: number,
    @Query('start_lng', ParseFloatPipe) startLng: number,
    @Query('end_lat', ParseFloatPipe) endLat: number,
    @Query('end_lng', ParseFloatPipe) endLng: number,
    @Query('mode') mode: TransportMode = TransportMode.DRIVING,
  ): Promise<{
    success: boolean;
    data: RouteCalculation;
    start: [number, number];
    end: [number, number];
    mode: string;
  }> {
    try {
      // Validate coordinates for Ghana bounds
      this.validateGhanaCoordinates(startLat, startLng);
      this.validateGhanaCoordinates(endLat, endLng);

      const route = await this.transportService.calculateRoute(
        [startLat, startLng],
        [endLat, endLng],
        mode,
      );

      return {
        success: true,
        data: route,
        start: [startLat, startLng],
        end: [endLat, endLng],
        mode,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to calculate route',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  @Get('directions')
  @ApiOperation({
    summary: 'Get route directions between two points',
    description:
      'Get detailed route directions between start and end points. Accepts either coordinates or place names. Uses OpenRouteService, Overpass API, HERE, and GraphHopper with fallback.',
  })
  @ApiQuery({
    name: 'start_lat',
    type: 'number',
    required: false,
    description: 'Starting latitude (required if start_name not provided)',
  })
  @ApiQuery({
    name: 'start_lng',
    type: 'number',
    required: false,
    description: 'Starting longitude (required if start_name not provided)',
  })
  @ApiQuery({
    name: 'start_name',
    required: false,
    description: 'Starting place name (required if coordinates not provided)',
    example: 'Kwame Nkrumah Circle, Accra',
  })
  @ApiQuery({
    name: 'end_lat',
    type: 'number',
    required: false,
    description: 'Destination latitude (required if end_name not provided)',
  })
  @ApiQuery({
    name: 'end_lng',
    type: 'number',
    required: false,
    description: 'Destination longitude (required if end_name not provided)',
  })
  @ApiQuery({
    name: 'end_name',
    required: false,
    description:
      'Destination place name (required if coordinates not provided)',
    example: 'Kumasi Central Market',
  })
  @ApiQuery({
    name: 'profile',
    required: false,
    description: 'Transport mode/profile',
    enum: [
      'driving-car',
      'driving-hgv',
      'cycling-regular',
      'foot-walking',
      'wheelchair',
    ],
  })
  @ApiQuery({
    name: 'instructions',
    type: 'boolean',
    required: false,
    description: 'Include turn-by-turn instructions (default: true)',
  })
  @ApiQuery({
    name: 'geometry',
    type: 'boolean',
    required: false,
    description: 'Include route geometry/polyline (default: true)',
  })
  @ApiResponse({
    status: 200,
    description: 'Route directions with detailed information',
    type: RouteDirectionsResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input parameters or coordinates outside Ghana',
  })
  @ApiResponse({
    status: 404,
    description: 'Could not find coordinates for provided place names',
  })
  @ApiResponse({
    status: 503,
    description: 'All routing services are unavailable',
  })
  async getRouteDirections(@Query() query: RouteDirectionsQueryDto): Promise<{
    success: boolean;
    data: RouteDirectionsResponseDto;
  }> {
    try {
      const directions = await this.transportService.getRouteDirections(query);

      return {
        success: true,
        data: directions,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to get route directions',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        error instanceof HttpException
          ? error.getStatus()
          : HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  @Get('travel-cost')
  @ApiOperation({
    summary: 'Estimate travel cost',
    description:
      'Estimate travel cost based on distance, fuel prices, and transport mode',
  })
  @ApiQuery({
    name: 'distance',
    type: 'number',
    description: 'Distance in kilometers',
  })
  @ApiQuery({
    name: 'mode',
    enum: ['car', 'taxi', 'trotro', 'bus'],
    required: false,
    description: 'Transport mode (default: car)',
  })
  @ApiQuery({
    name: 'fuel_efficiency',
    type: 'number',
    required: false,
    description: 'Fuel efficiency in km/l (default: 12)',
  })
  @ApiResponse({
    status: 200,
    description: 'Travel cost estimation',
    type: TravelCostResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid distance or unsupported transport mode',
    type: ValidationErrorResponseDto,
  })
  @ApiResponse({
    status: 503,
    description: 'Service unavailable',
    type: ErrorResponseDto,
  })
  async estimateTravelCost(
    @Query('distance', ParseFloatPipe) distance: number,
    @Query('mode') mode: string = 'car',
    @Query('fuel_efficiency') fuelEfficiency: number = 12,
  ): Promise<{
    success: boolean;
    data: {
      distance: number;
      mode: string;
      fuelCost?: number;
      estimatedFare?: number;
      currency: string;
      breakdown: Record<string, string | number>;
    };
  }> {
    try {
      const fuelPrices = await this.transportService.getFuelPrices();
      let cost = 0;
      let breakdown: Record<string, string | number> = {};

      switch (mode.toLowerCase()) {
        case 'car': {
          if (fuelPrices.petrol === null) {
            throw new Error('Petrol price data is currently unavailable');
          }
          const fuelNeeded = distance / fuelEfficiency;
          cost = fuelNeeded * fuelPrices.petrol;
          breakdown = {
            fuelNeeded: `${fuelNeeded.toFixed(2)}L`,
            fuelPrice: `${fuelPrices.petrol} ${fuelPrices.currency}/L`,
            fuelEfficiency: `${fuelEfficiency} km/L`,
          };
          break;
        }

        case 'taxi': {
          // Rough taxi fare estimation for Ghana
          const baseFare = TAXI_BASE_FARE; // GHS
          const perKmRate = TAXI_PER_KM_RATE; // GHS per km
          cost = baseFare + distance * perKmRate;
          breakdown = {
            baseFare: `${baseFare} ${fuelPrices.currency}`,
            perKmRate: `${perKmRate} ${fuelPrices.currency}/km`,
          };
          break;
        }

        case 'trotro': {
          // Trotro fare estimation
          const trotroRate = TROTRO_RATE; // GHS per km (rough estimate)
          cost = distance * trotroRate;
          breakdown = {
            rate: `${trotroRate} ${fuelPrices.currency}/km`,
          };
          break;
        }

        case 'bus': {
          // Bus fare estimation
          const busRate = BUS_RATE; // GHS per km
          cost = distance * busRate;
          breakdown = {
            rate: `${busRate} ${fuelPrices.currency}/km`,
          };
          break;
        }

        default:
          throw new Error(`Unsupported transport mode: ${mode}`);
      }

      return {
        success: true,
        data: {
          distance,
          mode,
          ...(mode === 'car' && { fuelCost: cost }),
          ...(mode !== 'car' && { estimatedFare: cost }),
          currency: fuelPrices.currency,
          breakdown,
        },
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to estimate travel cost',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  @Get('fuel-prices')
  @ApiOperation({
    summary: 'Get current fuel prices in Ghana',
    description:
      'Retrieve current petrol, diesel, and LPG prices from various sources',
  })
  @ApiResponse({
    status: 200,
    description: 'Current fuel prices',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            petrol: { type: 'number' },
            diesel: { type: 'number' },
            lpg: { type: 'number' },
            currency: { type: 'string' },
            lastUpdated: { type: 'string' },
            source: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 503,
    description: 'Service unavailable',
    type: ErrorResponseDto,
  })
  async getFuelPrices(): Promise<{
    success: boolean;
    data: FuelPrice;
  }> {
    try {
      const prices = await this.transportService.getFuelPrices();

      return {
        success: true,
        data: prices,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch fuel prices',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }



  // ===== PRIVATE HELPER METHODS =====

  private validateGhanaCoordinates(lat: number, lng: number): void {
    // Ghana bounding box: roughly 4.5°N to 11.5°N, 3.5°W to 1.5°E
    if (lat < 4.5 || lat > 11.5 || lng < -3.5 || lng > 1.5) {
      throw new HttpException(
        'Coordinates are outside Ghana boundaries',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private getNearestCity(lat: number, lng: number): string {
    const cities = [
      { name: 'accra', lat: 5.6037, lng: -0.187 },
      { name: 'kumasi', lat: 6.6885, lng: -1.6244 },
      { name: 'tamale', lat: 9.4034, lng: -0.8424 },
      { name: 'takoradi', lat: 4.8962, lng: -1.7554 },
    ];

    let nearestCity = cities[0];
    let minDistance = this.calculateDistance(
      lat,
      lng,
      cities[0].lat,
      cities[0].lng,
    );

    for (const city of cities.slice(1)) {
      const distance = this.calculateDistance(lat, lng, city.lat, city.lng);
      if (distance < minDistance) {
        minDistance = distance;
        nearestCity = city;
      }
    }

    return nearestCity.name;
  }

  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    // Haversine formula for calculating distance between two points
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }
}
