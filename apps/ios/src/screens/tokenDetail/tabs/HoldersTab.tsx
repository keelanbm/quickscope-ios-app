/**
 * Holders tab — fetches and displays top token holders with % supply bars.
 *
 * Features:
 * - Lazy load on mount via fetchTokenHolders
 * - Holder count header
 * - Ranked list with address, labels, balance, % supply bar
 * - Pull-to-refresh
 * - Loading skeleton + error / empty states
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";

import type { RpcClient } from "@/src/lib/api/rpcClient";
import {
  fetchTokenHolders,
  type TokenHolder,
} from "@/src/features/token/tokenInsightsService";
import { qsColors, qsSpacing, qsTypography } from "@/src/theme/tokens";
import { EmptyState } from "@/src/ui/EmptyState";
import { HolderRow } from "@/src/ui/HolderRow";
import { User } from "@/src/ui/icons";
import { haptics } from "@/src/lib/haptics";

type HoldersTabProps = {
  rpcClient: RpcClient;
  tokenAddress: string;
};

export function HoldersTab({ rpcClient, tokenAddress }: HoldersTabProps) {
  const [holders, setHolders] = useState<TokenHolder[]>([]);
  const [holderCount, setHolderCount] = useState(0);
  const [totalSupply, setTotalSupply] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const loadHolders = useCallback(
    async (silent = false) => {
      if (!silent) setIsLoading(true);
      setError(null);

      try {
        const result = await fetchTokenHolders(rpcClient, {
          mint: tokenAddress,
          limit: 50,
        });

        if (!mountedRef.current) return;

        setHolders(result.holders);
        setHolderCount(result.holder_count);

        // Derive total supply from sum of balances (approximate — top 50)
        const sum = result.holders.reduce((acc, h) => acc + h.balance, 0);
        setTotalSupply(sum);
      } catch (err) {
        if (mountedRef.current) {
          setError(err instanceof Error ? err.message : "Failed to load holders");
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
    void loadHolders();
    return () => {
      mountedRef.current = false;
    };
  }, [loadHolders]);

  const handleRefresh = useCallback(() => {
    haptics.light();
    setIsRefreshing(true);
    void loadHolders(true);
  }, [loadHolders]);

  const renderItem = useCallback(
    ({ item, index }: { item: TokenHolder; index: number }) => (
      <HolderRow holder={item} rank={index + 1} totalSupply={totalSupply} />
    ),
    [totalSupply]
  );

  const keyExtractor = useCallback((item: TokenHolder) => item.owner, []);

  // Loading state
  if (isLoading && holders.length === 0) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="small" color={qsColors.accent} />
      </View>
    );
  }

  // Error state
  if (error && holders.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon={User}
          title="Failed to load holders"
          subtitle={error}
        />
      </View>
    );
  }

  // Empty state
  if (holders.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon={User}
          title="No holders"
          subtitle="No holder data available for this token."
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.holderCountText}>
          {holderCount.toLocaleString()} holders
        </Text>
        <Text style={styles.topLabel}>Top {holders.length}</Text>
      </View>

      {/* Holder list */}
      <FlatList
        data={holders}
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: qsSpacing.lg,
    paddingBottom: qsSpacing.sm,
  },
  holderCountText: {
    fontSize: 13,
    fontWeight: qsTypography.weight.semi,
    color: qsColors.textSecondary,
    fontVariant: ["tabular-nums"],
  },
  topLabel: {
    fontSize: 12,
    fontWeight: qsTypography.weight.medium,
    color: qsColors.textTertiary,
  },
});
