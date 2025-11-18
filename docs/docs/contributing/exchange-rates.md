# Contributing to Exchange Rates

Exchange rate services provide real-time and historical currency exchange data for the Ghana Cedi (GHS) against major world currencies. This guide will help you contribute to exchange rate features.

## 💱 Current Exchange Rate Features

### Implemented Features

- **Current Exchange Rates** - Real-time GHS exchange rates from Bank of Ghana
- **Historical Data** ✅ - Historical exchange rate tracking with database persistence
- **Automatic Rate Persistence** ✅ - All fetched rates are automatically saved to database
- **Lazy-Loading** ✅ - Today's rates automatically fetched when missing from historical queries
- **Database Storage** ✅ - Exchange rate history stored in PostgreSQL with Prisma
- **Multiple Currencies** - Support for USD, EUR, GBP, NGN, CHF, JPY, CNY
- **Rate Trends** ✅ - Available via historical endpoint with 7-day trend analysis

### Feature Areas for Contribution

#### 📊 Data Sources & Accuracy

- Integration with additional financial data providers
- Rate validation and cross-verification
- Improved data freshness and reliability
- Support for cryptocurrency exchanges

#### 📈 Analytics & Trends

- Advanced trend analysis algorithms
- Predictive rate modeling
- Volatility indicators
- Rate change notifications

#### ⚡ Performance & Caching

- Intelligent caching strategies
- Real-time rate streaming
- Rate aggregation algorithms
- Load balancing for high-traffic scenarios

#### 🌍 Currency Support

- Support for additional African currencies
- Regional currency pairs
- Central bank rate integration
- Mobile money exchange rates

## 🏗️ Technical Architecture

### File Structure

```
backend/src/
├── exchange-rates/
│   ├── exchange-rates.controller.ts    # Route handlers
│   ├── exchange-rates.service.ts       # Core business logic with persistence
│   ├── exchange-rates.module.ts        # Module configuration
│   ├── dto/
│   │   ├── exchange-rate.dto.ts        # Data transfer objects
│   │   ├── historical-rate.dto.ts      # Historical rate DTOs
│   │   └── convert-currency.dto.ts     # Currency conversion DTOs
│   └── providers/
│       ├── bank-of-ghana.provider.ts   # BOG scraping integration
│       ├── exchangerateapi.provider.ts # ExchangeRateAPI provider
│       └── fixer.provider.ts           # Fixer.io provider
├── common/
│   └── database/
│       └── prisma.service.ts           # Shared Prisma service
├── prisma/
│   ├── schema.prisma                   # Database schema
│   └── migrations/                     # Database migrations
├── scripts/
│   ├── import-bog-historical.ts        # CSV/JSON import script
│   ├── convert-bog-historical.ts       # Data conversion utility
│   └── clear-exchange-rate-history.ts  # Database cleanup script
└── tests/
    └── exchange-rates/                 # Exchange rate tests
```

### Key Services

#### ExchangeRatesService

```typescript
// exchange-rates.service.ts
@Injectable()
export class ExchangeRatesService {
  async getHistoricalRates(from: Date, to: Date, currency: string) {
    // Get historical exchange rate data from database
    // Automatically fetches today's rates if missing and today is in range
  }

  async getCurrentRates(currencies?: string[]) {
    // Fetch current rates and automatically persist to database
  }

  private async persistRates(rates: ExchangeRateDto[]) {
    // Save rates to ExchangeRateHistory table
  }

  @Cron("0 */30 * * * *") // every 30 minutes
  async updateExchangeRates() {
    // Scheduled job to fetch and persist current rates
  }
}
```

**Database Schema:**

```prisma
model ExchangeRateHistory {
  id              String   @id @default(uuid())
  baseCurrency    String
  targetCurrency  String
  rate            Decimal  @db.Decimal(18, 8)
  provider        String
  sourceTimestamp DateTime
  createdAt       DateTime @default(now())

  @@unique([baseCurrency, targetCurrency, sourceTimestamp, provider])
  @@index([baseCurrency, targetCurrency, sourceTimestamp])
}
```

