import { Injectable, Logger } from '@nestjs/common';
import { BankSearchResponseDto } from './dto/bank-search-response.dto';
import { BankSearchQueryDto } from './dto/bank-search.dto';
import { BankDto } from './dto/bank.dto';
import { ATMLocation, Bank } from './entities/bank.entity';
import { BankDataProviderService } from './services/bank-data-provider.service';

@Injectable()
export class BankingService {
  private readonly logger = new Logger(BankingService.name);

  constructor(private readonly bankDataProvider: BankDataProviderService) {}

  /**
   * Search for banks and ATMs based on query parameters
   */
  async searchBanks(query: BankSearchQueryDto): Promise<BankSearchResponseDto> {
    this.logger.log(`Searching banks with query: ${JSON.stringify(query)}`);

    try {
      // Get all banking facilities
      const allBanks = await this.bankDataProvider.getBanks();
      const allATMs = await this.bankDataProvider.getATMs();

      // Combine and filter based on type
      let facilities: (Bank | ATMLocation)[] = [];

      if (query.type === 'bank' || query.type === 'both') {
        facilities.push(...allBanks.filter((b) => b.type === 'bank'));
      }

      if (query.type === 'atm' || query.type === 'both') {
        facilities.push(...allBanks.filter((b) => b.type === 'atm'));
        facilities.push(...allATMs.map((atm) => this.atmToBank(atm)));
      }

      // Apply text search filter
      if (query.q) {
        const searchTerm = query.q.toLowerCase();
        facilities = facilities.filter(
          (facility) =>
            facility.name.toLowerCase().includes(searchTerm) ||
            (facility.address &&
              facility.address.toLowerCase().includes(searchTerm)) ||
            (facility.city &&
              facility.city.toLowerCase().includes(searchTerm)) ||
            ((facility as Bank).code &&
              (facility as Bank).code?.toLowerCase().includes(searchTerm)),
        );
      }

      // Apply location filter
      if (query.lat && query.lng) {
        facilities = facilities
          .map((facility) => ({
            ...facility,
            distance: this.calculateDistance(
              query.lat!,
              query.lng!,
              facility.latitude,
              facility.longitude,
            ),
          }))
          .filter((facility) => facility.distance <= (query.radius || 5))
          .sort((a, b) => a.distance - b.distance);
      }

      // Apply limit
      const limitedFacilities = facilities.slice(0, query.limit || 20);

      // Convert to DTOs
      const bankDtos: BankDto[] = limitedFacilities.map((facility) => {
        // Convert ATM to Bank if necessary
        if ('bank' in facility) {
          facility = this.atmToBank(facility);
        }
        return this.toBankDto(facility as Bank & { distance?: number });
      });

      const response: BankSearchResponseDto = {
        success: true,
        data: bankDtos,
        total: bankDtos.length,
        searchParams: {
          query: query.q,
          location:
            query.lat && query.lng
              ? {
                  lat: query.lat,
                  lng: query.lng,
                  radius: query.radius || 5,
                }
              : undefined,
          type: query.type || 'both',
          limit: query.limit || 20,
        },
        source: 'OpenStreetMap + Static Directory',
        timestamp: new Date().toISOString(),
      };

      this.logger.log(`Found ${bankDtos.length} banking facilities`);
      return response;
    } catch (error) {
      this.logger.error('Error searching banks:', error);
      throw new Error(`Failed to search banks: ${error.message}`);
    }
  }

  /**
   * Get all banks (no ATMs)
   */
  async getAllBanks(): Promise<BankDto[]> {
    const allBanks = await this.bankDataProvider.getBanks();
    return allBanks
      .filter((bank) => bank.type === 'bank')
      .map((bank) => this.toBankDto(bank));
  }

  /**
   * Get all ATMs
   */
  async getAllATMs(): Promise<BankDto[]> {
    const allBanks = await this.bankDataProvider.getBanks();
    const allATMs = await this.bankDataProvider.getATMs();

    const atmBanks = allBanks.filter((bank) => bank.type === 'atm');
    const atmLocations = allATMs.map((atm) => this.atmToBank(atm));

    return [...atmBanks, ...atmLocations].map((atm) => this.toBankDto(atm));
  }

  /**
   * Get banks by region
   */
  async getBanksByRegion(region: string): Promise<BankDto[]> {
    const allBanks = await this.bankDataProvider.getBanks();
    return allBanks
      .filter(
        (bank) =>
          bank.region.toLowerCase().includes(region.toLowerCase()) ||
          bank.region.toLowerCase() === region.toLowerCase(),
      )
      .map((bank) => this.toBankDto(bank));
  }

  /**
   * Get banks by city
   */
  async getBanksByCity(city: string): Promise<BankDto[]> {
    const allBanks = await this.bankDataProvider.getBanks();
    return allBanks
      .filter(
        (bank) =>
          bank.city.toLowerCase().includes(city.toLowerCase()) ||
          bank.city.toLowerCase() === city.toLowerCase(),
      )
      .map((bank) => this.toBankDto(bank));
  }

  /**
   * Find nearest banks/ATMs to a location
   */
  async getNearestBanks(
    lat: number,
    lng: number,
    radius: number = 5,
    limit: number = 10,
  ): Promise<BankDto[]> {
    const searchQuery: BankSearchQueryDto = {
      lat,
      lng,
      radius,
      limit,
      type: 'both',
    };

    const response = await this.searchBanks(searchQuery);
    return response.data;
  }

  /**
   * Convert ATM to Bank interface for unified handling
   */
  private atmToBank(atm: ATMLocation): Bank {
    return {
      id: atm.id,
      name: atm.name,
      type: 'atm',
      address: atm.address,
      city: atm.city,
      region: atm.region,
      latitude: atm.latitude,
      longitude: atm.longitude,
      services: atm.services,
      branchInfo: {
        is24Hours: atm.is24Hours,
        hasATM: true,
      },
    };
  }

  /**
   * Convert Bank/ATM to BankDto
   */
  private toBankDto(facility: Bank & { distance?: number }): BankDto {
    return {
      id: facility.id,
      name: facility.name,
      type: facility.type,
      code: facility.code,
      address: facility.address,
      city: facility.city,
      region: facility.region,
      latitude: facility.latitude,
      longitude: facility.longitude,
      phone: facility.phone,
      email: facility.email,
      website: facility.website,
      operatingHours: facility.operatingHours,
      services: facility.services,
      distance: facility.distance,
      branchInfo: facility.branchInfo,
    };
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(value: number): number {
    return (value * Math.PI) / 180;
  }
}
