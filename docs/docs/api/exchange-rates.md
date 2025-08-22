# Exchange Rates API

The Exchange Rates API provides real-time and historical currency exchange data for the Ghana Cedi (GHS) against major world currencies, sourced from Bank of Ghana and other reliable financial providers.

> **Implementation Status:** Some endpoints are not yet fully implemented. See individual endpoint descriptions for current status.

## 💱 Overview

The API provides:

- **Real-time rates** from Bank of Ghana and multiple providers
- **Historical data** for trend analysis
- **Currency conversion** with accurate calculations
- **Rate trends** and analytics
- **Multiple currency support** (USD, EUR, GBP, NGN)

### Supported Currencies

| Currency       | Code | Description                                   |
| -------------- | ---- | --------------------------------------------- |
| Ghanaian Cedi  | GHS  | Base currency (all rates are relative to GHS) |
| US Dollar      | USD  | United States Dollar                          |
| Euro           | EUR  | European Union Euro                           |
| British Pound  | GBP  | United Kingdom Pound Sterling                 |
| Nigerian Naira | NGN  | Nigerian Naira                                |

**Note:** All exchange rates are provided relative to GHS (Ghanaian Cedi) as the base currency.

### Currency Limitations

The API currently supports a limited set of currencies to ensure data quality and reliability:

- **Base Currency:** GHS (Ghanaian Cedi) - all rates are relative to GHS
- **Supported Currencies:** USD, EUR, GBP, NGN
- **Total Currency Pairs:** 10 possible combinations

This limitation allows us to:

- Maintain high data quality from reliable sources
- Ensure fast response times
- Provide consistent coverage from Bank of Ghana
- Focus on the most relevant currencies for the Ghanaian market

Additional currencies may be added in future updates based on demand and data availability.

## 🔗 Base Endpoint

```
https://ghana-api.dev/v1/exchange-rates
```

## 📋 Available Endpoints

### 1. Get Current Exchange Rates

Retrieve current exchange rates for specified currencies against the Ghana Cedi (GHS).

**Endpoint:** `GET /exchange-rates/current`

#### Query Parameters

| Parameter    | Type   | Required | Description                                                                                      |
| ------------ | ------ | -------- | ------------------------------------------------------------------------------------------------ |
| `currencies` | string | No       | Comma-separated list of currency codes (default: USD,EUR,GBP,NGN). Supported: USD, EUR, GBP, NGN |

#### Example Request

```bash
curl -X GET "https://ghana-api.dev/v1/exchange-rates/current?currencies=USD,EUR" \
  -H "Accept: application/json"
```

#### Example Response

```json
{
  "success": true,
  "data": [
    {
      "baseCurrency": "GHS",
      "targetCurrency": "USD",
      "rate": 0.083,
      "provider": "bank-of-ghana",
      "timestamp": "2024-01-15T10:30:00Z"
    },
    {
      "baseCurrency": "GHS",
      "targetCurrency": "EUR",
      "rate": 0.076,
      "provider": "bank-of-ghana",
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ],
  "message": "Current exchange rates retrieved successfully",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### JavaScript Example

```javascript
const getCurrentRates = async (currencies = ["USD", "EUR", "GBP"]) => {
  try {
    const currencyString = currencies.join(",");
    const response = await fetch(
      `https://ghana-api.dev/v1/exchange-rates/current?currencies=${currencyString}`
    );
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error.message);
    }

    return result.data;
  } catch (error) {
    console.error("Failed to get current rates:", error.message);
    throw error;
  }
};

// Usage
const rates = await getCurrentRates(["USD", "EUR"]);
rates.forEach((rate) => {
  console.log(`1 GHS = ${rate.rate} ${rate.targetCurrency}`);
});
```

### 2. Currency Conversion

Convert amounts between different currencies using current exchange rates.

**Endpoint:** `POST /exchange-rates/convert`

#### Supported Currency Pairs

You can convert between any of the supported currencies:

- **GHS** ↔ **USD** (Ghanaian Cedi ↔ US Dollar)
- **GHS** ↔ **EUR** (Ghanaian Cedi ↔ Euro)
- **GHS** ↔ **GBP** (Ghanaian Cedi ↔ British Pound)
- **GHS** ↔ **NGN** (Ghanaian Cedi ↔ Nigerian Naira)
- **USD** ↔ **EUR** (US Dollar ↔ Euro)
- **USD** ↔ **GBP** (US Dollar ↔ British Pound)
- **USD** ↔ **NGN** (US Dollar ↔ Nigerian Naira)
- **EUR** ↔ **GBP** (Euro ↔ British Pound)
- **EUR** ↔ **NGN** (Euro ↔ Nigerian Naira)
- **GBP** ↔ **NGN** (British Pound ↔ Nigerian Naira)

#### Request Body

```json
{
  "from": "GHS",
  "to": "USD",
  "amount": 1000
}
```

#### Example Request

```bash
curl -X POST "https://ghana-api.dev/v1/exchange-rates/convert" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "from": "GHS",
    "to": "USD",
    "amount": 1000
  }'
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "from": "GHS",
    "to": "USD",
    "amount": 1000,
    "rate": 0.083,
    "result": 83.0,
    "provider": "bank-of-ghana",
    "timestamp": "2024-01-15T10:30:00Z"
  },
  "message": "Currency conversion completed successfully",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### JavaScript Example

