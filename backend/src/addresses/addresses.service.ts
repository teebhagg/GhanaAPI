import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import type { Cache } from 'cache-manager';
import { AddressValidationDto } from './dto/address-validation.dto';
import { AddressDto } from './dto/address.dto';
import { StandardizedAddressDto } from './dto/standardized-address.dto';
import { Logger } from '@nestjs/common';

@Injectable()
export class AddressesService {
  private readonly logger = new Logger(AddressesService.name);
  private readonly digitalCodeRegex = /^[A-Z]{2,3}-\d{3}-\d{4}$/;
  private readonly nominatim = 'https://nominatim.openstreetmap.org';
  private readonly nominatimReverse = `${this.nominatim}/reverse`;
  private readonly openRouteServiceAutocomplete =
    'https://api.openrouteservice.org/geocode/autocomplete';
  private readonly openRouteServiceReverse =
    'https://api.openrouteservice.org/geocode/reverse';
  private readonly ua = process.env.NOMINATIM_USER_AGENT || 'GhanaAPI/1.0';
  private readonly orsApiKey: string | undefined;

  constructor(
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    private readonly configService: ConfigService,
  ) {
    this.orsApiKey = this.configService.get<string>('OPEN_ROUTE_API_KEY');
  }

  validateDigitalCode(code: string): AddressValidationDto {
    const digitalCode = code.toUpperCase().trim();
    const isValid = this.digitalCodeRegex.test(digitalCode);

    // No official Ghana Post API in MVP; return format-based validation only.
    return { isValid, digitalCode };
  }

  async lookupByCoordinates(
    lat: number,
    lng: number,
  ): Promise<AddressDto | null> {
    const key = `addr:rev:${lat}:${lng}`;
    const cached = await this.cache.get<AddressDto | null>(key);
    if (cached) return cached;

    const [nominatimResult, orsResult] = await Promise.allSettled([
      this.lookupWithNominatim(lat, lng),
      this.lookupCoordinatesWithOpenRouteService(lat, lng),
    ]);

    const items: AddressDto[] = [];
    if (nominatimResult.status === 'fulfilled' && nominatimResult.value)
      items.push(nominatimResult.value);
    if (orsResult.status === 'fulfilled' && orsResult.value)
      items.push(orsResult.value);

    const uniqueItems = this.deduplicateAddresses(items);

    this.logger.log(uniqueItems);

    await this.cache.set(key, uniqueItems, 24 * 60 * 60);
    return uniqueItems[0] ?? null;
  }

  async searchAddresses(query: string): Promise<AddressDto[]> {
    const q = query.trim();
    if (!q) return [];

    const key = `addr:search:${q}`;
    const cached = await this.cache.get<AddressDto[]>(key);
    if (cached) return cached;

    // Search from both Nominatim and OpenRouteService in parallel
    const [nominatimResults, orsResults] = await Promise.allSettled([
      this.searchWithNominatim(q),
      this.searchWithOpenRouteService(q),
    ]);

    const items: AddressDto[] = [];

    // Add Nominatim results
    if (nominatimResults.status === 'fulfilled') {
      items.push(...nominatimResults.value);
    }

    // Add OpenRouteService results
    if (orsResults.status === 'fulfilled') {
      items.push(...orsResults.value);
    }

    // Remove duplicates based on coordinates and address
    const uniqueItems = this.deduplicateAddresses(items);

    await this.cache.set(key, uniqueItems, 24 * 60 * 60);
    return uniqueItems;
  }

  private async searchWithNominatim(query: string): Promise<AddressDto[]> {
    try {
      const url = `${this.nominatim}/search?q=${encodeURIComponent(
        query,
      )}&format=json&addressdetails=1&limit=20&countrycodes=gh`;
      const res = await axios.get(url, {
        headers: { 'User-Agent': this.ua, 'Accept-Language': 'en' },
      });
      const arr = Array.isArray(res.data) ? res.data : [];

      return arr.map(
        (row: {
          display_name: string;
          lat: string;
          lon: string;
          address: { postcode: string };
        }) => ({
          digitalCode: '',
          addressLine1: row.display_name || '',
          addressLine2: '',
          latitude: Number(row.lat),
          longitude: Number(row.lon),
          postalCode: row.address?.postcode,
        }),
      );
    } catch {
      return [];
    }
  }

