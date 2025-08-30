import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import * as polyline from '@mapbox/polyline';

export interface TransportRoute {
  id?: string;
  name: string;
  type: 'bus' | 'trotro' | 'taxi' | 'metro' | 'ferry';
  coordinates: [number, number][];
  stops?: TransportStop[];
  distance?: number;
  duration?: number;
}

export interface TransportStop {
  id?: string;
  name: string;
  coordinates: [number, number];
  type: string;
  routes?: string[];
}

@Injectable()
export class TransportRoutesService {
  private readonly logger = new Logger(TransportRoutesService.name);
  private readonly transportApis = ['overpass', 'gtfs', 'here', 'graphhopper'];

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async getPublicTransportRoutes(
    city: string = 'accra',
  ): Promise<TransportRoute[]> {
    for (const api of this.transportApis) {
      try {
        this.logger.log(`Trying to get transport routes from ${api}`);

        switch (api) {
          case 'overpass':
            return await this.getRoutesFromOverpass(city);
          case 'gtfs':
            return await this.getRoutesFromGTFS(city);
          case 'here':
            return await this.getRoutesFromHere(city);
          case 'graphhopper':
            return await this.getRoutesFromGraphHopper(city);
          default:
            continue;
        }
      } catch (error: any) {
        this.logger.warn(`${api} failed: ${error.message}`);
        continue;
      }
    }

    throw new HttpException(
      'All transport route APIs failed',
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }

  private async getRoutesFromOverpass(city: string): Promise<TransportRoute[]> {
    const bbox = this.getCityBoundingBox(city);
    const query = `
      [out:json][timeout:25];
      (
        relation["route"~"bus|minibus"]["network"~"trotro|bus|public_transport"](${bbox});
        way["highway"="bus_guideway"](${bbox});
        way["public_transport"="platform"](${bbox});
      );
      out geom;
    `;

    const url = 'https://overpass-api.de/api/interpreter';
    const response = await firstValueFrom(
      this.httpService.post(url, query, {
        headers: { 'Content-Type': 'text/plain' },
        timeout: 30000,
      }),
    );

    return this.parseOverpassRoutes(response.data);
  }

  private async getRoutesFromGTFS(city: string): Promise<TransportRoute[]> {
    // Ghana may not have official GTFS feeds, but check for any available
    const gtfsUrl = this.configService.get<string>('GHANA_GTFS_URL');
    if (!gtfsUrl) {
      throw new Error(`No GTFS data available for ${city}`);
    }

    const response = await firstValueFrom(
      this.httpService.get(`${gtfsUrl}/routes.txt`, { timeout: 15000 }),
    );

    return this.parseGTFSRoutes(response.data);
  }

  private async getRoutesFromHere(city: string): Promise<TransportRoute[]> {
    const apiKey = this.configService.get<string>('HERE_API_KEY');
    if (!apiKey) {
      throw new Error('HERE API key not configured');
    }

    const coordinates = this.getCityCoordinates(city);
    const url = `https://transit.ls.hereapi.com/v8/routes?apikey=${apiKey}&origin=${coordinates[0]},${coordinates[1]}&radius=50000`;

    const response = await firstValueFrom(
      this.httpService.get(url, { timeout: 15000 }),
    );

    return this.parseHereRoutes(response.data);
  }

  private getRoutesFromGraphHopper(city: string): Promise<TransportRoute[]> {
    // GraphHopper doesn't provide public transport data directly
    // This would need to be combined with other data sources
    throw new Error(
      `GraphHopper does not provide public transport routes for ${city}`,
    );
  }

  // ===== PARSING METHODS =====

  private parseOverpassRoutes(data: any): TransportRoute[] {
    const routes: TransportRoute[] = [];

    if (data.elements) {
      for (const element of data.elements) {
        if (element.type === 'relation' && element.tags?.route) {
          const route: TransportRoute = {
            id: element.id?.toString(),
            name: element.tags.name || element.tags.ref || 'Unknown Route',
            type: this.mapRouteType(element.tags.route),
            coordinates: this.extractRouteCoordinates(element),
          };
          routes.push(route);
        }
      }
    }

    return routes;
  }

  private parseGTFSRoutes(data: string): TransportRoute[] {
    // Parse CSV data from GTFS routes.txt
    const lines = data.split('\n');
    const headers = lines[0].split(',');
    const routes: TransportRoute[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      if (values.length >= headers.length) {
        routes.push({
          id: values[0],
          name: values[2] || values[3], // route_short_name or route_long_name
          type: this.mapGTFSRouteType(parseInt(values[4])), // route_type
          coordinates: [], // Would need to fetch from shapes.txt
        });
      }
    }

    return routes;
  }

  private parseHereRoutes(data: any): TransportRoute[] {
    const routes: TransportRoute[] = [];

    if (data.routes) {
      for (const route of data.routes) {
        routes.push({
          id: route.id,
          name: route.name || 'HERE Route',
          type: 'bus', // Default type
          coordinates: this.decodePolyline(route.polyline),
        });
      }
    }

    return routes;
  }

  // ===== HELPER METHODS =====

  private getCityBoundingBox(city: string): string {
    const boxes = {
      accra: '5.4000,-0.4000,5.8000,0.2000',
      kumasi: '6.6000,-1.8000,6.8000,-1.4000',
      tamale: '9.2000,-1.2000,9.6000,-0.8000',
      takoradi: '4.8000,-2.0000,5.0000,-1.6000',
    };

    return boxes[city.toLowerCase()] || boxes.accra;
  }

  private getCityCoordinates(city: string): [number, number] {
    const coords = {
      accra: [5.6037, -0.187],
      kumasi: [6.6885, -1.6244],
      tamale: [9.4034, -0.8424],
      takoradi: [4.8962, -1.7554],
    };

    return coords[city.toLowerCase()] || coords.accra;
  }

  private mapRouteType(route: string): TransportRoute['type'] {
    const typeMap = {
      bus: 'bus',
      minibus: 'trotro',
      taxi: 'taxi',
      ferry: 'ferry',
    };
    return typeMap[route] || 'bus';
  }

  private mapGTFSRouteType(routeType: number): TransportRoute['type'] {
    const typeMap = {
      3: 'bus', // Bus
      11: 'trotro', // Trolleybus (using for trotro)
      4: 'ferry', // Ferry
      1500: 'taxi', // Taxi
    };
    return typeMap[routeType] || 'bus';
  }

  private extractRouteCoordinates(element: any): [number, number][] {
    // Extract coordinates from OSM relation geometry
    const coords: [number, number][] = [];

    if (element.geometry) {
      for (const geom of element.geometry) {
        coords.push([geom.lat, geom.lon]);
      }
    }

    return coords;
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
}
