# Crypto API

The Crypto API provides real-time cryptocurrency pricing in both USD and Ghana Cedi (GHS). It uses CoinGecko for live USD pricing, converts values to GHS through the internal exchange-rates service, and falls back to synthetic data when the upstream provider is unavailable or rate-limited.

> **Implementation Status:** ✅ **Fully Implemented** - The endpoint is live and includes caching plus upstream fallback behavior.

## Overview

The API currently exposes a single REST endpoint for fetching crypto prices:

- **Live market pricing** from CoinGecko
- **Automatic GHS conversion** using the internal exchange-rates module
- **Short-lived caching** to reduce repeated upstream calls
- **Fallback response mode** when CoinGecko is unavailable

## Base Endpoint

```text
https://api.ghana-api.dev/api/v1/crypto
```

## Available Endpoints

### 1. Get Crypto Prices

Fetch the latest cryptocurrency prices for one or more assets.

**Endpoint:** `GET /crypto`

#### Query Parameters

| Parameter | Type   | Required | Description                                                            | Default                |
| --------- | ------ | -------- | ---------------------------------------------------------------------- | ---------------------- |
| `ids`     | string | No       | Comma-separated cryptocurrency IDs such as `bitcoin,ethereum,solana`. | `bitcoin,ethereum` |

#### Example Request

```bash
curl -X GET "https://api.ghana-api.dev/api/v1/crypto?ids=bitcoin,ethereum,solana" \
  -H "Accept: application/json"
```

#### Example Response

```json
{
  "source": "coingecko",
  "data": {
    "bitcoin": {
      "usd": 65000,
      "ghs": 975000
    },
    "ethereum": {
      "usd": 3500,
      "ghs": 52500
    },
    "solana": {
      "usd": 150,
      "ghs": 2250
    }
  },
  "timestamp": "2026-03-19T14:36:59.000Z"
}
```

#### JavaScript Example

```javascript
const getCryptoPrices = async (ids = ["bitcoin", "ethereum"]) => {
  const params = new URLSearchParams({
    ids: ids.join(","),
  });

  const response = await fetch(
    `https://api.ghana-api.dev/api/v1/crypto?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
};

const prices = await getCryptoPrices(["bitcoin", "solana"]);
console.log(prices.data.bitcoin.ghs);
```

## Response Shape

| Field | Type | Description |
| ----- | ---- | ----------- |
| `source` | string | `coingecko` when live upstream data succeeds, or `fallback` when simulated backup values are used. |
| `data` | object | Keyed by crypto ID. Each item includes `usd` and `ghs` values. |
| `timestamp` | string | ISO 8601 timestamp indicating when the response object was created. |

## Caching Behavior

- Responses are cached for **60 seconds**
- Cache keys are built from the requested IDs after sorting them alphabetically
- Repeated requests for the same ID set within the cache window return the cached payload

Example cache key:

```text
crypto:prices:bitcoin,ethereum,solana
```

## Fallback Behavior

If CoinGecko fails or rate-limits the request, the service automatically switches to fallback mode:

- The response `source` becomes `fallback`
- USD values are populated from an internal fallback store
- Supported fallback presets currently include:
  - `bitcoin`
  - `ethereum`
  - `solana`
  - `cardano`
  - `binancecoin`
  - `ripple`
- Unknown IDs in fallback mode receive a default synthetic USD value of `100`

### GHS Conversion Fallback

After USD prices are fetched, the service converts each amount to GHS through the exchange-rates module. If that conversion fails:

- The service logs a warning
- GHS is approximated with a fallback multiplier of `15.0`

## Notes and Limitations

- The endpoint currently accepts only a comma-separated `ids` query string
- Returned objects include only assets that resolve to a USD price during processing
- Fallback values are intended for resilience and continuity, not precise trading or treasury use
