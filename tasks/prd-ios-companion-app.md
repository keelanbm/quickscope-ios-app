# PRD: Quickscope iOS Companion App (MVP)

## Introduction / Overview

Build an iOS app that serves as a **companion to the current mobile web experience**, focused on the highest-value workflows for users coming from Telegram:

- Import/sync table views from existing Quickscope data
- Trade tokens quickly
- View positions and portfolio state
- Share tokens/events to Telegram chats

The goal is not full web parity in v1. The goal is to create a faster mobile-native path that improves retention and trade activity.

## Goals

- Ship an iOS MVP in an aggressive 8-10 week window
- Match current mobile web core workflows (discovery, trade, portfolio, tracking, Telegram)
- Increase mobile user retention (primary)
- Increase trade execution volume from mobile (primary)
- Use **Phantom Connect SDK + Expo template** as the default wallet/signing path for v1
- Maintain one shared product model so Discord can be added later with minimal rework

## User Stories

### US-001: iOS app shell and navigation parity
**Description:** As a Quickscope user, I want a native iOS shell with familiar navigation so I can move between core sections quickly.

**Acceptance Criteria:**
- [ ] App includes Discovery, Scope/Feeds, Trade, Portfolio, Tracking, and Telegram-access flows
- [ ] Navigation and screen labels map clearly to existing mobile web concepts
- [ ] Deep links open the correct screen context (token/trade/portfolio views)
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-002: Shared API/domain package for iOS + web
**Description:** As an engineer, I want shared API and domain logic so the iOS app reuses existing backend contracts and reduces drift.

**Acceptance Criteria:**
- [ ] Shared package created for API client(s), request/response types, and core business models
- [ ] iOS app consumes shared package for trade, positions, telegram, watchlist, and dashboard/table schema calls
- [ ] Web app remains compatible with shared package after migration
- [ ] Typecheck/lint passes

### US-003: Phantom wallet connection and account state on iOS
**Description:** As a user, I want to connect Phantom quickly and keep my wallet session so I can trade without repeated setup.

**Acceptance Criteria:**
- [ ] iOS app bootstraps wallet flows from the Phantom Expo template
- [ ] iOS app integrates Phantom Connect SDK for connect/disconnect and session restore
- [ ] User can sign messages and transactions through Phantom for existing auth/trade flows
- [ ] Session persistence works across app restarts
- [ ] Account context loads without requiring repeated wallet reconnection in normal use
- [ ] Typecheck/lint passes

### US-004: Import/sync table and view configurations
**Description:** As a user, I want my key table/view configurations in iOS so I do not rebuild my setup from scratch.

**Acceptance Criteria:**
- [ ] iOS app can fetch and display server-backed dashboard/table schemas for supported pages
- [ ] Supported table settings (visible columns, sort, filters) render correctly on mobile
- [ ] Unsupported desktop-only settings fail gracefully with fallback behavior
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-005: Token discovery and tracking workflows
**Description:** As a user, I want discovery and tracking on iOS so I can monitor opportunities while away from desktop.

**Acceptance Criteria:**
- [ ] Discovery and tracking screens show token data with mobile-optimized list/table layouts
- [ ] Token detail entry points open trade context in one tap
- [ ] Watchlist/tracking states remain consistent with backend data
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-006: Trade execution workflow on iOS
**Description:** As a trader, I want fast buy/sell execution in iOS so I can act from Telegram-driven opportunities.

**Acceptance Criteria:**
- [ ] User can execute buy/sell using existing trade endpoints
- [ ] Slippage, fee, and confirmation states are shown before submit
- [ ] Success/failure and pending transaction states are clearly surfaced
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-007: Portfolio and positions on iOS
**Description:** As a user, I want portfolio and position visibility so I can track PnL and risk from my phone.

**Acceptance Criteria:**
- [ ] Portfolio summary, key balances, and position list are available in iOS
- [ ] Position detail view includes essential trade/PNL context
- [ ] Data refresh behavior is documented and predictable
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-008: Telegram connection and share flows
**Description:** As a user, I want Telegram linking and share-to-chat actions in iOS so I can keep my current workflow.

**Acceptance Criteria:**
- [ ] User can link/unlink Telegram account using existing backend challenge/solution flow
- [ ] User can select chats and share token data from iOS
- [ ] Errors (not linked/no chats/network failure) are handled with clear user feedback
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-009: Social channel abstraction for future Discord
**Description:** As a product team, I want social-sharing logic abstracted so Discord support can be added without major rewrites.

**Acceptance Criteria:**
- [ ] Share actions use a channel abstraction layer (e.g., Telegram now, Discord later)
- [ ] Current Telegram behavior remains unchanged
- [ ] Additive integration path for Discord is documented
- [ ] Typecheck/lint passes

### US-010: Analytics and release readiness
**Description:** As a team, I want instrumentation and release gates so we can measure outcomes and ship safely.

**Acceptance Criteria:**
- [ ] Events are tracked for onboarding, deep-link opens, trade attempts, trade success, and retention cohorts
- [ ] Crash/error monitoring is configured for iOS builds
- [ ] TestFlight checklist and go/no-go criteria are documented
- [ ] Typecheck/lint passes