#### BankOfGhanaService

```javascript
// services/bankOfGhanaService.js
class BankOfGhanaService {
  async fetchCurrentRates() {
    // Fetch official rates from Bank of Ghana
  }

  async fetchHistoricalRates(currency, startDate, endDate) {
    // Get historical data from BOG
  }

  validateRateData(rateData) {
    // Validate rate data from BOG API
  }
}
```

#### RateAggregatorService

```javascript
// services/rateAggregatorService.js
class RateAggregatorService {
  async aggregateRatesFromSources(currency) {
    // Combine rates from multiple sources
  }

  async detectAnomalies(rates) {
    // Identify unusual rate movements
  }

  calculateWeightedAverage(rates, weights) {
    // Calculate weighted average from multiple sources
  }
}
```

## 🚀 Getting Started

### 1. Development Setup

```bash
# Clone and setup
git clone https://github.com/YOUR_USERNAME/GhanaAPI.git
cd GhanaAPI/backend
npm install

# Create feature branch for exchange rates
git checkout -b feature/exchange-rate-enhancement
```

### 2. Environment Configuration

```bash
# Add exchange rate specific environment variables
echo "BANK_OF_GHANA_API_KEY=your_bog_key" >> .env
echo "FOREX_API_KEY=your_forex_api_key" >> .env
echo "RATE_UPDATE_INTERVAL=300000" >> .env  # 5 minutes
echo "RATE_CACHE_TTL=60000" >> .env        # 1 minute
```

### 3. Running Exchange Rate Services

```bash
# Start development server
npm run start:dev

# Test current rates endpoint
curl "http://localhost:3000/v1/exchange-rates/current"

# Test specific currency rates
curl "http://localhost:3000/v1/exchange-rates/current?currencies=USD,EUR,GBP"

# Test historical rates (automatically fetches today's rates if missing)
curl "http://localhost:3000/v1/exchange-rates/historical?currency=USD&from=2025-01-01&to=2025-01-31"

# Import historical data from CSV/JSON
npm run exchange-rates:import-bog -- --file=path/to/file.csv

# Clear exchange rate history
npm run exchange-rates:clear -- --confirm

# Seed exchange rates from JSON
npm run exchange-rates:seed:from-json -- --file=data/exchange-rates-bog-historical.json
```

## 💡 Contributing Ideas

### Beginner-Friendly Tasks

- [x] Add validation for currency codes (ISO 4217) - Implemented
- [x] Improve error handling for API timeouts - Implemented
- [ ] Add more comprehensive rate formatting options
- [x] Create additional test cases for edge scenarios - Enhanced coverage
- [x] Historical data persistence - Fully implemented

### Intermediate Tasks

- [ ] Implement rate change alerts and notifications
- [ ] Add support for cryptocurrency exchange rates
- [ ] Create rate comparison tools between sources
- [x] Automatic rate persistence - Implemented with database
- [ ] Add rate volatility calculations
- [ ] Build rate prediction models
- [ ] Add bulk historical data import tools
- [ ] Implement rate analytics endpoints

### Advanced Tasks

- [ ] Develop real-time rate streaming with WebSockets
- [ ] Create machine learning models for rate forecasting
- [ ] Build rate arbitrage detection system
- [ ] Implement distributed rate caching
- [ ] Develop rate anomaly detection algorithms
- [ ] Create multi-source rate reconciliation system

## 🧪 Testing Exchange Rate Features

### Running Exchange Rate Tests

```bash
# Run all exchange rate tests
npm test -- --testPathPattern=exchange-rates

# Run specific test files
npm test src/tests/exchange-rates/rateService.test.js
npm test src/tests/exchange-rates/bankOfGhana.test.js

# Run tests with coverage
npm run test:coverage -- --testPathPattern=exchange-rates
```

