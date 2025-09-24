# Banking & ATM Locator API

Find banks, ATM locations, and banking services across Ghana with comprehensive search and location-based features.

## 🏦 Overview

The Banking & ATM Locator API provides developers with access to a comprehensive database of banking facilities across Ghana. Find banks and ATMs by location, name, services, or region with real-time data from multiple sources.

### Key Features

- **🔍 Smart Search** - Find banks by name, code, address, or services
- **📍 Location-Based** - Find nearest banking facilities with radius filtering
- **🏧 ATM Locator** - Dedicated ATM search with 24/7 availability info
- **🗺️ Regional Coverage** - Browse banks by region and city
- **⚡ Real-Time Data** - Integration with OpenStreetMap and static directories
- **📊 Rich Information** - Operating hours, services, contact details, and more

---

## 🚀 Quick Start

### Find Banks by Name

```bash
curl "https://api.ghana-api.dev/v1/banking/search?q=GCB&limit=10"
```

### Find Nearest Banks

```bash
curl "https://api.ghana-api.dev/v1/banking/nearby?lat=5.6037&lng=-0.187&radius=5"
```

### Get All ATMs

```bash
curl "https://api.ghana-api.dev/v1/banking/atms"
```

---

## 📋 Available Endpoints

### 1. Search Banks and ATMs

**`GET /v1/banking/search`**

Search for banking facilities using various criteria.

#### Query Parameters

| Parameter | Type   | Required | Description                                           |
| --------- | ------ | -------- | ----------------------------------------------------- |
| `q`       | string | No       | Search query for bank name or type                    |
| `lat`     | number | No       | Latitude for location-based search                    |
| `lng`     | number | No       | Longitude for location-based search                   |
| `radius`  | number | No       | Search radius in km (default: 5, max: 50)             |
| `type`    | string | No       | Filter by type: `bank`, `atm`, `both` (default: both) |
| `limit`   | number | No       | Number of results (default: 20, max: 100)             |

#### Response

```json
{
  "success": true,
  "data": [
    {
      "id": "gcb-head-office",
      "name": "GCB Bank Limited - Head Office",
      "type": "bank",
      "code": "GCB",
      "address": "Thorpe Road, Accra",
      "city": "Accra",
      "region": "Greater Accra",
      "latitude": 5.6037,
      "longitude": -0.187,
      "phone": "+233302664910",
      "email": "info@gcbbank.com.gh",
      "website": "https://www.gcbbank.com.gh",
      "operatingHours": "Mon-Fri: 8:00-17:00, Sat: 8:00-13:00",
      "services": ["ATM", "Cash Deposit", "Foreign Exchange", "Loans"],
      "distance": 0.1,
      "branchInfo": {
        "branchCode": "001",
        "isHeadOffice": true,
        "hasATM": true,
        "is24Hours": false
      }
    }
  ],
  "total": 1,
  "searchParams": {
    "query": "GCB",
    "type": "both",
    "limit": 20
  },
  "source": "OpenStreetMap + Static Directory",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### JavaScript Example

```javascript
const searchBanks = async (query, location) => {
  const params = new URLSearchParams();
  if (query) params.append("q", query);
  if (location) {
    params.append("lat", location.lat);
    params.append("lng", location.lng);
    params.append("radius", location.radius || 5);
  }

  const response = await fetch(
    `https://api.ghana-api.dev/v1/banking/search?${params}`
  );

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return await response.json();
};

