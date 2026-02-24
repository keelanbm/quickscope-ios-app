# Portfolio Polish Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rewrite PortfolioScreen to use `fetchTraderPositions` (real PnL data), FlatList with infinite scroll (20 per page), and inline expandable position rows with full PnL breakdown.

**Architecture:** Replace ScrollView with FlatList using `ListHeaderComponent` for wallet card + stats. Switch data source from `fetchAccountTokenHoldings` to `fetchTraderPositions` which provides full PnL fields. Each position row is tappable to expand inline, revealing a 2x3 metric grid + Trade button. Pagination via `limit`/`offset` params with `onEndReached`.

**Tech Stack:** React Native FlatList, Animated (LayoutAnimation for expand/collapse), existing `AnimatedPressable`, `TokenAvatar`, `EmptyState` components, `fetchTraderPositions` + `fetchTraderOverview` APIs.

---

## Task 1: Switch data source to fetchTraderPositions

**Files:**
- Modify: `apps/ios/src/screens/PortfolioScreen.tsx`

**Step 1: Update imports**

Replace the holdings-based imports with positions-based ones:

```tsx
// REMOVE these imports:
import {
  fetchAccountTokenHoldings,
  fetchTraderOverview,
  type AccountTokenHoldings,
  type TraderOverview,
} from "@/src/features/portfolio/portfolioService";

// ADD these imports:
import {
  fetchTraderOverview,
  fetchTraderPositions,
  type TraderOverview,
  type Position,
  type PositionsResponse,
} from "@/src/features/portfolio/portfolioService";
```

**Step 2: Replace state and types**

Remove the old `PositionRow` type and `holdings` state. Replace with:

```tsx
const PAGE_SIZE = 20;

// Remove: const [holdings, setHoldings] = useState<AccountTokenHoldings | null>(null);
// Add:
const [positions, setPositions] = useState<Position[]>([]);
const [solPriceUsd, setSolPriceUsd] = useState(0);
const [solBalance, setSolBalance] = useState(0);
const [hasMore, setHasMore] = useState(true);
const [isLoadingMore, setIsLoadingMore] = useState(false);
```

**Step 3: Rewrite loadData to use fetchTraderPositions**

```tsx
const loadData = useCallback(
  (options?: { refreshing?: boolean }) => {
    if (!walletAddress) {
      setOverview(null);
      setPositions([]);
      setIsLoading(false);
      return;
    }

    const requestId = ++requestRef.current;
    if (options?.refreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setErrorText(null);

    Promise.all([
      fetchTraderOverview(rpcClient, walletAddress),
      fetchTraderPositions(rpcClient, walletAddress, {
        limit: PAGE_SIZE,
        offset: 0,
        sort_column: "position_value_quote",
      }),
    ])
      .then(([nextOverview, positionsResponse]) => {
        if (requestId !== requestRef.current) return;
        setOverview(nextOverview);
        setSolPriceUsd(positionsResponse.sol_price_usd);
        setSolBalance(positionsResponse.sol_balance);
        setPositions(positionsResponse.positions);
        setHasMore(positionsResponse.positions.length >= PAGE_SIZE);
      })
      .catch((error) => {
        if (requestId !== requestRef.current) return;
        setErrorText(error instanceof Error ? error.message : "Failed to load portfolio.");
      })
      .finally(() => {
        if (requestId !== requestRef.current) return;
        setIsLoading(false);
        setIsRefreshing(false);
      });
  },
  [rpcClient, walletAddress],
);
```

**Step 4: Add loadMore function for infinite scroll**

