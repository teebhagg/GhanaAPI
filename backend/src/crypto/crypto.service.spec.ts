import { Test, TestingModule } from '@nestjs/testing';
import { CryptoService } from './crypto.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { HttpService } from '@nestjs/axios';
import { ExchangeRatesService } from '../exchange-rates/exchange-rates.service';
import { of } from 'rxjs';

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

  it('should return cached data if available', async () => {
    const cachedData = { data: { bitcoin: { usd: 60000, ghs: 900000 } } };
    mockCacheManager.get.mockResolvedValue(cachedData);

    const result = await service.getCryptoPrices(['bitcoin']);

    expect(result).toEqual(cachedData);
    expect(mockHttpService.get).not.toHaveBeenCalled();
  });
});
