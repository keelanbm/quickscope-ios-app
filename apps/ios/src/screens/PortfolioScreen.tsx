import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Clipboard from "expo-clipboard";
import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { haptics } from "@/src/lib/haptics";
import { toast } from "@/src/lib/toast";
import type { RpcClient } from "@/src/lib/api/rpcClient";
import { useAuthSession } from "@/src/features/auth/AuthSessionProvider";
import {
  fetchAccountTokenHoldings,
  fetchTraderOverview,
  fetchTraderPositions,
  fetchTransactionHistory,
  type AccountTokenHoldings,
  type Position,
  type PositionsResponse,
  type TraderOverview,
  type TransactionRow,
  type TransactionsResponse,
} from "@/src/features/portfolio/portfolioService";
import type { PortfolioRouteParams, RootStack } from "@/src/navigation/types";
import { qsColors, qsRadius, qsSpacing, qsTypography } from "@/src/theme/tokens";
import { Activity, Clock, Copy, QSLogoIcon, SolanaIcon, Wallet } from "@/src/ui/icons";
import { EmptyState } from "@/src/ui/EmptyState";
import { SkeletonCard, SkeletonRow } from "@/src/ui/Skeleton";

type PortfolioScreenProps = {
  rpcClient: RpcClient;
  params?: PortfolioRouteParams;
};

type PortfolioTab = "positions" | "history" | "activity";

/* ── Formatters ── */

