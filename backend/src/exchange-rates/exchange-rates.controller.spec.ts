import { Test, TestingModule } from '@nestjs/testing';
import { ExchangeRatesController } from './exchange-rates.controller';
import { ExchangeRatesService } from './exchange-rates.service';

describe('ExchangeRatesController', () => {
  let controller: ExchangeRatesController;
  let service: ExchangeRatesService;

  const mockExchangeRatesService = {
    getCurrentRates: jest.fn(),
    getHistoricalRates: jest.fn(),
    convertCurrency: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExchangeRatesController],
      providers: [
        {
          provide: ExchangeRatesService,
          useValue: mockExchangeRatesService,
        },
      ],
    }).compile();

    controller = module.get<ExchangeRatesController>(ExchangeRatesController);
    service = module.get<ExchangeRatesService>(ExchangeRatesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCurrentRates', () => {
    it('should return current exchange rates with default currencies', async () => {
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
      ];

      mockExchangeRatesService.getCurrentRates.mockResolvedValue(mockRates);

      const result = await controller.getCurrentRates();

      expect(service.getCurrentRates).toHaveBeenCalledWith(undefined);
      expect(result).toEqual(mockRates);
    });

    it('should return current exchange rates for specific currencies', async () => {
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
      ];

      mockExchangeRatesService.getCurrentRates.mockResolvedValue(mockRates);

      const result = await controller.getCurrentRates('USD,EUR');

      expect(service.getCurrentRates).toHaveBeenCalledWith(['USD', 'EUR']);
      expect(result).toEqual(mockRates);
    });

    it('should handle empty currency list', async () => {
      const mockRates = [];

      mockExchangeRatesService.getCurrentRates.mockResolvedValue(mockRates);

      const result = await controller.getCurrentRates('');

      expect(service.getCurrentRates).toHaveBeenCalledWith([]);
      expect(result).toEqual(mockRates);
    });

    it('should trim and uppercase currency codes', async () => {
      const mockRates = [
        {
          baseCurrency: 'GHS',
          targetCurrency: 'USD',
          rate: 12.5,
          provider: 'BOG',
          timestamp: new Date(),
        },
      ];

      mockExchangeRatesService.getCurrentRates.mockResolvedValue(mockRates);

      await controller.getCurrentRates(' usd , eur ');

      expect(service.getCurrentRates).toHaveBeenCalledWith(['USD', 'EUR']);
    });
  });

  describe('getHistoricalRates', () => {
    it('should return historical rates', async () => {
      const mockHistoricalRates = [
        { date: '2023-01-01', rate: 12.0 },
        { date: '2023-01-02', rate: 12.1 },
      ];

      mockExchangeRatesService.getHistoricalRates.mockResolvedValue(
        mockHistoricalRates,
      );

      const result = await controller.getHistoricalRates(
        '2023-01-01',
        '2023-01-02',
        'USD',
      );

      expect(service.getHistoricalRates).toHaveBeenCalledWith(
        new Date('2023-01-01'),
        new Date('2023-01-02'),
        'USD',
      );
      expect(result).toEqual(mockHistoricalRates);
    });

    it('should handle date parsing correctly', async () => {
      mockExchangeRatesService.getHistoricalRates.mockResolvedValue([]);

      await controller.getHistoricalRates('2023-12-01', '2023-12-31', 'EUR');

      expect(service.getHistoricalRates).toHaveBeenCalledWith(
        new Date('2023-12-01'),
        new Date('2023-12-31'),
        'EUR',
      );
    });
  });

  describe('getTrend', () => {
    it('should return trend data for a currency', async () => {
      const mockTrendData = [
        { date: new Date().toISOString(), rate: 12.5 },
        { date: new Date().toISOString(), rate: 12.6 },
      ];

      mockExchangeRatesService.getHistoricalRates.mockResolvedValue(
        mockTrendData,
      );

      const result = await controller.getTrend('USD');

      // Should call getHistoricalRates with 7 days ago to now
      expect(service.getHistoricalRates).toHaveBeenCalledWith(
        expect.any(Date),
        expect.any(Date),
        'USD',
      );
      expect(result).toEqual(mockTrendData);
    });

    it('should calculate correct date range for trend', async () => {
      mockExchangeRatesService.getHistoricalRates.mockResolvedValue([]);

      await controller.getTrend('EUR');

      const calls = mockExchangeRatesService.getHistoricalRates.mock.calls;
      const [fromDate, toDate] = calls[0];

      expect(toDate).toBeInstanceOf(Date);
      expect(fromDate).toBeInstanceOf(Date);
      expect(toDate.getTime() - fromDate.getTime()).toBeCloseTo(
        7 * 24 * 60 * 60 * 1000,
        -100000,
      );
    });
  });

  describe('convertCurrency', () => {
    it('should convert currency successfully', async () => {
      const mockConversion = {
        from: 'USD',
        to: 'GHS',
        amount: 100,
        result: 1250,
        rate: 12.5,
        provider: 'BOG',
        timestamp: new Date(),
      };

      mockExchangeRatesService.convertCurrency.mockResolvedValue(
        mockConversion,
      );

      const body = { from: 'USD', to: 'GHS', amount: 100 };
      const result = await controller.convertCurrency(body);

      expect(service.convertCurrency).toHaveBeenCalledWith(body);
      expect(result).toEqual(mockConversion);
    });

    it('should handle different currency pairs', async () => {
      const mockConversion = {
        from: 'EUR',
        to: 'GHS',
        amount: 50,
        result: 660,
        rate: 13.2,
        provider: 'ExchangeRateAPI',
        timestamp: new Date(),
      };

      mockExchangeRatesService.convertCurrency.mockResolvedValue(
        mockConversion,
      );

      const body = { from: 'EUR', to: 'GHS', amount: 50 };
      const result = await controller.convertCurrency(body);

      expect(service.convertCurrency).toHaveBeenCalledWith(body);
      expect(result).toEqual(mockConversion);
    });

    it('should handle zero amount conversion', async () => {
      const mockConversion = {
        from: 'USD',
        to: 'GHS',
        amount: 0,
        result: 0,
        rate: 12.5,
        provider: 'BOG',
        timestamp: new Date(),
      };

      mockExchangeRatesService.convertCurrency.mockResolvedValue(
        mockConversion,
      );

      const body = { from: 'USD', to: 'GHS', amount: 0 };
      const result = await controller.convertCurrency(body);

      expect(service.convertCurrency).toHaveBeenCalledWith(body);
      expect(result).toEqual(mockConversion);
    });
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
