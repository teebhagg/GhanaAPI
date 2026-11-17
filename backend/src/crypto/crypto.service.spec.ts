import { Test, TestingModule } from '@nestjs/testing';
import { CryptoService } from './crypto.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { HttpService } from '@nestjs/axios';
import { ExchangeRatesService } from '../exchange-rates/exchange-rates.service';
import { of, throwError } from 'rxjs';
import { ServiceUnavailableException } from '@nestjs/common';

describe('CryptoService', () => {
  let service: CryptoService;
  let mockCacheManager: any;
  let mockHttpService: any;
  let mockExchangeRatesService: any;

  beforeEach(async () => {
    mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
    };

    mockHttpService = {
      get: jest.fn(() => of({ data: { bitcoin: { usd: 60000 } } })),
    };

    mockExchangeRatesService = {
      convertCurrency: jest.fn().mockResolvedValue({ result: 900000 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CryptoService,
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
        { provide: HttpService, useValue: mockHttpService },
        { provide: ExchangeRatesService, useValue: mockExchangeRatesService },
      ],
    }).compile();

    service = module.get<CryptoService>(CryptoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should fetch crypto prices and convert to GHS', async () => {
    mockCacheManager.get.mockResolvedValue(null); // cache miss

    const result = await service.getCryptoPrices(['bitcoin']);

    expect(result).toBeDefined();
    expect(result.data.bitcoin.usd).toEqual(60000);
    expect(result.data.bitcoin.ghs).toEqual(900000);
    expect(mockHttpService.get).toHaveBeenCalled();
    expect(mockExchangeRatesService.convertCurrency).toHaveBeenCalled();
    expect(mockCacheManager.set).toHaveBeenCalled();
  });

  it('should throw 503 and not cache when CoinGecko fails', async () => {
    mockCacheManager.get.mockResolvedValue(null);
    mockHttpService.get = jest.fn(() => throwError(() => new Error('429')));

    await expect(service.getCryptoPrices(['bitcoin'])).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(mockCacheManager.set).not.toHaveBeenCalled();
  });

  it('should throw 503 and not invent a GHS rate when conversion fails', async () => {
    mockCacheManager.get.mockResolvedValue(null);
    mockExchangeRatesService.convertCurrency.mockRejectedValueOnce(new Error('down'));

    await expect(service.getCryptoPrices(['bitcoin'])).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(mockCacheManager.set).not.toHaveBeenCalled();
  });

  it('should return cached data if available', async () => {
    const cachedData = { data: { bitcoin: { usd: 60000, ghs: 900000 } } };
    mockCacheManager.get.mockResolvedValue(cachedData);

    const result = await service.getCryptoPrices(['bitcoin']);

    expect(result).toEqual(cachedData);
    expect(mockHttpService.get).not.toHaveBeenCalled();
  });

  describe('getHealth', () => {
    it('is healthy before any request', () => {
      expect(service.getHealth()).toMatchObject({
        status: 'healthy',
        asOf: null,
      });
    });

    it('is unhealthy after a failed attempt and healthy after a later success', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockHttpService.get = jest.fn(() => throwError(() => new Error('429')));
      await service.getCryptoPrices(['bitcoin']).catch(() => undefined);
      expect(service.getHealth().status).toBe('unhealthy');

      mockHttpService.get = jest.fn(() =>
        of({ data: { bitcoin: { usd: 60000 } } }),
      );
      await service.getCryptoPrices(['bitcoin']);
      const health = service.getHealth();
      expect(health.status).toBe('healthy');
      expect(health.asOf).not.toBeNull();
    });

    it('is unhealthy when the GHS conversion fails', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockExchangeRatesService.convertCurrency.mockRejectedValueOnce(
        new Error('down'),
      );
      await service.getCryptoPrices(['bitcoin']).catch(() => undefined);

      expect(service.getHealth().status).toBe('unhealthy');
    });
  });
});
