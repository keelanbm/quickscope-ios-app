# Quickscope iOS Architecture (MVP)

## 1) Purpose

Define the MVP architecture for the iOS app so implementation can proceed with minimal ambiguity.

This document is intended for internal review with product, engineering, and any external approvers.

## 2) Product and Technical Constraints

- Timeline: 8-10 weeks (aggressive)
- Scope: Companion core parity with existing mobile web behavior
- Wallet: Phantom-first via Phantom Connect SDK and Expo template
- Backend strategy: Reuse current APIs and websocket infrastructure wherever possible
- Non-goal: full desktop dashboard editing parity in v1

## 3) High-Level System Context

The iOS app will sit as another client of the existing Quickscope backend stack.

- iOS client (Expo RN) -> Quickscope HTTP API (`public/*`, `private/*`, `tx/*`, `auth/*`)
- iOS client -> Quickscope websocket stream for live token/market updates
- iOS client <-> Phantom app/SDK for wallet connect and signing
- iOS client -> Telegram link/share backend endpoints for social workflows

## 4) Planned Repository Layout

This repo will evolve into:

- `apps/ios`
  - Expo app
  - navigation, screens, native UX, app lifecycle
- `packages/core`
  - shared API client wrappers
  - request/response types
  - domain utilities and data mappers
- `docs`
  - architecture and delivery plans
- `tasks`
  - PRDs and planning documents

## 5) App Layering

### 5.1 Presentation Layer

- Primary bottom-nav modules: discover, scope/feeds, search, tracking, portfolio
- Secondary routes: telegram/social deep-link surface, dev console, and other deep-link targets
- Shared UI primitives for tables/lists/cards and action surfaces
- Deep-link entry points for token/trade contexts

### 5.2 Application Layer

- Feature modules:
  - Auth + session orchestration
  - Wallet and signing orchestration
  - Trading flows
  - Portfolio/positions
  - Telegram link/share flows
  - View/table config sync
- Navigation + route guards based on auth/session state

### 5.3 Data Layer

- API transport with consistent request/response handling
- Authenticated/private endpoint gating
- Retry, caching, and polling strategies per feature
- Websocket subscription manager for live updates

### 5.4 Integration Layer

- Phantom Connect SDK integration
- Native storage for secure session persistence
- Deep linking integration (Telegram to iOS app route mapping)

## 6) Feature Inclusion Matrix (MVP)

Included:

- Discovery and tracking read flows
- Trade execution flows using existing trade endpoints
- Portfolio + positions views
- Supported table/view config import and sync
- Telegram link/unlink and token sharing

Deferred:

- Full dashboard edit/drag/drop parity
- Discord integration (architecture hooks only)
- Advanced desktop-only power tooling

## 7) Auth, Wallet, and Session Model

Planned model:

1. User connects Phantom via Phantom Connect SDK
2. App requests backend challenge (`auth/challenge`)
3. User signs challenge with Phantom
4. App submits solution (`auth/solution`)
5. App persists auth session metadata securely and refreshes via `auth/refresh`

Critical validation point:

- Confirm whether cookie-based auth flow works reliably in Expo RN clients in production environments.
- If not, define a mobile token-header strategy with backend support.

## 8) API and Backend Contract Assumptions

Assume reuse of existing backend method families:

- `auth/*` for challenge/solution/refresh/revoke
- `public/*` for market and read data
- `private/*` for user-scoped settings/watchlists/telegram/share
- `tx/*` for trading and account transaction operations

Working assumption:

- Most endpoints remain unchanged.
- Backend changes, if needed, should be limited to auth/session edge behavior and native Telegram auth handoff compatibility.

## 9) Realtime/Data Freshness Strategy

- Use websocket feeds for high-value live surfaces (prices, token activity)
- Use polling for secondary screens where websocket is not necessary
- Define per-screen freshness budgets to balance latency and battery use

## 10) Security and Compliance

- Use secure device storage for session artifacts
- Never store private keys in app storage
- Route all signing through Phantom
- Prepare App Store review artifacts and disclosures for trading functionality

## 11) Observability and Reliability

- Track onboarding, deep-link opens, trade attempts, trade success/failures, and retention events
- Add crash and error monitoring in pre-production
- Define release gates: crash-free sessions, critical-flow pass rate, and trade success thresholds

## 12) Open Architecture Decisions (Needs Review)

1. Phantom-only for v1 vs fallback wallet option
2. Cookie-based mobile auth vs token-header auth for native reliability
3. Required table/view parity depth for v1 import/sync
4. Push notifications in v1 vs post-launch
5. Rollout strategy (cohort/geo gated vs broad release)

## 13) Acceptance Criteria for Architecture Sign-off

- Stakeholders agree on MVP feature inclusion/exclusion
- Wallet and auth strategy is explicitly locked
- Backend team confirms required changes (if any) and timeline impact
- Week 1 execution plan is approved and staffed
