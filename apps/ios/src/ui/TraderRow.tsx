/**
 * TraderRow — single token trader list item.
 *
 * Layout:
 * [Rank]  [Address + Copy]  [Bought / Sold]     [PnL + PnL%]
 *  #1      HqNf...7kWp       B $12.4K / S $8.2K   +$4.2K  +51.2%
 */
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { qsColors, qsRadius, qsSpacing, qsTypography } from "@/src/theme/tokens";
import { Copy } from "@/src/ui/icons";
import { haptics } from "@/src/lib/haptics";
import * as Clipboard from "expo-clipboard";
import type { TokenTrader } from "@/src/features/token/tokenInsightsService";

type TraderRowProps = {
  trader: TokenTrader;
  rank: number;
};

function truncateAddress(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function formatUsd(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(abs / 1_000).toFixed(1)}K`;
  if (abs >= 1) return `$${abs.toFixed(0)}`;
  if (abs > 0) return `$${abs.toFixed(2)}`;
  return "$0";
}

function formatPnl(value: number): string {
  const prefix = value >= 0 ? "+" : "-";
  return `${prefix}${formatUsd(value)}`;
}

function formatPnlPct(proportion: number): string {
  const pct = proportion * 100;
  const prefix = pct >= 0 ? "+" : "";
  if (Math.abs(pct) >= 1000) return `${prefix}${(pct / 1000).toFixed(0)}x`;
  if (Math.abs(pct) >= 100) return `${prefix}${pct.toFixed(0)}%`;
  return `${prefix}${pct.toFixed(1)}%`;
}

function getPnlColor(value: number): string {
  if (value > 0) return qsColors.buyGreen;
  if (value < 0) return qsColors.sellRed;
  return qsColors.textTertiary;
}

export function TraderRow({ trader, rank }: TraderRowProps) {
  const pnlColor = getPnlColor(trader.total_pnl_quote);

  const handleCopy = () => {
    haptics.light();
    void Clipboard.setStringAsync(trader.trader);
  };

  return (
    <View style={styles.row}>
      {/* Rank */}
      <Text style={styles.rank}>#{rank}</Text>

      {/* Address + copy */}
      <View style={styles.addressCol}>
        <View style={styles.addressRow}>
          <Text style={styles.address} numberOfLines={1}>
            {truncateAddress(trader.trader)}
          </Text>
          <Pressable
            onPress={handleCopy}
            hitSlop={6}
            style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
          >
            <Copy size={12} color={qsColors.textSubtle} />
          </Pressable>
        </View>
        {/* Buy / Sell volumes */}
        <Text style={styles.volumeText} numberOfLines={1}>
          B {formatUsd(trader.bought_usd)} / S {formatUsd(trader.sold_usd)}
        </Text>
      </View>

      {/* PnL column */}
      <View style={styles.pnlCol}>
        <Text style={[styles.pnlValue, { color: pnlColor }]} numberOfLines={1}>
          {formatPnl(trader.total_pnl_quote)}
        </Text>
        <Text style={[styles.pnlPct, { color: pnlColor }]} numberOfLines={1}>
          {formatPnlPct(trader.total_pnl_change_proportion)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: qsSpacing.sm,
    paddingHorizontal: qsSpacing.lg,
    gap: qsSpacing.sm,
  },
  rank: {
    width: 28,
    fontSize: 12,
    fontWeight: qsTypography.weight.bold,
    color: qsColors.textTertiary,
    fontVariant: ["tabular-nums"],
  },
  addressCol: {
    flex: 1,
    gap: 2,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  address: {
    fontSize: 13,
    fontWeight: qsTypography.weight.semi,
    color: qsColors.textPrimary,
    fontFamily: "monospace",
  },
  volumeText: {
    fontSize: 11,
    fontWeight: qsTypography.weight.medium,
    color: qsColors.textTertiary,
    fontVariant: ["tabular-nums"],
  },
  pnlCol: {
    alignItems: "flex-end",
    gap: 2,
    minWidth: 72,
  },
  pnlValue: {
    fontSize: 13,
    fontWeight: qsTypography.weight.bold,
    fontVariant: ["tabular-nums"],
  },
  pnlPct: {
    fontSize: 11,
    fontWeight: qsTypography.weight.semi,
    fontVariant: ["tabular-nums"],
  },
});
