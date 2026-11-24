---
sidebar_position: 4
---

# Curriculum API

The Curriculum API exposes Ghana's combined **Science Curriculum for Basic 7–10 and General Science Curriculum for SHS 1–3** from GES, NaCCA, and Ghana's Ministry of Education.

Base URL: `https://api.ghana-api.dev/api/v1/education/curriculum`

## Endpoints

- `GET /` — curriculum entries, optionally filtered by `year`, `subject`, `strand`, `substrand`, `limit`, and `offset`
- `GET /summary` — curriculum summary and publication metadata
- `GET /content-standards` — content standards, with the same hierarchy filters
- `GET /strands` — all strands and substrands across the curriculum
- `GET /levels` — available levels: SHS 1, SHS 2, SHS 3

Example:

```bash
curl "https://api.ghana-api.dev/api/v1/education/curriculum?year=SHS%201&subject=General%20Science"
curl "https://api.ghana-api.dev/api/v1/education/curriculum/content-standards?year=SHS%201"
```

## Data provenance

The combined dataset includes Basic 7, Basic 8, Basic 9, Basic 10, SHS 1, SHS 2, and SHS 3. Source-specific publisher, publication date, and PDF metadata are available in the `sources` field returned by `GET /summary`. The dataset retains source page values (`source_page` or `source_pdf_pages`) supplied by each extraction.

The combined extraction contains 103 content standards and 131 learning indicators. Some descriptions are empty because they were not available in the extracted text. These values are preserved as supplied; the API does not invent or silently correct curriculum content.