```javascript
const convertCurrency = async (from, to, amount) => {
  try {
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

    if (!result.success) {
      throw new Error(result.error.message);
    }

    return result.data;
  } catch (error) {
    console.error("Conversion error:", error.message);
    throw error;
  }
};

// Usage
const conversion = await convertCurrency("GHS", "USD", 1000);
console.log(
  `${conversion.amount} ${conversion.from} = ${conversion.result} ${conversion.to}`
);
```

### 3. Historical Exchange Rates ⏳

> **Status:** Coming Soon - Not yet implemented

Get historical exchange rate data for trend analysis.

**Endpoint:** `GET /exchange-rates/historical`

#### Query Parameters

| Parameter  | Type   | Required | Description                    |
| ---------- | ------ | -------- | ------------------------------ |
| `from`     | string | Yes      | Start date (YYYY-MM-DD format) |
| `to`       | string | Yes      | End date (YYYY-MM-DD format)   |
| `currency` | string | Yes      | Target currency code           |

#### Example Request

```bash
curl -X GET "https://ghana-api.dev/v1/exchange-rates/historical?from=2024-01-01&to=2024-01-15&currency=USD" \
  -H "Accept: application/json"
```

#### Example Response

```json
{
  "success": true,
  "data": [
    {
      "baseCurrency": "GHS",
      "targetCurrency": "USD",
      "rate": 0.082,
      "date": "2024-01-01T00:00:00Z",
      "provider": "bank-of-ghana"
    },
    {
      "baseCurrency": "GHS",
      "targetCurrency": "USD",
      "rate": 0.083,
      "date": "2024-01-02T00:00:00Z",
      "provider": "bank-of-ghana"
    }
  ],
  "message": "Historical rates retrieved successfully",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### JavaScript Example

```javascript
const getHistoricalRates = async (fromDate, toDate, currency) => {
  try {
    const response = await fetch(
      `https://ghana-api.dev/v1/exchange-rates/historical?from=${fromDate}&to=${toDate}&currency=${currency}`
    );
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error.message);
    }

    return result.data;
  } catch (error) {
    console.error("Failed to get historical rates:", error.message);
    throw error;
  }
};

// Usage
const historicalRates = await getHistoricalRates(
  "2024-01-01",
  "2024-01-15",
  "USD"
);
historicalRates.forEach((rate) => {
  console.log(`${rate.date}: 1 GHS = ${rate.rate} USD`);
});
```

### 4. Rate Trends ⏳

> **Status:** Coming Soon - Not yet implemented

Get trend analysis for a specific currency over the last 7 days.

**Endpoint:** `GET /exchange-rates/{currency}/trend`

#### Path Parameters

| Parameter  | Type   | Required | Description          |
| ---------- | ------ | -------- | -------------------- |
| `currency` | string | Yes      | Target currency code |

#### Example Request

```bash
curl -X GET "https://ghana-api.dev/v1/exchange-rates/USD/trend" \
  -H "Accept: application/json"
```

#### Example Response

```json
{
  "success": true,
  "data": [
    {
      "baseCurrency": "GHS",
      "targetCurrency": "USD",
      "rate": 0.082,
      "date": "2024-01-08T00:00:00Z",
      "provider": "bank-of-ghana"
    },
    {
      "baseCurrency": "GHS",
      "targetCurrency": "USD",
      "rate": 0.083,
      "date": "2024-01-15T00:00:00Z",
      "provider": "bank-of-ghana"
    }
  ],
  "message": "Rate trend retrieved successfully",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### JavaScript Example

```javascript
const getRateTrend = async (currency) => {
  try {
    const response = await fetch(
      `https://ghana-api.dev/v1/exchange-rates/${currency}/trend`
    );
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error.message);
    }

    return result.data;
  } catch (error) {
    console.error("Failed to get rate trend:", error.message);
    throw error;
  }
};