// Usage
const banks = await searchBanks("GCB", {
  lat: 5.6037,
  lng: -0.187,
  radius: 10,
});
console.log(`Found ${banks.total} banking facilities`);
```

### 2. Find Nearest Banks and ATMs

**`GET /v1/banking/nearby`**

Find the nearest banking facilities to a specific location.

#### Query Parameters

| Parameter | Type   | Required | Description                               |
| --------- | ------ | -------- | ----------------------------------------- |
| `lat`     | number | Yes      | Latitude coordinate                       |
| `lng`     | number | Yes      | Longitude coordinate                      |
| `radius`  | number | No       | Search radius in km (default: 5, max: 50) |
| `limit`   | number | No       | Number of results (default: 10, max: 100) |

#### Example

```bash
curl "https://api.ghana-api.dev/v1/banking/nearby?lat=5.6037&lng=-0.187&radius=10&limit=5"
```

### 3. Get All Banks

**`GET /v1/banking/banks`**

Retrieve all bank branches (excluding ATM-only locations).

#### Example

```bash
curl "https://api.ghana-api.dev/v1/banking/banks"
```

### 4. Get All ATMs

**`GET /v1/banking/atms`**

Retrieve all ATM locations.

#### Example

```bash
curl "https://api.ghana-api.dev/v1/banking/atms"
```

### 5. Get Banks by Region

**`GET /v1/banking/region/{region}`**

Get all banking facilities in a specific region.

#### Path Parameters

| Parameter | Type   | Required | Description                                    |
| --------- | ------ | -------- | ---------------------------------------------- |
| `region`  | string | Yes      | Region name (e.g., "Greater Accra", "Ashanti") |

#### Example

```bash
curl "https://api.ghana-api.dev/v1/banking/region/Greater%20Accra"
```

### 6. Get Banks by City

**`GET /v1/banking/city/{city}`**

Get all banking facilities in a specific city.

#### Path Parameters

| Parameter | Type   | Required | Description                         |
| --------- | ------ | -------- | ----------------------------------- |
| `city`    | string | Yes      | City name (e.g., "Accra", "Kumasi") |

#### Example

```bash
curl "https://api.ghana-api.dev/v1/banking/city/Accra"
```

---

## 🏗️ Data Model

### Bank Object

```typescript
interface Bank {
  id: string; // Unique identifier
  name: string; // Bank name
  type: "bank" | "atm"; // Facility type
  code?: string; // Bank code (e.g., "GCB")
  address: string; // Physical address
  city: string; // City location
  region: string; // Ghana region
  latitude: number; // GPS latitude
  longitude: number; // GPS longitude
  phone?: string; // Contact phone
  email?: string; // Contact email
  website?: string; // Bank website
  operatingHours?: string; // Business hours
  services?: string[]; // Available services
  distance?: number; // Distance from search point (km)
  branchInfo?: {
    branchCode?: string; // Branch identifier
    isHeadOffice?: boolean; // Head office flag
    hasATM?: boolean; // ATM availability
    is24Hours?: boolean; // 24-hour service
  };
}
```

### Available Services

Common services you might find in the `services` array:

- `ATM` - ATM services available
- `Cash Deposit` - Cash deposit services
- `Foreign Exchange` - Currency exchange
- `Loans` - Loan services
- `Mobile Banking` - Mobile banking support
- `Western Union` - Money transfer services
- `Safe Deposit Box` - Safe deposit services
- `Investment Services` - Investment and wealth management
- `Business Banking` - Commercial banking services

---

## 🗺️ Coverage

### Supported Regions

The API covers all 16 regions of Ghana:

- Greater Accra Region
- Ashanti Region
- Central Region
- Eastern Region
- Northern Region
- Upper East Region
- Upper West Region
- Western Region
- Western North Region
- Volta Region
- Oti Region
- Bono Region
- Bono East Region
- Ahafo Region
- Savannah Region
- North East Region

### Major Banks Covered

- GCB Bank Limited
- Ecobank Ghana
- Stanbic Bank Ghana
- Absa Bank Ghana
- FirstBank Ghana
- Standard Chartered Bank Ghana
- Zenith Bank Ghana
- Fidelity Bank Ghana
- CAL Bank
- Societe Generale Ghana
- And many more...

---

## 🔧 Integration Examples

### React Component

```jsx
import React, { useState } from "react";

