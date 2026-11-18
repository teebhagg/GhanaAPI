import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { firstValueFrom } from 'rxjs';
import { queryOverpass } from '../../common/overpass/overpass-client';
import { ServiceHealth } from '../../common/health/service-health';
import {
  summariseSources,
  UpstreamFailure,
} from '../../common/health/upstream-failure';
import { LastGoodCache } from '../../common/resilience/last-good-cache';

/**
 * Stop types a caller may filter by. These are the types that can occur in the
 * data we fetch: the value of the OSM public_transport tag, or 'bus_stop' for
 * a plain highway=bus_stop node.
 */
export const ALLOWED_STOP_TYPES = [
  'bus_stop',
  'stop_position',
  'platform',
  'station',
];

/** Cities we have a bounding box for. Anything else is rejected, not guessed. */
export const ALLOWED_CITIES = ['accra', 'kumasi', 'tamale', 'takoradi'];

export interface TransportStop {
  id?: string;
  name: string;
  coordinates: [number, number];
  type: string;
  routes?: string[];
}

@Injectable()
export class TransportStopsService implements OnModuleInit {
  private readonly logger = new Logger(TransportStopsService.name);
  private readonly transportApis = ['overpass', 'gtfs'];

  // Stops change rarely. Fresh for a day; if the upstream fails, the last good
  // list is served for up to a week. Failures are not retried for 10 minutes,
  // but a city with no list at all retries after 1 minute: a single slow
  // Overpass response must not leave users with a 503 for 10 minutes.
  private activeSweep: Promise<void> | null = null;

  private readonly stopsCache = new LastGoodCache<TransportStop[]>({
    label: 'Transport stops',
    freshMs: 24 * 60 * 60 * 1000,
    maxStaleMs: 7 * 24 * 60 * 60 * 1000,
    backoffMs: 10 * 60 * 1000,
    noDataBackoffMs: 60 * 1000,
  });

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Warm every city in the background at startup. The cache is in memory, so
   * a restart starts empty; this runs without blocking the app from starting.
   */
  onModuleInit(): void {
    // Tests and CI must not send live Overpass queries when the app boots.
    if (process.env.NODE_ENV === 'test') return;
    void this.refreshAllCities();
  }

  /** Daily refresh at 04:00 so most requests are served from memory. */
  @Cron('0 0 4 * * *')
  scheduledRefresh(): Promise<void> {
    // The e2e suite boots the scheduler too; it must not query Overpass.
    if (process.env.NODE_ENV === 'test') return Promise.resolve();
    return this.refreshAllCities();
  }

  /**
   * Refresh every city, one at a time. Startup and the daily run share one
   * sweep, so they never overlap and send duplicate queries.
   */
  refreshAllCities(): Promise<void> {
    if (!this.activeSweep) {
      this.activeSweep = (async () => {
        for (const city of ALLOWED_CITIES) {
          await this.stopsCache.refresh(city, () => this.fetchStops(city));
        }
      })().finally(() => {
        this.activeSweep = null;
      });
    }
    return this.activeSweep;
  }

  /** For the /status endpoint. Never contacts Overpass. */
  getHealth(): ServiceHealth {
    const { status, asOf, lastFailure } = this.stopsCache.health();
    return {
      status,
      asOf: asOf ? asOf.toISOString() : null,
      ...(lastFailure && { lastFailure }),
      detail:
        status === 'unhealthy'
          ? 'The last fetch of transport stops failed and there is no usable list'
          : status === 'degraded'
            ? 'The last fetch of transport stops failed; serving the last good list'
            : asOf
              ? undefined
              : 'No transport stops requested since the server started',
    };
  }

