# Quickscope iOS App (`apps/ios`)

This app is the iOS client scaffold for Quickscope, bootstrapped from the Phantom React Native template.
The demo template UI has been replaced with a Quickscope-specific app shell.

## Prerequisites

- Node.js 20+
- Xcode (for iOS simulator/device builds)
- Expo CLI tooling via project scripts

## Setup

1. Install dependencies:

```bash
npm ci
```

2. Copy env template and fill values:

```bash
cp .env.local.template .env.local
```

3. Set Phantom App ID in `.env.local`:

```bash
EXPO_PUBLIC_PHANTOM_APP_ID=<your-portal-app-id>
```

4. Start iOS dev client build:

```bash
npm run start:ios
```

## Phantom Portal Settings

- `EXPO_PUBLIC_PHANTOM_APP_ID` is the same value as your Phantom Portal **App ID**.
- Keep `Allowed Origins` for web hosts only (for Quickscope web keep `https://app.quickscope.gg`).
- Add native callback URI to `Redirect URLs`:
  - `quickscope://phantom-auth-callback`
- Keep the web callback if needed for web auth:
  - `https://app.quickscope.gg`

## Useful Scripts

- `npm run start` - start Expo dev client server
- `npm run start:ios` - build/run iOS dev client
- `npm run start:android` - build/run Android dev client
- `npm run test:unit` - run unit tests once
- `npm run test:ci` - run non-watch unit tests for CI
- `npm run lint` - lint checks
- `npm run check-types` - TypeScript checks

## Deep Link Smoke Checks (iOS Simulator)

From another terminal tab:

```bash
xcrun simctl openurl booted "quickscope://token/So11111111111111111111111111111111111111112"
xcrun simctl openurl booted "quickscope://token-detail/So11111111111111111111111111111111111111112"
xcrun simctl openurl booted "quickscope://trade?in=So11111111111111111111111111111111111111112&out=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&amount=5"
xcrun simctl openurl booted "quickscope://portfolio/Z8wPMesZqDZv4URMfBFH6kwFwM4fxjpdRG33tMjNFeP"
xcrun simctl openurl booted "quickscope://telegram/share/So11111111111111111111111111111111111111112?chatId=123"
xcrun simctl openurl booted "https://app.quickscope.gg/trade/So11111111111111111111111111111111111111112"
xcrun simctl openurl booted "quickscope://unknown/route"
```

## Realtime Spike Check

- Open Dev Console either by:
  - tapping the temporary top-left `Q` logo button, or
  - opening hidden route:

```bash
xcrun simctl openurl booted "quickscope://dev"
```

- In **Realtime checks**, tap `Connect stream`.
- Expect status to move: `connecting` -> `connected` -> `subscribed`.
- When updates arrive, `Events` should increment and `Latest SOL` should refresh.

## Backend Session Hardening Check

- Open Dev Console either by:
  - tapping the temporary top-left `Q` logo button, or
  - opening hidden route:

```bash
xcrun simctl openurl booted "quickscope://dev"
```

- In **Backend session**, tap `Authenticate session`.
- Expect status to move to `authenticated` and subject/expiration fields to populate.
- Tap `Refresh session` and confirm status returns to `authenticated`.
- Force close and reopen the app:
  - session should restore from secure storage
  - if access token is stale but refresh token is valid, provider attempts refresh
- If you switch wallets in Phantom, app should invalidate stored backend session and prompt re-auth.
- Tap `Clear stored session` to reset to unauthenticated state.
- Run the full account-switch/logout QA matrix:
  - `../../docs/ios-103-auth-qa-matrix.md` (cases A1-A9)

## Week 2 Quality Lane (IOS-105)

- Unit test scaffold now covers:
  - deep-link parser routing matrix
  - auth session utility logic (expiration parsing, wallet-change invalidation)
  - secure-store session persistence + legacy migration fallback
- CI lane is defined at `../../.github/workflows/ios-checks.yml` and runs:
  - lint
  - typecheck
  - unit tests (`npm run test:ci`)
- First remote baseline run (2026-02-04): https://github.com/keelanbm/quickscope-ios-app/actions/runs/21684731224

## Discovery Week 2 Check (Trending / Scan Feed / Gainers)

- Open `Discovery` tab.
- Confirm top sub-tabs render: `Trending`, `Scan Feed`, `Gainers`.
- Switch each tab and verify list updates.
- Confirm list is rendered in traditional row/table style (not card layout).
- Confirm each row shows:
  - token ticker/name
  - platform tag
  - age
  - market cap
  - 1h % change
- Confirm row actions:
  - star toggle (`☆`/`★`)
  - link chips (`X`, `TG`, `Web`) when available
  - `Copy` copies token mint address
- Tap token symbol/name area and confirm `Token Detail` opens.
- Tap `Trade` on a row and confirm navigation to the `Search` tab with token context.
- Pull to refresh and verify updated timestamp changes.

## Scope Week 2 Check (New Pairs / Momentum / Scan Surge)

- Open `Scope` tab.
- Confirm top sub-tabs render: `New Pairs`, `Momentum`, `Scan Surge`.
- Switch each tab and verify list ordering updates.
- Confirm row includes:
  - token ticker/name
  - platform tag
  - market cap
  - age
  - 1h tx count
  - 1h % change
- Confirm row actions:
  - `Copy` copies token mint address
  - `Search` opens the `Search` tab with token context
- Tap token symbol/name area and confirm `Token Detail` opens.
- Pull to refresh and verify updated timestamp changes.

## Selected Smoke E2E Path (manual for Week 2)

Run this sequence on simulator/device after `npm run start:ios`:

1. Wallet connect from `Dev Console`.
2. `Run auth/challenge` then `Sign test message`.
3. `Authenticate session` and verify status becomes `authenticated`.
4. `Run parity checks` and confirm `public/getLatestSolPrice` passes.
5. `Connect stream` and verify events increment.
6. Open each deep link from the matrix in **Deep Link Smoke Checks**.

## Week 1 Spike Focus

- Phantom wallet connect and session behavior
- Auth challenge/solution compatibility with backend
- API transport parity for `public/*`, `private/*`, `tx/*`, `auth/*`
- Deep-link baseline behavior

## Current App Shell

- Primary bottom nav: Discover, Scope, Search, Tracking, Portfolio
- Secondary hidden routes: Telegram deep-link surface, Dev Console

See:

- `../../docs/week1-tickets.md`
- `../../docs/week1-execution-order.md`
- `../../docs/decision-log.md`
- `../../docs/week3-prep-token-flow-and-perf.md`
