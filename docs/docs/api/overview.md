# GhanaAPI - Developer Guide

Welcome! GhanaAPI delivers a unified REST API for essential Ghanaian services. This guide highlights the available modules, how to get started, and where to find deeper documentation.

## 🚀 Quick Start

### Base URL

```
https://api.ghana-api.dev/v1
```

All endpoints are versioned under `/v1` and return JSON responses with a consistent envelope (`success`, `data`, `message`, `timestamp`).

## 📚 Available Services

### 🎓 [Education Data](./education)

Comprehensive directory of Ghanaian educational institutions sourced from GES datasets.

- ✅ Filterable search (region, district, category, grade, text query)
- ✅ Dedicated endpoints for region/district/category/grade listings
- ✅ School grading (A–D) and residency/gender metadata
- ✅ Analytics endpoint with counts by category, grade, and region
- ✅ Prisma-backed PostgreSQL storage seeded from official PDFs

### 📍 [Address Services](./addresses)

Validate and discover Ghana Post Digital Addresses.

- ✅ Address search
- ✅ Reverse geocoding
- ⏳ Address validation (Coming Soon)
- ⏳ Address standardization (Coming Soon)

### 🏦 [Banking & ATM Locator](./banking)

Find bank branches and ATMs nationwide.

- ✅ Text + proximity search with radius filtering
- ✅ Region and city browsing
- ✅ Branch metadata (hours, services, contacts)
- ✅ OpenStreetMap-backed data enrichment

### 📈 [Stock Market Data](./stock-market)

Real-time Ghana Stock Exchange data and analytics.

- ✅ Live prices for all listed companies
- ✅ Sector performance analysis (13+ sectors)
- ✅ Market summaries, indices, and trading status
- ✅ Advanced filtering and search

### 💱 [Exchange Rates](./exchange-rates)

Real-time and historical currency information.

- ✅ Current rates from Bank of Ghana
- ✅ Currency conversion
- ✅ Historical data tracking with automatic persistence
- ✅ Lazy-loading of today's rates when requested
- ⏳ Rate analytics (Coming Soon)

### 🏛️ [Location Data](./locations)

Administrative boundaries and metadata.

- ✅ Ghana region listings
- ✅ District-level data
- ✅ Administrative hierarchy normalization

### 🚗 [Transport & Logistics](./transport)

Routing, mobility, and cost information.

- ✅ Route planning and directions
- ✅ Transport stop catalogue
- ✅ Fuel prices and travel cost estimation
- ✅ Nearby transport services

## 📊 Implementation Status

| Service                   | Feature                 | Status         | Notes                                                |
| ------------------------- | ----------------------- | -------------- | ---------------------------------------------------- |
| **Address Services**      | Address Search          | ✅ Live        | Fully implemented                                    |
|                           | Reverse Geocoding       | ✅ Live        | Fully implemented                                    |
|                           | Address Validation      | ⏳ Coming Soon | Backend endpoint exists but not yet implemented      |
|                           | Address Standardization | ⏳ Coming Soon | Backend endpoint exists but not yet implemented      |
| **Exchange Rates**        | Current Rates           | ✅ Live        | Fully implemented with automatic persistence         |
|                           | Currency Conversion     | ✅ Live        | Fully implemented                                    |
|                           | Historical Data         | ✅ Live        | Fully implemented with lazy-loading of today's rates |
|                           | Rate Trends             | ✅ Live        | Available via historical endpoint                    |
| **Location Data**         | Regions                 | ✅ Live        | Fully implemented                                    |
|                           | Districts               | ✅ Live        | Fully implemented                                    |
| **Transport & Logistics** | Transport Stops         | ✅ Live        | Bus stops, stations, and public transport hubs       |
|                           | Route Calculation       | ✅ Live        | Optimal routing between locations                    |
|                           | Route Directions        | ✅ Live        | Turn-by-turn navigation instructions                 |
|                           | Travel Cost Estimation  | ✅ Live        | Fuel costs and fare calculations                     |
|                           | Fuel Prices             | ✅ Live        | Current petrol, diesel, and LPG prices               |
|                           | Nearby Services         | ✅ Live        | Find transport stops within radius                   |

### Status Legend

- ✅ **Live**: Fully implemented and available for use
- ⏳ **Coming Soon**: Backend endpoint exists but implementation is pending
- 🚧 **In Development**: Currently being developed
- 📋 **Planned**: Planned for future releases

> 📋 **For detailed version history and recent changes, see the [Changelog](../CHANGELOG.md).**

## 🔧 Making Requests

### HTTP Methods

- `GET` - Retrieve data
- `POST` - Submit data for processing

### Response Format

All responses follow a consistent JSON format:

```json
{
  "success": true,
  "data": {
    // Response data here
  },
  "message": "Operation completed successfully",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Error Responses

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input provided",
    "details": {
      "field": "digitalCode",
      "issue": "Format must be XX-XXX-XXXX"
    }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## 📋 Common HTTP Status Codes

| Code | Description           |
| ---- | --------------------- |
| 200  | Success               |
| 400  | Bad Request           |
| 404  | Not Found             |
| 500  | Internal Server Error |

## 📊 Usage Examples

### cURL Examples

#### Search Addresses

```bash
curl -X GET "https://ghana-api.dev/v1/addresses/search?q=Accra" \
  -H "Accept: application/json"
