# Week 3 Prep - Token Entry Flows and List Performance

Date: 2026-02-04

## Purpose

Lock the initial Week 3 implementation shape for token-detail/trade entry and define baseline list performance checks for Discovery/Scope surfaces.

## Token Entry Flow Baseline

### Current behavior (ready now)

- Discovery row action `Trade` -> opens dedicated `TradeEntry` stack route with `tokenAddress`.
- Scope row action `Search` -> opens `Search` tab with `tokenAddress`.
- Discovery row tap -> opens `TokenDetail` route with token context.
- Scope row tap -> opens `TokenDetail` route with token context.
- Token detail now sits on a stack over tabs (native back affordance).
- Trade deep links (`quickscope://trade/...`) now open `TradeEntry` directly.

### Week 3 target behavior

1. Promote `TokenDetail` from hidden-tab route to dedicated stack route.
2. Expand token detail route with:
   - token identity + social links
   - key market metrics (MC, 1h vol, 1h tx, 1h change)
   - primary CTA: `Trade`
3. Expand `TradeEntry` with read-only quote preview:
   - route context (input/output mint + amount)
   - quote request loading/error/success states
   - safe fallback link to Search tab
4. Add non-executing `ReviewTrade` confirmation screen:
   - quote recap and route context
   - explicit execute-disabled state until `tx/swap` guardrails are finalized
   - quote freshness visibility (TTL) so stale quotes are not reviewed/executed
5. Add execution path behind feature flag (`EXPO_PUBLIC_ENABLE_SWAP_EXECUTION`):
   - default disabled in dev/prod env templates
   - wallet/session/TTL mismatch blocks with explicit recovery messaging

### Proposed route shape (implemented baseline)

- Keep bottom tabs unchanged.
- Stack over tabs:
  - `MainTabs`
  - `TokenDetail`
  - `TradeEntry`
- `Trade` tab remains the Search surface for lookup/discovery tasks.

## Performance Baseline Plan

### Surfaces in scope

- `DiscoveryScreen` (`apps/ios/src/screens/DiscoveryScreen.tsx`)
- `ScopeScreen` (`apps/ios/src/screens/ScopeScreen.tsx`)

### Checks

1. Load latency:
   - time from screen mount to first list render
2. Refresh latency:
   - pull-to-refresh to list update timestamp
3. Scroll smoothness:
   - jank/frames dropped while fast-scroll through 50 rows
4. Memory sanity:
   - no runaway memory growth after 5 refresh cycles

### Instrumentation starting point

- Added simple mount/fetch timing logs per screen in development builds:
  - `[perf] Discovery fetch start/success/error`
  - `[perf] Discovery first data`
  - `[perf] Scope fetch start/success/error`
  - `[perf] Scope first data`
- Capture simulator + physical-device observations in this document.

## Success criteria for Week 3 prep complete

1. Token detail route contract is approved and ticketed.
2. Discovery/Scope list performance baseline data is captured on simulator and one physical device.
3. Any hotspots are translated into follow-up tasks before Week 4 trade depth work.
