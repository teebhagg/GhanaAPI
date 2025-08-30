import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import * as polyline from '@mapbox/polyline';
import { RouteProfile, RouteStep } from '../dto/route-directions.dto';

export interface RouteCalculation {
  distance: number;
  duration: number;
  coordinates: [number, number][];
  instructions?: string[];
  cost?: number;
}

@Injectable()
export class RoutingService {
  private readonly logger = new Logger(RoutingService.name);
  private readonly routingApis = ['openrouteservice', 'here', 'graphhopper'];

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async calculateRoute(
    start: [number, number],
    end: [number, number],
    mode: string = 'driving',
  ): Promise<RouteCalculation> {
    const routingApis = ['here', 'graphhopper'];

    for (const api of routingApis) {
      try {
        this.logger.log(`Calculating route using ${api}`);

        switch (api) {
          case 'here':
            return await this.calculateRouteHere(start, end, mode);
          case 'graphhopper':
            return await this.calculateRouteGraphHopper(start, end, mode);
          default:
            continue;
        }
      } catch (error) {
        this.logger.warn(
          `Route calculation via ${api} failed: ${error.message}`,
        );
        continue;
      }
    }

    throw new HttpException(
      'All routing APIs failed',
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }

  async getRouteWithFallback(
    start: [number, number],
    end: [number, number],
    profile: RouteProfile,
    includeInstructions?: boolean,
    includeGeometry?: boolean,
  ): Promise<{
    distance: number;
    duration: number;
    geometry?: [number, number][];
    steps?: RouteStep[];
    provider: string;
  }> {
    for (const api of this.routingApis) {
      try {
        this.logger.log(`Calculating route using ${api}`);

        switch (api) {
          case 'openrouteservice':
            return await this.getRouteFromOpenRouteService(
              start,
              end,
              profile,
              includeInstructions,
              includeGeometry,
            );
          case 'here':
            return await this.getRouteFromHere(
              start,
              end,
              profile,
              includeInstructions,
              includeGeometry,
            );
          case 'graphhopper':
            return await this.getRouteFromGraphHopper(
              start,
              end,
              profile,
              includeInstructions,
              includeGeometry,
            );
          default:
            continue;
        }
      } catch (error) {
        this.logger.warn(
          `Route calculation via ${api} failed: ${error.message}`,
        );
        continue;
      }
    }

    throw new HttpException(
      'All routing APIs failed for route calculation',
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }

  // ===== API IMPLEMENTATIONS =====

  private async calculateRouteHere(
    start: [number, number],
    end: [number, number],
    mode: string,
  ): Promise<RouteCalculation> {
    const apiKey = this.configService.get<string>('HERE_API_KEY');
    if (!apiKey) {
      throw new Error('HERE API key not configured');
    }

    const url = `https://router.hereapi.com/v8/routes`;
    const params = {
      apikey: apiKey,
      transportMode: mode,
      origin: `${start[0]},${start[1]}`,
      destination: `${end[0]},${end[1]}`,
      return: 'polyline,summary,instructions',
    };

    const response = await firstValueFrom(
      this.httpService.get(url, { params, timeout: 15000 }),
    );

    return this.parseHereRoute(response.data);
  }

  private async calculateRouteGraphHopper(
    start: [number, number],
    end: [number, number],
    mode: string,
  ): Promise<RouteCalculation> {
    const apiKey = this.configService.get<string>('GRAPHHOPPER_API_KEY');
    if (!apiKey) {
      throw new Error('GraphHopper API key not configured');
    }

    const url = 'https://graphhopper.com/api/1/route';
    const params = {
      key: apiKey,
      point: [`${start[0]},${start[1]}`, `${end[0]},${end[1]}`],
      vehicle: mode === 'driving' ? 'car' : mode,
      calc_points: true,
      instructions: true,
    };

    const response = await firstValueFrom(
      this.httpService.get(url, { params, timeout: 15000 }),
    );

    return this.parseGraphHopperRoute(response.data);
  }

  private async getRouteFromOpenRouteService(
    start: [number, number],
    end: [number, number],
    profile: RouteProfile,
    includeInstructions?: boolean,
    includeGeometry?: boolean,
  ): Promise<{
    distance: number;
    duration: number;
    geometry?: [number, number][];
    steps?: RouteStep[];
    provider: string;
  }> {
    const apiKey = this.configService.get<string>('OPEN_ROUTE_API_KEY');
    if (!apiKey) {
      throw new Error('OpenRouteService API key not configured');
    }

    const url = `https://api.openrouteservice.org/v2/directions/${profile}`;
    const body = {
      coordinates: [
        [start[1], start[0]],
        [end[1], end[0]],
      ], // ORS uses [lng, lat]
      instructions: includeInstructions || false,
      geometry: includeGeometry || false,
    };

    const response = await firstValueFrom(
      this.httpService.post(url, body, {
        headers: {
          Authorization: apiKey,
          'Content-Type': 'application/json',
        },
        timeout: 20000,
      }),
    );

    const route = response.data.routes[0];
    const summary = route.summary;

    let geometry: [number, number][] | undefined;
    if (includeGeometry && route.geometry) {
      geometry = this.decodePolyline(route.geometry);
    }

    let steps: RouteStep[] | undefined;
    if (includeInstructions && route.segments) {
      steps = [];
      for (const segment of route.segments) {
        if (segment.steps) {
          for (const step of segment.steps) {
            steps.push({
              instruction: step.instruction,
              distance: step.distance,
              duration: step.duration,
              maneuver: step.maneuver?.type,
            });
          }
        }
      }
    }

    return {
      distance: summary.distance,
      duration: summary.duration,
      geometry,
      steps,
      provider: 'OpenRouteService',
    };
  }

  private async getRouteFromHere(
    start: [number, number],
    end: [number, number],
    profile: RouteProfile,
    includeInstructions?: boolean,
    includeGeometry?: boolean,
  ): Promise<{
    distance: number;
    duration: number;
    geometry?: [number, number][];
    steps?: RouteStep[];
    provider: string;
  }> {
    const apiKey = this.configService.get<string>('HERE_API_KEY');
    if (!apiKey) {
      throw new Error('HERE API key not configured');
    }

    // Map RouteProfile to HERE transport mode
    let transportMode = 'car';
    switch (profile) {
      case RouteProfile.FOOT_WALKING:
        transportMode = 'pedestrian';
        break;
      case RouteProfile.CYCLING_REGULAR:
        transportMode = 'bicycle';
        break;
      case RouteProfile.DRIVING_CAR:
      case RouteProfile.DRIVING_HGV:
        transportMode = 'car';
        break;
    }

    const url = `https://router.hereapi.com/v8/routes`;
    const params = {
      apikey: apiKey,
      transportMode,
      origin: `${start[0]},${start[1]}`,
      destination: `${end[0]},${end[1]}`,
      return: [
        'summary',
        includeGeometry ? 'polyline' : '',
        includeInstructions ? 'actions' : '',
      ]
        .filter(Boolean)
        .join(','),
    };

    const response = await firstValueFrom(
      this.httpService.get(url, { params, timeout: 15000 }),
    );

    const route = response.data.routes[0];
    const section = route.sections[0];

    let geometry: [number, number][] | undefined;
    if (includeGeometry && section.polyline) {
      geometry = this.decodePolyline(section.polyline);
    }

    let steps: RouteStep[] | undefined;
    if (includeInstructions && section.actions) {
      steps = section.actions.map((action: any) => ({
        instruction: action.instruction,
        distance: action.length || 0,
        duration: action.duration || 0,
        maneuver: action.action,
      }));
    }

    return {
      distance: section.summary.length,
      duration: section.summary.duration,
      geometry,
      steps,
      provider: 'HERE',
    };
  }

  private async getRouteFromGraphHopper(
    start: [number, number],
    end: [number, number],
    profile: RouteProfile,
    includeInstructions?: boolean,
    includeGeometry?: boolean,
  ): Promise<{
    distance: number;
    duration: number;
    geometry?: [number, number][];
    steps?: RouteStep[];
    provider: string;
  }> {
    const apiKey = this.configService.get<string>('GRAPHHOPPER_API_KEY');
    if (!apiKey) {
      throw new Error('GraphHopper API key not configured');
    }

    // Map RouteProfile to GraphHopper vehicle
    let vehicle = 'car';
    switch (profile) {
      case RouteProfile.FOOT_WALKING:
        vehicle = 'foot';
        break;
      case RouteProfile.CYCLING_REGULAR:
        vehicle = 'bike';
        break;
      case RouteProfile.DRIVING_CAR:
        vehicle = 'car';
        break;
      case RouteProfile.DRIVING_HGV:
        vehicle = 'truck';
        break;
    }

    const url = 'https://graphhopper.com/api/1/route';
    const params = {
      key: apiKey,
      point: [`${start[0]},${start[1]}`, `${end[0]},${end[1]}`],
      vehicle,
      calc_points: includeGeometry || false,
      instructions: includeInstructions || false,
    };

    const response = await firstValueFrom(
      this.httpService.get(url, { params, timeout: 15000 }),
    );

    const path = response.data.paths[0];

    let geometry: [number, number][] | undefined;
    if (includeGeometry && path.points) {
      geometry = this.decodePolyline(path.points);
    }

    let steps: RouteStep[] | undefined;
    if (includeInstructions && path.instructions) {
      steps = path.instructions.map((instruction: any) => ({
        instruction: instruction.text,
        distance: instruction.distance,
        duration: instruction.time / 1000, // Convert from ms to seconds
      }));
    }

    return {
      distance: path.distance,
      duration: path.time / 1000, // Convert from ms to seconds
      geometry,
      steps,
      provider: 'GraphHopper',
    };
  }

  // ===== PARSING METHODS =====

  private parseHereRoute(data: any): RouteCalculation {
    const route = data.routes[0];
    const section = route.sections[0];

    return {
      distance: section.summary.length,
      duration: section.summary.duration,
      coordinates: this.decodePolyline(section.polyline),
      instructions:
        section.actions?.map((action: any) => action.instruction) || [],
    };
  }

  private parseGraphHopperRoute(data: any): RouteCalculation {
    const path = data.paths[0];

    return {
      distance: path.distance,
      duration: path.time / 1000, // Convert from ms to seconds
      coordinates: this.decodePolyline(path.points),
      instructions: path.instructions?.map((inst) => inst.text) || [],
    };
  }

  // ===== UTILITY METHODS =====

  calculateHaversineDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
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

  validateGhanaCoordinates(lat: number, lng: number): void {
    // Ghana bounding box: roughly 4.5°N to 11.5°N, 3.5°W to 1.5°E
    if (lat < 4.5 || lat > 11.5 || lng < -3.5 || lng > 1.5) {
      throw new HttpException(
        'Coordinates are outside Ghana boundaries',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private decodePolyline(encodedPolyline: string): [number, number][] {
    try {
      // Use the @mapbox/polyline library for reliable polyline decoding
      const decoded = polyline.decode(encodedPolyline);
      // Convert from [lat, lng] to [lat, lng] format (already correct)
      return decoded as [number, number][];
    } catch (error) {
      this.logger.warn(`Failed to decode polyline: ${error.message}`);
      // Return empty array if decoding fails
      return [];
    }
  }

  /**
   * Encode coordinates into a polyline string
   * @param coordinates Array of [lat, lng] coordinate pairs
   * @returns Encoded polyline string
   */
  encodePolyline(coordinates: [number, number][]): string {
    try {
      return polyline.encode(coordinates);
    } catch (error) {
      this.logger.warn(`Failed to encode polyline: ${error.message}`);
      return '';
    }
  }
}