function formatWalletAddress(address?: string): string {
  if (!address) return "Not connected";
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatUsd(value?: number): string {
  if (!value || !Number.isFinite(value)) return "--";
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
}

function formatSol(value?: number): string {
  if (value === undefined || !Number.isFinite(value)) return "--";
  if (Math.abs(value) >= 1000) return value.toFixed(0);
  if (Math.abs(value) >= 10) return value.toFixed(2);
  return value.toFixed(4);
}

function formatPnlPercent(value?: number): string {
  if (value === undefined || !Number.isFinite(value)) return "";
  const pct = value * 100;
  const prefix = pct > 0 ? "+" : "";
  return `${prefix}${pct.toFixed(1)}%`;
}

function formatRelativeTime(unixSeconds: number): string {
  if (!unixSeconds) return "--";
  const elapsed = Math.max(0, Math.floor(Date.now() / 1000) - unixSeconds);
  if (elapsed < 60) return `${elapsed}s ago`;
  if (elapsed < 3600) return `${Math.floor(elapsed / 60)}m ago`;
  if (elapsed < 86400) return `${Math.floor(elapsed / 3600)}h ago`;
  return `${Math.floor(elapsed / 86400)}d ago`;
}

const fallbackImage = "https://app.quickscope.gg/favicon.ico";

export function PortfolioScreen({ rpcClient, params }: PortfolioScreenProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStack>>();
  const { walletAddress } = useAuthSession();
  const requestRef = useRef(0);

  const [overview, setOverview] = useState<TraderOverview | null>(null);
  const [holdings, setHoldings] = useState<AccountTokenHoldings | null>(null);
  const [positionsData, setPositionsData] = useState<PositionsResponse | null>(null);
  const [txData, setTxData] = useState<TransactionsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<PortfolioTab>("positions");

  const loadData = useCallback(
    async (options?: { refreshing?: boolean }) => {
      if (!walletAddress) {
        setOverview(null);
        setHoldings(null);
        setPositionsData(null);
        setTxData(null);
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

      try {
        const [nextOverview, nextHoldings, nextPositions, nextTx] = await Promise.all([
          fetchTraderOverview(rpcClient, walletAddress),
          fetchAccountTokenHoldings(rpcClient, walletAddress),
          fetchTraderPositions(rpcClient, walletAddress).catch(() => null),
          fetchTransactionHistory(rpcClient, walletAddress, 50).catch(() => null),
        ]);
        if (requestId !== requestRef.current) return;
        setOverview(nextOverview);
        setHoldings(nextHoldings);
        setPositionsData(nextPositions);
        setTxData(nextTx);
      } catch (error) {
        if (requestId !== requestRef.current) return;
        setErrorText(error instanceof Error ? error.message : "Failed to load portfolio.");
      } finally {
        if (requestId !== requestRef.current) return;
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [rpcClient, walletAddress]
  );

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleCopyAddress = useCallback(async () => {
    if (!walletAddress) return;
    await Clipboard.setStringAsync(walletAddress);
    haptics.success();
    toast.success("Copied", walletAddress);
  }, [walletAddress]);

  /* ── Derived data ── */

  const solPriceUsd = holdings?.sol_price_usd || overview?.sol_price_usd || 0;

  const positions: Position[] = useMemo(() => {
    return (positionsData?.positions ?? [])
      .filter((p) => p.balance > 0 || p.position_value_quote > 0)
      .sort((a, b) => b.position_value_quote - a.position_value_quote);
  }, [positionsData]);

  const transactions: TransactionRow[] = useMemo(() => {
    return (txData?.table?.rows ?? []).sort((a, b) => b.ts - a.ts);
  }, [txData]);

  // Filter activity to deposits/withdrawals only
  const activity: TransactionRow[] = useMemo(() => {
    return transactions.filter((tx) => tx.type === "d" || tx.type === "w");
  }, [transactions]);

  const stats = useMemo(() => {
    const solBalanceUsd = holdings?.sol_balance ? holdings.sol_balance * solPriceUsd : undefined;
    const totalVolumeUsd =
      (overview?.cumulatives?.bought_usd_cumulative ?? 0) +
      (overview?.cumulatives?.sold_usd_cumulative ?? 0);

    // Compute total unrealized PnL from positions
    let totalUnrealizedPnl = 0;
    for (const p of positions) {
      if (Number.isFinite(p.unrealized_pnl_quote)) {
        totalUnrealizedPnl += p.unrealized_pnl_quote;
      }
    }
    const unrealizedPnlUsd = totalUnrealizedPnl * solPriceUsd;

    return [
      { label: "Balance", value: formatUsd(solBalanceUsd), showSol: true },
      { label: "Positions", value: positions.length.toString(), showSol: false },
      { label: "Volume", value: formatUsd(totalVolumeUsd || undefined), showSol: false },
      {
        label: "Unrealized PnL",
        value: totalUnrealizedPnl !== 0 ? formatUsd(unrealizedPnlUsd) : "--",
        showSol: false,
        positive: totalUnrealizedPnl >= 0,
        colored: totalUnrealizedPnl !== 0,
      },
    ];
  }, [holdings, overview, positions, solPriceUsd]);

  const handlePositionPress = useCallback(
    (position: Position) => {
      const mint = position.token_info?.mint;
      if (!mint) return;
      navigation.navigate("TokenDetail", {
        tokenAddress: mint,
        symbol: position.token_info?.symbol,
        name: position.token_info?.name,
        imageUri: position.token_info?.image_uri,
      });
    },
    [navigation]
  );

  const getTokenMeta = useCallback(
    (mint: string) => {
      const info = txData?.mint_to_token_info?.[mint]?.token_metadata;
      return {
        symbol: info?.symbol ?? "UNK",
        imageUri: info?.image_uri,
      };
    },
    [txData]
  );

  const txTypeLabel = (type: string) => {
    switch (type) {
      case "b": return "Buy";
      case "s": return "Sell";
      case "d": return "Deposit";
      case "w": return "Withdraw";
      default: return type;
    }
  };

  const txTypeColor = (type: string) => {
    switch (type) {
      case "b": return qsColors.buyGreen;
      case "s": return qsColors.sellRed;
      default: return qsColors.textTertiary;
    }
  };

  /* ── Tabs ── */

  const tabs: { id: PortfolioTab; label: string }[] = [
    { id: "positions", label: "Positions" },
    { id: "history", label: "History" },
    { id: "activity", label: "Activity" },
  ];

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          tintColor={qsColors.textMuted}
          refreshing={isRefreshing}
          onRefresh={() => { haptics.light(); void loadData({ refreshing: true }); }}
        />
      }
    >
      {/* Error */}
      {errorText ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{errorText}</Text>
          <Pressable
            style={styles.retryButton}
            onPress={() => { void loadData(); }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      ) : null}

      {/* ── Wallet card ── */}
      <View style={styles.walletCard}>
        <View style={styles.walletAvatar}>
          <QSLogoIcon size={20} />
        </View>
        <View style={styles.walletText}>
          <Text style={styles.walletName}>Primary Wallet</Text>
          <View style={styles.walletAddressRow}>
            <Text style={styles.walletAddress}>
              {formatWalletAddress(walletAddress ?? params?.walletAddress)}
            </Text>
            {walletAddress ? (
              <Pressable onPress={handleCopyAddress} hitSlop={8}>
                <Copy size={12} color={qsColors.textTertiary} />
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>

      {/* ── Stats grid ── */}
      <View style={styles.statsRow}>
        {stats.map((stat) => (
          <View key={stat.label} style={styles.statCard}>
            <Text style={styles.statLabel}>{stat.label}</Text>
            <View style={styles.statValueRow}>
              {stat.showSol ? <SolanaIcon size={14} /> : null}
              <Text
                style={[
                  styles.statValue,
                  stat.colored && stat.positive && styles.pnlPositive,
                  stat.colored && !stat.positive && styles.pnlNegative,
                ]}
              >
                {stat.value}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* ── Tab bar ── */}
      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <Pressable
              key={tab.id}
              onPress={() => { haptics.selection(); setActiveTab(tab.id); }}
              style={[styles.tab, isActive && styles.tabActive]}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* ── Tab content ── */}
      {isLoading ? (
        <View style={{ gap: qsSpacing.md }}>
          <SkeletonCard />
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </View>
      ) : activeTab === "positions" ? (
        /* ── Positions tab ── */
        positions.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="No positions yet"
            subtitle="Make your first trade to see holdings here."
          />
        ) : (
          <View style={styles.listWrap}>
            {positions.map((position) => {
              const symbol = position.token_info?.symbol ?? "UNK";
              const imageUri = position.token_info?.image_uri;
              const valueUsd = position.position_value_quote * solPriceUsd;
              const pnlPct = position.total_pnl_change_proportion;
              const pnlSol = position.total_pnl_quote;
              const isPositive = pnlSol >= 0;

              return (
                <Pressable
                  key={position.token_info?.mint ?? symbol}
                  style={({ pressed }) => [
                    styles.positionRow,
                    pressed && styles.rowPressed,
                  ]}
                  onPress={() => handlePositionPress(position)}
                >
                  <Image
                    source={{ uri: imageUri || fallbackImage }}
                    style={styles.tokenAvatar}
                  />
                  <View style={styles.nameCol}>
                    <Text numberOfLines={1} style={styles.tokenSymbol}>{symbol}</Text>
                    <Text numberOfLines={1} style={styles.tokenBalance}>
                      {formatSol(position.balance)} tokens
                    </Text>
                  </View>
                  <View style={styles.valueCol}>
                    <Text numberOfLines={1} style={styles.valueText}>
                      {formatUsd(valueUsd)}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.pnlText,
                        isPositive ? styles.pnlPositive : styles.pnlNegative,
                      ]}
                    >
                      {formatPnlPercent(pnlPct)}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )
      ) : activeTab === "history" ? (
        /* ── Trade History tab ── */
        transactions.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="No trades yet"
            subtitle="Completed trades will appear here."
          />
        ) : (
          <View style={styles.listWrap}>
            {transactions.map((tx, idx) => {
              const meta = getTokenMeta(tx.mint);
              const totalUsd = tx.amount_quote * tx.quote_asset_price_usd;

              return (
                <View key={tx.signature || `${tx.ts}-${idx}`} style={styles.txRow}>
                  <View
                    style={[
                      styles.txTypeBadge,
                      { backgroundColor: tx.type === "b" ? qsColors.buyGreenBg : qsColors.sellRedBg },
                    ]}
                  >
                    <Text style={[styles.txTypeText, { color: txTypeColor(tx.type) }]}>
                      {txTypeLabel(tx.type)}
                    </Text>
                  </View>
                  <View style={styles.txNameCol}>
                    <Text numberOfLines={1} style={styles.tokenSymbol}>{meta.symbol}</Text>
                    <Text numberOfLines={1} style={styles.txTime}>
                      {formatRelativeTime(tx.ts)}
                    </Text>
                  </View>
                  <View style={styles.valueCol}>
                    <Text numberOfLines={1} style={styles.valueText}>
                      {formatUsd(totalUsd)}
                    </Text>
                    <Text numberOfLines={1} style={styles.txAmount}>
                      {formatSol(tx.amount_quote)} SOL
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )
      ) : (
        /* ── Activity tab ── */
        activity.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="No activity yet"
            subtitle="Wallet activity will show up here."
          />
        ) : (
          <View style={styles.listWrap}>
            {activity.map((tx, idx) => {
              const meta = getTokenMeta(tx.mint);
              const totalUsd = tx.amount_quote * tx.quote_asset_price_usd;

              return (
                <View key={tx.signature || `${tx.ts}-${idx}`} style={styles.txRow}>
                  <View style={styles.txTypeBadge}>
                    <Text style={[styles.txTypeText, { color: txTypeColor(tx.type) }]}>
                      {txTypeLabel(tx.type)}
                    </Text>
                  </View>
                  <View style={styles.txNameCol}>
                    <Text numberOfLines={1} style={styles.tokenSymbol}>{meta.symbol}</Text>
                    <Text numberOfLines={1} style={styles.txTime}>
                      {formatRelativeTime(tx.ts)}
                    </Text>
                  </View>
                  <View style={styles.valueCol}>
                    <Text numberOfLines={1} style={styles.valueText}>
                      {formatUsd(totalUsd)}
                    </Text>
                    <Text numberOfLines={1} style={styles.txAmount}>
                      {formatSol(tx.amount_quote)} SOL
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: qsColors.layer0,
  },
  content: {
    paddingTop: qsSpacing.md,
    paddingBottom: 140,
    gap: qsSpacing.lg,
    paddingHorizontal: qsSpacing.lg,
  },

  // ── Error ──
  errorBox: {
    borderRadius: qsRadius.md,
    backgroundColor: qsColors.dangerDark,
    padding: qsSpacing.md,
    gap: 4,
  },
  errorText: {
    color: qsColors.dangerLight,
    fontSize: 12,
  },
  retryButton: {
    marginTop: 4,
    alignSelf: "flex-start",
    borderRadius: qsRadius.sm,
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: qsColors.dangerBg,
  },
  retryButtonText: {
    color: qsColors.dangerLight,
    fontSize: 11,
    fontWeight: qsTypography.weight.bold,
  },

  // ── Wallet card ──
  walletCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: qsSpacing.sm,
    borderRadius: qsRadius.lg,
    backgroundColor: qsColors.layer1,
    padding: qsSpacing.md,
  },
  walletAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: qsColors.layer2,
    alignItems: "center",
    justifyContent: "center",
  },
  walletText: {
    flex: 1,
    gap: 2,
  },
  walletName: {
    color: qsColors.textPrimary,
    fontSize: 15,
    fontWeight: qsTypography.weight.semi,
  },
  walletAddressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  walletAddress: {
    color: qsColors.textTertiary,
    fontSize: 12,
    fontVariant: ["tabular-nums"],
  },

  // ── Stats grid ──
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: qsSpacing.sm,
  },
  statCard: {
    width: "48%",
    borderRadius: qsRadius.md,
    backgroundColor: qsColors.layer1,
    padding: qsSpacing.md,
    gap: 4,
  },
  statLabel: {
    color: qsColors.textTertiary,
    fontSize: 11,
    fontWeight: qsTypography.weight.medium,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  statValue: {
    color: qsColors.textPrimary,
    fontSize: 18,
    fontWeight: qsTypography.weight.bold,
    fontVariant: ["tabular-nums"],
  },
  statValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  // ── Tab bar ──
  tabBar: {
    flexDirection: "row",
    gap: qsSpacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: qsColors.borderDefault,
    paddingBottom: 0,
  },
  tab: {
    paddingVertical: qsSpacing.sm,
    paddingHorizontal: qsSpacing.xs,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: qsColors.accent,
  },
  tabText: {
    color: qsColors.textTertiary,
    fontSize: 13,
    fontWeight: qsTypography.weight.semi,
  },
  tabTextActive: {
    color: qsColors.textPrimary,
  },

  // ── Lists ──
  listWrap: {
    gap: 0,
  },

  // ── Position row ──
  positionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
  },
  rowPressed: {
    opacity: 0.7,
  },
  tokenAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: qsColors.layer2,
  },
  nameCol: {
    flex: 1,
    gap: 2,
  },
  tokenSymbol: {
    color: qsColors.textPrimary,
    fontSize: 14,
    fontWeight: qsTypography.weight.bold,
  },
  tokenBalance: {
    color: qsColors.textTertiary,
    fontSize: 11,
    fontVariant: ["tabular-nums"],
  },
  valueCol: {
    alignItems: "flex-end",
    gap: 2,
    minWidth: 80,
  },
  valueText: {
    color: qsColors.textPrimary,
    fontSize: 13,
    fontWeight: qsTypography.weight.semi,
    fontVariant: ["tabular-nums"],
  },
  pnlText: {
    fontSize: 12,
    fontWeight: qsTypography.weight.semi,
    fontVariant: ["tabular-nums"],
  },
  pnlPositive: {
    color: qsColors.buyGreen,
  },
  pnlNegative: {
    color: qsColors.sellRed,
  },

  // ── Transaction row ──
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
  },
  txTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: qsRadius.sm,
    backgroundColor: qsColors.layer2,
    minWidth: 48,
    alignItems: "center",
  },
  txTypeText: {
    fontSize: 11,
    fontWeight: qsTypography.weight.bold,
  },
  txNameCol: {
    flex: 1,
    gap: 2,
  },
  txTime: {
    color: qsColors.textTertiary,
    fontSize: 11,
  },
  txAmount: {
    color: qsColors.textTertiary,
    fontSize: 11,
    fontVariant: ["tabular-nums"],
  },

});
