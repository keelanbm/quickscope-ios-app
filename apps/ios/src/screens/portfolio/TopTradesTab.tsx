import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";

import { AnimatedPressable } from "@/src/ui/AnimatedPressable";
import { EmptyState } from "@/src/ui/EmptyState";
import { SkeletonRows } from "@/src/ui/Skeleton";
import { TokenAvatar } from "@/src/ui/TokenAvatar";
import { TrendingUp } from "@/src/ui/icons";

import {
  formatCompactUsd,
  formatPercent,
  formatSignedUsd,
} from "@/src/lib/format";
import type { RpcClient } from "@/src/lib/api/rpcClient";
import {
  fetchTraderPositions,
  quoteToUsd,
  type Position,
} from "@/src/features/portfolio/portfolioService";
import type { RootStack } from "@/src/navigation/types";
import { qsColors, qsRadius, qsSpacing, qsTypography } from "@/src/theme/tokens";

type TopTradesTabProps = {
  rpcClient: RpcClient;
  walletAddress: string | null;
};

function TradeRow({
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
  const toUsd = (q: number) => quoteToUsd(q, meta, solPriceUsd);
  const realizedUsd = toUsd(position.realized_pnl_quote ?? 0);
  const pnlPercent = (position.realized_pnl_change_proportion ?? 0) * 100;
  const positive = realizedUsd >= 0;
  const boughtUsd = position.bought_usd ?? toUsd(position.bought_quote ?? 0);
  const soldUsd = position.sold_usd ?? toUsd(position.sold_quote ?? 0);

  return (
    <AnimatedPressable
      style={styles.row}
      onPress={() =>
        navigation.navigate("TokenDetail", {
          source: "portfolio-row",
          tokenAddress: mint,
          symbol,
          name,
          imageUri: meta?.image_uri ?? undefined,
          platform: meta?.platform ?? undefined,
          exchange: meta?.exchange ?? undefined,
        })
      }
    >
      <TokenAvatar uri={meta?.image_uri} size={36} />
      <View style={styles.rowText}>
        <Text style={styles.symbol} numberOfLines={1}>{symbol}</Text>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
      </View>
      <View style={styles.rowMid}>
        <Text style={styles.midLabel}>Bought</Text>
        <Text style={styles.midValue}>{formatCompactUsd(boughtUsd || undefined)}</Text>
      </View>
      <View style={styles.rowMid}>
        <Text style={styles.midLabel}>Sold</Text>
        <Text style={styles.midValue}>{formatCompactUsd(soldUsd || undefined)}</Text>
      </View>
      <View style={styles.rowRight}>
        <Text style={[styles.pnlValue, positive ? styles.positive : styles.negative]}>
          {formatSignedUsd(realizedUsd || undefined)}
        </Text>
        <Text style={[styles.pnlPercent, positive ? styles.positive : styles.negative]}>
          {formatPercent(pnlPercent)}
        </Text>
      </View>
    </AnimatedPressable>
  );
}

export function TopTradesTab({ rpcClient, walletAddress }: TopTradesTabProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStack>>();
  const requestRef = useRef(0);
  const [positions, setPositions] = useState<Position[]>([]);
  const [solPriceUsd, setSolPriceUsd] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = useCallback(
    (options?: { refreshing?: boolean }) => {
      if (!walletAddress) {
        setPositions([]);
        setIsLoading(false);
        return;
      }

      const requestId = ++requestRef.current;
      if (options?.refreshing) setIsRefreshing(true);
      else setIsLoading(true);

      fetchTraderPositions(rpcClient, walletAddress, {
        limit: 50,
        offset: 0,
        sort_column: "realized_pnl_quote",
        include_zero_balances: true,
      })
        .then((res) => {
          if (requestId !== requestRef.current) return;
          setSolPriceUsd(res.sol_price_usd);
          const closed = res.positions
            .filter((p) => p.balance === 0)
            .sort(
              (a, b) =>
                Math.abs(b.realized_pnl_quote) - Math.abs(a.realized_pnl_quote)
            );
          setPositions(closed);
        })
        .catch(() => {
          if (requestId !== requestRef.current) return;
          setPositions([]);
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
    loadData({ refreshing: true });
  }, [loadData]);

  const renderItem = useCallback(
    ({ item }: { item: Position }) => (
      <TradeRow position={item} solPriceUsd={solPriceUsd} navigation={navigation} />
    ),
    [solPriceUsd, navigation],
  );

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.content}
      data={isLoading ? [] : positions}
      keyExtractor={(item, i) => item.token_info?.mint ?? `top-${i}`}
      renderItem={renderItem}
      ListEmptyComponent={
        isLoading ? (
          <SkeletonRows count={6} />
        ) : (
          <EmptyState
            icon={TrendingUp}
            title="No closed trades"
            subtitle="Your best realized trades will appear here."
          />
        )
      }
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

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: qsColors.layer0 },
  content: { padding: qsSpacing.lg, gap: qsSpacing.xs },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: qsSpacing.sm,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    borderRadius: qsRadius.md,
    backgroundColor: qsColors.layer1,
    padding: qsSpacing.sm,
  },
  rowText: { flex: 1, gap: qsSpacing.xxs },
  symbol: {
    color: qsColors.textPrimary,
    fontSize: qsTypography.size.sm,
    fontWeight: qsTypography.weight.bold,
  },
  name: {
    color: qsColors.textTertiary,
    fontSize: qsTypography.size.xxs,
  },
  rowMid: { alignItems: "flex-end", gap: qsSpacing.xxs },
  midLabel: {
    color: qsColors.textSubtle,
    fontSize: qsTypography.size.xxxs,
  },
  midValue: {
    color: qsColors.textSecondary,
    fontSize: qsTypography.size.xxxs,
    fontWeight: qsTypography.weight.semi,
    fontVariant: ["tabular-nums"],
  },
  rowRight: { alignItems: "flex-end", gap: qsSpacing.xxs, minWidth: 64 },
  pnlValue: {
    fontSize: qsTypography.size.xs,
    fontWeight: qsTypography.weight.bold,
    fontVariant: ["tabular-nums"],
  },
  pnlPercent: {
    fontSize: qsTypography.size.xxs,
    fontWeight: qsTypography.weight.semi,
    fontVariant: ["tabular-nums"],
  },
  positive: { color: qsColors.success },
  negative: { color: qsColors.danger },
});
