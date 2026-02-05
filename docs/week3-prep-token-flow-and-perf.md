# Week 3 Prep - Token Entry Flows and List Performance

Date: 2026-02-04

## Purpose

Lock the initial Week 3 implementation shape for token-detail/trade entry and define baseline list performance checks for Discovery/Scope surfaces.

## Token Entry Flow Baseline

### Current behavior (ready now)

- Discovery row action `Trade` -> opens `Search` tab (`Trade` route) with `tokenAddress`.
- Scope row action `Search` -> opens `Search` tab (`Trade` route) with `tokenAddress`.
- Discovery row tap -> opens `TokenDetail` route with token context.
- Scope row tap -> opens `TokenDetail` route with token context.
- Token detail now sits on a stack over tabs (native back affordance).

### Week 3 target behavior

1. Promote `TokenDetail` from hidden-tab route to dedicated stack route.
2. Expand token detail route with:
   - token identity + social links
   - key market metrics (MC, 1h vol, 1h tx, 1h change)
   - primary CTA: `Open in Search`
3. `Trade` CTA opens existing `Search` route with token context.

### Proposed route shape (implemented baseline)

- Keep bottom tabs unchanged.
- Stack over tabs:
  - `MainTabs`
  - `TokenDetail`
- `Trade` remains the `Search` tab route reused for context handoff.

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

- Add simple mount/fetch timing logs per screen in development builds.
- Capture simulator + physical-device observations in this document.

## Success criteria for Week 3 prep complete

1. Token detail route contract is approved and ticketed.
2. Discovery/Scope list performance baseline data is captured on simulator and one physical device.
3. Any hotspots are translated into follow-up tasks before Week 4 trade depth work.
