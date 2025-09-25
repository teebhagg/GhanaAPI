import { HttpModule } from '@nestjs/axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Test, TestingModule } from '@nestjs/testing';
import { GSEApiProvider } from './providers/gse-api.provider';
import { StockMarketService } from './stock-market.service';

describe('StockMarketService', () => {
  let service: StockMarketService;
  let gseApiProvider: GSEApiProvider;
  let mockCacheManager: any;

  const mockRawStockData = {
    symbol: 'ACCESS',
    name: 'Access Bank Ghana Plc',
    price: 16.35,
    change: 0.0,
    changePercent: 0.0,
    previousClose: 16.35,
    volume: 2052,
    marketCap: 2844043194,
    sector: 'Financials',
    dayHigh: 16.35,
    dayLow: 16.35,
    weekHigh52: 19.62,
    weekLow52: 13.08,
    peRatio: undefined,
    dividendYield: undefined,
    lastTradingTime: '2024-01-15T16:00:00Z',
    status: 'OPEN' as const,
    companyInfo: {
      address:
        "Starlets' 91 Road, Opp. Accra Sports Stadium, PO Box GP 353, Osu, Accra, Ghana",
      email: 'info@ghana.accessbankplc.com',
      phone: '+233-302-742-699, +233-302-661-769, 0800-004-400 (Toll free)',
      website: 'www.ghana.accessbankplc.com',
      industry: 'Banking',
      sharesOutstanding: 173947596,
      earningsPerShare: null,
      dividendPerShare: null,
    },
  };

  const mockMarketIndices = {
    gseComposite: {
      value: 2500.0,
      change: 0.5,
      changePercent: 0.02,
      lastUpdated: '2024-01-15T16:00:00Z',
    },
    gseAllShare: {
      value: 2450.0,
      change: 0.48,
      changePercent: 0.019,
      lastUpdated: '2024-01-15T16:00:00Z',
    },
  };

  beforeEach(async () => {
    const mockGSEApiProvider = {
      fetchAllStocks: jest.fn().mockResolvedValue([mockRawStockData]),
      fetchStock: jest.fn().mockResolvedValue(mockRawStockData),
      fetchMarketIndices: jest.fn().mockResolvedValue(mockMarketIndices),
      getMarketStatus: jest.fn().mockReturnValue({
        isOpen: true,
        nextOpen: new Date('2024-01-16T10:00:00Z'),
        nextClose: new Date('2024-01-15T15:00:00Z'),
        timezone: 'Africa/Accra',
        lastUpdated: new Date('2024-01-15T16:00:00Z'),
      }),
    };

    mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [
        StockMarketService,
        {
          provide: GSEApiProvider,
          useValue: mockGSEApiProvider,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<StockMarketService>(StockMarketService);
    gseApiProvider = module.get<GSEApiProvider>(GSEApiProvider);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('searchStocks', () => {
    it('should return filtered stocks based on query', async () => {
      mockCacheManager.get.mockResolvedValueOnce(null); // Cache miss

      const searchQuery = { q: 'ACCESS' };
      const result = await service.searchStocks(searchQuery);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].symbol).toBe('ACCESS');
      expect(result.meta.total).toBe(1);
      expect(result.source).toContain('Ghana Stock Exchange');
    });

    it('should filter by sector', async () => {
      mockCacheManager.get.mockResolvedValueOnce(null);

      const searchQuery = { sector: 'Financials' };
      const result = await service.searchStocks(searchQuery);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].sector).toBe('Financials');
    });

    it('should filter by price range', async () => {
      mockCacheManager.get.mockResolvedValueOnce(null);

      const searchQuery = { minPrice: 10, maxPrice: 20 };
      const result = await service.searchStocks(searchQuery);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].price).toBeGreaterThanOrEqual(10);
      expect(result.data[0].price).toBeLessThanOrEqual(20);
    });
  });

  describe('getStock', () => {
    it('should return a specific stock', async () => {
      const result = await service.getStock('ACCESS');

      expect(result.symbol).toBe('ACCESS');
      expect(result.name).toBe('Access Bank Ghana Plc');
      expect(gseApiProvider.fetchStock).toHaveBeenCalledWith('ACCESS');
    });
  });

  describe('getAllStocks', () => {
    it('should return cached stocks if available', async () => {
      mockCacheManager.get.mockResolvedValueOnce([mockRawStockData]);

      const result = await service.getAllStocks();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockRawStockData);
      expect(gseApiProvider.fetchAllStocks).not.toHaveBeenCalled();
    });

    it('should fetch and cache stocks if not in cache', async () => {
      mockCacheManager.get.mockResolvedValueOnce(null); // Cache miss

      const result = await service.getAllStocks();

      expect(result).toHaveLength(1);
      expect(gseApiProvider.fetchAllStocks).toHaveBeenCalled();
      expect(mockCacheManager.set).toHaveBeenCalled();
    });
  });

  describe('getStocksBySector', () => {
    it('should return stocks filtered by sector', async () => {
      mockCacheManager.get.mockResolvedValueOnce(null);

      const result = await service.getStocksBySector('Financials');

      expect(result).toHaveLength(1);
      expect(result[0].sector).toBe('Financials');
    });
  });

  describe('getMarketSummary', () => {
    it('should return market summary', async () => {
      mockCacheManager.get.mockResolvedValueOnce(null); // Summary cache miss
      mockCacheManager.get.mockResolvedValueOnce(null); // Stocks cache miss

      const result = await service.getMarketSummary();

      expect(result).toHaveProperty('indexValue');
      expect(result).toHaveProperty('totalVolume');
      expect(result).toHaveProperty('marketStatus');
      expect(result.marketStatus).toBe('OPEN');
    });
  });

  describe('getSectors', () => {
    it('should return list of sectors', () => {
      const sectors = service.getSectors();

      expect(Array.isArray(sectors)).toBe(true);
      expect(sectors.length).toBeGreaterThan(0);
    });
  });

  describe('getSectorPerformance', () => {
    it('should return sector performance data', async () => {
      mockCacheManager.get.mockResolvedValueOnce(null);

      const result = await service.getSectorPerformance();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('sector');
      expect(result[0]).toHaveProperty('avgChangePercent');
      expect(result[0]).toHaveProperty('topPerformer');
    });
  });
});