  async getTransportStops(
    city: string = 'accra',
    type?: string,
  ): Promise<TransportStop[]> {
    // Reject unknown types instead of silently returning nothing. The type is
    // never placed in the Overpass query.
    if (type !== undefined && !ALLOWED_STOP_TYPES.includes(type)) {
      throw new BadRequestException(
        `Invalid stop type. Allowed values: ${ALLOWED_STOP_TYPES.join(', ')}`,
      );
    }

    const cityKey = city.toLowerCase();
    if (!ALLOWED_CITIES.includes(cityKey)) {
      throw new BadRequestException(
        `Unsupported city. Allowed values: ${ALLOWED_CITIES.join(', ')}`,
      );
    }

    // One cached list per city. The type is applied here, never sent to
    // Overpass, so 4 cities mean at most 4 upstream queries however many
    // types are requested.
    const { data } = await this.stopsCache.get(cityKey, () =>
      this.fetchStops(cityKey),
    );
    return type ? data.filter((stop) => stop.type === type) : data;
  }

  private async fetchStops(city: string): Promise<TransportStop[]> {
    const failures: Array<{ source: string; error: unknown }> = [];
    for (const api of this.transportApis) {
      try {
        this.logger.log(`Trying to get transport stops from ${api}`);

        let stops: TransportStop[];
        switch (api) {
          case 'overpass':
            stops = await this.getStopsFromOverpass(city);
            break;
          case 'gtfs':
            stops = await this.getStopsFromGTFS(city);
            break;
          default:
            continue;
        }
        // An empty list for a city is an outage, not an answer. Do not cache
        // it for a day or let it replace the last good list.
        if (stops.length === 0) {
          throw new UpstreamFailure(`${api} returned no stops`);
        }
        return stops;
      } catch (error) {
        this.logger.warn(`${api} failed: ${error.message}`);
        failures.push({ source: api, error });
        continue;
      }
    }

    // Keep why each source failed, for /status
    throw new HttpException(
      'All transport stops APIs failed',
      HttpStatus.SERVICE_UNAVAILABLE,
      { cause: summariseSources(failures) },
    );
  }

  private async getStopsFromOverpass(city: string): Promise<TransportStop[]> {
    const bbox = this.getCityBoundingBox(city);

    const query = `
      [out:json][timeout:90];
      (
        node["public_transport"~"stop_position|platform|station"](${bbox});
        node["highway"="bus_stop"](${bbox});
        node["amenity"="bus_station"](${bbox});
      );
      out;
    `;

    const data = await queryOverpass(query);
    return this.parseOverpassStops(data);
  }

  private async getStopsFromGTFS(city: string): Promise<TransportStop[]> {
    const gtfsUrl = this.configService.get<string>('GHANA_GTFS_URL');
    if (!gtfsUrl) {
      throw new UpstreamFailure('No GTFS data available for Ghana');
    }

    const response = await firstValueFrom(
      this.httpService.get(`${gtfsUrl}/stops.txt`, { timeout: 15000 }),
    );

    // A feed can cover the whole country. Keep only this city's stops, so a
    // failed Kumasi fetch can never fall back to Accra stops.
    const [south, west, north, east] = this.getCityBoundingBox(city)
      .split(',')
      .map(Number);
    return this.parseGTFSStops(response.data).filter(
      ({ coordinates: [lat, lng] }) =>
        lat >= south && lat <= north && lng >= west && lng <= east,
    );
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

  private parseGTFSStops(data: string): TransportStop[] {
    const lines = data.split('\n');
    const headers = lines[0].split(',');
    const stops: TransportStop[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      if (values.length >= headers.length) {
        stops.push({
          id: values[0], // stop_id
          name: values[2], // stop_name
          coordinates: [parseFloat(values[4]), parseFloat(values[5])], // stop_lat, stop_lon
          type: 'bus_stop',
        });
      }
    }

    return stops;
  }

  // ===== HELPER METHODS =====

  /** Known city name, or the default. Keeps cache keys to a small fixed set. */
  private getCityBoundingBox(city: string): string {
    const boxes = {
      accra: '5.4000,-0.4000,5.8000,0.2000',
      kumasi: '6.6000,-1.8000,6.8000,-1.4000',
      tamale: '9.2000,-1.2000,9.6000,-0.8000',
      takoradi: '4.8000,-2.0000,5.0000,-1.6000',
    };

    return boxes[city.toLowerCase()];
  }
}
