# Frontend foundation and shell: implementation plan (revision 2)

Spec: `docs/superpowers/specs/2026-11-19-frontend-foundation-design.md` (friendly, rounded, warm Ghana palette).
Branch: `design/frontend-foundation`. Revision 1 (techy) is commit `6f4ef1f`; this plan reworks it in place.
All paths relative to `frontend/`. After every task: `npm run build` and `npx eslint <touched files>`.
**Gate: no PR is suggested until the user has inspected the running UI (free-port dev server) and approved.**

## Carry over from revision 1 (keep)

`ThemeProvider` + `theme-toggle.tsx`, `lib/sections.ts`, `hooks/use-api-status.ts`, `command-palette.tsx`, `FeaturePage` -> `PanelHeader` wiring, `API_BASE` export, removal of dock/globe/bento/cobe, per-page `endpoint` props.

## Remove (techy leftovers)

`shell/side-rail.tsx`, `shell/nav-list.tsx`, `shell/mobile-nav.tsx`, and the Geist font files in `public/fonts/` (`ui/response-viewer.tsx` is kept and softened).

## Tasks

### 1. Tokens and font
- Replace Geist with a self-hosted rounded sans (Plus Jakarta Sans variable woff2 into `public/fonts/`; update `@font-face` and `--font-sans`; drop `--font-mono` chrome usage).
- Rewrite `:root` / `.dark` in `src/index.css`: cream background, warm charcoal text, gold primary with dark `primary-foreground`, flag green (`--success`) and red `--destructive`, warm brown-black dark mode. Keep every shadcn variable name; add `--success`, `--success-foreground`, `--shadow-soft`, `--shadow-lift`.
- Radius base `1rem`; expose `--radius-pill`. Keep reduced-motion rule.
- Contrast check: text on gold uses charcoal; links and active text use green or charcoal (WCAG AA).

### 2. Restyle primitives in place (`components/ui/`)
- `button`: pill, soft shadow, spring press (`active:scale-[0.97]`), gold primary, soft secondary/outline variants.
- `input`, `textarea` (1rem radius), `select` (trigger pill, content `rounded-2xl`, items `rounded-xl`), `checkbox`, `slider`, `progress`: rounded, soft focus ring.
- `tabs`: pill track with sliding active pill (21st.dev style; framer-motion `layoutId` in `TabsTrigger` where practical, else CSS).
- `badge`: pill. `card`: `rounded-3xl`, shadow instead of border, optional hover-lift variant.
- `table`: rounded container, row hover, softened header.
- `dialog`, `sheet`, `tooltip`, `skeleton`, `alert`: larger radii, soft shadows.
- Add `ui/stat-card.tsx` (value, label, optional trend badge, icon).
- Restyle `panel-header.tsx` (friendly title, "Copy endpoint" soft pill, no `GET` mono chip), `status-dot.tsx` (soft badge), soften `response-viewer.tsx`.

### 3. Pill nav shell
- Add `shell/pill-nav.tsx`: 21st.dev tubelight/expandable-tabs style; items from `sections` plus Overview; framer-motion `layoutId` sliding indicator; icon + label (label collapses to icon on narrow desktop).
  - Desktop: floating, centered, `sticky top-4`, rounded-full, soft shadow, blur-free solid surface.
  - Mobile (<768px): fixed bottom pill bar, icon-only with active label.
  - Right end: command-palette trigger, theme toggle, `StatusDot`.
- Rewrite `shell/app-shell.tsx`: top spacing for nav, `pb-28` on mobile for the bottom bar, rounded soft footer.
- Update `top-bar.tsx` into a slim brand mark (logo + "GhanaAPI") or fold into the pill nav; delete unused shell files listed above.
- Restyle `command-palette.tsx` (rounded-3xl dialog, pill input, rounded items).
- Keyboard: arrow-key focus, visible rings, `aria-current="page"`.

### 4. Overview
- Rewrite `pages/overview.tsx`:
  - Hero: headline "Open data for Ghana, ready to use", subcopy, primary "Explore the APIs" and secondary "API playground" pills, animated background (drifting blurred gold/green/red blobs, `useReducedMotion` aware).
  - Stats strip using `StatCard` (e.g. 6 API areas, 100% open, REST/JSON; static values, no fake metrics).
  - Feature grid: rounded cards from `sections` with icon chip, title, description, arrow; hover lift; staggered entrance (`framer-motion`).
  - Keep `SEO` + `defaultStructuredData`.
- Browse 21st.dev (in-app browser) for hero, card, nav and animation references; adapt code by hand to the tokens, citing nothing verbatim that needs a license beyond what the registry allows. Record source URLs in the PR body.

### 5. Motion polish
- Shared motion presets in `lib/motion.ts` (spring, stagger, fade-up) used by overview and cards.
- Page transitions: light fade on route change only.
- Verify `prefers-reduced-motion` disables springs and blobs.

### 6. Verify
- `npm run build` clean; eslint clean on touched files.
- Dev server on a free port; check every route (`/`, `/addresses`, `/banking`, `/stocks`, `/exchange`, `/transport`, `/education`, `/docs`) light and dark, desktop and mobile; console clean apart from backend-offline fetches; keyboard-tab through nav, palette, tabs, selects.
- Hand the user the URL and wait for feedback. Iterate until approved.

### 7. Ship (only after user approval)
- Commit in logical steps; push and open the PR only when the user says so. No attribution lines.

## Risks
- Panels carry hard-coded classes (`bg-primary/..`, violet-era gradients, `rounded-3xl` cards with blur); expect contrast tweaks after the palette change. Fix regressions only; defer cleanup to per-panel PRs.
- Gold primary on cream is low contrast for text; enforce the fill-only rule.
- Sliding tab indicator via `layoutId` needs unique ids per `Tabs` instance.