// Usage
const trend = await getRateTrend("USD");
console.log("USD trend over the last 7 days:", trend);
```

## 🔍 Advanced Usage Patterns

### Multi-Currency Conversion

Convert amounts across multiple currencies:

```javascript
const convertMultipleCurrencies = async (from, amounts, targetCurrencies) => {
  const conversions = [];

  for (const currency of targetCurrencies) {
    for (const amount of amounts) {
      try {
        const conversion = await convertCurrency(from, currency, amount);
        conversions.push(conversion);
      } catch (error) {
        console.error(
          `Failed to convert ${amount} ${from} to ${currency}:`,
          error.message
        );
      }
    }
  }

  return conversions;
};

// Usage
const conversions = await convertMultipleCurrencies(
  "GHS",
  [100, 500, 1000],
  ["USD", "EUR", "GBP"]
);
```

### Rate Monitoring

Monitor exchange rates for significant changes:

```javascript
class RateMonitor {
  constructor(currency, threshold = 0.01) {
    this.currency = currency;
    this.threshold = threshold;
    this.lastRate = null;
  }

  async checkRate() {
    const rates = await getCurrentRates([this.currency]);
    const currentRate = rates.find((r) => r.targetCurrency === this.currency);

    if (this.lastRate) {
      const change = Math.abs(currentRate.rate - this.lastRate.rate);
      const changePercent = (change / this.lastRate.rate) * 100;

      if (changePercent >= this.threshold * 100) {
        console.log(`Significant rate change detected for ${this.currency}:`);
        console.log(
          `Previous: ${this.lastRate.rate}, Current: ${currentRate.rate}`
        );
        console.log(`Change: ${changePercent.toFixed(2)}%`);
      }
    }

    this.lastRate = currentRate;
    return currentRate;
  }

  startMonitoring(intervalMs = 300000) {
    // 5 minutes
    return setInterval(() => this.checkRate(), intervalMs);
  }
}

// Usage
const monitor = new RateMonitor("USD", 0.02); // 2% threshold
const interval = monitor.startMonitoring(60000); // Check every minute
```

### Historical Analysis

Analyze historical rate patterns:

```javascript
const analyzeHistoricalTrends = async (currency, days = 30) => {
  const endDate = new Date().toISOString().split("T")[0];
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const rates = await getHistoricalRates(startDate, endDate, currency);

  // Calculate statistics
  const rateValues = rates.map((r) => r.rate);
  const min = Math.min(...rateValues);
  const max = Math.max(...rateValues);
  const avg = rateValues.reduce((a, b) => a + b, 0) / rateValues.length;

  // Calculate volatility
  const variance =
    rateValues.reduce((acc, rate) => acc + Math.pow(rate - avg, 2), 0) /
    rateValues.length;
  const volatility = Math.sqrt(variance);

  return {
    currency,
    period: `${days} days`,
    min,
    max,
    average: avg,
    volatility,
    trend:
      rates[rates.length - 1].rate > rates[0].rate
        ? "increasing"
        : "decreasing",
  };
};

// Usage
const analysis = await analyzeHistoricalTrends("USD", 30);
console.log("USD Analysis:", analysis);
```

### Real-time Rate Updates

Implement real-time rate updates using polling:

```javascript
class RealTimeRateTracker {
  constructor(currencies = ["USD", "EUR"], updateInterval = 30000) {
    this.currencies = currencies;
    this.updateInterval = updateInterval;
    this.subscribers = [];
    this.isRunning = false;
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter((sub) => sub !== callback);
    };
  }

  async updateRates() {
    try {
      const rates = await getCurrentRates(this.currencies);
      this.subscribers.forEach((callback) => callback(rates));
    } catch (error) {
      console.error("Failed to update rates:", error.message);
    }
  }

  start() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.updateRates(); // Initial update
    this.interval = setInterval(() => this.updateRates(), this.updateInterval);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.isRunning = false;
    }
  }
}

// Usage
const tracker = new RealTimeRateTracker(["USD", "EUR"], 30000);
const unsubscribe = tracker.subscribe((rates) => {
  console.log("Updated rates:", rates);
});

tracker.start();

// Stop tracking after 5 minutes
setTimeout(() => {
  tracker.stop();
  unsubscribe();
}, 300000);
```

## 📊 Error Handling

### Common Error Codes

| Code                   | Description                     | Solution                                          |
| ---------------------- | ------------------------------- | ------------------------------------------------- |
| `INVALID_CURRENCY`     | Currency code is not supported  | Use supported currencies: GHS, USD, EUR, GBP, NGN |
| `INVALID_AMOUNT`       | Amount is not a valid number    | Ensure amount is numeric                          |
| `DATE_RANGE_TOO_LARGE` | Historical date range too large | Reduce date range                                 |
| `PROVIDER_UNAVAILABLE` | Rate provider is down           | Retry later                                       |

### Error Handling Example

```javascript
const handleExchangeRateError = (error) => {
  switch (error.code) {
    case "INVALID_CURRENCY":
      return "Currency not supported. Please check the currency code.";
    case "INVALID_AMOUNT":
      return "Invalid amount. Please enter a valid number.";
    case "DATE_RANGE_TOO_LARGE":
      return "Date range too large. Please select a smaller range.";
    case "PROVIDER_UNAVAILABLE":
      return "Rate service temporarily unavailable. Please try again later.";

    default:
      return "An error occurred. Please try again later.";
  }
};

