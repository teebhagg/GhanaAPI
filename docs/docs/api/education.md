# Education API

The Education API provides comprehensive information about educational institutions across Ghana, including universities, colleges, senior high schools (SHS), junior high schools (JHS), and technical/vocational schools.

## Overview

This API allows you to:

- Search for schools by name, region, district, category, or grade
- Get detailed information about specific schools
- Filter schools by various criteria
- Access school statistics and analytics
- Benefit from 1-hour caching of frequently accessed queries to improve response times

All school data is sourced from the Ghana Education Service (GES) and other official educational authorities.

## Base URL

```
https://api.ghana.dev/api/v1/education
```

## School Categories & Grades

| Field         | Description                                                                                             |
| ------------- | ------------------------------------------------------------------------------------------------------- |
| `category`    | Enumerated as `UNIVERSITY`, `COLLEGE`, `SHS`, `JHS`, or `TECHNICAL_VOCATIONAL`                          |
| `grade`       | Ghana Education Service band (A–D) determined by historic performance, prestige, and regional weighting |
| `gender`      | `MALE`, `FEMALE`, or `MIXED`                                                                            |
| `residency`   | `DAY`, `BOARDING`, or `DAY_BOARDING`                                                                    |
| `doubleTrack` | Derived from the GES Double Track list and surfaced via the `metadata` object                           |

> **Note:** Schools not explicitly ranked default to `C` until official GES data provides an authoritative grade.

## Endpoints

### Search Schools

Search for educational institutions with multiple filters.

**Endpoint:** `GET /education/schools/search`

**Query Parameters:**

| Parameter  | Type   | Required | Description                                        | Example                                                       |
| ---------- | ------ | -------- | -------------------------------------------------- | ------------------------------------------------------------- |
| `name`     | string | No       | Search by school name (partial match)              | `Achimota`                                                    |
| `region`   | string | No       | Filter by region                                   | `Greater Accra`                                               |
| `district` | string | No       | Filter by district                                 | `Accra Metropolis`                                            |
| `category` | enum   | No       | Filter by school category                          | `SHS`, `UNIVERSITY`, `COLLEGE`, `JHS`, `TECHNICAL_VOCATIONAL` |
| `grade`    | enum   | No       | Filter by school grade/rating                      | `A`, `B`, `C`, `D`, `UNGRADED`                                |
| `limit`    | number | No       | Number of results per page (default: 20, max: 100) | `20`                                                          |
| `offset`   | number | No       | Number of results to skip (default: 0)             | `0`                                                           |

**Example Request:**

```bash
curl "https://api.ghana.dev/api/v1/education/schools/search?region=Greater%20Accra&grade=A&limit=10"
```

**Example Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Achimota School",
      "category": "SHS",
      "region": "Greater Accra",
      "district": "Accra Metropolis",
      "location": "Achimota",
      "grade": "A",
      "gender": "MIXED",
      "residency": "DAY_BOARDING",
      "email": "achimotashs@ges.gov.gh",
      "website": "https://achimota.edu.gh",
      "programsOffered": [
        "General Science",
        "General Arts",
        "Business",
        "Home Economics",
        "Visual Arts"
      ],
      "metadata": {
        "established": 1927,
        "motto": "Ut Omnes Unum Sint",
        "famous": true,
        "doubleTrack": false
      },
      "createdAt": "2024-11-11T10:00:00Z",
      "updatedAt": "2024-11-11T10:00:00Z"
    }
  ],
  "total": 10,
  "pagination": {
    "limit": 10,
    "offset": 0,
    "hasMore": false
  },
  "searchParams": {
    "region": "Greater Accra",
    "grade": "A",
    "limit": 10
  },
  "timestamp": "2024-11-11T12:30:00Z"
}
```

### Get All Schools

Retrieve all educational institutions with pagination.

**Endpoint:** `GET /education/schools`

**Query Parameters:**

| Parameter | Type   | Required | Description      | Default |
| --------- | ------ | -------- | ---------------- | ------- |
| `limit`   | number | No       | Results per page | 20      |
| `offset`  | number | No       | Results to skip  | 0       |

**Example Request:**

```bash
curl "https://api.ghana.dev/api/v1/education/schools?limit=20&offset=0"
```

### Get School by ID

Retrieve detailed information about a specific school.

**Endpoint:** `GET /education/schools/:id`

**Path Parameters:**

| Parameter | Type | Required | Description              |
| --------- | ---- | -------- | ------------------------ |
| `id`      | UUID | Yes      | School unique identifier |

**Example Request:**

```bash
curl "https://api.ghana.dev/api/v1/education/schools/550e8400-e29b-41d4-a716-446655440000"
```

**Example Response:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Achimota School",
  "category": "SHS",
  "region": "Greater Accra",
  "district": "Accra Metropolis",
  "location": "Achimota",
  "grade": "A",
  "gender": "MIXED",
  "residency": "DAY_BOARDING",
  "email": "achimotashs@ges.gov.gh",
  "website": "https://achimota.edu.gh",
  "programsOffered": [
    "General Science",
    "General Arts",
    "Business",
    "Home Economics",
    "Visual Arts"
  ],
  "metadata": {
    "established": 1927,
    "motto": "Ut Omnes Unum Sint",
    "famous": true
  },
  "createdAt": "2024-11-11T10:00:00Z",
  "updatedAt": "2024-11-11T10:00:00Z"
}
```

