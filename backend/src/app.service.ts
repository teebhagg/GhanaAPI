import { Injectable, Logger } from '@nestjs/common';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { BankDataProviderService } from './banking/services/bank-data-provider.service';
import { PrismaService } from './common/database/prisma.service';
import {
  FailureReport,
  ServiceHealth,
  newestFailure,
  worstOf,
} from './common/health/service-health';
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

/** Which build is answering. Instances can differ during and after a deploy. */
export interface BuildInfo {
  version: string;
  /** First 7 characters of the git commit, when the host provides it */
  commit: string | null;
  /** The host's id for this instance, when it provides one */
  instance: string | null;
  startedAt: string;
  uptimeSeconds: number;
}

export interface StatusResponse {
  success: boolean;
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  build: BuildInfo;
  health: HealthStatus;
  statistics: Record<string, ModuleStatistics>;
}

const STARTED_AT = new Date();

/**
 * How long the database statistics are reused. The exchange rate history has
 * hundreds of thousands of rows, and counting them takes 1 to 3 seconds, so
 * /status must not do it on every call. The counts only change when a rate
 * snapshot is saved, so a minute of delay is not noticeable.
 */
export const STATISTICS_TTL_MS = 60_000;

/** The version in package.json, which sits in the working directory. */
function readVersion(): string {
  try {
    const pkg = JSON.parse(
      readFileSync(join(process.cwd(), 'package.json'), 'utf8'),
    ) as { version?: unknown };
    if (typeof pkg.version === 'string') return pkg.version;
  } catch {
    // fall through to the npm variable
  }
  return process.env.npm_package_version ?? 'unknown';
}

const VERSION = readVersion();

export function getBuildInfo(): BuildInfo {
  const commit = process.env.RENDER_GIT_COMMIT ?? process.env.GIT_COMMIT;
  return {
    version: VERSION,
    commit: commit ? commit.slice(0, 7) : null,
    instance: process.env.RENDER_INSTANCE_ID ?? null,
    startedAt: STARTED_AT.toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
  };
}

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);
  private readonly statisticsCache = new Map<
    string,
    { at: number; value: unknown }
  >();
  private readonly statisticsInFlight = new Map<string, Promise<unknown>>();

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
          statistics.education = await this.cachedStatistics(
            'education',
            async () => {
              const [schoolCount, schoolLastUpdated] = await Promise.all([
                this.prisma.school.count(),
                this.prisma.school.findFirst({
                  orderBy: { updatedAt: 'desc' },
                  select: { updatedAt: true },
                }),
              ]);
              return {
                totalRecords: schoolCount,
                lastUpdated: schoolLastUpdated?.updatedAt || null,
              };
            },
          );
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
          statistics.exchangeRates = await this.cachedStatistics(
            'exchangeRates',
            async () => {
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

              return {
                totalRecords: exchangeRateCount,
                lastUpdated: exchangeRateLastUpdated?.sourceTimestamp || null,
                byProvider,
              };
            },
          );
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
        ['stops', this.transportStops.getHealth()],
        ['fuel prices', this.fuelPrices.getHealth()],
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
      build: getBuildInfo(),
      health,
      statistics,
    };
  }

  /**
   * Database statistics, reused for STATISTICS_TTL_MS. Calls that arrive while
   * a query is running share it. A failed query is not stored, so the next
   * call tries again.
   */
  private async cachedStatistics(
    key: string,
    load: () => Promise<ModuleStatistics>,
  ): Promise<ModuleStatistics> {
    const hit = this.statisticsCache.get(key);
    if (hit && Date.now() - hit.at < STATISTICS_TTL_MS) {
      return hit.value as ModuleStatistics;
    }
    const running = this.statisticsInFlight.get(key);
    if (running) return running as Promise<ModuleStatistics>;

    const started = load()
      .then((value) => {
        this.statisticsCache.set(key, { at: Date.now(), value });
        return value;
      })
      .finally(() => this.statisticsInFlight.delete(key));
    this.statisticsInFlight.set(key, started);
    return started;
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
        // Why the last refresh failed, in words that are safe to publish
        ...(report.lastFailure && { lastFailure: report.lastFailure }),
      };
    }
  }

  /**
   * One report for a module made of several data sources: the worst state, and
   * every source's failure under its label.
   */
  private combineHealth(
    ...parts: Array<[label: string, health: ServiceHealth]>
  ): ServiceHealth {
    const asOf = parts
      .map(([, part]) => part.asOf)
      .filter((value): value is string => value !== null)
      .sort()
      .pop();
    const details = parts
      .map(([, part]) => part.detail)
      .filter((detail): detail is string => Boolean(detail));
    const failures = parts.flatMap(([label, part]) =>
      part.lastFailure ? [{ label, failure: part.lastFailure }] : [],
    );
    let lastFailure: FailureReport | undefined;
    if (failures.length === 1) {
      const { label, failure } = failures[0];
      lastFailure = {
        ...failure,
        scope: failure.scope ? `${label}/${failure.scope}` : label,
      };
    } else if (failures.length > 1) {
      lastFailure = {
        reason: failures
          .map(
            ({ label, failure }) =>
              `${failure.scope ? `${label}/${failure.scope}` : label}: ${failure.reason}`,
          )
          .join('; '),
        at: newestFailure(failures.map(({ failure }) => failure))!.at,
      };
    }
    return {
      status: worstOf(...parts.map(([, part]) => part.status)),
      asOf: asOf ?? null,
      detail: details.length ? details.join('; ') : undefined,
      ...(lastFailure && { lastFailure }),
    };
  }
}
