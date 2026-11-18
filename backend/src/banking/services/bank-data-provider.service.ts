import { HttpService } from '@nestjs/axios';
import {
  Injectable,
  Logger,
  OnModuleInit,
  Optional,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../common/database/prisma.service';
import {
  HealthState,
  ServiceHealth,
  worstOf,
} from '../../common/health/service-health';
import { queryOverpass } from '../../common/overpass/overpass-client';
import { ATMLocation, Bank } from '../entities/bank.entity';

/**
 * Holds one dataset (banks or ATMs): the last good result, when it was
 * fetched, a failure backoff, and the single shared in-flight refresh.
 */
interface DataSlot<T> {
  key: 'banks' | 'atms';
  data: T[] | null;
  fetchedAt: number | null;
  failedUntil: number;
  /** True from a failed refresh until the next successful one */
  lastRefreshFailed: boolean;
  inFlight: Promise<T[]> | null;
}

const newSlot = <T>(key: DataSlot<T>['key']): DataSlot<T> => ({
  key,
  data: null,
  fetchedAt: null,
  failedUntil: 0,
  lastRefreshFailed: false,
  inFlight: null,
});

/** JSON turns Date fields into strings. Turn them back. */
function reviveDates<T>(items: T[]): T[] {
  return items.map((item) => {
    const lastChecked = (item as { lastChecked?: unknown })?.lastChecked;
    if (typeof lastChecked === 'string') {
      return { ...item, lastChecked: new Date(lastChecked) };
    }
    return item;
  });
}

@Injectable()
export class BankDataProviderService {
  private readonly logger = new Logger(BankDataProviderService.name);
  private readonly banksSlot = newSlot<Bank>('banks');
  private readonly atmsSlot = newSlot<ATMLocation>('atms');
  private readonly cacheValidityMs = 24 * 60 * 60 * 1000;
  // After a failed refresh, do not query upstream again for this long
  private readonly FAILURE_BACKOFF_MS = 10 * 60 * 1000;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @Optional() private readonly prisma?: PrismaService,
  ) {}

  /**
   * Restore the last saved snapshots, so a restart does not start empty.
   * Each one still counts as stale if it is older than 24h, and is refreshed
   * on the next request.
   */
  async onModuleInit(): Promise<void> {
    await this.restore(this.banksSlot);
    await this.restore(this.atmsSlot);
  }

  /**
   * Daily refresh at 03:00, so users rarely wait on Overpass.
   * Failures are logged and backed off, and the saved data keeps serving.
   */
  @Cron('0 0 3 * * *')
  async refreshAll(): Promise<void> {
    await Promise.all([
      this.refreshSlot(this.banksSlot, 'Bank data', () => this.fetchBanks()),
      this.refreshSlot(this.atmsSlot, 'ATM data', () => this.fetchATMs()),
    ]);
  }

  /**
   * Banks. Served from memory; refreshed from upstream at most once at a time.
   */
  async getBanks(): Promise<Bank[]> {
    return this.load(this.banksSlot, 'Bank data', () => this.fetchBanks());
  }

  /**
   * ATM locations. Same behaviour as getBanks.
   */
  async getATMs(): Promise<ATMLocation[]> {
    return this.load(this.atmsSlot, 'ATM data', () => this.fetchATMs());
  }

  /**
   * When each dataset was last fetched, and whether it is past its 24h life.
   * Stale data is still real data from the last successful fetch.
   */
  getFreshness() {
    const describe = <T>(slot: DataSlot<T>) => ({
      asOf: slot.fetchedAt ? new Date(slot.fetchedAt).toISOString() : null,
      stale: slot.data !== null && !this.isFresh(slot),
    });
    return { banks: describe(this.banksSlot), atms: describe(this.atmsSlot) };
  }

  /** For the /status endpoint. Never contacts Overpass or Bank of Ghana. */
  getHealth(): ServiceHealth {
    const slots = [this.banksSlot, this.atmsSlot];
    const states = slots.map((slot): HealthState => {
      if (!slot.lastRefreshFailed) {
        return 'healthy';
      }
      return slot.data !== null ? 'degraded' : 'unhealthy';
    });
    const status = worstOf(...states);
    const fetched = slots
      .map((slot) => slot.fetchedAt)
      .filter((at): at is number => at !== null);
    const asOf = fetched.length ? new Date(Math.max(...fetched)) : null;

    return {
      status,
      asOf: asOf ? asOf.toISOString() : null,
      detail:
        status === 'unhealthy'
          ? 'The last refresh of bank data failed and there is no usable data'
          : status === 'degraded'
            ? 'The last refresh of bank data failed; serving the last good data'
            : asOf
              ? undefined
              : 'No bank data requested since the server started',
    };
  }

  private isFresh<T>(slot: DataSlot<T>): boolean {
    return (
      slot.data !== null &&
      slot.fetchedAt !== null &&
      Date.now() - slot.fetchedAt < this.cacheValidityMs
    );
  }

  /**
   * Fresh data: return it. Older data: return it now and refresh in the
   * background. No data: wait for the shared refresh, or fail with a 503.
   * Concurrent callers share one upstream refresh instead of each starting one.
   */
  private async load<T>(
    slot: DataSlot<T>,
    label: string,
    fetcher: () => Promise<T[]>,
  ): Promise<T[]> {
    if (slot.data && this.isFresh(slot)) {
      return slot.data;
    }

    const pending = this.startRefresh(slot, label, fetcher);

    if (slot.data) {
      this.logger.warn(`${label}: serving data from the last good fetch`);
      pending?.catch(() => undefined); // failure is logged and backed off
      return slot.data;
    }

    if (!pending) {
      throw new ServiceUnavailableException(`${label} is temporarily unavailable`);
    }
    try {
      return await pending;
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }
      throw new ServiceUnavailableException(`${label} is temporarily unavailable`);
    }
  }

  private refreshSlot<T>(
    slot: DataSlot<T>,
    label: string,
    fetcher: () => Promise<T[]>,
  ): Promise<void> {
    const pending = this.startRefresh(slot, label, fetcher);
    return pending ? pending.then(() => undefined, () => undefined) : Promise.resolve();
  }

  private async persist<T>(slot: DataSlot<T>): Promise<void> {
    if (!this.prisma || !slot.data || slot.fetchedAt === null) return;
    try {
      const payload = JSON.parse(JSON.stringify(slot.data));
      const fetchedAt = new Date(slot.fetchedAt);
      await this.prisma.bankSnapshot.upsert({
        where: { key: slot.key },
        create: { key: slot.key, payload, fetchedAt },
        update: { payload, fetchedAt },
      });
    } catch (error) {
      this.logger.warn(`Could not save ${slot.key} snapshot: ${(error as Error).message}`);
    }
  }

  private async restore<T>(slot: DataSlot<T>): Promise<void> {
    if (!this.prisma) return;
    try {
      const row = await this.prisma.bankSnapshot.findUnique({
        where: { key: slot.key },
      });
      if (row && Array.isArray(row.payload)) {
        slot.data = reviveDates(row.payload as T[]);
        slot.fetchedAt = row.fetchedAt.getTime();
        this.logger.log(`Restored ${slot.key} snapshot from ${row.fetchedAt.toISOString()}`);
      }
    } catch (error) {
      this.logger.warn(`Could not restore ${slot.key} snapshot: ${(error as Error).message}`);
    }
  }

  /**
   * Start a refresh unless one is running (share it) or a recent one failed
   * (return null). Success stores the data; failure starts the backoff.
   */
  private startRefresh<T>(
    slot: DataSlot<T>,
    label: string,
    fetcher: () => Promise<T[]>,
  ): Promise<T[]> | null {
    if (slot.inFlight) {
      return slot.inFlight;
    }
    if (Date.now() < slot.failedUntil) {
      return null;
    }
    this.logger.log(`${label}: refreshing from upstream`);
    slot.inFlight = fetcher()
      .then(
        (data) => {
          slot.data = data;
          slot.fetchedAt = Date.now();
          slot.lastRefreshFailed = false;
          void this.persist(slot);
          return data;
        },
        (error) => {
          this.logger.error(`${label} refresh failed:`, error);
          slot.failedUntil = Date.now() + this.FAILURE_BACKOFF_MS;
          slot.lastRefreshFailed = true;
          throw error;
        },
      )
      .finally(() => {
        slot.inFlight = null;
      });
    return slot.inFlight;
  }

  private async fetchBanks(): Promise<Bank[]> {
    const banks: Bank[] = [];

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

    // No data from any source is an outage, not an empty directory.
    if (banks.length === 0) {
      throw new ServiceUnavailableException(
        'Bank data is temporarily unavailable from all sources',
      );
    }

    const uniqueBanks = this.deduplicateBanks(banks);
    this.logger.log(
      `Successfully loaded ${uniqueBanks.length} banking facilities`,
    );
    return uniqueBanks;
  }

  private async fetchATMs(): Promise<ATMLocation[]> {
    const atms = await this.getATMsFromOpenStreetMap();

    // No data is an outage, not an empty result.
    if (atms.length === 0) {
      throw new ServiceUnavailableException('ATM data is temporarily unavailable');
    }

    const uniqueATMs = this.deduplicateATMs(atms);
    this.logger.log(`Successfully loaded ${uniqueATMs.length} ATM locations`);
    return uniqueATMs;
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
        [out:json][timeout:90];
        area["name"="Ghana"]->.searchArea;
        (
          node["amenity"="bank"](area.searchArea);
          node["amenity"="atm"](area.searchArea);
          way["amenity"="bank"](area.searchArea);
          way["amenity"="atm"](area.searchArea);
        );
        out geom;
      `;

      const data = await queryOverpass(query);
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
      // Rethrow so callers can tell a failed source from an empty one
      this.logger.warn('Failed to fetch from OpenStreetMap:', error.message);
      throw error;
    }
  }

  /**
   * Get ATMs specifically from OpenStreetMap
   */
  private async getATMsFromOpenStreetMap(): Promise<ATMLocation[]> {
    try {
      const query = `
        [out:json][timeout:90];
        area["name"="Ghana"]->.searchArea;
        (
          node["amenity"="atm"](area.searchArea);
          way["amenity"="atm"](area.searchArea);
        );
        out geom;
      `;

      const data = await queryOverpass(query);
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
      // Rethrow so callers can tell a failed source from an empty one
      this.logger.warn(
        'Failed to fetch ATMs from OpenStreetMap:',
        error.message,
      );
      throw error;
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
}
