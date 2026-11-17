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
});
