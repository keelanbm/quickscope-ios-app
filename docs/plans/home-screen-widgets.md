# Home Screen Widgets — Spec

## Overview

iOS home screen widgets for Quickscope. Four widget types, each available in Small (2x2, ~158x158pt) and Medium (full width, ~338x158pt). All data is client-side — no backend required. Widgets read snapshots the app writes to App Group shared storage.

## Technology

- **`expo-widgets`** (alpha, SDK 55) — JSX with `@expo/ui/swift-ui` components, no Swift required
- **Fallback:** `react-native-widget-extension` if expo-widgets isn't stable enough — requires Swift for widget UI
- Both need development builds (not Expo Go) and `npx expo prebuild`

## Widget Types

### 1. Portfolio

**Small (2x2):**
- Total portfolio value (USD) — large text
- 24h PnL with green/red delta
- Unrealized PnL below, smaller

**Medium (full width):**
- Left: portfolio value + PnL stats (same as small)
- Right: Top 3 holdings — token icon + symbol + position value + PnL%

**Data source:** `getTraderOverview` + `getTraderPositions`

---

### 2. Watchlist

**Small (2x2):**
- Top 3 tokens stacked: symbol + 1h change %
- Compact, no icons (space constrained)

**Medium (full width):**
- 3 tokens in a row: icon + symbol + market cap + 1h change %
- Watchlist name as header

**Data source:** `getAllTokenWatchlists` + `filterTokensTable`

---

### 3. Wallet Activity ("Hot Tokens")

**Small (2x2):**
- "Last 30 min" header
- Top 3 tokens by trade volume from tracked wallets
- Symbol + trade count (e.g. "BONK · 12 trades")

**Medium (full width):**
- Top 3 tokens: icon + symbol + volume (SOL) + buy/sell ratio bar
- Time window label ("Last 30 min")
- Which watchlist(s) the activity came from

**Data source:** `filterAllTransactionsTable` → aggregate by token mint, count trades, sum volume

---

### 4. Chat Pulse ("Trending in Chats")

**Small (2x2):**
- "Last 1h" header
- Top 3 tokens by mention count
- Symbol + mention count

**Medium (full width):**
- Top 3 tokens: icon + symbol + mention count + unique senders
- Chat name(s) where it's trending

**Data source:** `getAllMessages` (msgType=1) → aggregate by tokenMint, count mentions

---

## Data Flow

```
App foregrounds / trade completes / pull-to-refresh
  → fetch latest data from API
  → run aggregation (for wallet activity + chat pulse)
  → write snapshot to App Group shared storage (JSON)
  → call WidgetCenter.reloadAllTimelines()

Widget renders
  → reads JSON from shared storage
  → displays with timestamp ("Updated 5 min ago")
```

### Refresh Budget

iOS allows ~40-70 widget refreshes per day (~once every 20-30 min). App triggers refresh at key moments:
- App foreground
- After trade execution
- After pull-to-refresh on relevant screens
- After data sync completes

### Shared Storage Schema

```ts
// Written to App Group UserDefaults as JSON

interface WidgetData {
  updatedAt: number; // Unix ms

  portfolio: {
    totalValueUsd: number;
    pnl24h: number;
    pnl24hPercent: number;
    unrealizedPnl: number;
    topHoldings: Array<{
      symbol: string;
      imageUri: string;
      valueUsd: number;
      pnlPercent: number;
    }>;
  };

  watchlist: {
    name: string;
    tokens: Array<{
      symbol: string;
      imageUri: string;
      marketCapUsd: number;
      oneHourChangePercent: number;
    }>;
  };

  walletActivity: {
    windowMinutes: number; // 30
    tokens: Array<{
      symbol: string;
      imageUri: string;
      tradeCount: number;
      volumeSol: number;
      buyRatio: number; // 0-1
      watchlistNames: string[];
    }>;
  };

  chatPulse: {
    windowMinutes: number; // 60
    tokens: Array<{
      symbol: string;
      imageUri: string;
      mentionCount: number;
      uniqueSenders: number;
      chatNames: string[];
    }>;
  };
}
```

## Visual Design

- Background: `layer1` (#14121e)
- Text: `textPrimary` (#f8f7fb) / `textSecondary` (#b7a8d9)
- Deltas: `buyGreen` / `sellRed` for price changes
- Accent: `accent` (#7766f7) for headers/labels
- Border radius: `lg` (12pt) on outer container
- Timestamp: "Updated X min ago" in `textTertiary` at bottom
- Tap: deep links into relevant screen (Portfolio, Tracking, etc.)

## iOS Widget Sizes Reference

| Size | Dimensions | Home Screen Slots | Content |
|------|-----------|-------------------|---------|
| Small (`systemSmall`) | ~158x158pt | 2x2 app icons | 1 focal metric + supporting values |
| Medium (`systemMedium`) | ~338x158pt | 4x2 (full width) | 3 item list or split layout |

## Implementation Notes

- Widget extension cannot run React Native — separate rendering pipeline
- `expo-widgets` compiles JSX to SwiftUI at prebuild time
- No hot reload for widgets — requires full prebuild + Xcode rebuild
- Images: may need to cache token icons to shared storage (URLs won't work directly in widgets)
- App Group identifier: `group.com.quickscope.ios` (or match bundle ID)
