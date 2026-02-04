# Quickscope iOS App

Native iOS companion app for Quickscope, optimized for Telegram-driven mobile workflows.

This repository is now in planning + scaffold mode and will evolve into the production mobile app codebase.

## Current Status

- Phase: Planning and architecture definition
- Target: iOS MVP in 8-10 weeks (aggressive)
- Stack decision: Expo React Native + TypeScript + Phantom Connect SDK
- Scope posture: Companion core (not full desktop parity)
- Scaffold status: Quickscope-owned app shell implemented in `apps/ios` (Phantom template used only as bootstrap)

## Product Scope (MVP)

In scope for v1:

- Discovery and tracking views aligned with existing mobile web behavior
- Trade flow (buy/sell) using existing backend trade APIs
- Portfolio and positions visibility
- Import/sync of supported table and view settings
- Telegram connect/link and share flows
- Deep links from Telegram contexts into relevant app screens

Out of scope for v1:

- Full dashboard editing parity from desktop web
- Discord integration (design extension path only)
- Android release

## Repo Structure

- `apps/ios` - Initial Phantom React Native scaffold (to be adapted for Quickscope)

- `README.md` - Product and repo overview
- `docs/architecture.md` - App architecture, boundaries, dependencies, open decisions
- `docs/delivery-plan.md` - Week-by-week execution plan (Week 1 detailed)
- `docs/week1-tickets.md` - Week 1 ticket-ready breakdown with estimates and acceptance criteria
- `docs/week1-execution-order.md` - Strict Week 1 execution order and import-ready table
- `docs/roadmap-tickets-weeks2-10.md` - Ticket-ready weekly backlog draft for Weeks 2-10
- `docs/week2-kickoff.md` - Week 2 execution kickoff status and in-progress foundations
- `docs/ios-103-auth-qa-matrix.md` - Account-switch/logout QA matrix for auth hardening
- `docs/decision-log.md` - Decision tracking log for architecture/product approvals
- `docs/spike-auth-api-parity-2026-02-04.md` - Initial Week 1 auth/API smoke-check report
- `docs/spike-auth-api-parity-2026-02-04.results.json` - Raw output from automated API smoke checks
- `docs/phantom-sdk-migration-plan.md` - Upgrade plan for Expo 53 + new Phantom SDK
- `tasks/prd-ios-companion-app.md` - Current product requirements document

## Planned App Architecture (Summary)

- `apps/ios`: Expo React Native app scaffolded from Phantom template
- `packages/core` (to be created): shared API clients, DTOs, domain logic
- Backend integration: reuse existing Quickscope APIs and websocket feeds where possible
- Wallet path: Phantom-first connect/signing/session strategy for MVP

See `docs/architecture.md` for full detail.

## Current App Shell Snapshot

- Primary bottom nav: Discover, Scope, Search, Tracking, Portfolio
- Secondary routes (non-primary nav): Telegram deep-link surface, Dev Console
- Discovery is now API-fed with sub-tabs: Trending, Scan Feed, Gainers

## Documentation Workflow

This repo will be documentation-first during setup:

1. Keep architecture and delivery plan current as decisions are made
2. Convert approved decisions into implementation tickets
3. Track changes in docs before broad code changes

When major decisions change (auth, wallet model, API contracts, timeline), update:

- `docs/architecture.md`
- `docs/delivery-plan.md`
- `docs/week1-tickets.md`
- `docs/week1-execution-order.md`
- `docs/decision-log.md`
- `tasks/prd-ios-companion-app.md` (if product scope changes)

## Immediate Next Steps

1. Continue Week 2: Scope/Search data-fed surfaces and route wiring
2. Keep IA and UX decisions updated in `docs/decision-log.md` as flows are locked
3. Start Week 3 prep for discovery/scoping API coverage and list performance baselines
