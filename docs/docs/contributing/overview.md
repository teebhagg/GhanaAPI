# Contributing to GhanaAPI

Thank you for your interest in contributing to GhanaAPI! We welcome contributions from the developer community to help build the definitive REST API for Ghanaian services.

## 🌟 Ways to Contribute

- **🐛 Bug Fixes** - Help us identify and fix issues
- **✨ New Features** - Add new endpoints and functionality
- **📚 Documentation** - Improve guides, examples, and API docs
- **🧪 Testing** - Write tests and improve test coverage
- **🌍 Localization** - Add support for local languages
- **📊 Data Quality** - Improve accuracy of addresses, rates, and location data

## 🚀 Quick Start for Contributors

### Prerequisites

- Node.js 18.0 or higher
- npm or yarn
- Git
- Basic knowledge of REST APIs and JavaScript/TypeScript

### Development Setup

1. **Fork and Clone**

   ```bash
   git clone https://github.com/YOUR_USERNAME/GhanaAPI.git
   cd GhanaAPI
   ```

2. **Install Dependencies**

   ```bash
   # Backend dependencies
   cd backend
   npm install

   # Documentation dependencies (optional)
   cd ../docs
   npm install
   ```

3. **Environment Setup**

   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your local configuration
   ```

4. **Start Development Server**

   ```bash
   npm run start:dev
   ```

5. **Run Tests**
   ```bash
   npm test
   npm run test:watch  # For continuous testing
   ```

## 📋 Project Structure

```
GhanaAPI/
├── backend/
│   ├── src/
│   │   ├── controllers/       # Route handlers
│   │   ├── services/         # Business logic
│   │   ├── models/           # Data models
│   │   ├── middleware/       # Custom middleware
│   │   ├── utils/            # Utility functions
│   │   ├── routes/           # API route definitions
│   │   └── tests/            # Test files
│   ├── package.json
│   └── .env.example
├── docs/                     # Documentation (Docusaurus)
├── scripts/                  # Automation scripts
└── README.md
```

## 🎯 Feature Areas

GhanaAPI is organized into distinct feature areas. Choose the area you'd like to contribute to:

### 📍 [Address Services](./addresses)

- Digital address validation
- Address lookup and geocoding
- Address search functionality
- **Skills needed**: Geographic data, validation algorithms, API design

### 💱 [Exchange Rates](./exchange-rates)

- Live currency exchange rates
- Historical rate data
- Rate trends and analytics
- **Skills needed**: Financial APIs, data aggregation, caching

### 🏛️ [Location Data](./locations)

- Regional information
- District and constituency data
- Administrative boundaries
- **Skills needed**: Geographic data, government data, data modeling


## 📝 Contribution Workflow

### 1. Choose an Issue or Feature

- Browse [open issues](https://github.com/teebhagg/GhanaAPI/issues)
- Look for issues labeled `good first issue` for beginners
- Check [feature requests](https://github.com/teebhagg/GhanaAPI/issues?q=is%3Aissue+is%3Aopen+label%3Aenhancement)
- Or propose a new feature by creating an issue

### 2. Create a Feature Branch

```bash
git checkout -b feature/descriptive-feature-name
# Examples:
# git checkout -b feature/address-bulk-validation
# git checkout -b fix/exchange-rate-caching
# git checkout -b docs/api-examples-improvement
```

### 3. Development Process

1. **Write Code** following our coding standards
2. **Add Tests** for new functionality
3. **Update Documentation** if needed
4. **Run Tests** to ensure everything works
5. **Test Manually** using the development server

### 4. Submit Pull Request

```bash
git add .
git commit -m "feat: add bulk address validation endpoint"
git push origin feature/descriptive-feature-name
```

Create a pull request with:

- Clear title describing the change
- Detailed description of what was added/changed
- Screenshots or examples if applicable
- Reference to related issues

## 🧪 Testing Guidelines

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- --testNamePattern="Address"
```

### Writing Tests

#### Unit Tests

