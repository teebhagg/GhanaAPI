# Transport & Logistics API

The Transport & Logistics API provides comprehensive transportation services for Ghana, including route planning, public transport information, travel cost estimation, and fuel price data.

## 🚗 Overview

The API provides:

- **Transport Stops** - Bus stops, stations, and public transport hubs
- **Route Planning** - Optimal routing between locations with multiple transport modes
- **Route Directions** - Detailed turn-by-turn navigation instructions
- **Travel Cost Estimation** - Fuel costs and fare calculations for different transport modes
- **Fuel Prices** - Current petrol, diesel, and LPG prices in Ghana
- **Nearby Services** - Find transport stops within a specified radius

## 🔗 Base Endpoint

```
https://ghana-api.dev/v1/transport
```

## 📋 Available Endpoints

### 1. Get Transport Stops

Retrieve transport stops (bus stops, stations, etc.) for a specific city.

**Endpoint:** `GET /transport/stops`

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `city` | string | No | `accra` | City to get stops for (`accra`, `kumasi`, `tamale`, `takoradi`) |
| `type` | string | No | - | Filter by stop type (`bus_stop`, `platform`, `station`) |

#### Example Request

```bash
curl -X GET "https://ghana-api.dev/v1/transport/stops?city=accra&type=bus_stop" \
  -H "Accept: application/json"
```

#### Example Response

```json
{
  "success": true,
  "data": [
    {
      "id": "stop_001",
      "name": "Kwame Nkrumah Circle",
      "coordinates": [5.6037, -0.187],
      "type": "bus_stop",
      "routes": ["route_001", "route_002"]
    },
    {
      "id": "stop_002",
      "name": "Tema Station",
      "coordinates": [5.6308, -0.1615],
      "type": "station",
      "routes": ["route_003"]
    }
  ],
  "count": 2,
  "city": "accra",
  "type": "bus_stop"
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Operation success status |
| `data` | array | Array of transport stop objects |
| `count` | number | Number of stops returned |
| `city` | string | City queried |
| `type` | string | Stop type filter applied (if any) |

#### Error Responses

- **400 Bad Request** - Invalid query parameters
- **503 Service Unavailable** - Transport service is unavailable

---

### 2. Find Nearby Transport Stops

Find transport stops within a specified radius of given coordinates.

**Endpoint:** `GET /transport/nearby-stops`

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `lat` | number | Yes | - | Latitude coordinate |
| `lng` | number | Yes | - | Longitude coordinate |
| `radius` | number | No | `1000` | Search radius in meters |
| `type` | string | No | - | Filter by stop type |

#### Example Request

```bash
curl -X GET "https://ghana-api.dev/v1/transport/nearby-stops?lat=5.6037&lng=-0.187&radius=500" \
  -H "Accept: application/json"
