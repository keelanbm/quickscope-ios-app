import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { LayoutChangeEvent, ScrollView, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Line, Path } from "react-native-svg";
import { GestureDetector } from "react-native-gesture-handler";

import { qsColors, qsRadius, qsSpacing } from "@/src/theme/tokens";
import { useCandleLayout } from "@/src/ui/chart/useCandleLayout";
import { useChartGestures } from "@/src/ui/chart/useChartGestures";
import { AnimatedCandle } from "@/src/ui/chart/AnimatedCandle";
import { ChartTooltip } from "@/src/ui/chart/ChartTooltip";
import { SignalMarker } from "@/src/ui/chart/SignalMarker";
import { LivePriceLine } from "@/src/ui/chart/LivePriceLine";
import { LiveCandleGlow } from "@/src/ui/chart/LiveCandleGlow";
import { LiveBreathingDot } from "@/src/ui/chart/LiveBreathingDot";
import { VolumeOverlay } from "@/src/ui/chart/VolumeOverlay";
import { LiveIndicator } from "@/src/ui/LiveIndicator";

// Re-export types from shared module for backwards compat
export type { TokenChartPoint, TokenCandlePoint, ChartSignal } from "@/src/ui/chart/chartTypes";
import type { TokenChartPoint, TokenCandlePoint, ChartSignal } from "@/src/ui/chart/chartTypes";

type TokenChartProps = {
  data: TokenChartPoint[];
  candleData?: TokenCandlePoint[];
  chartType?: "line" | "candle";
  height?: number;
  isLive?: boolean;
  isLoading?: boolean;
  signals?: ChartSignal[];
  visibleSignalTypes?: Set<string>;
  onSignalTap?: (signal: ChartSignal) => void;
  formatValue: (value: number) => string;
  formatTimestamp: (timestampSeconds: number) => string;
};

type ChartPoint = {
  x: number;
  y: number;
  ts: number;
  value: number;
};

