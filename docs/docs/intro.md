# Welcome to GhanaAPI

GhanaAPI provides developers with unified, reliable access to essential Ghanaian services through a modern REST API. Instead of integrating with multiple fragmented services, developers can access everything through one comprehensive, well-documented API.

## 🌟 Features

- **📍 Address & Location Services** - Ghana Post Digital Address validation, geocoding, and location lookup
- **💱 Live Exchange Rates** - Real-time GHS exchange rates with historical data and trends
- **🏛️ Government Data** - Regional information, districts, and official datasets
- **⚡ High Performance** - Sub-200ms response times with intelligent caching
- **🚗 Transport & Logistics** - Route planning, transport stops, fuel prices, and travel cost estimation
- **📊 Developer Friendly** - Interactive Swagger docs

## 🚀 Quick Start

Get started with GhanaAPI in under 5 minutes:

```bash
# Get current USD to GHS exchange rate (no auth required)
curl "https://api.ghana-api.dev/v1/exchange-rates/current?currencies=USD"

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

## 🇬🇭 Made in Ghana

GhanaAPI is built with ❤️ for the Ghanaian developer community, providing reliable access to local services and data through a world-class API experience.

---

:::tip Need Help?

Join our [GitHub Discussions](https://github.com/teebhagg/GhanaAPI/discussions) or check out our [interactive API docs](https://api.ghana-api.dev/docs) for more detailed information.

:::

:::info API Status

Check our [status page](https://status.ghana-api.dev) for real-time API availability and performance metrics.

:::