// Usage
try {
  const rates = await getCurrentRates(["INVALID"]);
} catch (error) {
  const userMessage = handleExchangeRateError(error);
  console.error(userMessage);
}
```

## 🔧 Integration Examples

### React Hook for Exchange Rates

```jsx
import React, { useState, useEffect } from "react";

const useExchangeRates = (currencies = ["USD", "EUR"]) => {
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await getCurrentRates(currencies);
        setRates(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRates();

    // Refresh rates every 5 minutes
    const interval = setInterval(fetchRates, 300000);

    return () => clearInterval(interval);
  }, [currencies]);

  return { rates, loading, error };
};

// Usage in component
const ExchangeRateDisplay = () => {
  const { rates, loading, error } = useExchangeRates(["USD", "EUR"]);

  if (loading) return <div>Loading rates...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h3>Current Exchange Rates</h3>
      {rates.map((rate) => (
        <div key={rate.targetCurrency}>
          1 GHS = {rate.rate} {rate.targetCurrency}
        </div>
      ))}
    </div>
  );
};
```

### Node.js Currency Converter Service

```javascript
const express = require("express");
const axios = require("axios");
const app = express();

app.use(express.json());

// Currency conversion endpoint
app.post("/convert", async (req, res) => {
  try {
    const { from, to, amount } = req.body;

    if (!from || !to || !amount) {
      return res.status(400).json({
        success: false,
        error: "Missing required parameters: from, to, amount",
      });
    }

    const response = await axios.post(
      "https://ghana-api.dev/v1/exchange-rates/convert",
      { from, to, amount }
    );

    res.json(response.data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to convert currency",
    });
  }
});

// Get current rates endpoint
app.get("/rates", async (req, res) => {
  try {
    const { currencies } = req.query;

    const response = await axios.get(
      `https://ghana-api.dev/v1/exchange-rates/current?currencies=${
        currencies || "USD,EUR,GBP"
      }`
    );

    res.json(response.data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to get exchange rates",
    });
  }
});

app.listen(3000, () => {
  console.log("Currency converter service running on port 3000");
});
```

## 📈 Performance Tips

### 1. Caching Exchange Rates

Cache rates to reduce API calls:

```javascript
class RateCache {
  constructor(ttl = 300000) {
    // 5 minutes
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

const rateCache = new RateCache();

const getCachedRates = async (currencies) => {
  const key = currencies.sort().join(",");
  const cached = rateCache.get(key);

  if (cached) return cached;

  const rates = await getCurrentRates(currencies);
  rateCache.set(key, rates);

  return rates;
};
```

### 2. Batch Conversions

Process multiple conversions efficiently:

```javascript
const batchConvert = async (conversions) => {
  const results = [];

  for (const conversion of conversions) {
    try {
      const result = await convertCurrency(
        conversion.from,
        conversion.to,
        conversion.amount
      );
      results.push({ ...conversion, success: true, result });
    } catch (error) {
      results.push({ ...conversion, success: false, error: error.message });
    }
  }

  return results;
};

// Usage
const conversions = [
  { from: "GHS", to: "USD", amount: 100 },
  { from: "GHS", to: "EUR", amount: 200 },
  { from: "USD", to: "GHS", amount: 50 },
];

const results = await batchConvert(conversions);
```

## 🔐 Security Considerations

### Input Validation

Validate currency codes and amounts:

```javascript
const validateCurrencyCode = (code) => {
  // Supported currencies: GHS (base), USD, EUR, GBP, NGN
  const validCurrencies = ["GHS", "USD", "EUR", "GBP", "NGN"];
  return validCurrencies.includes(code.toUpperCase());
};

const validateAmount = (amount) => {
  return typeof amount === "number" && amount > 0 && isFinite(amount);
};

// Usage
if (!validateCurrencyCode(from) || !validateCurrencyCode(to)) {
  throw new Error("Invalid currency code");
}

if (!validateAmount(amount)) {
  throw new Error("Invalid amount");
}
```

---

For more information, see the [API Overview](./overview) for complete documentation and examples.
