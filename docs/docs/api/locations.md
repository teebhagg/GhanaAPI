# Location Data API

The Location Data API provides comprehensive information about Ghana's administrative regions, districts, constituencies, and other geographic divisions.

## 🏛️ Overview

The API provides:

- **Regional data** for all 16 administrative regions of Ghana
- **District information** including metropolitan, municipal, and district assemblies
- **Administrative hierarchy** showing relationships between regions and districts
- **Geographic data** for administrative boundaries and centers

## 🔗 Base Endpoint

```
https://ghana-api.dev/v1/locations
```

## 📋 Available Endpoints

### 1. Get All Regions

Retrieve information about all administrative regions in Ghana.

**Endpoint:** `GET /locations/regions`

#### Example Request

```bash
curl -X GET "https://ghana-api.dev/v1/locations/regions" \
  -H "Accept: application/json"
```

#### Example Response

```json
{
  "success": true,
  "data": [
    {
      "code": "AR",
      "label": "Ahafo Region"
    },
    {
      "code": "ASR",
      "label": "Ashanti Region"
    },
    {
      "code": "BR",
      "label": "Bono Region"
    },
    {
      "code": "BER",
      "label": "Bono East Region"
    },
    {
      "code": "CR",
      "label": "Central Region"
    },
    {
      "code": "ER",
      "label": "Eastern Region"
    },
    {
      "code": "GAR",
      "label": "Greater Accra Region"
    },
    {
      "code": "NER",
      "label": "North East Region"
    },
    {
      "code": "NR",
      "label": "Northern Region"
    },
    {
      "code": "OTR",
      "label": "Oti Region"
    },
    {
      "code": "SR",
      "label": "Savannah Region"
    },
    {
      "code": "UER",
      "label": "Upper East Region"
    },
    {
      "code": "UWR",
      "label": "Upper West Region"
    },
    {
      "code": "VR",
      "label": "Volta Region"
    },
    {
      "code": "WR",
      "label": "Western Region"
    },
    {
      "code": "WNR",
      "label": "Western North Region"
    }
  ],
  "message": "Regions retrieved successfully",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### JavaScript Example

```javascript
const getRegions = async () => {
  try {
    const response = await fetch("https://ghana-api.dev/v1/locations/regions");
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error.message);
    }

    return result.data;
  } catch (error) {
    console.error("Failed to get regions:", error.message);
    throw error;
  }
};

// Usage
const regions = await getRegions();
regions.forEach((region) => {
  console.log(`${region.code}: ${region.label}`);
});
```

### 2. Get Districts by Region

Retrieve all districts within a specific region.

**Endpoint:** `GET /locations/districts/{regionId}`

#### Path Parameters

| Parameter  | Type   | Required | Description                     |
| ---------- | ------ | -------- | ------------------------------- |
| `regionId` | string | Yes      | Region code (e.g., "AR", "ASR") |

#### Example Request

```bash
curl -X GET "https://ghana-api.dev/v1/locations/districts/AR" \
  -H "Accept: application/json"
```

#### Example Response

```json
{
  "success": true,
  "data": [
    {
      "code": "ASN",
      "label": "Asunafo North",
      "category": "Municipal",
      "capital": "Goaso"
    },
    {
      "code": "ASS",
      "label": "Asunafo South",
      "category": "District",
      "capital": "Kukuom"
    },
    {
      "code": "ATN",
      "label": "Asutifi North",
      "category": "District",
      "capital": "Kenyasi"
    },
    {
      "code": "ATS",
      "label": "Asutifi South",
      "category": "District",
      "capital": "Hwidiem"
    },
    {
      "code": "TAN",
      "label": "Tano North",
      "category": "Municipal",
      "capital": "Duayaw Nkwanta"
    },
    {
      "code": "TAS",
      "label": "Tano South",
      "category": "Municipal",
      "capital": "Bechem"
    }
  ],
  "message": "Districts retrieved successfully",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### JavaScript Example

```javascript
const getDistricts = async (regionId) => {
  try {
    const response = await fetch(
      `https://ghana-api.dev/v1/locations/districts/${regionId}`
    );
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error.message);
    }

    return result.data;
  } catch (error) {
    console.error("Failed to get districts:", error.message);
    throw error;
  }
};

