# Frontend foundation and shell redesign

Date: 2026-11-19
Status: Draft, awaiting user review
Scope: first of a series. Later PRs port each panel, then the Docusaurus theme.

## Problem

The frontend (`frontend/`) uses the stock shadcn violet theme, gradient-text headings, a floating magnifying dock, a hero globe, blurred rounded cards and fade-up animations on every element. It reads as generic and dated.

## Direction

Technical, developer-tool feel (Stripe/Linear-docs style): dense, restrained, mono accents, one sharp accent color.

## Goals

- Replace the visual foundation (tokens, type, shell) without changing routes or panel behavior.
- Existing panels adopt the new look through shared tokens, with no rewiring.
- Remove decorative components and the dependencies only they use.

## Non-goals

- Panel internals (transport, exchange, stocks, banking, addresses, education).
- Docusaurus theme (`docs/`).
- Backend changes.
- Adding a test runner.

## Design

### Tokens (`src/index.css`)

- Keep the existing shadcn variable names so `components/ui/*` keeps working.
- Warm-neutral ink scale in OKLCH, light and dark.
- One accent: deep green (Ghana palette), used only for links, focus rings and active state.
- Radius 4-6px, 1px hairline borders, no shadows by default, no gradients, no backdrop blur.
- Dark mode uses `next-themes` (installed but currently unused): add a `ThemeProvider` with the class strategy and a toggle in the top bar.

### Type

- Geist Sans (UI) and Geist Mono (endpoints, params, numbers), self-hosted, no Google Fonts round-trip.
- Left-aligned, tight headings; no centered gradient titles.

### Shell (`src/components/shell/`)

- `app-shell.tsx` replaces `app-dock-layout.tsx`.
- `top-bar.tsx`: wordmark, command palette trigger, GitHub link, theme toggle. Replaces `navbar.tsx`.
- `side-rail.tsx`: persistent section nav on desktop.
- `mobile-nav.tsx`: sheet below 768px.
- Footer reduced to a minimal line.
- A single `sections` config drives the rail, mobile nav and overview index (replaces the three duplicated lists in `navbar.tsx` and `app-dock-layout.tsx`).

### Primitives (`src/components/ui/`)

- `panel-header.tsx`: title, description, endpoint chip with copy button. Existing panels adopt this component only.
- `response-viewer.tsx`: collapsible, syntax-colored JSON.
- `status-dot.tsx`: pings one cheap existing API endpoint (the frontend has no health call today); shows "unknown" on failure or timeout and never blocks the page.

### Overview (`src/pages/overview.tsx`)

Rewritten as a compact endpoint index with live status. Hero globe removed.

### Motion

Functional transitions only (about 150ms). Respect `prefers-reduced-motion`. Remove fade-up entrances.

### Removals

`ui/dock.tsx`, `ui/globe.tsx`, `ui/bento-grid.tsx`, `hero-globe.tsx`, and the `cobe` dependency once no references remain.

### Routing

`App.tsx` swaps the layout import only. Routes are unchanged.

## Edge cases

- Rail collapses to the mobile sheet below 768px.
- Keyboard navigation and visible focus on the rail and command palette.
- Status endpoint failure degrades to "unknown".

## Verification

The frontend has no test runner and none is added.

- `npm run build` and `npm run lint` pass.
- Every route checked in the in-app browser: light and dark, desktop and mobile widths, no console errors.
- Grep confirms no references to removed components.

## Follow-ups (separate PRs)

1. Port each panel onto the new primitives, one per PR.
2. Docusaurus theme (`docs/src/css/custom.css`) to match.
