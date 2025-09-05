# Contributing to Transport & Logistics

The Transport & Logistics module is a comprehensive transportation service providing route planning, public transport information, and travel cost estimation for Ghana. This guide will help you contribute to transport-related features.

## 🚗 Current Transport Features

### Implemented Features

- **Transport Stops** - Bus stops, stations, and public transport hubs
- **Route Calculation** - Optimal routing between locations with multiple transport modes
- **Route Directions** - Detailed turn-by-turn navigation instructions
- **Travel Cost Estimation** - Fuel costs and fare calculations for different transport modes
- **Fuel Prices** - Current petrol, diesel, and LPG prices in Ghana
- **Nearby Services** - Find transport stops within a specified radius

### Feature Areas for Contribution

#### 🚌 Public Transport Enhancement

- Real-time bus arrival information
- Transport schedule integration
- Route frequency and timing data
- Multi-modal journey planning
- Accessibility information for transport stops

#### 🗺️ Route Optimization

- Traffic-aware routing
- Alternative route suggestions
- Time-based routing (rush hour optimization)
- Commercial vehicle routing restrictions
- Eco-friendly route options

#### 💰 Cost & Pricing

- Dynamic pricing based on demand
- Historical price trend analysis
- Cost comparison between transport modes
- Fuel efficiency optimization
- Carbon footprint calculations

#### 📱 Data Integration

- Integration with ride-sharing services
- Real-time traffic data
- Weather impact on routes
- Road closure and construction updates
- Emergency route alternatives

#### 🌍 Geographic Expansion

- Additional city coverage
- Rural area transport options
- Inter-city transport connections
- Cross-border transport information

## 🛠️ Technical Architecture

### File Structure

```
backend/src/transport/
├── transport.controller.ts      # API route handlers
├── transport.service.ts         # Main coordinator service
├── transport.module.ts          # NestJS module configuration
├── index.ts                     # Central exports
├── services/                    # Specialized service modules
│   ├── geocoding.service.ts     # Location name to coordinates conversion
│   ├── fuel-price.service.ts    # Fuel price data retrieval
│   ├── routing.service.ts       # Route calculation and directions
│   ├── transport-routes.service.ts # Public transport route management
│   └── transport-stops.service.ts  # Transport stops and stations
├── dto/                         # Data Transfer Objects
│   ├── route-directions.dto.ts  # Route directions request/response
│   ├── route-calculation.dto.ts # Route calculation models
│   ├── transport-stop.dto.ts    # Transport stop data models
│   ├── fuel-price.dto.ts        # Fuel pricing models
│   ├── travel-cost.dto.ts       # Travel cost estimation
│   ├── nearby-stops.dto.ts      # Nearby stops search
│   └── error-response.dto.ts    # Error handling models
├── entities/                    # Database entities
└── providers/                   # External service providers
```

### Service Architecture

The transport module follows a **modular service architecture** where the main `TransportService` acts as a coordinator that delegates to specialized services:

#### Main TransportService (Coordinator)

```typescript
// transport.service.ts
@Injectable()
export class TransportService {
  constructor(
    private readonly geocodingService: GeocodingService,
    private readonly fuelPriceService: FuelPriceService,
    private readonly transportRoutesService: TransportRoutesService,
    private readonly transportStopsService: TransportStopsService,
    private readonly routingService: RoutingService
  ) {}

  // Main business logic and coordination
  async getRouteDirections(
    query: RouteDirectionsQueryDto
  ): Promise<RouteDirectionsResponseDto>;
  // Input validation and orchestration
  // Combines results from multiple services
}
```

#### Specialized Services

##### GeocodingService

```typescript
// services/geocoding.service.ts
@Injectable()
export class GeocodingService {
  // Convert place names to coordinates
  async geocodeLocation(locationName: string): Promise<GeocodingResult>;

  // Providers: Nominatim, Overpass API
}
```

##### FuelPriceService

```typescript
// services/fuel-price.service.ts
@Injectable()
export class FuelPriceService {
  // Get current fuel prices in Ghana from major companies
  async getFuelPrices(): Promise<FuelPrice>;

  // Provider: CediRates.com web scraper
  // Calculates averages from Shell, Goil, Total, and Star Oil
}
```

##### RoutingService

```typescript
// services/routing.service.ts
@Injectable()
export class RoutingService {
  // Calculate routes between coordinates
  async calculateRoute(start: [number, number], end: [number, number], mode: string): Promise<RouteCalculation>
  async getRouteWithFallback(...): Promise<RouteResult>

  // Utility methods
  validateGhanaCoordinates(lat: number, lng: number): void
  calculateHaversineDistance(...): number

  // Providers: OpenRouteService, HERE API, GraphHopper
}
```