### Writing Exchange Rate Tests

#### Unit Tests Example

```javascript
// src/tests/services/exchangeRateService.test.js
const ExchangeRateService = require("../../services/exchangeRateService");

describe("ExchangeRateService", () => {
  let exchangeRateService;

  beforeEach(() => {
    exchangeRateService = new ExchangeRateService();
  });

  describe("getCurrentRates", () => {
    it("should return current rates for all currencies", async () => {
      const rates = await exchangeRateService.getCurrentRates();

      expect(rates).toHaveProperty("baseCurrency", "GHS");
      expect(rates).toHaveProperty("timestamp");
      expect(rates).toHaveProperty("rates");
      expect(rates.rates).toHaveProperty("USD");
      expect(rates.rates.USD).toHaveProperty("rate");
      expect(rates.rates.USD).toHaveProperty("inverseRate");
    });

    it("should return rates for specific currencies only", async () => {
      const rates = await exchangeRateService.getCurrentRates(["USD", "EUR"]);

      expect(Object.keys(rates.rates)).toEqual(["USD", "EUR"]);
      expect(rates.rates).not.toHaveProperty("GBP");
    });

    it("should handle invalid currency codes", async () => {
      const rates = await exchangeRateService.getCurrentRates(["INVALID"]);

      expect(rates.rates).not.toHaveProperty("INVALID");
      expect(rates.errors).toContainEqual({
        currency: "INVALID",
        error: "UNSUPPORTED_CURRENCY",
      });
    });
  });

  describe("getHistoricalRates", () => {
    it("should return historical data for valid date range", async () => {
      const fromDate = "2024-01-01";
      const toDate = "2024-01-31";

      const data = await exchangeRateService.getHistoricalRates(
        "USD",
        fromDate,
        toDate
      );

      expect(data).toHaveProperty("currency", "USD");
      expect(data).toHaveProperty("baseCurrency", "GHS");
      expect(data).toHaveProperty("period");
      expect(data.period.from).toBe(fromDate);
      expect(data.period.to).toBe(toDate);
      expect(data).toHaveProperty("rates");
      expect(Array.isArray(data.rates)).toBe(true);
    });

    it("should validate date range", async () => {
      await expect(
        exchangeRateService.getHistoricalRates(
          "USD",
          "2024-12-31",
          "2024-01-01"
        )
      ).rejects.toThrow("Invalid date range");
    });
  });

  describe("calculateTrends", () => {
    it("should calculate 24h trend correctly", async () => {
      const trend = await exchangeRateService.calculateTrends("USD", "24h");

      expect(trend).toHaveProperty("currency", "USD");
      expect(trend).toHaveProperty("period", "24h");
      expect(trend).toHaveProperty("change");
      expect(trend).toHaveProperty("changePercent");
      expect(trend).toHaveProperty("trend");
      expect(["up", "down", "stable"]).toContain(trend.trend);
    });
  });
});
```

#### Integration Tests Example

