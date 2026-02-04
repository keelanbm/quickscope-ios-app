# Decision Log

This log tracks major product and technical decisions for the Quickscope iOS app.

## How to Use

- Add one entry per decision.
- Update status as decisions evolve.
- Link related PRD/architecture/ticket updates.

---

## Decision Template

### DEC-XXX - [Decision Title]

- **Date:** YYYY-MM-DD
- **Status:** Proposed | Approved | Superseded
- **Owner:** Name/Role
- **Context:** Why this decision is needed
- **Decision:** What was chosen
- **Alternatives considered:** Other options and tradeoffs
- **Impact:** Scope, timeline, team, backend implications
- **Follow-ups:** Required tasks/tickets/docs to update

---

## Entries

### DEC-001 - MVP scope posture

- **Date:** 2026-02-04
- **Status:** Approved
- **Owner:** Product + Engineering
- **Context:** Need to hit an aggressive 8-10 week window while maximizing conversion impact.
- **Decision:** Ship companion-core MVP (trade, positions, table/view sync, Telegram flows) instead of full web parity.
- **Alternatives considered:** Near full parity in v1; read-only v1.
- **Impact:** Reduces build risk and keeps focus on retention/trade outcomes.
- **Follow-ups:** Maintain strict non-goal boundaries in PRD and sprint planning.

### DEC-002 - Mobile stack selection

- **Date:** 2026-02-04
- **Status:** Approved
- **Owner:** Product + Engineering
- **Context:** Need fast iOS delivery with future optional Android reuse.
- **Decision:** Use Expo React Native + TypeScript.
- **Alternatives considered:** Bare RN, SwiftUI native app.
- **Impact:** Faster initial delivery, moderate native integration constraints.
- **Follow-ups:** Keep native boundary decisions documented in architecture.

### DEC-003 - Wallet integration strategy

- **Date:** 2026-02-04
- **Status:** Approved
- **Owner:** Engineering
- **Context:** Wallet connect/signing is the most critical technical path and main user friction risk.
- **Decision:** Phantom-first using Phantom Connect SDK and Phantom Expo template baseline.
- **Alternatives considered:** Multi-wallet at launch; custom wallet integration from scratch.
- **Impact:** De-risks MVP path; defers multi-wallet complexity.
- **Follow-ups:** Validate auth/session reliability in Week 1 and document any backend needs.

### DEC-004 - Backend impact posture after auth/API parity smoke checks

- **Date:** 2026-02-04
- **Status:** Proposed (pending device-level auth validation)
- **Owner:** Engineering
- **Context:** Needed early signal on whether iOS effort will require major backend work.
- **Decision:** Treat iOS MVP as frontend-first using existing APIs, with backend changes likely limited to native auth/session edge cases.
- **Alternatives considered:** Assume full backend track in parallel from week 1.
- **Impact:** Keeps Week 2-6 focused on mobile app build while gating on Week 1 auth/session findings.
- **Follow-ups:** Complete in-app challenge/sign/solution/refresh validation and then update this entry to Approved or Superseded.

### DEC-005 - Build strategy for iOS app codebase

- **Date:** 2026-02-04
- **Status:** Approved
- **Owner:** Product + Engineering
- **Context:** Team wants direct ownership of app architecture and implementation flow for MVP testing and handoff.
- **Decision:** Build the app shell and feature modules ourselves, using Phantom template only as initial bootstrap.
- **Alternatives considered:** Continue iterating directly on demo template architecture.
- **Impact:** Cleaner project structure, better team alignment, and fewer demo-specific constraints.
- **Follow-ups:** Continue replacing scaffold placeholders with production feature modules by sprint plan.

### DEC-006 - Phantom SDK migration path

- **Date:** 2026-02-04
- **Status:** Approved
- **Owner:** Engineering
- **Context:** New Phantom React Native SDK uses appId-based auth and newer integration model, but requires Expo 53+.
- **Decision:** Use a dedicated migration branch and upgrade to Expo SDK 53 before switching to `@phantom/react-native-sdk`.
- **Alternatives considered:** Stay on legacy wallet SDK for full MVP timeline and defer migration.
- **Impact:** Better long-term alignment with Phantom docs and newer API, with short-term upgrade risk.
- **Follow-ups:** Keep monitoring auth/session behavior during Week 2 hardening and document any regressions.

