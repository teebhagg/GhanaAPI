# Frontend foundation and shell redesign

Date: 2026-11-19
Status: Revision 2, awaiting user review
Supersedes: revision 1 (technical/developer-tool direction, commit 6f4ef1f). The user found it too "techy".
Scope: first of a series. Later PRs port each panel's internals, then the Docusaurus theme.

## Problem

The frontend (`frontend/`) uses the stock shadcn violet theme, gradient-text headings, a floating magnifying dock, a hero globe, blurred cards and fade-up animations on everything. It reads as generic and dated.

## Direction

Friendly and premium, with a warm Ghana palette. Rounded elements with smooth curved edges throughout. Components are adapted from 21st.dev (no Magic MCP is connected, so they are browsed and adapted by hand). Not techy: no monospace chrome, no endpoint-first layout.

## Goals

- Replace the visual foundation (tokens, type, shell, shared primitives) without changing routes or panel behavior.
- All six panels inherit the new look through the shared `ui/*` primitives.
- Add tasteful motion that adds delight without noise.

## Non-goals

- Panel internals beyond inheriting primitives (later PRs).
- Docusaurus theme (`docs/`).
- Backend changes.
- Adding a test runner.

## Design

### Tokens (`src/index.css`)

- Keep existing shadcn variable names so `components/ui/*` keeps working.
- Light: cream background, warm charcoal text, white cards.
- Primary: gold/sunrise. Success/active: flag green. Destructive: flag red. Chart colors drawn from the same family.
- Dark: warm brown-black surfaces, same accents lightened.
- Radius base `1rem`; cards `1.5rem`; buttons, tabs, badges, inputs fully pill (`9999px`) or `1rem` for multi-line controls.
- Soft layered shadows replace hairline borders as the main separation.

### Type

- Friendly rounded sans (Plus Jakarta Sans or Nunito Sans), self-hosted variable font in `public/fonts/`.
- Sentence case, moderate weights. No monospace chrome.

### Shell (`src/components/shell/`)

- `app-shell.tsx`: page container with a floating pill nav at the top and a soft footer.
- `pill-nav.tsx`: 21st.dev-style tubelight/expandable-tabs nav with an animated sliding active indicator (framer-motion layout animation). Desktop: floating top pill. Mobile: bottom pill bar.
- Search palette (`/` or Cmd/Ctrl+K), theme toggle and `StatusDot` live in the pill nav's right end, restyled round.
- Remove the left rail, `side-rail.tsx`, `nav-list.tsx` and `mobile-nav.tsx` (sheet).
- Single `sections` config (`src/lib/sections.ts`) still drives nav, palette and overview.

### Overview (`src/pages/overview.tsx`)

- Friendly hero: headline "Open data for Ghana, ready to use", short copy, primary and secondary pill buttons, restrained animated background (soft drifting color blobs or an endpoint-name marquee).
- Feature grid of rounded cards (icon, title, one-line description, arrow) with hover lift and staggered entrance.
- A small stats strip using the new stat card.

### Primitives (`src/components/ui/`)

Restyled in place: `button`, `input`, `textarea`, `select`, `tabs`, `badge`, `card`, `table`, `dialog`, `sheet`, `tooltip`, `skeleton`, `progress`, `slider`, `checkbox`.
New: `stat-card.tsx` (value, label, trend). `PanelHeader` is restyled: friendly title and description, "Copy endpoint" soft pill. `StatusDot` is restyled as a soft badge. `ResponseViewer` is kept and softened.

### Motion

- framer-motion: spring press/hover on buttons and cards, staggered card entrance, nav indicator slide.
- All motion respects `prefers-reduced-motion` (global rule plus `useReducedMotion` where springs are used).

### Removals

Left-rail components, `ui/dock.tsx`, `ui/globe.tsx`, `ui/bento-grid.tsx`, `hero-globe.tsx` (already removed in rev 1), `cobe`.

### Routing

Unchanged.

## Edge cases

- Bottom pill bar must not cover page content: add bottom padding on mobile.
- Keyboard navigation and visible focus rings on the pill nav, palette and every restyled control.
- Contrast: gold on cream fails WCAG for text; gold is used for fills with dark text, and green or charcoal for text and links.
- Status endpoint failure degrades to "unknown".

## Verification

- `npm run build` passes; `npm run lint` clean on touched files.
- Every route checked in the in-app browser: light and dark, desktop and mobile, no new console errors.
- **The user inspects the running UI (dev server on a free port) and approves before any PR is suggested.**

## Follow-ups (separate PRs)

1. Port each panel's internals onto the new components, one per PR.
2. Docusaurus theme to match.
