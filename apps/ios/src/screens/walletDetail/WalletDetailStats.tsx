/**
 * Stats row for wallet detail — 2x2 grid of stat cards.
 * Balance, Total PnL, Volume, Win Rate.
 */
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { qsColors, qsRadius, qsSpacing, qsTypography } from "@/src/theme/tokens";
import { formatCompactUsd, formatPercent } from "@/src/lib/format";

type WalletDetailStatsProps = {
  balanceUsd: number | undefined;
  totalPnlUsd: number | undefined;
  volumeUsd: number | undefined;
  winRatePercent: number | undefined;
};

export function WalletDetailStats({
  balanceUsd,
  totalPnlUsd,
  volumeUsd,
  winRatePercent,
}: WalletDetailStatsProps) {
  const pnlColor =
    totalPnlUsd === undefined
      ? qsColors.textSecondary
      : totalPnlUsd >= 0
        ? qsColors.buyGreen
        : qsColors.sellRed;

  const pnlText =
    totalPnlUsd === undefined
      ? "--"
      : `${totalPnlUsd >= 0 ? "+" : ""}${formatCompactUsd(Math.abs(totalPnlUsd))}`;

  const stats = [
    { label: "Balance", value: formatCompactUsd(balanceUsd), color: qsColors.textPrimary },
    { label: "Total PnL", value: pnlText, color: pnlColor },
    { label: "Volume", value: formatCompactUsd(volumeUsd), color: qsColors.textPrimary },
    {
      label: "Win Rate",
      value: winRatePercent !== undefined ? formatPercent(winRatePercent) : "--",
      color: qsColors.textPrimary,
    },
  ];

  return (
    <View style={styles.row}>
      {stats.map((stat) => (
        <View key={stat.label} style={styles.card}>
          <Text style={styles.label}>{stat.label}</Text>
          <Text style={[styles.value, { color: stat.color }]}>{stat.value}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: qsSpacing.sm,
    paddingHorizontal: qsSpacing.lg,
  },
  card: {
    width: "48%",
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    borderRadius: qsRadius.md,
    backgroundColor: qsColors.layer1,
    padding: qsSpacing.sm,
    gap: 4,
  },
  label: {
    color: qsColors.textSubtle,
    fontSize: 11,
    fontWeight: qsTypography.weight.medium,
  },
  value: {
    fontSize: 16,
    fontWeight: qsTypography.weight.bold,
    fontVariant: ["tabular-nums"],
  },
});
