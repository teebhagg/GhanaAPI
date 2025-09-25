import { HttpModule } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import { GSEApiProvider } from '../providers/gse-api.provider';

describe('GSEApiProvider Integration', () => {
  let provider: GSEApiProvider;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [GSEApiProvider],
    }).compile();

    provider = module.get<GSEApiProvider>(GSEApiProvider);
  });

  describe('Real GSE API Integration', () => {
    it('should fetch live stock data from real GSE API', async () => {
      const stocks = await provider.fetchAllStocks();

      expect(stocks).toBeDefined();
      expect(Array.isArray(stocks)).toBe(true);
      expect(stocks.length).toBeGreaterThan(0);

      // Check the structure of the first stock
      const firstStock = stocks[0];
      expect(firstStock).toHaveProperty('symbol');
      expect(firstStock).toHaveProperty('name');
      expect(firstStock).toHaveProperty('price');
      expect(firstStock).toHaveProperty('sector');
      expect(typeof firstStock.price).toBe('number');
      expect(typeof firstStock.volume).toBe('number');

      console.log(`Fetched ${stocks.length} stocks from GSE API`);
      console.log('Sample stock:', firstStock);
    }, 15000); // 15 second timeout for network request

    it('should fetch specific stock by symbol', async () => {
      // Use ACCESS as it's a common stock
      const stock = await provider.fetchStock('ACCESS');

      expect(stock).toBeDefined();
      expect(stock.symbol).toBe('ACCESS');
      expect(stock.name).toContain('Access');
      expect(typeof stock.price).toBe('number');
      expect(stock.sector).toBe('Financials');

      console.log('ACCESS stock data:', stock);
    }, 10000);

    it('should generate market indices from live data', async () => {
      const indices = await provider.fetchMarketIndices();

      expect(indices).toBeDefined();
      expect(indices).toHaveProperty('gseComposite');
      expect(indices).toHaveProperty('gseAllShare');
      expect(typeof indices.gseComposite.value).toBe('number');
      expect(typeof indices.gseComposite.change).toBe('number');

      console.log('Market indices:', indices);
    }, 10000);

    it('should determine market status correctly', () => {
      const marketStatus = provider.getMarketStatus();

      expect(marketStatus).toBeDefined();
      expect(typeof marketStatus.isOpen).toBe('boolean');
      expect(marketStatus.timezone).toBe('Africa/Accra');
      expect(marketStatus.nextOpen).toBeInstanceOf(Date);
      expect(marketStatus.nextClose).toBeInstanceOf(Date);

      console.log('Market status:', marketStatus);
    });
  });
});
