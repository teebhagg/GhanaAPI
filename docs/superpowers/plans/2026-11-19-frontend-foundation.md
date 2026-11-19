# Frontend foundation and shell: implementation plan

Spec: `docs/superpowers/specs/2026-11-19-frontend-foundation-design.md`
Branch: `design/frontend-foundation` (stacked on the spec commit). Implementation lands as one PR.
All paths relative to `frontend/` unless noted. Verification after every task: `npm run build && npm run lint`.

## Findings that adjust the spec

- `next-themes` is installed but **unused**: no provider, no toggle. The plan adds `ThemeProvider` (`attribute="class"`, matching the existing `@custom-variant dark`) and a toggle.
- The frontend has no status/health call. `StatusDot` pings one cheap existing endpoint via `API_BASE` in `src/lib/api.ts` (confirm the endpoint in Task 6).
- Nav is duplicated in `navbar.tsx` (`featureLinks`) and `app-dock-layout.tsx` (`dockItems`), and `overview.tsx` has a third list.
- `cobe` is only used by `ui/globe.tsx` (via `hero-globe.tsx`).
- `App.tsx` renders `Navbar` and `Footer` outside the routed layout; `AppDockLayout` wraps routes.

## Tasks

### 1. Tokens and fonts
- Install `geist` (self-hosted fonts); import Sans and Mono in `main.tsx`.
- Rewrite `:root` and `.dark` blocks in `src/index.css`: warm-neutral OKLCH scale, deep-green `--primary`/`--ring`, radius `0.3rem`, hairline `--border`. Keep every existing variable name.
- Add `--font-sans` and `--font-mono` in `@theme inline`; set `body` font.
- Add `@media (prefers-reduced-motion: reduce)` rule disabling transitions and animations.
- Check: existing pages still render (colors change, layout unchanged).

### 2. Theme provider and toggle
- Wrap `<App />` in `ThemeProvider` in `main.tsx` (`attribute="class"`, `defaultTheme="system"`).
- Add `components/shell/theme-toggle.tsx` (button, `aria-label`, sun/moon icons).

### 3. Sections config
- Add `src/lib/sections.ts`: array of `{ to, label, short, description, icon, endpoint }` for the 7 sections (overview, addresses, banking, stocks, exchange, transport, education) plus docs link.

### 4. Shell
- Add `components/shell/top-bar.tsx`, `side-rail.tsx`, `mobile-nav.tsx` (uses existing `ui/sheet`), and `app-shell.tsx` composing them around `<Outlet />`.
- Top bar: wordmark, command-palette trigger (opens a `ui/dialog` listing `sections`, filtered by input, Enter navigates, `/` or Cmd/Ctrl+K opens), GitHub link, theme toggle.
- Rail: `NavLink` list with active state (accent text + 2px left border), mono endpoint hint, visible focus rings. Hidden below `md`.
- Minimal footer line inside the shell; delete `footer.tsx`.
- `App.tsx`: remove `Navbar`/`Footer`, swap `AppDockLayout` for `AppShell`. Routes unchanged.

### 5. Primitives
- `ui/panel-header.tsx`: title, description, endpoint chip (mono) with copy-to-clipboard button and `sonner` toast.
- `ui/response-viewer.tsx`: collapsible JSON tree/pre with token-colored keys, strings, numbers; copy button.
- `ui/status-dot.tsx`: states `ok | down | unknown`, `title` + `aria-label`.
- Adopt `PanelHeader` in the 6 feature pages/panels at their top-level heading only (no internal changes).

### 6. Overview rewrite
- Replace `pages/overview.tsx` with a compact table/list from `sections`: name, mono endpoint, description, `StatusDot`, link. Keep `SEO` + `defaultStructuredData`.
- Status check: one `fetch` with 4s `AbortController` timeout to a cheap existing endpoint under `API_BASE`; failure or timeout renders "unknown", never throws, never blocks render. Confirm the endpoint against the running backend before wiring.

### 7. Removals
- Delete `app-dock-layout.tsx`, `navbar.tsx`, `hero-globe.tsx`, `ui/dock.tsx`, `ui/globe.tsx`, `ui/bento-grid.tsx`.
- `npm uninstall cobe`.
- Remove `framer-motion` entrance animations from touched files only (leave panel internals).
- `grep -rnE "dock|globe|bento|cobe|app-dock-layout" src` returns nothing.

### 8. Verify
- `npm run build` and `npm run lint` clean.
- Run the dev server; in the in-app browser load `/`, `/addresses`, `/banking`, `/stocks`, `/exchange`, `/transport`, `/education`, `/docs` in light and dark, at desktop (1280) and mobile (375). Check console for errors, tab through rail and palette for focus visibility, and toggle OS reduced-motion.
- Screenshots of overview and one panel, light and dark, attached to the PR.

### 9. Ship
- Commit in logical steps (tokens, shell, primitives, overview, removals).
- Open PR; bind with the PR tools. No attribution lines in commits or PR body.

## Risks
- Panels hard-code violet or `bg-primary/..` classes; the accent change may leave odd contrast. Fix only contrast regressions here, defer the rest to per-panel PRs.
- `geist` package bundles Next-oriented exports; use the font files from `geist/dist/fonts` via CSS `@font-face` if the JS entry is unsuitable for Vite.
