# Contributing to Location Data

Location data services provide comprehensive information about Ghana's administrative regions, districts, constituencies, and other geographic divisions. This guide will help you contribute to location-related features.

## 🏛️ Current Location Features

### Implemented Features

- **Regional Data** - Information about Ghana's 16 administrative regions
- **District Information** - Details about metropolitan, municipal, and district assemblies
- **Constituency Data** - Electoral constituency boundaries and information
- **Administrative Hierarchy** - Relationships between regions, districts, and localities

### Feature Areas for Contribution

#### 📊 Data Completeness & Accuracy

- Verify and update administrative boundaries
- Add missing district and constituency information
- Population and demographic data integration
- Economic and development indicators

#### 🗺️ Geographic Information

- GPS coordinates for administrative centers
- Boundary polygon data (GeoJSON)
- Elevation and topographic information
- Land area calculations and statistics

#### 🏘️ Local Government Integration

- Assembly member information
- Local government contact details
- Service delivery points and facilities
- Development project tracking

#### 🔍 Search & Discovery

- Smart location search algorithms
- Hierarchical location browsing
- Location-based service discovery
- Proximity and distance calculations

## 🛠️ Technical Architecture

### File Structure

```
backend/src/locations/
├── locations.controller.ts          # API route handlers
├── locations.service.ts             # Business logic
├── locations.module.ts              # Module configuration
├── dto/
│   ├── region.dto.ts               # Region data transfer objects
│   └── district.dto.ts             # District data transfer objects
├── entities/
│   └── location.entity.ts          # Database entities (placeholder)
└── data/
    └── regions.json                # Static region and district data
```

### Key Services

#### LocationsService

```typescript
@Injectable()
export class LocationsService {
  getRegions(): RegionDto[] {
    // Returns all 16 administrative regions
  }

  getDistricts(regionId: string): DistrictDto[] {
    // Returns all districts within a specific region
  }
}
```

#### LocationsController

