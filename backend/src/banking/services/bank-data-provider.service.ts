import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ATMLocation, Bank } from '../entities/bank.entity';

@Injectable()
export class BankDataProviderService {
  private readonly logger = new Logger(BankDataProviderService.name);
  private banksCache: Bank[] | null = null;
  private atmCache: ATMLocation[] | null = null;
  private cacheExpiry: Date | null = null;
  private readonly cacheValidityHours = 24;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Get banks and ATMs from multiple data sources
   */
  async getBanks(): Promise<Bank[]> {
    if (this.banksCache && this.isCacheValid()) {
      this.logger.log('Returning cached bank data');
      return this.banksCache;
    }

    this.logger.log('Fetching fresh bank data from multiple sources');
    const banks: Bank[] = [];

    // Get data from multiple sources
    try {
      const [bogBanks, osmBanks] = await Promise.allSettled([
        this.getBanksFromBankOfGhana(),
        this.getBanksFromOpenStreetMap(),
      ]);

      if (bogBanks.status === 'fulfilled') {
        banks.push(...bogBanks.value);
      } else {
        this.logger.warn(
          'Failed to get banks from Bank of Ghana:',
          bogBanks.reason,
        );
      }

      if (osmBanks.status === 'fulfilled') {
        banks.push(...osmBanks.value);
      } else {
        this.logger.warn(
          'Failed to get banks from OpenStreetMap:',
          osmBanks.reason,
        );
      }

      // Add fallback static data if no external data available
      if (banks.length === 0) {
        banks.push(...this.getFallbackBankData());
      }

      // Deduplicate and enrich data
      const uniqueBanks = this.deduplicateBanks(banks);
      this.banksCache = uniqueBanks;
      this.cacheExpiry = new Date(
        Date.now() + this.cacheValidityHours * 60 * 60 * 1000,
      );

      this.logger.log(
        `Successfully loaded ${uniqueBanks.length} banking facilities`,
      );
      return uniqueBanks;
    } catch (error) {
      this.logger.error('Error fetching bank data:', error);
      return this.getFallbackBankData();
    }
  }

  /**
   * Get ATM locations
   */
  async getATMs(): Promise<ATMLocation[]> {
    if (this.atmCache && this.isCacheValid()) {
      this.logger.log('Returning cached ATM data');
      return this.atmCache;
    }

    this.logger.log('Fetching fresh ATM data');
    const atms: ATMLocation[] = [];

    try {
      const [osmATMs, staticATMs] = await Promise.allSettled([
        this.getATMsFromOpenStreetMap(),
        this.getFallbackATMData(),
      ]);

      if (osmATMs.status === 'fulfilled') {
        atms.push(...osmATMs.value);
      }

      if (staticATMs.status === 'fulfilled') {
        atms.push(...staticATMs.value);
      }

      const uniqueATMs = this.deduplicateATMs(atms);
      this.atmCache = uniqueATMs;

      this.logger.log(`Successfully loaded ${uniqueATMs.length} ATM locations`);
      return uniqueATMs;
    } catch (error) {
      this.logger.error('Error fetching ATM data:', error);
      return this.getFallbackATMData();
    }
  }

  /**
   * Get banks from Bank of Ghana directory (if available)
   */
  private async getBanksFromBankOfGhana(): Promise<Bank[]> {
    try {
      // Bank of Ghana doesn't have a public API, but we could scrape their directory
      // For now, return empty and rely on other sources
      this.logger.log('Bank of Ghana API not available, using other sources');
      return [];
    } catch (error) {
      this.logger.warn('Failed to fetch from Bank of Ghana:', error.message);
      return [];
    }
  }

