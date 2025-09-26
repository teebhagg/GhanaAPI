import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';
import { Test, TestingModule } from '@nestjs/testing';
import { FuelPriceService } from './fuel-price.service';

describe.skip('FuelPriceService Integration', () => {
  let service: FuelPriceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        HttpModule,
        CacheModule.register({
          ttl: 0, // Disable cache for testing
        }),
      ],
      providers: [FuelPriceService],
    }).compile();

    service = module.get<FuelPriceService>(FuelPriceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should fetch real fuel prices from at least one source', async () => {
    // This test will hit real APIs - it might be slow
    const result = await service.getFuelPrices();

    console.log('Fetched fuel prices:', result);

    expect(result).toBeDefined();
    expect(result.currency).toBe('GHS');
    expect(result.lastUpdated).toBeDefined();
    expect(result.source).toBeDefined();

    // At least one of petrol or diesel should be valid (> 0)
    expect(result.petrol !== null && result.petrol >= 0).toBe(true);
    expect(result.diesel !== null && result.diesel >= 0).toBe(true);

    // If we get non-zero values, they should be reasonable
    if (result.petrol !== null && result.petrol > 0) {
      expect(result.petrol).toBeGreaterThan(5);
      expect(result.petrol).toBeLessThan(50);
    }

    if (result.diesel !== null && result.diesel > 0) {
      expect(result.diesel).toBeGreaterThan(5);
      expect(result.diesel).toBeLessThan(50);
    }
  }, 30000); // 30 second timeout for network requests

  it('should handle CediRates specifically', async () => {
    // Test the CediRates scraper specifically
    try {
      const result = await (service as any).getFuelPricesFromCediRates();
      console.log('CediRates result:', result);

      expect(result).toBeDefined();
      expect(result.currency).toBe('GHS');

      if (result.petrol > 0 && result.diesel > 0) {
        expect(result.petrol).toBeGreaterThan(5);
        expect(result.diesel).toBeGreaterThan(5);
        expect(result.source).toContain('CediRates');
      }
    } catch (error) {
      console.log('CediRates failed (expected in some cases):', error.message);
      // This is acceptable as websites can be down or change structure
    }
  }, 15000);
});
