/**
 * Activity tab — recent transactions for this token.
 *
 * Row layout: [Buy/Sell] [Wallet] [Time] [$Amount]
 */
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import * as Clipboard from "expo-clipboard";

import { qsColors, qsRadius, qsSpacing, qsTypography } from "@/src/theme/tokens";
import { SkeletonRow } from "@/src/ui/Skeleton";
import { EmptyState } from "@/src/ui/EmptyState";
import { Activity } from "@/src/ui/icons";
import { haptics } from "@/src/lib/haptics";
import { toast } from "@/src/lib/toast";

export type ActivityRow = {
  type: "buy" | "sell";
  maker: string;
  timestampSeconds: number;
  amountUsd: number;
  amountSol: number;
};

type ActivityTabProps = {
  rows: ActivityRow[];
  isLoading: boolean;
  error: string | null;
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
  return `$${value.toFixed(2)}`;
}

function truncateAddress(addr: string): string {
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

export function ActivityTab({ rows, isLoading, error }: ActivityTabProps) {
  if (isLoading) {
    return (
      <View style={styles.container}>
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </View>
    );
  }

  if (error) {
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
      {rows.map((row, index) => (
        <Pressable
          key={index}
          style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
          onPress={() => {
            haptics.light();
            Clipboard.setStringAsync(row.maker);
            toast.success("Copied", "Wallet address copied.");
          }}
        >
          <View
            style={[
              styles.typeBadge,
              row.type === "buy" ? styles.typeBuy : styles.typeSell,
            ]}
          >
            <Text
              style={[
                styles.typeText,
                row.type === "buy" ? styles.typeTextBuy : styles.typeTextSell,
              ]}
            >
              {row.type === "buy" ? "B" : "S"}
            </Text>
          </View>

          <Text style={styles.wallet} numberOfLines={1}>
            {truncateAddress(row.maker)}
          </Text>

          <Text style={styles.time}>
            {formatRelativeTime(row.timestampSeconds)}
          </Text>

          <Text
            style={[
              styles.amount,
              row.type === "buy" ? styles.amountBuy : styles.amountSell,
            ]}
          >
            {formatUsd(row.amountUsd)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: qsSpacing.lg,
    paddingTop: qsSpacing.md,
    gap: qsSpacing.xs,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: qsSpacing.sm,
    backgroundColor: qsColors.layer1,
    borderRadius: qsRadius.sm,
    paddingHorizontal: qsSpacing.md,
    paddingVertical: qsSpacing.sm,
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

  wallet: {
    flex: 1,
    color: qsColors.textSecondary,
    fontSize: 12,
    fontFamily: "Courier",
  },

  time: {
    color: qsColors.textTertiary,
    fontSize: 11,
  },

  amount: {
    fontSize: 12,
    fontWeight: qsTypography.weight.semi,
    minWidth: 50,
    textAlign: "right",
  },
  amountBuy: {
    color: qsColors.buyGreen,
  },
  amountSell: {
    color: qsColors.sellRed,
  },
});
