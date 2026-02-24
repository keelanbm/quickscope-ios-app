import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  ActivityIndicator,
  FlatList,
  LayoutAnimation,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  UIManager,
  View,
} from "react-native";

import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";

import { AnimatedPressable } from "@/src/ui/AnimatedPressable";
import { EmptyState } from "@/src/ui/EmptyState";
import { SkeletonRows } from "@/src/ui/Skeleton";
import { TokenAvatar } from "@/src/ui/TokenAvatar";
import { ChevronDown, ChevronUp, Wallet as WalletIcon } from "@/src/ui/icons";

import {
  formatCompactUsd,
  formatPercent,
  formatSignedUsd,
  formatWalletAddress,
} from "@/src/lib/format";
import type { RpcClient } from "@/src/lib/api/rpcClient";
import { useAuthSession } from "@/src/features/auth/AuthSessionProvider";
import {
  fetchTraderOverview,
  fetchTraderPositions,
  type TraderOverview,
  type Position,
} from "@/src/features/portfolio/portfolioService";
import type { PortfolioRouteParams, RootStack } from "@/src/navigation/types";
import { qsColors, qsRadius, qsSpacing, qsTypography } from "@/src/theme/tokens";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const PAGE_SIZE = 20;

type PortfolioScreenProps = {
  rpcClient: RpcClient;
  params?: PortfolioRouteParams;
};

// -- MetricCell (expanded row grid) --

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

