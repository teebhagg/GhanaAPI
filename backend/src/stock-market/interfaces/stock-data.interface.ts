export interface RawStockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  sector: string;
  dayHigh: number;
  dayLow: number;
  previousClose: number;
  weekHigh52?: number;
  weekLow52?: number;
  peRatio?: number;
  dividendYield?: number;
  status: 'OPEN' | 'CLOSED' | 'SUSPENDED' | 'HALTED';
  lastTradingTime: string;
  companyInfo?: {
    address?: string;
    email?: string;
    phone?: string;
    website?: string;
    industry?: string;
    sharesOutstanding?: number;
    earningsPerShare?: number | null;
    dividendPerShare?: number | null;
  };
}

export interface MarketIndices {
  gseComposite: {
    value: number;
    change: number;
    changePercent: number;
    lastUpdated: string;
  };
  gseAllShare: {
    value: number;
    change: number;
    changePercent: number;
    lastUpdated: string;
  };
}

export interface MarketStatus {
  isOpen: boolean;
  nextOpen: Date;
  nextClose: Date;
  timezone: string;
  lastUpdated: Date;
}

export interface StockDataProvider {
  name: string;
  fetchAllStocks(): Promise<RawStockData[]>;
  fetchStock(symbol: string): Promise<RawStockData>;
  fetchMarketIndices(): Promise<MarketIndices>;
  getMarketStatus(): Promise<MarketStatus>;
  isHealthy(): Promise<boolean>;
}