// Usage
const districts = await getDistricts("AR");
districts.forEach((district) => {
  console.log(
    `${district.label} (${district.category}) - Capital: ${district.capital}`
  );
});
```

## 🔍 Advanced Usage Patterns

### Complete Administrative Hierarchy

Get the complete hierarchy of regions and their districts:

```javascript
const getCompleteHierarchy = async () => {
  try {
    // Get all regions
    const regions = await getRegions();

    // Get districts for each region
    const hierarchy = await Promise.all(
      regions.map(async (region) => {
        const districts = await getDistricts(region.code);
        return {
          ...region,
          districts,
        };
      })
    );

    return hierarchy;
  } catch (error) {
    console.error("Failed to get hierarchy:", error.message);
    throw error;
  }
};

// Usage
const hierarchy = await getCompleteHierarchy();
hierarchy.forEach((region) => {
  console.log(`${region.label}:`);
  region.districts.forEach((district) => {
    console.log(`  - ${district.label} (${district.category})`);
  });
});
```

### Region Search

Search for regions by name or code:

```javascript
const searchRegions = async (query) => {
  try {
    const regions = await getRegions();
    const searchTerm = query.toLowerCase();

    return regions.filter(
      (region) =>
        region.label.toLowerCase().includes(searchTerm) ||
        region.code.toLowerCase().includes(searchTerm)
    );
  } catch (error) {
    console.error("Failed to search regions:", error.message);
    throw error;
  }
};

// Usage
const searchResults = await searchRegions("Accra");
console.log("Search results:", searchResults);
```

### District Statistics

Get statistics about districts in a region:

```javascript
const getDistrictStatistics = async (regionId) => {
  try {
    const districts = await getDistricts(regionId);

    const stats = {
      totalDistricts: districts.length,
      categories: {},
      capitals: districts.map((d) => d.capital),
    };

    // Count by category
    districts.forEach((district) => {
      const category = district.category;
      stats.categories[category] = (stats.categories[category] || 0) + 1;
    });

    return stats;
  } catch (error) {
    console.error("Failed to get district statistics:", error.message);
    throw error;
  }
};

// Usage
const stats = await getDistrictStatistics("AR");
console.log("Ahafo Region Statistics:", stats);
```

### Geographic Data Integration

Combine location data with geographic coordinates:

```javascript
const getLocationWithCoordinates = async (regionId) => {
  try {
    const districts = await getDistricts(regionId);

    // Add geographic data (this would come from a separate API or database)
    const districtsWithGeo = districts.map((district) => ({
      ...district,
      coordinates: {
        // These would be actual coordinates from a geographic database
        lat: 0, // Placeholder
        lng: 0, // Placeholder
      },
    }));

    return districtsWithGeo;
  } catch (error) {
    console.error("Failed to get location with coordinates:", error.message);
    throw error;
  }
};
```

## 📊 Error Handling

### Common Error Codes

| Code                  | Description                   | Solution                      |
| --------------------- | ----------------------------- | ----------------------------- |
| `REGION_NOT_FOUND`    | Region code does not exist    | Check valid region codes      |
| `INVALID_REGION_CODE` | Region code format is invalid | Use valid 2-3 character codes |
| `NO_DISTRICTS_FOUND`  | No districts found for region | Verify region has districts   |

### Error Handling Example

```javascript
const handleLocationError = (error) => {
  switch (error.code) {
    case "REGION_NOT_FOUND":
      return "Region not found. Please check the region code.";
    case "INVALID_REGION_CODE":
      return "Invalid region code format. Use 2-3 character codes.";
    case "NO_DISTRICTS_FOUND":
      return "No districts found for this region.";

    default:
      return "An error occurred. Please try again later.";
  }
};

// Usage
try {
  const districts = await getDistricts("INVALID");
} catch (error) {
  const userMessage = handleLocationError(error);
  console.error(userMessage);
}
```

## 🔧 Integration Examples

### React Component for Location Selection

```jsx
import React, { useState, useEffect } from "react";

