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
    it('should return a specific stock from the cached list', async () => {
      const result = await service.getStock('access');

      expect(result.symbol).toBe('ACCESS');
      expect(result.name).toBe('Access Bank Ghana Plc');
      // Served from the shared list, not a per-symbol upstream call
      expect(gseApiProvider.fetchAllStocks).toHaveBeenCalledTimes(1);
      expect(gseApiProvider.fetchStock).not.toHaveBeenCalled();
    });

    it('should throw 404 for a symbol that is not listed', async () => {
      await expect(service.getStock('NOPE')).rejects.toMatchObject({
        status: 404,
      });
    });

    it('should throw 503 when the list is unavailable', async () => {
      (gseApiProvider.fetchAllStocks as jest.Mock).mockRejectedValue(
        new Error('upstream down'),
      );
      await expect(service.getStock('ACCESS')).rejects.toMatchObject({
        status: 503,
      });
    });
  });

  describe('getAllStocks', () => {
    it('keeps serving the last good prices over a weekend, then gives up', async () => {
      const t0 = 1_700_000_000_000;
      const day = 24 * 60 * 60 * 1000;
      const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(t0);
      await service.getAllStocks();
      (gseApiProvider.fetchAllStocks as jest.Mock).mockRejectedValue(
        new Error('upstream down'),
      );

      nowSpy.mockReturnValue(t0 + 2 * day);
      await expect(service.getAllStocks()).resolves.toHaveLength(1);

      nowSpy.mockReturnValue(t0 + 4 * day);
      await expect(service.getAllStocks()).rejects.toMatchObject({
        status: 503,
      });
      nowSpy.mockRestore();
    });

    it('should fetch stocks from the provider on first use', async () => {
      const result = await service.getAllStocks();

      expect(result).toHaveLength(1);
      expect(gseApiProvider.fetchAllStocks).toHaveBeenCalledTimes(1);
    });

    it('should serve a second call from memory without calling the provider', async () => {
      await service.getAllStocks();
      const result = await service.getAllStocks();

      expect(result[0]).toEqual(mockRawStockData);
      expect(gseApiProvider.fetchAllStocks).toHaveBeenCalledTimes(1);
    });

    it('should share one provider call between simultaneous requests', async () => {
      await Promise.all(
        Array.from({ length: 20 }, () => service.getAllStocks()),
      );

      expect(gseApiProvider.fetchAllStocks).toHaveBeenCalledTimes(1);
    });

    it('should throw 503 (not 500) when there is no data and the provider fails', async () => {
      (gseApiProvider.fetchAllStocks as jest.Mock).mockRejectedValueOnce(
        new Error('GSE API down'),
      );

      await expect(service.getAllStocks()).rejects.toMatchObject({
        status: 503,
      });
    });

    it('should pass the 503 through search and sector queries', async () => {
      (gseApiProvider.fetchAllStocks as jest.Mock).mockRejectedValue(
        new Error('GSE API down'),
      );

      await expect(service.searchStocks({} as any)).rejects.toMatchObject({
        status: 503,
      });
      await expect(
        service.getStocksBySector('Financials'),
      ).rejects.toMatchObject({
        status: 503,
      });
    });

    it('should report freshness of the stored data', async () => {
      expect(service.getFreshness()).toEqual({ asOf: null, stale: false });

      await service.getAllStocks();

      const freshness = service.getFreshness();
      expect(freshness.asOf).toEqual(expect.any(String));
      expect(freshness.stale).toBe(false);
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

    it('reports when the prices were fetched, not when the summary was built', async () => {
      const t0 = 1_700_000_000_000;
      const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(t0);
      await service.getAllStocks();

      nowSpy.mockReturnValue(t0 + 60 * 60 * 1000); // an hour on, still serving the old prices
      (gseApiProvider.fetchAllStocks as jest.Mock).mockRejectedValue(
        new Error('upstream down'),
      );
      mockCacheManager.get.mockResolvedValue(null);

      const result = await service.getMarketSummary();

      expect(result.lastUpdated).toBe(new Date(t0).toISOString());
      nowSpy.mockRestore();
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
