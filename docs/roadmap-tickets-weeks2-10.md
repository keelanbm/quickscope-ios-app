# Weeks 2-10 Ticket Outline (Execution Backlog Draft)

This is a ticket-ready draft backlog for planning and sequencing. Week 1 has a deeper breakdown in `docs/week1-tickets.md`.

Estimates are ideal engineering days and should be recalibrated after Week 1 outcomes.

---

## Week 2 - App Skeleton, Shared Foundations

### IOS-101 - Core navigation shell productionization
- **Estimate:** 1.0d
- **Acceptance criteria:**
  - [ ] Tab/stack navigation matches approved IA
  - [ ] Route guards handle unauthenticated/authenticated states
  - [ ] Route-level loading/error boundaries present

### IOS-102 - `packages/core` bootstrap
- **Estimate:** 1.0d
- **Acceptance criteria:**
  - [ ] Shared package created with types, API interfaces, and transport utilities
  - [ ] App imports from shared package without circular dependency issues
  - [ ] Basic unit tests run for critical utilities

### IOS-103 - Auth/session integration hardening
- **Estimate:** 1.0d
- **Acceptance criteria:**
  - [ ] Auth state machine handles all expected transitions
  - [ ] Session refresh policy is stable on background/foreground changes
  - [ ] Logout and account switch flows are deterministic

### IOS-104 - Design system baseline for mobile
- **Estimate:** 0.75d
- **Acceptance criteria:**
  - [ ] Typography/color/spacing tokens established
  - [ ] Shared primitives (button/input/card/list-item) implemented
  - [ ] Dark/light strategy documented (even if one is deferred)

### IOS-105 - Quality and test harness setup
- **Estimate:** 0.75d
- **Acceptance criteria:**
  - [ ] Component/unit test scaffolding added
  - [ ] Smoke E2E path selected and documented
  - [ ] CI includes test lane (even minimal)

---

## Week 3 - Data Integration and Read Surfaces

### IOS-201 - Discovery data integration
- **Estimate:** 1.25d
- **Acceptance criteria:**
  - [ ] Discovery list renders real backend data
  - [ ] Filters/sorting baseline behavior implemented
  - [ ] Empty/error/retry states complete

### IOS-202 - Tracking and watchlist read flows
- **Estimate:** 1.0d
- **Acceptance criteria:**
  - [ ] Tracking list and token/watchlist read operations integrated
  - [ ] Navigation from tracking to token detail/trade works
  - [ ] Refresh behavior documented and implemented

### IOS-203 - Portfolio overview read flow
- **Estimate:** 1.25d
- **Acceptance criteria:**
  - [ ] Portfolio summary and key balances render from API
  - [ ] Position list is usable on mobile screen sizes
  - [ ] Data formatting is consistent with web semantics

### IOS-204 - Websocket live data integration
- **Estimate:** 1.0d
- **Acceptance criteria:**
  - [ ] Live price stream updates visible in at least one core surface
  - [ ] Subscription lifecycle survives app backgrounding
  - [ ] Reconnection telemetry recorded

### IOS-205 - Performance pass for list-heavy surfaces
- **Estimate:** 0.75d
- **Acceptance criteria:**
  - [ ] List virtualization strategy implemented where needed
  - [ ] Scroll/jank baseline is acceptable on target test devices
  - [ ] Performance risks documented

---

## Week 4 - Trading Flow (Core Conversion Path)

### IOS-301 - Trade quote + form workflow
- **Estimate:** 1.25d
- **Acceptance criteria:**
  - [ ] User can request quotes with expected params
  - [ ] Validation for amount/slippage is complete
  - [ ] Quote expiration/staleness is handled in UI

### IOS-302 - Trade submit + transaction state UX
- **Estimate:** 1.25d
- **Acceptance criteria:**
  - [ ] Submit buy/sell path executes through backend
  - [ ] Pending/success/failure states are explicit
  - [ ] Transaction references are accessible for support/debug

### IOS-303 - Wallet/trade edge-case handling
- **Estimate:** 0.75d
- **Acceptance criteria:**
  - [ ] Disconnected wallet mid-flow is handled safely
  - [ ] User-canceled signature path is handled cleanly
  - [ ] Insufficient balance and invalid account states are covered

### IOS-304 - Trade funnel analytics instrumentation
- **Estimate:** 0.5d
- **Acceptance criteria:**
  - [ ] Events for quote requested, trade submitted, trade succeeded, trade failed
  - [ ] Event payloads include required dimensions
  - [ ] Dashboard view for funnel is defined

---

## Week 5 - Portfolio Depth and Config Sync

### IOS-401 - Position detail experience
- **Estimate:** 1.0d
- **Acceptance criteria:**
  - [ ] Position detail shows key PnL and trade context
  - [ ] Navigation from portfolio list is smooth
  - [ ] Data parity validated against web output

### IOS-402 - Table/view config sync MVP
- **Estimate:** 1.5d
- **Acceptance criteria:**
  - [ ] App fetches and applies supported table/view settings
  - [ ] Unsupported settings degrade gracefully
  - [ ] Sync behavior is deterministic across sessions

### IOS-403 - Cache invalidation and refresh policy tuning
- **Estimate:** 0.75d
- **Acceptance criteria:**
  - [ ] Data refresh triggers are explicit and tested
  - [ ] Stale data windows are documented by screen
  - [ ] Unnecessary refetches reduced

