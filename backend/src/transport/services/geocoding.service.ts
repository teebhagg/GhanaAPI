import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { queryOverpass } from '../../common/overpass/overpass-client';
import { GeocodingResult } from '../dto/route-directions.dto';

/**
 * The name is placed inside a quoted Overpass regex. Each quote, backslash or
 * regex metacharacter becomes "." (any one character), so the text cannot end
 * the string or change the query, and no backslash escapes are needed.
 * "St. Mary's (Old)" still matches itself.
 */
export function toOverpassNamePattern(value: string): string {
  return value.replace(/[\\^$.|?*+()[\]{}"]/g, '.');
}

// Per instance. The shared client tries three instances in turn, so the
// worst case is about 3 x 8 s instead of 3 x 20 s inside a user request.
const OVERPASS_GEOCODE_TIMEOUT_MS = 8_000;

@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);
  private readonly geocodingApis = ['nominatim', 'overpass'];

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async geocodeLocation(locationName: string): Promise<GeocodingResult> {
    for (const api of this.geocodingApis) {
      try {
        this.logger.log(`Trying to geocode "${locationName}" using ${api}`);

        switch (api) {
          case 'overpass':
            return await this.geocodeWithOverpass(locationName);
          case 'nominatim':
            return await this.geocodeWithNominatim(locationName);
          default:
            continue;
        }
      } catch (error) {
        this.logger.warn(`${api} geocoding failed: ${error.message}`);
        continue;
      }
    }

    throw new HttpException(
      `Could not find coordinates for location: ${locationName}`,
      HttpStatus.NOT_FOUND,
    );
  }

  private async geocodeWithNominatim(
    locationName: string,
  ): Promise<GeocodingResult> {
    const userAgent =
      this.configService.get<string>('NOMINATIM_USER_AGENT') || 'GhanaAPI/1.0';
    const url = 'https://nominatim.openstreetmap.org/search';

    const params = {
      q: `${locationName}, Ghana`,
      format: 'json',
      limit: 1,
      countrycodes: 'gh',
      addressdetails: 1,
    };

    const response = await firstValueFrom(
      this.httpService.get(url, {
        params,
        headers: { 'User-Agent': userAgent },
        timeout: 15000,
      }),
    );

    if (!response.data || response.data.length === 0) {
      throw new Error(`No results found for: ${locationName}`);
    }

    const result = response.data[0];
    return {
      coordinates: [parseFloat(result.lat), parseFloat(result.lon)],
      display_name: result.display_name,
      importance: result.importance,
      place_type: result.type,
    };
  }

  private async geocodeWithOverpass(
    locationName: string,
  ): Promise<GeocodingResult> {
    // Use Overpass API to search for named places in Ghana
    const name = toOverpassNamePattern(locationName);
    const query = `
      [out:json][timeout:8];
      (
        node["name"~"${name}",i]["place"~"city|town|village"](country:GH);
        way["name"~"${name}",i]["place"~"city|town|village"](country:GH);
        relation["name"~"${name}",i]["place"~"city|town|village"](country:GH);
      );
      out center;
    `;

    const data = await queryOverpass(query, OVERPASS_GEOCODE_TIMEOUT_MS);

    if (!data.elements || data.elements.length === 0) {
      throw new Error(`No results found for: ${locationName}`);
    }

    const element = data.elements[0];
    const lat = element.lat || element.center?.lat;
    const lon = element.lon || element.center?.lon;

    if (!lat || !lon) {
      throw new Error(`Could not extract coordinates for: ${locationName}`);
    }

    return {
      coordinates: [lat, lon],
      display_name: element.tags?.name || locationName,
      place_type: element.tags?.place,
    };
  }
}
