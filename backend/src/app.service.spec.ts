import { BankDataProviderService } from './banking/services/bank-data-provider.service';
import { PrismaService } from './common/database/prisma.service';
import { ServiceHealth } from './common/health/service-health';
import { AppService } from './app.service';
import { CryptoService } from './crypto/crypto.service';
import { StockMarketService } from './stock-market/stock-market.service';
import { FuelPriceService } from './transport/services/fuel-price.service';
import { TransportStopsService } from './transport/services/transport-stops.service';

const OK: ServiceHealth = {
  status: 'healthy',
  asOf: '2026-11-16T10:00:00.000Z',
};

describe('AppService.getStatus', () => {
  let prisma: any;
  let reports: Record<
    'bank' | 'stock' | 'stops' | 'fuel' | 'crypto',
    ServiceHealth
  >;
  let service: AppService;

  beforeEach(() => {
    prisma = {
      $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
      school: {
        count: jest.fn().mockResolvedValue(3),
        findFirst: jest.fn().mockResolvedValue(null),
      },
      exchangeRateHistory: {
        count: jest.fn().mockResolvedValue(2),
        groupBy: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn().mockResolvedValue(null),
      },
    };
    reports = { bank: OK, stock: OK, stops: OK, fuel: OK, crypto: OK };
    service = new AppService(
      prisma as PrismaService,
      { getHealth: () => reports.bank } as unknown as BankDataProviderService,
      { getHealth: () => reports.stock } as unknown as StockMarketService,
      { getHealth: () => reports.stops } as unknown as TransportStopsService,
      { getHealth: () => reports.fuel } as unknown as FuelPriceService,
      { getHealth: () => reports.crypto } as unknown as CryptoService,
    );
  });

  it('reports banking, stock market, transport and crypto from their own state', async () => {
    const status = await service.getStatus();

    expect(status.status).toBe('healthy');
    expect(status.health.services).toMatchObject({
      banking: 'healthy',
      stockMarket: 'healthy',
      transport: 'healthy',
      crypto: 'healthy',
    });
    expect(status.statistics.stockMarket.lastUpdated).toEqual(
      new Date('2026-11-16T10:00:00.000Z'),
    );
  });

  it('no longer reports business verification, which is not part of the app', async () => {
    const status = await service.getStatus();

    expect(status.health.services).not.toHaveProperty('businessVerification');
    expect(status.statistics).not.toHaveProperty('businessVerification');
  });

  it('shows a failing service instead of "healthy"', async () => {
    reports.stock = {
      status: 'unhealthy',
      asOf: null,
      detail:
        'The last refresh of stock prices failed and there is no usable data',
    };
    reports.bank = { ...OK, status: 'degraded' };

    const status = await service.getStatus();

    expect(status.health.services.stockMarket).toBe('unhealthy');
    expect(status.health.services.banking).toBe('degraded');
    expect(status.statistics.stockMarket.note).toContain('no usable data');
    expect(status.status).toBe('degraded'); // the API still answers
    expect(status.success).toBe(true);
  });

  it('reports transport as the worst of stops and fuel prices', async () => {
    reports.fuel = { status: 'unhealthy', asOf: null, detail: 'fuel down' };

    const status = await service.getStatus();

    expect(status.health.services.transport).toBe('unhealthy');
    expect(status.statistics.transport.note).toBe('fuel down');
    expect(status.statistics.transport.lastUpdated).toEqual(
      new Date('2026-11-16T10:00:00.000Z'),
    );
  });

  it('still reports the data services when the database is down', async () => {
    prisma.$queryRaw.mockRejectedValue(new Error('db down'));
    reports.crypto = { status: 'unhealthy', asOf: null };

    const status = await service.getStatus();

    expect(status.health.database).toBe('unhealthy');
    expect(status.success).toBe(false);
    expect(status.health.services.crypto).toBe('unhealthy');
    expect(status.health.services.banking).toBe('healthy');
  });

  describe('build information', () => {
    const saved = { ...process.env };
    afterEach(() => {
      process.env = { ...saved };
    });

    it('should say which build is answering', async () => {
      process.env.RENDER_GIT_COMMIT =
        '3f43af6c0ffee1234567890abcdef1234567890a';
      process.env.RENDER_INSTANCE_ID = 'srv-abc123-5d8f7';

      const { build } = await service.getStatus();

      expect(build.version).toMatch(/^\d+\.\d+\.\d+/);
      expect(build).toMatchObject({
        commit: '3f43af6',
        instance: 'srv-abc123-5d8f7',
      });
      expect(new Date(build.startedAt).getTime()).toBeLessThanOrEqual(
        Date.now(),
      );
      expect(build.uptimeSeconds).toBeGreaterThanOrEqual(0);
    });

    it('should use null when the host gives no commit or instance', async () => {
      delete process.env.RENDER_GIT_COMMIT;
      delete process.env.GIT_COMMIT;
      delete process.env.RENDER_INSTANCE_ID;

      const { build } = await service.getStatus();

      expect(build.commit).toBeNull();
      expect(build.instance).toBeNull();
    });
  });

  describe('why a service failed', () => {
    const failure = (reason: string, scope?: string) => ({
      reason,
      at: '2026-11-18T12:00:00.000Z',
      ...(scope && { scope }),
    });

    it('should show the last failure of a service next to its note', async () => {
      reports.stock = {
        status: 'unhealthy',
        asOf: null,
        detail: 'The last refresh of stock prices failed',
        lastFailure: failure(
          'timeout after 10000ms contacting dev.kwayisi.org',
        ),
      };

      const status = await service.getStatus();

      expect(status.statistics.stockMarket.lastFailure).toEqual(
        failure('timeout after 10000ms contacting dev.kwayisi.org'),
      );
      expect(status.statistics.stockMarket.note).toBe(
        'The last refresh of stock prices failed',
      );
    });

    it('should leave lastFailure out for a healthy service', async () => {
      const status = await service.getStatus();

      expect(status.statistics.banking).not.toHaveProperty('lastFailure');
    });

    it('should label the failure of stops when only stops failed', async () => {
      reports.stops = {
        status: 'unhealthy',
        asOf: null,
        lastFailure: failure(
          'overpass: HTTP 502 from overpass-api.de',
          'kumasi',
        ),
      };

      const status = await service.getStatus();

      expect(status.statistics.transport.lastFailure).toEqual({
        ...failure('overpass: HTTP 502 from overpass-api.de'),
        scope: 'stops/kumasi',
      });
    });

    it('should name both sources when stops and fuel prices failed', async () => {
      reports.stops = {
        status: 'unhealthy',
        asOf: null,
        lastFailure: failure(
          'overpass: HTTP 502 from overpass-api.de',
          'accra',
        ),
      };
      reports.fuel = {
        status: 'unhealthy',
        asOf: null,
        lastFailure: {
          reason: 'npa-scraper: HTTP 404 from npa.gov.gh',
          at: '2026-11-18T12:05:00.000Z',
        },
      };

      const status = await service.getStatus();

      expect(status.statistics.transport.lastFailure).toEqual({
        reason:
          'stops: overpass: HTTP 502 from overpass-api.de; fuel prices: npa-scraper: HTTP 404 from npa.gov.gh',
        at: '2026-11-18T12:05:00.000Z',
      });
    });
  });
});
