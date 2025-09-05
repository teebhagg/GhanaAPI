# Quick Start Guide

Get up and running with GhanaAPI in just a few minutes. This guide will walk you through making your first API calls and understanding the basics.

## Base URL

All API requests are made to:

```
https://api.ghana-api.dev/v1
```

## Your First API Call

Let's start with a simple request that doesn't require authentication - getting current exchange rates:

```bash
curl "https://api.ghana-api.dev/v1/exchange-rates/current"
```

### Expected Response

```json
{
  "baseCurrency": "GHS",
  "timestamp": "2025-01-15T10:30:00Z",
  "rates": {
    "USD": {
      "rate": 0.082,
      "inverseRate": 12.2,
      "change24h": -0.15,
      "trend": "down"
    },
    "EUR": {
      "rate": 0.076,
      "inverseRate": 13.16,
      "change24h": 0.08,
      "trend": "up"
    }
  },
  "provider": "Bank of Ghana",
  "nextUpdate": "2025-01-15T11:00:00Z"
}
```

## Making Requests in Different Languages

### JavaScript/Node.js

```javascript
// Using fetch (modern browsers/Node.js 18+)
const response = await fetch(
  "https://api.ghana-api.dev/v1/exchange-rates/current?currencies=USD"
);
const data = await response.json();
console.log(`1 USD = ${data.rates.USD.rate} GHS`);

// Using axios
const axios = require("axios");
const response = await axios.get(
  "https://api.ghana-api.dev/v1/exchange-rates/current?currencies=USD"
);
console.log(response.data);
```

### Python

```python
import requests

response = requests.get('https://api.ghana-api.dev/v1/exchange-rates/current?currencies=USD')
data = response.json()
print(f"1 USD = {data['rates']['USD']['rate']} GHS")
```

### PHP

```php
<?php
$response = file_get_contents('https://api.ghana-api.dev/v1/exchange-rates/current?currencies=USD');
$data = json_decode($response, true);
echo "1 USD = " . $data['rates']['USD']['rate'] . " GHS\n";
?>
```

## Address Validation Example

Try validating a Ghana Post Digital Address:

```bash
curl "https://api.ghana-api.dev/v1/addresses/validate/GA-123-4567"
```

### Response

```json
{
  "isValid": true,
  "digitalCode": "GA-123-4567",
  "formattedAddress": "123 Liberation Road, Accra, Greater Accra Region",
  "coordinates": {
    "latitude": 5.6037,
    "longitude": -0.187
  },
  "region": "Greater Accra Region",
  "district": "Accra Metropolitan"
}
```

## Route Planning Example

Calculate a route between two locations in Ghana:

```bash
curl "https://api.ghana-api.dev/v1/transport/route-calculation?start_lat=5.6037&start_lng=-0.187&end_lat=6.6885&end_lng=-1.6244&mode=driving"
```

### Response

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
    ]
  },
  "start": [5.6037, -0.187],
  "end": [6.6885, -1.6244],
  "mode": "driving"
}
```

## Error Handling

All API endpoints return consistent error responses:

```json
{
  "error": {
    "code": "INVALID_ADDRESS",
    "message": "The provided digital address code is invalid",
    "details": {
      "providedCode": "INVALID-123",
      "expectedFormat": "XX-XXX-XXXX"
    }
  },
  "timestamp": "2025-01-15T10:30:00Z",
  "requestId": "req_abc123def456"
}
```

## Next Steps

Now that you've made your first API calls:

1. **[Explore all endpoints](../api/addresses)** in our API reference
2. **[Check out the API documentation](../api/overview)** for complete examples and reference
3. **[Learn about best practices](../api/overview)** for production usage

## Need Help?

- **[Interactive API Docs](https://api.ghana-api.dev/docs)** - Try endpoints directly in your browser
- **[GitHub Discussions](https://github.com/teebhagg/GhanaAPI/discussions)** - Ask questions and get help
- **[Status Page](https://status.ghana-api.dev)** - Check API status and uptime

:::tip Pro Tip
Use the `?currencies=USD,EUR` parameter to get specific exchange rates instead of all available currencies. This reduces response size and improves performance.
:::
