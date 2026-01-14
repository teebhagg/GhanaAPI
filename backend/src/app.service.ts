import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from './common/database/prisma.service';
import { regions } from './locations/data/regions.json';

interface HealthStatus {
  database: 'healthy' | 'degraded' | 'unhealthy';
  services: Record<string, 'healthy' | 'degraded' | 'unhealthy'>;
}

interface ModuleStatistics {
  totalRecords: number;
  lastUpdated: Date | null;
  [key: string]: any;
}

export interface StatusResponse {
  success: boolean;
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  health: HealthStatus;
  statistics: Record<string, ModuleStatistics>;
}

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(private readonly prisma: PrismaService) {}

  getHello(): string {
    return "Welcome to Ghana API - Your gateway to Ghana's data and services";
  }

  async getStatus(): Promise<StatusResponse> {
    const timestamp = new Date();
    let databaseHealth: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (!this.prisma) {
      databaseHealth = 'unhealthy';
    }
    const health: HealthStatus = {
      database: databaseHealth,
      services: {},
    };

    const statistics: Record<string, ModuleStatistics> = {};

    // Test database connectivity
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      health.database = 'healthy';
    } catch (error) {
      this.logger.error('Database health check failed', error);
      health.database = 'unhealthy';
    }

    // Collect statistics from each module
    try {
      // Education module
      if (health.database === 'healthy') {
        try {
          const [schoolCount, schoolLastUpdated] = await Promise.all([
            this.prisma.school.count(),
            this.prisma.school.findFirst({
              orderBy: { updatedAt: 'desc' },
              select: { updatedAt: true },
            }),
          ]);

          statistics.education = {
            totalRecords: schoolCount,
            lastUpdated: schoolLastUpdated?.updatedAt || null,
          };
          health.services.education = 'healthy';
        } catch (error) {
          this.logger.warn('Failed to fetch education statistics', error);
          statistics.education = {
            totalRecords: 0,
            lastUpdated: null,
          };
          health.services.education = 'degraded';
        }

        // Exchange Rates module
        try {
          const [
            exchangeRateCount,
            exchangeRateByProvider,
            exchangeRateLastUpdated,
          ] = await Promise.all([
            this.prisma.exchangeRateHistory.count(),
            this.prisma.exchangeRateHistory.groupBy({
              by: ['provider'],
              _count: true,
            }),
            this.prisma.exchangeRateHistory.findFirst({
              orderBy: { sourceTimestamp: 'desc' },
              select: { sourceTimestamp: true },
            }),
          ]);

          const byProvider = exchangeRateByProvider.reduce(
            (acc, item) => {
              acc[item.provider] = item._count;
              return acc;
            },
            {} as Record<string, number>,
          );

          statistics.exchangeRates = {
            totalRecords: exchangeRateCount,
            lastUpdated: exchangeRateLastUpdated?.sourceTimestamp || null,
            byProvider,
          };
          health.services.exchangeRates = 'healthy';
        } catch (error) {
          this.logger.warn('Failed to fetch exchange rates statistics', error);
          statistics.exchangeRates = {
            totalRecords: 0,
            lastUpdated: null,
            byProvider: {},
          };
          health.services.exchangeRates = 'degraded';
        }

        // Locations module (regions data)
        try {
          const regionCount = Array.isArray(regions) ? regions.length : 0;

          statistics.locations = {
            totalRecords: regionCount,
            lastUpdated: null, // Static data, no timestamp
          };
          health.services.locations = 'healthy';
        } catch (error) {
          this.logger.warn('Failed to fetch locations statistics', error);
          statistics.locations = {
            totalRecords: 0,
            lastUpdated: null,
          };
          health.services.locations = 'degraded';
        }

        // Banking module (no database table, service-based)
        statistics.banking = {
          totalRecords: 0, // Banking data is service-based, not stored in DB
          lastUpdated: null,
          note: 'Service-based data, not stored in database',
        };
        health.services.banking = 'healthy';

        // Stock Market module (service-based)
        statistics.stockMarket = {
          totalRecords: 0, // Stock data is service-based
          lastUpdated: null,
          note: 'Service-based data, not stored in database',
        };
        health.services.stockMarket = 'healthy';

        // Business Verification module (if exists)
        // Note: Business verification module exists but may not have database tables yet
        statistics.businessVerification = {
          totalRecords: 0,
          lastUpdated: null,
          note: 'Service available',
        };
        health.services.businessVerification = 'healthy';
      }
    } catch (error) {
      this.logger.error('Failed to collect statistics', error);
    }

    // Determine overall status
    const hasUnhealthy = health.database === 'unhealthy';
    const hasDegraded = Object.values(health.services).some(
      (s) => s === 'degraded',
    );

    const overallStatus: 'healthy' | 'degraded' | 'unhealthy' = hasUnhealthy
      ? 'unhealthy'
      : hasDegraded
        ? 'degraded'
        : 'healthy';

    return {
      success: overallStatus !== 'unhealthy',
      status: overallStatus,
      timestamp,
      health,
      statistics,
    };
  }
}
