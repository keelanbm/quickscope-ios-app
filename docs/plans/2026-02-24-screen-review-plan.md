# Quickscope iOS — Systematic Screen Review Plan

## Context

The app has reached functional maturity across 11 screens (6 tabs + 5 modals). Before adding new features, we need to audit every screen for consistency, readability, usability, and overall vibe — measured against the design principles doc, the token system, and mobile best practices for a trading audience.

**Goal:** Produce a prioritized punch-list of improvements per screen that can be executed in separate chat sessions. This plan is the evaluation framework — each session will read the screen code, evaluate against criteria, and propose specific changes.

**Audience context:** Solana memecoin traders. Speed-scanners. They compare dozens of tokens per minute. Every pixel of noise costs attention. Density is a feature but clarity wins.

---

## Global Evaluation Criteria (applied to every screen)

### Consistency
- [ ] Token usage — all colors, spacing, radius, shadows, typography via `qsColors`, `qsSpacing`, `qsRadius`, `qsShadows`, `qsTypography` (no inline values)
- [ ] Row structure — avatar(36-40) → symbol/name(flex) → right-aligned metrics with `tabular-nums`
- [ ] Tab style — underline indicator (2px accent bottom border), short labels
- [ ] Press feedback — every `Pressable` has visual feedback (pressed overlay or opacity)
- [ ] Haptics — `haptics.selection()` on tab switch, `haptics.light()` on refresh, haptic on every state change
- [ ] Empty states — uses `EmptyState` component (icon + title + subtitle)
- [ ] Missing data — shows "—" not "0"
- [ ] Formatting — uses shared `@/src/lib/format` utilities (not local duplicates)

### Readability
- [ ] Max 3 text sizes per screen (title 18-20, primary 14-16, secondary 11-12)
- [ ] Information hierarchy clear — primary data (price/MC/%) pops, metadata is quiet
- [ ] Sufficient contrast between text tiers (primary/secondary/tertiary/subtle)
- [ ] `tabular-nums` on all numeric columns for alignment
- [ ] Metric labels vs values have clear visual distinction

### Usability
- [ ] Primary action obvious within 3 seconds
- [ ] Can scan 5 rows in under 3 seconds
- [ ] Touch targets >= 44px for critical actions
- [ ] Pull-to-refresh where data is dynamic
- [ ] Loading states (skeleton) during initial fetch
- [ ] Error states handled (not inline per-row)
- [ ] Scroll performance (memoized rows, FlatList not ScrollView for lists)

### Vibe
- [ ] Dark-first aesthetic cohesive (layer0 canvas, layer1 cards)
- [ ] Green/Red ONLY for deltas (not decorative)
- [ ] Accent purple for actions only
- [ ] No visual clutter — one accent color per row max
- [ ] Spacing feels balanced (not cramped, not wasteful)
- [ ] Professional trust within 3 seconds (the "would I trust my money here?" test)

---

## Review Sessions (execute one per chat)

### Session 1: Foundation & Shared Components
**Files:** `tokens.ts`, `TokenListCard.tsx`, `TokenAvatar.tsx`, `AnimatedPressable.tsx`, `MetricBadge.tsx`, `SectionCard.tsx`, `Skeleton.tsx`, `EmptyState.tsx`, `FilterBar.tsx`, `SocialChips.tsx`, `SparklineChart.tsx`, `PresetButton.tsx`, `@/src/lib/format.ts`

**Evaluate:**
- Token completeness — are there gaps in the token system?
- `TokenListCard` density and scanability — is the 3-row layout (main + sparkline + footer) too tall? Could it be tighter?
- Formatting utilities — consolidate all `formatCompactUsd`, `formatPercent`, `formatCompactCount` into `lib/format` and remove local duplicates
- `AnimatedPressable` vs raw `Pressable` — which screens use which? Should AnimatedPressable be the default everywhere?
- `MetricBadge` — is the variant system (default/positive/negative/highlight) covering all use cases?
- Skeleton variants — do they match the actual content shapes they replace?

