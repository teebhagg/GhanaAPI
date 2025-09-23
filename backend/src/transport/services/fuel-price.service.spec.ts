import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AxiosResponse } from 'axios';
import { Cache } from 'cache-manager';
import { of, throwError } from 'rxjs';
import { FuelPrice, FuelPriceService } from './fuel-price.service';

describe('FuelPriceService', () => {
  let service: FuelPriceService;
  let httpService: jest.Mocked<HttpService>;
  let cacheManager: jest.Mocked<Cache>;

  // Helper function to create mock AxiosResponse
  const createMockResponse = (data: string): AxiosResponse => ({
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {} as any,
  });

  const mockCediRatesHtml = `
    <html>
      <body>
        <table>
          <tr>
            <td></td>
            <td>Shell Get</td>
            <td>12.89</td>
            <td>13.89</td>
            <td>14.99</td>
          </tr>
          <tr>
            <td></td>
            <td>Goil Get</td>
            <td>12.99</td>
            <td>13.90</td>
            <td>14.90</td>
          </tr>
          <tr>
            <td></td>
            <td>TotalEnergies Get</td>
            <td>12.88</td>
            <td>14.30</td>
            <td>16.67</td>
          </tr>
          <tr>
            <td></td>
            <td>StarOil Get</td>
            <td>12.77</td>
            <td>13.45</td>
            <td>14.68</td>
          </tr>
        </table>
      </body>
    </html>
  `;

  const mockNpaHtml = `
    <html>
      <body>
        <div class="entry-title">
          <a href="/press-release-fuel-prices">Latest Fuel Price Announcement</a>
        </div>
      </body>
    </html>
  `;

  const mockNpaArticleHtml = `
    <html>
      <body>
        <div class="entry-content">
          <p>The National Petroleum Authority announces the following indicative prices:</p>
          <p>Petrol: GH¢ 13.50 per litre</p>
          <p>Diesel: GH¢ 14.20 per litre</p>
          <p>LPG: GH¢ 13.80 per kilogram</p>
        </div>
      </body>
    </html>
  `;

  const mockCitiNewsHtml = `
    <html>
      <body>
        <div class="entry-title">
          <a href="/latest-fuel-prices-article">Fuel prices increase by 5%</a>
        </div>
      </body>
    </html>
  `;

  const mockCitiNewsArticleHtml = `
    <html>
      <body>
        <div class="entry-content">
          <p>The latest fuel price data shows petrol at GH¢ 13.25 and diesel at GH¢ 13.85 per litre.</p>
        </div>
      </body>
    </html>
  `;

  beforeEach(async () => {
    const mockHttpService = {
      get: jest.fn(),
    };

    const mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FuelPriceService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<FuelPriceService>(FuelPriceService);
    httpService = module.get(HttpService);
    cacheManager = module.get(CACHE_MANAGER);

    // Mock logger to avoid console output during tests
    jest.spyOn(Logger.prototype, 'debug').mockImplementation();
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getFuelPrices', () => {
    it('should return cached prices if available', async () => {
      const cachedPrices: Partial<FuelPrice> = {
        petrol: 13.5,
        diesel: 14.2,
        lpg: 13.8,
        currency: 'GHS',
        lastUpdated: '2023-09-23T10:00:00.000Z',
        source: 'Cached',
      };

      cacheManager.get.mockResolvedValue(cachedPrices);

      const result = await service.getFuelPrices();

      expect(result).toEqual(cachedPrices);
      expect(cacheManager.get).toHaveBeenCalledWith('fuel_prices');
      expect(httpService.get).not.toHaveBeenCalled();
    });

    it('should fetch from NPA when cache is empty', async () => {
      cacheManager.get.mockResolvedValue(null);

      // Mock NPA responses
      httpService.get
        .mockReturnValueOnce(of(createMockResponse(mockNpaHtml)))
        .mockReturnValueOnce(of(createMockResponse(mockNpaArticleHtml)));

      const result = await service.getFuelPrices();

      expect(result.petrol).toBe(13.5);
      expect(result.diesel).toBe(14.2);
      expect(result.lpg).toBe(13.8);
      expect(result.currency).toBe('GHS');
      expect(result.source).toBe('National Petroleum Authority (NPA)');
      expect(result.status).toBe('success');
      expect(cacheManager.set).toHaveBeenCalled();
    });

    it('should fallback to CediRates when NPA fails', async () => {
      cacheManager.get.mockResolvedValue(null);

      // Mock NPA failure and CediRates success
      httpService.get
        .mockReturnValueOnce(throwError(() => new Error('NPA failed')))
        .mockReturnValueOnce(of(createMockResponse(mockCediRatesHtml)));

      const result = await service.getFuelPrices();

      expect(result.petrol).toBeCloseTo(12.88, 2); // Average of Shell, Goil, Total, Star Oil
      expect(result.diesel).toBeCloseTo(13.89, 2);
      expect(result.currency).toBe('GHS');
      expect(result.source).toContain('CediRates.com');
      expect(result.status).toBe('success');
    });

    it('should fallback to Citi News when both NPA and CediRates fail', async () => {
      cacheManager.get.mockResolvedValue(null);

      // Mock NPA and CediRates failure, Citi News success
      httpService.get
        .mockReturnValueOnce(throwError(() => new Error('NPA failed')))
        .mockReturnValueOnce(throwError(() => new Error('CediRates failed')))
        .mockReturnValueOnce(of(createMockResponse(mockCitiNewsHtml)))
        .mockReturnValueOnce(of(createMockResponse(mockCitiNewsArticleHtml)));

      const result = await service.getFuelPrices();

      expect(result.petrol).toBe(13.25);
      expect(result.diesel).toBe(13.85);
      expect(result.currency).toBe('GHS');
      expect(result.source).toBe('Citi News Room');
      expect(result.status).toBe('success');
    });

    it('should return zero values when all sources fail', async () => {
      cacheManager.get.mockResolvedValue(null);

      // Mock all sources failing
      httpService.get.mockReturnValue(
        throwError(() => new Error('All sources failed')),
      );

      const result = await service.getFuelPrices();

      expect(result.petrol).toBe(0);
      expect(result.diesel).toBe(0);
      expect(result.lpg).toBe(0);
      expect(result.currency).toBe('GHS');
      expect(result.source).toBe('No sources available');
      expect(result.status).toBe('failed');
      expect(result.errorMessage).toBe(
        'All fuel price sources returned zero or invalid values',
      );

      // Should cache zero values for shorter period
      expect(cacheManager.set).toHaveBeenCalledWith(
        'fuel_prices',
        result,
        expect.any(Number), // Using FAILURE_CACHE_TTL_MS constant
      );
    });
  });

  describe('isValidFuelPriceData', () => {
    it('should validate correct fuel price data', () => {
      const validData: Partial<FuelPrice> = {
        petrol: 13.5,
        diesel: 14.2,
        currency: 'GHS',
        lastUpdated: '2023-09-23T10:00:00.000Z',
        source: 'Test',
      };

      // Access private method for testing
      const isValid = (service as any).isValidFuelPriceData(validData);
      expect(isValid).toBe(true);
    });

    it('should reject data with zero prices', () => {
      const invalidData: Partial<FuelPrice> = {
        petrol: 0,
        diesel: 14.2,
        currency: 'GHS',
        lastUpdated: '2023-09-23T10:00:00.000Z',
        source: 'Test',
      };

      const isValid = (service as any).isValidFuelPriceData(invalidData);
      expect(isValid).toBe(false);
    });

    it('should reject data with unrealistic high prices', () => {
      const invalidData: Partial<FuelPrice> = {
        petrol: 100, // Too high
        diesel: 14.2,
        currency: 'GHS',
        lastUpdated: '2023-09-23T10:00:00.000Z',
        source: 'Test',
      };

      const isValid = (service as any).isValidFuelPriceData(invalidData);
      expect(isValid).toBe(false);
    });

    it('should reject data with wrong currency', () => {
      const invalidData: Partial<FuelPrice> = {
        petrol: 13.5,
        diesel: 14.2,
        currency: 'USD', // Wrong currency
        lastUpdated: '2023-09-23T10:00:00.000Z',
        source: 'Test',
      };

      const isValid = (service as any).isValidFuelPriceData(invalidData);
      expect(isValid).toBe(false);
    });
  });

  describe('getCacheTTL', () => {
    it('should calculate TTL correctly for current day', () => {
      // Mock current time to 10:00 AM
      const mockNow = new Date('2023-09-23T10:00:00.000Z');
      jest.useFakeTimers();
      jest.setSystemTime(mockNow);

      const ttl = (service as any).getCacheTTL();

      // Should be approximately 14 hours (until 11:59 PM)
      expect(ttl).toBeGreaterThan(40000); // More than 11 hours in seconds
      expect(ttl).toBeLessThan(60000); // Less than 16.6 hours in seconds

      jest.useRealTimers();
    });
  });

  describe('parseCediRatesFuelPrices', () => {
    it('should parse CediRates HTML correctly', () => {
      const result = (service as any).parseCediRatesFuelPrices(
        mockCediRatesHtml,
      );

      // Should calculate average of Shell (12.89), Goil (12.99), Total (12.88), Star Oil (12.77)
      const expectedPetrolAvg = (12.89 + 12.99 + 12.88 + 12.77) / 4;
      const expectedDieselAvg = (13.89 + 13.9 + 14.3 + 13.45) / 4;

      expect(result.petrol).toBeCloseTo(expectedPetrolAvg, 2);
      expect(result.diesel).toBeCloseTo(expectedDieselAvg, 2);
      expect(result.currency).toBe('GHS');
      expect(result.source).toContain('CediRates.com');
      expect(result.status).toBe('success');
    });

    it('should handle empty HTML gracefully', () => {
      const result = (service as any).parseCediRatesFuelPrices(
        '<html><body></body></html>',
      );

      // Should return 0 values when no valid data is found
      expect(result.petrol).toBe(0);
      expect(result.diesel).toBe(0);
      expect(result.currency).toBe('GHS');
    });
  });

  describe('Error handling and resilience', () => {
    it('should handle network timeouts gracefully', async () => {
      cacheManager.get.mockResolvedValue(null);
      httpService.get.mockReturnValue(throwError(() => new Error('TIMEOUT')));

      const result = await service.getFuelPrices();

      expect(result.petrol).toBe(0);
      expect(result.diesel).toBe(0);
      expect(result.source).toBe('No sources available');
      expect(result.status).toBe('failed');
    });

    it('should handle malformed HTML gracefully', async () => {
      cacheManager.get.mockResolvedValue(null);
      httpService.get.mockReturnValue(of(createMockResponse('<invalid html>')));

      const result = await service.getFuelPrices();

      expect(result.petrol).toBe(0);
      expect(result.diesel).toBe(0);
      expect(result.source).toBe('No sources available');
      expect(result.status).toBe('failed');
    });

    it('should handle HTTP 404 responses gracefully', async () => {
      cacheManager.get.mockResolvedValue(null);
      httpService.get.mockReturnValue(
        throwError(() => ({ status: 404, message: 'Not Found' })),
      );

      const result = await service.getFuelPrices();

      expect(result.petrol).toBe(0);
      expect(result.diesel).toBe(0);
      expect(result.source).toBe('No sources available');
      expect(result.status).toBe('failed');
    });
  });

  describe('Integration scenarios', () => {
    it('should prioritize sources correctly', async () => {
      cacheManager.get.mockResolvedValue(null);

      // Mock NPA success (should be preferred)
      httpService.get
        .mockReturnValueOnce(of(createMockResponse(mockNpaHtml)))
        .mockReturnValueOnce(of(createMockResponse(mockNpaArticleHtml)));

      const result = await service.getFuelPrices();

      expect(result.source).toBe('National Petroleum Authority (NPA)');

      // Should not call other sources since NPA succeeded
      expect(httpService.get).toHaveBeenCalledTimes(2); // Only NPA calls
    });

    it('should cache successful results with correct TTL', async () => {
      cacheManager.get.mockResolvedValue(null);

      httpService.get
        .mockReturnValueOnce(of(createMockResponse(mockNpaHtml)))
        .mockReturnValueOnce(of(createMockResponse(mockNpaArticleHtml)));

      await service.getFuelPrices();

      expect(cacheManager.set).toHaveBeenCalledWith(
        'fuel_prices',
        expect.objectContaining({
          petrol: expect.any(Number),
          diesel: expect.any(Number),
          currency: 'GHS',
        }),
        expect.any(Number), // TTL in milliseconds
      );
    });
  });

  describe('isValidPrice', () => {
    it('should validate petrol prices within range', () => {
      expect((service as any).isValidPrice(13.5, 'petrol')).toBe(true);
      expect((service as any).isValidPrice(4.9, 'petrol')).toBe(false); // Too low
      expect((service as any).isValidPrice(50.1, 'petrol')).toBe(false); // Too high
      expect((service as any).isValidPrice(0, 'petrol')).toBe(false); // Zero
      expect((service as any).isValidPrice(NaN, 'petrol')).toBe(false); // NaN
    });

    it('should validate diesel prices within range', () => {
      expect((service as any).isValidPrice(14.2, 'diesel')).toBe(true);
      expect((service as any).isValidPrice(4.9, 'diesel')).toBe(false); // Too low
      expect((service as any).isValidPrice(50.1, 'diesel')).toBe(false); // Too high
    });

    it('should validate LPG prices within range', () => {
      expect((service as any).isValidPrice(15.5, 'lpg')).toBe(true);
      expect((service as any).isValidPrice(2.9, 'lpg')).toBe(false); // Too low
      expect((service as any).isValidPrice(30.1, 'lpg')).toBe(false); // Too high
    });
  });

  describe('containsFuelPriceTerms', () => {
    it('should detect fuel price related terms', () => {
      expect(
        (service as any).containsFuelPriceTerms('Fuel prices increase'),
      ).toBe(true);
      expect((service as any).containsFuelPriceTerms('Petrol costs more')).toBe(
        true,
      );
      expect(
        (service as any).containsFuelPriceTerms('Diesel price update'),
      ).toBe(true);
      expect(
        (service as any).containsFuelPriceTerms('Indicative petroleum prices'),
      ).toBe(true);
      expect((service as any).containsFuelPriceTerms('LPG gas prices')).toBe(
        true,
      );
      expect(
        (service as any).containsFuelPriceTerms('Random news article'),
      ).toBe(false);
      expect((service as any).containsFuelPriceTerms('')).toBe(false);
    });

    it('should be case insensitive', () => {
      expect((service as any).containsFuelPriceTerms('FUEL PRICES')).toBe(true);
      expect((service as any).containsFuelPriceTerms('Petrol PRICE')).toBe(
        true,
      );
      expect((service as any).containsFuelPriceTerms('indicative prices')).toBe(
        true,
      );
    });
  });
});
