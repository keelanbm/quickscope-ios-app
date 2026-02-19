/**
 * Compact holdings bar for Token Detail screen.
 *
 * Single row: Balance | Total PnL | PnL %
 * No title, no card wrapper — just a thin bar.
 */
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { qsColors, qsRadius, qsSpacing, qsTypography } from "@/src/theme/tokens";
import { formatSol, formatPercent } from "./styles";

type TokenDetailHoldingsProps = {
  hasWallet: boolean;
  balance: number | undefined;
  totalPnl: number | undefined;
  /** Already multiplied by 100 (percentage, not fraction). */
  pnlPercent: number | undefined;
  positionError: string | null;
};

export function TokenDetailHoldings({
  hasWallet,
  balance,
  totalPnl,
  pnlPercent,
  positionError,
}: TokenDetailHoldingsProps) {
  if (!hasWallet) return null;

  return (
    <View style={styles.bar}>
      <View style={styles.stat}>
        <Text style={styles.label}>Balance</Text>
        <Text style={styles.value}>
          {positionError ? "--" : formatSol(balance)}
        </Text>
      </View>

      <View style={styles.stat}>
        <Text style={styles.label}>Total PnL</Text>
        <Text
          style={[
            styles.value,
            totalPnl !== undefined && totalPnl >= 0 ? styles.positive : null,
            totalPnl !== undefined && totalPnl < 0 ? styles.negative : null,
          ]}
        >
          {positionError ? "--" : formatSol(totalPnl)}
        </Text>
      </View>

      <View style={styles.stat}>
        <Text style={styles.label}>PnL %</Text>
        <Text
          style={[
            styles.value,
            pnlPercent !== undefined && pnlPercent >= 0 ? styles.positive : null,
            pnlPercent !== undefined && pnlPercent < 0 ? styles.negative : null,
          ]}
        >
          {positionError ? "--" : formatPercent(pnlPercent)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    marginHorizontal: qsSpacing.lg,
    marginBottom: qsSpacing.md,
    backgroundColor: qsColors.layer1,
    borderRadius: qsRadius.md,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    paddingHorizontal: qsSpacing.md,
    paddingVertical: qsSpacing.sm,
    gap: qsSpacing.sm,
  },
  stat: {
    flex: 1,
    gap: 2,
  },
  label: {
    color: qsColors.textTertiary,
    fontSize: 10,
  },
  value: {
    color: qsColors.textSecondary,
    fontSize: 13,
    fontWeight: qsTypography.weight.semi,
  },
  positive: {
    color: qsColors.buyGreen,
  },
  negative: {
    color: qsColors.sellRed,
  },
});
