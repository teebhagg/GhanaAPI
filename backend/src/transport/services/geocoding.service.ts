import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { GeocodingResult } from '../dto/route-directions.dto';

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
    const query = `
      [out:json][timeout:15];
      (
        node["name"~"${locationName}",i]["place"~"city|town|village"](country:GH);
        way["name"~"${locationName}",i]["place"~"city|town|village"](country:GH);
        relation["name"~"${locationName}",i]["place"~"city|town|village"](country:GH);
      );
      out center;
    `;

    const url = 'https://overpass-api.de/api/interpreter';
    const response = await firstValueFrom(
      this.httpService.post(url, query, {
        headers: { 'Content-Type': 'text/plain' },
        timeout: 20000,
      }),
    );

    if (!response.data.elements || response.data.elements.length === 0) {
      throw new Error(`No results found for: ${locationName}`);
    }

    const element = response.data.elements[0];
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