### Get Schools by Region

Retrieve all schools in a specific region.

**Endpoint:** `GET /education/schools/region/:region`

**Path Parameters:**

| Parameter | Type   | Required | Description |
| --------- | ------ | -------- | ----------- |
| `region`  | string | Yes      | Region name |

**Example Request:**

```bash
curl "https://api.ghana.dev/api/v1/education/schools/region/Greater%20Accra"
```

### Get Schools by District

Retrieve all schools in a specific district.

**Endpoint:** `GET /education/schools/district/:district`

**Path Parameters:**

| Parameter  | Type   | Required | Description   |
| ---------- | ------ | -------- | ------------- |
| `district` | string | Yes      | District name |

**Example Request:**

```bash
curl "https://api.ghana.dev/api/v1/education/schools/district/Accra%20Metropolis"
```

### Get Schools by Category

Retrieve all schools of a specific type/category.

**Endpoint:** `GET /education/schools/category/:category`

**Path Parameters:**

| Parameter  | Type | Required | Description                                                                    |
| ---------- | ---- | -------- | ------------------------------------------------------------------------------ |
| `category` | enum | Yes      | School category: `UNIVERSITY`, `COLLEGE`, `SHS`, `JHS`, `TECHNICAL_VOCATIONAL` |

**Example Request:**

```bash
curl "https://api.ghana.dev/api/v1/education/schools/category/SHS"
```

### Get Schools by Grade

Retrieve all schools with a specific grade/rating.

**Endpoint:** `GET /education/schools/grade/:grade`

**Path Parameters:**

| Parameter | Type | Required | Description                                  |
| --------- | ---- | -------- | -------------------------------------------- |
| `grade`   | enum | Yes      | School grade: `A`, `B`, `C`, `D`, `UNGRADED` |

**Example Request:**

```bash
curl "https://api.ghana.dev/api/v1/education/schools/grade/A"
```

### Get School Statistics

Retrieve statistical information about schools.

**Endpoint:** `GET /education/schools/statistics`

**Example Request:**

```bash
curl "https://api.ghana.dev/api/v1/education/schools/statistics"
```

**Example Response:**

```json
{
  "totalSchools": 721,
  "byCategory": {
    "SHS": 650,
    "TECHNICAL_VOCATIONAL": 50,
    "UNIVERSITY": 10,
    "COLLEGE": 8,
    "JHS": 3
  },
  "byGrade": {
    "A": 15,
    "B": 120,
    "C": 450,
    "D": 100,
    "UNGRADED": 36
  },
  "byRegion": {
    "Greater Accra": 85,
    "Ashanti": 95,
    "Central": 65,
    "Western": 70,
    "Eastern": 60,
    "Northern": 45
  },
  "timestamp": "2024-11-11T12:30:00Z"
}
```

## Data Model

### School Object

