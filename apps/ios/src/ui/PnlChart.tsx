import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Polyline, Line, Defs, LinearGradient, Stop, Rect } from "react-native-svg";

import { formatSignedUsd } from "@/src/lib/format";
import type { PnlDataPoint } from "@/src/features/portfolio/portfolioService";
import { qsColors, qsRadius, qsSpacing, qsTypography } from "@/src/theme/tokens";

type PnlChartProps = {
  data: PnlDataPoint[];
  width: number;
  height?: number;
};

const CHART_HEIGHT = 120;
const PADDING_X = 8;
const PADDING_Y = 12;

export function PnlChart({ data, width, height = CHART_HEIGHT }: PnlChartProps) {
  const chartWidth = width - PADDING_X * 2;
  const chartHeight = height - PADDING_Y * 2;

  const { points, zeroY, finalPnl, isPositive } = useMemo(() => {
    if (data.length === 0) {
      return { points: "", zeroY: height / 2, finalPnl: 0, isPositive: true };
    }

    const pnlValues = data.map((d) => d.pnl);
    const minPnl = Math.min(0, ...pnlValues);
    const maxPnl = Math.max(0, ...pnlValues);
    const range = maxPnl - minPnl || 1;

    const toY = (pnl: number) =>
      PADDING_Y + chartHeight - ((pnl - minPnl) / range) * chartHeight;
    const toX = (i: number) =>
      PADDING_X + (i / Math.max(data.length - 1, 1)) * chartWidth;

    const pts = data.map((d, i) => `${toX(i)},${toY(d.pnl)}`).join(" ");
    const last = data[data.length - 1].pnl;

    return {
      points: pts,
      zeroY: toY(0),
      finalPnl: last,
      isPositive: last >= 0,
    };
  }, [data, chartWidth, chartHeight, height]);

  if (data.length < 2) {
    return (
      <View style={[styles.container, { height }]}>
        <Text style={styles.emptyText}>Not enough data for chart</Text>
      </View>
    );
  }

  const lineColor = isPositive ? qsColors.success : qsColors.danger;

  return (
    <View style={[styles.container, { height: height + 32 }]}>
      <Text style={[styles.label, { color: lineColor }]}>
        Cumulative P&L: {formatSignedUsd(finalPnl || undefined)}
      </Text>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={lineColor} stopOpacity="0.15" />
            <Stop offset="1" stopColor={lineColor} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={width} height={height} fill="url(#bg)" rx={qsRadius.md} />
        <Line
          x1={PADDING_X}
          y1={zeroY}
          x2={width - PADDING_X}
          y2={zeroY}
          stroke={qsColors.borderDefault}
          strokeWidth={1}
          strokeDasharray="4,4"
        />
        <Polyline
          points={points}
          fill="none"
          stroke={lineColor}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    borderRadius: qsRadius.md,
    backgroundColor: qsColors.layer1,
    overflow: "hidden",
  },
  label: {
    fontSize: qsTypography.size.xxs,
    fontWeight: qsTypography.weight.bold,
    padding: qsSpacing.sm,
    fontVariant: ["tabular-nums"],
  },
  emptyText: {
    color: qsColors.textSubtle,
    fontSize: qsTypography.size.xxs,
    textAlign: "center",
    paddingVertical: qsSpacing.xl,
  },
});
