# Welcome to Ghana API

**3- **📍 Address & Location Services\*\* - Ghana Post Digital Address validation, geocoding, and location lookup

- **🏦 Bank & ATM Locator** - Find banks and ATMs across Ghana with location-based search
- **📈 Stock Market Data** - Ghana Stock Exchange real-time prices, market analytics, and sector performance
- **💱 Live Exchange Rates** - Real-time GHS exchange rates with historical data and trends
- **🏛️ Government Data** - Regional information, districts, and official datasets
- **🚗 Transport & Logistics** - Route planning, transport stops, fuel prices, and travel cost estimation
- **⚡ High Performance** - Sub-200ms response times with intelligent caching
- **📊 Developer Friendly** - Interactive Swagger docsndpoints\*\* across 6 core services:

- **📍 Address & Location Services** - Ghana Post Digital Address validation, geocoding, and location lookup
- **🏦 Bank & ATM Locator** - Find banks and ATMs across Ghana with location-based search
- **📈 Stock Market Data** - **7 endpoints** for Ghana Stock Exchange real-time data
  - Live stock prices from all 30+ GSE-listed companies
  - Real-time market summary with GSE Composite index
  - Sector performance analytics across 13+ sectors
  - Advanced search and filtering capabilities
  - Company profiles with financial metrics
  - Market hours detection and trading status
- **💱 Live Exchange Rates** - Real-time GHS exchange rates with historical data and trends
- **🏛️ Government Data** - Regional information, districts, and official datasets
- **🚗 Transport & Logistics** - Route planning, transport stops, fuel prices, and travel cost estimation

**Additional Benefits:**

- **⚡ High Performance** - Sub-200ms response times with intelligent caching
- **📊 Developer Friendly** - Interactive Swagger docs with live API testing
- **🔄 Real-time Data** - Live data from Ghana Stock Exchange via external GSE API

GhanaAPI provides developers with unified, reliable access to essential Ghanaian services through a modern REST API. Instead of integrating with multiple fragmented services, developers can access everything through one comprehensive, well-documented API.

## 🌟 Features

- **📍 Address & Location Services** - Ghana Post Digital Address validation, geocoding, and location lookup
- **🏦 Bank & ATM Locator** - Find banks and ATMs across Ghana with location-based search
- **� Stock Market Data** - Ghana Stock Exchange real-time prices, market analytics, and sector performance
- **�💱 Live Exchange Rates** - Real-time GHS exchange rates with historical data and trends
- **🏛️ Government Data** - Regional information, districts, and official datasets
- **⚡ High Performance** - Sub-200ms response times with intelligent caching
- **🚗 Transport & Logistics** - Route planning, transport stops, fuel prices, and travel cost estimation
- **📊 Developer Friendly** - Interactive Swagger docs

## 🚀 Quick Start

Get started with GhanaAPI in under 5 minutes:

```bash
# Get current USD to GHS exchange rate (no auth required)
curl "https://api.ghana-api.dev/v1/exchange-rates/current?currencies=USD"

# Get Ghana Stock Exchange market summary
curl "https://api.ghana-api.dev/v1/stock-market/market-summary"

# Search for banking stocks with high performance
curl "https://api.ghana-api.dev/v1/stock-market/search?sector=Banking&sortBy=changePercent&sortOrder=desc"

# Validate Ghana Post Digital Address
curl "https://api.ghana-api.dev/v1/addresses/validate/GA-123-4567"

# Calculate route between two locations
curl "https://api.ghana-api.dev/v1/transport/route-calculation?start_lat=5.6037&start_lng=-0.187&end_lat=6.6885&end_lng=-1.6244"

# Get current fuel prices
curl "https://api.ghana-api.dev/v1/transport/fuel-prices"
```

## 📖 What's Next?

- **[Quick Start Guide](./getting-started/quick-start)** - Get up and running in minutes
- **[API Reference](https://api.ghana-api.dev/docs)** - Complete interactive API documentation
- **[API Documentation](./api/overview)** - Complete API reference and examples
- **[Contributing Guide](./contributing/overview)** - Help improve Ghana API and build new features

## 🤝 Contributing

Ghana API is open source and welcomes contributions from the developer community. Whether you want to:

- **Add new features** - Help expand API capabilities
- **Fix bugs** - Improve stability and reliability
- **Improve documentation** - Make the API more accessible
- **Add tests** - Increase code coverage and quality

Check out our **[Contributing Guide](./contributing/overview)** to get started. We have detailed guides for each service:

- **[Stock Market Data](./contributing/stock-market)** - GSE integration and real-time data
- **[Address Services](./contributing/addresses)** - Ghana Post Digital Address validation
- **[Banking & ATMs](./contributing/banking)** - Bank and ATM location services
- **[Exchange Rates](./contributing/exchange-rates)** - Currency data integration
- **[Transport & Logistics](./contributing/transport)** - Route planning and fuel prices
- **[Location Data](./contributing/locations)** - Regional and administrative data

### Development Setup

```bash
# Clone the repository
git clone https://github.com/teebhagg/GhanaAPI.git
cd GhanaAPI

# Install dependencies
npm install

# Start development server
npm run start:dev

# Run tests
npm test
```

## 🇬🇭 Made in Ghana

GhanaAPI is built with ❤️ for the Ghanaian developer community, providing reliable access to local services and data through a world-class API experience.

---

:::tip Need Help?

Join our [GitHub Discussions](https://github.com/teebhagg/GhanaAPI/discussions) or check out our [interactive API docs](https://api.ghana-api.dev/docs) for more detailed information.

:::

:::info API Status

Check our [status page](https://status.ghana-api.dev) for real-time API availability and performance metrics.

:::
