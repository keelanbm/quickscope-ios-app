# Week 1 Ticket Backlog (Implementation-Ready)

## Usage Notes

- Estimates are engineering effort estimates (ideal days) and assume one senior mobile engineer and shared backend/full-stack support.
- For strict execution sequence and import table, use `docs/week1-execution-order.md`.
- Priority levels:
  - P0 = must complete in Week 1
  - P1 = should complete in Week 1
  - P2 = stretch if capacity allows
- A ticket is "done" only when all acceptance criteria are met.

---

## Ticket List

### IOS-001 (P0) - Monorepo bootstrap and baseline tooling

- **Owner role:** Mobile engineer
- **Estimate:** 0.75d
- **Dependencies:** None
- **Description:** Establish root repo tooling baseline (`.gitignore`, doc links, command conventions) and ensure `apps/ios` is the active app workspace.
- **Acceptance criteria:**
  - [ ] Root `.gitignore` exists and excludes mobile build/dependency artifacts
  - [ ] Root README reflects actual current structure and setup commands
  - [ ] `apps/ios` can be discovered and run from documented commands

### IOS-002 (P0) - Phantom template intake hardening

- **Owner role:** Mobile engineer
- **Estimate:** 0.5d
- **Dependencies:** IOS-001
- **Description:** Normalize the imported Phantom template for this project (naming, metadata, package naming, app display name).
- **Acceptance criteria:**
  - [ ] `apps/ios/package.json` name and metadata match Quickscope project naming
  - [ ] Expo app name/slug/bundle identifiers are aligned with Quickscope conventions
  - [ ] No references to demo-app branding remain in app metadata files

### IOS-003 (P0) - Environment configuration contract

- **Owner role:** Mobile engineer
- **Estimate:** 0.75d
- **Dependencies:** IOS-002
- **Description:** Define and implement environment variable strategy for API host, WS host, Solana RPC endpoint, analytics keys, and app identifiers.
- **Acceptance criteria:**
  - [ ] `apps/ios/.env.example` contains all required runtime variables
  - [ ] Environment loading works for local dev build
  - [ ] Missing required env vars fail with clear error messaging

### IOS-004 (P0) - Local run and CI validation lane

- **Owner role:** Mobile engineer
- **Estimate:** 0.75d
- **Dependencies:** IOS-003
- **Description:** Add lightweight CI checks and local scripts for lint, typecheck, and basic build validation.
- **Acceptance criteria:**
  - [ ] Scripts exist for lint and typecheck from `apps/ios`
  - [ ] CI workflow runs lint + typecheck on pull requests
  - [ ] CI passes on baseline scaffold commit

### IOS-005 (P0) - Auth flow spike from native app

- **Owner role:** Mobile engineer
- **Estimate:** 1.0d
- **Dependencies:** IOS-003
- **Description:** Build a proof flow for wallet connect -> `auth/challenge` -> sign -> `auth/solution`.
- **Acceptance criteria:**
  - [ ] User can connect Phantom wallet in iOS app
  - [ ] App can request challenge and submit signed solution successfully
  - [ ] Auth success state can be observed in-app and via logs

### IOS-006 (P0) - Session refresh and persistence spike

- **Owner role:** Mobile engineer
- **Estimate:** 0.75d
- **Dependencies:** IOS-005
- **Description:** Validate session behavior across app resume/restart and token refresh lifecycle.
- **Acceptance criteria:**
  - [ ] Session persists across cold app restart
  - [ ] Session refresh path works without forced re-auth in normal flow
  - [ ] Explicit logout clears local session and returns app to unauthenticated state

### IOS-007 (P0) - Cookie vs token auth compatibility decision

- **Owner role:** Mobile + backend engineer
- **Estimate:** 0.5d
- **Dependencies:** IOS-006
- **Description:** Determine whether cookie-based auth is production-safe in RN or if mobile token-header auth is required.
- **Acceptance criteria:**
  - [ ] Decision memo added to `docs/decision-log.md`
  - [ ] Risks and fallback strategy documented
  - [ ] Backend impact clearly labeled as none/small/medium

### IOS-008 (P0) - API transport parity harness

- **Owner role:** Full-stack engineer
- **Estimate:** 1.0d
- **Dependencies:** IOS-003
- **Description:** Build a minimal data harness to call representative APIs from each method family (`public`, `private`, `tx`, `auth`).
- **Acceptance criteria:**
  - [ ] Harness calls at least 1 endpoint from each method family
  - [ ] Errors are normalized and logged consistently
  - [ ] Result summary report stored in docs

