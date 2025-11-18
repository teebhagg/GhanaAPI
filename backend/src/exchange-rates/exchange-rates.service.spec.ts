/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../common/database/prisma.service';
import { ExchangeRatesService } from './exchange-rates.service';
import { BankOfGhanaProvider } from './providers/bank-of-ghana.provider';
import { ExchangeRateApiProvider } from './providers/exchangerateapi.provider';
import { FixerProvider } from './providers/fixer.provider';

describe('ExchangeRatesService', () => {
  let service: ExchangeRatesService;
  let mockCacheManager: jest.Mocked<any>;
  let mockBogProvider: jest.Mocked<BankOfGhanaProvider>;
  let mockExchangeRateApiProvider: jest.Mocked<ExchangeRateApiProvider>;
  let mockFixerProvider: jest.Mocked<FixerProvider>;
  let mockPrismaService: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
    };

    mockBogProvider = {
      fetchRates: jest.fn(),
      convertCurrency: jest.fn(),
    } as any;

    mockExchangeRateApiProvider = {
      fetchRates: jest.fn(),
      convertCurrency: jest.fn(),
    } as any;

    mockFixerProvider = {
      fetchRates: jest.fn(),
      convertCurrency: jest.fn(),
    } as any;

    mockPrismaService = {
      exchangeRateHistory: {
        createMany: jest.fn(),
        findMany: jest.fn(),
      },
    } as unknown as jest.Mocked<PrismaService>;

    (
      mockPrismaService.exchangeRateHistory.createMany as jest.Mock
    ).mockResolvedValue({ count: 0 });
    (
      mockPrismaService.exchangeRateHistory.findMany as jest.Mock
    ).mockResolvedValue([]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExchangeRatesService,
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
        {
          provide: BankOfGhanaProvider,
          useValue: mockBogProvider,
        },
        {
          provide: ExchangeRateApiProvider,
          useValue: mockExchangeRateApiProvider,
        },
        {
          provide: FixerProvider,
          useValue: mockFixerProvider,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ExchangeRatesService>(ExchangeRatesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCurrentRates', () => {
    it('should return cached rates if available', async () => {
      const mockRates = [
        { currency: 'USD', rate: 12.5, lastUpdated: new Date().toISOString() },
        { currency: 'EUR', rate: 13.2, lastUpdated: new Date().toISOString() },
      ];

      mockCacheManager.get.mockResolvedValue(mockRates);

      const result = await service.getCurrentRates(['USD', 'EUR']);

      expect(result).toEqual(mockRates);
      expect(mockCacheManager.get).toHaveBeenCalledWith('fx:current:EUR,USD');
      expect(mockBogProvider.fetchRates).not.toHaveBeenCalled();
      expect(
        mockPrismaService.exchangeRateHistory.createMany,
      ).not.toHaveBeenCalled();
    });

    it('should fetch from Bank of Ghana when not cached', async () => {
      const mockRates = [
        {
          baseCurrency: 'GHS',
          targetCurrency: 'USD',
          rate: 12.5,
          provider: 'BOG',
          timestamp: new Date(),
        },
      ];

      mockCacheManager.get.mockResolvedValue(null);
      mockBogProvider.fetchRates.mockResolvedValue(mockRates);

      const result = await service.getCurrentRates(['USD']);

      expect(result).toEqual(mockRates);
      expect(mockBogProvider.fetchRates).toHaveBeenCalledWith('GHS', ['USD']);
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'fx:current:USD',
        expect.arrayContaining([
          expect.objectContaining({
            targetCurrency: 'USD',
            provider: 'BOG',
          }),
        ]),
        30 * 60,
      );
      expect(
        mockPrismaService.exchangeRateHistory.createMany,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({
              baseCurrency: 'GHS',
              targetCurrency: 'USD',
              provider: 'BOG',
            }),
          ]),
          skipDuplicates: true,
        }),
      );
    });

    it('should fallback to ExchangeRateAPI when Bank of Ghana fails', async () => {
      const mockRates = [
        {
          baseCurrency: 'GHS',
          targetCurrency: 'USD',
          rate: 12.5,
          provider: 'ExchangeRateAPI',
          timestamp: new Date(),
        },
      ];

      mockCacheManager.get.mockResolvedValue(null);
      mockBogProvider.fetchRates.mockRejectedValue(new Error('BOG API failed'));
      mockExchangeRateApiProvider.fetchRates.mockResolvedValue(mockRates);

      const result = await service.getCurrentRates(['USD']);

      expect(result).toEqual(mockRates);
      expect(mockBogProvider.fetchRates).toHaveBeenCalled();
      expect(mockExchangeRateApiProvider.fetchRates).toHaveBeenCalledWith(
        'GHS',
        ['USD'],
      );
      expect(
        mockPrismaService.exchangeRateHistory.createMany,
      ).toHaveBeenCalled();
    });

    it('should fallback to Fixer when first two providers fail', async () => {
      const mockRates = [
        {
          baseCurrency: 'GHS',
          targetCurrency: 'USD',
          rate: 12.5,
          provider: 'Fixer',
          timestamp: new Date(),
        },
      ];

      mockCacheManager.get.mockResolvedValue(null);
      mockBogProvider.fetchRates.mockRejectedValue(new Error('BOG failed'));
      mockExchangeRateApiProvider.fetchRates.mockRejectedValue(
        new Error('ExchangeRateAPI failed'),
      );
      mockFixerProvider.fetchRates.mockResolvedValue(mockRates);

      const result = await service.getCurrentRates(['USD']);

      expect(result).toEqual(mockRates);
      expect(mockBogProvider.fetchRates).toHaveBeenCalled();
      expect(mockExchangeRateApiProvider.fetchRates).toHaveBeenCalled();
      expect(mockFixerProvider.fetchRates).toHaveBeenCalledWith('GHS', ['USD']);
      expect(
        mockPrismaService.exchangeRateHistory.createMany,
      ).toHaveBeenCalled();
    });

    it('should throw AppException when all providers fail', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockBogProvider.fetchRates.mockRejectedValue(new Error('BOG failed'));
      mockExchangeRateApiProvider.fetchRates.mockRejectedValue(
        new Error('ExchangeRateAPI failed'),
      );
      mockFixerProvider.fetchRates.mockRejectedValue(new Error('Fixer failed'));

      await expect(service.getCurrentRates(['USD'])).rejects.toThrow();

      expect((mockBogProvider as any).fetchRates).toHaveBeenCalled();
      expect(mockExchangeRateApiProvider.fetchRates).toHaveBeenCalled();
      expect((mockFixerProvider as any).fetchRates).toHaveBeenCalled();
      expect(
        mockPrismaService.exchangeRateHistory.createMany,
      ).not.toHaveBeenCalled();
    });

    it('should use default currencies when none provided', async () => {
      const mockRates = [
        {
          baseCurrency: 'GHS',
          targetCurrency: 'USD',
          rate: 12.5,
          provider: 'BOG',
          timestamp: new Date(),
        },
        {
          baseCurrency: 'GHS',
          targetCurrency: 'EUR',
          rate: 13.2,
          provider: 'BOG',
          timestamp: new Date(),
        },
        {
          baseCurrency: 'GHS',
          targetCurrency: 'GBP',
          rate: 14.1,
          provider: 'BOG',
          timestamp: new Date(),
        },
        {
          baseCurrency: 'GHS',
          targetCurrency: 'NGN',
          rate: 0.08,
          provider: 'BOG',
          timestamp: new Date(),
        },
      ];

      mockCacheManager.get.mockResolvedValue(null);
      mockBogProvider.fetchRates.mockResolvedValue(mockRates);

      const result = await service.getCurrentRates();

      expect(mockBogProvider.fetchRates).toHaveBeenCalledWith('GHS', [
        'USD',
        'EUR',
        'GBP',
        'NGN',
        'CHF',
        'JPY',
        'CNY',
      ]);
      expect(result).toEqual(mockRates);
      expect(
        mockPrismaService.exchangeRateHistory.createMany,
      ).toHaveBeenCalled();
    });

    it('should convert currency codes to uppercase', async () => {
      const mockRates = [
        {
          baseCurrency: 'GHS',
          targetCurrency: 'USD',
          rate: 12.5,
          provider: 'BOG',
          timestamp: new Date(),
        },
      ];

      mockCacheManager.get.mockResolvedValue(null);
      mockBogProvider.fetchRates.mockResolvedValue(mockRates);

      await service.getCurrentRates(['usd', 'eur']);

      expect(mockBogProvider.fetchRates).toHaveBeenCalledWith('GHS', [
        'USD',
        'EUR',
      ]);
      expect(
        mockPrismaService.exchangeRateHistory.createMany,
      ).toHaveBeenCalled();
    });
  });

  describe('convertCurrency', () => {
    it('should return cached conversion if available', async () => {
      const mockConversion = {
        success: true,
        from: 'USD',
        to: 'GHS',
        amount: 100,
        result: 1250,
        rate: 12.5,
        lastUpdated: new Date().toISOString(),
      };

      mockCacheManager.get.mockResolvedValue(mockConversion);

      const body = { from: 'USD', to: 'GHS', amount: 100 };
      const result = await service.convertCurrency(body);

      expect(result).toEqual(mockConversion);
      expect(mockCacheManager.get).toHaveBeenCalledWith(
        'fx:convert:USD:GHS:100',
      );
      expect((mockBogProvider as any).convertCurrency).not.toHaveBeenCalled();
    });

    it('should fetch conversion from Bank of Ghana when not cached', async () => {
      const mockConversion = {
        from: 'USD',
        to: 'GHS',
        amount: 100,
        result: 1250,
        rate: 12.5,
        provider: 'BOG',
        timestamp: new Date(),
      };

      mockCacheManager.get.mockResolvedValue(null);
      mockBogProvider.convertCurrency.mockResolvedValue(mockConversion);

      const body = { from: 'USD', to: 'GHS', amount: 100 };
      const result = await service.convertCurrency(body);

      expect(result).toEqual(mockConversion);
      expect((mockBogProvider as any).convertCurrency).toHaveBeenCalledWith(
        body,
      );
      expect(mockCacheManager.set).toHaveBeenCalled();
    });

    it('should fallback to other providers when BOG fails', async () => {
      const mockConversion = {
        from: 'USD',
        to: 'GHS',
        amount: 100,
        result: 1250,
        rate: 12.5,
        provider: 'ExchangeRateAPI',
        timestamp: new Date(),
      };

      mockCacheManager.get.mockResolvedValue(null);
      mockBogProvider.convertCurrency.mockRejectedValue(
        new Error('BOG failed'),
      );
      mockExchangeRateApiProvider.convertCurrency.mockResolvedValue(
        mockConversion,
      );

      const body = { from: 'USD', to: 'GHS', amount: 100 };
      const result = await service.convertCurrency(body);

      expect(result).toEqual(mockConversion);
      expect((mockBogProvider as any).convertCurrency).toHaveBeenCalled();
      expect(mockExchangeRateApiProvider.convertCurrency).toHaveBeenCalledWith(
        body,
      );
    });
  });

  describe('getHistoricalRates', () => {
    it('should return empty array for historical rates (not implemented)', async () => {
      const from = new Date('2023-01-01');
      const to = new Date('2023-01-31');
      const currency = 'USD';

      const result = await service.getHistoricalRates(from, to, currency);

      expect(result).toEqual([]);
      expect(
        mockPrismaService.exchangeRateHistory.findMany,
      ).toHaveBeenCalledWith({
        where: {
          baseCurrency: 'GHS',
          targetCurrency: 'USD',
          sourceTimestamp: {
            gte: from,
            lte: to,
          },
        },
        orderBy: {
          sourceTimestamp: 'asc',
        },
      });
    });

    it('should map stored historical records into DTOs', async () => {
      const from = new Date('2023-01-01T00:00:00Z');
      const to = new Date('2023-01-31T23:59:59Z');
      const currency = 'usd';
      const snapshotDate = new Date('2023-01-15T12:00:00Z');

      (
        mockPrismaService.exchangeRateHistory.findMany as jest.Mock
      ).mockResolvedValue([
        {
          baseCurrency: 'GHS',
          targetCurrency: 'USD',
          rate: 0.081,
          provider: 'bank-of-ghana',
          sourceTimestamp: snapshotDate,
        },
      ]);

      const result = await service.getHistoricalRates(from, to, currency);

      expect(result).toEqual([
        {
          baseCurrency: 'GHS',
          targetCurrency: 'USD',
          rate: 0.081,
          provider: 'bank-of-ghana',
          date: snapshotDate,
        },
      ]);
      expect(
        mockPrismaService.exchangeRateHistory.findMany,
      ).toHaveBeenCalledWith({
        where: {
          baseCurrency: 'GHS',
          targetCurrency: 'USD',
          sourceTimestamp: {
            gte: from,
            lte: to,
          },
        },
        orderBy: { sourceTimestamp: 'asc' },
      });
    });

    it('should throw when the date range is invalid', async () => {
      await expect(
        service.getHistoricalRates(
          new Date('invalid'),
          new Date('2023-01-01'),
          'USD',
        ),
      ).rejects.toThrow();

      await expect(
        service.getHistoricalRates(
          new Date('2023-01-02'),
          new Date('2023-01-01'),
          'USD',
        ),
      ).rejects.toThrow();
    });
  });

  describe('updateExchangeRates', () => {
    it('should handle scheduled rate updates (no-op in current implementation)', async () => {
      const spy = jest
        .spyOn(service, 'getCurrentRates')
        .mockResolvedValue([] as any);

      await service.updateExchangeRates();

      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