```typescript
@Controller("locations")
export class LocationsController {
  @Get("regions")
  getRegions() {
    // Lists all regions
  }

  @Get("districts/:regionId")
  getDistricts(@Param("regionId") regionId: string) {
    // Gets districts for a region
  }
}
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Basic knowledge of TypeScript and NestJS
- Understanding of Ghana's administrative structure

### Development Setup

1. **Clone and Install Dependencies**

   ```bash
   cd backend
   npm install
   ```

2. **Start Development Server**

   ```bash
   npm run start:dev
   ```

3. **Test the API**

   ```bash
   # Get all regions
   curl http://localhost:3000/locations/regions

   # Get districts for Ahafo Region
   curl http://localhost:3000/locations/districts/AR
   ```

## 📝 Contribution Guidelines

### Adding New Regions or Districts

1. **Update Data Source**

   - Edit `backend/src/locations/data/regions.json`
   - Follow the existing structure:

   ```json
   {
     "code": "NEW",
     "label": "New Region",
     "capital": "Capital City",
     "districts": [
       {
         "code": "ND1",
         "label": "New District 1",
         "category": "Municipal",
         "capital": "District Capital"
       }
     ]
   }
   ```

2. **Update DTOs if Needed**

   - Modify `region.dto.ts` or `district.dto.ts` for new fields
   - Ensure proper validation and documentation

3. **Add Tests**
   - Create unit tests in `locations.service.spec.ts`
   - Add integration tests for new endpoints

### Adding New Features

#### Geographic Coordinates

```typescript
// Add to district.dto.ts
export class DistrictDto {
  @ApiProperty() code: string;
  @ApiProperty() label: string;
  @ApiProperty() category: string;
  @ApiProperty() capital: string;
  @ApiProperty({ required: false }) coordinates?: {
    lat: number;
    lng: number;
  };
}
```

#### Search Functionality

```typescript
// Add to locations.service.ts
async searchLocations(query: string): Promise<LocationDto[]> {
  const searchTerm = query.toLowerCase();
  const results: LocationDto[] = [];

  // Search regions
  const regions = this.getRegions();
  for (const region of regions) {
    if (region.label.toLowerCase().includes(searchTerm)) {
      results.push({ ...region, type: 'region' });
    }
  }

  // Search districts
  for (const region of regions) {
    const districts = this.getDistricts(region.code);
    for (const district of districts) {
      if (district.label.toLowerCase().includes(searchTerm)) {
        results.push({ ...district, type: 'district', region: region.code });
      }
    }
  }

  return results;
}
```

### Database Integration

The current implementation uses static JSON data. To integrate with a database:

1. **Update Prisma Schema**

   ```prisma
   model Region {
     id        String     @id @default(cuid())
     code      String     @unique
     label     String
     capital   String
     districts District[]
     createdAt DateTime   @default(now())
     updatedAt DateTime   @updatedAt
   }

   model District {
     id       String @id @default(cuid())
     code     String @unique
     label    String
     category String
     capital  String
     regionId String
     region   Region @relation(fields: [regionId], references: [id])
     createdAt DateTime @default(now())
     updatedAt DateTime @updatedAt
   }
   ```

2. **Update Service**

   ```typescript
   @Injectable()
   export class LocationsService {
     constructor(private prisma: PrismaService) {}

     async getRegions(): Promise<RegionDto[]> {
       const regions = await this.prisma.region.findMany({
         select: { code: true, label: true },
       });
       return regions;
     }

     async getDistricts(regionId: string): Promise<DistrictDto[]> {
       const districts = await this.prisma.district.findMany({
         where: { region: { code: regionId } },
         select: { code: true, label: true, category: true, capital: true },
       });
       return districts;
     }
   }
   ```

## 🧪 Testing

### Unit Tests

```typescript
describe("LocationsService", () => {
  let service: LocationsService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [LocationsService],
    }).compile();

    service = module.get<LocationsService>(LocationsService);
  });

  it("should return all regions", () => {
    const regions = service.getRegions();
    expect(regions).toBeDefined();
    expect(regions.length).toBeGreaterThan(0);
  });

  it("should return districts for a valid region", () => {
    const districts = service.getDistricts("AR");
    expect(districts).toBeDefined();
    expect(districts.length).toBeGreaterThan(0);
  });
});
```

### Integration Tests

```typescript
describe("LocationsController (e2e)", () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it("/locations/regions (GET)", () => {
    return request(app.getHttpServer())
      .get("/locations/regions")
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);
      });
  });
});
```

## 📊 Data Validation

### Region Data Validation

- **Code**: Must be 2-3 characters, unique across all regions
- **Label**: Must be a valid region name, properly capitalized
- **Capital**: Must be a valid city name within the region
- **Districts**: Must be a non-empty array

### District Data Validation

- **Code**: Must be 3-4 characters, unique across all districts
- **Label**: Must be a valid district name
- **Category**: Must be one of: "Municipal", "Metropolitan", "District"
- **Capital**: Must be a valid town/city name

## 🔄 Future Enhancements

### Planned Features

1. **Geographic Boundaries**

   - GeoJSON polygon data for regions and districts
   - Spatial queries and calculations
   - Map visualization endpoints

2. **Enhanced Search**

   - Fuzzy search with typo tolerance
   - Search by coordinates (reverse geocoding)
   - Search by postal codes

3. **Population Data**

   - Integration with Ghana Statistical Service data
   - Population density calculations
   - Demographic statistics

4. **Local Government Data**
   - Assembly member information
   - Contact details for local authorities
   - Service delivery points

### Contribution Priorities

1. **High Priority**

   - Add GPS coordinates for all administrative centers
   - Implement comprehensive search functionality
   - Add data validation and error handling

2. **Medium Priority**

   - Database integration with Prisma
   - Add constituency data
   - Implement caching for better performance

3. **Low Priority**
   - Geographic boundary data
   - Population and demographic integration
   - Advanced analytics features

## 🤝 Contributing Process

1. **Fork the Repository**
2. **Create a Feature Branch**
   ```bash
   git checkout -b feature/locations-enhancement
   ```
3. **Make Your Changes**
   - Follow the coding standards
   - Add appropriate tests
   - Update documentation
4. **Test Your Changes**
   ```bash
   npm run test
   npm run test:e2e
   ```
5. **Submit a Pull Request**
   - Provide clear description of changes
   - Include test results
   - Reference any related issues

## 📚 Resources

- [Ghana Statistical Service](https://statsghana.gov.gh/)
- [Local Government Service](https://lgs.gov.gh/)
- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)

## 🆘 Getting Help

- **Issues**: Create an issue for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions
- **Documentation**: Check existing docs and examples
- **Community**: Join our Discord or Slack channels

---

Thank you for contributing to Ghana's location data services! Your contributions help make geographic information more accessible and accurate for everyone.
