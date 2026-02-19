# Quickscope iOS App — UX Overhaul Plan

**Version:** 2.1
**Last Updated:** February 7, 2026
**Status:** Finalized — UI treatment only, preserving all existing app functionality

> **v2.0 → v2.1**: Revised based on 5 reference screenshots (Robinhood PENGU, Copilot, GMGN 9bit, Fommo, Polymarket).
>
> **CORE PRINCIPLE: UI treatment only, not feature changes.**
> We are stealing visual patterns and interaction quality from premium apps.
> The app's features, data, tables, and screens stay the same as the web app.
>
> UI treatment changes:
> - Token image RIGHT-aligned, price LEFT-aligned (Robinhood pattern)
> - USD presets ($10, $50, $100) replace SOL presets
> - Persistent trade panel with order type selector + balance display
> - Edge-to-edge area chart default, candlestick toggle
> - Copilot-style "Top Movers" horizontal cards ABOVE the existing Discovery table (additive)
>
> What stays exactly the same:
> - Token Detail: All existing tables (metrics, holdings, chart, details) stay — just restyled
> - Discovery: Full token table stays — Top Movers carousel is additive only
> - Tracking: Current wallet tracking functionality unchanged (no leaderboard — doesn't exist yet)
> - All screen navigation, data fetching, and business logic unchanged

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Design System Updates](#design-system-updates)
3. [New Shared Components](#new-shared-components)
4. [Screen-by-Screen Redesign Specifications](#screen-by-screen-redesign-specifications)
5. [Trade Flow Architecture](#trade-flow-architecture)
6. [New Dependencies](#new-dependencies)
7. [Implementation Phases](#implementation-phases)
8. [Files to Create/Modify](#files-to-createmodify)

---

## Executive Summary

### Goals

This overhaul transforms Quickscope from a functional trading app into a speed-first, degen-optimized Solana trading terminal. The primary objectives are:

1. **Speed**: Reduce friction from discovery to execution — inline trade panel eliminates screen navigation
2. **Density**: Pack critical data (MC, Volume, TX, Fees, Socials) into scannable list cards
3. **Visual Clarity**: Add sparkline charts to list cards, upgrade to candlestick charts on detail view
4. **Quick Actions**: Persistent USD preset buttons ($10, $50, $100) and percentage-based sell buttons (25%, 50%, 75%, 100%)
5. **Consistency**: Unified design language across Discovery, Scope, and other screens

### Key Changes

- **Token Detail Screen**: Complete redesign with inline expandable trade panel (biggest value-add)
- **List Cards**: New dense card design with sparklines, social icons, and quick trade access
- **Charts**: Replace area chart with candlestick chart on detail; add sparklines to lists
- **Trade Flow**: Collapse → Quick Buy → Expand for advanced → Review → Execute
- **Navigation**: Keep current 5-tab structure, no changes

### Success Metrics

- Time-to-trade reduction: Target 50% faster (from token click to trade execution)
- User engagement: More trades per session via quick-buy presets
- Visual clarity: Immediate pattern recognition via sparklines in lists

---

## Design System Updates

### 1. New Color Tokens

Add to `/apps/ios/src/theme/tokens.ts`:

```typescript
export const qsColors = {
  // ... existing colors ...

  // Trade actions (critical additions)
  buyGreen: "#10b981",        // Pure buy action green
  buyGreenHover: "#0ea574",   // Active state
  buyGreenBg: "rgba(16, 185, 129, 0.12)",

  sellRed: "#ef4444",         // Pure sell action red
  sellRedHover: "#dc2626",    // Active state
  sellRedBg: "rgba(239, 68, 68, 0.12)",

  // Chart colors
  candleGreen: "#10b981",     // Up candles
  candleRed: "#ef4444",       // Down candles
  sparklineStroke: "#7766f7", // Sparkline line color
  sparklineFill: "rgba(119, 102, 247, 0.15)",

  // Metric badges
  metricHighlight: "#7766f7", // For emphasized metrics
  metricMuted: "#5f596c",     // For secondary metrics

  // Interactive states
  pressedOverlay: "rgba(119, 102, 247, 0.08)",
  hoverOverlay: "rgba(119, 102, 247, 0.04)",
} as const;
```

### 2. New Spacing Tokens

Add additional spacing values for tighter/looser layouts:

```typescript
export const qsSpacing = {
  // ... existing ...
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,

  // New additions
  xxxxl: 40,     // Large section spacing
  xxxxxl: 48,    // Screen-level spacing
} as const;
```

### 3. New Radius Tokens

Add pill/chip radius for action buttons:

```typescript
export const qsRadius = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,

  // New additions
  xl: 16,        // Large cards
  pill: 999,     // Fully rounded pills
} as const;
```

### 4. Typography Scale Additions

Add typography tokens for data-dense layouts:

```typescript
export const qsTypography = {
  size: {
    xxxs: 10,
    xxs: 12,
    xs: 13,
    sm: 14,
    base: 15,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,

    // New additions
    xxxl: 28,    // Hero text
    xxxxl: 32,   // Large titles
  },
  lineHeight: {
    // ... existing ...
    xxxl: 32,
    xxxxl: 36,
  },
  weight: {
    regular: "400" as const,
    medium: "500" as const,
    semi: "600" as const,
    bold: "700" as const,
    heavy: "800" as const,  // New: For emphasis
  },
} as const;
```

### 5. Shadow Tokens

Add subtle shadows for depth on floating elements:

```typescript
export const qsShadows = {
  none: {
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;
```

---

## New Shared Components

### 1. TokenListCard

**Purpose**: Unified, dense card for Discovery and Scope list items.

**File**: `/apps/ios/src/ui/TokenListCard.tsx`

**Props**:

```typescript
type TokenListCardProps = {
  // Core data
  symbol: string;
  name: string;
  imageUri?: string;
  mint: string;

  // Metrics
  marketCapUsd: number;
  oneHourVolumeUsd: number;
  oneHourTxCount: number;
  oneHourChangePercent: number;

  // Badge/label
  platformLabel: string;  // e.g., "PUMP", "RAYDIUM"

  // Social links
  twitterUrl?: string;
  telegramUrl?: string;
  websiteUrl?: string;

  // Sparkline data (optional for now)
  sparklineData?: Array<{ ts: number; value: number }>;

  // Callbacks
  onPress: () => void;
  onQuickTrade?: () => void;  // Quick trade button
  onToggleStar?: () => void;
  isStarred?: boolean;

  // Highlighted state
  highlighted?: boolean;
};
```

**Visual Spec**:

- **Container**:
  - Background: `layer0` (default) or `layer1` (highlighted)
  - Border bottom: 1px `borderDefault`
  - Padding: `sm` horizontal, `sm` vertical
  - Min height: 76px (accommodates two-row layout + footer)

- **Layout Structure**:
  ```
  [Row 1: Main Data]
    [Image 40x40] [Symbol + Name + Platform] [MC] [1h%] [Star + Quick Trade]

  [Row 2: Sparkline]
    [Mini chart 60h]

  [Row 3: Footer Meta]
    [Age • Vol • TX • Social Icons]
  ```

- **Row 1 Layout** (flex row, align center):
  - **Token Image**: 40x40, border-radius 20, bg `layer3`
  - **Token Info Column** (flex: 2.5):
    - **Symbol**: 15px, weight 700, color `textPrimary`
    - **Name**: 11px, color `textMuted`, single line truncate
    - **Platform Badge**: 9px, weight 600, color `textSubtle`, bg `layer2`, border `borderDefault`, pill radius, padding 4h/2v, margin-top 2
  - **MC Column** (flex: 1.2, align right):
    - Value: 12px, weight 600, color `textSecondary`, tabular-nums
  - **1h Change Column** (flex: 1, align right):
    - Value: 13px, weight 700, color `buyGreen` (positive) or `sellRed` (negative)
  - **Actions Column** (flex: 1, align right, gap 6):
    - **Star Button**: 16px icon, color `accent` (starred) or `textTertiary`
    - **Quick Trade Button**: Pill bg `layer4`, border `borderDefault`, padding 8h/4v, icon 12px + text 10px

- **Row 2: Sparkline** (optional):
  - Height: 60px
  - Margin left: 48px (align with token info)
  - Uses `SparklineChart` component

- **Row 3: Footer** (margin-top 6, margin-left 48):
  - **Meta Text**: 10px, color `textSubtle`, single line
    - Format: "2h • Vol $1.2M • TX 342"
  - **Social Icons Row** (flex row, gap 3, margin-top 4):
    - Each icon: 14px, bg `layer2`, border `borderDefault`, pill, padding 6h/2v
    - Icons: X, TG, Globe, Copy

**Touch Targets**:
- Card press: 44px min
- Star: 36px hitSlop
- Quick trade: 36px min
- Social icons: 32px min

---

### 2. QuickTradePanel (Persistent Bottom Panel — Robinhood Pattern)

**Purpose**: Persistent collapsed trade panel at bottom of token detail screen. Inspired by Robinhood's PENGU token detail trade panel. Shows order type, balance, token identity, MC, and USD preset buttons.

**File**: `/apps/ios/src/ui/QuickTradePanel.tsx`

**Props**:

```typescript
type QuickTradePanelProps = {
  // Token info
  tokenSymbol: string;
  tokenAddress: string;
  tokenDecimals: number;
  tokenImageUri?: string;
  marketCapUsd?: number;

  // Wallet info
  walletBalance?: number;  // In USDC/SOL
  balanceCurrency?: "USDC" | "SOL";  // Default: "SOL"

  // Callbacks
  onPresetPress: (usdAmount: number) => void;
  onExpandPress: () => void;
  onOrderTypeChange?: (type: "market" | "limit") => void;
  onSettingsPress?: () => void;

  // State
  disabled?: boolean;
  presets?: number[];  // Default: [10, 50, 100]
  orderType?: "market" | "limit";
};
```

**Visual Spec** (matches Robinhood PENGU panel):

- **Container**:
  - Position: Fixed at bottom (outside ScrollView)
  - Background: `#1C1C1E` (elevated surface, slightly lighter than layer1)
  - Border radius: 20px top-left, 20px top-right, 0 bottom
  - Padding: 12px top, 16px sides, 16px + safe-area bottom
  - Shadow: `lg` (floating feel)

- **Layout**:
  ```
  [Panel Header: Order Type + Balance + Settings]
  [Token Display: Icon + Symbol + MC]
  [Preset Buttons: $10 | $50 | $100]
  ```

- **Panel Header** (flex row, justify space-between, height 40px):
  - **Order Type Selector** (left):
    - Pill button: bg `layer2`, border `rgba(255,255,255,0.15)`, radius 16px
    - Text: "Market Buy", 14px, weight 600, color `textPrimary`
    - Tap: Opens order type picker (Market, Limit)
  - **Balance Display** (right):
    - Text: "SOL: 2.4" or "USDC: 9.7", 14px, weight 500, color `textSecondary`
  - **Settings Gear** (far right):
    - Icon: 24px, color `textSecondary`
    - Tap: Opens slippage/priority fee settings

- **Token Display** (centered, margin-top 16px):
  - Token icon: 48x48 circle, centered
  - Symbol: 20px, weight 700, color `textPrimary`, centered, margin-top 8px
  - Market cap: "MC: $511.1M", 13px, weight 500, color `textSecondary`, centered, margin-top 4px

- **Preset Buttons** (flex row, space-between, margin-top 16px):
  - Each button:
    - Flex: 1 (equal width, 33% minus spacing)
    - Height: 40px
    - Background: `rgba(255,255,255,0.1)`
    - Border: 1px `rgba(255,255,255,0.15)`
    - Border radius: 12px
    - Text: "$10", "$50", "$100" — 14px, weight 600, color `textPrimary`
    - Spacing: 12px between buttons
    - Min touch target: 44px
    - Active/pressed state: bg `buyGreenBg`, border `buyGreen`
    - Disabled: opacity 0.4

**Behavior**:
- Preset press: Immediately fetch quote for USD amount → navigate to ReviewTrade
- Order type tap: Bottom sheet with Market/Limit options
- Settings tap: Bottom sheet with slippage (0.5%, 1%, 2%, 5%) + priority fee
- Expand: Swipe up or tap "Custom" opens full `TradeBottomSheet`

**Key Change from v1**: USD presets ($10, $50, $100) instead of SOL presets.
This removes the cognitive load of SOL→USD conversion. Users think in dollars.

---

### 3. TradeBottomSheet

**Purpose**: Expandable bottom sheet with full trade form (buy/sell tabs, market/limit, custom amounts, percentage sell buttons).

**File**: `/apps/ios/src/ui/TradeBottomSheet.tsx`

**Dependency**: `@gorhom/bottom-sheet`

**Props**:

```typescript
type TradeBottomSheetProps = {
  tokenAddress: string;
  tokenSymbol: string;
  tokenDecimals: number;

  // User position (for sell tab)
  userBalance?: number;

  // Callbacks
  onQuoteRequest: (params: QuoteRequestParams) => Promise<void>;
  onClose: () => void;

  // Initial state
  defaultTab?: "buy" | "sell";
};
```

**Visual Spec**:

- **Container**: Bottom sheet with snap points [60%, 90%]
  - Background: `layer1`
  - Border radius top: `lg`
  - Handle: Centered, 40w x 4h, `layer3`, radius `pill`

- **Header** (padding `lg`):
  - **Title**: "Trade {symbol}", 18px, weight 700, color `textPrimary`
  - **Close Button**: Top-right, X icon 20px, color `textSecondary`

- **Tab Selector** (padding-h `lg`, margin-bottom `md`):
  - Two tabs: "Buy" and "Sell"
  - Active tab: bg `buyGreenBg` (buy) or `sellRedBg` (sell), text `buyGreen` / `sellRed`
  - Inactive tab: bg `layer2`, text `textMuted`
  - Pill-style, flex row, gap `xs`

- **Buy Tab Content**:
  - **Order Type Selector** (Market / Limit):
    - Segmented control, similar style to tabs
  - **Amount Input**:
    - Label: "Amount (SOL)", 12px, color `textTertiary`
    - Input: 16px, bg `layer2`, border `layer3`, radius `md`, padding `md`
  - **Preset Pills** (USD amounts — Robinhood pattern):
    - $10, $50, $100, Custom
  - **Quote Summary** (if quote fetched):
    - Estimated receive, price impact, fees
    - 12px, color `textSecondary`
  - **Get Quote Button**: Full-width, bg `buyGreen`, text `layer0`, 14px weight 700

- **Sell Tab Content**:
  - **Balance Display**:
    - "Your balance: {balance} {symbol}", 13px, color `textSecondary`
  - **Amount Input**: Same as Buy
  - **Percentage Buttons** (flex row, gap `sm`):
    - 25%, 50%, 75%, 100%
    - Background: `sellRedBg`
    - Border: 1px `sellRed`
    - Text: 13px, weight 700, color `sellRed`
    - Active state: bg `sellRed`, text `layer0`
  - **Quote Summary**: Same as Buy
  - **Get Quote Button**: Full-width, bg `sellRed`, text `layer0`

**Behavior**:
- Tapping a preset/percentage auto-fills amount and fetches quote
- Quote valid for 30s, shows countdown timer
- "Get Quote" navigates to ReviewTrade screen with params

---

### 4. CandlestickChart

**Purpose**: Replace current area chart with candlestick chart on token detail screen.

**File**: `/apps/ios/src/ui/CandlestickChart.tsx`

**Props**:

```typescript
type Candle = {
  ts: number;        // Unix timestamp (seconds)
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};

type CandlestickChartProps = {
  data: Candle[];
  height?: number;           // Default: 240
  isLoading?: boolean;
  formatValue: (value: number) => string;
  formatTimestamp: (ts: number) => string;
  onCandlePress?: (candle: Candle) => void;
};
```

**Visual Spec**:

- **Container**:
  - Background: `layer2`
  - Border: 1px `borderDefault`
  - Border radius: `md`
  - Height: 240px (default)
  - Padding: `sm`

- **Candles**:
  - **Up Candle** (close >= open):
    - Body fill: `candleGreen`
    - Wick stroke: `candleGreen`, width 1
  - **Down Candle** (close < open):
    - Body fill: `candleRed`
    - Wick stroke: `candleRed`, width 1
  - **Candle Width**: Dynamic based on data length, min 2px, max 12px
  - **Spacing**: 2px between candles

- **Active Candle** (on touch):
  - Overlay: Vertical dashed line at touch point
  - Tooltip: Floating card with OHLC values
    - Background: `layer1`
    - Border: 1px `borderDefault`
    - Padding: `sm`
    - Text: 11px, color `textSecondary`
    - Format: "O: $1.2M | H: $1.3M | L: $1.1M | C: $1.25M"

- **Axes**:
  - Y-axis: Right-aligned labels, 11px, color `textSubtle`
  - X-axis: Bottom labels (time), 10px, color `textSubtle`
  - Grid lines: Horizontal, dashed, color `borderDefault`, opacity 0.3

**Interaction**:
- Pan gesture: Scroll through candles
- Pinch gesture: Zoom in/out
- Tap: Show tooltip for candle

**Implementation Notes**:
- Build with `react-native-svg` (already installed)
- Use `react-native-gesture-handler` for pan/pinch
- Calculate candle positions based on container width and data length
- Normalize Y-axis based on min/max high/low values with 10% padding

---

### 5. SparklineChart

**Purpose**: Tiny inline chart for list cards, shows price trend at a glance.

**File**: `/apps/ios/src/ui/SparklineChart.tsx`

**Props**:

```typescript
type SparklineChartProps = {
  data: Array<{ ts: number; value: number }>;
  width: number;
  height: number;
  strokeColor?: string;
  fillColor?: string;
  strokeWidth?: number;
};
```

**Visual Spec**:

- **Container**:
  - Width: Dynamic (passed as prop, typically 100-150px)
  - Height: 60px
  - Background: Transparent
  - No border

- **Line**:
  - Stroke: `sparklineStroke` (default `accent`)
  - Stroke width: 1.5
  - Fill: `sparklineFill` (gradient from stroke color to transparent)

- **Rendering**:
  - Use `react-native-svg` Path
  - Normalize Y values to fit height with 5% top/bottom padding
  - Linear interpolation, no smoothing (straight lines between points)
  - No axes, no labels, no interaction

**Usage Example**:
```tsx
<SparklineChart
  data={sparklineData}
  width={120}
  height={60}
  strokeColor={qsColors.sparklineStroke}
  fillColor={qsColors.sparklineFill}
/>
```

---

### 6. SocialChips

**Purpose**: Standardized social link pills for list cards and detail screens.

**File**: `/apps/ios/src/ui/SocialChips.tsx`

**Props**:

```typescript
type SocialLink = {
  type: "twitter" | "telegram" | "website";
  url: string;
};

type SocialChipsProps = {
  links: SocialLink[];
  size?: "sm" | "md";  // sm for list, md for detail
  onPress?: (url: string) => void;
};
```

**Visual Spec**:

- **Container**: Flex row, gap `xs`

- **Chip** (size="sm"):
  - Background: `layer2`
  - Border: 1px `borderDefault`
  - Border radius: `pill`
  - Padding: 6h / 2v
  - Icon: 14px, color `textSecondary`
  - Min touch target: 32px

- **Chip** (size="md"):
  - Padding: 8h / 4v
  - Icon: 16px
  - Min touch target: 36px

- **Icons**:
  - Twitter: `XIcon`
  - Telegram: `TelegramIcon`
  - Website: `Globe` (lucide)

**Behavior**:
- Tap: Open URL in browser (or custom in-app browser if implemented)

---

### 7. MetricBadge

**Purpose**: Consistent metric display for MC, Volume, TX, etc.

**File**: `/apps/ios/src/ui/MetricBadge.tsx`

**Props**:

```typescript
type MetricBadgeProps = {
  label: string;
  value: string;
  variant?: "default" | "positive" | "negative" | "highlight";
  size?: "sm" | "md" | "lg";
};
```

**Visual Spec**:

- **Container**:
  - Background: `layer1`
  - Border: 1px `borderDefault`
  - Border radius: `md`
  - Padding: `sm` (size="sm"), `md` (size="md"), `lg` (size="lg")
  - Gap: 4px (vertical flex column)

- **Label**:
  - Size: 11px (sm), 12px (md), 13px (lg)
  - Color: `textTertiary`
  - Weight: 500

- **Value**:
  - Size: 14px (sm), 16px (md), 18px (lg)
  - Weight: 700
  - Color:
    - `textSecondary` (default)
    - `buyGreen` (positive)
    - `sellRed` (negative)
    - `metricHighlight` (highlight)
  - Font variant: tabular-nums

**Usage Example**:
```tsx
<MetricBadge label="Market Cap" value="$1.2M" size="md" />
<MetricBadge label="1h Change" value="+12.3%" variant="positive" />
```

---

### 8. PresetButton

**Purpose**: Reusable preset button for SOL amounts and sell percentages.

**File**: `/apps/ios/src/ui/PresetButton.tsx`

**Props**:

```typescript
type PresetButtonProps = {
  label: string;
  value: number | string;
  variant: "buy" | "sell";
  onPress: () => void;
  isActive?: boolean;
  disabled?: boolean;
};
```

**Visual Spec**:

- **Container**:
  - Border radius: `pill`
  - Padding: 10px vertical, 14px horizontal
  - Min width: 60px
  - Min height: 44px

- **Buy Variant**:
  - Background: `buyGreenBg` (default), `buyGreen` (active)
  - Border: 1px `buyGreen`
  - Text: 13px, weight 700, color `buyGreen` (default), `layer0` (active)

- **Sell Variant**:
  - Background: `sellRedBg` (default), `sellRed` (active)
  - Border: 1px `sellRed`
  - Text: 13px, weight 700, color `sellRed` (default), `layer0` (active)

- **Disabled State**:
  - Opacity: 0.5
  - No pointer events

**Usage Example**:
```tsx
<PresetButton
  label="0.5 SOL"
  value={0.5}
  variant="buy"
  onPress={() => handlePreset(0.5)}
/>
<PresetButton
  label="50%"
  value={50}
  variant="sell"
  onPress={() => handlePercentage(50)}
/>
```

---

## Screen-by-Screen Redesign Specifications

### Discovery Screen

**File**: `/apps/ios/src/screens/DiscoveryScreen.tsx`

> **IMPORTANT: The full token table stays.** Top Movers carousel is ADDITIVE ONLY —
> it goes above the existing table. All current functionality (tabs, FlatList, pull-to-refresh) unchanged.

#### Changes Summary

1. **Add** "Top Movers" horizontal scroll cards ABOVE existing table (Copilot pattern — additive)
2. **Restyle** existing flat list rows with `TokenListCard` component (same data, better visual treatment)
3. Add sparkline charts to each card (additive)
4. Keep all existing tabs (Trending, Scan Feed, Gainers)
5. Keep pull-to-refresh (already exists)
6. Keep full token table exactly as-is (just better row styling)

#### Layout Structure

```
[Header Section]
  - Title: "Discovery", 30px, weight 700
  - Subtitle: Current tab description, 14px, color `textMuted`
  - Meta row: "{count} tokens" | "Updated {time}", 12px, color `textSubtle`

[Top Movers Carousel] (NEW — Copilot pattern, ADDITIVE above existing table)
  - Section heading: "Top Movers", 17pt, weight 600
  - Horizontal scrolling FlatList
  - Cards: 140px × 96px, bg `rgba(255,255,255,0.06)`, radius 12px
  - Each card: Symbol (13pt bold), Value (15pt bold), Sparkline (60×32px), Change % (13pt, green/red)
  - Card spacing: 12px between
  - Shows top 10 by 1h change %
  - Tappable → navigates to token detail

[Tab Selector] (UNCHANGED)
  - Tabs: Trending, Scan Feed, Gainers
  - Style: Same as current (pill-style buttons)

[Full Token Table] (STAYS — restyled rows only)
  - FlatList with TokenListCard components (same data, better visual treatment)
  - Pull-to-refresh enabled (unchanged)
  - 76px min height per card
  - All columns/data stay the same
```

#### TokenListCard Integration

**Props Mapping**:

```typescript
<TokenListCard
  symbol={item.symbol}
  name={item.name}
  imageUri={item.imageUri}
  mint={item.mint}
  marketCapUsd={item.marketCapUsd}
  oneHourVolumeUsd={item.oneHourVolumeUsd}
  oneHourTxCount={item.oneHourTxCount}
  oneHourChangePercent={item.oneHourChangePercent}
  platformLabel={(item.platform || item.exchange).toUpperCase()}
  twitterUrl={item.twitterUrl}
  telegramUrl={item.telegramUrl}
  websiteUrl={item.websiteUrl}
  sparklineData={item.sparklineData}  // Fetch from API
  onPress={() => navigateToTokenDetail(item)}
  onQuickTrade={() => navigateToTradeEntry(item)}
  onToggleStar={() => toggleStar(item.mint)}
  isStarred={starredMints[item.mint]}
  highlighted={selectedTokenAddress === item.mint}
/>
```

#### Filter Bar Component

**New Component**: `/apps/ios/src/ui/FilterBar.tsx`

**Visual Spec**:

- Container: Flex row, gap `sm`, padding-h `lg`, padding-v `md`, bg `layer0`
- Sort Button:
  - Background: `layer2`, border `borderDefault`, radius `md`
  - Padding: 8v / 12h
  - Text: 13px, color `textSecondary`, weight 600
  - Icon: ChevronDown 14px
  - Press: Opens dropdown menu with sort options
- Filter Chips:
  - Same style as sort button
  - Active state: border `accent`, bg `rgba(119, 102, 247, 0.1)`
  - Remove icon on active chips

#### Performance Considerations

- Fetch sparkline data in batches (10 tokens at a time)
- Memoize TokenListCard to prevent re-renders
- Use `getItemLayout` for FlatList optimization
- Virtualization already handled by FlatList

---

### Scope Screen

**File**: `/apps/ios/src/screens/ScopeScreen.tsx`

#### Changes Summary

1. Use same `TokenListCard` component as Discovery
2. Add live update indicator (pulsing dot)
3. Differentiate with "Real-time" badge on cards
4. Auto-refresh every 10 seconds

#### Layout Structure

```
[Header Section]
  - Title: "Scope", 30px, weight 700
  - Subtitle: "Real-time token screener", 14px, color `textMuted`
  - Live indicator: Pulsing green dot + "Live" text

[Filter Bar]
  - Same as Discovery
  - Additional: Time range selector (1m, 5m, 15m)

[Token List]
  - Same TokenListCard as Discovery
  - Badge: "LIVE" on each card (top-right corner)
```

#### Live Indicator Component

**New Component**: `/apps/ios/src/ui/LiveIndicator.tsx`

**Visual Spec**:

- Container: Flex row, gap 6, align center
- Dot: 8x8 circle, bg `buyGreen`
- Animation: Pulse (scale 1 → 1.2 → 1, duration 1.5s, repeat)
- Text: "Live", 12px, color `buyGreen`, weight 600

#### Real-time Badge

- Position: Absolute, top 8, right 8
- Background: `buyGreenBg`
- Border: 1px `buyGreen`
- Padding: 4h / 2v
- Text: "LIVE", 9px, weight 700, color `buyGreen`

---

### Token Detail Screen (BIGGEST REDESIGN)

**File**: `/apps/ios/src/screens/TokenDetailScreen.tsx`

> **IMPORTANT: UI treatment only.** All existing data sections stay (metrics grid, holdings card,
> chart, details card). We are restyling the layout, not removing content.
> The web app has positions/holders/traders tables — those STAY as-is when ported.

#### Changes Summary

1. **Remove**: Separate TradeEntry navigation button (replaced by inline panel)
2. **Add**: Inline `QuickTradePanel` at bottom (persistent collapsed state)
3. **Add**: Expandable `TradeBottomSheet` (full trade form)
4. **Restyle**: Hero section layout (Robinhood pattern: price LEFT, image RIGHT)
5. **Upgrade**: Chart to edge-to-edge with area default + candlestick toggle
6. **Restyle**: Metrics grid with MetricBadge components (same data, better styling)
7. **Keep**: All existing tables — positions, holders, traders (from web app) stay exactly as-is
8. **Enhance**: Social links with `SocialChips` component

#### Layout Structure (v2.1 — Robinhood Treatment on Existing Content)

```
[ScrollView Content]

  [Navigation Header]
    - Back arrow (left), Star + Share + More icons (right)
    - Height: 44px

  [Hero Section — Robinhood Pattern] (RESTYLED, same data)
    - Token label: "SYMBOL • Full Name" (14pt, muted, LEFT)
    - Token image: 64x64 circle, RIGHT-aligned
    - Price: 40pt, bold, LEFT-aligned (LARGE)
    - Change: "+$0.0₃4549 (+7.33%)" 16pt, green/red, LEFT
    - Spacing: 24px below change before chart

  [Area Chart — Edge-to-Edge] (default, UPGRADED)
    - Height: 280px
    - Full bleed: 0px horizontal padding
    - Green gradient area chart (positive) / Red (negative)
    - Touch to scrub with crosshair + value tooltip
    - Timeframe pills: 1H | 1D | 1W | 1M | 3M | 1Y
    - Chart type toggle: Area ↔ Candle (top-right icon)

  [Metrics Grid] (RESTYLED with MetricBadge, same data)
    - 2x2 grid of MetricBadge components
    - Metrics: MC, 1h Volume, 1h TX, 1h Change
    - Additional: Age, Liquidity (same as current)

  [Holdings Section] (RESTYLED, same data — if wallet connected)
    - Balance, Total PnL, PnL %
    - Quick sell button (opens TradeBottomSheet with sell tab)

  [Existing Tables — UNCHANGED]
    - Positions table (from web app — stays as-is)
    - Holders table (from web app — stays as-is)
    - Traders table (from web app — stays as-is)
    - These are ported from web app with visual styling only

  [Details Card] (RESTYLED, same data)
    - Contract address (copy button)
    - Social links (SocialChips — upgraded component)
    - Platform badge
    - Explorer links

[QuickTradePanel] (NEW — persistent bottom, Robinhood pattern)
  - Order type: "Market Buy"
  - Balance: "SOL: 2.4"
  - Token icon + Symbol + MC
  - Preset buttons: $10 | $50 | $100
```

#### Hero Section Details (v2.0 — Robinhood Pattern)

**Visual Spec**:

- Container: Padding 16px horizontal, 16px top
- Layout: Relative positioning (token image absolute right)

- **Token Label** (top):
  - Text: "{SYMBOL} • {Full Name}"
  - Size: 14pt, weight 500, color `textSecondary` (#8E8E93)
  - Left-aligned

- **Token Image** (absolute positioned):
  - Size: 64x64
  - Border-radius: 32 (circle)
  - Background: `layer2` (fallback)
  - Position: Absolute, top 0, right 16
  - This overlaps with the label/price area — Robinhood pattern

- **Price** (below label):
  - Size: 40pt, weight 700, color `textPrimary`
  - Letter spacing: -0.5 (tight, confident feel)
  - Left-aligned with 16px margin
  - Margin top: 4px below label
  - Format: "$0.006662" — show full precision for micro-cap tokens
  - Font variant: tabular-nums

- **Change** (below price):
  - Size: 16pt, weight 600
  - Color: `buyGreen` (#00D084) for positive, `sellRed` (#FF3B30) for negative
  - Format: "+$0.0₃4549 (+7.33%)" — absolute + percentage
  - Use subscript for repeating zeros: 0₃ = 0.000 (Robinhood convention)
  - Margin top: 4px below price
  - Bottom margin: 24px before chart

- **Action Icons** (navigation header, not hero):
  - Star (watchlist): 24px, toggleable
  - Share: 24px
  - More (⋮): 24px
  - All in navigation header row, right-aligned, 12px spacing

#### Chart Section (v2.0 — Edge-to-Edge)

**Visual Spec**:

- Container: NO padding (edge-to-edge, full bleed)
- Default mode: **Area chart** (Robinhood pattern)
- Toggle mode: **Candlestick chart** (GMGN pattern)
- Height: 280px (generous for touch interaction)

- **Area Chart (default)**:
  - Line: 2px stroke, color `buyGreen` (up) or `sellRed` (down)
  - Fill: Linear gradient from rgba(0, 208, 132, 0.3) at line → transparent at bottom
  - No axes, no grid lines, no labels (clean minimal)
  - Scrub: Touch anywhere → vertical crosshair + floating price tooltip

- **Candlestick Chart (toggle)**:
  - Up candles: body fill `candleGreen`, wick `candleGreen`
  - Down candles: body fill `candleRed`, wick `candleRed`
  - Candle width: Dynamic, min 2px max 12px
  - Spacing: 2px between candles

- **Chart Type Toggle** (top-right of chart area):
  - Icon: Candle icon ↔ Line icon (16px)
  - Background: `layer2`, radius 8px, 32x32px
  - Position: Absolute, top 8, right 16
  - Tap to switch between area and candlestick

- **Timeframe Selector** (below chart):
  - Top margin: 8px
  - Pills: 1H | 1D | 1W | 1M | 3M | 1Y
  - Pill height: 28px, horizontal padding 12px
  - Active: bg `rgba(255,255,255,0.12)`, text white 600
  - Inactive: text `#8E8E93`, weight 500
  - Size: 13pt, radius fully rounded (14px)
  - Spacing: 8px between pills
  - Centered in container, 16px horizontal margin
  - Bottom padding: 20px

#### Metrics Grid Section

**Visual Spec**:

- Container: Padding-h `xl`, padding-v `md`, bg `layer0`
- Grid: Flex row, wrap, gap `sm`
- Each metric: 48% width (2 columns)
- Use `MetricBadge` component:

```tsx
<MetricBadge label="Market Cap" value={formatCompactUsd(marketCapUsd)} size="md" />
<MetricBadge label="1h Volume" value={formatCompactUsd(oneHourVolumeUsd)} size="md" />
<MetricBadge label="1h Transactions" value={oneHourTxCount.toLocaleString()} size="md" />
<MetricBadge
  label="1h Change"
  value={formatPercent(oneHourChangePercent)}
  variant={oneHourChangePercent >= 0 ? "positive" : "negative"}
  size="md"
/>
```

#### Holdings Section

**Visual Spec** (if user has position):

- Container: Padding `xl`, bg `layer1`, border-top 1px `borderDefault`, border-bottom 1px `borderDefault`
- Header (flex row, justify space-between, align center):
  - Title: "Your Holdings", 16px, weight 600, color `textPrimary`
  - Quick Sell Button: Pill, bg `sellRedBg`, border `sellRed`, text "Sell", 12px
- Metrics (flex row, gap `md`):
  - Balance: MetricBadge, size="sm"
  - Total PnL: MetricBadge, variant based on value
  - PnL %: MetricBadge, variant based on value

#### QuickTradeBar Integration

**Position**: Sticky footer (outside ScrollView)

**Visual Spec**:

- Use `QuickTradeBar` component
- Callbacks:
  - `onPresetPress(amount)`: Fetch quote, navigate to ReviewTrade
  - `onExpandPress()`: Open TradeBottomSheet

**State Management**:

```typescript
const [isTradeSheetOpen, setIsTradeSheetOpen] = useState(false);
```

#### TradeBottomSheet Integration

**Trigger**: Expand button on QuickTradeBar

**Props**:

```typescript
<TradeBottomSheet
  tokenAddress={tokenAddress}
  tokenSymbol={symbol}
  tokenDecimals={tokenDecimals}
  userBalance={positionInfo?.balance}
  onQuoteRequest={handleQuoteRequest}
  onClose={() => setIsTradeSheetOpen(false)}
  defaultTab="buy"
/>
```

**Behavior**:

- Opens from bottom with animation
- Handles quote fetching
- On successful quote, navigates to ReviewTrade
- Closes on backdrop press or close button

---

### Search Screen

**File**: `/apps/ios/src/screens/SearchScreen.tsx`

#### Changes Summary

1. Keep current search functionality
2. Add recent/trending tokens section
3. Use `TokenListCard` for results
4. Add quick trade button to results

#### Layout Structure

```
[Search Input]
  - Large input with icon
  - Placeholder: "Search tokens by symbol or address"

[Recent Searches] (if no query)
  - Title: "Recent", 14px, color `textMuted`
  - List: 3-5 recent tokens, compact card style

[Search Results] (if query)
  - TokenListCard components
  - Quick trade button on each card
```

#### Visual Changes

- Search input height: 48px (up from current)
- Results: Use TokenListCard (same as Discovery)
- Empty state: Illustration + "No tokens found"

---

### Portfolio Screen

**File**: `/apps/ios/src/screens/PortfolioScreen.tsx`

#### Changes Summary

1. Redesign holdings list with PnL visualization
2. Add quick sell access from holdings
3. Show position history timeline
4. Add summary cards (total value, total PnL, best/worst performers)

#### Layout Structure

```
[Summary Section]
  - Total Value: Large card, 28px value
  - Total PnL: Color-coded, 24px value + %
  - 24h Change: 18px value

[Holdings List]
  - TokenListCard variant with position data
  - Additional row: Entry price, Current price, PnL
  - Quick sell button

[Position History] (NEW)
  - Timeline view of trades
  - Entry/exit markers on mini chart
```

#### Summary Card Visual Spec

- Container: Padding `xl`, bg `layer1`, border `borderDefault`, radius `lg`
- Total Value: 28px, weight 800, color `textPrimary`
- PnL: 24px, weight 700, color `buyGreen` or `sellRed`
- 24h Change: 18px, weight 600, color based on value

#### Holdings Card (TokenListCard variant)

**Additional Props**:

```typescript
{
  // Standard TokenListCard props...

  // Position-specific
  balance: number;
  entryPrice: number;
  currentPrice: number;
  totalPnlQuote: number;
  totalPnlPercent: number;

  // Callbacks
  onQuickSell: () => void;
}
```

**Visual Additions**:

- Position row (below main data):
  - Entry: $X | Current: $Y | PnL: +$Z (+12%)
  - 11px, color `textSecondary` (entry/current), `buyGreen` or `sellRed` (PnL)
- Quick Sell Button:
  - Pill, bg `sellRedBg`, border `sellRed`, text "Sell", 11px
  - Opens TradeBottomSheet with sell tab

---

### Tracking Screen (v2.1 — Visual Upgrade Only, Same Functionality)

**File**: `/apps/ios/src/screens/TrackingScreen.tsx`

#### Changes Summary (UI treatment only)

1. Apply Robinhood-style typography to wallet cards (bolder, cleaner hierarchy)
2. Apply Fommo-style row spacing and touch targets (64px rows)
3. Color-code activity actions (green for buys, red for sells)
4. Improve wallet card visual treatment (subtle dividers instead of heavy borders)
5. **No leaderboard** — feature doesn't exist yet, keep current wallet tracking

#### Layout Structure (same structure, better styling)

```
[Header]
  - Title: "Tracking", 30px, weight 700
  - Add Wallet Button: Top-right, pill style

[Tracked Wallets Section]
  - Wallet cards with cleaner visual treatment
  - Apply 1px dividers instead of card borders (Robinhood pattern)
  - Each card: Address (14pt bold), nickname (12pt muted), alert count badge
  - Actions: Copy, View activity, Configure alerts

[Activity Feed]
  - Chronological list of wallet actions
  - Apply color-coded action pills: Buy (green bg), Sell (red bg), Add/Remove (neutral)
  - Action rows: 64px min height (Fommo touch target)
  - Token symbol + amount + time ago, cleaner typography
```

#### Wallet Card Visual Spec

- Container: Padding `md`, bg `layer1`, border `borderDefault`, radius `md`
- Address: 14px, weight 600, color `textPrimary`, truncated
- Nickname: 12px, color `textMuted`
- Alert count badge: Pill, bg `brand`, text `layer0`, 10px
- Actions row (flex row, gap `sm`):
  - Copy button
  - View activity button
  - Configure alerts button

---

## Trade Flow Architecture

### Overview

The new trade flow eliminates the separate TradeEntry screen and provides inline trading on the token detail page.

### Flow Diagram

```
Discovery/Scope List
    ↓
    ↓ (tap card)
    ↓
Token Detail Screen
    ↓
    ↓ (tap $10/$50/$100 preset on QuickTradePanel)
    ↓
ReviewTrade Screen (with quote)
    ↓
    ↓ (confirm)
    ↓
Execute Trade
    ↓
Success/Error State

--- OR ---

Token Detail Screen
    ↓
    ↓ (tap expand on QuickTradeBar)
    ↓
TradeBottomSheet (full form)
    ↓
    ↓ (fill amount, get quote)
    ↓
ReviewTrade Screen
    ↓
    ↓ (confirm)
    ↓
Execute Trade
```

### QuickTradeBar State Machine

**States**:

1. **Collapsed (Default)**:
   - Shows: Preset SOL buttons (0.1, 0.5, 1, 2) + Expand button
   - Actions:
     - Tap preset → Fetch quote → Navigate to ReviewTrade
     - Tap expand → Open TradeBottomSheet

2. **Loading** (during quote fetch):
   - Shows: Loading spinner, disabled buttons
   - Duration: ~1-2 seconds

3. **Error** (quote fetch failed):
   - Shows: Error message + Retry button
   - Actions:
     - Tap retry → Re-fetch quote

### TradeBottomSheet State Machine

**States**:

1. **Closed**: Not rendered

2. **Open - Buy Tab - Empty**:
   - Shows: Amount input (empty), preset buttons, disabled Get Quote button
   - Actions:
     - Enter amount → Enable Get Quote
     - Tap preset → Auto-fill amount, enable Get Quote
     - Tap Get Quote → Fetch quote → Show quote summary

3. **Open - Buy Tab - Quote Ready**:
   - Shows: Quote summary, countdown timer, Review Trade button
   - Actions:
     - Tap Review Trade → Navigate to ReviewTrade
     - Timer expires → Show "Quote expired, refresh"
     - Tap Refresh → Re-fetch quote

4. **Open - Sell Tab - Empty**:
   - Shows: User balance, amount input, percentage buttons, disabled Get Quote
   - Actions:
     - Tap percentage → Auto-calculate amount, enable Get Quote
     - Enter amount → Enable Get Quote
     - Tap Get Quote → Fetch quote

5. **Open - Sell Tab - Quote Ready**:
   - Same as Buy Tab with quote

### Authentication Handling

**Unauthenticated State**:

- QuickTradeBar: Shows "Connect Wallet" button instead of presets
- TradeBottomSheet: Shows auth prompt at top
- ReviewTrade: Cannot be reached

**Authenticated but Expired Token**:

- Quote fetch fails with "Authentication required"
- Show "Session expired" error
- Provide "Re-authenticate" button

### Error States

**Network Error**:

- Show: "Network error, check connection"
- Action: Retry button

**Insufficient Balance**:

- Detected on quote fetch
- Show: "Insufficient SOL balance" with current balance
- Disable quote button

**Quote Expired**:

- After 30 seconds from quote fetch
- Show: "Quote expired" with countdown
- Action: "Refresh Quote" button

**Slippage Too High**:

- Detected on quote response
- Show: Warning badge on quote summary
- Allow user to proceed or adjust slippage

### Navigation Flow Details

**From Discovery → Token Detail**:

```typescript
navigation.navigate("TokenDetail", {
  source: "discovery-row",
  tokenAddress: item.mint,
  tokenDecimals: item.tokenDecimals,
  symbol: item.symbol,
  name: item.name,
  imageUri: item.imageUri,
  // ... other params
});
```

**From QuickTradeBar → ReviewTrade**:

```typescript
// After quote fetch
navigation.navigate("ReviewTrade", {
  source: "quick-trade-bar",
  walletAddress,
  inputMint: SOL_MINT,
  outputMint: tokenAddress,
  amountUi: presetAmount,
  amountAtomic: quote.amountAtomic,
  // ... other quote params
});
```

**From TradeBottomSheet → ReviewTrade**:

```typescript
// After quote fetch in bottom sheet
navigation.navigate("ReviewTrade", {
  source: "trade-bottom-sheet",
  // ... same params as above
});
```

### ReviewTrade Screen Updates

**Changes**:

- No changes to UI
- Keep existing confirmation flow
- Add source tracking for analytics

---

## New Dependencies

### 1. @gorhom/bottom-sheet

**Version**: `^4.7.5`

**Purpose**: Expandable bottom sheet for trade panel

**Installation**:

```bash
npm install @gorhom/bottom-sheet@^4.7.5
```

**Configuration**:

Add to `babel.config.js`:

```javascript
module.exports = {
  presets: ['babel-preset-expo'],
  plugins: ['react-native-reanimated/plugin'],  // Already exists
};
```

Add to `app.json`:

```json
{
  "expo": {
    "plugins": [
      "react-native-reanimated"  // Already exists
    ]
  }
}
```

**Usage Example**:

```tsx
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet';

const TradeBottomSheet = () => {
  const snapPoints = useMemo(() => ['60%', '90%'], []);

  return (
    <BottomSheet
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={BottomSheetBackdrop}
    >
      {/* Content */}
    </BottomSheet>
  );
};
```

### 2. Chart Library Consideration

**Options**:

1. **Build custom with react-native-svg** (RECOMMENDED):
   - Already installed
   - Full control over design
   - Lighter bundle size
   - Cons: More implementation time

2. **react-native-chart-kit**:
   - Pros: Pre-built candlestick charts
   - Cons: Limited customization, larger bundle

3. **victory-native**:
   - Pros: Powerful, flexible
   - Cons: Heavy (~500kb), complex API

**Recommendation**: Build custom `CandlestickChart` with react-native-svg. Estimated implementation time: 6-8 hours.

### 3. Optional: react-native-skia (Future Enhancement)

**Version**: `^1.9.0`

**Purpose**: High-performance chart rendering

**When to Consider**: If chart performance is an issue with SVG implementation (unlikely for <100 candles)

---

## Implementation Phases

### Phase 1: Foundation (Week 1)

**Goal**: Build new components and update design system

**Tasks**:

1. **Update Design Tokens** (2 hours):
   - Add new colors (buyGreen, sellRed, candleGreen, etc.)
   - Add new spacing, radius, shadow tokens
   - Update typography tokens
   - File: `/apps/ios/src/theme/tokens.ts`

2. **Install Dependencies** (1 hour):
   - Install `@gorhom/bottom-sheet`
   - Test bottom sheet with simple example
   - Verify reanimated compatibility

3. **Build Core Components** (20 hours):
   - `MetricBadge` (2 hours)
   - `PresetButton` (2 hours)
   - `SocialChips` (3 hours)
   - `SparklineChart` (5 hours)
   - `FilterBar` (3 hours)
   - `LiveIndicator` (1 hour)
   - Write unit tests for each (4 hours)

4. **Documentation** (2 hours):
   - Component usage docs
   - Storybook examples (if using)

**Deliverable**: All foundation components built, tested, and documented.

**Success Criteria**:
- All components render without errors
- Props are type-safe
- Visual matches specs (screenshot comparison)

---

### Phase 2: Token Detail + Inline Trade (Week 2-3)

**Goal**: Deliver biggest value-add — inline trading on token detail screen

**Tasks**:

1. **Build CandlestickChart** (8 hours):
   - SVG rendering logic
   - Touch interactions (pan, zoom, tap)
   - Tooltip overlay
   - Y-axis and X-axis labels
   - Test with real candle data
   - File: `/apps/ios/src/ui/CandlestickChart.tsx`

2. **Build QuickTradeBar** (6 hours):
   - Layout and styling
   - Preset button logic
   - Expand button
   - Quote fetch integration
   - Loading/error states
   - File: `/apps/ios/src/ui/QuickTradeBar.tsx`

3. **Build TradeBottomSheet** (12 hours):
   - Bottom sheet setup with @gorhom
   - Buy/Sell tab switching
   - Amount input with validation
   - Preset/percentage button logic
   - Quote fetch and display
   - Quote countdown timer
   - Navigation to ReviewTrade
   - File: `/apps/ios/src/ui/TradeBottomSheet.tsx`

4. **Redesign Token Detail Screen** (10 hours):
   - New hero section
   - Price & change row
   - Replace chart with CandlestickChart
   - Redesign metrics grid with MetricBadge
   - Integrate QuickTradeBar
   - Integrate TradeBottomSheet
   - Update holdings section
   - Remove old TradeEntry navigation
   - File: `/apps/ios/src/screens/TokenDetailScreen.tsx`

5. **Update Trade Flow** (4 hours):
   - Update ReviewTrade screen for new sources
   - Test quote flow from QuickTradeBar
   - Test quote flow from TradeBottomSheet
   - Handle authentication states

6. **Testing** (8 hours):
   - Integration tests for trade flow
   - Manual testing on device
   - Edge case testing (network errors, expired quotes, etc.)

**Deliverable**: Fully functional inline trade experience on token detail screen.

**Success Criteria**:
- User can buy with preset buttons in <5 taps
- Quote fetch completes in <2 seconds
- Bottom sheet animations are smooth (60fps)
- Chart renders correctly with 50+ candles
- All error states handled gracefully

---

### Phase 3: List Card Redesign (Week 4)

**Goal**: Upgrade Discovery and Scope screens with new card design

**Tasks**:

1. **Build TokenListCard** (10 hours):
   - Layout and styling
   - Sparkline integration
   - Social chips integration
   - Quick trade button
   - Star toggle
   - Highlighted state
   - Performance optimization (memo)
   - File: `/apps/ios/src/ui/TokenListCard.tsx`

2. **Update Discovery Screen** (8 hours):
   - Replace rows with TokenListCard
   - Add FilterBar
   - Fetch sparkline data for visible tokens
   - Update pull-to-refresh
   - Optimize FlatList performance
   - File: `/apps/ios/src/screens/DiscoveryScreen.tsx`

3. **Update Scope Screen** (6 hours):
   - Same changes as Discovery
   - Add LiveIndicator
   - Add "LIVE" badge to cards
   - Implement auto-refresh (10s interval)
   - File: `/apps/ios/src/screens/ScopeScreen.tsx`

4. **API Updates** (4 hours):
   - Add sparkline data endpoint or field
   - Batch sparkline fetches
   - Cache sparkline data

5. **Testing** (6 hours):
   - Performance testing with 100+ tokens
   - Scroll performance
   - Memory usage
   - Network optimization

**Deliverable**: Discovery and Scope screens with new card design, sparklines, and improved UX.

**Success Criteria**:
- List scrolls smoothly at 60fps
- Sparklines load within 1 second
- Cards are scannable (user can process 10+ cards in <5 seconds)
- Quick trade button works from list

---

### Phase 4: Charts Polish (Week 5)

**Goal**: Add chart enhancements and polish

**Tasks**:

1. **Candlestick Chart Enhancements** (8 hours):
   - Add volume bars (optional overlay)
   - Improve touch interactions
   - Add zoom controls
   - Add indicators: MA, RSI (optional)
   - Performance optimization

2. **Sparkline Enhancements** (4 hours):
   - Add color gradient (green for up trend, red for down)
   - Add subtle animation on render
   - Improve data normalization

3. **Chart Timeframe Persistence** (2 hours):
   - Save user's preferred timeframe
   - Restore on screen return

4. **Chart Data Caching** (4 hours):
   - Cache candle data per token + timeframe
   - Invalidate on refresh or after 5 minutes

5. **Testing** (4 hours):
   - Visual regression tests
   - Performance tests

**Deliverable**: Polished, production-ready charts with smooth interactions.

**Success Criteria**:
- Chart renders in <500ms
- Touch interactions are responsive (<16ms)
- Data caching reduces API calls by 70%

---

### Phase 5: Polish & Remaining Screens (Week 6)

**Goal**: Update remaining screens, add animations, final polish

**Tasks**:

1. **Update Search Screen** (6 hours):
   - Integrate TokenListCard for results
   - Add recent searches
   - Add quick trade from search results
   - File: `/apps/ios/src/screens/SearchScreen.tsx`

2. **Update Portfolio Screen** (8 hours):
   - Add summary cards
   - Redesign holdings list
   - Add quick sell button
   - Add position history timeline
   - File: `/apps/ios/src/screens/PortfolioScreen.tsx`

3. **Update Tracking Screen** (6 hours):
   - Redesign wallet cards
   - Add activity feed
   - Enhance alert configuration
   - File: `/apps/ios/src/screens/TrackingScreen.tsx`

4. **Add Micro-Interactions** (8 hours):
   - Button press animations (scale/opacity)
   - Card tap feedback
   - Sheet slide animations
   - Loading skeletons
   - Success/error toasts

5. **Accessibility** (6 hours):
   - Add accessibility labels
   - Test with VoiceOver
   - Ensure 44px touch targets
   - Add keyboard navigation (future)

6. **Performance Optimization** (6 hours):
   - Reduce bundle size
   - Optimize images
   - Lazy load components
   - Profile with React DevTools

7. **Final Testing** (8 hours):
   - End-to-end testing
   - User acceptance testing
   - Bug fixes

**Deliverable**: Fully polished app ready for production.

**Success Criteria**:
- All screens updated
- Smooth animations (60fps)
- No accessibility violations
- Bundle size increase <200kb
- User testing feedback positive (>4/5)

---

## Files to Create/Modify

### New Files (Create)

#### Components (`/apps/ios/src/ui/`)

1. `TokenListCard.tsx` — Dense list card for Discovery/Scope
2. `QuickTradeBar.tsx` — Persistent quick-buy bar at bottom of token detail
3. `TradeBottomSheet.tsx` — Expandable trade panel with full form
4. `CandlestickChart.tsx` — Candlestick chart component
5. `SparklineChart.tsx` — Mini chart for list cards
6. `SocialChips.tsx` — Social link pills
7. `MetricBadge.tsx` — Metric display badge
8. `PresetButton.tsx` — SOL/percentage preset button
9. `FilterBar.tsx` — Sort/filter controls for lists
10. `LiveIndicator.tsx` — Pulsing "Live" indicator

#### Utils (`/apps/ios/src/utils/`)

11. `chartUtils.ts` — Chart calculation helpers (normalize, scale, etc.)
12. `tradeUtils.ts` — Trade flow helpers (preset amounts, percentages)

#### Services (`/apps/ios/src/features/`)

13. `chartService.ts` — API calls for candle/sparkline data
14. `quoteService.ts` — Enhanced quote service (may already exist, update)

#### Types (`/apps/ios/src/types/`)

15. `chart.types.ts` — Chart-related type definitions
16. `trade.types.ts` — Trade flow type definitions

---

### Files to Modify

#### Core

1. `/apps/ios/src/theme/tokens.ts` — Add new color, spacing, radius, shadow tokens
2. `/apps/ios/package.json` — Add `@gorhom/bottom-sheet` dependency

#### Screens

3. `/apps/ios/src/screens/TokenDetailScreen.tsx` — Complete redesign (see Phase 2)
4. `/apps/ios/src/screens/DiscoveryScreen.tsx` — New card design (see Phase 3)
5. `/apps/ios/src/screens/ScopeScreen.tsx` — New card design + live indicator (see Phase 3)
6. `/apps/ios/src/screens/SearchScreen.tsx` — Integrate new cards (see Phase 5)
7. `/apps/ios/src/screens/PortfolioScreen.tsx` — Redesign holdings (see Phase 5)
8. `/apps/ios/src/screens/TrackingScreen.tsx` — Enhance tracking UI (see Phase 5)
9. `/apps/ios/src/screens/ReviewTradeScreen.tsx` — Minor updates for new sources

#### Navigation

10. `/apps/ios/src/navigation/types.ts` — Add new route params if needed
11. `/apps/ios/src/navigation/RootNavigator.tsx` — Update navigation config if needed

#### Existing Components

12. `/apps/ios/src/ui/TokenChart.tsx` — May deprecate or keep as fallback for line chart
13. `/apps/ios/src/ui/SectionCard.tsx` — Ensure compatibility with new design system

#### Services

14. `/apps/ios/src/features/token/tokenService.ts` — Add sparkline data fetching
15. `/apps/ios/src/features/trade/tradeQuoteService.ts` — Update for new trade flow

---

### Files to Potentially Deprecate

1. `/apps/ios/src/screens/TradeEntryScreen.tsx` — Replace with inline trade panel
   - **Action**: Mark as deprecated, remove from navigation after Phase 2 complete
   - **Migration**: All trade entry flows go through QuickTradeBar or TradeBottomSheet

2. `/apps/ios/src/ui/TokenChart.tsx` — Replace with CandlestickChart
   - **Action**: Keep for now as fallback or rename to `LineChart.tsx` for alternative view
   - **Migration**: Token detail uses CandlestickChart by default

---

## Implementation Checklist

### Pre-Implementation

- [ ] Review plan with team
- [ ] Get design approval
- [ ] Set up feature branch: `feature/ux-overhaul`
- [ ] Create subtasks in project management tool
- [ ] Schedule weekly design reviews

### Phase 1: Foundation

- [ ] Update `tokens.ts` with new design tokens
- [ ] Install `@gorhom/bottom-sheet`
- [ ] Build `MetricBadge.tsx`
- [ ] Build `PresetButton.tsx`
- [ ] Build `SocialChips.tsx`
- [ ] Build `SparklineChart.tsx`
- [ ] Build `FilterBar.tsx`
- [ ] Build `LiveIndicator.tsx`
- [ ] Write tests for all components
- [ ] Document component usage

### Phase 2: Token Detail + Inline Trade

- [ ] Build `CandlestickChart.tsx`
- [ ] Build `QuickTradeBar.tsx`
- [ ] Build `TradeBottomSheet.tsx`
- [ ] Redesign `TokenDetailScreen.tsx`
- [ ] Update trade flow in `ReviewTradeScreen.tsx`
- [ ] Integration tests for trade flow
- [ ] Manual device testing
- [ ] Fix bugs and edge cases

### Phase 3: List Card Redesign

- [ ] Build `TokenListCard.tsx`
- [ ] Update `DiscoveryScreen.tsx`
- [ ] Update `ScopeScreen.tsx`
- [ ] Add sparkline API endpoint
- [ ] Optimize list performance
- [ ] Test with 100+ tokens

### Phase 4: Charts Polish

- [ ] Add volume bars to candlestick chart
- [ ] Improve touch interactions
- [ ] Add zoom controls
- [ ] Implement chart data caching
- [ ] Visual regression tests
- [ ] Performance optimization

### Phase 5: Polish & Remaining Screens

- [ ] Update `SearchScreen.tsx`
- [ ] Update `PortfolioScreen.tsx`
- [ ] Update `TrackingScreen.tsx`
- [ ] Add micro-interactions
- [ ] Accessibility audit and fixes
- [ ] Performance optimization
- [ ] End-to-end testing
- [ ] User acceptance testing
- [ ] Bug fixes and polish

### Post-Implementation

- [ ] Merge to main branch
- [ ] Deploy to TestFlight
- [ ] Gather user feedback
- [ ] Monitor crash reports
- [ ] Iterate based on feedback

---

## Success Metrics

### Quantitative

- **Time-to-Trade**: <10 seconds from app open to trade confirmation (target: 50% reduction)
- **Trade Conversion**: >30% of token detail views result in a trade (up from ~10%)
- **Quick Buy Usage**: >60% of trades use preset amounts
- **List Scroll Performance**: Maintain 60fps with 100+ tokens
- **Chart Render Time**: <500ms initial render
- **API Call Reduction**: 70% fewer calls via caching

### Qualitative

- **User Feedback**: >4/5 rating on new trade flow
- **Visual Clarity**: Users can identify top movers in <5 seconds on Discovery
- **Ease of Use**: New users complete first trade without help
- **Design Consistency**: All screens feel cohesive and "on brand"

---

## Risk Mitigation

### Performance Risks

**Risk**: Charts slow down low-end devices

**Mitigation**:
- Use SVG for charts (hardware-accelerated)
- Limit candle count to 100 max
- Implement virtualization for sparklines
- Add "Reduce animations" setting

### UX Risks

**Risk**: Users miss the expand button on QuickTradeBar

**Mitigation**:
- Add subtle pulsing animation on first visit
- Show tooltip: "Tap to see more options"
- A/B test icon vs text label

### Technical Risks

**Risk**: Bottom sheet conflicts with existing navigation

**Mitigation**:
- Test thoroughly with all navigation flows
- Use portal/modal for bottom sheet (not in navigation stack)
- Add escape hatches (close on back button)

### Scope Risks

**Risk**: Implementation takes longer than 6 weeks

**Mitigation**:
- Prioritize Phase 1-3 (highest value)
- Phase 4-5 can ship in follow-up release
- Use feature flags to enable/disable new components
- Daily standups to track progress

---

## Appendix

### A. Color Palette Reference

```typescript
// Primary Actions
buyGreen: "#10b981"      // Buy buttons, positive changes
sellRed: "#ef4444"       // Sell buttons, negative changes

// Charts
candleGreen: "#10b981"   // Up candles
candleRed: "#ef4444"     // Down candles
sparklineStroke: "#7766f7"
sparklineFill: "rgba(119, 102, 247, 0.15)"

// Backgrounds (dark to light)
layer0: "#0a0810"        // Canvas
layer1: "#14121e"        // Cards
layer2: "#191725"        // Nested cards
layer3: "#231f33"        // Inputs, borders
layer4: "#2f2850"        // Hover states

// Text (dark to light)
textPrimary: "#f8f7fb"   // Headings, symbols
textSecondary: "#b7a8d9" // Body text, metrics
textTertiary: "#7b6e9a"  // Labels, placeholders
textMuted: "#7b6e9a"     // Subtle text
textSubtle: "#5f596c"    // Very subtle text
```

### B. Spacing Reference

```typescript
xxs: 2    // Tight gaps
xs: 4     // Icon spacing
sm: 8     // Card padding, gaps
md: 12    // Section spacing
lg: 16    // Screen padding
xl: 20    // Large spacing
xxl: 24   // Section dividers
xxxl: 32  // Major sections
xxxxl: 40
xxxxxl: 48
```

### C. Touch Target Sizes

- **Primary actions**: 44px min (iOS HIG standard)
- **Secondary actions**: 36px min
- **Tertiary actions**: 32px min
- **Icon-only buttons**: 44px min with hitSlop

### D. Animation Timings

- **Button press**: 150ms ease-out
- **Sheet slide**: 300ms ease-in-out
- **Fade in/out**: 200ms ease-in-out
- **Pulse**: 1500ms infinite

### E. Font Weights

- **800 (Heavy)**: Large numbers, hero text
- **700 (Bold)**: Headings, CTAs
- **600 (Semi-bold)**: Subheadings, labels
- **500 (Medium)**: Body text, metrics
- **400 (Regular)**: Secondary text

---

**End of UX Overhaul Plan**

This plan is a living document. Update as implementation progresses and new learnings emerge. Focus on delivering value incrementally — Phase 1-3 provides 80% of the UX improvement.

---

**Document Prepared By**: Claude (UX/UI Specialist)
**Prepared For**: Quickscope iOS Team
**Version**: 2.1
**Date**: February 7, 2026