### IOS-404 - Mobile table UX adaptation
- **Estimate:** 1.0d
- **Acceptance criteria:**
  - [ ] Core table content remains readable on iPhone sizes
  - [ ] Priority fields are surfaced above secondary fields
  - [ ] Interaction patterns are touch-optimized

---

## Week 6 - Telegram Integration and Deep Link Journeys

### IOS-501 - Native Telegram link/unlink flow
- **Estimate:** 1.0d
- **Acceptance criteria:**
  - [ ] User can link and unlink Telegram account natively
  - [ ] Errors are actionable and user-friendly
  - [ ] Telemetry exists for failure reasons

### IOS-502 - Telegram share-to-chat flow
- **Estimate:** 1.0d
- **Acceptance criteria:**
  - [ ] User can pick chat(s) and share token data
  - [ ] Success/failure states are clearly surfaced
  - [ ] Share defaults are persisted appropriately

### IOS-503 - Telegram-origin deep link funnel
- **Estimate:** 1.0d
- **Acceptance criteria:**
  - [ ] Telegram links open correct app context (token/trade/share)
  - [ ] Cold and warm opens both work reliably
  - [ ] Funnel metrics collected end-to-end

### IOS-504 - Social provider abstraction layer
- **Estimate:** 0.75d
- **Acceptance criteria:**
  - [ ] Sharing logic sits behind channel provider interface
  - [ ] Telegram provider implemented and tested
  - [ ] Discord extension path documented

---

## Week 7 - Stabilization and Hardening

### IOS-601 - Regression sweep for core journeys
- **Estimate:** 1.0d
- **Acceptance criteria:**
  - [ ] Discovery -> trade -> portfolio journey passes on target devices
  - [ ] Telegram link/share journey passes
  - [ ] Known critical defects triaged with owners

### IOS-602 - Error handling and offline resilience pass
- **Estimate:** 1.0d
- **Acceptance criteria:**
  - [ ] Network failures show structured retry options
  - [ ] Timeouts and API error payloads map to clear user messages
  - [ ] Crash-level errors are reduced in test sessions

### IOS-603 - Accessibility and usability improvements
- **Estimate:** 0.75d
- **Acceptance criteria:**
  - [ ] Touch target sizes and typography meet baseline accessibility checks
  - [ ] Screen-reader labels exist for key controls
  - [ ] Highest-friction flows improved from dogfood feedback

### IOS-604 - Release candidate prep checklist
- **Estimate:** 0.5d
- **Acceptance criteria:**
  - [ ] Blocking/non-blocking issue categories defined
  - [ ] RC checklist finalized and linked in docs
  - [ ] TestFlight prerequisites complete

---

## Week 8 - Dogfood and Pre-Release Gate

### IOS-701 - Internal dogfood program execution
- **Estimate:** 0.75d
- **Acceptance criteria:**
  - [ ] Structured tester cohort is onboarded
  - [ ] Feedback intake channel and SLA are defined
  - [ ] Top issues triaged by severity

### IOS-702 - KPI instrumentation validation
- **Estimate:** 0.5d
- **Acceptance criteria:**
  - [ ] Retention and trade funnel events verified in analytics
  - [ ] Event naming/schema matches architecture docs
  - [ ] Data quality issues are logged and prioritized

### IOS-703 - Defect burn-down sprint
- **Estimate:** 1.5d
- **Acceptance criteria:**
  - [ ] All P0 defects closed or explicitly waived by stakeholders
  - [ ] P1 defect list reduced to acceptable launch threshold
  - [ ] Release candidate build is stable

---

## Week 9 (Contingency) - TestFlight and Launch Prep

### IOS-801 - TestFlight distribution + feedback loop
- **Estimate:** 0.75d
- **Acceptance criteria:**
  - [ ] Build delivered to target testers
  - [ ] Feedback triage cadence established
  - [ ] RC update cycle is documented

### IOS-802 - App Store submission package
- **Estimate:** 0.75d
- **Acceptance criteria:**
  - [ ] Metadata, screenshots, and policy text prepared
  - [ ] Privacy/compliance declarations reviewed
  - [ ] Submission checklist complete

### IOS-803 - Launch readiness review
- **Estimate:** 0.5d
- **Acceptance criteria:**
  - [ ] Go/no-go criteria reviewed with stakeholders
  - [ ] Rollback/incident handling plan documented
  - [ ] Owners assigned for launch-day monitoring

---

## Week 10 (Contingency) - Submission and Launch Ops

### IOS-901 - Launch monitoring operations
- **Estimate:** 0.5d
- **Acceptance criteria:**
  - [ ] Monitoring dashboard live for crash and conversion health
  - [ ] Incident escalation path active
  - [ ] Post-launch standup cadence defined

### IOS-902 - Post-launch stabilization window
- **Estimate:** 1.0d
- **Acceptance criteria:**
  - [ ] Early user issues triaged within SLA
  - [ ] Hotfix process tested and ready
  - [ ] Top pain points captured for next sprint

### IOS-903 - Phase 2 planning kickoff
- **Estimate:** 0.75d
- **Acceptance criteria:**
  - [ ] Post-MVP backlog prioritized (Discord, Android, parity enhancements)
  - [ ] Lessons learned documented
  - [ ] Next milestone proposal reviewed with stakeholders