```

#### Example Response

```json
{
  "success": true,
  "data": [
    {
      "id": "stop_001",
      "name": "Kwame Nkrumah Circle",
      "coordinates": [5.6037, -0.187],
      "type": "bus_stop",
      "routes": ["route_001", "route_002"],
      "distance": 0
    },
    {
      "id": "stop_003",
      "name": "Odawna Market",
      "coordinates": [5.6045, -0.1901],
      "type": "bus_stop",
      "routes": ["route_004"],
      "distance": 285.5
    }
  ],
  "count": 2,
  "center": [5.6037, -0.187],
  "radius": 500
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Operation success status |
| `data` | array | Array of nearby stops with distance |
| `count` | number | Number of stops found |
| `center` | array | Query coordinates [lat, lng] |
| `radius` | number | Search radius in meters |
| `distance` | number | Distance from query point in meters |

#### Error Responses

- **400 Bad Request** - Invalid coordinates or outside Ghana boundaries
- **503 Service Unavailable** - Transport service is unavailable

---

### 3. Calculate Route

Calculate optimal route, distance, and duration between two points.

**Endpoint:** `GET /transport/route-calculation`

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `start_lat` | number | Yes | - | Starting latitude |
| `start_lng` | number | Yes | - | Starting longitude |
| `end_lat` | number | Yes | - | Ending latitude |
| `end_lng` | number | Yes | - | Ending longitude |
| `mode` | string | No | `driving` | Transport mode (`driving`, `walking`, `cycling`, `publicTransport`) |

#### Example Request

```bash
curl -X GET "https://ghana-api.dev/v1/transport/route-calculation?start_lat=5.6037&start_lng=-0.187&end_lat=6.6885&end_lng=-1.6244&mode=driving" \
  -H "Accept: application/json"
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "distance": 247.8,
    "duration": 10800,
    "coordinates": [
      [5.6037, -0.187],
      [5.6125, -0.215],
      [6.6885, -1.6244]
    ],
    "instructions": [
      "Head north on Liberation Road",
      "Turn right onto George Walker Bush Highway",
      "Continue for 247 km to Kumasi"
    ],
    "cost": 85.50
  },
  "start": [5.6037, -0.187],
  "end": [6.6885, -1.6244],
  "mode": "driving"
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Operation success status |
| `data` | object | Route calculation results |
| `distance` | number | Route distance in kilometers |
| `duration` | number | Estimated travel time in seconds |
| `coordinates` | array | Route coordinates array |
| `instructions` | array | Turn-by-turn directions |
| `cost` | number | Estimated travel cost (if applicable) |
| `start` | array | Starting coordinates [lat, lng] |
| `end` | array | Ending coordinates [lat, lng] |
| `mode` | string | Transport mode used |

#### Error Responses

- **400 Bad Request** - Invalid coordinates or outside Ghana boundaries
- **503 Service Unavailable** - Routing service is unavailable

---

### 4. Get Route Directions

Get detailed route directions between two points with multiple input options.

**Endpoint:** `GET /transport/directions`

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `start_lat` | number | Conditional | - | Starting latitude (required if `start_name` not provided) |
| `start_lng` | number | Conditional | - | Starting longitude (required if `start_name` not provided) |
| `start_name` | string | Conditional | - | Starting place name (required if coordinates not provided) |
| `end_lat` | number | Conditional | - | Destination latitude (required if `end_name` not provided) |
| `end_lng` | number | Conditional | - | Destination longitude (required if coordinates not provided) |
| `end_name` | string | Conditional | - | Destination place name (required if coordinates not provided) |
| `profile` | string | No | `driving-car` | Transport profile (`driving-car`, `driving-hgv`, `cycling-regular`, `foot-walking`, `wheelchair`) |
| `instructions` | boolean | No | `true` | Include turn-by-turn instructions |
| `geometry` | boolean | No | `true` | Include route geometry/polyline |

#### Example Request with Coordinates

```bash
curl -X GET "https://ghana-api.dev/v1/transport/directions?start_lat=5.6037&start_lng=-0.187&end_lat=6.6885&end_lng=-1.6244&profile=driving-car" \
  -H "Accept: application/json"
```

#### Example Request with Place Names

```bash
curl -X GET "https://ghana-api.dev/v1/transport/directions?start_name=Kwame%20Nkrumah%20Circle,%20Accra&end_name=Kumasi%20Central%20Market&profile=driving-car" \
  -H "Accept: application/json"
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "route": {
      "distance": 247800,
      "duration": 10800,
      "geometry": "encoded_polyline_string",
      "instructions": [
        {
          "text": "Head north on Liberation Road",
          "distance": 1200,
          "duration": 180,
          "maneuver": {
            "type": "depart",
            "location": [5.6037, -0.187]
          }
        },
        {
          "text": "Turn right onto George Walker Bush Highway",
          "distance": 246600,
          "duration": 10620,
          "maneuver": {
            "type": "turn",
            "modifier": "right",
            "location": [5.6125, -0.215]
          }
        }
      ]
    },
    "waypoints": [
      {
        "name": "Kwame Nkrumah Circle",
        "location": [5.6037, -0.187]
      },
      {
        "name": "Kumasi Central Market",
        "location": [6.6885, -1.6244]
      }
    ],
    "metadata": {
      "provider": "openrouteservice",
      "profile": "driving-car",
      "timestamp": "2024-01-15T10:30:00Z"
    }
  }
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Operation success status |
| `data` | object | Route directions data |
| `route` | object | Route information |
| `distance` | number | Total distance in meters |
| `duration` | number | Total duration in seconds |
| `geometry` | string | Encoded polyline for route visualization |
| `instructions` | array | Turn-by-turn navigation instructions |
| `waypoints` | array | Start and end point information |
| `metadata` | object | Provider and request information |

#### Error Responses

- **400 Bad Request** - Invalid input parameters or coordinates outside Ghana
- **404 Not Found** - Could not find coordinates for provided place names
- **503 Service Unavailable** - All routing services are unavailable

---

### 5. Estimate Travel Cost

Estimate travel cost based on distance, fuel prices, and transport mode.

**Endpoint:** `GET /transport/travel-cost`

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `distance` | number | Yes | - | Distance in kilometers |
| `mode` | string | No | `car` | Transport mode (`car`, `taxi`, `trotro`, `bus`) |
| `fuel_efficiency` | number | No | `12` | Fuel efficiency in km/l (for car mode) |

#### Example Request