##### TransportRoutesService

```typescript
// services/transport-routes.service.ts
@Injectable()
export class TransportRoutesService {
  // Manage public transport routes
  async getPublicTransportRoutes(city: string): Promise<TransportRoute[]>;

  // Providers: Overpass API, GTFS, HERE API
}
```

##### TransportStopsService

```typescript
// services/transport-stops.service.ts
@Injectable()
export class TransportStopsService {
  // Manage transport stops and stations
  async getTransportStops(city: string, ...): Promise<TransportStop[]>

  // Providers: Overpass API, GTFS
}
```

#### External API Integration

Each specialized service manages its own set of provider APIs with fallback mechanisms:

```typescript
// GeocodingService - Location Resolution
private readonly geocodingApis = [
  'nominatim',    // OpenStreetMap Nominatim
  'overpass'      // Overpass API
];

// RoutingService - Route Calculation
private readonly routingApis = [
  'openrouteservice',  // Open source routing
  'here',              // HERE Maps API
  'graphhopper'        # GraphHopper API
];

// TransportRoutesService & TransportStopsService - Public Transport Data
private readonly transportApis = [
  'overpass',     // OpenStreetMap Overpass API
  'gtfs',         // General Transit Feed Specification
  'here'          // HERE Transit API
];

// FuelPriceService - Fuel Price Data
private readonly fuelPriceApis = [
  'cedirates-scraper',   // CediRates.com web scraper
];
```

#### Benefits of Service Separation

1. **Separation of Concerns**: Each service handles a specific domain
2. **Independent Testing**: Services can be unit tested in isolation
3. **Maintainability**: Easier to update individual API integrations
4. **Reusability**: Services can be used independently across the application
5. **Scalability**: Individual services can be optimized separately
6. **Error Isolation**: Failures in one service don't affect others

#### Using Services Independently

Services can be imported and used independently in other parts of the application:

```typescript
// Using individual services
import { GeocodingService, FuelPriceService } from "../transport/services";

@Injectable()
export class SomeOtherService {
  constructor(
    private readonly geocodingService: GeocodingService,
    private readonly fuelPriceService: FuelPriceService
  ) {}

  async getSomeData() {
    const location = await this.geocodingService.geocodeLocation("Accra");
    const prices = await this.fuelPriceService.getFuelPrices();
    // Use data independently
  }
}
```

```typescript
// Using the main coordinating service
import { TransportService } from "../transport";

@Injectable()
export class AnotherService {
  constructor(private readonly transportService: TransportService) {}

  async getRouteInfo() {
    // Uses all services through the main coordinator
    return this.transportService.getRouteDirections(query);
  }
}
```

## 🔧 Development Setup

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL (for data storage)
- Redis (for caching)
- Access to external API keys (optional but recommended)

### Environment Variables

```bash
# External API Keys (optional)
OPENROUTESERVICE_API_KEY=your_ors_key
HERE_API_KEY=your_here_key
GRAPHHOPPER_API_KEY=your_graphhopper_key

# Database
POSTGRES_URL=postgresql://user:password@localhost:5432/ghanaapi
REDIS_URL=redis://localhost:6379

# Fuel price sources
# No additional configuration needed - uses CediRates.com web scraping
```

### Local Development

```bash
# Navigate to backend
cd backend/

# Install dependencies
npm install

# Start development server
npm run start:dev

# Run tests
npm run test:e2e -- --testPathPattern=transport
```

## 🧪 Testing

### Unit Tests

#### Testing Individual Services

```typescript
// geocoding.service.spec.ts
describe("GeocodingService", () => {
  it("should geocode Accra correctly", async () => {
    const result = await geocodingService.geocodeLocation("Accra");
    expect(result.coordinates[0]).toBeCloseTo(5.6037, 1);
    expect(result.coordinates[1]).toBeCloseTo(-0.187, 1);
  });
});

// fuel-price.service.spec.ts
describe("FuelPriceService", () => {
  it("should return fuel prices averaged from major companies", async () => {
    const prices = await fuelPriceService.getFuelPrices();
    expect(prices.petrol).toBeGreaterThan(0);
    expect(prices.diesel).toBeGreaterThan(0);
    expect(prices.currency).toBe("GHS");
    expect(prices.source).toContain("Shell, Goil, Total, Star Oil");
  });
});

// routing.service.spec.ts
describe("RoutingService", () => {
  it("should calculate route between valid coordinates", async () => {
    const result = await routingService.calculateRoute(
      [5.6037, -0.187], // Accra
      [6.6885, -1.6244], // Kumasi
      "driving"
    );

    expect(result.distance).toBeGreaterThan(200000); // > 200km
    expect(result.duration).toBeGreaterThan(0);
    expect(result.coordinates).toHaveLength.greaterThan(2);
  });
});
```

