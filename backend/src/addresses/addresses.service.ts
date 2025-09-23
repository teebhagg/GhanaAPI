import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import axios from 'axios';
import type { Cache } from 'cache-manager';
import { AddressValidationDto } from './dto/address-validation.dto';
import { AddressDto } from './dto/address.dto';
import { StandardizedAddressDto } from './dto/standardized-address.dto';

@Injectable()
export class AddressesService {
  private readonly digitalCodeRegex = /^[A-Z]{2,3}-\d{3}-\d{4}$/;
  private readonly nominatim = 'https://nominatim.openstreetmap.org';
  private readonly ua = process.env.NOMINATIM_USER_AGENT || 'GhanaAPI/1.0';

  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

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

    const url = `${this.nominatim}/reverse?lat=${encodeURIComponent(
      lat,
    )}&lon=${encodeURIComponent(lng)}&format=json&addressdetails=1`;
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

    const dto: AddressDto = {
      digitalCode: '', // Unknown without Ghana Post API
      addressLine1: data.display_name || '',
      addressLine2: '',
      latitude: Number(data.lat),
      longitude: Number(data.lon),
      postalCode: data.address?.postcode,
    };

    await this.cache.set(key, dto, 24 * 60 * 60);
    return dto;
  }

  async searchAddresses(query: string): Promise<AddressDto[]> {
    const q = query.trim();
    if (!q) return [];

    const key = `addr:search:${q}`;
    const cached = await this.cache.get<AddressDto[]>(key);
    if (cached) return cached;

    const url = `${this.nominatim}/search?q=${encodeURIComponent(
      q,
    )}&format=json&addressdetails=1&limit=20&countrycodes=gh`;
    const res = await axios.get(url, {
      headers: { 'User-Agent': this.ua, 'Accept-Language': 'en' },
    });
    const arr = Array.isArray(res.data) ? res.data : [];

    const items: AddressDto[] = arr.map(
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

    await this.cache.set(key, items, 24 * 60 * 60);
    return items;
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
