# Quickscope iOS Delivery Plan

## Planning Basis

- Target timeline: 8-10 weeks
- Scope: Companion core MVP
- Stack: Expo RN + Phantom Connect SDK
- Primary goals: retention lift and increased mobile trade activity

Related execution docs:

- `docs/week1-tickets.md`
- `docs/week1-execution-order.md`
- `docs/roadmap-tickets-weeks2-10.md`
- `docs/decision-log.md`
- `docs/spike-auth-api-parity-2026-02-04.md`

---

## Week 1 (Detailed): Foundation and Risk Burn-Down

### Week 1 Objectives

- Prove core technical feasibility before full build starts
- Lock high-risk decisions (wallet/auth/session/deep linking)
- Produce implementation-ready backlog for Weeks 2-3

### Track A: Repo and Project Bootstrap

Tasks:

1. Initialize iOS app from Phantom Expo template inside `apps/ios`
2. Set up TypeScript, linting, formatting, and baseline CI checks
3. Establish environment config strategy (dev/staging/prod endpoints)
4. Add app config conventions (bundle IDs, build profiles, secrets handling)

Deliverables:

- Running local app shell with environment selection
- CI pipeline green on lint/typecheck/build
- Documented setup steps for all engineers

### Track B: Wallet + Auth Spike (Most Critical)

Tasks:

1. Integrate Phantom Connect SDK in app shell
2. Implement connect/disconnect/session-restore flow
3. Wire challenge/solution auth flow against backend
4. Validate refresh behavior across app restarts and resume-from-background
5. Capture failure handling UX states (no Phantom, canceled signature, expired session)

Deliverables:

- End-to-end authenticated session demo on iOS device
- Decision memo: cookie-based auth is reliable, or token-header fallback required
- List of backend adjustments needed (if any)

### Track C: API Contract and Data Layer Validation

Tasks:

1. Set up base API client pattern for `auth/*`, `public/*`, `private/*`, `tx/*`
2. Execute parity smoke tests for:
   - dashboards/schema fetch
   - portfolio/positions reads
   - trade quote and trade submit
   - telegram linked-state and chats
3. Validate BigNumber/serialization behavior in RN runtime

Deliverables:

- API parity report (pass/fail by endpoint group)
- Known incompatibilities list with owners and ETA

### Track D: Navigation + Deep Link Skeleton

Tasks:

1. Create initial route map: discovery, scope, trade, portfolio, tracking, telegram
2. Implement deep-link parser for token/trade contexts
3. Validate app open from link in cold start and warm state

Deliverables:

- Working navigation shell with placeholder screens
- Verified deep-link routing matrix (case list + status)

### Track E: Telegram Flow Feasibility

Tasks:

1. Validate non-web Telegram link/share flow path for iOS
2. Confirm backend expectations for `linkTelegramChallenge` and `linkTelegramSolution`
3. Prototype native-compatible UX replacement for web script widget behavior

Deliverables:

- Feasibility decision: fully supported in MVP path vs constrained fallback
- Required implementation plan for Week 4-6 integration

### Track F: Planning and Execution Readiness

Tasks:

1. Finalize architecture sign-off with stakeholders
2. Break MVP into Week 2-6 tickets (owner, estimate, dependency)
3. Define release KPIs and test strategy baseline

Deliverables:

- Approved sprint backlog for Weeks 2-3
- Updated architecture and PRD reflecting Week 1 decisions

### Week 1 Exit Criteria (Must-Haves)

- Wallet connect + sign + authenticated session works on real iOS device
- Backend impact is classified as:
  - no change, or
  - small scoped change with clear owner/timeline
- Route/deep-link shell exists and is stable
- Team has approved tickets for execution phase

---

## Week-by-Week Outline (Weeks 2-10)

## Week 2: Core App Skeleton and Shared Foundations

- Build production navigation shell and route guards
- Start `packages/core` for shared models + API wrappers
- Implement base app state/auth bootstrap flow
- Begin screen scaffolding with real data placeholders

## Week 3: Data Integration and Core Read Flows

- Integrate discovery, tracking, and portfolio data reads
- Build list/table rendering patterns for mobile surfaces
- Add loading/error/empty states and retry behavior
- Complete baseline websocket integration where required

## Week 4: Trade Flow Integration

- Implement quote -> review -> submit buy/sell flows
- Surface transaction pending/success/failure states
- Validate account balance/position updates after trade
- Add analytics for trade funnel milestones

## Week 5: Portfolio/Positions and View Sync

- Complete portfolio and position detail experiences
- Implement supported table/view config import and sync
- Define fallback behavior for unsupported desktop-only settings
- Run performance pass for high-density data screens

## Week 6: Telegram Integration and UX Hardening

- Implement Telegram link/unlink in native flow
- Implement token share to selected Telegram chats
- Finalize deep-link behavior from Telegram contexts
- Add end-to-end regression checks for Telegram-driven journeys

## Week 7: Stabilization and Quality

- Bug triage and critical path hardening
- Improve edge-case handling and network resilience
- Accessibility and usability polish for high-use screens
- Expand analytics instrumentation and dashboard checks

## Week 8: Internal Dogfood + Pre-Release Gate

- Internal beta usage and structured feedback loop
- Validate KPI instrumentation and funnel data quality
- Resolve blocking defects and finalize release checklist
- Prepare TestFlight candidate build

## Week 9 (Contingency): TestFlight and Launch Prep

- External/internal TestFlight rounds
- Address final release-critical defects
- Finalize App Store metadata, compliance text, and review package
- Confirm go/no-go metrics and rollback plan

## Week 10 (Contingency): Submission and Launch Operations

- Submit to App Store
- Run launch-day monitoring plan
- Respond to review feedback quickly if needed
- Start post-launch backlog prioritization (Discord, Android, enhancements)

---

## Risks to Track Weekly

- Wallet/session reliability on iOS runtime
- Backend auth behavior in native contexts
- Telegram integration constraints outside web widget model
- Scope creep beyond companion-core MVP
- Performance regression on table-heavy screens

## Weekly Rituals

- Monday: lock goals and dependencies
- Mid-week: integration demo on device
- Friday: release-readiness review and risk update
- End of week: update architecture/PRD/docs with decisions
