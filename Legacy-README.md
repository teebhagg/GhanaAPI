# 🇬🇭 GhanaAPI

[![API Status](https://img.shields.io/badge/API-Live-brightgreen)](https://api.ghana-api.dev)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/teebhagg/ghanaapi/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js CI](https://github.com/teebhagg/ghanaapi/workflows/Node.js%20CI/badge.svg)](https://github.com/teebhagg/ghanaapi/actions)
[![Coverage](https://img.shields.io/badge/coverage-95%25-brightgreen.svg)](https://codecov.io/gh/teebhagg/ghanaapi)

> **The definitive REST API for Ghanaian services** - Addresses, Exchange Rates, Locations, and more. Built for developers who need reliable access to essential Ghanaian data and services.

🌐 **[API Documentation](https://api.ghana-api.dev/docs)** | 🚀 **[Getting Started](#getting-started)** | 💻 **[Examples](#examples)** | 📖 **[Contributing](#contributing)**

---

## 🎯 **What is GhanaAPI?**

GhanaAPI provides developers with unified, reliable access to essential Ghanaian services through a modern REST API. Instead of integrating with multiple fragmented services, developers can access everything through one comprehensive, well-documented API.

### **🔥 Key Features**

- **📍 Address & Location Services** - Ghana Post Digital Address validation, geocoding, and location lookup
- **💱 Live Exchange Rates** - Real-time GHS exchange rates with historical data and trends
- **🏛️ Government Data** - Regional information, districts, and official datasets
- **⚡ High Performance** - Sub-200ms response times with intelligent caching
- **🔒 Enterprise Ready** - Rate limiting, authentication, comprehensive error handling
- **📊 Developer Friendly** - Interactive Swagger docs, SDKs, and detailed examples

---

## 🚀 **Getting Started**

### **Quick Example**
```javascript
// Get current USD to GHS exchange rate
const response = await fetch('https://api.ghana-api.dev/v1/exchange-rates/current?currencies=USD');
const data = await response.json();
console.log(`1 USD = ${data.rates.USD.rate} GHS`);

// Validate Ghana Post Digital Address
const address = await fetch('https://api.ghana-api.dev/v1/addresses/validate/GA-123-4567');
const validation = await address.json();
console.log(`Address is ${validation.isValid ? 'valid' : 'invalid'}`);
```

### **Base URL**
```
https://api.ghana-api.dev/v1
```

### **Authentication**
```bash
# Free tier - no authentication required
curl "https://api.ghana-api.dev/v1/exchange-rates/current"

# Premium tier - API key required
curl -H "Authorization: Bearer YOUR_API_KEY" \
     "https://api.ghana-api.dev/v1/addresses/search?q=Accra"
```

---

## 📚 **API Reference**

### **🏠 Address & Location Services**

#### **Validate Digital Address**
```http
GET /v1/addresses/validate/{digitalCode}
```

**Example:**
```bash
curl "https://api.ghana-api.dev/v1/addresses/validate/GA-123-4567"
```

**Response:**
```json
{
  "isValid": true,
  "digitalCode": "GA-123-4567",
  "formattedAddress": "123 Liberation Road, Accra, Greater Accra Region",
  "coordinates": {
    "latitude": 5.6037,
    "longitude": -0.1870
  },
  "region": "Greater Accra Region",
  "district": "Accra Metropolitan"
}
```

#### **Reverse Geocoding**
```http
GET /v1/addresses/lookup?lat={latitude}&lng={longitude}
```

**Example:**
```bash
curl "https://api.ghana-api.dev/v1/addresses/lookup?lat=5.6037&lng=-0.1870"
```

#### **Address Search**
```http
GET /v1/addresses/search?q={query}&limit={limit}
```

**Example:**
```bash
curl "https://api.ghana-api.dev/v1/addresses/search?q=University%20of%20Ghana&limit=5"
```

### **💱 Exchange Rate Services**

#### **Current Exchange Rates**
```http
GET /v1/exchange-rates/current?currencies={currencies}
```

**Example:**
```bash
curl "https://api.ghana-api.dev/v1/exchange-rates/current?currencies=USD,EUR,GBP"
```

**Response:**
```json
{
  "baseCurrency": "GHS",
  "timestamp": "2025-01-15T10:30:00Z",
  "rates": {
    "USD": {
      "rate": 0.082,
      "inverseRate": 12.20,
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

#### **Historical Exchange Rates**
```http
GET /v1/exchange-rates/historical?currency={currency}&from={date}&to={date}
```

**Example:**
```bash
curl "https://api.ghana-api.dev/v1/exchange-rates/historical?currency=USD&from=2025-01-01&to=2025-01-15"
```

### **🌍 Location Data**

#### **Get All Regions**
```http
GET /v1/locations/regions
```

#### **Get Districts by Region**
```http
GET /v1/locations/regions/{regionId}/districts
```

**Example:**
```bash
curl "https://api.ghana-api.dev/v1/locations/regions/1/districts"
```

---

## 💻 **Examples & SDKs**

### **JavaScript/Node.js**
```javascript
// Install the SDK
npm install ghanaapi-sdk

// Usage
import GhanaAPI from 'ghanaapi-sdk';

const client = new GhanaAPI({ apiKey: 'your-api-key' });

// Get exchange rates
const rates = await client.exchangeRates.getCurrent(['USD', 'EUR']);

// Validate address
const validation = await client.addresses.validate('GA-123-4567');

// Search locations
const results = await client.addresses.search('Accra Mall');
```

### **Python**
```python
# Install the SDK
pip install ghanaapi-python

# Usage
from ghanaapi import GhanaAPI

client = GhanaAPI(api_key='your-api-key')

# Get exchange rates
rates = client.exchange_rates.get_current(['USD', 'EUR'])

# Validate address
validation = client.addresses.validate('GA-123-4567')
```

### **PHP**
```php
// Install via Composer
composer require ghanaapi/php-sdk

// Usage
use GhanaAPI\Client;

$client = new Client(['api_key' => 'your-api-key']);

// Get exchange rates
$rates = $client->exchangeRates()->getCurrent(['USD', 'EUR']);

// Validate address
$validation = $client->addresses()->validate('GA-123-4567');
```

### **cURL Examples**
```bash
# Get current exchange rates for multiple currencies
curl -X GET "https://api.ghana-api.dev/v1/exchange-rates/current?currencies=USD,EUR,GBP,NGN" \
     -H "Accept: application/json"

# Validate multiple addresses (batch operation)
curl -X POST "https://api.ghana-api.dev/v1/addresses/validate/batch" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_API_KEY" \
     -d '{
       "addresses": ["GA-123-4567", "GA-789-0123", "GA-456-7890"]
     }'

# Get historical exchange rates with specific date range
curl -X GET "https://api.ghana-api.dev/v1/exchange-rates/historical?currency=USD&from=2025-01-01&to=2025-01-15&interval=daily" \
     -H "Accept: application/json"
```

---

## ⚡ **Rate Limits & Pricing**

### **Free Tier**
- **1,000 requests/month**
- **Basic endpoints only**
- **Community support**
- **No authentication required**

### **Developer Tier - $9/month**
- **10,000 requests/month**
- **All endpoints**
- **Email support**
- **API key authentication**

### **Professional Tier - $49/month**
- **100,000 requests/month**
- **Priority support**
- **Webhook notifications**
- **SLA guarantee (99.9% uptime)**

### **Enterprise Tier - Contact Us**
- **Unlimited requests**
- **Dedicated support**
- **Custom integrations**
- **On-premise deployment options**

---

## 🛠️ **Self-Hosting**

Want to run GhanaAPI on your own infrastructure? We've got you covered!

### **Prerequisites**
- Node.js 18+ 
- PostgreSQL 14+
- Redis 6+ (for caching)
- Docker & Docker Compose (optional)

### **Quick Start with Docker**
```bash
# Clone the repository
git clone https://github.com/teebhagg/ghanaapi.git
cd ghanaapi

# Start with Docker Compose
docker-compose up -d

# API will be available at http://localhost:3000
# Swagger docs at http://localhost:3000/docs
```

### **Manual Installation**
```bash
# Clone and install dependencies
git clone https://github.com/teebhagg/ghanaapi.git
cd ghanaapi
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database and API credentials

# Run database migrations
npm run migration:run

# Seed initial data
npm run seed

# Start the application
npm run start:dev
```

### **Environment Variables**
```bash
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=ghanaapi
DATABASE_PASSWORD=your_secure_password
DATABASE_NAME=ghanaapi

# External APIs
EXCHANGE_RATE_API_KEY=your_key_here
MAPBOX_ACCESS_TOKEN=your_token_here
OPENWEATHER_API_KEY=your_key_here

# Application
NODE_ENV=production
PORT=3000
API_KEY_SECRET=your_secret_here
REDIS_URL=redis://localhost:6379
```

---

## 🏗️ **Architecture**

### **Tech Stack**
- **Backend:** NestJS (Node.js/TypeScript)
- **Database:** PostgreSQL with TypeORM
- **Caching:** Redis
- **Documentation:** Swagger/OpenAPI
- **Testing:** Jest + Supertest
- **Deployment:** Docker + Docker Compose

### **External Integrations**
- **Exchange Rates:** Bank of Ghana, ExchangeRate-API, Fixer.io
- **Geocoding:** OpenStreetMap Nominatim, Mapbox, Google Places
- **Government Data:** Ghana Statistical Service, World Bank API
- **Weather:** OpenWeatherMap
- **Communications:** Twilio (SMS), Africa's Talking

### **System Architecture**
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Client Apps   │    │   Load Balancer  │    │   GhanaAPI      │
│                 │───▶│                  │───▶│   (NestJS)      │
│ Web, Mobile,    │    │   (nginx/AWS)    │    │                 │
│ Server Apps     │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                         │
                                                         ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  External APIs  │    │      Cache       │    │   Database      │
│                 │    │                  │    │                 │
│ Bank of Ghana,  │◀───│     Redis        │    │  PostgreSQL     │
│ OpenStreetMap,  │    │                  │    │                 │
│ World Bank      │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

---

## 🧪 **Testing**

### **Run Tests**
```bash
# Unit tests
npm run test

# Integration tests
npm run test:e2e

# Test coverage
npm run test:cov

# Watch mode for development
npm run test:watch
```

### **API Testing**
We provide a comprehensive Postman collection for testing all endpoints:

[![Run in Postman](https://run.pstmn.io/button.svg)](https://app.getpostman.com/run-collection/ghanaapi-collection)

---

## 📈 **Monitoring & Status**

### **System Status**
- **API Status:** [status.ghana-api.dev](https://status.ghana-api.dev)
- **Response Times:** < 200ms (95th percentile)
- **Uptime:** 99.9% SLA
- **Rate Limit Status:** Real-time monitoring

### **Health Check Endpoints**
```bash
# Basic health check
curl https://api.ghana-api.dev/health

# Detailed system status
curl https://api.ghana-api.dev/health/detailed
```

---

## 🤝 **Contributing**

We welcome contributions from the developer community! Here's how you can help:

### **Getting Started**
1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Make** your changes
4. **Add** tests for new functionality
5. **Run** the test suite (`npm test`)
6. **Commit** your changes (`git commit -m 'Add amazing feature'`)
7. **Push** to the branch (`git push origin feature/amazing-feature`)
8. **Open** a Pull Request

### **Development Setup**
```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/ghanaapi.git
cd ghanaapi

# Install dependencies
npm install

# Set up development environment
cp .env.example .env.development

# Start development server with hot reload
npm run start:dev

# Run tests in watch mode
npm run test:watch
```

### **Contribution Guidelines**
- **Code Style:** We use Prettier and ESLint
- **Tests:** All new features must include tests
- **Documentation:** Update README and API docs for new features
- **Commit Messages:** Use conventional commit format
- **Issues:** Use our issue templates for bugs and feature requests

### **Areas We Need Help**
- 🐛 **Bug fixes** and performance improvements
- 📚 **Documentation** improvements and translations
- 🧪 **Test coverage** expansion
- 🔌 **New integrations** with Ghanaian services
- 🌍 **Localization** for local languages
- 📱 **SDK development** for more programming languages

---

## 📖 **Changelog**

### **v1.0.0 - 2025-01-15**
- 🎉 Initial release
- ✅ Address validation and geocoding
- ✅ Live exchange rates with historical data
- ✅ Complete Ghana regions and districts data
- ✅ Swagger documentation
- ✅ Docker support

### **v1.1.0 - Coming Soon**
- 🔄 Mobile money integration (MTN, Vodafone, AirtelTigo)
- 🏦 Banking APIs integration
- 📧 Email notifications for rate changes
- 🔐 Enhanced authentication with JWT
- 📊 Usage analytics dashboard

---

## 🆘 **Support**

### **Need Help?**
- 📚 **Documentation:** [docs.ghana-api.dev](https://docs.ghana-api.dev)
- 💬 **Discord Community:** [discord.gg/ghanaapi](https://discord.gg/ghanaapi)
- 📧 **Email Support:** support@ghana-api.dev
- 🐛 **Bug Reports:** [GitHub Issues](https://github.com/teebhagg/ghanaapi/issues)

### **Enterprise Support**
For enterprise customers, we offer:
- **Dedicated Slack channel**
- **Priority email support**
- **Phone support** during business hours
- **Custom SLA agreements**
- **On-site training** and integration assistance

---

## 📄 **License**

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

### **What this means:**
- ✅ **Commercial use** allowed
- ✅ **Modification** allowed
- ✅ **Distribution** allowed
- ✅ **Private use** allowed
- ❌ **Warranty** not provided
- ❌ **Liability** not accepted

---

## 🙏 **Acknowledgments**

Special thanks to:
- **Bank of Ghana** for providing official exchange rate data
- **Ghana Post** for the Digital Address System
- **Ghana Statistical Service** for regional and demographic data
- **OpenStreetMap Ghana community** for mapping data
- **All contributors** who help make this project better

---

## 🌟 **Star History**

[![Star History Chart](https://api.star-history.com/svg?repos=teebhagg/GhanaAPI&type=Date)](https://star-history.com/#teebhagg/GhanaAPI&Date)

---

<div align="center">

**Built with ❤️ for the Ghanaian developer community**

[Website](https://ghana-api.dev) • [Documentation](https://docs.ghana-api.dev) • [Status](https://status.ghana-api.dev) • [Twitter](https://twitter.com/ghanaapi)

**Made in Ghana 🇬🇭**

</div>