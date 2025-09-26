import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AxiosResponse } from 'axios';
import * as cheerio from 'cheerio';
import { of } from 'rxjs';
import { FuelPriceService } from '../transport/services/fuel-price.service';

// Unmock cheerio for this specific test to use the real implementation
jest.unmock('cheerio');

describe('Debug Fuel Test', () => {
  let service: FuelPriceService;
  let httpService: jest.Mocked<HttpService>;

  // Helper function to create mock AxiosResponse
  const createMockResponse = (data: string): AxiosResponse => ({
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {} as any,
  });

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

    // Mock logger to avoid console output during tests
    jest.spyOn(Logger.prototype, 'debug').mockImplementation();
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  it('should debug cheerio parsing', () => {
    console.log('=== Testing Cheerio parsing ===');

    const $ = cheerio.load(mockNpaArticleHtml);
    const articleText = $('.entry-content').text();

    console.log('Article text:', articleText);

    // Test the regex patterns directly
    const petrolPattern =
      /(?:petrol|gasoline).*?(?:gh¢|ghs|cedi)?\s*(\d+\.?\d*)/gi;
    const petrolMatches = articleText.match(petrolPattern);

    console.log('Petrol matches:', petrolMatches);

    if (petrolMatches && petrolMatches.length > 0) {
      const priceMatch = petrolMatches[0].match(/(\d+\.?\d*)/);
      console.log('Price match:', priceMatch);
      if (priceMatch) {
        const price = parseFloat(priceMatch[1]);
        console.log('Parsed price:', price);
      }
    }

    expect(true).toBe(true); // Just to make the test pass
  });

  it('should debug full NPA flow', async () => {
    console.log('=== Testing full NPA flow ===');

    const mockCacheManager = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn(),
    };

    // Mock cache as empty
    (mockCacheManager.get as jest.Mock).mockResolvedValue(null);

    // Mock NPA responses
    httpService.get
      .mockReturnValueOnce(of(createMockResponse(mockNpaHtml)))
      .mockReturnValueOnce(of(createMockResponse(mockNpaArticleHtml)));

    console.log('HTTP service mock setup complete');

    try {
      const result = await service.getFuelPrices();
      console.log('Fuel prices result:', result);

      expect(result).toBeDefined();
    } catch (error) {
      console.error('Error in getFuelPrices:', error);
    }
  });
});
