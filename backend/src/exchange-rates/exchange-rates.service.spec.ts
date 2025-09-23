import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Test, TestingModule } from '@nestjs/testing';
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
        mockRates,
        30 * 60,
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
    });

    it('should throw AppException when all providers fail', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockBogProvider.fetchRates.mockRejectedValue(new Error('BOG failed'));
      mockExchangeRateApiProvider.fetchRates.mockRejectedValue(
        new Error('ExchangeRateAPI failed'),
      );
      mockFixerProvider.fetchRates.mockRejectedValue(new Error('Fixer failed'));

      await expect(service.getCurrentRates(['USD'])).rejects.toThrow();

      expect(mockBogProvider.fetchRates).toHaveBeenCalled();
      expect(mockExchangeRateApiProvider.fetchRates).toHaveBeenCalled();
      expect(mockFixerProvider.fetchRates).toHaveBeenCalled();
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
      ]);
      expect(result).toEqual(mockRates);
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
      expect(mockBogProvider.convertCurrency).not.toHaveBeenCalled();
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
      expect(mockBogProvider.convertCurrency).toHaveBeenCalledWith(body);
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
      expect(mockBogProvider.convertCurrency).toHaveBeenCalled();
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
    });
  });

  describe('updateExchangeRates', () => {
    it('should handle scheduled rate updates (no-op in current implementation)', async () => {
      const result = await service.updateExchangeRates();

      expect(result).toBeUndefined();
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
