# Address Services API

The Address Services API provides comprehensive functionality for working with Ghana Post Digital Addresses, including validation, geocoding, and search capabilities.

> **Implementation Status:** Some endpoints are not yet fully implemented. See individual endpoint descriptions for current status.

## 📍 Overview

Ghana Post Digital Addresses follow the format `XX-XXX-XXXX` where:

- First part: Region code (2-3 characters)
- Second part: District code (3 characters)
- Third part: Unique identifier (4 characters)

Example: `GA-123-4567`

## 🔗 Base Endpoint

```
https://ghana-api.dev/v1/addresses
```

## 📋 Available Endpoints

### 1. Validate Address ⏳

> **Status:** Coming Soon - Not yet implemented

Validates a Ghana Post Digital Address format and checks if it exists in the database.

**Endpoint:** `GET /addresses/validate/{digitalCode}`

#### Parameters

| Parameter     | Type   | Required | Description                          |
| ------------- | ------ | -------- | ------------------------------------ |
| `digitalCode` | string | Yes      | The digital address code to validate |

#### Example Request

```bash
curl -X GET "https://ghana-api.dev/v1/addresses/validate/GA-123-4567" \
  -H "Accept: application/json"
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "isValid": true,
    "digitalCode": "GA-123-4567",
    "formattedAddress": "123 Main Street, Accra, Ghana",
    "coordinates": {
      "lat": 5.56,
      "lng": -0.2057
    }
  },
  "message": "Address validation completed",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### Error Response

```json
{
  "success": false,
  "error": {
    "code": "INVALID_FORMAT",
    "message": "Digital address format is invalid",
    "details": {
      "field": "digitalCode",
      "issue": "Format must be XX-XXX-XXXX"
    }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### JavaScript Example

```javascript
const validateAddress = async (digitalCode) => {
  try {
    const response = await fetch(
      `https://ghana-api.dev/v1/addresses/validate/${digitalCode}`
    );
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error.message);
    }

    return result.data;
  } catch (error) {
    console.error("Validation error:", error.message);
    throw error;
  }
};

// Usage
const addressInfo = await validateAddress("GA-123-4567");
console.log("Is valid:", addressInfo.isValid);
console.log("Coordinates:", addressInfo.coordinates);
```

### 2. Reverse Geocoding

Get address information from GPS coordinates (latitude and longitude).

**Endpoint:** `GET /addresses/lookup`

#### Query Parameters

| Parameter | Type   | Required | Description          |
| --------- | ------ | -------- | -------------------- |
| `lat`     | number | Yes      | Latitude coordinate  |
| `lng`     | number | Yes      | Longitude coordinate |

#### Example Request

```bash
curl -X GET "https://ghana-api.dev/v1/addresses/lookup?lat=5.5600&lng=-0.2057" \
  -H "Accept: application/json"
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "digitalCode": "GA-123-4567",
    "addressLine1": "123 Main Street, Accra Central",
    "addressLine2": "Greater Accra Region",
    "latitude": 5.56,
    "longitude": -0.2057,
    "postalCode": "00233"
  },
  "message": "Address lookup completed",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### JavaScript Example

```javascript
const lookupAddress = async (lat, lng) => {
  try {
    const response = await fetch(
      `https://ghana-api.dev/v1/addresses/lookup?lat=${lat}&lng=${lng}`
    );
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error.message);
    }

    return result.data;
  } catch (error) {
    console.error("Lookup error:", error.message);
    throw error;
  }
};

// Usage
const address = await lookupAddress(5.56, -0.2057);
console.log("Address:", address.addressLine1);
console.log("Digital Code:", address.digitalCode);
```

### 3. Address Search

Search for addresses by location name, description, or partial digital code.

**Endpoint:** `GET /addresses/search`

#### Query Parameters

| Parameter | Type   | Required | Description                         |
| --------- | ------ | -------- | ----------------------------------- |
| `q`       | string | Yes      | Search query (minimum 2 characters) |

#### Example Request

```bash
curl -X GET "https://ghana-api.dev/v1/addresses/search?q=Accra" \
  -H "Accept: application/json"