```javascript
// src/tests/routes/exchangeRates.test.js
const request = require("supertest");
const app = require("../../app");

describe("Exchange Rate API Endpoints", () => {
  describe("GET /v1/exchange-rates/current", () => {
    it("should return current exchange rates", async () => {
      const response = await request(app)
        .get("/v1/exchange-rates/current")
        .expect(200);

      expect(response.body).toHaveProperty("baseCurrency", "GHS");
      expect(response.body).toHaveProperty("timestamp");
      expect(response.body).toHaveProperty("rates");
      expect(response.body).toHaveProperty("provider");
      expect(response.body).toHaveProperty("nextUpdate");
    });

    it("should filter currencies when specified", async () => {
      const response = await request(app)
        .get("/v1/exchange-rates/current?currencies=USD,EUR")
        .expect(200);

      const currencies = Object.keys(response.body.rates);
      expect(currencies).toEqual(["USD", "EUR"]);
    });

    it("should handle invalid currency parameters", async () => {
      const response = await request(app)
        .get("/v1/exchange-rates/current?currencies=INVALID,USD")
        .expect(200);

      expect(response.body.rates).toHaveProperty("USD");
      expect(response.body.rates).not.toHaveProperty("INVALID");
      expect(response.body.warnings).toContainEqual({
        currency: "INVALID",
        message: "Unsupported currency code",
      });
    });
  });

  describe("GET /v1/exchange-rates/historical", () => {
    it("should return historical rates", async () => {
      const response = await request(app)
        .get(
          "/v1/exchange-rates/historical?currency=USD&from=2024-01-01&to=2024-01-07"
        )
        .expect(200);

      expect(response.body).toHaveProperty("currency", "USD");
      expect(response.body).toHaveProperty("rates");
      expect(Array.isArray(response.body.rates)).toBe(true);
      expect(response.body.rates.length).toBeGreaterThan(0);
    });

    it("should return 400 for invalid date format", async () => {
      const response = await request(app)
        .get(
          "/v1/exchange-rates/historical?currency=USD&from=invalid-date&to=2024-01-07"
        )
        .expect(400);

      expect(response.body.error.code).toBe("INVALID_DATE_FORMAT");
    });

    it("should return 400 for missing currency parameter", async () => {
      const response = await request(app)
        .get("/v1/exchange-rates/historical?from=2024-01-01&to=2024-01-07")
        .expect(400);

      expect(response.body.error.code).toBe("MISSING_CURRENCY");
    });
  });
});
```

### Performance Tests

```javascript
// src/tests/performance/exchangeRates.performance.test.js
describe("Exchange Rate Performance", () => {
  it("should respond to current rates within 200ms", async () => {
    const startTime = Date.now();

    const response = await request(app)
      .get("/v1/exchange-rates/current")
      .expect(200);

    const responseTime = Date.now() - startTime;
    expect(responseTime).toBeLessThan(200);
  });

  it("should handle 100 concurrent requests", async () => {
    const requests = Array(100)
      .fill()
      .map(() => request(app).get("/v1/exchange-rates/current"));

    const responses = await Promise.all(requests);

    responses.forEach((response) => {
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("rates");
    });
  });
});
```

## 📊 Database and Data Persistence

### Exchange Rate History Storage

Exchange rates are automatically persisted to the database when fetched. The system uses:

- **PostgreSQL** with Prisma ORM for data storage
- **Automatic persistence** via `persistRates()` method
- **Lazy-loading** of today's rates when missing from historical queries
- **Scheduled updates** every 30 minutes via cron job
- **Duplicate prevention** using unique constraints

### Import Scripts

The codebase includes utility scripts for managing historical data:

- **`import-bog-historical.ts`** - Convert CSV/JSON and upsert to database (single command)
- **`convert-bog-historical.ts`** - Convert raw BoG data to required JSON format
- **`clear-exchange-rate-history.ts`** - Clear exchange rate history from database
- **`update-exchange-rates-from-data.ts`** - Update database from JSON with date filtering

Usage examples:

```bash
# Import and upsert historical data
npm run exchange-rates:import-bog -- --file=Interbank\ FX\ Rates\ Historical.csv

# Clear all exchange rate history
npm run exchange-rates:clear -- --confirm

# Update with specific date range
npm run exchange-rates:update -- --json=data/exchange-rates-bog-historical.json --from=2025-01-01 --to=2025-01-31
```

## 📊 Data Sources Integration

### Bank of Ghana Web Scraping

