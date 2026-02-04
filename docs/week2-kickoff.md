# Week 2 Kickoff (Execution Start)

Date: 2026-02-04

## Objective

Move from Week 1 spikes to Week 2 production foundations:

- navigation hardening and route safety
- shared core package bootstrap
- mobile design token baseline

## Work Started

### IOS-101 - Core navigation shell productionization

- Added route-level error boundaries.
- Added auth route gates for Search (trade route), Portfolio, Tracking, Telegram surfaces.
- Preserved deep-link behavior and safe fallback routing.
- Updated primary bottom-nav IA to match current mobile direction:
  - Discover
  - Scope
  - Search
  - Tracking
  - Portfolio
- Moved Dev/Telegram deep-link/auxiliary routes off primary tab bar (still routable).
- Added temporary top-left `Q` header shortcut to open hidden Dev Console during development.

### IOS-102 - `packages/core` bootstrap

- Created `packages/core` with shared RPC transport factory and shared types.
- Prepared package-level exports and structure for app consumption in the next monorepo wiring step.

### IOS-104 - Design system baseline for mobile

- Added base design tokens (`colors`, `radius`, `spacing`) under `apps/ios/src/theme/tokens.ts`.
- Updated card/screen styling to use shared tokens.

### IOS-103 - Auth/session integration hardening

- Added `AuthSessionProvider` with explicit status machine:
  - `bootstrapping` -> `unauthenticated`/`authenticated`
  - `authenticating` -> `authenticated`/`error`
  - `refreshing` -> `authenticated`/`unauthenticated`
- Added secure session persistence via Expo Secure Store.
- Added app foreground refresh policy when access token is stale and refresh token remains valid.
- Added wallet/session mismatch invalidation so account-switch state is deterministic.
- Added session wallet persistence (with legacy secure-store fallback support).
- Added explicit account-switch/logout QA matrix with simulator/device acceptance criteria:
  - `docs/ios-103-auth-qa-matrix.md`

### IOS-105 - Quality and test harness setup

- Added CI lane at `.github/workflows/ios-checks.yml`:
  - lint
  - typecheck
  - unit tests
- Added unit coverage for auth-session utility logic:
  - expiration parsing
  - skew handling
  - wallet selection and wallet-change invalidation
- Added unit coverage for secure-store session persistence and legacy token fallback:
  - `apps/ios/src/features/auth/sessionStorage.test.ts`
- Documented the selected Week 2 smoke path in `apps/ios/README.md`.
- Expanded CI trigger coverage so branch pushes are validated early:
  - `.github/workflows/ios-checks.yml` now runs on `codex/**` pushes and `workflow_dispatch`.
- Collected local quality-lane baseline timings (MacBook local run, 2026-02-04):
  - `npm run lint`: ~1.48s
  - `npm run check-types`: ~0.84s
  - `npm run test:ci`: ~1.49s
- Validated first remote CI run on branch push (GitHub Actions run #1, 2026-02-04):
  - URL: https://github.com/keelanbm/quickscope-ios-app/actions/runs/21684731224
  - Result: `success`
  - Step timings:
    - Install deps: ~27s
    - Lint: ~3s
    - Typecheck: ~2s
    - Unit tests: ~3s

### IOS-201 - Discovery first real mobile surface (started early)

- Replaced Discovery placeholder with a real API-fed list UI.
- Added three product-named sub-tabs to match mobile direction:
  - Trending
  - Scan Feed
  - Gainers
- Wired each sub-tab to `public/filterTokensTable` with tab-specific sorting.
- Shifted Discovery list from card blocks to traditional row/table presentation.
- Added row-level actions and metadata:
  - platform tag
  - links (`X`, `TG`, `Web`) when available
  - copy token address
  - star toggle
  - quick trade action (`Trade` tab deep-link style navigation payload)

### IOS-202 - Scope first data-fed surface

- Replaced Scope placeholder with API-fed list rendering.
- Added Scope sub-tabs:
  - New Pairs
  - Momentum
  - Scan Surge
- Wired each tab to `public/filterTokensTable` with tab-specific sorting.
- Added row-level quick actions:
  - copy token mint
  - open token in `Search` tab context

### Week 3 Prep - token entry flow and list performance

- Added Week 3 prep brief for token-detail/trade-entry stack shape and list performance baseline checks:
  - `docs/week3-prep-token-flow-and-perf.md`

## QA Snapshot

- Week 1 auth flow: passed (Phantom connect + challenge + sign).
- Week 1 deep links: passed (token/trade/portfolio/telegram + fallback).
- Week 1 websocket spike: passed (`public/slotTradeUpdates` subscribed and streaming).

## Remaining Week 2 Focus

1. Execute IOS-103 manual matrix runs (simulator + physical device) and log pass/fail notes
2. Run Scope/Discovery live data QA on simulator and physical device
3. Finalize Week 3 token-detail ticket breakdown from prep notes
