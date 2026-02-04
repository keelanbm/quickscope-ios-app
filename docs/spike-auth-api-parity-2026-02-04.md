# Week 1 Spike Report: Auth + API Parity

- **Date:** 2026-02-04
- **Environment:** CLI smoke checks against configured API host from existing Quickscope env
- **Scope:** Validate baseline reachability and auth gating behavior for `auth/*`, `public/*`, `private/*`, and `tx/*`
- **Raw evidence:** `docs/spike-auth-api-parity-2026-02-04.results.json`

## Summary

The backend is reachable and method-path RPC behavior matches expected frontend patterns.  
Public endpoints work without authentication.  
Private and tx endpoints correctly return auth-required errors when no session/cookies are present.

## Checks Run

| Check | Endpoint | Result | Notes |
|---|---|---|---|
| Public price health | `public/getLatestSolPrice` | PASS | Returned price payload |
| Public balances health | `public/getAccountSolBalances` | PASS | Returned balance payload for test account |
| Auth challenge | `auth/challenge` | PASS | Returned challenge string with nonce/issued-at |
| Private auth gate | `private/getDashboards` | PASS | Returned `authentication required` (expected without session) |
| Tx auth gate | `tx/getSwapQuote` | PASS | Returned `authentication required` (expected without session) |
| Auth solution negative path | `auth/solution` | PASS (negative) | Invalid solution payload rejected as expected |

## What This Confirms

1. Existing backend contract style (method in URL + JSON body with method/params) is stable.
2. No immediate blocker for iOS client calling the same endpoint families.
3. Private/tx behavior is correctly protected when session is absent.

## What Is Still Needed (Device/App-Level)

1. End-to-end wallet sign-in from app:
   - `auth/challenge` -> Phantom sign -> `auth/solution` -> `auth/refresh`
2. Session persistence validation in RN runtime (resume/background/restart behavior).
3. Telegram native link/share flow validation (replacing web-widget assumptions).

## Recommendation

Proceed as frontend-first implementation with a Week 1 auth/session decision gate.  
Backend changes appear likely to be small and concentrated in native-session edge handling if issues arise.