```tsx
const loadMore = useCallback(() => {
  if (!walletAddress || !hasMore || isLoadingMore || isLoading) return;

  const requestId = ++requestRef.current;
  setIsLoadingMore(true);

  fetchTraderPositions(rpcClient, walletAddress, {
    limit: PAGE_SIZE,
    offset: positions.length,
    sort_column: "position_value_quote",
  })
    .then((response) => {
      if (requestId !== requestRef.current) return;
      setPositions((prev) => [...prev, ...response.positions]);
      setHasMore(response.positions.length >= PAGE_SIZE);
    })
    .catch(() => {
      // Silently fail on paginated load — user can scroll again
    })
    .finally(() => {
      if (requestId !== requestRef.current) return;
      setIsLoadingMore(false);
    });
}, [rpcClient, walletAddress, hasMore, isLoadingMore, isLoading, positions.length]);
```

**Step 5: Update stats computation**

Replace the old `stats` useMemo:

```tsx
const stats = useMemo(() => {
  const balanceUsd = solBalance ? solBalance * solPriceUsd : undefined;
  const totalPnl = positions.reduce((sum, p) => sum + (p.total_pnl_quote ?? 0), 0);
  const unrealizedPnl = positions.reduce((sum, p) => sum + (p.unrealized_pnl_quote ?? 0), 0);

  return [
    { label: "Balance", value: formatCompactUsd(balanceUsd) },
    { label: "Positions", value: positions.length > 0 ? positions.length.toString() : "--" },
    { label: "Total PnL", value: formatCompactUsd(totalPnl || undefined) },
    { label: "Unrealized PnL", value: formatCompactUsd(unrealizedPnl || undefined) },
  ];
}, [solBalance, solPriceUsd, positions]);
```

**Step 6: Remove old `positions` useMemo**

Delete the entire `const positions = useMemo<PositionRow[]>(() => { ... })` block (lines 94-121 of current file).

**Step 7: Verify TypeScript compiles**

