# Contributing to Banking & ATM Locator

This guide covers the implementation details and contribution guidelines for the Banking & ATM Locator feature.

## Overview

The Banking & ATM Locator provides comprehensive search and discovery of banking facilities across Ghana, integrating real-time data from OpenStreetMap with fallback static data.

## Architecture

### Module Structure

```
src/banking/
├── banking.controller.ts          # API endpoints and validation
├── banking.service.ts            # Business logic and data processing
├── banking.module.ts             # Module configuration
├── dto/                          # Data transfer objects
│   ├── bank.dto.ts              # Main bank entity definition
│   ├── bank-search.dto.ts       # Search query parameters
│   └── bank-search-response.dto.ts # API response structure
├── entities/
│   └── bank.entity.ts           # TypeScript interfaces
└── services/
    └── bank-data-provider.service.ts # External data integration
```

### Key Components

#### BankingController

- **Path**: `src/banking/banking.controller.ts`
- **Purpose**: Handles HTTP requests and validates input parameters
- **Endpoints**: 6 endpoints for comprehensive banking facility search
- **Validation**: Uses class-validator for input sanitization

#### BankingService

- **Path**: `src/banking/banking.service.ts`
- **Purpose**: Implements business logic and data processing
- **Features**: Location-based search, data filtering, result sorting
- **Distance Calculation**: Haversine formula for accurate geolocation

#### BankDataProviderService

- **Path**: `src/banking/services/bank-data-provider.service.ts`
- **Purpose**: Manages external data sources and caching
- **Integration**: OpenStreetMap Overpass API with static fallback
- **Caching**: 24-hour TTL for performance optimization

## API Endpoints

### Search Banks and ATMs

```http
GET /api/v1/banking/search
```

**Query Parameters:**

- `q` (string, optional): Search query for bank name or location
- `lat` (number, optional): Latitude for location-based search
- `lng` (number, optional): Longitude for location-based search
- `radius` (number, optional): Search radius in meters (default: 5000)
- `type` (string, optional): Filter by 'bank', 'atm', or 'all' (default: 'all')
- `limit` (number, optional): Maximum results to return (default: 20)

### Find Nearby Banks

```http
GET /api/v1/banking/nearby
```

**Query Parameters:**

- `lat` (number, required): Latitude coordinate
- `lng` (number, required): Longitude coordinate
- `radius` (number, optional): Search radius in meters (default: 5000)
- `type` (string, optional): Filter by facility type

### Browse by Region

```http
GET /api/v1/banking/region
```

**Query Parameters:**

- `region` (string, required): Ghana region name
- `type` (string, optional): Filter by facility type
- `limit` (number, optional): Maximum results

### Browse by City

```http
GET /api/v1/banking/city
```

**Query Parameters:**

- `city` (string, required): City name
- `type` (string, optional): Filter by facility type
- `limit` (number, optional): Maximum results

## Data Sources

### OpenStreetMap Integration

- **API**: Overpass API for real-time banking data
- **Query**: Comprehensive Overpass QL for banks and ATMs
- **Coverage**: All of Ghana with detailed facility information
- **Update Frequency**: Real-time with 24-hour caching

### Fallback Data

- **Purpose**: Ensures service availability when external APIs fail
- **Coverage**: Major banks and ATM networks in Ghana
- **Format**: Structured JSON with complete facility details
- **Maintenance**: Regularly updated with verified information

## Testing

### Unit Tests

```bash
npm test src/banking/banking.service.spec.ts
npm test src/banking/banking.controller.spec.ts
```

### Integration Tests

```bash
npm test src/banking/services/bank-data-provider.service.integration.spec.ts
```

### E2E Tests

```bash
npm run test:e2e -- --testNamePattern="Banking"
```

## Development Guidelines

### Adding New Banking Data

1. **Static Data Updates**

   - Location: `src/banking/data/banks.json`
   - Format: Follow existing BankDto structure
   - Validation: Run tests to ensure data integrity

2. **OpenStreetMap Queries**
   - Location: `src/banking/services/bank-data-provider.service.ts`
   - Method: `buildOverpassQuery()`
   - Testing: Use Overpass Turbo for query validation

### Error Handling

```typescript
// Location validation
if ((query.lat && !query.lng) || (!query.lat && query.lng)) {
  throw new HttpException(
    "Both latitude and longitude are required for location-based search",
    HttpStatus.BAD_REQUEST
  );
}

// Service error handling
try {
  return await this.bankingService.searchBanks(query);
} catch (error) {
  throw new HttpException(
    "Failed to search banks",
    HttpStatus.INTERNAL_SERVER_ERROR
  );
}
```

### Performance Optimization

#### Caching Strategy

- **TTL**: 24 hours for external API data
- **Key Structure**: `banking:${region}:${type}:${timestamp}`
- **Invalidation**: Automatic expiry with manual refresh option

#### Distance Calculation

```typescript
private calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  // Haversine formula implementation
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  // ... calculation
}
```

## Code Style

### Naming Conventions

- **Controllers**: `BankingController`
- **Services**: `BankingService`, `BankDataProviderService`
- **DTOs**: `BankDto`, `BankSearchQueryDto`
- **Interfaces**: `IBankEntity`, `IBankSearchParams`

### Documentation

- **Swagger**: All endpoints must have complete OpenAPI documentation
- **JSDoc**: Public methods require comprehensive documentation
- **Examples**: Include realistic examples in API docs

### Validation

```typescript
@ApiProperty({
  description: 'Search radius in meters',
  example: 5000,
  minimum: 100,
  maximum: 50000,
  required: false,
})
@IsOptional()
@IsNumber()
@Min(100)
@Max(50000)
radius?: number = 5000;
```

## Common Issues & Solutions

### OpenStreetMap API Timeouts

- **Issue**: Overpass API occasionally times out
- **Solution**: Implemented fallback to static data
- **Prevention**: Optimize query complexity and use caching

### Location Accuracy

- **Issue**: GPS coordinates may be imprecise
- **Solution**: Use configurable search radius with reasonable defaults
- **Enhancement**: Implement fuzzy matching for addresses

### Data Inconsistency

- **Issue**: External data sources may have outdated information
- **Solution**: Combine multiple sources with intelligent deduplication
- **Monitoring**: Regular data quality checks

## Future Enhancements

### Planned Features

1. **Advanced Search Filters**

   - Business hours filtering
   - Service-specific search (ATM, foreign exchange, etc.)
   - Accessibility features

2. **Data Quality**

   - User feedback system for facility information
   - Automated data validation workflows
   - Real-time availability status

3. **Performance**
   - Geographic indexing for faster searches
   - Predictive caching based on usage patterns
   - CDN integration for static data

### Integration Opportunities

- **Payment Systems**: Link to mobile money and card networks
- **Transport Module**: Distance and route integration
- **Location Services**: Address validation for banking facilities

## Getting Started

1. **Setup Development Environment**

   ```bash
   cd backend
   npm install
   npm run start:dev
   ```

2. **Run Tests**

   ```bash
   npm test
   npm run test:e2e
   ```

3. **API Testing**

   - Open `http://localhost:3000/api/docs`
   - Test endpoints using Swagger UI
   - Verify data accuracy and response times

4. **Code Quality**
   ```bash
   npm run lint
   npm run format
   npm run build
   ```

For questions or suggestions, please refer to the main contributing guidelines or open an issue on GitHub.