```typescript
// providers/bank-of-ghana.provider.ts
@Injectable()
export class BankOfGhanaProvider implements RateProvider {
  async fetchRates(base: string, targets: string[]): Promise<RateData[]> {
    // Scrapes Bank of Ghana website for current rates
    // Returns rates in GHS base format (1 GHS = X target currency)
  }

  async convertCurrency(body: ConvertCurrencyDto): Promise<ConversionResult> {
    // Performs currency conversion using BoG rates
  }

  private async loadRates(): Promise<
    Map<string, { buy: number; sell: number }>
  > {
    // Scrapes BOG website and caches results for 30 minutes
    // Handles multiple URL paths for robustness
    // Parses HTML table data to extract buying and selling rates
  }
}
```

### Multiple Source Aggregation

```javascript
// services/rateAggregatorService.js
class RateAggregatorService {
  constructor() {
    this.sources = [
      new BankOfGhanaService(),
      new ForexAPIService(),
      new CurrencyLayerService(),
    ];
  }

  async aggregateRates(currency) {
    const sourceResults = await Promise.allSettled(
      this.sources.map((source) => source.getCurrentRates([currency]))
    );

    const validRates = sourceResults
      .filter((result) => result.status === "fulfilled")
      .map((result) => result.value.rates[currency]);

    if (validRates.length === 0) {
      throw new Error("No valid rates available from any source");
    }

    return this.calculateConsensusRate(validRates);
  }

  calculateConsensusRate(rates) {
    // Implement weighted average or median-based consensus
    const weights = [0.6, 0.3, 0.1]; // BOG gets highest weight

    let weightedSum = 0;
    let totalWeight = 0;

    rates.forEach((rate, index) => {
      if (rate && rate.rate) {
        weightedSum += rate.rate * (weights[index] || 0.1);
        totalWeight += weights[index] || 0.1;
      }
    });

    return {
      rate: weightedSum / totalWeight,
      inverseRate: totalWeight / weightedSum,
      confidence: this.calculateConfidence(rates),
      sources: rates.length,
    };
  }

  calculateConfidence(rates) {
    // Calculate confidence based on rate agreement between sources
    const rateValues = rates.map((r) => r.rate);
    const avg = rateValues.reduce((a, b) => a + b) / rateValues.length;
    const variance =
      rateValues.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) /
      rateValues.length;

    // Higher confidence for lower variance
    return Math.max(0, 1 - variance / avg);
  }
}
```

## 🔧 Implementation Examples

### Real-time Rate Updates with Scheduled Jobs

```javascript
// jobs/updateRatesJob.js
const cron = require("node-cron");
const ExchangeRateService = require("../services/exchangeRateService");

class UpdateRatesJob {
  constructor() {
    this.exchangeRateService = new ExchangeRateService();
    this.isRunning = false;
  }

  start() {
    // Update rates every 5 minutes during market hours
    cron.schedule("*/5 * * * *", async () => {
      if (this.isRunning) return;

      this.isRunning = true;
      try {
        console.log("Starting scheduled rate update...");
        await this.updateAllRates();
        console.log("Rate update completed successfully");
      } catch (error) {
        console.error("Rate update failed:", error);
      } finally {
        this.isRunning = false;
      }
    });

    // Update historical data daily at midnight
    cron.schedule("0 0 * * *", async () => {
      try {
        await this.updateHistoricalData();
      } catch (error) {
        console.error("Historical data update failed:", error);
      }
    });
  }

  async updateAllRates() {
    const currencies = ["USD", "EUR", "GBP", "CNY", "JPY", "CAD", "AUD"];

    for (const currency of currencies) {
      try {
        await this.exchangeRateService.updateRateFromSources(currency);
      } catch (error) {
        console.error(`Failed to update ${currency} rate:`, error);
      }
    }
  }

  async updateHistoricalData() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    await this.exchangeRateService.storeHistoricalRates(yesterday);
  }
}

module.exports = UpdateRatesJob;
```

### Rate Change Notifications