Run: `node apps/ios/node_modules/typescript/bin/tsc --noEmit --project apps/ios/tsconfig.json`
Expected: Errors about JSX/render (we'll fix in Task 2), but no errors in the data layer.

**Step 8: Commit**

```bash
git add apps/ios/src/screens/PortfolioScreen.tsx
git commit -m "feat(portfolio): switch data source to fetchTraderPositions with pagination"
```

---

## Task 2: Convert ScrollView to FlatList with ListHeaderComponent

**Files:**
- Modify: `apps/ios/src/screens/PortfolioScreen.tsx`

**Step 1: Update imports**

```tsx
// REMOVE: import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
// ADD:
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
```

Also add `TokenAvatar` and `EmptyState` imports:

```tsx
import { TokenAvatar } from "@/src/ui/TokenAvatar";
import { EmptyState } from "@/src/ui/EmptyState";
import { Wallet as WalletIcon, ChevronDown, ChevronUp } from "@/src/ui/icons";
import { formatCompactUsd, formatPercent, formatWalletAddress } from "@/src/lib/format";
```

**Step 2: Extract ListHeader as a separate component inside the file**

Create a `ListHeader` component that contains the wallet card + stats grid. This goes above the `PortfolioScreen` function:

```tsx
function ListHeader({
  walletAddress,
  stats,
}: {
  walletAddress: string | null;
  stats: { label: string; value: string }[];
}) {
  return (
    <View style={styles.listHeader}>
      <View style={styles.walletCard}>
        <View style={styles.walletAvatar}>
          <Text style={styles.walletAvatarText}>Q</Text>
        </View>
        <View style={styles.walletText}>
          <Text style={styles.walletName}>Primary Wallet</Text>
          <Text style={styles.walletAddress}>
            {formatWalletAddress(walletAddress ?? undefined)}
          </Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        {stats.map((stat) => (
          <View key={stat.label} style={styles.statCard}>
            <Text style={styles.statLabel}>{stat.label}</Text>
            <Text style={styles.statValue}>{stat.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
```

**Step 3: Replace the render body**

Replace the entire return JSX of `PortfolioScreen` with:

```tsx
return (
  <FlatList
    style={styles.page}
    contentContainerStyle={styles.content}
    data={isLoading ? [] : positions}
    keyExtractor={(item) => item.token_info?.mint ?? String(Math.random())}
    renderItem={({ item }) => (
      <PositionRowItem
        position={item}
        solPriceUsd={solPriceUsd}
        navigation={navigation}
      />
    )}
    ListHeaderComponent={
      <ListHeader walletAddress={walletAddress} stats={stats} />
    }
    ListEmptyComponent={
      isLoading ? (
        <SkeletonRows count={6} />
      ) : errorText ? (
        <Text style={styles.contextText}>{errorText}</Text>
      ) : (
        <EmptyState
          icon={WalletIcon}
          title="No positions"
          subtitle="Your active token positions will appear here."
        />
      )
    }
    ListFooterComponent={
      isLoadingMore ? (
        <View style={styles.footer}>
          <ActivityIndicator color={qsColors.accent} />
        </View>
      ) : null
    }
    onEndReached={loadMore}
    onEndReachedThreshold={0.3}
    refreshControl={
      <RefreshControl
        tintColor={qsColors.textMuted}
        refreshing={isRefreshing}
        onRefresh={handleRefresh}
      />
    }
  />
);
```

**Step 4: Create placeholder PositionRowItem**

Add this above the `PortfolioScreen` function — we'll make it expandable in Task 3:

```tsx
function PositionRowItem({
  position,
  solPriceUsd,
  navigation,
}: {
  position: Position;
  solPriceUsd: number;
  navigation: NativeStackNavigationProp<RootStack>;
}) {
  const meta = position.token_info;
  const symbol = meta?.symbol ?? "UNK";
  const name = meta?.name ?? "Unknown";
  const mint = meta?.mint ?? "";
  const imageUri = meta?.image_uri;
  const valueUsd = (position.position_value_quote ?? 0) * solPriceUsd;
  const totalPnlUsd = (position.total_pnl_quote ?? 0) * solPriceUsd;
  const pnlPercent = (position.total_pnl_change_proportion ?? 0) * 100;
  const pnlPositive = totalPnlUsd >= 0;

  return (
    <AnimatedPressable
      style={styles.positionRow}
      onPress={() =>
        navigation.navigate("TokenDetail", {
          source: "portfolio-row",
          tokenAddress: mint,
          symbol,
          name,
          imageUri: imageUri ?? undefined,
          platform: meta?.platform ?? undefined,
          exchange: meta?.exchange ?? undefined,
        })
      }
    >
      <TokenAvatar uri={imageUri} size={36} />
      <View style={styles.positionText}>
        <Text style={styles.positionSymbol} numberOfLines={1}>{symbol}</Text>
        <Text style={styles.positionName} numberOfLines={1}>{name}</Text>
      </View>
      <View style={styles.positionRight}>
        <Text style={styles.positionValue}>{formatCompactUsd(valueUsd)}</Text>
        <Text style={[styles.positionPnl, pnlPositive ? styles.pnlPositive : styles.pnlNegative]}>
          {formatPercent(pnlPercent)}
        </Text>
      </View>
    </AnimatedPressable>
  );
}
```

**Step 5: Update styles**

Remove old styles that are no longer needed (`header`, `title`, `subtitle`, `positionLeft`, `positionAvatar`, `positionAvatarText`). Add new ones:

```tsx
// ADD to StyleSheet:
listHeader: {
  gap: qsSpacing.md,
  marginBottom: qsSpacing.sm,
},
footer: {
  paddingVertical: qsSpacing.lg,
  alignItems: "center",
},
// UPDATE positionRow to use gap for avatar+text layout:
positionRow: {
  flexDirection: "row",
  alignItems: "center",
  borderWidth: 1,
  borderColor: qsColors.borderDefault,
  borderRadius: qsRadius.md,
  backgroundColor: qsColors.layer2,
  padding: qsSpacing.sm,
  gap: qsSpacing.sm,
  marginBottom: qsSpacing.xs,
},
// UPDATE positionText (replaces positionLeft):
positionText: {
  flex: 1,
  gap: 2,
},
```

Remove the `SectionCard` import and wrapper since FlatList replaces it. Remove `walletButton`/`walletButtonText` styles (remove the Manage button — it has no functionality).

**Step 6: Verify TypeScript compiles**

Run: `node apps/ios/node_modules/typescript/bin/tsc --noEmit --project apps/ios/tsconfig.json`
Expected: Clean compile (or warnings only).

**Step 7: Commit**

```bash
git add apps/ios/src/screens/PortfolioScreen.tsx
git commit -m "feat(portfolio): convert to FlatList with ListHeader, TokenAvatar, EmptyState"
```

---

## Task 3: Add inline expandable position rows

**Files:**
- Modify: `apps/ios/src/screens/PortfolioScreen.tsx`

**Step 1: Add expand/collapse state**

In `PortfolioScreen`, add:

```tsx
const [expandedMint, setExpandedMint] = useState<string | null>(null);
```

Pass it to `PositionRowItem`:

```tsx
<PositionRowItem
  position={item}
  solPriceUsd={solPriceUsd}
  navigation={navigation}
  isExpanded={expandedMint === (item.token_info?.mint ?? "")}
  onToggleExpand={() => {
    const mint = item.token_info?.mint ?? "";
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedMint((prev) => (prev === mint ? null : mint));
  }}
/>
```

Add `LayoutAnimation` import:

```tsx
import { ..., LayoutAnimation, UIManager, Platform } from "react-native";
```

Add UIManager enablement at file top level (before component definitions):

```tsx
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
```

**Step 2: Rewrite PositionRowItem with expand support**

```tsx
function PositionRowItem({
  position,
  solPriceUsd,
  navigation,
  isExpanded,
  onToggleExpand,
}: {
  position: Position;
  solPriceUsd: number;
  navigation: NativeStackNavigationProp<RootStack>;
  isExpanded: boolean;
  onToggleExpand: () => void;
}) {
  const meta = position.token_info;
  const symbol = meta?.symbol ?? "UNK";
  const name = meta?.name ?? "Unknown";
  const mint = meta?.mint ?? "";
  const imageUri = meta?.image_uri;
  const valueUsd = (position.position_value_quote ?? 0) * solPriceUsd;
  const totalPnlUsd = (position.total_pnl_quote ?? 0) * solPriceUsd;
  const pnlPercent = (position.total_pnl_change_proportion ?? 0) * 100;
  const pnlPositive = totalPnlUsd >= 0;

  const unrealizedUsd = (position.unrealized_pnl_quote ?? 0) * solPriceUsd;
  const realizedUsd = (position.realized_pnl_quote ?? 0) * solPriceUsd;
  const avgEntryUsd = (position.average_entry_price_quote ?? 0) * solPriceUsd;
  const avgExitUsd = (position.average_exit_price_quote ?? 0) * solPriceUsd;
  const boughtUsd = (position.bought_quote ?? 0) * solPriceUsd;
  const soldUsd = (position.sold_quote ?? 0) * solPriceUsd;

  return (
    <AnimatedPressable style={styles.positionRow} onPress={onToggleExpand}>
      <View style={styles.positionSummary}>
        <TokenAvatar uri={imageUri} size={36} />
        <View style={styles.positionText}>
          <Text style={styles.positionSymbol} numberOfLines={1}>{symbol}</Text>
          <Text style={styles.positionName} numberOfLines={1}>{name}</Text>
        </View>
        <View style={styles.positionRight}>
          <Text style={styles.positionValue}>{formatCompactUsd(valueUsd)}</Text>
          <Text style={[styles.positionPnl, pnlPositive ? styles.pnlPositive : styles.pnlNegative]}>
            {formatPercent(pnlPercent)}
          </Text>
        </View>
        {isExpanded ? (
          <ChevronUp size={16} color={qsColors.textTertiary} />
        ) : (
          <ChevronDown size={16} color={qsColors.textTertiary} />
        )}
      </View>

      {isExpanded ? (
        <View style={styles.expandedSection}>
          <View style={styles.metricGrid}>
            <MetricCell label="Unrealized PnL" value={formatCompactUsd(unrealizedUsd)} positive={unrealizedUsd >= 0} isHighlighted />
            <MetricCell label="Realized PnL" value={formatCompactUsd(realizedUsd)} positive={realizedUsd >= 0} isHighlighted />
            <MetricCell label="Avg Entry" value={formatCompactUsd(avgEntryUsd)} />
            <MetricCell label="Avg Exit" value={formatCompactUsd(avgExitUsd || undefined)} />
            <MetricCell label="Bought" value={formatCompactUsd(boughtUsd)} />
            <MetricCell label="Sold" value={formatCompactUsd(soldUsd)} />
          </View>
          <AnimatedPressable
            style={styles.tradeButton}
            onPress={() =>
              navigation.navigate("TokenDetail", {
                source: "portfolio-row",
                tokenAddress: mint,
                symbol,
                name,
                imageUri: imageUri ?? undefined,
                platform: meta?.platform ?? undefined,
                exchange: meta?.exchange ?? undefined,
              })
            }
          >
            <Text style={styles.tradeButtonText}>Trade</Text>
          </AnimatedPressable>
        </View>
      ) : null}
    </AnimatedPressable>
  );
}
```

**Step 3: Create MetricCell helper**

Add above `PositionRowItem`:

```tsx
function MetricCell({
  label,
  value,
  positive,
  isHighlighted,
}: {
  label: string;
  value: string;
  positive?: boolean;
  isHighlighted?: boolean;
}) {
  const valueColor = isHighlighted
    ? positive
      ? qsColors.success
      : qsColors.danger
    : qsColors.textSecondary;

  return (
    <View style={styles.metricCell}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, { color: valueColor }]}>{value}</Text>
    </View>
  );
}
```

**Step 4: Add expanded styles**

```tsx
// ADD to StyleSheet:
positionSummary: {
  flexDirection: "row",
  alignItems: "center",
  gap: qsSpacing.sm,
},
expandedSection: {
  borderTopWidth: 1,
  borderTopColor: qsColors.borderDefault,
  paddingTop: qsSpacing.sm,
  marginTop: qsSpacing.sm,
  gap: qsSpacing.sm,
},
metricGrid: {
  flexDirection: "row",
  flexWrap: "wrap",
  gap: qsSpacing.sm,
},
metricCell: {
  width: "30%",
  gap: 2,
},
metricLabel: {
  color: qsColors.textTertiary,
  fontSize: 11,
},
metricValue: {
  color: qsColors.textSecondary,
  fontSize: 13,
  fontWeight: "600",
  fontVariant: ["tabular-nums"],
},
tradeButton: {
  backgroundColor: qsColors.accent,
  borderRadius: qsRadius.sm,
  paddingVertical: qsSpacing.sm,
  alignItems: "center",
},
tradeButtonText: {
  color: qsColors.textPrimary,
  fontSize: 14,
  fontWeight: "700",
},
```

**Step 5: Update positionRow style for the expanded layout**

The `positionRow` style needs to change from `flexDirection: "row"` to a vertical container that wraps the summary + expanded section:

```tsx
positionRow: {
  borderWidth: 1,
  borderColor: qsColors.borderDefault,
  borderRadius: qsRadius.md,
  backgroundColor: qsColors.layer2,
  padding: qsSpacing.sm,
  marginBottom: qsSpacing.xs,
},
```

**Step 6: Verify TypeScript compiles**

Run: `node apps/ios/node_modules/typescript/bin/tsc --noEmit --project apps/ios/tsconfig.json`
Expected: Clean compile.

**Step 7: Commit**

```bash
git add apps/ios/src/screens/PortfolioScreen.tsx
git commit -m "feat(portfolio): add inline expandable position rows with PnL breakdown"
```

---

## Task 4: Wire up real stats and polish

**Files:**
- Modify: `apps/ios/src/screens/PortfolioScreen.tsx`

**Step 1: Add haptics on expand/collapse**

Import haptics and fire on toggle:

```tsx
import * as Haptics from "expo-haptics";
```

In `onToggleExpand`:

```tsx
onToggleExpand={() => {
  const mint = item.token_info?.mint ?? "";
  Haptics.selectionAsync();
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  setExpandedMint((prev) => (prev === mint ? null : mint));
}}
```

**Step 2: Color-code Total PnL and Unrealized PnL in stats grid**

Update the stats computation to include color hints:

```tsx
const stats = useMemo(() => {
  const balanceUsd = solBalance ? solBalance * solPriceUsd : undefined;
  const totalPnl = positions.reduce((sum, p) => sum + ((p.total_pnl_quote ?? 0) * solPriceUsd), 0);
  const unrealizedPnl = positions.reduce((sum, p) => sum + ((p.unrealized_pnl_quote ?? 0) * solPriceUsd), 0);

  return [
    { label: "Balance", value: formatCompactUsd(balanceUsd), color: undefined },
    { label: "Positions", value: positions.length > 0 ? positions.length.toString() : "--", color: undefined },
    { label: "Total PnL", value: formatCompactUsd(totalPnl || undefined), color: totalPnl >= 0 ? qsColors.success : qsColors.danger },
    { label: "Unrealized PnL", value: formatCompactUsd(unrealizedPnl || undefined), color: unrealizedPnl >= 0 ? qsColors.success : qsColors.danger },
  ];
}, [solBalance, solPriceUsd, positions]);
```

Update the stats rendering in `ListHeader` to accept and use color:

```tsx
// Update ListHeader props type:
stats: { label: string; value: string; color?: string }[];

// In the stat card:
<Text style={[styles.statValue, stat.color ? { color: stat.color } : undefined]}>
  {stat.value}
</Text>
```

**Step 3: Collapse expanded row on pull-to-refresh**

In `handleRefresh`:

```tsx
const handleRefresh = () => {
  setExpandedMint(null);
  loadData({ refreshing: true });
};
```

**Step 4: Clean up unused imports and styles**

Remove any remaining unused imports (`SectionCard`, old types, etc.). Remove unused styles. Ensure the `params?.source` deep link text is removed from the bottom (it was in the old ScrollView).

**Step 5: Verify TypeScript compiles**

Run: `node apps/ios/node_modules/typescript/bin/tsc --noEmit --project apps/ios/tsconfig.json`
Expected: Clean compile.

**Step 6: Commit**

```bash
git add apps/ios/src/screens/PortfolioScreen.tsx
git commit -m "feat(portfolio): add haptics, PnL color coding, polish stats grid"
```

---

## Task 5: Final review and type-check

**Files:**
- Read: `apps/ios/src/screens/PortfolioScreen.tsx` (full file review)

**Step 1: Full TypeScript check**

Run: `node apps/ios/node_modules/typescript/bin/tsc --noEmit --project apps/ios/tsconfig.json`
Expected: Zero errors.

**Step 2: Review the complete file for consistency**

Verify:
- All `qsColors` references use token names (no raw hex)
- No inline shadow values (use `qsShadows` if any)
- `fontVariant: ["tabular-nums"]` on all numeric display text
- Green/Red only used for PnL values, not general UI
- `formatCompactUsd` used for all USD values (not manual formatting)
- Missing data shows `"--"` (from formatCompactUsd returning "--" for undefined)
- No `ScrollView` remaining (replaced by FlatList)
- `EmptyState` used for empty positions list

**Step 3: Commit if any cleanup was needed**

```bash
git add apps/ios/src/screens/PortfolioScreen.tsx
git commit -m "chore(portfolio): final cleanup and type-check pass"
```