#### Testing Main TransportService

```typescript
// transport.service.spec.ts
describe("TransportService", () => {
  let service: TransportService;
  let geocodingService: jest.Mocked<GeocodingService>;
  let routingService: jest.Mocked<RoutingService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        TransportService,
        { provide: GeocodingService, useValue: mockGeocodingService },
        { provide: RoutingService, useValue: mockRoutingService },
        // ... other mocked services
      ],
    }).compile();

    service = module.get<TransportService>(TransportService);
    geocodingService = module.get(GeocodingService);
    routingService = module.get(RoutingService);
  });

  describe("getRouteDirections", () => {
    it("should coordinate services to provide route directions", async () => {
      // Test that main service properly coordinates sub-services
      const query = { start_name: "Accra", end_name: "Kumasi" };

      geocodingService.geocodeLocation
        .mockResolvedValueOnce({ coordinates: [5.6037, -0.187] })
        .mockResolvedValueOnce({ coordinates: [6.6885, -1.6244] });

      routingService.getRouteWithFallback.mockResolvedValue({
        distance: 250000,
        duration: 10800,
      });

      const result = await service.getRouteDirections(query);

      expect(result.distance).toBe(250000);
      expect(geocodingService.geocodeLocation).toHaveBeenCalledTimes(2);
      expect(routingService.getRouteWithFallback).toHaveBeenCalledTimes(1);
    });
  });
});
```

### Integration Tests

```typescript
// transport.controller.e2e-spec.ts
describe("Transport Controller (e2e)", () => {
  it("/transport/stops (GET)", () => {
    return request(app.getHttpServer())
      .get("/transport/stops?city=accra")
      .expect(200)
      .expect((res) => {
        expect(res.body.success).toBe(true);
        expect(res.body.data).toBeInstanceOf(Array);
        expect(res.body.count).toBeGreaterThan(0);
      });
  });
});
```

## 📊 Data Sources

### Transport Stop Data

- **OpenStreetMap (Overpass API)** - Public transport stops and routes
- **GTFS Feeds** - Official transit agency data
- **HERE Transit API** - Commercial transit information
- **Community Contributions** - Crowdsourced updates

### Routing Data

- **OpenRouteService** - Open-source routing engine
- **HERE Maps** - Commercial mapping service
- **GraphHopper** - Fast routing service
- **OpenStreetMap** - Community-maintained road network

### Fuel Price Data

- **CediRates.com** - Real-time scraping from major Ghanaian fuel companies
- **Direct Company Data** - Shell, Goil, Total, and Star Oil price aggregation

## 🎯 Contribution Guidelines

### 1. Data Quality Standards

#### Transport Stop Requirements

```typescript
interface TransportStop {
  id: string; // Unique identifier
  name: string; // Human-readable name
  coordinates: [number, number]; // [lat, lng] in WGS84
  type: "bus_stop" | "station" | "platform" | "taxi_stand";
  routes?: string[]; // Associated route IDs
  amenities?: string[]; // Available facilities
  accessibility?: {
    wheelchair: boolean;
    visual_aid: boolean;
    audio_aid: boolean;
  };
}
```

#### Route Validation

- All coordinates must be within Ghana boundaries (4.5°N to 11.5°N, 3.5°W to 1.5°E)
- Routes should follow actual road networks
- Distance calculations must be accurate within 5% margin
- Duration estimates should account for traffic patterns

### 2. API Response Standards

#### Success Response Format