const LocationSelector = () => {
  const [regions, setRegions] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState("");
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRegions = async () => {
      try {
        setLoading(true);
        const data = await getRegions();
        setRegions(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRegions();
  }, []);

  const handleRegionChange = async (regionCode) => {
    setSelectedRegion(regionCode);

    if (regionCode) {
      try {
        setLoading(true);
        const data = await getDistricts(regionCode);
        setDistricts(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    } else {
      setDistricts([]);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h3>Select Location</h3>

      <div>
        <label>Region:</label>
        <select
          value={selectedRegion}
          onChange={(e) => handleRegionChange(e.target.value)}>
          <option value="">Select a region</option>
          {regions.map((region) => (
            <option key={region.code} value={region.code}>
              {region.label}
            </option>
          ))}
        </select>
      </div>

      {selectedRegion && (
        <div>
          <label>District:</label>
          <select>
            <option value="">Select a district</option>
            {districts.map((district) => (
              <option key={district.code} value={district.code}>
                {district.label} ({district.category})
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};
```

### Node.js Location Service

```javascript
const express = require("express");
const axios = require("axios");
const app = express();

app.use(express.json());

// Get all regions
app.get("/regions", async (req, res) => {
  try {
    const response = await axios.get(
      "https://ghana-api.dev/v1/locations/regions"
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to get regions",
    });
  }
});

// Get districts by region
app.get("/districts/:regionId", async (req, res) => {
  try {
    const { regionId } = req.params;

    if (!regionId || regionId.length < 2) {
      return res.status(400).json({
        success: false,
        error: "Invalid region ID",
      });
    }

    const response = await axios.get(
      `https://ghana-api.dev/v1/locations/districts/${regionId}`
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to get districts",
    });
  }
});

// Get complete hierarchy
app.get("/hierarchy", async (req, res) => {
  try {
    const regionsResponse = await axios.get(
      "https://ghana-api.dev/v1/locations/regions"
    );

    const regions = regionsResponse.data.data;
    const hierarchy = await Promise.all(
      regions.map(async (region) => {
        const districtsResponse = await axios.get(
          `https://ghana-api.dev/v1/locations/districts/${region.code}`
        );
        return {
          ...region,
          districts: districtsResponse.data.data,
        };
      })
    );

    res.json({
      success: true,
      data: hierarchy,
      message: "Hierarchy retrieved successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to get hierarchy",
    });
  }
});

app.listen(3000, () => {
  console.log("Location service running on port 3000");
});
```

### Python Location Data Client

```python
import requests
from typing import List, Dict, Optional

class GhanaLocationAPI:
    def __init__(self, base_url: str = "https://ghana-api.dev/v1"):
        self.base_url = base_url

    def get_regions(self) -> List[Dict]:
        """Get all administrative regions."""
        try:
            response = requests.get(f"{self.base_url}/locations/regions")
            response.raise_for_status()
            data = response.json()

            if not data.get('success'):
                raise Exception(data.get('error', {}).get('message', 'Unknown error'))

            return data['data']
        except requests.RequestException as e:
            raise Exception(f"Failed to get regions: {str(e)}")

    def get_districts(self, region_id: str) -> List[Dict]:
        """Get districts for a specific region."""
        try:
            response = requests.get(f"{self.base_url}/locations/districts/{region_id}")
            response.raise_for_status()
            data = response.json()

            if not data.get('success'):
                raise Exception(data.get('error', {}).get('message', 'Unknown error'))

            return data['data']
        except requests.RequestException as e:
            raise Exception(f"Failed to get districts: {str(e)}")

    def get_complete_hierarchy(self) -> List[Dict]:
        """Get complete hierarchy of regions and districts."""
        try:
            regions = self.get_regions()
            hierarchy = []

            for region in regions:
                districts = self.get_districts(region['code'])
                hierarchy.append({
                    **region,
                    'districts': districts
                })

            return hierarchy
        except Exception as e:
            raise Exception(f"Failed to get hierarchy: {str(e)}")

    def search_regions(self, query: str) -> List[Dict]:
        """Search regions by name or code."""
        try:
            regions = self.get_regions()
            query_lower = query.lower()

            return [
                region for region in regions
                if query_lower in region['label'].lower() or
                   query_lower in region['code'].lower()
            ]
        except Exception as e:
            raise Exception(f"Failed to search regions: {str(e)}")

# Usage
api = GhanaLocationAPI()

# Get all regions
regions = api.get_regions()
for region in regions:
    print(f"{region['code']}: {region['label']}")

# Get districts for a region
districts = api.get_districts('AR')
for district in districts:
    print(f"{district['label']} ({district['category']})")

# Get complete hierarchy
hierarchy = api.get_complete_hierarchy()
for region in hierarchy:
    print(f"{region['label']}: {len(region['districts'])} districts")
```

## 📈 Performance Tips

### 1. Caching Location Data

Cache location data since it doesn't change frequently:

```javascript
class LocationCache {
  constructor(ttl = 3600000) {
    // 1 hour
    this.cache = new Map();
    this.ttl = ttl;
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }
}

const locationCache = new LocationCache();

const getCachedRegions = async () => {
  const cached = locationCache.get("regions");
  if (cached) return cached;

  const regions = await getRegions();
  locationCache.set("regions", regions);

  return regions;
};

const getCachedDistricts = async (regionId) => {
  const key = `districts_${regionId}`;
  const cached = locationCache.get(key);
  if (cached) return cached;

  const districts = await getDistricts(regionId);
  locationCache.set(key, districts);

  return districts;
};
```

### 2. Batch Loading

Load multiple regions' districts efficiently:

```javascript
const loadMultipleRegions = async (regionIds) => {
  const promises = regionIds.map(async (regionId) => {
    try {
      const districts = await getDistricts(regionId);
      return { regionId, districts, success: true };
    } catch (error) {
      return { regionId, error: error.message, success: false };
    }
  });

  return Promise.all(promises);
};

// Usage
const results = await loadMultipleRegions(["AR", "ASR", "GAR"]);
results.forEach((result) => {
  if (result.success) {
    console.log(`${result.regionId}: ${result.districts.length} districts`);
  } else {
    console.error(`${result.regionId}: ${result.error}`);
  }
});
```

### 3. Preloading Data

Preload location data for better user experience:

```javascript
class LocationDataManager {
  constructor() {
    this.regions = null;
    this.districtsCache = new Map();
    this.loading = false;
  }

  async preloadData() {
    if (this.loading) return;

    this.loading = true;

    try {
      // Load all regions
      this.regions = await getRegions();

      // Preload districts for first few regions
      const initialRegions = this.regions.slice(0, 5);
      await this.preloadDistricts(initialRegions.map((r) => r.code));
    } catch (error) {
      console.error("Failed to preload data:", error);
    } finally {
      this.loading = false;
    }
  }

  async preloadDistricts(regionIds) {
    const promises = regionIds.map(async (regionId) => {
      try {
        const districts = await getDistricts(regionId);
        this.districtsCache.set(regionId, districts);
      } catch (error) {
        console.error(`Failed to preload districts for ${regionId}:`, error);
      }
    });

    await Promise.all(promises);
  }

  getRegions() {
    return this.regions || [];
  }

  async getDistricts(regionId) {
    if (this.districtsCache.has(regionId)) {
      return this.districtsCache.get(regionId);
    }

    const districts = await getDistricts(regionId);
    this.districtsCache.set(regionId, districts);
    return districts;
  }
}

// Usage
const locationManager = new LocationDataManager();
await locationManager.preloadData();
```

## 🔐 Security Considerations

### Input Validation

Validate region codes before making requests:

```javascript
const validateRegionCode = (code) => {
  const validCodes = [
    "AR",
    "ASR",
    "BR",
    "BER",
    "CR",
    "ER",
    "GAR",
    "NER",
    "NR",
    "OTR",
    "SR",
    "UER",
    "UWR",
    "VR",
    "WR",
    "WNR",
  ];
  return validCodes.includes(code.toUpperCase());
};

// Usage
if (!validateRegionCode(regionId)) {
  throw new Error("Invalid region code");
}
```

---

For more information, see the [API Overview](./overview) for complete documentation and examples.
