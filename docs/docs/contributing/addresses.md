# Contributing to Address Services

Address services are a core feature of GhanaAPI, providing validation, lookup, and search functionality for Ghana Post Digital Addresses. This guide will help you contribute to address-related features.

## 📍 Current Address Features

### Implemented Features
- **Address Validation** - Validate Ghana Post Digital Address format and existence
- **Reverse Geocoding** - Get address information from GPS coordinates
- **Address Search** - Search for addresses by location name or description

### Feature Areas for Contribution

#### 🔍 Address Validation Enhancement
- Improve validation algorithms
- Add support for different address formats
- Enhanced error messages and suggestions
- Bulk address validation

#### 🌍 Geocoding Services  
- Forward geocoding (address to coordinates)
- Improved reverse geocoding accuracy
- Multiple coordinate system support
- Address standardization

#### 🔎 Search & Discovery
- Fuzzy search algorithms
- Auto-complete functionality
- Popular location suggestions
- Search result ranking

#### 📊 Data Quality & Sources
- Integration with additional data sources
- Address database improvements
- Data validation and cleanup
- Real-time address verification

## 🛠️ Technical Architecture

### File Structure
```
backend/src/
├── controllers/
│   └── addressController.js     # Route handlers
├── services/
│   ├── addressService.js        # Core business logic
│   ├── geocodingService.js      # Coordinate operations
│   └── validationService.js     # Address validation
├── models/
│   └── address.js               # Address data models
├── utils/
│   ├── addressFormatter.js      # Address formatting
│   └── coordinateUtils.js       # GPS utilities
└── tests/
    └── addresses/               # Address-specific tests
```

### Key Services

#### AddressService
```javascript
// services/addressService.js
class AddressService {
  async validateAddress(digitalCode) {
    // Validate Ghana Post Digital Address format
  }

  async geocodeAddress(address) {
    // Convert address to coordinates
  }

  async reverseGeocode(lat, lng) {
    // Convert coordinates to address
  }

  async searchAddresses(query, options) {
    // Search for addresses by query
  }
}
```

#### ValidationService
```javascript
// services/validationService.js
class ValidationService {
  validateDigitalCodeFormat(code) {
    // Check format: XX-XXX-XXXX
  }

  validateCoordinates(lat, lng) {
    // Check if coordinates are within Ghana bounds
  }

  sanitizeAddressQuery(query) {
    // Clean and prepare search queries
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

# Create feature branch
git checkout -b feature/address-enhancement-name
```

### 2. Environment Configuration

```bash
# Copy environment file
cp .env.example .env

# Add any address-specific configuration
echo "GHANA_POST_API_KEY=your_key_here" >> .env
echo "GEOCODING_SERVICE_URL=https://api.example.com" >> .env
```

### 3. Running Address Services Locally

```bash
# Start the development server
npm run start:dev

# Test address validation endpoint
curl "http://localhost:3000/v1/addresses/validate/GA-123-4567"

# Test address search
curl "http://localhost:3000/v1/addresses/search?q=University%20of%20Ghana"
```

## 💡 Contributing Ideas

### Beginner-Friendly Tasks
- [ ] Add more comprehensive input validation
- [ ] Improve error messages for invalid addresses
- [ ] Add support for case-insensitive address codes
- [ ] Create additional test cases for edge cases
- [ ] Improve documentation examples

### Intermediate Tasks
- [ ] Implement address auto-complete functionality
- [ ] Add support for batch/bulk address validation
- [ ] Optimize database queries for better performance
- [ ] Add caching for frequently validated addresses
- [ ] Implement fuzzy search for partial addresses

### Advanced Tasks
- [ ] Build machine learning models for address prediction
- [ ] Integrate multiple geocoding services with fallbacks
- [ ] Create address standardization algorithms
- [ ] Develop real-time address verification system
- [ ] Build address suggestion engine

## 🧪 Testing Address Features

### Running Address Tests

```bash
# Run all address-related tests
npm test -- --testPathPattern=addresses

# Run specific test files
npm test src/tests/addresses/validation.test.js
npm test src/tests/addresses/geocoding.test.js

# Run tests in watch mode for development
npm run test:watch -- --testPathPattern=addresses
```

### Writing Address Tests