### DEC-007 - Week 2 navigation safety posture

- **Date:** 2026-02-04
- **Status:** Approved
- **Owner:** Engineering
- **Context:** Week 1 established feasibility, Week 2 needs route safety before feature build-out.
- **Decision:** Add route-level error boundaries and wallet-based auth gates for protected tabs (Trade, Portfolio, Tracking, Telegram).
- **Alternatives considered:** Keep all tabs open during development and defer guards to Week 4.
- **Impact:** Better alignment with mobile-web access model and fewer unsafe route states during integration.
- **Follow-ups:** Replace guard placeholders with full auth/session state machine once IOS-103 is complete.

### DEC-008 - Auth session handling baseline for mobile runtime

- **Date:** 2026-02-04
- **Status:** Approved
- **Owner:** Engineering
- **Context:** Need deterministic mobile auth/session behavior before feature integrations rely on private endpoints.
- **Decision:** Introduce an app-level auth session provider that handles challenge/sign/solution auth, secure token persistence, and foreground refresh when access token is stale.
- **Alternatives considered:** Keep auth checks only in screen-local spike code until Week 4.
- **Impact:** Reduces integration risk for private API screens and provides clear session observability in dev tools.
- **Follow-ups:** Validate cookie/session reliability after cold starts and decide if token-header fallback is required.

### DEC-009 - Week 2 quality gate baseline (CI + smoke path)

- **Date:** 2026-02-04
- **Status:** Approved
- **Owner:** Engineering
- **Context:** Week 2 requires consistent guardrails before scaling feature work across multiple screens.
- **Decision:** Add a minimal CI quality lane (lint, typecheck, unit tests) and lock one manual smoke E2E path for iOS simulator/device verification.
- **Alternatives considered:** Keep checks local-only until Week 4.
- **Impact:** Catches regressions earlier and gives a repeatable pre-merge quality baseline while native E2E tooling is still pending.
- **Follow-ups:** Add automated smoke flow candidate (Detox or Maestro) once core discovery/trade surfaces are no longer placeholders.

### DEC-010 - Discovery information architecture naming for iOS

- **Date:** 2026-02-04
- **Status:** Approved
- **Owner:** Product + Engineering
- **Context:** Discovery needs native-first top-level segmentation that mirrors mobile behavior users already understand.
- **Decision:** Use three Discovery sub-tabs named `Trending`, `Scan Feed`, and `Gainers` in iOS MVP.
- **Alternatives considered:** Keep a single discovery feed until Week 3.
- **Impact:** Better cognitive continuity from existing mobile experience and clearer room for tab-specific sorting logic.
- **Follow-ups:** Confirm final per-tab sort/filter configs during Week 2/3 design review.

### DEC-011 - Discovery presentation style on iOS

- **Date:** 2026-02-04
- **Status:** Approved
- **Owner:** Product + Engineering
- **Context:** Discovery on iOS should feel closer to a high-density trading table than feed cards.
- **Decision:** Use traditional row/table-style list rendering for Discovery instead of card blocks.
- **Alternatives considered:** Keep rounded card feed style from initial implementation.
- **Impact:** Better scanability for active trading workflows and closer visual parity with existing mobile web behaviors.
- **Follow-ups:** Tune row density and column priority after first design polish pass.

### DEC-012 - Primary bottom navigation IA for iOS MVP shell

- **Date:** 2026-02-04
- **Status:** Approved
- **Owner:** Product + Engineering
- **Context:** Current shell had too many bottom tabs, which dilutes core mobile flows and differs from existing mobile UX expectations.
- **Decision:** Use five primary bottom tabs only: `Discover`, `Scope`, `Search`, `Tracking`, `Portfolio`.
- **Alternatives considered:** Keep all working modules exposed on the tab bar during development.
- **Impact:** Cleaner IA for user-facing flows while keeping secondary routes (Telegram deep-link surface and Dev Console) available without crowding primary navigation.
- **Follow-ups:** Add dedicated stack flows for token detail and trade entry from Discover/Search in Week 3.