**Deliverables:**
- Consolidated format utilities in `lib/format.ts`
- Fix any inline shadows (TrackingFloatingNav known issue)
- Fix any hardcoded font sizes (use qsTypography.size)
- Establish shared component standards doc-comment or brief notes

---

### Session 2: Discovery Screen
**File:** `DiscoveryScreen.tsx`

**Content:** Trending/Gainers/Scans tabs → top movers carousel → FlatList of TokenListCards

**Evaluate:**
- Tab bar implementation — underline style correct? Haptics on switch?
- Top movers carousel — horizontal scroll UX (snap behavior, peek affordance, card sizing)
- TokenListCard usage — are all props being passed correctly? Is data mapping clean?
- Filter row below tabs — dropdown + chip + settings icon pattern
- Loading/empty/error states for each tab
- Pull-to-refresh + auto-refresh behavior
- Is the "Scans" tab differentiated enough from Scope's "Scans"?
- Star toggle persistence and feedback
- Quick trade (Zap) button — does it work? Is the flow clear?

**Deliverables:** Specific changes list for Discovery polish

---

### Session 3: Scope Screen
**File:** `ScopeScreen.tsx`

**Content:** New/Graduating/Graduated/Scans tabs → filter sheet (bottom sheet) → FlatList of token cards

**Evaluate:**
- Four-tab layout — does it feel crowded? Are labels clear enough?
- Bottom sheet filter UX — is it discoverable? Easy to use? Does it close cleanly?
- Filter state indicators — can user tell when filters are active?
- Token card layout in Scope vs Discovery — are they using the same `TokenListCard` or a different layout? Should they match?
- Scan results presentation — how does this differ from Discovery scans?
- Performance with large lists (memoization, pagination)

**Deliverables:** Specific changes list for Scope polish

---

### Session 4: Search Screen
**File:** `SearchScreen.tsx`

**Content:** Search input → zero-state (trending + recent) → live results → contract address detection

**Evaluate:**
- Search input styling and behavior — autofocus? Clear button? Placeholder text?
- Zero-state design — trending carousel + recent searches layout
- Debounce/instant search performance
- Result row format — same `TokenListCard` or simplified?
- Contract address auto-detect UX — is it obvious when detected?
- Recent searches — persistence, clear option, visual treatment
- Keyboard dismiss behavior on scroll
- Transition from zero-state to results (animation?)

**Deliverables:** Specific changes list for Search polish

---

### Session 5: Portfolio Screen
**File:** `PortfolioScreen.tsx`

**Content:** Wallet header card + stats → FlatList of expandable position rows with PnL breakdown

**Evaluate:**
- Wallet header card — balance display, address truncation, copy action
- Stats row — total value, total PnL, # positions — are these scannable?
- Position row — expand/collapse animation smoothness
- Expanded metric grid (2x3) — is the grid readable? Labels vs values clear?
- Color coding — PnL green/red correct usage
- Empty state when no positions
- Pull-to-refresh + pagination UX
- Auth-gated state — what does the locked view look like?

**Deliverables:** Specific changes list for Portfolio polish

---

### Session 6: Tracking Screen
**File:** `TrackingScreen.tsx`, `TrackingFloatingNav.tsx`

**Content:** Floating FAB nav (Wallets/Tokens/Chats) → wallet activity list, watchlist tokens, Telegram events

**Evaluate:**
- FloatingNav expand/collapse — timing, animation quality, scroll-to-collapse
- Section layout for each tab — are they visually distinct enough?
- Wallet activity rows — format, density, time display
- Watchlist sub-pills — pill selection UX, wrap behavior
- Telegram events section — integration with linked account
- Inline shadow fix in TrackingFloatingNav (known issue → use qsShadows)
- Dynamic header title update on tab switch
- Auth-gated state

**Deliverables:** Specific changes list for Tracking polish

---

### Session 7: Trade Flow (TradeEntry + ReviewTrade)
**Files:** `TradeEntryScreen.tsx`, `ReviewTradeScreen.tsx`

**Content:** Token select → amount input → quote preview → review → execute