  /**
   * Get banks and ATMs from OpenStreetMap Overpass API
   */
  private async getBanksFromOpenStreetMap(): Promise<Bank[]> {
    try {
      const query = `
        [out:json][timeout:25];
        area["name"="Ghana"]->.searchArea;
        (
          node["amenity"="bank"](area.searchArea);
          node["amenity"="atm"](area.searchArea);
          way["amenity"="bank"](area.searchArea);
          way["amenity"="atm"](area.searchArea);
        );
        out geom;
      `;

      const response = await axios.post(
        'https://overpass-api.de/api/interpreter',
        query,
        {
          headers: { 'Content-Type': 'text/plain' },
          timeout: 30000,
        },
      );

      const data = response.data;
      const banks: Bank[] = [];

      for (const element of data.elements) {
        if (element.lat && element.lon && element.tags) {
          const bank = this.mapOSMElementToBank(element);
          if (bank) {
            banks.push(bank);
          }
        }
      }

      this.logger.log(`Fetched ${banks.length} facilities from OpenStreetMap`);
      return banks;
    } catch (error) {
      this.logger.warn('Failed to fetch from OpenStreetMap:', error.message);
      return [];
    }
  }

  /**
   * Get ATMs specifically from OpenStreetMap
   */
  private async getATMsFromOpenStreetMap(): Promise<ATMLocation[]> {
    try {
      const query = `
        [out:json][timeout:25];
        (
          node["amenity"="atm"]["addr:country"="GH"];
          way["amenity"="atm"]["addr:country"="GH"];
        );
        out geom;
      `;

      const response = await axios.post(
        'https://overpass-api.de/api/interpreter',
        query,
        {
          headers: { 'Content-Type': 'text/plain' },
          timeout: 30000,
        },
      );

      const data = response.data;
      const atms: ATMLocation[] = [];

      for (const element of data.elements) {
        if (element.lat && element.lon && element.tags) {
          const atm = this.mapOSMElementToATM(element);
          if (atm) {
            atms.push(atm);
          }
        }
      }

      this.logger.log(`Fetched ${atms.length} ATMs from OpenStreetMap`);
      return atms;
    } catch (error) {
      this.logger.warn(
        'Failed to fetch ATMs from OpenStreetMap:',
        error.message,
      );
      return [];
    }
  }

  /**
   * Map OpenStreetMap element to Bank
   */
  private mapOSMElementToBank(element: any): Bank | null {
    const tags = element.tags;

    if (!tags.name && !tags.brand && !tags.operator) {
      return null;
    }

    const name = tags.name || tags.brand || tags.operator || 'Unknown Bank';
    const type = tags.amenity === 'atm' ? 'atm' : 'bank';

    // Extract address components
    const address = this.buildAddressFromOSM(tags);
    const city = tags['addr:city'] || tags['addr:suburb'] || 'Unknown';
    const region =
      tags['addr:state'] ||
      tags['addr:region'] ||
      this.getRegionFromCoordinates(element.lat, element.lon);

    return {
      id: `osm-${element.id}`,
      name,
      type,
      code: tags.ref || tags.code,
      address,
      city,
      region,
      latitude: element.lat,
      longitude: element.lon,
      phone: tags.phone || tags['contact:phone'],
      email: tags.email || tags['contact:email'],
      website: tags.website || tags['contact:website'],
      operatingHours: tags.opening_hours,
      services: this.parseServicesFromOSM(tags),
      branchInfo: {
        hasATM: tags.atm === 'yes' || type === 'atm',
        is24Hours: tags['24/7'] === 'yes',
      },
    };
  }

  /**
   * Map OpenStreetMap element to ATM
   */
  private mapOSMElementToATM(element: any): ATMLocation | null {
    const tags = element.tags;

    const name = tags.name || tags.brand || tags.operator || 'ATM';
    const bank = tags.operator || tags.brand || 'Unknown Bank';

    const address = this.buildAddressFromOSM(tags);
    const city = tags['addr:city'] || tags['addr:suburb'] || 'Unknown';
    const region =
      tags['addr:state'] ||
      tags['addr:region'] ||
      this.getRegionFromCoordinates(element.lat, element.lon);

    return {
      id: `osm-atm-${element.id}`,
      name,
      bank,
      address,
      city,
      region,
      latitude: element.lat,
      longitude: element.lon,
      is24Hours: tags['24/7'] === 'yes',
      services: this.parseServicesFromOSM(tags),
      network: this.parseNetworkFromOSM(tags),
      lastChecked: new Date(),
    };
  }

