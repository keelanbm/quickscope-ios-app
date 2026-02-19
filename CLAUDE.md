# Quickscope iOS — Claude Context

React Native / Expo managed workflow with EAS builds. Solana memecoin trading terminal. Dark-first theme aligned with the web terminal.

---

## Design Tokens

```ts
import { qsColors, qsRadius, qsSpacing, qsTypography, qsShadows } from "@/src/theme/tokens";
```

**Full token definitions:** `apps/ios/src/theme/tokens.ts`

### Layers (backgrounds, darkest → lightest)

| Token    | Hex       | Use                          |
|----------|-----------|------------------------------|
| `layer0` | `#0a0810` | Canvas / root background     |
| `layer1` | `#14121e` | Cards, sheets, popovers      |
| `layer2` | `#191725` | Nested cards, inset sections |
| `layer3` | `#231f33` | Borders, muted fills, inputs |
| `layer4` | `#2f2850` | Hover / active bg            |
| `layer5` | `#312e48` | Lightest muted bg            |

### Text hierarchy

`textPrimary` (#f8f7fb) → `textSecondary` (#b7a8d9) → `textTertiary` (#7b6e9a) → `textSubtle` (#5f596c) → `textDisabled` (#5f596c)

### Color semantics

- **`accent`** (#7766f7) — primary actions, active states. `accentDeep` for pressed.
- **`buyGreen`** / **`sellRed`** — price deltas ONLY. Never for non-trade UI.
- **`success`** / **`danger`** / **`warning`** — status indicators.
- **`borderDefault`** (#231f33) — standard borders. `borderSubtle` for lighter.

### Spacing

`xxs(2)` `xs(4)` `sm(8)` `md(12)` `lg(16)` `xl(20)` `xxl(24)` `xxxl(32)` `xxxxl(40)` `xxxxxl(48)`

Most common: `sm`, `md`, `lg`.

### Radius

`xs(4)` `sm(6)` `md(8)` `lg(12)` `xl(16)` `pill(999)`

### Typography

- **Sizes:** xxxs(10) xxs(12) xs(13) sm(14) base(15) md(16) lg(18) xl(20) xxl(24) hero(40)
- **Weights:** regular(400) medium(500) semi(600) bold(700) heavy(800)
- Max 3 text sizes per screen: title 18-20, primary 14-16, secondary 11-12.

### Shadows

Use `qsShadows.sm`, `qsShadows.md`, `qsShadows.lg` — never write shadow values inline.

---

## Design Principles

Full document: `docs/design-principles.md`

1. **Density is a feature, clarity wins.** Help traders scan fast.
2. **Information hierarchy:** Primary (price/MC/%) → Secondary (age/volume) → Tertiary (metadata). If it's not tier 1-2, keep it quiet.
3. **Compact rows**, one primary action per row. Flat lists over cards.
4. **Two-tier nav:** primary tabs + secondary chips. Bottom tabs stay stable.
5. **Color rules:** Green/Red = deltas only. Purple = actions. Muted = metadata. One accent per row.
6. **Motion & feel:** 150-250ms, functional only. Physics-based where appropriate (rubber-band, spring-back). **Haptics mandatory** on state changes (`haptics.selection()` tabs, `haptics.light()` refresh). Every `Pressable` needs visual feedback (`pressedOverlay`).
7. **Missing data:** show "—", never "0".
8. **Progressive disclosure:** hide complexity behind taps. Show minimum needed, reveal on interaction (FAB nav, expandable controls).
9. **Win moments (Peak-End Rule):** identify wins (early catch, profitable trade, milestone). Amplify with accent flash / animation / celebratory copy. Prompt ratings/upgrades/shares only at peak moments.
10. **Shareability (Viral UX):** every win screen needs a share path. Branded card images (token name, chart, QS watermark) for dark social (X, Telegram, Discord). `expo-sharing` + `ViewShot`. Ticket: IOS-502.
11. **Consistency as a moat:** identical row structures, tab patterns, metric layouts across all screens. Reuse existing patterns before inventing. **3-second trust test:** would a new user trust this screen in 3 seconds?

---

## Component Patterns

### Underline Tabs
*Used in: ScopeScreen, DiscoveryScreen*

Active indicator via `borderBottomWidth: 2, borderBottomColor: qsColors.accent`. Tab bar has bottom border: `borderBottomWidth: 1, borderBottomColor: qsColors.borderDefault`. Labels are short (1 word), no icons in tab labels.

### Floating FAB Nav
*Used in: TrackingScreen (`TrackingFloatingNav.tsx`)*

Icon-only circle (44x44) with semi-transparent background, positioned bottom-right. Tap to expand into a horizontal row with icon + text labels. Collapses after tab switch (300ms delay) or on scroll. Screen header title updates dynamically via `navigation.setOptions({ title })`.

### Scrollable Candlestick Chart
*Used in: TokenChart.tsx*

Fixed candle width (8px) + gap (3px) inside a horizontal `ScrollView`. SVG width sized to content, not container. Auto-scrolls to end on mount. Touch interaction calculates candle index from fixed step size.

### Filter Row
*Used in: ScopeScreen*

Horizontal row below tabs: dropdown button (`ChevronDown` icon) + action chip + settings icon (`SlidersHorizontal`). Compact, single-line.

### Token Row
*Shared across: Discovery, Scope, Tracking, Search*

36x36 avatar → symbol/name column (flex: 1) → right-aligned metric columns. Metrics use `fontVariant: ["tabular-nums"]` for alignment. Value + sub-label stacked. Entire row is `Pressable` → navigates to TokenDetail.

### Watchlist Sub-pills
*Used in: TrackingScreen*

Pill-style chips for list selection. `borderRadius: pill`, `qsColors.accent` bg when active, `layer2` bg when inactive. Wrap in a `flexWrap: "wrap"` row.

### Empty States
*Component: `EmptyState.tsx`*

Icon component + bold title + muted subtitle. Single sentence. Centered in available space.

---

## Key Files

| Path | Purpose |
|------|---------|
| `apps/ios/src/theme/tokens.ts` | All design tokens |
| `docs/design-principles.md` | Full design principles |
| `apps/ios/src/ui/` | Shared components (icons, EmptyState, Skeleton, TrackingFloatingNav, TokenChart) |
| `apps/ios/src/app/App.tsx` | Tab navigator, header config, screen options |
| `apps/ios/src/screens/` | All screen components |
| `apps/ios/src/features/` | Service layers (API calls, data transforms) |
| `apps/ios/src/navigation/types.ts` | Navigation route types |

---

## Common Gotchas

- Always use `qsColors.accent` — never raw `#7766f7`.
- Never write shadow values inline — use `qsShadows` from tokens.
- `haptics.selection()` on tab switches, `haptics.light()` on pull-to-refresh.
- Screen layouts use `FlatList` with `ListHeaderComponent` — not `ScrollView` with inline content.
- `Animated` from React Native for most animations. `react-native-reanimated` is available but not commonly used.
- Icons come from `@/src/ui/icons` (Lucide-based). Check existing exports before adding new ones.
- TypeScript strict mode. Run `node apps/ios/node_modules/typescript/bin/tsc --noEmit --project apps/ios/tsconfig.json` to verify.