**Evaluate:**
- TradeEntry form layout — input sizing, keyboard avoidance, amount presets
- Quote staleness indicator — is it noticeable? Color treatment?
- "Review Trade" CTA — prominence, disabled state clarity
- ReviewTrade quote display — is the breakdown scannable?
- Countdown timer UX — urgency without panic
- Execute button — confirmation flow, loading state during signature
- Error handling — failed quotes, rejected signatures, network errors
- PresetButton buy/sell color usage — correct semantic application

**Deliverables:** Specific changes list for Trade flow polish

---

### Session 8: Telegram, Deposit, Rewards Screens
**Files:** `TelegramScreen.tsx`, `DepositScreen.tsx`, `RewardsScreen.tsx`

**Content:** Three utility screens — linking, receiving SOL, earnings

**Evaluate:**
- TelegramScreen three states (loading → unlinked → linked) — transitions smooth? Unlinked CTA clear?
- Chat list format and density
- Token share sheet UX (deep link from Tracking)
- DepositScreen — address display, copy feedback, QR placeholder status
- RewardsScreen three tabs (Cashback/Scans/Referrals) — tab consistency with other screens
- Cumulative earnings display — number formatting, claim button prominence
- Referral code — copy UX, share option
- All three: do they feel like they belong in the same app? Same design language?

**Deliverables:** Specific changes list for utility screens polish

---

### Session 9: Navigation Shell & Cross-cutting
**Files:** `App.tsx`, `SlideOutDrawer`, header config, `SpikeConsoleScreen.tsx`

**Evaluate:**
- Bottom tab bar — icon + label treatment, active/inactive states, badge indicators
- Header — left (QS logo) and right (menu) buttons, title styling
- SlideOutDrawer — items, grouping, visual treatment
- Screen transitions — modal presentation style, gesture dismissal
- Deep link handling — does navigation feel natural from external entry?
- Tab bar stability — does it ever jump or re-render unexpectedly?
- Dev console — is it accessible but hidden? Does it load lazily?

**Deliverables:** Specific changes list for navigation shell polish

---

## Priority Order

| Priority | Session | Impact | Effort |
|----------|---------|--------|--------|
| 1 | Session 1: Foundation | High — fixes propagate everywhere | Medium |
| 2 | Session 2: Discovery | High — first screen users see | Medium |
| 3 | Session 5: Portfolio | High — where money lives | Low-Med |
| 4 | Session 4: Search | High — used constantly | Low-Med |
| 5 | Session 3: Scope | Medium — power user screen | Medium |
| 6 | Session 7: Trade Flow | High — revenue-critical | Medium |
| 7 | Session 6: Tracking | Medium — engagement driver | Medium |
| 8 | Session 8: Utility screens | Low-Med — supporting flows | Low |
| 9 | Session 9: Nav Shell | Medium — polish layer | Low |

---

## Known Issues to Fix (discovered during exploration)

1. **`TrackingFloatingNav.tsx`** — inline shadow values instead of `qsShadows` tokens
2. **Format utility duplication** — `formatCompactUsd()` and `formatPercent()` defined locally in `DiscoveryScreen.tsx`, `PortfolioScreen.tsx`, `TokenListCard.tsx` instead of imported from `lib/format`
3. **Hardcoded font sizes** — some screens use raw numbers (9, 10, 11, 13) instead of `qsTypography.size` tokens
4. **Mixed Pressable patterns** — `AnimatedPressable` (spring + haptic) exists but many screens still use raw `Pressable` with manual pressed styles
5. **Gap values** — some use raw numbers (`gap: 6`) instead of spacing tokens

---

## How to Execute Each Session

1. Open a new chat
2. Reference this plan: "Execute Session N from the screen review plan"
3. Read the target screen file(s) thoroughly
4. Evaluate against global criteria + session-specific criteria
5. Propose specific, actionable changes (file, line, what to change)
6. Implement changes
7. Run TypeScript check: `node apps/ios/node_modules/typescript/bin/tsc --noEmit --project apps/ios/tsconfig.json`
8. Commit with message: `fix(ui): polish [ScreenName] — consistency and readability improvements`
