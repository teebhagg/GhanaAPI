import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import type { School } from '../entities/school.entity';
import { fetchShsSelectSchools } from '../utils/shs-select-scraper';

@Injectable()
export class SchoolDataProviderService {
  private readonly logger = new Logger(SchoolDataProviderService.name);
  private readonly CACHE_KEY = 'schools_static_data';
  private readonly CACHE_TTL = 3600000; // 1 hour in milliseconds

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
   * Get static school data from GES sources
   */
  async getStaticSchoolData(): Promise<Partial<School>[]> {
    const cached = await this.cacheManager.get<Partial<School>[]>(
      this.CACHE_KEY,
    );
    if (cached) {
      this.logger.log('Returning cached school data');
      return cached;
    }

    try {
      this.logger.log('Fetching Senior High School data from SHS Select');
      const schools = await fetchShsSelectSchools();
      this.logger.log(
        `Fetched ${schools.length} schools from SHS Select dataset`,
      );
      await this.cacheManager.set(this.CACHE_KEY, schools, this.CACHE_TTL);
      return schools;
    } catch (error) {
      this.logger.error(
        'Failed to fetch SHS Select school data',
        error as Error,
      );
      throw error;
    }
  }

  async clearCache(): Promise<void> {
    await this.cacheManager.del(this.CACHE_KEY);
    this.logger.log('School data cache cleared');
  }
}