### IOS-009 (P0) - Core endpoint smoke tests (manual + scripted)

- **Owner role:** Full-stack engineer
- **Estimate:** 1.0d
- **Dependencies:** IOS-008
- **Description:** Validate key endpoint groups needed for MVP (schema, positions, trade, telegram).
- **Acceptance criteria:**
  - [ ] Dashboard/schema read endpoint succeeds
  - [ ] Portfolio/positions endpoints succeed with test account
  - [ ] Trade quote + submit path succeeds in non-production test path
  - [ ] Telegram linked-state/chats endpoints succeed

### IOS-010 (P0) - Navigation shell and route map

- **Owner role:** Mobile engineer
- **Estimate:** 1.0d
- **Dependencies:** IOS-002
- **Description:** Create route skeleton for Discovery, Scope, Trade, Portfolio, Tracking, Telegram.
- **Acceptance criteria:**
  - [ ] All 6 routes exist and are reachable from navigation
  - [ ] Route names align with product naming in PRD
  - [ ] Placeholder screens include loading/error UI primitives

### IOS-011 (P0) - Deep-link parser baseline

- **Owner role:** Mobile engineer
- **Estimate:** 0.75d
- **Dependencies:** IOS-010
- **Description:** Implement deep-link handling for token and trade contexts.
- **Acceptance criteria:**
  - [ ] Cold-start deep link opens correct route
  - [ ] Warm-state deep link updates route/context correctly
  - [ ] Unknown/malformed links fail gracefully to safe default route

### IOS-012 (P1) - Telegram native linking feasibility spike

- **Owner role:** Mobile + backend engineer
- **Estimate:** 1.0d
- **Dependencies:** IOS-005
- **Description:** Replace web-widget assumptions with native-compatible Telegram link initiation path.
- **Acceptance criteria:**
  - [ ] Native link/unlink feasibility documented
  - [ ] Backend dependency list for Telegram flow is clear
  - [ ] Decision captured in `docs/decision-log.md`

### IOS-013 (P1) - Websocket connectivity spike

- **Owner role:** Mobile engineer
- **Estimate:** 0.75d
- **Dependencies:** IOS-003
- **Description:** Validate websocket connection management and subscription behavior in RN runtime.
- **Acceptance criteria:**
  - [ ] App can connect to configured WS host
  - [ ] At least one subscription event stream is received and rendered
  - [ ] Reconnect behavior validated after network interruption

### IOS-014 (P1) - Observability baseline

- **Owner role:** Mobile engineer
- **Estimate:** 0.5d
- **Dependencies:** IOS-003
- **Description:** Add initial analytics and error tracking hooks for Week 1 flows.
- **Acceptance criteria:**
  - [ ] Auth start/success/failure events are captured
  - [ ] Deep-link open events are captured
  - [ ] Unhandled errors are logged to monitoring sink (or temporary console bridge)

### IOS-015 (P1) - Architecture and PRD sync update

- **Owner role:** Product + engineering lead
- **Estimate:** 0.5d
- **Dependencies:** IOS-007, IOS-009, IOS-012
- **Description:** Update architecture and PRD docs with Week 1 outcomes and locked decisions.
- **Acceptance criteria:**
  - [ ] `docs/architecture.md` reflects finalized Week 1 decisions
  - [ ] `tasks/prd-ios-companion-app.md` updated if scope or assumptions changed
  - [ ] Outstanding open questions are explicitly listed with owners

### IOS-016 (P1) - Weeks 2-3 execution board creation

- **Owner role:** Product + engineering lead
- **Estimate:** 0.5d
- **Dependencies:** IOS-015
- **Description:** Convert planned work into a trackable board with owners, priorities, and dependencies.
- **Acceptance criteria:**
  - [ ] Tickets for Weeks 2-3 are entered in tracking system
  - [ ] All P0 Week 1 outcomes map to downstream tickets
  - [ ] Dependencies and blocking relationships are explicit

---

## Week 1 Capacity Snapshot (Recommended)

- Mobile engineer: ~8.0d allocated (single-owner core path)
- Full-stack/backend: ~2.5d allocated (API/auth/telegram validation)
- Product/design/leadership: ~1.0d for review and sign-off

## Week 1 Definition of Success

- Wallet-auth session path is proven on iOS
- Backend impact is clearly known and bounded
- Route/deep-link shell is operational
- Week 2 build can begin without unresolved architecture blockers