  private async searchWithOpenRouteService(
    query: string,
  ): Promise<AddressDto[]> {
    if (!this.orsApiKey) {
      return [];
    }

    try {
      const url = `${this.openRouteServiceAutocomplete}?api_key=${this.orsApiKey}&text=${encodeURIComponent(
        query,
      )}&boundary.country=GH`;
      const res = await axios.get(url, {
        headers: { Accept: 'application/json' },
      });

      const data = res.data as {
        features?: Array<{
          properties: {
            name: string;
            label: string;
            country?: string;
            region?: string;
            locality?: string;
            postalcode?: string;
          };
          geometry: {
            coordinates: [number, number]; // [longitude, latitude]
          };
        }>;
      };

      if (!data.features || !Array.isArray(data.features)) {
        return [];
      }

      return data.features.map((feature) => ({
        digitalCode: '',
        addressLine1: feature.properties.label || feature.properties.name || '',
        addressLine2: feature.properties.locality
          ? `${feature.properties.locality}${feature.properties.region ? `, ${feature.properties.region}` : ''}`
          : '',
        latitude: feature.geometry.coordinates[1],
        longitude: feature.geometry.coordinates[0],
        postalCode: feature.properties.postalcode,
      }));
    } catch {
      return [];
    }
  }

  private async lookupCoordinatesWithOpenRouteService(
    lat: number,
    lng: number,
  ): Promise<AddressDto | null> {
    const url = `${this.openRouteServiceReverse}?api_key=${this.orsApiKey}&point.lat=${lat}&point.lon=${lng}&boundary.country=GH`;
    const res = await axios.get(url, {
      headers: { Accept: 'application/json' },
    });
    const data = res.data as {
      features?: Array<{
        properties: {
          name: string;
          label: string;
        };
      }>;
    };

    this.logger.log(data);

    return {
      digitalCode: '',
      addressLine1: data.features?.[0]?.properties.name || '',
      addressLine2: '',
      latitude: lat,
      longitude: lng,
      postalCode: '',
    };
  }

  private async lookupWithNominatim(
    lat: number,
    lng: number,
  ): Promise<AddressDto | null> {
    const url = `${this.nominatimReverse}?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;
    const res = await axios.get(url, {
      headers: { 'User-Agent': this.ua, 'Accept-Language': 'en' },
    });
    const data = res.data as {
      display_name: string;
      lat: string;
      lon: string;
      address: { postcode: string };
    };
    if (!data) return null;

    const result: AddressDto = {
      digitalCode: '', // Unknown without Ghana Post API
      addressLine1: data.display_name || '',
      addressLine2: '',
      latitude: Number(data.lat),
      longitude: Number(data.lon),
      postalCode: data.address?.postcode,
    };

    this.logger.log(result);

    return result;
  }

  private deduplicateAddresses(addresses: AddressDto[]): AddressDto[] {
    const seen = new Set<string>();
    const unique: AddressDto[] = [];

    for (const addr of addresses) {
      // Create a key based on coordinates (rounded to 4 decimal places) and address
      const coordKey = `${addr.latitude.toFixed(4)},${addr.longitude.toFixed(4)}`;
      const addressKey = addr.addressLine1.toLowerCase().trim();
      const key = `${coordKey}:${addressKey}`;

      if (!seen.has(key)) {
        seen.add(key);
        unique.push(addr);
      }
    }

    return unique;
  }

  standardizeAddress(rawAddress: string): StandardizedAddressDto {
    const cleaned = rawAddress.replace(/\s+/g, ' ').trim();
    // Look for digital code pattern anywhere in the string (remove ^ and $ anchors)
    const digitalCodePattern = /[A-Z]{2,3}-\d{3}-\d{4}/;
    const match = cleaned.toUpperCase().match(digitalCodePattern);
    const digitalCode = match ? match[0] : undefined;

    return {
      digitalCode,
      addressLine1: cleaned,
    };
  }
}