```javascript
// src/tests/services/addressService.test.js
describe("AddressService", () => {
  describe("validateDigitalCode", () => {
    it("should validate correct digital address format", () => {
      const result = addressService.validateDigitalCode("GA-123-4567");
      expect(result.isValid).toBe(true);
    });

    it("should reject invalid digital address format", () => {
      const result = addressService.validateDigitalCode("INVALID");
      expect(result.isValid).toBe(false);
    });
  });
});
```

#### Integration Tests

```javascript
// src/tests/routes/addresses.test.js
describe("GET /v1/addresses/validate/:digitalCode", () => {
  it("should return validation result for valid address", async () => {
    const response = await request(app)
      .get("/v1/addresses/validate/GA-123-4567")
      .expect(200);

    expect(response.body.isValid).toBe(true);
    expect(response.body.digitalCode).toBe("GA-123-4567");
  });
});
```

## 📊 Code Quality Standards

### Code Style

- Use ESLint and Prettier (configured in the project)
- Follow consistent naming conventions
- Write meaningful variable and function names
- Add JSDoc comments for public functions

### API Design Principles

- RESTful endpoint design
- Consistent response formats
- Proper HTTP status codes
- Comprehensive error handling

### Performance

- Implement caching where appropriate
- Optimize database queries
- Handle rate limiting gracefully
- Monitor response times

## 📚 Documentation Requirements

When contributing, please ensure:

1. **API Documentation** - Add Swagger/OpenAPI comments to new endpoints
2. **Code Comments** - Document complex logic and business rules
3. **README Updates** - Update relevant documentation
4. **Examples** - Provide usage examples for new features

## 🔍 Review Process

### What We Look For

- **Functionality** - Does it work as intended?
- **Code Quality** - Is it well-written and maintainable?
- **Tests** - Are there adequate tests?
- **Documentation** - Is it properly documented?
- **Performance** - Does it meet performance requirements?

### Review Timeline

- Initial review within 48 hours
- Follow-up responses within 24 hours
- Final approval typically within a week

## 🏆 Recognition

Contributors are recognized in several ways:

- **Contributors List** - Listed in the project README
- **Release Notes** - Mentioned in version release notes
- **GitHub Profile** - Contributions visible on your GitHub profile
- **Community Appreciation** - Highlighted in project communications

## 💬 Getting Help

### Community Channels

- **[GitHub Discussions](https://github.com/teebhagg/GhanaAPI/discussions)** - Ask questions, share ideas
- **[Discord Server](https://discord.gg/ghana-api)** - Real-time chat with maintainers
- **[Issues](https://github.com/teebhagg/GhanaAPI/issues)** - Report bugs or request features

### Mentorship

New contributors can get mentorship from experienced contributors:

- Pair programming sessions
- Code review guidance
- Architecture discussions
- Career advice in API development

## 📜 Code of Conduct

We are committed to providing a welcoming and inclusive environment for all contributors.

## 📅 Next Steps

Ready to contribute? Here's what to do:

1. **🔍 [Browse open issues](https://github.com/teebhagg/GhanaAPI/issues)**
2. **📖 Read feature-specific contributing guides**:
   - [Address Services](./addresses)
   - [Exchange Rates](./exchange-rates)
   - [Location Data](./locations)
3. **🛠️ Set up your development environment**
4. **💬 Join our [Discord community](https://discord.gg/ghana-api)**
5. **🚀 Make your first contribution!**

---

**Thank you for contributing to GhanaAPI! Together, we're building essential infrastructure for Ghanaian developers.** 🇬🇭

:::tip First Time Contributing?
Start with issues labeled `good first issue` or check out our [beginner-friendly tasks](https://github.com/teebhagg/GhanaAPI/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22).
:::

:::info Questions?
Don't hesitate to ask questions in [GitHub Discussions](https://github.com/teebhagg/GhanaAPI/discussions) or join our [Discord server](https://discord.gg/ghana-api). We're here to help!
:::