  /**
   * Build address string from OSM tags
   */
  private buildAddressFromOSM(tags: any): string {
    const parts = [
      tags['addr:housenumber'],
      tags['addr:street'],
      tags['addr:suburb'],
      tags['addr:city'],
    ].filter(Boolean);

    return parts.join(', ') || 'Address not available';
  }

  /**
   * Parse services from OSM tags
   */
  private parseServicesFromOSM(tags: any): string[] {
    const services: string[] = [];

    if (tags.atm === 'yes') services.push('ATM');
    if (tags.currency_exchange === 'yes') services.push('Currency Exchange');
    if (tags.safe_deposit_box === 'yes') services.push('Safe Deposit Box');
    if (tags.wheelchair === 'yes') services.push('Wheelchair Accessible');

    return services;
  }

  /**
   * Parse network from OSM tags for ATMs
   */
  private parseNetworkFromOSM(tags: any): string[] {
    const networks: string[] = [];

    if (tags.network) {
      networks.push(...tags.network.split(';').map((n: string) => n.trim()));
    }

    // Common networks in Ghana
    if (tags.visa === 'yes') networks.push('Visa');
    if (tags.mastercard === 'yes') networks.push('MasterCard');
    if (tags.ghipss === 'yes') networks.push('GhIPSS');

    return networks.length > 0 ? networks : ['GhIPSS']; // Default to GhIPSS
  }

  /**
   * Determine region from coordinates
   */
  private getRegionFromCoordinates(lat: number, lon: number): string {
    // Simple mapping based on coordinate ranges
    // Greater Accra Region
    if (lat >= 5.3 && lat <= 5.8 && lon >= -0.5 && lon <= 0.2) {
      return 'Greater Accra';
    }
    // Ashanti Region
    if (lat >= 6.2 && lat <= 7.5 && lon >= -2.5 && lon <= -0.5) {
      return 'Ashanti';
    }
    // Default
    return 'Unknown Region';
  }

  /**
   * Remove duplicate banks based on name and location proximity
   */
  private deduplicateBanks(banks: Bank[]): Bank[] {
    const unique: Bank[] = [];

    for (const bank of banks) {
      const isDuplicate = unique.some((existing) =>
        this.areBanksSimilar(bank, existing),
      );

      if (!isDuplicate) {
        unique.push(bank);
      }
    }

    return unique;
  }

  /**
   * Remove duplicate ATMs
   */
  private deduplicateATMs(atms: ATMLocation[]): ATMLocation[] {
    const unique: ATMLocation[] = [];

    for (const atm of atms) {
      const isDuplicate = unique.some((existing) =>
        this.areATMsSimilar(atm, existing),
      );

      if (!isDuplicate) {
        unique.push(atm);
      }
    }

    return unique;
  }

  /**
   * Check if two banks are similar (likely the same location)
   */
  private areBanksSimilar(bank1: Bank, bank2: Bank): boolean {
    const nameSimilarity = this.calculateStringSimilarity(
      bank1.name.toLowerCase(),
      bank2.name.toLowerCase(),
    );
    const distance = this.calculateDistance(
      bank1.latitude,
      bank1.longitude,
      bank2.latitude,
      bank2.longitude,
    );

    return nameSimilarity > 0.8 && distance < 0.1; // Within 100m and similar names
  }

  /**
   * Check if two ATMs are similar
   */
  private areATMsSimilar(atm1: ATMLocation, atm2: ATMLocation): boolean {
    const distance = this.calculateDistance(
      atm1.latitude,
      atm1.longitude,
      atm2.latitude,
      atm2.longitude,
    );

    return distance < 0.05; // Within 50m
  }

  /**
   * Calculate string similarity (simple Jaccard similarity)
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    const set1 = new Set(str1.split(' '));
    const set2 = new Set(str2.split(' '));
    const intersection = new Set([...set1].filter((x) => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size;
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
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

  /**
   * Check if cache is still valid
   */
  private isCacheValid(): boolean {
    return this.cacheExpiry !== null && new Date() < this.cacheExpiry;
  }