const BankLocator = () => {
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");

  const searchBanks = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://api.ghana-api.dev/v1/banking/search?q=${encodeURIComponent(
          query
        )}&limit=10`
      );
      const data = await response.json();
      setBanks(data.data);
    } catch (error) {
      console.error("Error searching banks:", error);
    } finally {
      setLoading(false);
    }
  };

  const findNearbyBanks = async () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      setLoading(true);

      try {
        const response = await fetch(
          `https://api.ghana-api.dev/v1/banking/nearby?lat=${latitude}&lng=${longitude}&radius=5&limit=10`
        );
        const data = await response.json();
        setBanks(data);
      } catch (error) {
        console.error("Error finding nearby banks:", error);
      } finally {
        setLoading(false);
      }
    });
  };

  return (
    <div>
      <div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for banks..."
        />
        <button onClick={searchBanks} disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </button>
        <button onClick={findNearbyBanks} disabled={loading}>
          Find Nearby
        </button>
      </div>

      <div>
        {banks.map((bank) => (
          <div
            key={bank.id}
            style={{
              border: "1px solid #ddd",
              margin: "10px",
              padding: "10px",
            }}>
            <h3>{bank.name}</h3>
            <p>
              <strong>Type:</strong> {bank.type.toUpperCase()}
            </p>
            <p>
              <strong>Address:</strong> {bank.address}
            </p>
            <p>
              <strong>Region:</strong> {bank.region}
            </p>
            {bank.phone && (
              <p>
                <strong>Phone:</strong> {bank.phone}
              </p>
            )}
            {bank.distance && (
              <p>
                <strong>Distance:</strong> {bank.distance.toFixed(2)} km
              </p>
            )}
            {bank.services && (
              <p>
                <strong>Services:</strong> {bank.services.join(", ")}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BankLocator;
```

### Python Example

```python
import requests
from typing import List, Optional, Dict, Any

class GhanaBankingAPI:
    def __init__(self, base_url: str = "https://api.ghana-api.dev/v1"):
        self.base_url = base_url

    def search_banks(
        self,
        query: Optional[str] = None,
        lat: Optional[float] = None,
        lng: Optional[float] = None,
        radius: int = 5,
        facility_type: str = "both",
        limit: int = 20
    ) -> Dict[str, Any]:
        """Search for banks and ATMs"""
        params = {
            "radius": radius,
            "type": facility_type,
            "limit": limit
        }

        if query:
            params["q"] = query
        if lat is not None and lng is not None:
            params["lat"] = lat
            params["lng"] = lng

        response = requests.get(f"{self.base_url}/banking/search", params=params)
        response.raise_for_status()
        return response.json()

    def find_nearest_banks(
        self,
        lat: float,
        lng: float,
        radius: int = 5,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Find nearest banks to a location"""
        params = {
            "lat": lat,
            "lng": lng,
            "radius": radius,
            "limit": limit
        }

        response = requests.get(f"{self.base_url}/banking/nearby", params=params)
        response.raise_for_status()
        return response.json()

    def get_banks_by_region(self, region: str) -> List[Dict[str, Any]]:
        """Get all banks in a specific region"""
        response = requests.get(f"{self.base_url}/banking/region/{region}")
        response.raise_for_status()
        return response.json()

# Usage
api = GhanaBankingAPI()

# Search for GCB banks
gcb_banks = api.search_banks(query="GCB", limit=10)
print(f"Found {gcb_banks['total']} GCB branches")

# Find nearest banks to Accra center
nearest = api.find_nearest_banks(lat=5.6037, lng=-0.187, radius=10)
print(f"Found {len(nearest)} nearby banks")

# Get all banks in Greater Accra
accra_banks = api.get_banks_by_region("Greater Accra")
print(f"Found {len(accra_banks)} banks in Greater Accra")
```

---

## 🚨 Error Handling

### Common Error Responses

#### 400 - Bad Request

```json
{
  "statusCode": 400,
  "message": "Both latitude and longitude are required for location-based search",
  "error": "Bad Request"
}
```

#### 400 - Invalid Coordinates

```json
{
  "statusCode": 400,
  "message": "Coordinates appear to be outside Ghana. Please verify your location.",
  "error": "Bad Request"
}
```

#### 500 - Internal Server Error

```json
{
  "statusCode": 500,
  "message": "Failed to search banking facilities",
  "error": "Internal Server Error"
}
```

### Best Practices

1. **Validate Coordinates**: Ensure latitude and longitude are within Ghana's bounds
2. **Handle Empty Results**: Always check the `total` field for result count
3. **Implement Retry Logic**: Add exponential backoff for failed requests
4. **Cache Responses**: Banking data doesn't change frequently, consider caching
5. **Use Appropriate Limits**: Don't request more data than you need

---

## 📊 Rate Limits & Performance

- **Rate Limit**: 1000 requests per hour per IP
- **Response Time**: Typically under 200ms
- **Data Freshness**: Updated every 24 hours
- **Caching**: Responses are cached for optimal performance

---

## 🛠️ Data Sources

The Banking & ATM Locator API aggregates data from multiple reliable sources:

1. **OpenStreetMap**: Real-time community-maintained data
2. **Static Directory**: Curated list of major Ghanaian banks
3. **Bank Websites**: Official bank branch information (where available)

Data is automatically deduplicated and validated to ensure accuracy and consistency.

---

## 📈 Coming Soon

- **Real-time ATM Status**: Cash availability and service status
- **Branch Services Filter**: Search by specific services (loans, forex, etc.)
- **Operating Hours Validation**: Real-time open/closed status
- **Bank Reviews & Ratings**: Community feedback and ratings
- **Mobile Money Integration**: Mobile money agent locations
- **Historical Data**: Banking facility changes over time
