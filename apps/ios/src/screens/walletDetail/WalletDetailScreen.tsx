/**
 * WalletDetailScreen — View any Solana wallet's positions, history, and top trades.
 *
 * Layout (top to bottom):
 * 1. Header: emoji/avatar, name or address, copy, star
 * 2. Stats row: Balance, Total PnL, Volume, Win Rate
 * 3. Tabs: Positions | History | Top Trades
 * 4. Tab content (FlatList items)
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Clipboard from "expo-clipboard";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { haptics } from "@/src/lib/haptics";
import { toast } from "@/src/lib/toast";
import { formatCompactUsd, formatPercent, formatSol, formatAgeFromSeconds } from "@/src/lib/format";
import type { RpcClient } from "@/src/lib/api/rpcClient";
import { useAuthSession } from "@/src/features/auth/AuthSessionProvider";
import {
  fetchTraderOverview,
  fetchTraderPositions,
  fetchTransactionHistory,
  type Position,
  type TraderOverview,
  type TransactionRow,
} from "@/src/features/portfolio/portfolioService";
import {
  addWalletToWatchlist,
  fetchWalletWatchlists,
  removeWalletFromWatchlist,
  type WalletWatchlist,
} from "@/src/features/tracking/trackingService";
import type { RootStack, WalletDetailRouteParams } from "@/src/navigation/types";
import { qsColors, qsRadius, qsSpacing, qsTypography } from "@/src/theme/tokens";
import { EmptyState } from "@/src/ui/EmptyState";
import { SkeletonRow } from "@/src/ui/Skeleton";
import { TokenAvatar } from "@/src/ui/TokenAvatar";
import { TrendingUp, TrendingDown, Wallet } from "@/src/ui/icons";

import { WalletDetailHeader } from "./WalletDetailHeader";
import { WalletDetailStats } from "./WalletDetailStats";
import { WalletDetailTabBar, type WalletDetailTab } from "./WalletDetailTabs";

/* ─── Types ─── */

type WalletDetailScreenProps = {
  rpcClient: RpcClient;
  params?: WalletDetailRouteParams;
};

type ListItem =
  | { type: "position"; data: Position }
  | { type: "history"; data: TransactionRow & { tokenSymbol: string; tokenImageUri?: string } }
  | { type: "topTrade"; data: Position };

const ACTION_LABELS: Record<string, "Buy" | "Sell"> = {
  b: "Buy",
  s: "Sell",
};

/* ─── Helpers ─── */

