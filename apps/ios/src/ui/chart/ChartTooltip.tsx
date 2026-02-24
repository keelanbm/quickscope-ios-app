/**
 * ChartTooltip — enhanced OHLC tooltip for chart scrub mode.
 *
 * Shows timestamp header, O/H/L/C grid for candle mode,
 * delta from previous candle (colored green/red), and optional volume.
 * Falls back to simple value + time for line charts.
 */
import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { qsColors, qsRadius, qsSpacing } from "@/src/theme/tokens";
import type { TokenCandlePoint } from "@/src/ui/chart/chartTypes";

type ChartTooltipProps = {
  /** Current value for line charts */
  value?: number;
  /** Current candle data */
  candle?: TokenCandlePoint;
  /** Previous candle for delta calculation */
  previousCandle?: TokenCandlePoint;
  /** Timestamp in seconds */
  timestamp: number;
  /** Format function for values (e.g., "$0.00123") */
  formatValue: (value: number) => string;
  /** Format function for timestamps */
  formatTimestamp: (ts: number) => string;
  /** Whether candle mode */
  isCandleMode: boolean;
};

function formatDelta(current: number, previous: number): { text: string; color: string } {
  const diff = current - previous;
  const pct = previous !== 0 ? (diff / previous) * 100 : 0;
  const sign = diff >= 0 ? "+" : "";
  return {
    text: `${sign}${pct.toFixed(2)}%`,
    color: diff >= 0 ? qsColors.buyGreen : qsColors.sellRed,
  };
}

export function ChartTooltip({
  value,
  candle,
  previousCandle,
  timestamp,
  formatValue,
  formatTimestamp,
  isCandleMode,
}: ChartTooltipProps) {
  const delta = useMemo(() => {
    if (!isCandleMode || !candle || !previousCandle) return null;
    return formatDelta(candle.close, previousCandle.close);
  }, [isCandleMode, candle, previousCandle]);

  // Line chart — simple tooltip
  if (!isCandleMode || !candle) {
    return (
      <View style={styles.container}>
        <Text style={styles.value}>{formatValue(value ?? 0)}</Text>
        <Text style={styles.time}>{formatTimestamp(timestamp)}</Text>
      </View>
    );
  }

  // Candle chart — OHLC grid
  return (
    <View style={styles.container}>
      <Text style={styles.time}>{formatTimestamp(timestamp)}</Text>

      <View style={styles.ohlcGrid}>
        <View style={styles.ohlcRow}>
          <Text style={styles.ohlcLabel}>O</Text>
          <Text style={styles.ohlcValue}>{formatValue(candle.open)}</Text>
        </View>
        <View style={styles.ohlcRow}>
          <Text style={styles.ohlcLabel}>H</Text>
          <Text style={styles.ohlcValue}>{formatValue(candle.high)}</Text>
        </View>
        <View style={styles.ohlcRow}>
          <Text style={styles.ohlcLabel}>L</Text>
          <Text style={styles.ohlcValue}>{formatValue(candle.low)}</Text>
        </View>
        <View style={styles.ohlcRow}>
          <Text style={styles.ohlcLabel}>C</Text>
          <Text style={styles.ohlcValue}>{formatValue(candle.close)}</Text>
        </View>
      </View>

      {delta ? (
        <Text style={[styles.delta, { color: delta.color }]}>{delta.text}</Text>
      ) : null}

      {candle.volume != null && candle.volume > 0 ? (
        <Text style={styles.volume}>Vol {formatCompactNumber(candle.volume)}</Text>
      ) : null}
    </View>
  );
}

function formatCompactNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(0);
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: qsColors.layer1,
    borderRadius: qsRadius.sm,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    paddingHorizontal: qsSpacing.sm,
    paddingVertical: 6,
    gap: 3,
    minWidth: 80,
  },
  value: {
    color: qsColors.textPrimary,
    fontSize: 12,
    fontWeight: "600",
  },
  time: {
    color: qsColors.textSubtle,
    fontSize: 10,
  },
  ohlcGrid: {
    gap: 1,
  },
  ohlcRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: qsSpacing.sm,
  },
  ohlcLabel: {
    color: qsColors.textTertiary,
    fontSize: 10,
    fontWeight: "600",
    width: 12,
  },
  ohlcValue: {
    color: qsColors.textPrimary,
    fontSize: 10,
    fontWeight: "500",
    fontVariant: ["tabular-nums"],
  },
  delta: {
    fontSize: 10,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  volume: {
    color: qsColors.textSubtle,
    fontSize: 9,
    fontVariant: ["tabular-nums"],
  },
});
