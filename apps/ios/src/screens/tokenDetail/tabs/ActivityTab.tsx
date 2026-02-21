/**
 * Activity tab — recent transactions for this token.
 *
 * Features:
 * - Self-contained data fetching via filterAllTransactionsTable
 * - FlatList with pull-to-refresh
 * - Row layout: [Buy/Sell badge] [Wallet + Copy] [Time] [USD / SOL amounts]
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
import * as Clipboard from "expo-clipboard";

import type { RpcClient } from "@/src/lib/api/rpcClient";
import { qsColors, qsSpacing, qsTypography } from "@/src/theme/tokens";
import { EmptyState } from "@/src/ui/EmptyState";
import { Activity, Copy } from "@/src/ui/icons";
import { haptics } from "@/src/lib/haptics";

type ActivityRow = {
  type: "buy" | "sell";
  maker: string;
  timestampSeconds: number;
  amountUsd: number;
  amountSol: number;
};

type ActivityTabProps = {
  rpcClient: RpcClient;
  tokenAddress: string;
};

function formatRelativeTime(ts: number): string {
  const elapsedSeconds = Math.max(0, Math.floor(Date.now() / 1000) - ts);
  if (elapsedSeconds < 60) return `${elapsedSeconds}s`;
  if (elapsedSeconds < 3600) return `${Math.floor(elapsedSeconds / 60)}m`;
  if (elapsedSeconds < 86400) return `${Math.floor(elapsedSeconds / 3600)}h`;
  return `${Math.floor(elapsedSeconds / 86400)}d`;
}

function formatUsd(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  if (value >= 1) return `$${value.toFixed(0)}`;
  return `$${value.toFixed(2)}`;
}

function formatSol(value: number): string {
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  if (value >= 1) return value.toFixed(2);
  return value.toFixed(3);
}

function truncateAddress(addr: string): string {
  if (addr.length <= 10) return addr;
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

export function ActivityTab({ rpcClient, tokenAddress }: ActivityTabProps) {
  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const loadActivity = useCallback(
    async (silent = false) => {
      if (!silent) setIsLoading(true);
      setError(null);

      try {
        const response = await rpcClient.call<{
          table?: {
            rows?: {
              tx_type?: string;
              maker?: string;
              block_ts?: number;
              quote_amount?: number;
              sol_amount?: number;
              sol_price_usd?: number;
            }[];
          };
          sol_price_usd?: number;
        }>("public/filterAllTransactionsTable", [
          {
            address_filters: [{ column: "mint", addresses: [tokenAddress] }],
            row_limit: 50,
            sort_column: "index",
            sort_order: false,
          },
        ]);

        if (!mountedRef.current) return;

        const solPriceUsd = Number(response.sol_price_usd) || 0;
        const parsed: ActivityRow[] = (response.table?.rows ?? []).map((row) => {
          const amountSol = Number(row.sol_amount) || Number(row.quote_amount) || 0;
          return {
            type: (row.tx_type === "sell" ? "sell" : "buy") as "buy" | "sell",
            maker: String(row.maker ?? ""),
            timestampSeconds: Number(row.block_ts) || 0,
            amountUsd: amountSol * solPriceUsd,
            amountSol,
          };
        });

        setRows(parsed);
      } catch (err) {
        if (mountedRef.current) {
          setError(err instanceof Error ? err.message : "Failed to load activity");
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
    void loadActivity();
    return () => {
      mountedRef.current = false;
    };
  }, [loadActivity]);

  const handleRefresh = useCallback(() => {
    haptics.light();
    setIsRefreshing(true);
    void loadActivity(true);
  }, [loadActivity]);

  const handleCopyAddress = useCallback((address: string) => {
    haptics.light();
    void Clipboard.setStringAsync(address);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: ActivityRow }) => (
      <View style={styles.row}>
        {/* Buy/Sell badge */}
        <View
          style={[
            styles.typeBadge,
            item.type === "buy" ? styles.typeBuy : styles.typeSell,
          ]}
        >
          <Text
            style={[
              styles.typeText,
              item.type === "buy" ? styles.typeTextBuy : styles.typeTextSell,
            ]}
          >
            {item.type === "buy" ? "B" : "S"}
          </Text>
        </View>

        {/* Address + copy */}
        <View style={styles.addressCol}>
          <View style={styles.addressRow}>
            <Text style={styles.wallet} numberOfLines={1}>
              {truncateAddress(item.maker)}
            </Text>
            <Pressable
              onPress={() => handleCopyAddress(item.maker)}
              hitSlop={6}
              style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
            >
              <Copy size={12} color={qsColors.textSubtle} />
            </Pressable>
          </View>
        </View>

        {/* Time */}
        <Text style={styles.time}>
          {formatRelativeTime(item.timestampSeconds)}
        </Text>

        {/* Amount */}
        <View style={styles.amountCol}>
          <Text
            style={[
              styles.amountUsd,
              item.type === "buy" ? styles.amountBuy : styles.amountSell,
            ]}
          >
            {formatUsd(item.amountUsd)}
          </Text>
          <Text style={styles.amountSol}>
            {formatSol(item.amountSol)} SOL
          </Text>
        </View>
      </View>
    ),
    [handleCopyAddress]
  );

  const keyExtractor = useCallback(
    (item: ActivityRow, index: number) => `${item.maker}-${item.timestampSeconds}-${index}`,
    []
  );

  // Loading state
  if (isLoading && rows.length === 0) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="small" color={qsColors.accent} />
      </View>
    );
  }

  // Error state
  if (error && rows.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon={Activity}
          title="Activity unavailable"
          subtitle={error}
        />
      </View>
    );
  }

  // Empty state
  if (rows.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon={Activity}
          title="No recent activity"
          subtitle="Transactions for this token will appear here."
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Recent Transactions</Text>
        <Text style={styles.countLabel}>{rows.length} txns</Text>
      </View>

      {/* Transaction list */}
      <FlatList
        data={rows}
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
  headerText: {
    fontSize: 13,
    fontWeight: qsTypography.weight.semi,
    color: qsColors.textSecondary,
  },
  countLabel: {
    fontSize: 12,
    fontWeight: qsTypography.weight.medium,
    color: qsColors.textTertiary,
    fontVariant: ["tabular-nums"],
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: qsSpacing.sm,
    paddingHorizontal: qsSpacing.lg,
    gap: qsSpacing.sm,
  },

  typeBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  typeBuy: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
  },
  typeSell: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
  },
  typeText: {
    fontSize: 11,
    fontWeight: qsTypography.weight.bold,
  },
  typeTextBuy: {
    color: qsColors.buyGreen,
  },
  typeTextSell: {
    color: qsColors.sellRed,
  },

  addressCol: {
    flex: 1,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  wallet: {
    color: qsColors.textPrimary,
    fontSize: 13,
    fontWeight: qsTypography.weight.semi,
    fontFamily: "monospace",
  },

  time: {
    color: qsColors.textTertiary,
    fontSize: 11,
    fontVariant: ["tabular-nums"],
  },

  amountCol: {
    alignItems: "flex-end",
    gap: 2,
    minWidth: 64,
  },
  amountUsd: {
    fontSize: 13,
    fontWeight: qsTypography.weight.bold,
    fontVariant: ["tabular-nums"],
  },
  amountBuy: {
    color: qsColors.buyGreen,
  },
  amountSell: {
    color: qsColors.sellRed,
  },
  amountSol: {
    fontSize: 11,
    fontWeight: qsTypography.weight.medium,
    color: qsColors.textTertiary,
    fontVariant: ["tabular-nums"],
  },
});