  /**
   * Get fallback bank data when external sources fail
   */
  private getFallbackBankData(): Bank[] {
    return [
      {
        id: 'gcb-head-office',
        name: 'GCB Bank Limited - Head Office',
        type: 'bank',
        code: 'GCB',
        address: 'Thorpe Road, Accra',
        city: 'Accra',
        region: 'Greater Accra',
        latitude: 5.6037,
        longitude: -0.187,
        phone: '+233302664910',
        email: 'info@gcbbank.com.gh',
        website: 'https://www.gcbbank.com.gh',
        operatingHours: 'Mon-Fri: 8:00-17:00, Sat: 8:00-13:00',
        services: [
          'ATM',
          'Cash Deposit',
          'Foreign Exchange',
          'Loans',
          'Mobile Banking',
        ],
        branchInfo: {
          branchCode: '001',
          isHeadOffice: true,
          hasATM: true,
          is24Hours: false,
        },
      },
      {
        id: 'ecobank-independence',
        name: 'Ecobank Ghana - Independence Avenue',
        type: 'bank',
        code: 'ETI',
        address: 'Independence Avenue, Accra',
        city: 'Accra',
        region: 'Greater Accra',
        latitude: 5.56,
        longitude: -0.2057,
        phone: '+233302740140',
        website: 'https://ecobank.com',
        operatingHours: 'Mon-Fri: 8:30-16:30, Sat: 8:30-13:00',
        services: ['ATM', 'Cash Deposit', 'Foreign Exchange', 'Western Union'],
        branchInfo: {
          hasATM: true,
          is24Hours: false,
        },
      },
      {
        id: 'stanbic-oxford-st',
        name: 'Stanbic Bank Ghana - Oxford Street',
        type: 'bank',
        code: 'SBG',
        address: 'Oxford Street, Osu, Accra',
        city: 'Accra',
        region: 'Greater Accra',
        latitude: 5.5557,
        longitude: -0.1742,
        phone: '+233302610610',
        website: 'https://www.stanbic.com.gh',
        operatingHours: 'Mon-Fri: 8:30-16:00, Sat: 8:30-13:00',
        services: [
          'ATM',
          'Cash Deposit',
          'Foreign Exchange',
          'Investment Services',
        ],
        branchInfo: {
          hasATM: true,
          is24Hours: false,
        },
      },
      {
        id: 'absa-kumasi',
        name: 'Absa Bank Ghana - Kumasi',
        type: 'bank',
        code: 'ABSA',
        address: 'Harper Road, Kumasi',
        city: 'Kumasi',
        region: 'Ashanti',
        latitude: 6.6885,
        longitude: -1.6244,
        phone: '+233322020202',
        website: 'https://www.absa.com.gh',
        operatingHours: 'Mon-Fri: 8:00-16:30, Sat: 8:00-13:00',
        services: ['ATM', 'Cash Deposit', 'Loans', 'Business Banking'],
        branchInfo: {
          hasATM: true,
          is24Hours: false,
        },
      },
    ];
  }

  /**
   * Get fallback ATM data
   */
  private getFallbackATMData(): ATMLocation[] {
    return [
      {
        id: 'gcb-atm-circle',
        name: 'GCB ATM - Kwame Nkrumah Circle',
        bank: 'GCB Bank',
        address: 'Kwame Nkrumah Circle, Accra',
        city: 'Accra',
        region: 'Greater Accra',
        latitude: 5.5719,
        longitude: -0.231,
        is24Hours: true,
        services: ['Cash Withdrawal', 'Balance Inquiry', 'Mini Statement'],
        network: ['Visa', 'MasterCard', 'GhIPSS'],
        lastChecked: new Date(),
      },
      {
        id: 'ecobank-atm-airport',
        name: 'Ecobank ATM - Airport',
        bank: 'Ecobank Ghana',
        address: 'Kotoka International Airport, Accra',
        city: 'Accra',
        region: 'Greater Accra',
        latitude: 5.6052,
        longitude: -0.1667,
        is24Hours: true,
        services: ['Cash Withdrawal', 'Balance Inquiry'],
        network: ['Visa', 'MasterCard', 'GhIPSS'],
        lastChecked: new Date(),
      },
    ];
  }
}
