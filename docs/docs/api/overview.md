# GhanaAPI - Developer Guide

Welcome to GhanaAPI! This comprehensive REST API provides access to essential Ghanaian services including address validation, exchange rates, and location data.

## 🚀 Quick Start

### Base URL

```
https://ghana-api.dev/v1
```

## 📚 Available Services

### 📍 [Address Services](./addresses)

Validate, search, and geocode Ghana Post Digital Addresses

- ✅ Address search
- ✅ Reverse geocoding
- ⏳ Address validation (Coming Soon)
- ⏳ Address standardization (Coming Soon)

### 💱 [Exchange Rates](./exchange-rates)

Real-time and historical currency exchange rates

- ✅ Current rates from Bank of Ghana
- ✅ Currency conversion
- ⏳ Historical data and trends (Coming Soon)
- ⏳ Rate analytics (Coming Soon)

**Supported Currencies:** USD, EUR, GBP, NGN (relative to GHS)

**Note:** Currently limited to 4 major currencies. Additional currencies may be added in future updates.

### 🏛️ [Location Data](./locations)

Administrative and geographic information

- ✅ Regional data
- ✅ District information
- ✅ Administrative hierarchy

## 📊 Implementation Status

| Service              | Feature                 | Status         | Notes                                           |
| -------------------- | ----------------------- | -------------- | ----------------------------------------------- |
| **Address Services** | Address Search          | ✅ Live        | Fully implemented                               |
|                      | Reverse Geocoding       | ✅ Live        | Fully implemented                               |
|                      | Address Validation      | ⏳ Coming Soon | Backend endpoint exists but not yet implemented |
|                      | Address Standardization | ⏳ Coming Soon | Backend endpoint exists but not yet implemented |
| **Exchange Rates**   | Current Rates           | ✅ Live        | Fully implemented                               |
|                      | Currency Conversion     | ✅ Live        | Fully implemented                               |
|                      | Historical Data         | ⏳ Coming Soon | Backend endpoint exists but not yet implemented |
|                      | Rate Trends             | ⏳ Coming Soon | Backend endpoint exists but not yet implemented |
| **Location Data**    | Regions                 | ✅ Live        | Fully implemented                               |
|                      | Districts               | ✅ Live        | Fully implemented                               |

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

- [API Reference](./reference)
- [Code Examples](./examples)
- [SDK Documentation](./sdks)

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
