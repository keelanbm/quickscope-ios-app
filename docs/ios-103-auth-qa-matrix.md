# IOS-103 Auth Hardening QA Matrix

Date: 2026-02-04  
Owner: Engineering

## Purpose

Define a repeatable simulator/device matrix for account-switch and logout behaviors so auth/session regressions are caught before merge.

## Coverage at a glance

- **Automated:** `authSessionUtils.test.ts`, `sessionStorage.test.ts`
- **Manual:** Dev Console backend-session flow (`apps/ios/src/screens/SpikeConsoleScreen.tsx`)

## QA Matrix

| ID | Scenario | Preconditions | Steps | Expected result |
| --- | --- | --- | --- | --- |
| A1 | Fresh boot without stored session | App installed, no secure-store tokens | Launch app -> open Dev Console | Backend session status is `unauthenticated` |
| A2 | Authenticate from connected wallet | Phantom wallet connected | Tap `Authenticate session` | Status becomes `authenticated`; subject + expiration values populate |
| A3 | Manual refresh while authenticated | A2 completed | Tap `Refresh session` | Status returns to `authenticated`; no auth error shown |
| A4 | Cold restart session restore | A2 completed | Force close app -> reopen | Session restores from secure store; status becomes `authenticated` or `refreshing` then `authenticated` |
| A5 | Access expired + refresh valid path | Stored session with stale access token and valid refresh token | Bring app to foreground | Provider runs refresh and returns to `authenticated` |
| A6 | Account switch invalidates session | A2 completed | Switch Phantom wallet account -> return to app | Stored backend session clears; status becomes `unauthenticated`; wallet mismatch error shown |
| A7 | Explicit logout clears backend state | Authenticated + wallet connected | Tap wallet `Disconnect` | Wallet disconnects and stored session clears (`unauthenticated`) |
| A8 | Manual clear session action | Authenticated or unauthenticated | Tap `Clear stored session` | Tokens removed from secure store; status remains/returns `unauthenticated` |
| A9 | Refresh token expired on boot | Stored session with expired refresh token | Launch app | Provider clears session and stays `unauthenticated` |

## Execution notes

- Run this matrix on:
  - iOS simulator (latest iOS target)
  - one physical iOS device
- If any case fails, capture:
  - case ID
  - observed state transition
  - screenshot + reproduction steps
  - whether failure is simulator-only, device-only, or both

## Completion criteria

IOS-103 is complete when:

1. A1-A9 pass on simulator.
2. A1, A2, A6, A7 pass on physical device.
3. `npm run test:ci` is green (includes auth utility + session storage coverage).

## Execution log (2026-02-04, simulator)

- Environment:
  - iPhone 16 Pro simulator (iOS 18.x runtime)
  - App launched with `npm run start:ios`
- Status:
  - Route accessibility and Dev Console visibility confirmed.
  - Manual auth matrix interactions (A1-A9) still require hands-on tap flow execution and observation pass.
- Evidence screenshots:
  - Dev Console route: `/tmp/quickscope-dev.png`
  - Discovery shell: `/tmp/quickscope-home.png`