const chartFill = "rgba(78, 163, 255, 0.18)";
const chartStroke = qsColors.accent;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function TokenChart({
  data,
  candleData,
  chartType = "line",
  height = 160,
  isLive = false,
  isLoading = false,
  signals,
  visibleSignalTypes,
  onSignalTap,
  formatValue,
  formatTimestamp,
}: TokenChartProps) {
  const [layoutWidth, setLayoutWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [isScrubActive, setIsScrubActive] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const showCandles = chartType === "candle" && candleData && candleData.length > 0;

  const chartData = useMemo(() => {
    return (data ?? []).filter((point) => Number.isFinite(point.value) && point.ts > 0);
  }, [data]);

  const filteredCandles = useMemo(() => {
    if (!candleData) return [];
    return candleData.filter((c) => c.ts > 0 && Number.isFinite(c.close));
  }, [candleData]);

  /* ── Dynamic candle layout ── */
  const candleLayout = useCandleLayout(filteredCandles.length, layoutWidth);

  /* ── Line chart points ── */
  const points = useMemo<ChartPoint[]>(() => {
    if (!layoutWidth || chartData.length === 0) {
      return [];
    }

    const values = chartData.map((point) => point.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const range = maxValue - minValue || 1;
    const padding = range * 0.12;
    const paddedMin = minValue - padding;
    const paddedMax = maxValue + padding;
    const span = paddedMax - paddedMin || 1;
    const lastIndex = chartData.length - 1;

    return chartData.map((point, index) => {
      const x = lastIndex === 0 ? layoutWidth / 2 : (layoutWidth * index) / lastIndex;
      const normalized = (point.value - paddedMin) / span;
      const y = height - normalized * height;
      return {
        x,
        y,
        ts: point.ts,
        value: point.value,
      };
    });
  }, [chartData, height, layoutWidth]);

  /* ── Candle chart computed values ── */
  const candleRender = useMemo(() => {
    if (filteredCandles.length === 0) return [];

    const { candleWidth, gap } = candleLayout;
    const allValues = filteredCandles.flatMap((c) => [c.open, c.high, c.low, c.close]);
    const minValue = Math.min(...allValues);
    const maxValue = Math.max(...allValues);
    const range = maxValue - minValue || 1;
    const padding = range * 0.12;
    const paddedMin = minValue - padding;
    const span = (maxValue + padding) - paddedMin || 1;

    return filteredCandles.map((candle, index) => {
      const x = index * (candleWidth + gap);
      const centerX = x + candleWidth / 2;

      const toY = (val: number) => height - ((val - paddedMin) / span) * height;

      const openY = toY(candle.open);
      const closeY = toY(candle.close);
      const highY = toY(candle.high);
      const lowY = toY(candle.low);

      const isGreen = candle.close >= candle.open;
      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.max(1, Math.abs(closeY - openY));

      return {
        index,
        x,
        centerX,
        highY,
        lowY,
        bodyTop,
        bodyHeight,
        isGreen,
        ts: candle.ts,
        close: candle.close,
        volume: candle.volume,
      };
    });
  }, [filteredCandles, height, candleLayout]);

  useEffect(() => {
    if (showCandles) {
      if (candleRender.length > 0 && activeIndex === null) {
        setActiveIndex(candleRender.length - 1);
      }
    } else {
      if (points.length > 0 && activeIndex === null) {
        setActiveIndex(points.length - 1);
      }
    }
  }, [activeIndex, points.length, candleRender.length, showCandles]);

  // Reset active index when chart type changes
  useEffect(() => {
    setActiveIndex(null);
  }, [chartType]);

  // Auto-scroll to the end when candle data loads (only when scrollable)
  useEffect(() => {
    if (showCandles && candleLayout.scrollable && scrollRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: false });
      }, 50);
    }
  }, [showCandles, candleLayout.scrollable, candleLayout.svgWidth, layoutWidth]);

  const linePath = useMemo(() => {
    if (points.length === 0) {
      return "";
    }

    return points
      .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
      .join(" ");
  }, [points]);

  const areaPath = useMemo(() => {
    if (points.length === 0) {
      return "";
    }

    const first = points[0];
    const last = points[points.length - 1];
    return `${linePath} L ${last.x} ${height} L ${first.x} ${height} Z`;
  }, [height, linePath, points]);

  const activePoint = useMemo(() => {
    if (activeIndex === null) return null;

    if (showCandles && candleRender.length > 0) {
      const c = candleRender[clamp(activeIndex, 0, candleRender.length - 1)];
      return { x: c.centerX, y: c.bodyTop, ts: c.ts, value: c.close };
    }

    if (points.length === 0) return null;
    return points[clamp(activeIndex, 0, points.length - 1)];
  }, [activeIndex, points, candleRender, showCandles]);

  /* ── Live price Y for horizontal price line ── */
  const livePriceY = useMemo(() => {
    if (!isLive) return null;

    if (showCandles && candleRender.length > 0) {
      const lastCandle = candleRender[candleRender.length - 1];
      // Compute Y from close price using same scale as candleRender
      return lastCandle.bodyTop + (lastCandle.isGreen ? 0 : lastCandle.bodyHeight);
    }

    if (points.length > 0) {
      return points[points.length - 1].y;
    }

    return null;
  }, [isLive, showCandles, candleRender, points]);

  /* ── Active candle + previous candle for enhanced tooltip ── */
  const activeCandle = useMemo(() => {
    if (!showCandles || activeIndex === null || filteredCandles.length === 0) return undefined;
    return filteredCandles[clamp(activeIndex, 0, filteredCandles.length - 1)];
  }, [showCandles, activeIndex, filteredCandles]);

  const previousCandle = useMemo(() => {
    if (!showCandles || activeIndex === null || activeIndex <= 0 || filteredCandles.length < 2) return undefined;
    return filteredCandles[clamp(activeIndex - 1, 0, filteredCandles.length - 1)];
  }, [showCandles, activeIndex, filteredCandles]);

  /* ── Signal marker positions ── */
  const signalMarkers = useMemo(() => {
    if (!signals || signals.length === 0 || candleRender.length === 0) return [];

    // Build a timestamp → candle index lookup
    const tsToCandleIndex = new Map<number, number>();
    for (let i = 0; i < candleRender.length; i++) {
      tsToCandleIndex.set(candleRender[i].ts, i);
    }

    // Filter by visible types and match to candle positions
    const filtered = visibleSignalTypes
      ? signals.filter((s) => visibleSignalTypes.has(s.type))
      : signals;

    // Group by candle timestamp for stacking
    const grouped = new Map<number, { signal: ChartSignal; candleIdx: number }[]>();

    for (const signal of filtered) {
      // Exact match first, then find nearest candle
      let candleIdx = tsToCandleIndex.get(signal.ts);
      if (candleIdx === undefined) {
        // Find nearest candle by timestamp
        let minDist = Infinity;
        for (let i = 0; i < candleRender.length; i++) {
          const dist = Math.abs(candleRender[i].ts - signal.ts);
          if (dist < minDist) {
            minDist = dist;
            candleIdx = i;
          }
        }
      }
      if (candleIdx === undefined) continue;

      const key = candleIdx;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push({ signal, candleIdx });
    }

    // Flatten with stack index
    const markers: {
      signal: ChartSignal;
      cx: number;
      baseY: number;
      stackIndex: number;
    }[] = [];

    for (const [, group] of grouped) {
      group.forEach((entry, stackIdx) => {
        const candle = candleRender[entry.candleIdx];
        markers.push({
          signal: entry.signal,
          cx: candle.centerX,
          baseY: Math.min(candle.lowY + 10, height - 6),
          stackIndex: stackIdx,
        });
      });
    }

    return markers;
  }, [signals, visibleSignalTypes, candleRender, height]);

  /* ── Scrub horizontal price line Y ── */
  const scrubPriceY = useMemo(() => {
    if (!isScrubActive || !activePoint) return null;
    return activePoint.y;
  }, [isScrubActive, activePoint]);

  const handleLayout = (event: LayoutChangeEvent) => {
    setLayoutWidth(event.nativeEvent.layout.width);
  };

  /* ── Gesture-driven scrub ── */
  const dataLength = showCandles ? filteredCandles.length : chartData.length;
  const candleStep = showCandles ? candleLayout.candleWidth + candleLayout.gap : 0;

  const onIndexChange = useCallback(
    (index: number) => setActiveIndex(index),
    [],
  );
  const onScrubStart = useCallback(() => setIsScrubActive(true), []);
  const onScrubEnd = useCallback(() => setIsScrubActive(false), []);

  const { gesture } = useChartGestures({
    dataLength,
    layoutWidth,
    candleStep,
    onIndexChange,
    onScrubStart,
    onScrubEnd,
  });

  if (isLoading) {
    return (
      <View style={[styles.chartContainer, { height }]} onLayout={handleLayout}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading chart...</Text>
        </View>
      </View>
    );
  }

  const hasData = showCandles ? filteredCandles.length > 0 : chartData.length > 0;

  if (!hasData) {
    return (
      <View style={[styles.chartContainer, { height }]} onLayout={handleLayout}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>No chart data yet.</Text>
        </View>
      </View>
    );
  }

  /* ── Candle SVG content (shared between scrollable and non-scrollable) ── */
  const lastCandle = candleRender.length > 0 ? candleRender[candleRender.length - 1] : null;

  const renderCandleSvg = () => (
    <Svg width={candleLayout.svgWidth} height={height}>
      {/* Volume bars (behind everything) */}
      <VolumeOverlay
        candles={candleRender}
        candleWidth={candleLayout.candleWidth}
        chartHeight={height}
      />

      {/* Live glow behind last candle */}
      {isLive && lastCandle ? (
        <LiveCandleGlow
          x={lastCandle.x}
          candleWidth={candleLayout.candleWidth}
          chartHeight={height}
        />
      ) : null}

      {candleRender.map((c, i) => (
        <AnimatedCandle
          key={i}
          x={c.x}
          centerX={c.centerX}
          highY={c.highY}
          lowY={c.lowY}
          bodyTop={c.bodyTop}
          bodyHeight={c.bodyHeight}
          isGreen={c.isGreen}
          candleWidth={candleLayout.candleWidth}
        />
      ))}

      {/* Signal markers below candles */}
      {signalMarkers.map((m, i) => (
        <SignalMarker
          key={`sig-${i}`}
          signal={m.signal}
          cx={m.cx}
          baseY={m.baseY}
          stackIndex={m.stackIndex}
          onPress={onSignalTap}
        />
      ))}

      {/* Live price line */}
      {isLive && livePriceY !== null ? (
        <LivePriceLine y={livePriceY} width={candleLayout.svgWidth} />
      ) : null}

      {/* Horizontal price line during scrub */}
      {isScrubActive && scrubPriceY !== null ? (
        <Line
          x1={0}
          x2={candleLayout.svgWidth}
          y1={scrubPriceY}
          y2={scrubPriceY}
          stroke={qsColors.textTertiary}
          strokeWidth={0.5}
          strokeDasharray="4 3"
          strokeOpacity={0.6}
        />
      ) : null}

      {/* Crosshair */}
      {activePoint ? (
        <Line
          x1={activePoint.x}
          y1={0}
          x2={activePoint.x}
          y2={height}
          stroke={qsColors.borderDefault}
          strokeWidth={1}
          strokeDasharray="4 4"
        />
      ) : null}
    </Svg>
  );

  /* ── Candlestick chart ── */
  if (showCandles) {
    const candleContent = candleLayout.scrollable ? (
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEnabled={!isScrubActive}
      >
        {renderCandleSvg()}
      </ScrollView>
    ) : (
      <View>{renderCandleSvg()}</View>
    );

    return (
      <GestureDetector gesture={gesture}>
        <View style={[styles.chartContainer, { height }]} onLayout={handleLayout}>
          {candleContent}

          {/* Scrub price label on right edge */}
          {isScrubActive && scrubPriceY !== null && activePoint ? (
            <View
              style={[
                styles.scrubPriceLabel,
                { top: clamp(scrubPriceY - 10, 0, height - 20) },
              ]}
              pointerEvents="none"
            >
              <Text style={styles.scrubPriceLabelText}>
                {formatValue(activePoint.value)}
              </Text>
            </View>
          ) : null}

          {/* Live indicator badge */}
          {isLive ? (
            <View style={styles.liveBadge}>
              <LiveIndicator />
            </View>
          ) : null}

          {/* Enhanced tooltip */}
          {activePoint ? (
            <View style={[styles.tooltipWrap, { left: 6 }]}>
              <ChartTooltip
                candle={activeCandle}
                previousCandle={previousCandle}
                timestamp={activePoint.ts}
                formatValue={formatValue}
                formatTimestamp={formatTimestamp}
                isCandleMode
              />
            </View>
          ) : null}
        </View>
      </GestureDetector>
    );
  }

  /* ── Line chart (fills container width) ── */
  return (
    <GestureDetector gesture={gesture}>
      <View
        style={[styles.chartContainer, { height }]}
        onLayout={handleLayout}
      >
        <Svg width={layoutWidth} height={height}>
          {areaPath ? <Path d={areaPath} fill={chartFill} /> : null}
          {linePath ? <Path d={linePath} stroke={chartStroke} strokeWidth={2} fill="none" /> : null}

          {/* Live price line */}
          {isLive && livePriceY !== null ? (
            <LivePriceLine y={livePriceY} width={layoutWidth} />
          ) : null}

          {/* Live breathing dot at last point */}
          {isLive && points.length > 0 ? (
            <LiveBreathingDot
              cx={points[points.length - 1].x}
              cy={points[points.length - 1].y}
            />
          ) : null}

          {/* Horizontal price line during scrub */}
          {isScrubActive && scrubPriceY !== null ? (
            <Line
              x1={0}
              x2={layoutWidth}
              y1={scrubPriceY}
              y2={scrubPriceY}
              stroke={qsColors.textTertiary}
              strokeWidth={0.5}
              strokeDasharray="4 3"
              strokeOpacity={0.6}
            />
          ) : null}

          {/* Crosshair */}
          {activePoint ? (
            <>
              <Line
                x1={activePoint.x}
                y1={0}
                x2={activePoint.x}
                y2={height}
                stroke={qsColors.borderDefault}
                strokeWidth={1}
                strokeDasharray="4 4"
              />
              <Circle
                cx={activePoint.x}
                cy={activePoint.y}
                r={4}
                fill={chartStroke}
                stroke={qsColors.layer0}
                strokeWidth={2}
              />
            </>
          ) : null}
        </Svg>

        {/* Scrub price label on right edge */}
        {isScrubActive && scrubPriceY !== null && activePoint ? (
          <View
            style={[
              styles.scrubPriceLabel,
              { top: clamp(scrubPriceY - 10, 0, height - 20) },
            ]}
            pointerEvents="none"
          >
            <Text style={styles.scrubPriceLabelText}>
              {formatValue(activePoint.value)}
            </Text>
          </View>
        ) : null}

        {/* Live indicator badge */}
        {isLive ? (
          <View style={styles.liveBadge}>
            <LiveIndicator />
          </View>
        ) : null}

        {/* Enhanced tooltip */}
        {activePoint ? (
          <View
            style={[
              styles.tooltipWrap,
              {
                left: clamp(activePoint.x - 40, 6, Math.max(6, layoutWidth - 100)),
              },
            ]}
          >
            <ChartTooltip
              value={activePoint.value}
              timestamp={activePoint.ts}
              formatValue={formatValue}
              formatTimestamp={formatTimestamp}
              isCandleMode={false}
            />
          </View>
        ) : null}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  chartContainer: {
    borderRadius: qsRadius.md,
    backgroundColor: qsColors.layer2,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    overflow: "hidden",
    justifyContent: "center",
  },
  loading: {
    alignItems: "center",
    justifyContent: "center",
    padding: qsSpacing.md,
  },
  loadingText: {
    color: qsColors.textSubtle,
    fontSize: 12,
  },
  tooltipWrap: {
    position: "absolute",
    top: qsSpacing.sm,
  },
  scrubPriceLabel: {
    position: "absolute",
    right: qsSpacing.xs,
    backgroundColor: qsColors.layer3,
    borderRadius: qsRadius.xs,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  scrubPriceLabelText: {
    color: qsColors.textSecondary,
    fontSize: 9,
    fontWeight: "500",
    fontVariant: ["tabular-nums"],
  },
  liveBadge: {
    position: "absolute",
    top: qsSpacing.sm,
    right: qsSpacing.sm,
  },
});