```json
{
  "success": true,
  "data": {
    // Actual response data
  },
  "count": 10, // For array responses
  "metadata": {
    "provider": "openrouteservice",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

#### Error Response Format

```json
{
  "success": false,
  "message": "Failed to calculate route",
  "error": "Coordinates are outside Ghana boundaries",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 3. Performance Requirements

#### Response Time Targets

- **Route Calculation** - < 2 seconds
- **Transport Stops** - < 500ms
- **Nearby Search** - < 1 second
- **Fuel Prices** - < 50ms (cached) / < 2 seconds (fresh)

#### Caching Strategy

- **Route calculations** - 1 hour cache
- **Transport stops** - 24 hour cache
- **Fuel prices** - Daily cache (expires at 11:59 PM)
- **Static data** - 7 day cache

### 4. Error Handling

#### Graceful Degradation

```typescript
async getRouteDirections(query: RouteDirectionsQueryDto) {
  for (const provider of this.routingApis) {
    try {
      return await this.getDirectionsFromProvider(provider, query);
    } catch (error) {
      this.logger.warn(`Provider ${provider} failed: ${error.message}`);
      continue;
    }
  }

  throw new HttpException(
    'All routing services are unavailable',
    HttpStatus.SERVICE_UNAVAILABLE
  );
}
```

#### Input Validation

- Coordinate bounds checking
- Parameter type validation
- Enum value validation
- Required field validation

## 🚀 Contributing Workflow

### 1. Setting Up Your Environment

```bash
# Fork the repository
git clone https://github.com/yourusername/GhanaAPI.git
cd GhanaAPI

# Create feature branch
git checkout -b feature/transport-enhancement

# Set up backend environment
cd backend/
npm install
cp .env.example .env
# Configure your environment variables

# Run tests to ensure everything works
npm run test
```

### 2. Making Changes

#### Working with the Service Architecture

When contributing to the transport module, you'll typically work with one or more of the specialized services:

##### Contributing to GeocodingService

```typescript
// services/geocoding.service.ts
// Examples: Adding new geocoding providers, improving accuracy
export class GeocodingService {
  async geocodeLocation(locationName: string): Promise<GeocodingResult> {
    // Add new geocoding provider
    // Improve existing geocoding logic
    // Add location name normalization
  }
}
```

##### Contributing to FuelPriceService

```typescript
// services/fuel-price.service.ts
// Examples: Improving CediRates scraping, adding company price validation
export class FuelPriceService {
  async getFuelPrices(): Promise<FuelPrice> {
    // Improve CediRates.com HTML parsing
    // Add price validation for major companies
    // Implement fallback data strategies
    // Add historical price tracking
  }
}
```

##### Contributing to RoutingService

```typescript
// services/routing.service.ts
// Examples: Adding new routing providers, optimization algorithms
export class RoutingService {
  async calculateRoute(start, end, mode): Promise<RouteCalculation> {
    // Add new routing provider
    // Implement traffic-aware routing
    // Add route optimization features
  }
}
```

##### Contributing to TransportRoutesService

```typescript
// services/transport-routes.service.ts
// Examples: Adding new route data sources, real-time updates
export class TransportRoutesService {
  async getPublicTransportRoutes(city: string): Promise<TransportRoute[]> {
    // Add GTFS feed support
    // Implement real-time route data
    // Add route scheduling information
  }
}
```

##### Contributing to TransportStopsService

```typescript
// services/transport-stops.service.ts
// Examples: Enhancing stop data, adding amenity information
export class TransportStopsService {
  async getTransportStops(city, ...): Promise<TransportStop[]> {
    // Add stop accessibility information
    // Implement nearby facilities data
    // Add real-time stop information
  }
}
```

#### Adding New Transport Stops

1. Update the transport stop data files
2. Add validation for new stop types
3. Update DTOs and interfaces
4. Add unit tests
5. Update documentation

#### Implementing New Routing Features

1. Add new method to `TransportService`
2. Create appropriate DTOs
3. Add controller endpoint
4. Implement error handling
5. Add API documentation annotations
6. Write comprehensive tests

#### Adding New Data Sources

1. Create new provider service
2. Implement fallback logic
3. Add configuration options
4. Update caching strategy
5. Add monitoring and logging

### 3. Code Review Checklist

#### Functionality

- [ ] Feature works as specified
- [ ] Error handling is comprehensive
- [ ] Performance meets requirements
- [ ] Caching is properly implemented

#### Code Quality

- [ ] TypeScript types are properly defined
- [ ] Code follows existing patterns
- [ ] Comments explain complex logic
- [ ] No hardcoded values

#### Testing

- [ ] Unit tests cover new functionality
- [ ] Integration tests pass
- [ ] Edge cases are tested
- [ ] Error scenarios are tested

#### Documentation

- [ ] API documentation is updated
- [ ] Code comments are clear
- [ ] README updates if needed
- [ ] Contributing guide updates

### 4. Submitting Your Contribution

```bash
# Commit your changes
git add .
git commit -m "feat(transport): add real-time bus tracking"

# Push to your fork
git push origin feature/transport-enhancement

# Create pull request on GitHub
# Include:
# - Clear description of changes
# - Screenshots/demos if applicable
# - Testing instructions
# - Breaking changes (if any)
```

## 📈 Monitoring and Analytics

### Key Metrics to Track

- **Response Times** - API endpoint performance
- **Success Rates** - Request success/failure ratios
- **Data Accuracy** - Route distance/duration accuracy
- **Provider Reliability** - External API uptime
- **Usage Patterns** - Most requested routes and features

### Logging Guidelines

```typescript
// Service-level logging
this.logger.log(`Calculating route from ${start} to ${end} using ${provider}`);
this.logger.warn(`Provider ${provider} returned invalid data`);
this.logger.error(`Failed to calculate route: ${error.message}`, error.stack);

// Performance logging
const startTime = Date.now();
const result = await this.calculateRoute(start, end, mode);
this.logger.debug(`Route calculation took ${Date.now() - startTime}ms`);
```

## 🔐 Security Considerations

### Input Sanitization

- Validate all coordinate inputs
- Sanitize place name queries
- Prevent injection attacks
- Rate limiting on expensive operations

### API Key Management

- Store API keys securely
- Rotate keys regularly
- Monitor usage quotas
- Implement fallback providers

### Data Privacy

- Don't log user coordinates
- Anonymize usage analytics
- Comply with data protection regulations
- Secure data transmission

## 🌍 Localization and Accessibility

### Language Support

- Place names in local languages
- Multi-language turn-by-turn directions
- Local transport terminology
- Cultural context awareness

### Accessibility Features

- Wheelchair-accessible route options
- Audio navigation support
- Visual impairment considerations
- Public transport accessibility information

## 📚 Resources

### Ghana Transportation Context

- **Ghana Highway Code** - Official driving regulations
- **Metropolitan Transport Strategy** - Urban planning documents
- **Road Network Atlas** - Infrastructure mapping
- **Public Transport Studies** - Academic research

### Technical Documentation

- **OpenStreetMap Ghana** - Community mapping data
- **National Road Fund** - Infrastructure data
- **Ghana Statistical Service** - Transportation statistics
- **Ministry of Transport** - Policy documents

### Development Resources

- **OpenRouteService Docs** - API documentation
- **HERE Developer Portal** - Commercial API guides
- **GraphHopper Documentation** - Routing engine docs
- **GTFS Specification** - Transit data format

## 💡 Ideas for New Contributors

### Easy Contributions

#### Service-Specific Easy Tasks

- **GeocodingService**: Add support for local language place names
- **FuelPriceService**: Improve error handling for web scraping failures
- **TransportStopsService**: Add validation for stop data quality
- **TransportRoutesService**: Add new transport route types (ferry, metro)
- **RoutingService**: Add input validation for coordinate bounds

#### General Easy Tasks

- Add new transport stops for specific cities
- Improve error messages and user feedback
- Update fuel price calculation formulas
- Add unit tests for existing functionality

### Intermediate Contributions

#### Service-Specific Intermediate Tasks

- **GeocodingService**: Implement caching for geocoding results
- **FuelPriceService**: Add historical price tracking and trends
- **RoutingService**: Implement traffic-aware routing
- **TransportStopsService**: Add real-time stop information
- **TransportRoutesService**: Add route scheduling and frequency data

#### General Intermediate Tasks

- Implement caching for expensive operations
- Add support for new transport modes
- Improve route optimization algorithms
- Create data validation tools

### Advanced Contributions

#### Service-Specific Advanced Tasks

- **GeocodingService**: Machine learning for improved geocoding accuracy
- **FuelPriceService**: Predictive fuel price modeling based on company trends
- **RoutingService**: Multi-modal journey planning optimization
- **TransportStopsService**: Real-time crowd density at stops
- **TransportRoutesService**: Dynamic route optimization based on traffic

#### General Advanced Tasks

- Real-time traffic integration
- Machine learning for route prediction
- Mobile app API optimization
- Multi-modal journey planning

## 🆘 Getting Help

### Communication Channels

- **GitHub Issues** - Bug reports and feature requests
- **GitHub Discussions** - General questions and ideas
- **Pull Request Reviews** - Code feedback and suggestions

### Common Issues and Solutions

#### External API Failures

- Check API key validity
- Verify rate limits
- Test with fallback providers
- Review error logs

#### Route Calculation Errors

- Validate coordinate boundaries
- Check transport mode support
- Verify road network connectivity
- Test with known working routes

#### Performance Issues

- Review caching implementation
- Check database query performance
- Monitor external API response times
- Optimize data processing

---

Thank you for contributing to GhanaAPI's Transport & Logistics module! Your contributions help make transportation information more accessible to developers and users across Ghana.

_For general contribution guidelines, see [Contributing Overview](./overview.md)_
