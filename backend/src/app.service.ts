import { Injectable, Logger } from '@nestjs/common';
import { BankDataProviderService } from './banking/services/bank-data-provider.service';
import { PrismaService } from './common/database/prisma.service';
import { ServiceHealth, worstOf } from './common/health/service-health';
import { CryptoService } from './crypto/crypto.service';
import { regions } from './locations/data/regions.json';
import { StockMarketService } from './stock-market/stock-market.service';
import { FuelPriceService } from './transport/services/fuel-price.service';
import { TransportStopsService } from './transport/services/transport-stops.service';

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

  constructor(
    private readonly prisma: PrismaService,
    private readonly bankData: BankDataProviderService,
    private readonly stockMarket: StockMarketService,
    private readonly transportStops: TransportStopsService,
    private readonly fuelPrices: FuelPriceService,
    private readonly crypto: CryptoService,
  ) {}

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
      }
    } catch (error) {
      this.logger.error('Failed to collect statistics', error);
    }

    // Services that fetch from third parties. Each reports what its last real
    // refresh did; nothing here calls an upstream, so /status stays cheap.
    this.addServiceHealth(health, statistics, {
      banking: this.bankData.getHealth(),
      stockMarket: this.stockMarket.getHealth(),
      crypto: this.crypto.getHealth(),
      transport: this.combineHealth(
        this.transportStops.getHealth(),
        this.fuelPrices.getHealth(),
      ),
    });

    // Determine overall status
    const hasUnhealthy = health.database === 'unhealthy';
    const hasDegraded = Object.values(health.services).some(
      (s) => s === 'degraded' || s === 'unhealthy',
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

  private addServiceHealth(
    health: HealthStatus,
    statistics: Record<string, ModuleStatistics>,
    reports: Record<string, ServiceHealth>,
  ): void {
    for (const [name, report] of Object.entries(reports)) {
      health.services[name] = report.status;
      statistics[name] = {
        totalRecords: 0, // Service-based data, not stored in the database
        lastUpdated: report.asOf ? new Date(report.asOf) : null,
        note: report.detail ?? 'Service-based data, not stored in database',
      };
    }
  }

  /** One report for a module made of several data sources: the worst state */
  private combineHealth(...parts: ServiceHealth[]): ServiceHealth {
    const asOf = parts
      .map((part) => part.asOf)
      .filter((value): value is string => value !== null)
      .sort()
      .pop();
    const details = parts
      .map((part) => part.detail)
      .filter((detail): detail is string => Boolean(detail));
    return {
      status: worstOf(...parts.map((part) => part.status)),
      asOf: asOf ?? null,
      detail: details.length ? details.join('; ') : undefined,
    };
  }
}
