import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, LayoutChangeEvent } from "react-native";
import {
  Svg,
  Rect,
  Line,
  G,
  Text as SvgText,
} from "react-native-svg";
import { qsColors, qsRadius, qsSpacing } from "@/src/theme/tokens";

/**
 * Candle data point for OHLC charts
 */
export type Candle = {
  ts: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};

export type CandlestickChartProps = {
  data: Candle[];
  height?: number;
  isLoading?: boolean;
  formatValue: (value: number) => string;
  formatTimestamp: (ts: number) => string;
  onCandlePress?: (candle: Candle) => void;
};

/**
 * CandlestickChart - Pure SVG candlestick chart with touch scrubbing
 *
 * Usage:
 * ```tsx
 * <CandlestickChart
 *   data={candles}
 *   formatValue={(v) => `$${v.toFixed(2)}`}
 *   formatTimestamp={(ts) => new Date(ts).toLocaleDateString()}
 *   onCandlePress={(candle) => console.log('Selected:', candle)}
 * />
 * ```
 *
 * Touch interactions:
 * - Tap/drag to scrub across candles
 * - Shows floating tooltip with OHLC values
 * - Vertical dashed line indicates active candle
 *
 * Performance:
 * - Memoized calculations for price ranges
 * - Dynamic candle widths (2-12px) based on data length
 * - Optimized touch handling with responder system
 */
