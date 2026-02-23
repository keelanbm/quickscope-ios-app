import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";

import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { AnimatedPressable } from "@/src/ui/AnimatedPressable";
import { SkeletonRows } from "@/src/ui/Skeleton";

import { formatCompactUsd, formatWalletAddress } from "@/src/lib/format";
import type { RpcClient } from "@/src/lib/api/rpcClient";
import { useAuthSession } from "@/src/features/auth/AuthSessionProvider";
import {
  fetchTraderOverview,
  fetchTraderPositions,
  type TraderOverview,
  type Position,
} from "@/src/features/portfolio/portfolioService";
import type { PortfolioRouteParams, RootStack } from "@/src/navigation/types";
import { qsColors, qsRadius, qsSpacing } from "@/src/theme/tokens";
import { SectionCard } from "@/src/ui/SectionCard";

const PAGE_SIZE = 20;

type PortfolioScreenProps = {
  rpcClient: RpcClient;
  params?: PortfolioRouteParams;
};

export function PortfolioScreen({ rpcClient, params }: PortfolioScreenProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStack>>();
  const { walletAddress } = useAuthSession();
  const requestRef = useRef(0);
  const [overview, setOverview] = useState<TraderOverview | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [solPriceUsd, setSolPriceUsd] = useState(0);
  const [solBalance, setSolBalance] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

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

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => loadData({ refreshing: true });

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

  const stats = useMemo(() => {
    const balanceUsd = solBalance ? solBalance * solPriceUsd : undefined;
    const totalPnl = positions.reduce((sum, p) => sum + ((p.total_pnl_quote ?? 0) * solPriceUsd), 0);
    const unrealizedPnl = positions.reduce((sum, p) => sum + ((p.unrealized_pnl_quote ?? 0) * solPriceUsd), 0);

    return [
      { label: "Balance", value: formatCompactUsd(balanceUsd) },
      { label: "Positions", value: positions.length > 0 ? positions.length.toString() : "--" },
      { label: "Total PnL", value: formatCompactUsd(totalPnl || undefined) },
      { label: "Unrealized PnL", value: formatCompactUsd(unrealizedPnl || undefined) },
    ];
  }, [solBalance, solPriceUsd, positions]);

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          tintColor={qsColors.textMuted}
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Portfolio</Text>
        <Text style={styles.subtitle}>Snapshot of balances and active positions.</Text>
      </View>

      <View style={styles.walletCard}>
        <View style={styles.walletAvatar}>
          <Text style={styles.walletAvatarText}>Q</Text>
        </View>
        <View style={styles.walletText}>
          <Text style={styles.walletName}>Primary Wallet</Text>
          <Text style={styles.walletAddress}>
            {formatWalletAddress(walletAddress ?? params?.walletAddress)}
          </Text>
        </View>
        <AnimatedPressable style={styles.walletButton}>
          <Text style={styles.walletButtonText}>Manage</Text>
        </AnimatedPressable>
      </View>

      <View style={styles.statsRow}>
        {stats.map((stat) => (
          <View key={stat.label} style={styles.statCard}>
            <Text style={styles.statLabel}>{stat.label}</Text>
            <Text style={styles.statValue}>{stat.value}</Text>
          </View>
        ))}
      </View>

      <SectionCard title="Positions" subtitle="Top holdings by value">
        {isLoading ? (
          <SkeletonRows count={4} />
        ) : errorText ? (
          <Text style={styles.contextText}>{errorText}</Text>
        ) : positions.length === 0 ? (
          <Text style={styles.contextText}>No positions yet.</Text>
        ) : (
          positions.map((position) => (
            <AnimatedPressable
              key={position.id}
              style={styles.positionRow}
              onPress={() =>
                navigation.navigate("TokenDetail", {
                  source: "portfolio-row",
                  tokenAddress: position.id,
                  symbol: position.symbol,
                  name: position.name,
                })
              }
            >
              <View style={styles.positionLeft}>
                <View style={styles.positionAvatar}>
                  <Text style={styles.positionAvatarText}>{position.symbol[0]}</Text>
                </View>
                <View style={styles.positionText}>
                  <Text style={styles.positionSymbol}>{position.symbol}</Text>
                  <Text style={styles.positionName}>{position.name}</Text>
                </View>
              </View>
              <View style={styles.positionRight}>
                <Text style={styles.positionValue}>{position.value}</Text>
                <Text
                  style={[
                    styles.positionPnl,
                    position.pnlPositive ? styles.pnlPositive : styles.pnlNegative,
                  ]}
                >
                  {position.pnl}
                </Text>
              </View>
            </AnimatedPressable>
          ))
        )}
      </SectionCard>

      {params?.source ? (
        <Text style={styles.contextText}>Opened from a deep link.</Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: qsColors.bgCanvas,
  },
  content: {
    padding: qsSpacing.xl,
    gap: qsSpacing.md,
  },
  header: {
    gap: 4,
  },
  title: {
    color: qsColors.textPrimary,
    fontSize: 28,
    fontWeight: "700",
  },
  subtitle: {
    color: qsColors.textMuted,
    fontSize: 14,
  },
  walletCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: qsSpacing.sm,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    borderRadius: qsRadius.md,
    backgroundColor: qsColors.bgCard,
    padding: qsSpacing.sm,
  },
  walletAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: qsColors.bgCardSoft,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    alignItems: "center",
    justifyContent: "center",
  },
  walletAvatarText: {
    color: qsColors.textPrimary,
    fontWeight: "700",
  },
  walletText: {
    flex: 1,
    gap: 2,
  },
  walletName: {
    color: qsColors.textPrimary,
    fontSize: 15,
    fontWeight: "600",
  },
  walletAddress: {
    color: qsColors.textSubtle,
    fontSize: 12,
  },
  walletButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: qsRadius.sm,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    backgroundColor: qsColors.bgCardSoft,
  },
  walletButtonText: {
    color: qsColors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: qsSpacing.sm,
  },
  statCard: {
    width: "48%",
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    borderRadius: qsRadius.md,
    backgroundColor: qsColors.bgCardSoft,
    padding: qsSpacing.sm,
    gap: 4,
  },
  statLabel: {
    color: qsColors.textSubtle,
    fontSize: 11,
  },
  statValue: {
    color: qsColors.textSecondary,
    fontSize: 16,
    fontWeight: "700",
  },
  positionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    borderRadius: qsRadius.md,
    backgroundColor: qsColors.bgCardSoft,
    padding: qsSpacing.sm,
    gap: qsSpacing.sm,
  },
  positionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: qsSpacing.sm,
    flex: 1,
  },
  positionAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: qsColors.bgCard,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    alignItems: "center",
    justifyContent: "center",
  },
  positionAvatarText: {
    color: qsColors.textPrimary,
    fontWeight: "700",
  },
  positionText: {
    gap: 2,
  },
  positionSymbol: {
    color: qsColors.textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  positionName: {
    color: qsColors.textMuted,
    fontSize: 12,
  },
  positionRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  positionValue: {
    color: qsColors.textSecondary,
    fontSize: 12,
  },
  positionPnl: {
    fontSize: 12,
    fontWeight: "700",
  },
  pnlPositive: {
    color: qsColors.success,
  },
  pnlNegative: {
    color: qsColors.danger,
  },
  contextText: {
    color: qsColors.textSubtle,
    fontSize: 12,
  },
});