#### Unit Tests Example
```javascript
// src/tests/services/addressService.test.js
const AddressService = require('../../services/addressService');

describe('AddressService', () => {
  let addressService;

  beforeEach(() => {
    addressService = new AddressService();
  });

  describe('validateAddress', () => {
    it('should validate correct Ghana Post digital address', async () => {
      const result = await addressService.validateAddress('GA-123-4567');
      
      expect(result.isValid).toBe(true);
      expect(result.digitalCode).toBe('GA-123-4567');
      expect(result.coordinates).toHaveProperty('latitude');
      expect(result.coordinates).toHaveProperty('longitude');
    });

    it('should reject invalid address format', async () => {
      const result = await addressService.validateAddress('INVALID-FORMAT');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toHaveProperty('code');
      expect(result.error.code).toBe('INVALID_FORMAT');
    });

    it('should handle addresses outside Ghana', async () => {
      const result = await addressService.validateAddress('US-123-4567');
      
      expect(result.isValid).toBe(false);
      expect(result.error.code).toBe('INVALID_REGION');
    });
  });

  describe('searchAddresses', () => {
    it('should return addresses matching query', async () => {
      const results = await addressService.searchAddresses('Accra Mall', {
        limit: 5
      });

      expect(results.addresses).toHaveLength(5);
      expect(results.addresses[0]).toHaveProperty('digitalCode');
      expect(results.addresses[0]).toHaveProperty('formattedAddress');
    });

    it('should handle empty search queries', async () => {
      const results = await addressService.searchAddresses('', { limit: 10 });
      
      expect(results.addresses).toHaveLength(0);
      expect(results.total).toBe(0);
    });
  });
});
```

#### Integration Tests Example
```javascript
// src/tests/routes/addresses.test.js
const request = require('supertest');
const app = require('../../app');

describe('Address API Endpoints', () => {
  describe('GET /v1/addresses/validate/:digitalCode', () => {
    it('should validate valid digital address', async () => {
      const response = await request(app)
        .get('/v1/addresses/validate/GA-123-4567')
        .expect(200);

      expect(response.body.isValid).toBe(true);
      expect(response.body.digitalCode).toBe('GA-123-4567');
      expect(response.body).toHaveProperty('formattedAddress');
      expect(response.body).toHaveProperty('coordinates');
    });

    it('should return 400 for invalid format', async () => {
      const response = await request(app)
        .get('/v1/addresses/validate/invalid-format')
        .expect(400);

      expect(response.body.error.code).toBe('INVALID_FORMAT');
    });
  });

  describe('GET /v1/addresses/search', () => {
    it('should search addresses by query', async () => {
      const response = await request(app)
        .get('/v1/addresses/search?q=University%20of%20Ghana')
        .expect(200);

      expect(response.body.addresses).toBeInstanceOf(Array);
      expect(response.body.total).toBeGreaterThanOrEqual(0);
      expect(response.body.query).toBe('University of Ghana');
    });

    it('should respect limit parameter', async () => {
      const response = await request(app)
        .get('/v1/addresses/search?q=Accra&limit=3')
        .expect(200);

      expect(response.body.addresses.length).toBeLessThanOrEqual(3);
    });
  });

  describe('GET /v1/addresses/lookup', () => {
    it('should reverse geocode coordinates', async () => {
      const response = await request(app)
        .get('/v1/addresses/lookup?lat=5.6037&lng=-0.1870')
        .expect(200);

      expect(response.body).toHaveProperty('address');
      expect(response.body.coordinates.latitude).toBeCloseTo(5.6037, 4);
      expect(response.body.coordinates.longitude).toBeCloseTo(-0.1870, 4);
    });

    it('should return 400 for invalid coordinates', async () => {
      const response = await request(app)
        .get('/v1/addresses/lookup?lat=invalid&lng=invalid')
        .expect(400);

      expect(response.body.error.code).toBe('INVALID_COORDINATES');
    });
  });
});
```

## 📊 Data Sources and Integration

### Ghana Post Digital Address System
```javascript
// Example integration with Ghana Post API
class GhanaPostIntegration {
  async validateWithGhanaPost(digitalCode) {
    try {
      const response = await fetch(`${GHANA_POST_API_URL}/validate/${digitalCode}`, {
        headers: {
          'Authorization': `Bearer ${GHANA_POST_API_KEY}`
        }
      });
      
      return await response.json();
    } catch (error) {
      // Handle API errors gracefully
      return { isValid: false, error: 'SERVICE_UNAVAILABLE' };
    }
  }
}
```

### OpenStreetMap Integration
```javascript
// Example geocoding with OpenStreetMap
class OpenStreetMapGeocoder {
  async geocode(address) {
    const query = encodeURIComponent(address + ', Ghana');
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`
    );
    
    const results = await response.json();
    return results[0] || null;
  }
}
```

## 🔧 Implementation Examples

### Adding New Address Validation Rules

```javascript
// services/validationService.js
class ValidationService {
  validateDigitalCodeFormat(digitalCode) {
    // Enhanced validation with multiple formats
    const formats = [
      /^[A-Z]{2}-[0-9]{3}-[0-9]{4}$/,  // Standard: GA-123-4567
      /^[A-Z]{2}[0-9]{7}$/,            // Compact: GA1234567
      /^[A-Z]{2}-[A-Z]{3}-[0-9]{4}$/   // Alternative: GA-ACC-1234
    ];
    
    return formats.some(format => format.test(digitalCode));
  }