```bash
curl -X GET "https://ghana-api.dev/v1/transport/travel-cost?distance=247.8&mode=car&fuel_efficiency=10" \
  -H "Accept: application/json"
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "distance": 247.8,
    "mode": "car",
    "fuelCost": 161.07,
    "currency": "GHS",
    "breakdown": {
      "fuelNeeded": "24.78L",
      "fuelPrice": "6.5 GHS/L",
      "fuelEfficiency": "10 km/L"
    }
  }
}
```

#### Transport Mode Calculations

**Car Mode:**
- Calculates fuel consumption based on distance and efficiency
- Uses real-time fuel prices from major Ghanaian companies (Shell, Goil, Total, Star Oil)

**Taxi Mode:**
- Base fare: 5 GHS
- Per kilometer rate: 2.5 GHS/km

**Trotro Mode:**
- Rate: 1.5 GHS/km (estimated)

**Bus Mode:**
- Rate: 1.0 GHS/km (estimated)

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Operation success status |
| `data` | object | Cost estimation data |
| `distance` | number | Distance in kilometers |
| `mode` | string | Transport mode used |
| `fuelCost` | number | Fuel cost (for car mode) |
| `estimatedFare` | number | Estimated fare (for public transport) |
| `currency` | string | Currency code (GHS) |
| `breakdown` | object | Cost calculation breakdown |

#### Error Responses

- **400 Bad Request** - Invalid distance or unsupported transport mode
- **503 Service Unavailable** - Pricing service is unavailable

---

### 6. Get Fuel Prices

Retrieve current petrol and diesel prices in Ghana, calculated from major fuel companies.

**Endpoint:** `GET /transport/fuel-prices`

#### Fuel Price Methodology

The API scrapes real-time fuel prices from CediRates.com and calculates averages from Ghana's major fuel companies:
- **Shell** - International oil company
- **Goil** - Ghana Oil Company (state-owned)
- **Total** - TotalEnergies (international)
- **Star Oil** - Star Oil Ghana

**Averaging Formula:**
- Petrol: `(Shell + Goil + Total + Star Oil) ÷ 4`
- Diesel: `(Shell + Goil + Total + Star Oil) ÷ 4`

**Caching Strategy:**
- Fuel prices are cached daily and expire at 11:59 PM each day
- This ensures prices remain consistent throughout the day while updating daily
- Cache automatically refreshes at the end of each day

#### Example Request