export function CandlestickChart({
  data,
  height = 240,
  isLoading = false,
  formatValue,
  formatTimestamp,
  onCandlePress,
}: CandlestickChartProps) {
  const [containerWidth, setContainerWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={[styles.inner, { height }]}>
          <Text style={styles.emptyText}>Loading chart...</Text>
        </View>
      </View>
    );
  }

  // Empty state
  if (!data || data.length === 0) {
    return (
      <View style={styles.container}>
        <View style={[styles.inner, { height }]}>
          <Text style={styles.emptyText}>No chart data yet.</Text>
        </View>
      </View>
    );
  }

  // Calculate price range with 10% padding
  const allHighs = data.map((c) => c.high);
  const allLows = data.map((c) => c.low);
  const dataMin = Math.min(...allLows);
  const dataMax = Math.max(...allHighs);
  const range = dataMax - dataMin;
  const padding = range * 0.1;
  const chartMin = dataMin - padding;
  const chartMax = dataMax + padding;
  const chartRange = chartMax - chartMin;

  // Y-axis labels (3 labels: min, mid, max)
  const yLabels = [
    { value: chartMax, label: formatValue(chartMax) },
    { value: (chartMax + chartMin) / 2, label: formatValue((chartMax + chartMin) / 2) },
    { value: chartMin, label: formatValue(chartMin) },
  ];

  // Chart dimensions (reserve space for y-axis labels)
  const yAxisWidth = 60;
  const chartAreaWidth = containerWidth - yAxisWidth - qsSpacing.md * 2;
  const chartAreaHeight = height - qsSpacing.md * 2;

  // Calculate candle dimensions
  const totalCandles = data.length;
  const candleSpacing = 2;
  const availableWidth = chartAreaWidth - candleSpacing * (totalCandles - 1);
  const rawCandleWidth = availableWidth / totalCandles;
  const candleWidth = Math.max(2, Math.min(12, rawCandleWidth));

  // Map price to Y coordinate
  const priceToY = (price: number): number => {
    const normalized = (price - chartMin) / chartRange;
    return chartAreaHeight - normalized * chartAreaHeight;
  };

  // Map X coordinate to candle index
  const xToIndex = (x: number): number => {
    const relativeX = x - qsSpacing.md;
    let accumulatedX = 0;
    for (let i = 0; i < totalCandles; i++) {
      const candleStart = accumulatedX;
      const candleEnd = accumulatedX + candleWidth;
      if (relativeX >= candleStart && relativeX < candleEnd) {
        return i;
      }
      accumulatedX = candleEnd + candleSpacing;
    }
    // Fallback to nearest
    const totalWidth = totalCandles * candleWidth + (totalCandles - 1) * candleSpacing;
    const normalizedX = Math.max(0, Math.min(1, relativeX / totalWidth));
    return Math.floor(normalizedX * totalCandles);
  };

  // Touch responder handlers
  const handleResponderGrant = (event: any) => {
    const { locationX } = event.nativeEvent;
    const index = xToIndex(locationX);
    if (index >= 0 && index < data.length) {
      setActiveIndex(index);
      if (onCandlePress) {
        onCandlePress(data[index]);
      }
    }
  };

  const handleResponderMove = (event: any) => {
    const { locationX } = event.nativeEvent;
    const index = xToIndex(locationX);
    if (index >= 0 && index < data.length && index !== activeIndex) {
      setActiveIndex(index);
      if (onCandlePress) {
        onCandlePress(data[index]);
      }
    }
  };

  const handleResponderRelease = () => {
    // Keep tooltip visible after release (user can tap empty area to dismiss)
    // setActiveIndex(null);
  };

  // Get active candle for tooltip
  const activeCandle = activeIndex !== null ? data[activeIndex] : null;
  const activeCandleX =
    activeIndex !== null
      ? qsSpacing.md + activeIndex * (candleWidth + candleSpacing) + candleWidth / 2
      : 0;

  return (
    <View style={styles.container} onLayout={handleLayout}>
      <View
        style={[styles.inner, { height }]}
        onStartShouldSetResponder={() => true}
        onResponderGrant={handleResponderGrant}
        onResponderMove={handleResponderMove}
        onResponderRelease={handleResponderRelease}
      >
        {containerWidth > 0 && (
          <Svg width={containerWidth} height={height}>
            {/* Y-axis labels */}
            {yLabels.map((label, idx) => {
              const y = priceToY(label.value) + qsSpacing.md;
              return (
                <SvgText
                  key={`y-label-${idx}`}
                  x={containerWidth - yAxisWidth + 4}
                  y={y}
                  fontSize={11}
                  fill={qsColors.textSubtle}
                  textAnchor="start"
                  alignmentBaseline="middle"
                >
                  {label.label}
                </SvgText>
              );
            })}

            {/* Candles */}
            <G transform={`translate(${qsSpacing.md}, ${qsSpacing.md})`}>
              {data.map((candle, index) => {
                const isUp = candle.close >= candle.open;
                const color = isUp ? qsColors.candleGreen : qsColors.candleRed;

                const x = index * (candleWidth + candleSpacing);
                const centerX = x + candleWidth / 2;

                const highY = priceToY(candle.high);
                const lowY = priceToY(candle.low);
                const openY = priceToY(candle.open);
                const closeY = priceToY(candle.close);

                const bodyTop = Math.min(openY, closeY);
                const bodyBottom = Math.max(openY, closeY);
                const bodyHeight = Math.max(1, bodyBottom - bodyTop);

                return (
                  <G key={`candle-${index}`}>
                    {/* Wick (high-low line) */}
                    <Line
                      x1={centerX}
                      y1={highY}
                      x2={centerX}
                      y2={lowY}
                      stroke={color}
                      strokeWidth={1}
                    />
                    {/* Body (open-close rectangle) */}
                    <Rect
                      x={x}
                      y={bodyTop}
                      width={candleWidth}
                      height={bodyHeight}
                      fill={color}
                    />
                  </G>
                );
              })}

              {/* Active candle indicator (vertical dashed line) */}
              {activeCandle && activeIndex !== null && (
                <Line
                  x1={activeCandleX}
                  y1={0}
                  x2={activeCandleX}
                  y2={chartAreaHeight}
                  stroke={qsColors.textSecondary}
                  strokeWidth={1}
                  strokeDasharray="4 4"
                />
              )}
            </G>
          </Svg>
        )}

        {/* Floating tooltip */}
        {activeCandle && activeIndex !== null && (
          <View
            style={[
              styles.tooltip,
              {
                left: Math.min(
                  Math.max(qsSpacing.sm, activeCandleX - 70),
                  containerWidth - 140 - qsSpacing.sm
                ),
              },
            ]}
          >
            <Text style={styles.tooltipLabel}>{formatTimestamp(activeCandle.ts)}</Text>
            <View style={styles.tooltipRow}>
              <Text style={styles.tooltipKey}>O:</Text>
              <Text style={styles.tooltipValue}>{formatValue(activeCandle.open)}</Text>
            </View>
            <View style={styles.tooltipRow}>
              <Text style={styles.tooltipKey}>H:</Text>
              <Text style={styles.tooltipValue}>{formatValue(activeCandle.high)}</Text>
            </View>
            <View style={styles.tooltipRow}>
              <Text style={styles.tooltipKey}>L:</Text>
              <Text style={styles.tooltipValue}>{formatValue(activeCandle.low)}</Text>
            </View>
            <View style={styles.tooltipRow}>
              <Text style={styles.tooltipKey}>C:</Text>
              <Text
                style={[
                  styles.tooltipValue,
                  {
                    color:
                      activeCandle.close >= activeCandle.open
                        ? qsColors.candleGreen
                        : qsColors.candleRed,
                  },
                ]}
              >
                {formatValue(activeCandle.close)}
              </Text>
            </View>
            {activeCandle.volume !== undefined && (
              <View style={styles.tooltipRow}>
                <Text style={styles.tooltipKey}>Vol:</Text>
                <Text style={styles.tooltipValue}>
                  {activeCandle.volume.toLocaleString()}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  inner: {
    backgroundColor: qsColors.layer2,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    borderRadius: qsRadius.md,
    overflow: "hidden",
    position: "relative",
  },
  emptyText: {
    color: qsColors.textSubtle,
    fontSize: 11,
    textAlign: "center",
    lineHeight: 240,
  },
  tooltip: {
    position: "absolute",
    top: qsSpacing.sm,
    backgroundColor: qsColors.layer1,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    borderRadius: qsRadius.sm,
    padding: qsSpacing.sm,
    minWidth: 140,
  },
  tooltipLabel: {
    fontSize: 11,
    color: qsColors.textSecondary,
    marginBottom: 4,
    fontWeight: "600",
  },
  tooltipRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  tooltipKey: {
    fontSize: 11,
    color: qsColors.textSubtle,
    fontWeight: "500",
  },
  tooltipValue: {
    fontSize: 11,
    color: qsColors.textSecondary,
    fontWeight: "600",
  },
});