```

#### Example Response

```json
{
  "success": true,
  "data": [
    {
      "digitalCode": "GA-123-4567",
      "addressLine1": "123 Main Street, Accra Central",
      "addressLine2": "Greater Accra Region",
      "latitude": 5.56,
      "longitude": -0.2057,
      "postalCode": "00233"
    },
    {
      "digitalCode": "GA-124-5678",
      "addressLine1": "456 Ring Road, Accra",
      "addressLine2": "Greater Accra Region",
      "latitude": 5.57,
      "longitude": -0.2157,
      "postalCode": "00233"
    }
  ],
  "message": "Search completed",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### JavaScript Example

```javascript
const searchAddresses = async (query) => {
  try {
    const response = await fetch(
      `https://ghana-api.dev/v1/addresses/search?q=${encodeURIComponent(query)}`
    );
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error.message);
    }

    return result.data;
  } catch (error) {
    console.error("Search error:", error.message);
    throw error;
  }
};

// Usage
const addresses = await searchAddresses("Accra");
addresses.forEach((address) => {
  console.log(`${address.addressLine1} - ${address.digitalCode}`);
});
```

### 4. Address Standardization ⏳

> **Status:** Coming Soon - Not yet implemented

Standardize a raw address string to ensure consistent formatting.

**Endpoint:** `POST /addresses/standardize`

#### Request Body

```json
{
  "rawAddress": "123 main st accra ghana"
}
```

#### Example Request

```bash
curl -X POST "https://ghana-api.dev/v1/addresses/standardize" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "rawAddress": "123 main st accra ghana"
  }'
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "digitalCode": "GA-123-4567",
    "addressLine1": "123 Main Street, Accra, Ghana",
    "addressLine2": "Greater Accra Region",
    "postalCode": "00233"
  },
  "message": "Address standardized successfully",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### JavaScript Example

```javascript
const standardizeAddress = async (rawAddress) => {
  try {
    const response = await fetch(
      "https://ghana-api.dev/v1/addresses/standardize",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rawAddress }),
      }
    );
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error.message);
    }

    return result.data;
  } catch (error) {
    console.error("Standardization error:", error.message);
    throw error;
  }
};

// Usage
const standardized = await standardizeAddress("123 main st accra ghana");
console.log("Standardized:", standardized.addressLine1);
```

## 🔍 Advanced Usage Patterns

### Batch Address Validation

Validate multiple addresses efficiently:

```javascript
const validateBatch = async (addresses) => {
  const results = [];

  for (const address of addresses) {
    try {
      const result = await validateAddress(address);
      results.push({ address, valid: true, data: result });
    } catch (error) {
      results.push({ address, valid: false, error: error.message });
    }
  }

  return results;
};

// Usage
const addresses = ["GA-123-4567", "GA-124-5678", "INVALID-CODE"];
const batchResults = await validateBatch(addresses);
```

### Address Autocomplete

Implement address autocomplete functionality:

```javascript
const autocompleteAddress = async (query, limit = 5) => {
  if (query.length < 2) return [];

  const addresses = await searchAddresses(query);
  return addresses.slice(0, limit).map((addr) => ({
    value: addr.digitalCode,
    label: addr.addressLine1,
    coordinates: { lat: addr.latitude, lng: addr.longitude },
  }));
};

// Usage
const suggestions = await autocompleteAddress("Accra");
suggestions.forEach((suggestion) => {
  console.log(`${suggestion.label} (${suggestion.value})`);
});
```

### Geographic Proximity Search

Find addresses within a certain radius:

```javascript
const findNearbyAddresses = async (centerLat, centerLng, radiusKm = 5) => {
  // First, get the center address
  const centerAddress = await lookupAddress(centerLat, centerLng);

  // Then search in the area
  const searchResults = await searchAddresses(centerAddress.addressLine2);

  // Filter by distance (simplified calculation)
  return searchResults.filter((address) => {
    const distance = calculateDistance(
      centerLat,
      centerLng,
      address.latitude,
      address.longitude
    );
    return distance <= radiusKm;
  });
};

const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};
```

## 📊 Error Handling

### Common Error Codes