```bash
curl -X GET "https://ghana-api.dev/v1/transport/fuel-prices" \
  -H "Accept: application/json"
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "petrol": 12.86,
    "diesel": 13.99,
    "currency": "GHS",
    "lastUpdated": "2024-01-15T08:00:00Z",
    "source": "CediRates.com (Shell, Goil, Total, Star Oil Average)"
  }
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Operation success status |
| `data` | object | Fuel price data |
| `petrol` | number | Average petrol price per liter |
| `diesel` | number | Average diesel price per liter |
| `currency` | string | Currency code (GHS) |
| `lastUpdated` | string | Last update timestamp |
| `source` | string | Data source and averaging methodology |

#### Error Responses

- **503 Service Unavailable** - Fuel price service is unavailable

---

## 🗺️ Geographic Coverage

The Transport & Logistics API covers transportation data for Ghana's major cities:

- **Accra** - Capital city with extensive transport network
- **Kumasi** - Ashanti region hub with major transport routes
- **Tamale** - Northern region transport center
- **Takoradi** - Western region port city

### Coordinate Boundaries

All coordinates must be within Ghana's boundaries:
- **Latitude:** 4.5°N to 11.5°N
- **Longitude:** 3.5°W to 1.5°E

Requests with coordinates outside these boundaries will return a 400 Bad Request error.

---

## 🚌 Transport Modes

### Available Transport Profiles

| Mode | Description | Use Case |
|------|-------------|----------|
| `driving-car` | Standard passenger vehicle | Personal car travel |
| `driving-hgv` | Heavy goods vehicle | Truck/freight transport |
| `cycling-regular` | Bicycle routing | Cycling routes |
| `foot-walking` | Pedestrian routing | Walking directions |
| `wheelchair` | Accessible routing | Wheelchair-accessible paths |

### Public Transport Types

| Type | Description |
|------|-------------|
| `bus_stop` | Public bus stops |
| `station` | Major transport terminals |
| `platform` | Railway/metro platforms |
| `trotro` | Shared taxi stops |
| `taxi` | Taxi stands |

---

## 🔧 Service Providers

The API uses multiple service providers for reliability and accuracy:

### Routing Services
- **OpenRouteService** - Primary routing provider
- **HERE Maps** - Backup routing service
- **GraphHopper** - Alternative routing engine

### Geocoding Services
- **Nominatim** - Open-source geocoding
- **Overpass API** - OpenStreetMap data

### Transport Data Sources
- **Overpass API** - Public transport stops and routes
- **GTFS Data** - General Transit Feed Specification
- **HERE Transit API** - Commercial transit data
- **GraphHopper** - Route optimization

### Fuel Price Sources
- **CediRates.com** - Real-time fuel price scraping from major Ghanaian companies
- **Direct Company Data** - Shell, Goil, Total, and Star Oil price aggregation

---

## 📊 Data Accuracy

### Routing Accuracy
- Routes calculated using real road network data
- Traffic conditions and road restrictions considered
- Regular updates from multiple data sources

### Transport Stop Data
- Sourced from OpenStreetMap and official transit agencies
- Regular validation and updates
- Community-contributed improvements

### Fuel Price Accuracy
- Real-time scraping from CediRates.com
- Averaged from 4 major fuel companies for reliability
- Updated with each API request
- Direct source data from Shell, Goil, Total, and Star Oil

---

## 🚀 Rate Limiting

The Transport & Logistics API implements rate limiting to ensure fair usage:

- **100 requests per minute** per IP address
- **1000 requests per hour** per IP address
- **10,000 requests per day** per IP address

Rate limit headers are included in all responses:
- `X-RateLimit-Limit` - Request limit per time window
- `X-RateLimit-Remaining` - Requests remaining in current window
- `X-RateLimit-Reset` - Time when the rate limit resets

---

## 🔒 Security & Privacy

### Data Protection
- No personal location data is stored
- Request logs are anonymized after 24 hours
- HTTPS encryption for all API calls

### API Security
- Input validation on all parameters
- SQL injection and XSS protection
- Regular security audits and updates

---

## 🐛 Error Handling

### Common Error Codes

| Code | Description | Solution |
|------|-------------|----------|
| 400 | Invalid coordinates or parameters | Check coordinate validity and parameter format |
| 404 | Location not found | Verify place names and spelling |
| 429 | Rate limit exceeded | Wait before making more requests |
| 503 | Service unavailable | Try again later or contact support |

### Error Response Format

```json
{
  "success": false,
  "message": "Failed to calculate route",
  "error": "Coordinates are outside Ghana boundaries"
}
```

---

## 📝 Examples

### Complete Journey Planning

```bash
# 1. Find nearby stops
curl -X GET "https://ghana-api.dev/v1/transport/nearby-stops?lat=5.6037&lng=-0.187&radius=1000"

# 2. Calculate route
curl -X GET "https://ghana-api.dev/v1/transport/route-calculation?start_lat=5.6037&start_lng=-0.187&end_lat=6.6885&end_lng=-1.6244&mode=driving"

# 3. Get detailed directions
curl -X GET "https://ghana-api.dev/v1/transport/directions?start_lat=5.6037&start_lng=-0.187&end_lat=6.6885&end_lng=-1.6244&profile=driving-car"

# 4. Estimate travel cost
curl -X GET "https://ghana-api.dev/v1/transport/travel-cost?distance=247.8&mode=car"

# 5. Get current fuel prices
curl -X GET "https://ghana-api.dev/v1/transport/fuel-prices"
```

### Using Place Names

```bash
# Route with place names instead of coordinates
curl -X GET "https://ghana-api.dev/v1/transport/directions?start_name=Kotoka%20Airport&end_name=University%20of%20Ghana&profile=driving-car"
```

### Public Transport Journey

```bash
# Find transport stops in Kumasi
curl -X GET "https://ghana-api.dev/v1/transport/stops?city=kumasi&type=bus_stop"

# Estimate trotro fare
curl -X GET "https://ghana-api.dev/v1/transport/travel-cost?distance=15.5&mode=trotro"
```

---

## 📱 Integration Tips

### Frontend Integration
- Use the geometry data for map visualization
- Implement retry logic for failed requests
- Cache fuel prices for better performance
- Provide fallback options when services are unavailable

### Mobile Applications
- Consider using compressed geometry for reduced bandwidth
- Implement offline caching for frequently used routes
- Provide alternative transport modes when primary fails

### Business Applications
- Combine with address validation for complete logistics solutions
- Use cost estimation for fleet management
- Integrate fuel price monitoring for budget planning

---

## 🆘 Support

For technical support, feature requests, or bug reports:

- **Documentation:** [https://ghana-api.dev/docs](https://ghana-api.dev/docs)
- **GitHub Issues:** [https://github.com/teebhagg/GhanaAPI/issues](https://github.com/teebhagg/GhanaAPI/issues)
- **API Status:** [https://status.ghana-api.dev](https://status.ghana-api.dev)

---

*Last updated: January 2024*