## Functional Requirements

- FR-1: The app must use **Expo React Native + TypeScript** for iOS MVP delivery.
- FR-2: The app must use **Phantom Connect SDK** and start from Phantom's Expo template for wallet integration.
- FR-3: The app must support the same core route concepts as current mobile web: discovery, scope/feeds, trade, portfolio, tracking, telegram.
- FR-4: The app must support deep links from Telegram contexts into relevant token/trade screens.
- FR-5: The app must support existing authenticated API flows for account, trade, schema, and telegram data.
- FR-6: The app must support importing/syncing supported table/view configuration from backend schema endpoints.
- FR-7: The app must support buy/sell trading using existing backend trade endpoints and show pre-submit + post-submit state.
- FR-8: The app must show portfolio and positions with clear refresh and loading states.
- FR-9: The app must support Telegram link/unlink and token share to selected Telegram chats.
- FR-10: The app must provide a social-share service abstraction with Telegram as the first provider.
- FR-11: The app must instrument critical funnel events for retention and trade volume metrics.
- FR-12: The app must meet iOS app release requirements (build signing, TestFlight distribution, privacy declarations).
- FR-13: Unsupported desktop-only widget/table capabilities must degrade gracefully on iOS.
- FR-14: The app must show clear fallback UX if Phantom is unavailable or disconnected (install/reconnect path).

## Non-Goals (Out of Scope)

- Full desktop dashboard-editing parity in iOS v1
- Discord posting integration in iOS v1 (design for extension only)
- Android launch in this phase
- Advanced automation/power-user desktop tooling parity
- Complete migration away from mobile web; web remains supported

## Design Considerations

- Keep IA and naming close to current mobile web to reduce relearning
- Prioritize one-hand operation and fast token-to-trade transition
- Optimize key actions for Telegram-origin sessions (open app, inspect, trade, share)
- Keep table layouts readable on small widths; use progressive detail disclosure instead of dense desktop grids

## Technical Considerations

- **Recommended stack (selected):**
  - Expo React Native (managed workflow)
  - Phantom Connect SDK
  - Phantom Expo template as iOS wallet integration baseline
  - React Navigation
  - Shared TypeScript packages for network/domain contracts
  - Existing backend APIs reused (trade, schema, telegram, account, tokens)
  - Analytics + crash reporting (e.g., PostHog + Sentry/Crashlytics equivalent)
- **Wallet architecture (locked for MVP):**
  - Phantom-first wallet strategy for connect, signing, and transaction approvals
  - Session persistence backed by secure device storage
  - Graceful fallback path when Phantom app/session is unavailable
- **Code organization target:**
  - `apps/web` (existing Vite app)
  - `apps/ios` (new Expo app)
  - `packages/core` (types/domain/api wrappers)
- **Key risk areas:**
  - Wallet and signing UX on iOS
  - Real-time updates and battery/network usage
  - Table density/performance on low-memory devices
  - App Store policy/compliance requirements for trading functionality

## Delivery Timeline (8-10 week target, aggressive)

### Phase 0 (Week 1): Discovery + architecture lock
- Confirm supported v1 feature matrix from current mobile web
- Lock API reuse and shared package boundaries
- Define deep-link formats and analytics taxonomy

### Phase 1 (Weeks 2-3): Foundation
- Set up Expo app from Phantom template, navigation, auth/session, shared package wiring
- Integrate Phantom Connect SDK and validate end-to-end connect/sign flow in dev builds
- Build basic app shell and route scaffolding

### Phase 2 (Weeks 4-6): Core workflows
- Implement discovery/tracking + import/sync table/view behavior
- Implement trade workflow and portfolio/positions screens
- Implement Telegram link/share flows

### Phase 3 (Weeks 7-8): Stabilization
- Instrument funnel analytics
- Performance pass, error handling hardening, QA regression
- Internal dogfooding and bug burn-down

### Phase 4 (Weeks 9-10, contingency for aggressive plan)
- TestFlight rollout
- Final release criteria validation
- App Store submission prep and launch runbook

## Success Metrics

- **Retention:** Improve mobile weekly retention for active users by at least 10-15% within 8 weeks of release
- **Trade volume:** Increase percentage of active users executing at least one weekly mobile trade by 15%+ vs pre-launch baseline
- **Funnel quality:** Improve Telegram-origin session-to-trade conversion by 10%+ vs current mobile web baseline
- **Reliability:** Crash-free session rate >= 99.5% during TestFlight and initial production rollout

## Open Questions

- Do we allow any fallback wallet option in v1, or stay Phantom-only until post-launch?
- Which table/view types are mandatory for v1 import parity versus deferred?
- Will we gate iOS rollout by geography or user cohort?
- What compliance copy/disclosures are required in-app for iOS review?
- Should push notifications be included in v1 or deferred to post-launch?

## Team / Resourcing Assumptions

- 1 senior mobile engineer (React Native/Expo)
- 1 full-stack engineer shared across API integration and schema compatibility
- 0.5 designer (mobile UX/system adaptation)
- 0.5 QA/release support for TestFlight and regression
- Product owner support for scope control in aggressive timeline
