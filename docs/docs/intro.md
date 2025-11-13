# Welcome to Ghana API

GhanaAPI is the definitive REST API for Ghanaian services. It unifies data that is otherwise scattered across government portals, financial sources, and local datasets into one reliable, developer-friendly platform.

## 🌟 Core Services

- **🎓 Education Data** – National directory of universities, colleges, SHS, JHS, and TVET institutions with regional filters, grading, and program metadata
- **🏠 Address & Location Services** – Ghana Post Digital Address validation (coming soon), geocoding, reverse geocoding, and location lookup
- **🏦 Banking & ATM Locator** – Searchable directory of bank branches and ATMs with proximity search, branch metadata, and OSM enrichment
- **📈 Stock Market Data** – Real-time Ghana Stock Exchange pricing, market summaries, sector performance, and company profiles
- **💱 Exchange Rates** – Live GHS exchange rates, currency conversion, and provider fallbacks (historical trends planned)
- **🚗 Transport & Logistics** – Route planning, transport stops, fuel prices, travel cost estimation, and multi-provider routing fallbacks
- **🗺️ Location Data** – Complete Ghanaian administrative hierarchy with regions, districts, and metadata

Each service follows the same conventions: versioned endpoints under `/api/v1`, consistent response shapes, and comprehensive Swagger documentation.

## 🚀 Quick Start

```bash
# Get current USD to GHS exchange rate (no auth required)
curl "https://api.ghana-api.dev/v1/exchange-rates/current?currencies=USD"

# Search for Senior High Schools in Ashanti region
curl "https://api.ghana-api.dev/v1/education/schools/search?region=Ashanti&grade=A"

# Get Ghana Stock Exchange market summary
curl "https://api.ghana-api.dev/v1/stock-market/market-summary"

# Find nearby banks and ATMs within 5km of Accra Mall
curl "https://api.ghana-api.dev/v1/banking/nearby?lat=5.6373&lng=-0.1708&radius=5"

# Calculate a driving route between two coordinates in Accra
curl "https://api.ghana-api.dev/v1/transport/route-calculation?start_lat=5.6037&start_lng=-0.187&end_lat=5.6081&end_lng=-0.171"

# Retrieve the list of Ghanaian regions
curl "https://api.ghana-api.dev/v1/locations/regions"
```

## 📖 What's Next?

- **[Quick Start Guide](./getting-started/quick-start)** – Set up your environment and make your first requests
- **[API Overview](./api/overview)** – Explore every service area with detailed examples
- **[Interactive Swagger Docs](https://api.ghana-api.dev/docs)** – Try endpoints directly in your browser
- **[Contributing Guide](./contributing/overview)** – Learn how to extend GhanaAPI with new features or datasets

## 🤝 Contributing

We welcome contributions! Start with the [Contributing Overview](./contributing/overview) and then dive into the service-specific guides, including the brand-new **[Education](./contributing/education)** section for the school directory feature.

```bash
# Clone the repository
git clone https://github.com/teebhagg/GhanaAPI.git
cd GhanaAPI

# Install dependencies and start the backend
cd backend
npm install
npm run start:dev

# Run tests
npm test
```

## 🇬🇭 Made in Ghana

GhanaAPI is built with ❤️ for the Ghanaian developer community, providing unified access to trusted local data through a modern API experience. Have questions? Visit our [GitHub Discussions](https://github.com/teebhagg/GhanaAPI/discussions) or check the [status page](https://status.ghana-api.dev) for real-time availability updates.
