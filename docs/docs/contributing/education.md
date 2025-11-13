# Contributing to Education Services

The Education module powers GhanaAPI's national directory of educational institutions. It aggregates official Ghana Education Service (GES) datasets into a searchable API backed by PostgreSQL and Prisma. This guide explains how the feature works and how you can contribute.

## 🎓 Current Education Features

### Implemented

- **School Search API** – Filter by region, district, category (SHS, JHS, University, TVET), grade (A–D), and free-text query
- **School Detail Endpoint** – Retrieve full metadata including programs offered, residency type, and contact details
- **Regional & District Browsing** – Dedicated routes for region/district listings
- **Statistics Endpoint** – Aggregated counts by category, grade, and region for analytics dashboards
- **Swagger Documentation** – Full OpenAPI coverage with request/response schemas and examples

### Data Pipeline Features

- 🌐 Live scraping of SHS Select (paginated list + detail pages) using Cheerio and Axios
- 🧭 Region/district normalization against `locations/data/regions.json`
- 🏫 School grading heuristic that maps Category A/B/C into `SchoolGrade`
- 🔁 Built-in retry/resiliency for HTTP requests and graceful logging when upstream data is missing
- 📬 Contact enrichment (email, phone, postal box) plus optional metadata like nicknames, founding year, and population
- 📦 Export + seed workflow: `npm run schools:export` writes `data/shs-select-schools.json`, review it, then `npm run schools:seed` to merge SHS Select and `public-universities.json` into PostgreSQL
- 📦 Prisma seed script (`npm run prisma:seed`) is retained for backwards compatibility but the JSON-driven flow is recommended for verification

## 🧱 Architecture Overview

### Key Files

```
backend/src/education/
├── education.module.ts          # Nest module wiring (HTTP + cache + Prisma)
├── education.controller.ts      # REST endpoints + Swagger annotations
├── education.service.ts         # Business logic and caching
├── dto/                         # Request/response DTOs
│   ├── school-search.dto.ts
│   ├── school-search-response.dto.ts
│   ├── school.dto.ts
│   └── create-school.dto.ts
├── entities/
│   └── school.entity.ts         # Shared enums and interfaces
├── services/
│   ├── prisma.service.ts        # Prisma client lifecycle wrapper
│   └── school-data-provider.service.ts
└── utils/
    ├── ges-school-parser.ts     # Legacy PDF parser (kept for cross-checking)
    └── shs-select-scraper.ts    # Primary SHS Select HTML scraper

backend/prisma/
├── schema.prisma                # `School` model + enums + indexes
└── seed.ts                      # Seeds database with scraped SHS Select data
```

### Data Flow

1. **Seed Script (`prisma/seed.ts`)**
   - Crawls every page of the SHS Select list to gather school slugs
   - Fetches each detail page (programmes, contact info, map coordinates, metadata)
   - Normalizes region/district names and converts Category A/B/C → `SchoolGrade`
   - Stores the schools via Prisma `createMany`
2. **SchoolDataProviderService**
   - Caches the scraped dataset (1-hour TTL) and exposes it to the main service
3. **EducationService**
   - Executes Prisma queries with filtering, pagination, and caching
4. **EducationController**
   - Validates input via DTOs and exposes REST endpoints with OpenAPI metadata

## 🚀 Getting Started

### Local Database Setup

```bash
# Generate Prisma client
npm run prisma:generate

# Run migration (if new fields were added)
npm run prisma:migrate

# Refresh data from GES PDFs
npm run prisma:seed
```

### Running the API

```bash
npm run start:dev
# Swagger docs with Education tag available at http://localhost:3000/api/v1/docs
```

## 🧭 Contribution Ideas

### Beginner-Friendly

- Improve Swagger response examples for new education endpoints
- Add unit tests for DTO validation edge cases
- Expand sample requests/responses in `docs/docs/api/education.md`
- Improve error messages when filters return zero results

### Intermediate

- Enhance search relevance (e.g., fuzzy matching, multi-term queries)
- Add pagination metadata (next/prev cursors) alongside offset/limit
- Implement additional filters (programs offered, residency type)
- Expose `doubleTrack` metadata in API responses with documentation

### Advanced

- Support incremental data refresh instead of full re-seed
- Integrate additional data sources (e.g., tertiary institutions directory)
- Add job queue for scheduled PDF ingestion and change detection
- Implement audit trails for data provenance and manual corrections

## 🧪 Testing Checklist

```bash
# Run unit tests for education module
npm run test -- education

# Execute seed script in dry-run mode (coming soon) or manual verification
npm run prisma:seed
```

Recommended test cases when contributing:

- Filters: combinations of `region`, `district`, `category`, `grade`, and text query
- Pagination: limits, offsets, and `hasMore` flag accuracy
- Stats endpoint: verify counts after seeding/reseding
- Error handling: invalid enums, region/district typos, missing query parameters

## 📚 Documentation Updates

When adding features or schema changes, please update:

- `docs/docs/api/education.md` – API reference and examples
- `docs/docs/contributing/education.md` (this file)
- `docs/docs/api/IMPLEMENTATION_STATUS.md` – Status tables
- `docs/docs/CHANGELOG.md` – Include version bump summary
- Swagger comments in `education.controller.ts`