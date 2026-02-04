# Expo 53 + New Phantom SDK Migration Plan

## Goal

Upgrade the iOS app from:

- Expo SDK 52 + `@phantom/react-native-wallet-sdk`

to:

- Expo SDK 53 + `@phantom/react-native-sdk` (appId-based config)

with the smallest risk path for MVP execution.

## Why This Path

- New Phantom SDK requires:
  - `expo >= 53`
  - `react >= 19`
  - `react-native >= 0.79`
- Moving to SDK 53 (not 54) keeps upgrade scope tighter while satisfying SDK requirements.

## Recommended Branch Strategy

1. Keep planning/docs work on current branch.
2. Run migration on dedicated branch:
   - `codex/expo53-phantom-sdk-migration-impl`
3. Merge only after:
   - local iOS build success
   - auth modal opens
   - connect flow succeeds
   - lint/typecheck green

## Pre-Migration Checklist

- [ ] Confirm Phantom Portal app has:
  - [ ] correct `appId`
  - [ ] Redirect URL: `quickscope://phantom-auth-callback` (or chosen callback)
  - [ ] Allowed Origin: `https://app.quickscope.gg` (for web paths)
- [ ] Confirm app scheme in `apps/ios/app.json` is `quickscope`
- [ ] Capture current baseline status:
  - [ ] `npm run check-types`
  - [ ] `npm run lint`

## Implementation Steps

Run from `apps/ios`:

```bash
# 1) Upgrade Expo stack to SDK 53 baseline
npx expo install expo@^53.0.26
npx expo install react@19 react-native@0.79
npx expo install --fix

# 2) Install Phantom SDK + required peers
npm uninstall @phantom/react-native-wallet-sdk
npm install @phantom/react-native-sdk
npx expo install expo-secure-store expo-web-browser expo-auth-session expo-router react-native-svg
npm install react-native-get-random-values

# 3) Validate dependency tree
npm ls @phantom/react-native-sdk expo react react-native
```

## App Code Migration Tasks

### 1) Environment keys

- Replace:
  - `EXPO_PUBLIC_PHANTOM_SDK_KEY`
- With:
  - `EXPO_PUBLIC_PHANTOM_APP_ID`

Files to update:

- `apps/ios/.env.example`
- `apps/ios/.env.local.template`
- `apps/ios/src/config/env.ts`

### 2) Provider setup

Move from wallet-sdk config to new SDK config:

- Provider: `PhantomProvider` from `@phantom/react-native-sdk`
- Required config:
  - `appId`
  - `scheme`
  - `providers` (`google`, `apple`)
  - `addressTypes` (Solana)
  - `authOptions.redirectUrl`

### 3) Wallet UI hooks

Migrate hook usage:

- old: `usePhantom()` with `isLoggedIn/showLoginOptions`
- new: `useModal()` + `usePhantom()` with `isConnected` semantics

### 4) Auth integration

Ensure flow remains:

1. connect wallet
2. request challenge (`auth/challenge`)
3. sign challenge
4. submit solution (`auth/solution`)
5. refresh (`auth/refresh`)

## Validation Matrix

### Build and quality

- [ ] `npm run check-types` passes
- [ ] `npm run lint` passes
- [ ] `npm run start:ios` builds dev client

### Wallet/auth runtime

- [ ] Phantom modal opens from app
- [ ] User can connect
- [ ] Address is available in app state
- [ ] challenge request succeeds
- [ ] message signing succeeds
- [ ] solution submission succeeds
- [ ] refresh succeeds on app resume/restart

### API parity

- [ ] public endpoints pass
- [ ] private endpoints require auth when unauthenticated
- [ ] private endpoints succeed after auth

## Rollback Plan

If migration blocks Week 1 outcomes:

1. Pause branch merge.
2. Continue MVP using existing `@phantom/react-native-wallet-sdk`.
3. Schedule migration as a dedicated Week 2/3 technical stream.

## Decision Gate

Approve merge only if all are true:

- [ ] iOS dev build stable
- [ ] wallet connect + sign stable
- [ ] auth session stable
- [ ] no blocker on Week 1 critical path tickets
