import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

export interface TransportStop {
  id?: string;
  name: string;
  coordinates: [number, number];
  type: string;
  routes?: string[];
}

@Injectable()
export class TransportStopsService {
  private readonly logger = new Logger(TransportStopsService.name);
  private readonly transportApis = ['overpass', 'gtfs'];

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async getTransportStops(
    city: string = 'accra',
    pickup?: string,
    destination?: string,
    pickupCoordinates?: [number, number],
    destinationCoordinates?: [number, number],
    type?: string,
  ): Promise<TransportStop[]> {
    for (const api of this.transportApis) {
      try {
        this.logger.log(`Trying to get transport stops from ${api}`);

        switch (api) {
          case 'overpass':
            return await this.getStopsFromOverpass(city, type);
          case 'gtfs':
            return await this.getStopsFromGTFS(city, type);
          default:
            continue;
        }
      } catch (error) {
        this.logger.warn(`${api} failed: ${error.message}`);
        continue;
      }
    }

    throw new HttpException(
      'All transport stops APIs failed',
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }

  private async getStopsFromOverpass(
    city: string,
    type?: string,
  ): Promise<TransportStop[]> {
    const bbox = this.getCityBoundingBox(city);
    const typeFilter = type ? `["public_transport"="${type}"]` : '';

    const query = `
      [out:json][timeout:25];
      (
        node["public_transport"~"stop_position|platform"]${typeFilter}(${bbox});
        node["highway"="bus_stop"](${bbox});
        node["amenity"="bus_station"](${bbox});
      );
      out;
    `;

    const url = 'https://overpass-api.de/api/interpreter';
    const response = await firstValueFrom(
      this.httpService.post(url, query, {
        headers: { 'Content-Type': 'text/plain' },
        timeout: 30000,
      }),
    );

    return this.parseOverpassStops(response.data);
  }

  private async getStopsFromGTFS(
    city: string,
    type?: string,
  ): Promise<TransportStop[]> {
    const gtfsUrl = this.configService.get<string>('GHANA_GTFS_URL');
    if (!gtfsUrl) {
      throw new Error('No GTFS data available for Ghana');
    }

    const response = await firstValueFrom(
      this.httpService.get(`${gtfsUrl}/stops.txt`, { timeout: 15000 }),
    );

    return this.parseGTFSStops(response.data, type);
  }

  // ===== PARSING METHODS =====

  private parseOverpassStops(data: any): TransportStop[] {
    const stops: TransportStop[] = [];

    if (data.elements) {
      for (const element of data.elements) {
        if (
          element.type === 'node' &&
          (element.tags?.public_transport ||
            element.tags?.highway === 'bus_stop')
        ) {
          const stop: TransportStop = {
            id: element.id?.toString(),
            name: element.tags.name || 'Unnamed Stop',
            coordinates: [element.lat, element.lon],
            type: element.tags.public_transport || 'bus_stop',
          };
          stops.push(stop);
        }
      }
    }

    return stops;
  }

  private parseGTFSStops(data: string, type?: string): TransportStop[] {
    const lines = data.split('\n');
    const headers = lines[0].split(',');
    const stops: TransportStop[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      if (values.length >= headers.length) {
        const stop: TransportStop = {
          id: values[0], // stop_id
          name: values[2], // stop_name
          coordinates: [parseFloat(values[4]), parseFloat(values[5])], // stop_lat, stop_lon
          type: 'bus_stop',
        };

        // Filter by type if specified
        if (!type || stop.type === type) {
          stops.push(stop);
        }
      }
    }

    return stops;
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
}
