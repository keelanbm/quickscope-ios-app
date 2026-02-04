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

### IOS-103 - Auth/session integration hardening (in progress)

- Added `AuthSessionProvider` with explicit status machine:
  - `bootstrapping` -> `unauthenticated`/`authenticated`
  - `authenticating` -> `authenticated`/`error`
  - `refreshing` -> `authenticated`/`unauthenticated`
- Added secure session persistence via Expo Secure Store.
- Added app foreground refresh policy when access token is stale and refresh token remains valid.
- Added wallet/session mismatch invalidation so account-switch state is deterministic.
- Added session wallet persistence (with legacy secure-store fallback support).

### IOS-105 - Quality and test harness setup (in progress)

- Added CI lane at `.github/workflows/ios-checks.yml`:
  - lint
  - typecheck
  - unit tests
- Added unit coverage for auth-session utility logic:
  - expiration parsing
  - skew handling
  - wallet selection and wallet-change invalidation
- Documented the selected Week 2 smoke path in `apps/ios/README.md`.

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

## QA Snapshot

- Week 1 auth flow: passed (Phantom connect + challenge + sign).
- Week 1 deep links: passed (token/trade/portfolio/telegram + fallback).
- Week 1 websocket spike: passed (`public/slotTradeUpdates` subscribed and streaming).

## Remaining Week 2 Focus

1. Finish IOS-103 with explicit account-switch/logout QA matrix on simulator + device
2. Finish IOS-105 by validating workflow on first remote push and collecting baseline timings
3. Expand Discovery with final field prioritization and action hooks from design review
4. Convert Scope placeholder to first data-fed surface