```

#### Search Schools

```bash
curl -X GET "https://ghana-api.dev/v1/education/schools/search?region=Ashanti&grade=A" \
  -H "Accept: application/json"
```

#### Get Exchange Rates

```bash
curl -X GET "https://ghana-api.dev/v1/exchange-rates/current?currencies=USD,EUR" \
  -H "Accept: application/json"
```

#### Get Regions

```bash
curl -X GET "https://ghana-api.dev/v1/locations/regions" \
  -H "Accept: application/json"
```

#### Calculate Route

```bash
curl -X GET "https://ghana-api.dev/v1/transport/route-calculation?start_lat=5.6037&start_lng=-0.187&end_lat=6.6885&end_lng=-1.6244&mode=driving" \
  -H "Accept: application/json"
```

#### Get Fuel Prices

```bash
curl -X GET "https://ghana-api.dev/v1/transport/fuel-prices" \
  -H "Accept: application/json"
```

### JavaScript Examples

#### Address Search

```javascript
const searchAddresses = async (query) => {
  const response = await fetch(
    `https://ghana-api.dev/v1/addresses/search?q=${encodeURIComponent(query)}`
  );
  const result = await response.json();
  return result;
};

// Usage
const result = await searchAddresses("Accra");
console.log(result.data); // Array of matching addresses
```

#### Exchange Rate Conversion

```javascript
const convertCurrency = async (from, to, amount) => {
  const response = await fetch(
    "https://ghana-api.dev/v1/exchange-rates/convert",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, amount }),
    }
  );
  const result = await response.json();
  return result;
};

// Usage
const conversion = await convertCurrency("GHS", "USD", 1000);
console.log(conversion.data.result); // Converted amount
```

#### Route Planning

```javascript
const calculateRoute = async (
  startLat,
  startLng,
  endLat,
  endLng,
  mode = "driving"
) => {
  const params = new URLSearchParams({
    start_lat: startLat,
    start_lng: startLng,
    end_lat: endLat,
    end_lng: endLng,
    mode: mode,
  });

  const response = await fetch(
    `https://ghana-api.dev/v1/transport/route-calculation?${params}`
  );
  const result = await response.json();
  return result;
};

// Usage
const route = await calculateRoute(5.6037, -0.187, 6.6885, -1.6244, "driving");
console.log(route.data.distance); // Distance in kilometers
console.log(route.data.duration); // Duration in seconds
```

## 🔍 Best Practices

### 1. Error Handling

Always implement proper error handling:

```javascript
try {
  const response = await fetch(url);
  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error.message);
  }

  return data.data;
} catch (error) {
  console.error("API Error:", error.message);
  // Handle error appropriately
}
```

### 2. Caching

Cache responses when appropriate:

```javascript
const cache = new Map();

const getCachedData = async (url, ttl = 300000) => {
  const cached = cache.get(url);

  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data;
  }

  const response = await fetch(url);
  const data = await response.json();

  cache.set(url, {
    data,
    timestamp: Date.now(),
  });

  return data;
};
```

## 📈 Monitoring and Analytics

### Request Logging

Log your API usage for monitoring:

```javascript
const logApiRequest = (endpoint, response, duration) => {
  console.log({
    endpoint,
    status: response.status,
    duration: `${duration}ms`,
    timestamp: new Date().toISOString(),
  });
};
```

### Performance Tracking

Track response times and success rates:

```javascript
const trackPerformance = async (apiCall) => {
  const start = Date.now();

  try {
    const result = await apiCall();
    const duration = Date.now() - start;

    // Log success
    logApiRequest("success", { status: 200 }, duration);
    return result;
  } catch (error) {
    const duration = Date.now() - start;

    // Log error
    logApiRequest("error", { status: error.status }, duration);
    throw error;
  }
};
```

## 🔐 Security Considerations

### Input Validation

Always validate inputs before sending to the API:

```javascript
const validateDigitalCode = (code) => {
  const pattern = /^[A-Z]{2,3}-\d{3}-\d{4}$/;
  return pattern.test(code);
};

// Usage
if (!validateDigitalCode(digitalCode)) {
  throw new Error("Invalid digital code format");
}
```

## 📞 Support and Resources

### Documentation

- [API Reference](https://api.ghana-api.dev/docs)
- [API Documentation](./overview)
- [GitHub Repository](https://github.com/teebhagg/GhanaAPI)

### Community

- [GitHub Discussions](https://github.com/teebhagg/GhanaAPI/discussions)
- [Discord Server](https://discord.gg/ghana-api)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/ghanaapi)

### Support

- **Email**: support@ghanaapi.com
- **Response Time**: Within 24 hours
- **Priority Support**: Available for Pro and Enterprise users

## 🚀 Getting Started Checklist

1. **Choose Your Service**

   - [Address Services](./addresses) - For address validation and geocoding
   - [Exchange Rates](./exchange-rates) - For currency data
   - [Location Data](./locations) - For administrative information

2. **Make Your First Request**

   - Start with a simple GET request
   - Test error handling
   - Implement caching if needed

3. **Scale Your Integration**

   - Add monitoring and logging

   - Optimize for performance

---

Ready to get started? Choose a service below to dive deeper into the specific APIs:

- [📍 Address Services](./addresses)
- [💱 Exchange Rates](./exchange-rates)
- [🏛️ Location Data](./locations)
