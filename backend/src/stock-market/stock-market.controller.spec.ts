import { Test, TestingModule } from '@nestjs/testing';
import { StockSearchResponseDto } from './dto/stock-search-response.dto';
import { StockDto } from './dto/stock.dto';
import { StockMarketController } from './stock-market.controller';
import { StockMarketService } from './stock-market.service';

describe('StockMarketController', () => {
  let controller: StockMarketController;
  let service: StockMarketService;

  const mockStockData: StockDto = {
    symbol: 'GCB',
    name: 'GCB Bank Limited',
    price: 4.5,
    change: 0.15,
    changePercent: 3.45,
    previousClose: 4.35,
    volume: 125000,
    marketCap: 2500000000,
    sector: 'Banking',
    dayHigh: 4.65,
    dayLow: 4.4,
    weekHigh52: 5.2,
    weekLow52: 3.8,
    peRatio: 8.5,
    dividendYield: 12.5,
    lastTradingTime: '2024-01-15T16:00:00Z',
    status: 'CLOSED',
  };

  const mockSearchResponse: StockSearchResponseDto = {
    data: [mockStockData],
    meta: {
      total: 1,
      page: 1,
      limit: 20,
      searchQuery: 'GCB',
    },
    source: 'Ghana Stock Exchange API (https://dev.kwayisi.org/apis/gse)',
    timestamp: '2024-01-15T10:30:00Z',
  };

  const mockStockMarketService = {
    searchStocks: jest.fn().mockResolvedValue(mockSearchResponse),
    getStock: jest.fn().mockResolvedValue(mockStockData),
    getAllStocks: jest.fn().mockResolvedValue([
      {
        symbol: 'GCB',
        name: 'GCB Bank Limited',
        price: 4.5,
        change: 0.15,
        changePercent: 3.45,
        previousClose: 4.35,
        volume: 125000,
        marketCap: 2500000000,
        sector: 'Banking',
        dayHigh: 4.65,
        dayLow: 4.4,
        weekHigh52: 5.2,
        weekLow52: 3.8,
        peRatio: 8.5,
        dividendYield: 12.5,
        lastTradingTime: '2024-01-15T16:00:00Z',
        status: 'CLOSED',
      },
    ]),
    getStocksBySector: jest.fn().mockResolvedValue([mockStockData]),
    getMarketSummary: jest.fn().mockResolvedValue({
      indexValue: 3245.67,
      indexChange: 15.43,
      indexChangePercent: 0.48,
      totalVolume: 2500000,
      totalMarketCap: 75000000000,
      advancing: 25,
      declining: 15,
      unchanged: 5,
      marketStatus: 'CLOSED',
      lastUpdated: '2024-01-15T16:00:00Z',
    }),
    getSectorPerformance: jest.fn().mockResolvedValue([
      {
        sector: 'Banking',
        stockCount: 8,
        avgChangePercent: 2.15,
        marketCap: 25000000000,
        volume: 850000,
        topPerformer: mockStockData,
      },
    ]),
    getSectors: jest.fn().mockReturnValue(['Banking', 'Insurance', 'Mining']),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StockMarketController],
      providers: [
        {
          provide: StockMarketService,
          useValue: mockStockMarketService,
        },
      ],
    }).compile();

    controller = module.get<StockMarketController>(StockMarketController);
    service = module.get<StockMarketService>(StockMarketService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('searchStocks', () => {
    it('should return search results', async () => {
      const query = { q: 'GCB', limit: 20 };
      const result = await controller.searchStocks(query);

      expect(result).toEqual(mockSearchResponse);
      expect(service.searchStocks).toHaveBeenCalledWith(query);
    });
  });

  describe('getStock', () => {
    it('should return a specific stock', async () => {
      const result = await controller.getStock('GCB');

      expect(result).toEqual(mockStockData);
      expect(service.getStock).toHaveBeenCalledWith('GCB');
    });
  });

  describe('getAllStocks', () => {
    it('should return all stocks', async () => {
      const result = await controller.getAllStocks();

      expect(result).toEqual([mockStockData]);
      expect(service.getAllStocks).toHaveBeenCalled();
    });
  });

  describe('getStocksBySector', () => {
    it('should return stocks for a specific sector', async () => {
      const result = await controller.getStocksBySector('Banking');

      expect(result).toEqual([mockStockData]);
      expect(service.getStocksBySector).toHaveBeenCalledWith('Banking');
    });
  });

  describe('getMarketSummary', () => {
    it('should return market summary', async () => {
      const result = await controller.getMarketSummary();

      expect(result).toBeDefined();
      expect(result.marketStatus).toBe('CLOSED');
      expect(service.getMarketSummary).toHaveBeenCalled();
    });
  });

  describe('getSectorPerformance', () => {
    it('should return sector performance data', async () => {
      const result = await controller.getSectorPerformance();

      expect(result).toBeDefined();
      expect(result[0].sector).toBe('Banking');
      expect(service.getSectorPerformance).toHaveBeenCalled();
    });
  });

  describe('getSectors', () => {
    it('should return list of sectors', () => {
      const result = controller.getSectors();

      expect(result).toEqual(['Banking', 'Insurance', 'Mining']);
      expect(service.getSectors).toHaveBeenCalled();
    });
  });
});
