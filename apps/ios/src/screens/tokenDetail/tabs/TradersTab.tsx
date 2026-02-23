/**
 * Traders tab — fetches and displays top traders with PnL data.
 *
 * Features:
 * - Lazy load on mount via fetchTokenTraders
 * - Sort chips (PnL, Volume, Recent)
 * - Ranked list with address, buy/sell volumes, PnL, PnL%
 * - Pull-to-refresh
 * - Loading, error, and empty states
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import type { RpcClient } from "@/src/lib/api/rpcClient";
import {
  fetchTokenTraders,
  type TokenTrader,
} from "@/src/features/token/tokenInsightsService";
import { qsColors, qsRadius, qsSpacing, qsTypography } from "@/src/theme/tokens";
import { EmptyState } from "@/src/ui/EmptyState";
import { TraderRow } from "@/src/ui/TraderRow";
import { TrendingUp } from "@/src/ui/icons";
import { haptics } from "@/src/lib/haptics";

type TradersTabProps = {
  rpcClient: RpcClient;
  tokenAddress: string;
};

type SortOption = {
  id: string;
  label: string;
  column: string;
};

const SORT_OPTIONS: SortOption[] = [
  { id: "pnl", label: "PnL", column: "total_pnl_quote" },
  { id: "volume", label: "Volume", column: "bought_usd" },
  { id: "recent", label: "Recent", column: "last_trade_ts" },
];

export function TradersTab({ rpcClient, tokenAddress }: TradersTabProps) {
  const [traders, setTraders] = useState<TokenTrader[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSort, setActiveSort] = useState("pnl");
  const mountedRef = useRef(true);

  const loadTraders = useCallback(
    async (sortColumn: string, silent = false) => {
      if (!silent) setIsLoading(true);
      setError(null);

      try {
        const result = await fetchTokenTraders(rpcClient, {
          mint: tokenAddress,
          limit: 40,
          sortColumn,
        });

        if (!mountedRef.current) return;
        setTraders(result.traders);
      } catch (err) {
        if (mountedRef.current) {
          setError(err instanceof Error ? err.message : "Failed to load traders");
        }
      } finally {
        if (mountedRef.current) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [rpcClient, tokenAddress]
  );

  useEffect(() => {
    mountedRef.current = true;
    const sortCol = SORT_OPTIONS.find((s) => s.id === activeSort)?.column ?? "total_pnl_quote";
    void loadTraders(sortCol);
    return () => {
      mountedRef.current = false;
    };
  }, [loadTraders, activeSort]);

  const handleSortChange = useCallback((sortId: string) => {
    haptics.selection();
    setActiveSort(sortId);
  }, []);

  const handleRefresh = useCallback(() => {
    haptics.light();
    setIsRefreshing(true);
    const sortCol = SORT_OPTIONS.find((s) => s.id === activeSort)?.column ?? "total_pnl_quote";
    void loadTraders(sortCol, true);
  }, [loadTraders, activeSort]);

  const renderItem = useCallback(
    ({ item, index }: { item: TokenTrader; index: number }) => (
      <TraderRow trader={item} rank={index + 1} />
    ),
    []
  );

  const keyExtractor = useCallback((item: TokenTrader) => item.trader, []);

  // Loading state
  if (isLoading && traders.length === 0) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="small" color={qsColors.accent} />
      </View>
    );
  }

  // Error state
  if (error && traders.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon={TrendingUp}
          title="Failed to load traders"
          subtitle={error}
        />
      </View>
    );
  }

  // Empty state
  if (traders.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon={TrendingUp}
          title="No traders"
          subtitle="No trader data available for this token."
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Sort chips */}
      <View style={styles.sortRow}>
        {SORT_OPTIONS.map((opt) => {
          const isActive = opt.id === activeSort;
          return (
            <Pressable
              key={opt.id}
              onPress={() => handleSortChange(opt.id)}
              style={[styles.sortChip, isActive && styles.sortChipActive]}
            >
              <Text style={[styles.sortChipText, isActive && styles.sortChipTextActive]}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
        <Text style={styles.countLabel}>
          Top {traders.length}
        </Text>
      </View>

      {/* Trader list */}
      <FlatList
        data={traders}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={qsColors.accent}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: qsSpacing.sm,
    minHeight: 200,
  },
  loadingWrap: {
    paddingVertical: qsSpacing.xxxl,
    alignItems: "center",
  },
  sortRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: qsSpacing.sm,
    paddingHorizontal: qsSpacing.lg,
    paddingBottom: qsSpacing.sm,
  },
  sortChip: {
    paddingHorizontal: qsSpacing.md,
    paddingVertical: 4,
    borderRadius: qsRadius.pill,
    backgroundColor: qsColors.layer2,
  },
  sortChipActive: {
    backgroundColor: qsColors.accent,
  },
  sortChipText: {
    fontSize: 12,
    fontWeight: qsTypography.weight.semi,
    color: qsColors.textTertiary,
  },
  sortChipTextActive: {
    color: qsColors.textPrimary,
  },
  countLabel: {
    flex: 1,
    textAlign: "right",
    fontSize: 12,
    fontWeight: qsTypography.weight.medium,
    color: qsColors.textTertiary,
  },
});