  // New method: Validate address components
  validateAddressComponents(components) {
    const { region, district, area, street } = components;
    
    if (!this.isValidRegion(region)) {
      return { isValid: false, error: 'INVALID_REGION' };
    }
    
    if (!this.isValidDistrict(district, region)) {
      return { isValid: false, error: 'INVALID_DISTRICT' };
    }
    
    return { isValid: true };
  }
}
```

### Adding Bulk Address Validation

```javascript
// controllers/addressController.js
class AddressController {
  async validateBulkAddresses(req, res) {
    try {
      const { addresses } = req.body;
      
      if (!Array.isArray(addresses) || addresses.length === 0) {
        return res.status(400).json({
          error: {
            code: 'INVALID_INPUT',
            message: 'Addresses array is required'
          }
        });
      }
      
      if (addresses.length > 100) {
        return res.status(400).json({
          error: {
            code: 'BATCH_SIZE_EXCEEDED',
            message: 'Maximum 100 addresses per batch'
          }
        });
      }
      
      const results = await Promise.all(
        addresses.map(async (digitalCode) => {
          try {
            const result = await this.addressService.validateAddress(digitalCode);
            return { digitalCode, ...result };
          } catch (error) {
            return {
              digitalCode,
              isValid: false,
              error: { code: 'VALIDATION_FAILED', message: error.message }
            };
          }
        })
      );
      
      res.json({
        results,
        total: results.length,
        valid: results.filter(r => r.isValid).length,
        invalid: results.filter(r => !r.isValid).length
      });
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to validate addresses'
        }
      });
    }
  }
}
```

### Adding Address Auto-complete

```javascript
// services/addressService.js
class AddressService {
  async autoCompleteAddress(partialQuery, limit = 10) {
    try {
      // Clean and prepare the query
      const cleanQuery = this.validationService.sanitizeAddressQuery(partialQuery);
      
      if (cleanQuery.length < 2) {
        return { suggestions: [], total: 0 };
      }
      
      // Search for addresses matching the partial query
      const suggestions = await this.searchAddressDatabase(cleanQuery, {
        limit,
        fuzzy: true,
        popular: true
      });
      
      return {
        query: partialQuery,
        suggestions: suggestions.map(addr => ({
          digitalCode: addr.digitalCode,
          formattedAddress: addr.formattedAddress,
          region: addr.region,
          district: addr.district,
          score: addr.relevanceScore
        })),
        total: suggestions.length
      };
    } catch (error) {
      console.error('Auto-complete failed:', error);
      return { suggestions: [], total: 0, error: error.message };
    }
  }
}
```

## 📝 API Documentation

When adding new address endpoints, make sure to include proper Swagger/OpenAPI documentation:

```javascript
/**
 * @swagger
 * /v1/addresses/validate/bulk:
 *   post:
 *     tags: [Addresses]
 *     summary: Validate multiple addresses
 *     description: Validate up to 100 Ghana Post Digital Addresses in a single request
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               addresses:
 *                 type: array
 *                 items:
 *                   type: string
 *                   pattern: '^[A-Z]{2}-[0-9]{3}-[0-9]{4}$'
 *                 example: ['GA-123-4567', 'AS-456-7890']
 *                 maxItems: 100
 *     responses:
 *       200:
 *         description: Bulk validation results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 results:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AddressValidation'
 *                 total:
 *                   type: integer
 *                 valid:
 *                   type: integer
 *                 invalid:
 *                   type: integer
 *       400:
 *         description: Invalid request
 */
```

## 🎯 Performance Considerations

### Caching Strategies
```javascript
// services/addressService.js
const NodeCache = require('node-cache');
const addressCache = new NodeCache({ stdTTL: 3600 }); // 1 hour

class AddressService {
  async validateAddress(digitalCode) {
    // Check cache first
    const cacheKey = `validate_${digitalCode}`;
    const cached = addressCache.get(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    // Perform validation
    const result = await this.performValidation(digitalCode);
    
    // Cache successful results
    if (result.isValid) {
      addressCache.set(cacheKey, result);
    }
    
    return result;
  }
}
```

### Database Optimization
```javascript
// models/address.js
// Add database indexes for common queries
const addressIndexes = [
  { digitalCode: 1 },
  { 'coordinates.latitude': 1, 'coordinates.longitude': 1 },
  { region: 1, district: 1 },
  { formattedAddress: 'text' } // Text search index
];
```

## 🚀 Deployment and Monitoring

### Health Checks
```javascript
// Add health check for address services
router.get('/v1/health/addresses', async (req, res) => {
  try {
    // Test basic validation
    const testResult = await addressService.validateAddress('GA-000-0000');
    
    res.json({
      status: 'healthy',
      services: {
        validation: 'operational',
        geocoding: 'operational',
        search: 'operational'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'degraded',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});
```

## 📈 Next Steps

Ready to contribute to address services? Here's what you can do:

1. **🔍 Check [address-related issues](https://github.com/teebhagg/GhanaAPI/issues?q=is%3Aissue+is%3Aopen+label%3Aaddresses)**
2. **🚀 Pick a task that matches your skill level**
3. **💬 Join discussions in [GitHub Discussions](https://github.com/teebhagg/GhanaAPI/discussions)**
4. **📝 Share ideas for new address features**

---

**Thank you for helping improve address services for Ghana!** Your contributions make it easier for developers to work with Ghanaian location data. 🇬🇭