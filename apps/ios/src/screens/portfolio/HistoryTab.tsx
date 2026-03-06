import { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";

import { EmptyState } from "@/src/ui/EmptyState";
import { SkeletonRows } from "@/src/ui/Skeleton";
import { TokenAvatar } from "@/src/ui/TokenAvatar";
import { Clock } from "@/src/ui/icons";

import { formatCompactUsd } from "@/src/lib/format";
import type { RpcClient } from "@/src/lib/api/rpcClient";
import {
  fetchTransactionHistory,
  type MinimalTokenInfo,
  type TransactionRow,
  type TransactionsResponse,
} from "@/src/features/portfolio/portfolioService";
import { qsColors, qsRadius, qsSpacing, qsTypography } from "@/src/theme/tokens";

type HistoryTabProps = {
  rpcClient: RpcClient;
  walletAddress: string | null;
  solPriceUsd: number;
};

type EnrichedTx = TransactionRow & { tokenMeta?: MinimalTokenInfo };

const TX_LABELS: Record<string, string> = { b: "Buy", s: "Sell", d: "Deposit", w: "Withdraw" };
const TX_COLORS: Record<string, string> = { b: qsColors.danger, s: qsColors.success };

function formatTime(ts: number): string {
  const d = new Date(ts * 1000);
  const month = d.toLocaleString("en-US", { month: "short" });
  const day = d.getDate();
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${month} ${day}, ${time}`;
}

function TxRow({ tx, solPriceUsd }: { tx: EnrichedTx; solPriceUsd: number }) {
  const meta = tx.tokenMeta;
  const symbol = meta?.symbol ?? "UNK";
  const usdValue = tx.amount_quote * (tx.quote_asset_price_usd || solPriceUsd);
  const typeLabel = TX_LABELS[tx.type] ?? tx.type;
  const typeColor = TX_COLORS[tx.type] ?? qsColors.textSecondary;

  return (
    <View style={styles.row}>
      <TokenAvatar uri={meta?.image_uri} size={32} />
      <View style={styles.rowText}>
        <Text style={styles.symbol} numberOfLines={1}>{symbol}</Text>
        <Text style={styles.time}>{formatTime(tx.ts)}</Text>
      </View>
      <View style={styles.rowRight}>
        <Text style={[styles.typeLabel, { color: typeColor }]}>{typeLabel}</Text>
        <Text style={styles.amount}>{formatCompactUsd(usdValue || undefined)}</Text>
      </View>
    </View>
  );
}

export function HistoryTab({ rpcClient, walletAddress, solPriceUsd }: HistoryTabProps) {
  const requestRef = useRef(0);
  const [txRows, setTxRows] = useState<EnrichedTx[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = useCallback(
    (options?: { refreshing?: boolean }) => {
      if (!walletAddress) {
        setTxRows([]);
        setIsLoading(false);
        return;
      }

      const requestId = ++requestRef.current;
      if (options?.refreshing) setIsRefreshing(true);
      else setIsLoading(true);

      fetchTransactionHistory(rpcClient, walletAddress, 100)
        .then((res: TransactionsResponse) => {
          if (requestId !== requestRef.current) return;
          const mintMap = res.mint_to_token_info ?? {};
          const rows = (res.table?.rows ?? []).map((row) => ({
            ...row,
            tokenMeta: mintMap[row.mint]?.token_metadata,
          }));
          setTxRows(rows);
        })
        .catch(() => {
          if (requestId !== requestRef.current) return;
          setTxRows([]);
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
    ({ item }: { item: EnrichedTx }) => (
      <TxRow tx={item} solPriceUsd={solPriceUsd} />
    ),
    [solPriceUsd],
  );

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.content}
      data={isLoading ? [] : txRows}
      keyExtractor={(item, i) => `${item.signature}-${i}`}
      renderItem={renderItem}
      ListEmptyComponent={
        isLoading ? (
          <SkeletonRows count={8} />
        ) : (
          <EmptyState
            icon={Clock}
            title="No history"
            subtitle="Your transaction history will appear here."
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
  time: {
    color: qsColors.textSubtle,
    fontSize: qsTypography.size.xxxs,
  },
  rowRight: { alignItems: "flex-end", gap: qsSpacing.xxs },
  typeLabel: {
    fontSize: qsTypography.size.xxs,
    fontWeight: qsTypography.weight.semi,
  },
  amount: {
    color: qsColors.textSecondary,
    fontSize: qsTypography.size.xxs,
    fontWeight: qsTypography.weight.semi,
    fontVariant: ["tabular-nums"],
  },
});