function formatTimeAgo(ts: number): string {
  if (!ts) return "--";
  const seconds = Math.floor(Date.now() / 1000) - ts;
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

function formatPnlUsd(value: number): string {
  const prefix = value >= 0 ? "+" : "";
  return `${prefix}${formatCompactUsd(Math.abs(value))}`;
}

/* ─── Component ─── */

export function WalletDetailScreen({ rpcClient, params }: WalletDetailScreenProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStack>>();
  const insets = useSafeAreaInsets();
  const { hasValidAccessToken } = useAuthSession();
  const requestRef = useRef(0);

  const walletAddress = params?.walletAddress ?? "";

  // ── Data state ──
  const [overview, setOverview] = useState<TraderOverview | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [tokenInfoMap, setTokenInfoMap] = useState<Record<string, { token_metadata?: { symbol?: string; name?: string; image_uri?: string; mint?: string } }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ── Tab state ──
  const [activeTab, setActiveTab] = useState<WalletDetailTab>("positions");
  const [topTradeSort, setTopTradeSort] = useState<"percent" | "dollar">("percent");

  // ── Watchlist state ──
  const [watchlists, setWatchlists] = useState<WalletWatchlist[]>([]);
  const [isTracked, setIsTracked] = useState(false);
  const [isWatchlistUpdating, setIsWatchlistUpdating] = useState(false);

  /* ═══ Data loading ═══ */

  const loadData = useCallback(
    async (options?: { refreshing?: boolean }) => {
      if (!walletAddress) return;

      const requestId = ++requestRef.current;
      if (options?.refreshing) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        const [overviewData, positionsData, txData] = await Promise.all([
          fetchTraderOverview(rpcClient, walletAddress),
          fetchTraderPositions(rpcClient, walletAddress, { limit: 200 }),
          fetchTransactionHistory(rpcClient, walletAddress, 50),
        ]);

        if (requestId !== requestRef.current) return;

        setOverview(overviewData);
        setPositions(positionsData.positions ?? []);
        setTransactions(txData.table?.rows ?? []);
        setTokenInfoMap(txData.mint_to_token_info ?? {});
      } catch {
        // Silently fail — show empty state
      } finally {
        if (requestId !== requestRef.current) return;
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [rpcClient, walletAddress],
  );

  const loadWatchlists = useCallback(async () => {
    if (!hasValidAccessToken) return;
    try {
      const lists = await fetchWalletWatchlists(rpcClient);
      setWatchlists(lists);
    } catch {
      // Ignore
    }
  }, [rpcClient, hasValidAccessToken]);

  useEffect(() => {
    loadData();
    loadWatchlists();
  }, [loadData, loadWatchlists]);

  // Check if wallet is in any watchlist
  useEffect(() => {
    // We can't easily check this without fetching each watchlist's wallets.
    // For now, just leave star as untracked. Users can add via star.
    setIsTracked(false);
  }, [watchlists, walletAddress]);

  /* ═══ Derived data ═══ */

  const solPriceUsd = overview?.sol_price_usd ?? 0;

  const openPositions = useMemo(
    () => positions.filter((p) => p.balance > 0),
    [positions],
  );

  const closedPositions = useMemo(
    () => positions.filter((p) => p.balance === 0 && p.sold_quote > 0),
    [positions],
  );

  const topTrades = useMemo(() => {
    const sorted = [...closedPositions];
    if (topTradeSort === "percent") {
      sorted.sort((a, b) => b.realized_pnl_change_proportion - a.realized_pnl_change_proportion);
    } else {
      sorted.sort((a, b) => (b.realized_pnl_quote * solPriceUsd) - (a.realized_pnl_quote * solPriceUsd));
    }
    return sorted;
  }, [closedPositions, topTradeSort, solPriceUsd]);

  const stats = useMemo(() => {
    const balanceUsd = overview?.holdings?.value_usd;
    const totalPnlUsd = closedPositions.reduce(
      (sum, p) => sum + p.realized_pnl_quote * solPriceUsd,
      0,
    );
    const volumeUsd =
      (overview?.cumulatives?.bought_usd_cumulative ?? 0) +
      (overview?.cumulatives?.sold_usd_cumulative ?? 0);
    const winCount = closedPositions.filter((p) => p.realized_pnl_quote > 0).length;
    const winRatePercent =
      closedPositions.length > 0 ? (winCount / closedPositions.length) * 100 : undefined;

    return { balanceUsd, totalPnlUsd, volumeUsd, winRatePercent };
  }, [overview, closedPositions, solPriceUsd]);

  /* ═══ Handlers ═══ */

  const handleGoBack = () => navigation.goBack();

  const handleCopyAddress = async () => {
    await Clipboard.setStringAsync(walletAddress);
    haptics.success();
    toast.success("Copied", walletAddress);
  };

  const handleToggleWatchlist = async () => {
    if (!hasValidAccessToken || watchlists.length === 0) {
      toast.info("Sign in", "Connect your wallet to use watchlists.");
      return;
    }
    setIsWatchlistUpdating(true);
    try {
      const favList = watchlists.find((l) => l.isFavorites) ?? watchlists[0];
      if (!favList) return;

      if (isTracked) {
        await removeWalletFromWatchlist(rpcClient, favList.list_id, walletAddress);
        setIsTracked(false);
        toast.success("Removed", "Wallet removed from watchlist.");
      } else {
        await addWalletToWatchlist(rpcClient, {
          watchlistId: favList.list_id,
          publicKey: walletAddress,
          name: params?.walletName ?? "",
          emoji: params?.walletEmoji ?? "👤",
        });
        setIsTracked(true);
        toast.success("Added", "Wallet added to watchlist.");
      }
    } catch {
      toast.error("Error", "Failed to update watchlist.");
    } finally {
      setIsWatchlistUpdating(false);
    }
  };

  const handleOpenTokenDetail = (mint: string, symbol?: string) => {
    navigation.navigate("TokenDetail", {
      source: "portfolio-row",
      tokenAddress: mint,
      symbol,
    });
  };

  /* ═══ List data ═══ */

  const enrichedHistory = useMemo(
    () =>
      transactions.map((tx) => {
        const info = tokenInfoMap[tx.mint]?.token_metadata;
        return {
          ...tx,
          tokenSymbol: info?.symbol ?? tx.mint.slice(0, 4),
          tokenImageUri: info?.image_uri,
        };
      }),
    [transactions, tokenInfoMap],
  );

  let listData: ListItem[] = [];
  if (activeTab === "positions") {
    listData = openPositions.map((p) => ({ type: "position" as const, data: p }));
  } else if (activeTab === "history") {
    listData = enrichedHistory.map((h) => ({ type: "history" as const, data: h }));
  } else {
    listData = topTrades.map((p) => ({ type: "topTrade" as const, data: p }));
  }

  /* ═══ Render ═══ */

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <FlatList
        data={listData}
        keyExtractor={(item, idx) => {
          if (item.type === "position" || item.type === "topTrade") {
            return item.data.token_info?.mint ?? `pos-${idx}`;
          }
          return item.data.signature || item.data.index || `tx-${idx}`;
        }}
        refreshControl={
          <RefreshControl
            tintColor={qsColors.textMuted}
            refreshing={isRefreshing}
            onRefresh={() => loadData({ refreshing: true })}
          />
        }
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.header}>
            <WalletDetailHeader
              walletAddress={walletAddress}
              walletName={params?.walletName}
              walletEmoji={params?.walletEmoji}
              isTracked={isTracked}
              isWatchlistUpdating={isWatchlistUpdating}
              onCopyAddress={handleCopyAddress}
              onToggleWatchlist={handleToggleWatchlist}
              onGoBack={handleGoBack}
            />

            <WalletDetailStats
              balanceUsd={stats.balanceUsd}
              totalPnlUsd={stats.totalPnlUsd}
              volumeUsd={stats.volumeUsd}
              winRatePercent={stats.winRatePercent}
            />

            <WalletDetailTabBar activeTab={activeTab} onTabChange={setActiveTab} />

            {/* Top Trades sort toggle */}
            {activeTab === "topTrades" && closedPositions.length > 0 ? (
              <View style={styles.sortRow}>
                {(["percent", "dollar"] as const).map((mode) => {
                  const active = topTradeSort === mode;
                  return (
                    <Pressable
                      key={mode}
                      style={[styles.sortChip, active && styles.sortChipActive]}
                      onPress={() => {
                        haptics.selection();
                        setTopTradeSort(mode);
                      }}
                    >
                      <Text style={[styles.sortChipText, active && styles.sortChipTextActive]}>
                        {mode === "percent" ? "% PnL" : "$ PnL"}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
          </View>
        }
        renderItem={({ item }) => {
          /* ── Position row ── */
          if (item.type === "position") {
            const p = item.data;
            const symbol = p.token_info?.symbol ?? "???";
            const name = p.token_info?.name ?? "Unknown";
            const valueUsd = p.position_value_quote * solPriceUsd;
            const unrealizedPnlUsd = p.unrealized_pnl_quote * solPriceUsd;
            const unrealizedPct = p.unrealized_pnl_change_proportion * 100;
            const isPositive = unrealizedPnlUsd >= 0;

            return (
              <Pressable
                style={styles.rowItem}
                onPress={() => handleOpenTokenDetail(p.token_info?.mint ?? "", symbol)}
              >
                <View style={styles.rowMain}>
                  <TokenAvatar uri={p.token_info?.image_uri} size={36} />
                  <View style={styles.nameCol}>
                    <Text numberOfLines={1} style={styles.symbol}>{symbol}</Text>
                    <Text numberOfLines={1} style={styles.subText}>{name}</Text>
                  </View>
                  <View style={styles.rightCol}>
                    <Text numberOfLines={1} style={styles.valueText}>
                      {formatCompactUsd(valueUsd)}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={[styles.pnlText, { color: isPositive ? qsColors.buyGreen : qsColors.sellRed }]}
                    >
                      {isPositive ? "▲" : "▼"} {formatPercent(unrealizedPct)}
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          }

          /* ── History row ── */
          if (item.type === "history") {
            const tx = item.data;
            const action = ACTION_LABELS[tx.type] ?? "Buy";
            const isBuy = action === "Buy";
            const amountSol = formatSol(tx.amount_quote);

            return (
              <Pressable
                style={styles.rowItem}
                onPress={() => handleOpenTokenDetail(tx.mint, tx.tokenSymbol)}
              >
                <View style={styles.rowMain}>
                  <TokenAvatar uri={tx.tokenImageUri} size={36} />
                  <View style={styles.nameCol}>
                    <Text numberOfLines={1} style={styles.symbol}>{tx.tokenSymbol}</Text>
                    <Text style={styles.subText}>{formatTimeAgo(tx.ts)}</Text>
                  </View>
                  <View style={styles.rightCol}>
                    <Text numberOfLines={1} style={styles.valueText}>
                      {amountSol} SOL
                    </Text>
                    <View style={[styles.actionPill, isBuy ? styles.buyPill : styles.sellPill]}>
                      {isBuy ? (
                        <TrendingUp size={10} color={qsColors.buyGreen} />
                      ) : (
                        <TrendingDown size={10} color={qsColors.sellRed} />
                      )}
                      <Text style={[styles.actionPillText, { color: isBuy ? qsColors.buyGreen : qsColors.sellRed }]}>
                        {action}
                      </Text>
                    </View>
                  </View>
                </View>
              </Pressable>
            );
          }

          /* ── Top Trade row ── */
          const trade = item.data;
          const tradeSymbol = trade.token_info?.symbol ?? "???";
          const boughtUsd = trade.bought_quote * solPriceUsd;
          const soldUsd = trade.sold_quote * solPriceUsd;
          const pnlUsd = trade.realized_pnl_quote * solPriceUsd;
          const pnlPct = trade.realized_pnl_change_proportion * 100;
          const isProfitable = pnlUsd >= 0;

          return (
            <Pressable
              style={styles.rowItem}
              onPress={() => handleOpenTokenDetail(trade.token_info?.mint ?? "", tradeSymbol)}
            >
              <View style={styles.rowMain}>
                <TokenAvatar uri={trade.token_info?.image_uri} size={36} />
                <View style={styles.nameCol}>
                  <Text numberOfLines={1} style={styles.symbol}>{tradeSymbol}</Text>
                  <Text style={styles.subText}>
                    {formatCompactUsd(boughtUsd)} → {formatCompactUsd(soldUsd)}
                  </Text>
                </View>
                <View style={styles.rightCol}>
                  <Text
                    numberOfLines={1}
                    style={[styles.valueText, { color: isProfitable ? qsColors.buyGreen : qsColors.sellRed }]}
                  >
                    {formatPnlUsd(pnlUsd)}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={[styles.pnlText, { color: isProfitable ? qsColors.buyGreen : qsColors.sellRed }]}
                  >
                    {isProfitable ? "▲" : "▼"} {formatPercent(pnlPct)}
                  </Text>
                </View>
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.loadingWrap}>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </View>
          ) : (
            <EmptyState
              icon={Wallet}
              title={
                activeTab === "positions"
                  ? "No open positions"
                  : activeTab === "history"
                    ? "No transactions yet"
                    : "No closed trades yet"
              }
              subtitle="Activity will appear here once this wallet trades."
            />
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: qsColors.layer0,
  },
  listContent: {
    paddingBottom: 40,
  },
  header: {
    gap: qsSpacing.md,
    paddingBottom: qsSpacing.md,
  },
  loadingWrap: {
    paddingHorizontal: qsSpacing.lg,
    gap: qsSpacing.sm,
    paddingTop: qsSpacing.md,
  },

  // ── Sort toggle ──
  sortRow: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: qsSpacing.lg,
    paddingTop: qsSpacing.xs,
  },
  sortChip: {
    borderRadius: qsRadius.pill,
    backgroundColor: qsColors.layer2,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  sortChipActive: {
    backgroundColor: qsColors.accent,
  },
  sortChipText: {
    color: qsColors.textTertiary,
    fontSize: 11,
    fontWeight: qsTypography.weight.semi,
  },
  sortChipTextActive: {
    color: qsColors.textPrimary,
  },

  // ── Row items ──
  rowItem: {
    paddingHorizontal: qsSpacing.lg,
    paddingVertical: qsSpacing.sm,
  },
  rowMain: {
    flexDirection: "row",
    alignItems: "center",
    gap: qsSpacing.md,
  },
  nameCol: {
    flex: 1,
    gap: 2,
  },
  symbol: {
    color: qsColors.textPrimary,
    fontSize: 14,
    fontWeight: qsTypography.weight.bold,
    flexShrink: 1,
  },
  subText: {
    color: qsColors.textTertiary,
    fontSize: 11,
    fontWeight: qsTypography.weight.medium,
  },
  rightCol: {
    alignItems: "flex-end",
    gap: 2,
  },
  valueText: {
    color: qsColors.textPrimary,
    fontSize: 14,
    fontWeight: qsTypography.weight.bold,
    fontVariant: ["tabular-nums"],
  },
  pnlText: {
    fontSize: 12,
    fontWeight: qsTypography.weight.semi,
    fontVariant: ["tabular-nums"],
  },

  // ── Action pills (history tab) ──
  actionPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: qsRadius.xs,
  },
  buyPill: {
    backgroundColor: qsColors.buyGreenBg,
  },
  sellPill: {
    backgroundColor: qsColors.sellRedBg,
  },
  actionPillText: {
    fontSize: 10,
    fontWeight: qsTypography.weight.bold,
  },
});