| Code                  | Description                         | Solution                            |
| --------------------- | ----------------------------------- | ----------------------------------- |
| `INVALID_FORMAT`      | Digital address format is incorrect | Check format: XX-XXX-XXXX           |
| `ADDRESS_NOT_FOUND`   | Address doesn't exist in database   | Verify the address exists           |
| `INVALID_COORDINATES` | GPS coordinates are invalid         | Ensure coordinates are within Ghana |
| `SEARCH_TOO_SHORT`    | Search query is too short           | Use at least 2 characters           |

### Error Handling Example

```javascript
const handleAddressError = (error) => {
  switch (error.code) {
    case "INVALID_FORMAT":
      return "Please enter a valid digital address format (XX-XXX-XXXX)";
    case "ADDRESS_NOT_FOUND":
      return "Address not found. Please check and try again.";
    case "INVALID_COORDINATES":
      return "Coordinates are outside Ghana. Please check your input.";

    default:
      return "An error occurred. Please try again later.";
  }
};

// Usage
try {
  const result = await validateAddress("INVALID-CODE");
} catch (error) {
  const userMessage = handleAddressError(error);
  console.error(userMessage);
}
```

## 🔧 Integration Examples

### React Component Example

```jsx
import React, { useState, useEffect } from "react";

const AddressValidator = () => {
  const [digitalCode, setDigitalCode] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const validateAddress = async () => {
    if (!digitalCode) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://ghana-api.dev/v1/addresses/validate/${digitalCode}`
      );
      const data = await response.json();

      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.error.message);
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        type="text"
        value={digitalCode}
        onChange={(e) => setDigitalCode(e.target.value)}
        placeholder="Enter digital code (e.g., GA-123-4567)"
      />
      <button onClick={validateAddress} disabled={loading}>
        {loading ? "Validating..." : "Validate"}
      </button>

      {result && (
        <div>
          <h3>Result:</h3>
          <p>Valid: {result.isValid ? "Yes" : "No"}</p>
          {result.formattedAddress && <p>Address: {result.formattedAddress}</p>}
        </div>
      )}

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};
```

### Node.js Server Example

```javascript
const express = require("express");
const axios = require("axios");
const app = express();

app.use(express.json());

// Address validation endpoint
app.get("/validate/:digitalCode", async (req, res) => {
  try {
    const { digitalCode } = req.params;

    const response = await axios.get(
      `https://ghana-api.dev/v1/addresses/validate/${digitalCode}`
    );

    res.json(response.data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to validate address",
    });
  }
});

// Address search endpoint
app.get("/search", async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        error: "Search query must be at least 2 characters",
      });
    }

    const response = await axios.get(
      `https://ghana-api.dev/v1/addresses/search?q=${encodeURIComponent(q)}`
    );

    res.json(response.data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to search addresses",
    });
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
```

## 📈 Performance Tips

### 1. Caching

Cache validation results for frequently used addresses:

```javascript
const addressCache = new Map();

const validateWithCache = async (digitalCode) => {
  if (addressCache.has(digitalCode)) {
    return addressCache.get(digitalCode);
  }

  const result = await validateAddress(digitalCode);
  addressCache.set(digitalCode, result);

  return result;
};
```

### 2. Batch Processing

Process multiple addresses efficiently:

```javascript
const processBatch = async (addresses, batchSize = 10) => {
  const results = [];

  for (let i = 0; i < addresses.length; i += batchSize) {
    const batch = addresses.slice(i, i + batchSize);
    const batchPromises = batch.map((addr) => validateAddress(addr));
    const batchResults = await Promise.allSettled(batchPromises);

    results.push(...batchResults);
  }

  return results;
};
```

## 🔐 Security Considerations

### Input Validation

Always validate inputs before sending to the API:

```javascript
const validateDigitalCodeFormat = (code) => {
  const pattern = /^[A-Z]{2,3}-\d{3}-\d{4}$/;
  return pattern.test(code);
};

const sanitizeSearchQuery = (query) => {
  return query.trim().replace(/[<>]/g, "");
};
```

---

For more information, see the [API Overview](./overview) for complete documentation and examples.
