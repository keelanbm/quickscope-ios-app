# Scope Card Redesign

**Date:** 2026-02-21
**Status:** Ready to build
**Reference:** Axiom Surge (screenshot 2) — price-focused, spacious, ATH data, dense bottom metrics

---

## Goal

Redesign the `ScopeTokenRowItem` card to match the information density and layout of competitive trading terminals (Axiom Surge). Design for extended data with graceful placeholders where the API doesn't yet provide fields.

---

## Card Anatomy (4 rows)

```
┌──────────────────────────────────────────────────────────────────┐
│  [Avatar 48px]  Symbol  Name  📋 ⭐              3m             │  Row 1: Identity
│                 MC $14.7K                ● $14.9K  +0.9%        │  Row 2: Price hero
│                 3m · 5gg9..pump · 🐦 💬 🌐    ATH $15.4K 1.05× │  Row 3: Social + ATH
│  V $5.1K  L —  👥 66  ↕ 42  [📈23% 📉0% 🎯5%]      [⚡ .1 SOL] │  Row 4: Metrics + Buy
└──────────────────────────────────────────────────────────────────┘
```

### Row 1 — Identity
- **Avatar:** 48px (up from 36px), with platform badge overlay bottom-right
- **Symbol:** bold 15px `textPrimary`, single line, flex-shrink
- **Name:** muted 12px `textSecondary`, inline after symbol, single line
- **Copy icon:** 12px `textTertiary`, copies mint address, haptic feedback
- **Star icon:** 12px, accent when starred, `textTertiary` when not
- **Age:** top-right aligned, accent color, semi-bold 12px (e.g. "3m", "15s", "2h")

### Row 2 — Price Hero (biggest visual weight)
- **MC label + value:** left side, muted label "MC" + `textSecondary` value (e.g. "MC $14.7K")
- **Price dot + value:** right side, small colored dot (green/red) + large 16px bold price. Uses `marketCapUsd` as proxy until `priceUsd` available.
- **Change %:** inline after price, color-coded green/red, semi-bold 13px (e.g. "+0.9%")

### Row 3 — Social & ATH
- **Left cluster:** Age pill + abbreviated address (e.g. "5gg9..pump") + social icons row
  - Icons shown progressively: Copy address always, Twitter/Telegram/Website only when URL exists
  - Icons: 13px, `textTertiary`, hitSlop 6
- **Right cluster:** ATH value + multiplier (e.g. "ATH $15.4K  1.05x")
  - Placeholder: "ATH —" when not available

### Row 4 — Dense Metrics + Quick Buy
- **Metrics row (left):** Compact labeled values, 10px labels `textSubtle`, 11px values `textPrimary`
  - V (volume), L (liquidity), holders icon + count, TXs icon + count
  - Scans shown if > 0, accent-colored if > 10
  - Missing values show "—"
- **Percentage chips (middle):** Small colored pills for holder %, dev sold %, bundle %
  - Green if healthy, red if concerning (thresholds TBD)
  - Hidden entirely when data unavailable
- **Quick Buy (right):** Pill button, SOL icon + amount, `layer3` bg, `borderSubtle` border

---

## Data Mapping

| Card Element | Current `ScopeToken` field | Future field | When missing |
|---|---|---|---|
| Avatar | `imageUri` | — | Default icon |
| Platform badge | `platform` / `exchange` | — | Hidden |
| Symbol | `symbol` | — | "???" |
| Name | `name` | — | "Unnamed" |
| Age | `mintedAtSeconds` | — | "—" |
| MC | `marketCapUsd` | — | "$0" |
| Price | `marketCapUsd` (proxy) | `priceUsd` | Show MC value |
| Change % | `oneHourChangePercent` | — | "0%" |
| ATH | — | `athUsd` | "—" |
| ATH multiplier | — | `athMultiplier` | "—" |
| Volume | `oneHourVolumeUsd` | — | "$0" |
| Liquidity | — | `liquidityUsd` | "—" |
| Holders | — | `holderCount` | "—" |
| TXs | `oneHourTxCount` | — | "0" |
| Scans | `scanMentionsOneHour` | — | Hidden if 0 |
| Abbreviated address | `mint` (truncated) | — | "—" |
| Twitter URL | — | `twitterUrl` | Icon hidden |
| Telegram URL | — | `telegramUrl` | Icon hidden |
| Website URL | — | `websiteUrl` | Icon hidden |
| Holder % chip | — | `topHolderPercent` | Chip hidden |
| Dev sold % chip | — | `devSoldPercent` | Chip hidden |
| Bundle % chip | — | `bundlePercent` | Chip hidden |

---

## Styling Rules

- **Card:** `layer1` bg, `borderDefault` 1px border, `borderRadius: lg (12)`, 12px padding
- **Avatar:** 48px, `borderRadius: md (8)`
- **Platform badge:** 16px circle, `layer2` bg, `borderDefault` border, absolute bottom-right of avatar
- **Price hero:** Largest text in card (16px bold), color-coded dot prefix
- **Metric labels:** 10px uppercase `textSubtle`, letter-spacing 0.3
- **Metric values:** 11px semi `textPrimary`, `tabular-nums`
- **Social icons:** 13px `textTertiary`, 6px hitSlop, row gap 6px
- **Percentage chips:** 9px bold, `borderRadius: pill`, 4px vertical / 6px horizontal padding
  - Green chip: `buyGreen` text, `rgba(buyGreen, 0.1)` bg
  - Red chip: `sellRed` text, `rgba(sellRed, 0.1)` bg
  - Neutral chip: `textSecondary` text, `layer2` bg
- **Quick Buy:** `layer3` bg, `borderSubtle` border, `borderRadius: pill`, 28px height
- **Pressed state:** Card bg transitions to `layer2`
- **Haptics:** `haptics.light()` on copy, `haptics.selection()` on star toggle

---

## Implementation Notes

### Component structure
- Keep as inline `ScopeTokenRowItem` in `ScopeScreen.tsx` (NOT shared component — this is Scope-specific)
- Memoized with `React.memo` + custom comparator
- Props: same as current + future optional fields

### ScopeToken type extension (future API task)
Add optional fields to `ScopeToken` in `scopeService.ts`:
```typescript
// Future additions
priceUsd?: number;
athUsd?: number;
athMultiplier?: number;
liquidityUsd?: number;
holderCount?: number;
topHolderPercent?: number;
devSoldPercent?: number;
bundlePercent?: number;
twitterUrl?: string;
telegramUrl?: string;
websiteUrl?: string;
```

### Performance
- `removeClippedSubviews` on FlatList
- `windowSize: 10`, `maxToRenderPerBatch: 10`
- Custom memo comparator checking all displayed fields
- `fontVariant: ["tabular-nums"]` on all numeric values

---

## Future Tasks

- [ ] Extend `ScopeToken` API to include price, ATH, liquidity, holders, social URLs, percentage metrics
- [ ] Add DexScreener search icon (opens external link)
- [ ] Wire quick buy to TradeBottomSheet with pre-filled token
- [ ] Add "Paid" badge for promoted tokens (if applicable)
- [ ] Consider sparkline mini-chart in card (like Axiom Surge price bar)