```javascript
// services/rateNotificationService.js
class RateNotificationService {
  constructor() {
    this.subscribers = new Map();
    this.thresholds = new Map();
  }

  subscribe(userId, currency, threshold) {
    if (!this.subscribers.has(currency)) {
      this.subscribers.set(currency, new Set());
    }

    this.subscribers.get(currency).add(userId);
    this.thresholds.set(`${userId}-${currency}`, threshold);
  }

  async checkRateChanges(currency, newRate, previousRate) {
    if (!this.subscribers.has(currency)) return;

    const changePercent = ((newRate - previousRate) / previousRate) * 100;

    for (const userId of this.subscribers.get(currency)) {
      const threshold = this.thresholds.get(`${userId}-${currency}`);

      if (Math.abs(changePercent) >= threshold) {
        await this.sendNotification(userId, currency, changePercent, newRate);
      }
    }
  }

  async sendNotification(userId, currency, changePercent, rate) {
    const message = {
      type: "RATE_ALERT",
      currency,
      changePercent,
      currentRate: rate,
      timestamp: new Date().toISOString(),
    };

    // Implement your notification delivery (email, SMS, push, etc.)
    console.log(`Sending rate alert to user ${userId}:`, message);
  }
}
```

### Advanced Rate Analytics

```javascript
// services/rateAnalyticsService.js
class RateAnalyticsService {
  async calculateVolatility(currency, days = 30) {
    const rates = await this.getHistoricalRates(currency, days);
    const returns = this.calculateReturns(rates);

    const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance =
      returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) /
      returns.length;

    return {
      currency,
      period: `${days} days`,
      volatility: Math.sqrt(variance),
      averageReturn: mean,
      standardDeviation: Math.sqrt(variance),
    };
  }

  calculateReturns(rates) {
    const returns = [];
    for (let i = 1; i < rates.length; i++) {
      const returnRate =
        (rates[i].rate - rates[i - 1].rate) / rates[i - 1].rate;
      returns.push(returnRate);
    }
    return returns;
  }

  async predictNextRate(currency, method = "moving_average") {
    const historicalRates = await this.getHistoricalRates(currency, 30);

    switch (method) {
      case "moving_average":
        return this.movingAveragePrediction(historicalRates);
      case "linear_regression":
        return this.linearRegressionPrediction(historicalRates);
      case "exponential_smoothing":
        return this.exponentialSmoothingPrediction(historicalRates);
      default:
        throw new Error("Unsupported prediction method");
    }
  }

  movingAveragePrediction(rates, window = 7) {
    const recentRates = rates.slice(-window);
    const average =
      recentRates.reduce((sum, rate) => sum + rate.rate, 0) / window;

    return {
      predictedRate: average,
      method: "moving_average",
      confidence: this.calculatePredictionConfidence(rates, average),
      window,
    };
  }
}
```

## 📊 Caching and Performance

### Redis Caching Implementation

```javascript
// services/rateCacheService.js
const Redis = require("redis");

class RateCacheService {
  constructor() {
    this.redis = Redis.createClient({
      host: process.env.REDIS_HOST || "localhost",
      port: process.env.REDIS_PORT || 6379,
    });
  }

  async getCachedRates(currencies = []) {
    try {
      if (currencies.length === 0) {
        // Get all cached rates
        const keys = await this.redis.keys("rate:*");
        const rates = {};

        for (const key of keys) {
          const currency = key.replace("rate:", "");
          const rateData = await this.redis.get(key);
          rates[currency] = JSON.parse(rateData);
        }

        return rates;
      } else {
        // Get specific currencies
        const pipeline = this.redis.pipeline();
        currencies.forEach((currency) => {
          pipeline.get(`rate:${currency}`);
        });

        const results = await pipeline.exec();
        const rates = {};

        results.forEach((result, index) => {
          if (result[1]) {
            rates[currencies[index]] = JSON.parse(result[1]);
          }
        });

        return rates;
      }
    } catch (error) {
      console.error("Cache read error:", error);
      return null;
    }
  }

  async setCachedRates(rates, ttl = 60) {
    try {
      const pipeline = this.redis.pipeline();

      Object.entries(rates).forEach(([currency, rateData]) => {
        pipeline.setex(
          `rate:${currency}`,
          ttl,
          JSON.stringify({
            ...rateData,
            cachedAt: Date.now(),
          })
        );
      });

      await pipeline.exec();
    } catch (error) {
      console.error("Cache write error:", error);
    }
  }

  async invalidateCache(currency = null) {
    try {
      if (currency) {
        await this.redis.del(`rate:${currency}`);
      } else {
        const keys = await this.redis.keys("rate:*");
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      }
    } catch (error) {
      console.error("Cache invalidation error:", error);
    }
  }
}
```

