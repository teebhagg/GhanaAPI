# Stock Market Data Development Guide

This guide covers development, testing, and maintenance of the Ghana Stock Exchange (GSE) integration.

## Overview

The Stock Market Data service provides real-time GSE data through integration with the external GSE API (https://dev.kwayisi.org/apis/gse). This service includes:

- **7 REST endpoints** for stock market data
- **Real-time data** from Ghana Stock Exchange
- **30+ stock listings** across multiple sectors
- **Market analytics** and sector performance
- **Company profiles** and financial metrics
- **Caching strategy** for optimal performance

## Architecture

### Core Components

1. **GSEApiProvider** (`src/stock-market/providers/gse-api.provider.ts`)

   - Handles external API integration with Ghana Stock Exchange
   - Implements retry logic and error handling
   - Maps external data to internal interfaces

2. **StockMarketService** (`src/stock-market/stock-market.service.ts`)

   - Business logic for stock operations
   - Caching and performance optimization
   - Data transformation and aggregation

3. **StockMarketController** (`src/stock-market/stock-market.controller.ts`)
   - REST API endpoints
   - Request validation and response formatting
   - Swagger documentation

### External API Integration

The service integrates with GSE API endpoints:

- `GET /live` - Real-time trading data for all stocks
- `GET /live/{symbol}` - Real-time data for specific stock
- `GET /equities` - Basic equity information
- `GET /equities/{symbol}` - Detailed company and equity data

## API Endpoints

| Method | Endpoint                           | Description                  |
| ------ | ---------------------------------- | ---------------------------- |
| GET    | `/stock-market/search`             | Search stocks with filtering |
| GET    | `/stock-market/stock/{symbol}`     | Get specific stock data      |
| GET    | `/stock-market/market-summary`     | Market overview and indices  |
| GET    | `/stock-market/sectors`            | Available sectors            |
| GET    | `/stock-market/sectors/{sector}`   | Stocks by sector             |
| GET    | `/stock-market/sector-performance` | Sector performance analytics |
| GET    | `/stock-market/all`                | All available stocks         |

## Development Setup

### Prerequisites

```bash
npm install @nestjs/axios axios
```

### Running Tests

```bash
# Unit tests
npm run test -- --testPathPatterns=stock-market

# Integration tests (requires internet)
npm run test -- src/stock-market/tests/gse-api.integration.spec.ts

# All stock market tests
npm run test:watch stock-market
```

### Local Development

```bash
# Start development server
npm run start:dev

# Test endpoints
curl "http://localhost:3001/api/v1/stock-market/market-summary"
curl "http://localhost:3001/api/v1/stock-market/search?sector=Financials"
```

## Testing Strategy

### Unit Tests

- Mock GSEApiProvider for predictable testing
- Test business logic and data transformations
- Validate caching behavior

### Integration Tests

- Test against real GSE API (requires internet)
- Validate data format and API responses
- Test error handling and retries

### Example Test

```typescript
describe("Stock Market Integration", () => {
  it("should fetch real GSE data", async () => {
    const stocks = await provider.fetchAllStocks();
    expect(stocks.length).toBeGreaterThan(0);
    expect(stocks[0]).toHaveProperty("symbol");
  });
});
```

## Data Flow

1. **Request** → Controller validates and routes
2. **Service** → Checks cache for existing data
3. **Provider** → Makes external API calls if cache miss
4. **Transform** → Maps external data to internal format
5. **Cache** → Stores processed data (5-minute TTL)
6. **Response** → Returns formatted data to client

## Caching Strategy

- **Cache TTL**: 5 minutes during market hours
- **Cache Keys**:
  - `gse_stocks_data` - All stocks data
  - `gse_market_summary` - Market summary
- **Cache Invalidation**: Scheduled updates every 5 minutes during market hours
- **Market Hours**: Monday-Friday, 10:00 AM - 3:00 PM (Ghana Time)

## Error Handling

### External API Errors

- **429 Rate Limiting**: Automatic retry with exponential backoff
- **Network Timeouts**: 10-second timeout with 3 retries
- **404 Not Found**: Graceful handling for missing symbols
- **Service Unavailable**: Fallback to cached data when possible

### Implementation

```typescript
private async makeRequest<T>(endpoint: string, retryCount = 0): Promise<T> {
  try {
    return await this.httpService.get(url).pipe(timeout(10000));
  } catch (error) {
    if (retryCount < 3 && this.isRetryableError(error)) {
      await this.delay(1000 * (retryCount + 1));
      return this.makeRequest(endpoint, retryCount + 1);
    }
    throw error;
  }
}
```

## Market Hours Logic

Ghana Stock Exchange operates:

- **Days**: Monday to Friday
- **Hours**: 10:00 AM - 3:00 PM (GMT)
- **Timezone**: Africa/Accra

```typescript
getMarketStatus(): MarketStatus {
  const ghanaTime = new Date(now.toLocaleString("en-US", {
    timeZone: "Africa/Accra"
  }));

  const isWeekday = currentDay >= 1 && currentDay <= 5;
  const isDuringHours = currentTime >= 600 && currentTime < 900; // 10 AM - 3 PM

  return { isOpen: isWeekday && isDuringHours };
}
```

## Adding New Features

### New Endpoints

1. Add method to `StockMarketController`
2. Implement business logic in `StockMarketService`
3. Add external API calls to `GSEApiProvider` if needed
4. Write unit and integration tests
5. Update Swagger documentation

### New Data Sources

1. Create new provider class
2. Implement provider interface
3. Update service to use multiple providers
4. Add failover logic between providers

## Performance Considerations

### Optimization Techniques

- **Batch Processing**: Fetch detailed data for limited stocks (first 20)
- **Selective Caching**: Cache expensive operations separately
- **Data Compression**: Use HTTP compression for large responses
- **Connection Pooling**: Reuse HTTP connections

### Monitoring

- Track external API response times
- Monitor cache hit/miss ratios
- Alert on consecutive API failures
- Log performance metrics

## Deployment

### Environment Variables

```bash
# External API configuration
GSE_API_BASE_URL=https://dev.kwayisi.org/apis/gse
GSE_API_TIMEOUT=10000
GSE_API_MAX_RETRIES=3

# Caching
STOCK_CACHE_TTL=300 # 5 minutes
```

### Health Checks

```typescript
@Get('health')
async health() {
  const status = await this.gseApiProvider.healthCheck();
  return { status: status ? 'healthy' : 'degraded' };
}
```

## Common Issues

### Rate Limiting (429)

- **Cause**: Too many requests to GSE API
- **Solution**: Implement exponential backoff, increase cache TTL
- **Prevention**: Monitor request frequency

### Stale Data

- **Cause**: External API providing outdated information
- **Solution**: Add data freshness checks, fallback to multiple sources
- **Prevention**: Monitor data timestamps

### Missing Symbols

- **Cause**: Stock delisted or symbol changed
- **Solution**: Graceful 404 handling, suggest similar symbols
- **Prevention**: Regular symbol validation

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/stock-market-enhancement`
3. Write tests for your changes
4. Ensure all tests pass: `npm run test:cov`
5. Update documentation if needed
6. Submit pull request

### Code Style

- Use TypeScript strict mode
- Follow NestJS conventions
- Add JSDoc comments for public methods
- Use descriptive variable names
- Handle errors gracefully

### Pull Request Guidelines

- Include unit and integration tests
- Update API documentation
- Add changelog entry
- Test against real GSE API
- Verify performance impact