// -- PositionRowItem (expandable) --

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
  onToggleExpand: (mint: string) => void;
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

  const handlePress = useCallback(() => onToggleExpand(mint), [onToggleExpand, mint]);

  return (
    <AnimatedPressable style={styles.positionRow} onPress={handlePress}>
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
            <MetricCell label="Unrealized PnL" value={formatSignedUsd(unrealizedUsd)} positive={unrealizedUsd >= 0} isHighlighted={unrealizedUsd !== 0} />
            <MetricCell label="Realized PnL" value={formatSignedUsd(realizedUsd)} positive={realizedUsd >= 0} isHighlighted={realizedUsd !== 0} />
            <MetricCell label="Avg Entry" value={formatCompactUsd(avgEntryUsd || undefined)} />
            <MetricCell label="Avg Exit" value={formatCompactUsd(avgExitUsd || undefined)} />
            <MetricCell label="Bought" value={formatCompactUsd(boughtUsd || undefined)} />
            <MetricCell label="Sold" value={formatCompactUsd(soldUsd || undefined)} />
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

// -- ListHeader (wallet card + stats grid) --

function ListHeader({
  walletAddress,
  stats,
}: {
  walletAddress: string | null;
  stats: { label: string; value: string; color?: string }[];
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
            <Text style={[styles.statValue, stat.color ? { color: stat.color } : undefined]}>
              {stat.value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// -- Main screen --

export function PortfolioScreen({ rpcClient }: PortfolioScreenProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStack>>();
  const { walletAddress } = useAuthSession();
  const requestRef = useRef(0);
  const offsetRef2 = useRef(0);
  const [overview, setOverview] = useState<TraderOverview | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [solPriceUsd, setSolPriceUsd] = useState(0);
  const [solBalance, setSolBalance] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [expandedMint, setExpandedMint] = useState<string | null>(null);

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
          offsetRef2.current = positionsResponse.positions.length;
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

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedMint(null);
    loadData({ refreshing: true });
  }, [loadData]);

  const loadMore = useCallback(() => {
    if (!walletAddress || !hasMore || isLoadingMore || isLoading) return;

    const requestId = ++requestRef.current;
    setIsLoadingMore(true);

    fetchTraderPositions(rpcClient, walletAddress, {
      limit: PAGE_SIZE,
      offset: offsetRef2.current,
      sort_column: "position_value_quote",
    })
      .then((response) => {
        if (requestId !== requestRef.current) return;
        setPositions((prev) => [...prev, ...response.positions]);
        offsetRef2.current += response.positions.length;
        setHasMore(response.positions.length >= PAGE_SIZE);
      })
      .catch(() => {
        // Silently fail on paginated load — user can scroll again
      })
      .finally(() => {
        if (requestId !== requestRef.current) return;
        setIsLoadingMore(false);
      });
  }, [rpcClient, walletAddress, hasMore, isLoadingMore, isLoading]);

  const stats = useMemo(() => {
    const balanceUsd = solBalance ? solBalance * solPriceUsd : undefined;
    const totalPnl = positions.reduce((sum, p) => sum + ((p.total_pnl_quote ?? 0) * solPriceUsd), 0);
    const unrealizedPnl = positions.reduce((sum, p) => sum + ((p.unrealized_pnl_quote ?? 0) * solPriceUsd), 0);

    return [
      { label: "Balance", value: formatCompactUsd(balanceUsd) },
      { label: "Positions", value: positions.length > 0 ? positions.length.toString() : "--" },
      { label: "Total PnL", value: formatSignedUsd(totalPnl || undefined), color: totalPnl === 0 ? undefined : totalPnl > 0 ? qsColors.success : qsColors.danger },
      { label: "Unrealized PnL", value: formatSignedUsd(unrealizedPnl || undefined), color: unrealizedPnl === 0 ? undefined : unrealizedPnl > 0 ? qsColors.success : qsColors.danger },
    ];
  }, [solBalance, solPriceUsd, positions]);

  const handleToggleExpand = useCallback((mint: string) => {
    Haptics.selectionAsync();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedMint((prev) => (prev === mint ? null : mint));
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Position }) => (
      <PositionRowItem
        position={item}
        solPriceUsd={solPriceUsd}
        navigation={navigation}
        isExpanded={expandedMint === (item.token_info?.mint ?? "")}
        onToggleExpand={handleToggleExpand}
      />
    ),
    [solPriceUsd, navigation, expandedMint, handleToggleExpand],
  );

  const listHeader = useMemo(
    () => <ListHeader walletAddress={walletAddress ?? null} stats={stats} />,
    [walletAddress, stats],
  );

  const listEmpty = useMemo(
    () =>
      isLoading ? (
        <SkeletonRows count={6} />
      ) : errorText ? (
        <Text style={styles.errorText}>{errorText}</Text>
      ) : (
        <EmptyState
          icon={WalletIcon}
          title="No positions"
          subtitle="Your active token positions will appear here."
        />
      ),
    [isLoading, errorText],
  );

  const listFooter = useMemo(
    () =>
      isLoadingMore ? (
        <View style={styles.footer}>
          <ActivityIndicator color={qsColors.accent} />
        </View>
      ) : null,
    [isLoadingMore],
  );

  return (
    <FlatList
      style={styles.page}
      contentContainerStyle={styles.content}
      data={isLoading ? [] : positions}
      keyExtractor={(item, index) => item.token_info?.mint ?? `position-${index}`}
      renderItem={renderItem}
      ListHeaderComponent={listHeader}
      ListEmptyComponent={listEmpty}
      ListFooterComponent={listFooter}
      onEndReached={loadMore}
      onEndReachedThreshold={0.3}
      refreshControl={
        <RefreshControl
          tintColor={qsColors.textTertiary}
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
        />
      }
    />
  );
}

// -- Styles --

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: qsColors.layer0,
  },
  content: {
    padding: qsSpacing.lg,
    gap: qsSpacing.xs,
  },
  listHeader: {
    gap: qsSpacing.md,
    marginBottom: qsSpacing.sm,
  },
  walletCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: qsSpacing.sm,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    borderRadius: qsRadius.md,
    backgroundColor: qsColors.layer1,
    padding: qsSpacing.sm,
  },
  walletAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: qsColors.layer2,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    alignItems: "center",
    justifyContent: "center",
  },
  walletAvatarText: {
    color: qsColors.textPrimary,
    fontSize: qsTypography.size.md,
    fontWeight: qsTypography.weight.bold,
  },
  walletText: {
    flex: 1,
    gap: qsSpacing.xxs,
  },
  walletName: {
    color: qsColors.textPrimary,
    fontSize: qsTypography.size.base,
    fontWeight: qsTypography.weight.semi,
  },
  walletAddress: {
    color: qsColors.textSubtle,
    fontSize: qsTypography.size.xxs,
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: qsSpacing.sm,
  },
  statCard: {
    flex: 1,
    flexBasis: "45%",
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    borderRadius: qsRadius.md,
    backgroundColor: qsColors.layer2,
    padding: qsSpacing.sm,
    gap: qsSpacing.xs,
  },
  statLabel: {
    color: qsColors.textSubtle,
    fontSize: qsTypography.size.xxxs,
  },
  statValue: {
    color: qsColors.textPrimary,
    fontSize: qsTypography.size.md,
    fontWeight: qsTypography.weight.bold,
    fontVariant: ["tabular-nums"],
  },
  positionRow: {
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    borderRadius: qsRadius.md,
    backgroundColor: qsColors.layer1,
    padding: qsSpacing.sm,
  },
  positionSummary: {
    flexDirection: "row",
    alignItems: "center",
    gap: qsSpacing.sm,
  },
  positionText: {
    flex: 1,
    gap: qsSpacing.xxs,
  },
  positionSymbol: {
    color: qsColors.textPrimary,
    fontSize: qsTypography.size.sm,
    fontWeight: qsTypography.weight.bold,
  },
  positionName: {
    color: qsColors.textTertiary,
    fontSize: qsTypography.size.xxs,
  },
  positionRight: {
    alignItems: "flex-end",
    gap: qsSpacing.xxs,
  },
  positionValue: {
    color: qsColors.textPrimary,
    fontSize: qsTypography.size.xs,
    fontWeight: qsTypography.weight.semi,
    fontVariant: ["tabular-nums"],
  },
  positionPnl: {
    fontSize: qsTypography.size.xxs,
    fontWeight: qsTypography.weight.semi,
    fontVariant: ["tabular-nums"],
  },
  pnlPositive: {
    color: qsColors.success,
  },
  pnlNegative: {
    color: qsColors.danger,
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
    flex: 1,
    flexBasis: "28%",
    gap: qsSpacing.xxs,
  },
  metricLabel: {
    color: qsColors.textTertiary,
    fontSize: qsTypography.size.xxxs,
  },
  metricValue: {
    color: qsColors.textSecondary,
    fontSize: qsTypography.size.xs,
    fontWeight: qsTypography.weight.semi,
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
    fontSize: qsTypography.size.sm,
    fontWeight: qsTypography.weight.bold,
  },
  footer: {
    paddingVertical: qsSpacing.lg,
    alignItems: "center",
  },
  errorText: {
    color: qsColors.textSubtle,
    fontSize: qsTypography.size.xxs,
    textAlign: "center",
    padding: qsSpacing.lg,
  },
});