| Field               | Type     | Description                                                           |
| ------------------- | -------- | --------------------------------------------------------------------- |
| `id`                | UUID     | Unique identifier                                                     |
| `name`              | string   | School name                                                           |
| `nickname`          | string   | Common alias or informal name (optional)                              |
| `category`          | enum     | School category (UNIVERSITY, COLLEGE, SHS, JHS, TECHNICAL_VOCATIONAL) |
| `region`            | string   | Region location                                                       |
| `district`          | string   | District location                                                     |
| `location`          | string   | Specific location/address (optional)                                  |
| `grade`             | enum     | School rating (A, B, C, D, UNGRADED)                                  |
| `gender`            | enum     | Gender composition (MALE, FEMALE, MIXED)                              |
| `residency`         | enum     | Residency type (DAY, BOARDING, DAY_BOARDING)                          |
| `email`             | string   | Contact email (optional)                                              |
| `phone`             | string   | Primary phone number (optional)                                       |
| `website`           | string   | Official website (optional)                                           |
| `boxAddress`        | string   | Postal or box address (optional)                                      |
| `establishedYear`   | number   | Year the institution was founded (optional)                           |
| `studentPopulation` | number   | Approximate enrollment count (optional)                               |
| `programsOffered`   | array    | List of programs/courses offered                                      |
| `metadata`          | object   | Additional information (optional)                                     |
| `createdAt`         | datetime | Creation timestamp                                                    |
| `updatedAt`         | datetime | Last update timestamp                                                 |

## School Grading System

Schools are graded based on academic performance and reputation:

- **Grade A**: Top-tier schools with excellent academic records and national recognition (e.g., Achimota School, Prempeh College, Wesley Girls High School)
- **Grade B**: Strong regional performers with good academic standing
- **Grade C**: Standard schools with average performance
- **Grade D**: Schools needing improvement
- **UNGRADED**: Schools without sufficient performance data

## Caching

The Education API implements intelligent caching to improve performance:

- Search results are cached for 1 hour
- Individual school data is cached for 1 hour
- Statistics are cached for 1 hour

## Error Responses

### 400 Bad Request

```json
{
  "statusCode": 400,
  "message": "Invalid category: INVALID. Valid categories are: UNIVERSITY, COLLEGE, SHS, JHS, TECHNICAL_VOCATIONAL",
  "error": "Bad Request"
}
```

### 404 Not Found

```json
{
  "statusCode": 404,
  "message": "School with ID 550e8400-e29b-41d4-a716-446655440000 not found",
  "error": "Not Found"
}
```

### 500 Internal Server Error

```json
{
  "statusCode": 500,
  "message": "Failed to search schools",
  "error": "Internal Server Error"
}
```

## Data Sources

All educational data is currently sourced from:

1. **SHS Select** – Public directory of Ghanaian Senior High Schools (Category A/B/C) with rich metadata and contact details. Data is collected via HTML parsing of the paginated list and school detail pages at [https://shsselect.com/schools](https://shsselect.com/schools).
2. **Ghana Education Service (GES)** – Historical PDF datasets used for cross-checking and filling gaps (e.g. SHS/TVET Schools List, Double Track Schools Listing).
3. **Ministry of Education (MoE)** – Official institutions directory referenced for validation when discrepancies are detected.
4. **WAEC Ghana** – Supplementary school performance data for verification.

## Data Pipeline & Seeding

The dataset is regenerated by crawling SHS Select and writing the results to a snapshot before seeding the database.

```bash
# From the backend directory
npm run prisma:generate
npm run schools:export   # writes data/shs-select-schools.json
# ↳ review the JSON snapshot, then
npm run schools:seed     # loads the snapshot into PostgreSQL
```

The export step performs the crawl once, producing a human-readable JSON file at `backend/data/shs-select-schools.json` (Senior High Schools) alongside curated tertiary data at `backend/data/public-universities.json`. After you confirm the contents, the seed step reads both snapshots and replaces the contents of the `School` table.

The pipeline:

1. Iterate through every paginated results page on `https://shsselect.com/schools` to capture all 950+ school slugs.
2. Visit each school’s detail page to collect category, gender, residency, district, region, programmes, contact details, highlights, and coordinates.
3. Normalise the data (title casing, district/region matching, grade mapping from Category A/B/C to `SchoolGrade`, gender/residency enums, etc.) and persist it in the JSON snapshot.
4. Load the snapshot into PostgreSQL with Prisma `createMany`, replacing any existing records in a single transaction.

To inspect the parsed records interactively, you can run Prisma Studio after seeding:

```bash
npm run prisma:studio
```

If the upstream site changes its markup, the scraper may need to be adjusted. Keep the old GES PDFs handy for validation when large discrepancies are detected.