## 📝 API Documentation

When adding exchange rate endpoints, include comprehensive Swagger documentation:

```javascript
/**
 * @swagger
 * /v1/exchange-rates/trends:
 *   get:
 *     tags: [Exchange Rates]
 *     summary: Get currency trends and analytics
 *     description: Get detailed trend analysis for specified currencies including volatility, prediction, and historical performance
 *     parameters:
 *       - in: query
 *         name: currencies
 *         schema:
 *           type: string
 *           example: 'USD,EUR,GBP'
 *         description: Comma-separated list of currency codes
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: ['24h', '7d', '30d', '90d', '1y']
 *           default: '30d'
 *         description: Analysis period
 *       - in: query
 *         name: includeVolatility
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include volatility calculations
 *     responses:
 *       200:
 *         description: Currency trends and analytics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 baseCurrency:
 *                   type: string
 *                   example: 'GHS'
 *                 period:
 *                   type: string
 *                   example: '30d'
 *                 trends:
 *                   type: object
 *                   additionalProperties:
 *                     type: object
 *                     properties:
 *                       currency:
 *                         type: string
 *                       currentRate:
 *                         type: number
 *                       change:
 *                         type: number
 *                       changePercent:
 *                         type: number
 *                       trend:
 *                         type: string
 *                         enum: ['up', 'down', 'stable']
 *                       volatility:
 *                         type: object
 *                         properties:
 *                           value:
 *                             type: number
 *                           level:
 *                             type: string
 *                             enum: ['low', 'medium', 'high']
 */
```

## 🚀 Deployment Considerations

### Health Checks for Exchange Rate Services

```javascript
// Add to your health check endpoint
router.get("/v1/health/exchange-rates", async (req, res) => {
  try {
    const healthData = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      services: {},
    };

    // Test rate fetching
    const rateTest = await exchangeRateService.getCurrentRates(["USD"]);
    healthData.services.rateRetrieval = rateTest ? "operational" : "degraded";

    // Test cache
    const cacheTest = await rateCacheService.getCachedRates(["USD"]);
    healthData.services.cache = cacheTest ? "operational" : "degraded";

    // Test data sources
    for (const [name, service] of Object.entries(dataSources)) {
      try {
        await service.ping();
        healthData.services[name] = "operational";
      } catch (error) {
        healthData.services[name] = "degraded";
        healthData.status = "degraded";
      }
    }

    const statusCode = healthData.status === "healthy" ? 200 : 503;
    res.status(statusCode).json(healthData);
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});
```

## 📈 Next Steps

Ready to contribute to exchange rate services? Here's what you can do:

1. **🔍 Check [exchange rate issues](https://github.com/teebhagg/GhanaAPI/issues?q=is%3Aissue+is%3Aopen+label%3Aexchange-rates)**
2. **💡 Review the contributing ideas above and pick one that interests you**
3. **🏗️ Set up your development environment**
4. **💬 Join discussions about exchange rate improvements**
5. **📊 Help improve rate accuracy and reliability**

---

**Thank you for helping make exchange rate data more accessible for Ghana!** Your contributions help businesses and developers make better financial decisions. 🇬🇭💱CurrentRates(currencies = []) {
// Get current exchange rates for specified currencies
}

async get
