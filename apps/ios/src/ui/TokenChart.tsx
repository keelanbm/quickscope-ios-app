import React, { useEffect, useMemo, useRef, useState } from "react";

import { LayoutChangeEvent, ScrollView, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Line, Path } from "react-native-svg";

import { qsColors, qsRadius, qsSpacing } from "@/src/theme/tokens";
import { useCandleLayout } from "@/src/ui/chart/useCandleLayout";
import { AnimatedCandle } from "@/src/ui/chart/AnimatedCandle";
import { LivePriceLine } from "@/src/ui/chart/LivePriceLine";
import { LiveCandleGlow } from "@/src/ui/chart/LiveCandleGlow";
import { LiveBreathingDot } from "@/src/ui/chart/LiveBreathingDot";
import { LiveIndicator } from "@/src/ui/LiveIndicator";

// Re-export types from shared module for backwards compat
export type { TokenChartPoint, TokenCandlePoint } from "@/src/ui/chart/chartTypes";
import type { TokenChartPoint, TokenCandlePoint } from "@/src/ui/chart/chartTypes";

type TokenChartProps = {
  data: TokenChartPoint[];
  candleData?: TokenCandlePoint[];
  chartType?: "line" | "candle";
  height?: number;
  isLive?: boolean;
  isLoading?: boolean;
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
  formatValue,
  formatTimestamp,
}: TokenChartProps) {
  const [layoutWidth, setLayoutWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
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
        x,
        centerX,
        highY,
        lowY,
        bodyTop,
        bodyHeight,
        isGreen,
        ts: candle.ts,
        close: candle.close,
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

  const handleLayout = (event: LayoutChangeEvent) => {
    setLayoutWidth(event.nativeEvent.layout.width);
  };

  const updateActiveIndex = (xPosition: number) => {
    if (showCandles && candleRender.length > 0) {
      const step = candleLayout.candleWidth + candleLayout.gap;
      const nextIndex = Math.round(xPosition / step);
      setActiveIndex(clamp(nextIndex, 0, candleRender.length - 1));
    } else if (layoutWidth > 0 && points.length > 0) {
      const nextIndex = Math.round((xPosition / layoutWidth) * (points.length - 1));
      setActiveIndex(clamp(nextIndex, 0, points.length - 1));
    }
  };

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

      {/* Live price line */}
      {isLive && livePriceY !== null ? (
        <LivePriceLine y={livePriceY} width={candleLayout.svgWidth} />
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
        onStartShouldSetResponder={() => true}
        onResponderGrant={(event) => updateActiveIndex(event.nativeEvent.locationX)}
        onResponderMove={(event) => updateActiveIndex(event.nativeEvent.locationX)}
      >
        {renderCandleSvg()}
      </ScrollView>
    ) : (
      <View
        onStartShouldSetResponder={() => true}
        onResponderGrant={(event) => updateActiveIndex(event.nativeEvent.locationX)}
        onResponderMove={(event) => updateActiveIndex(event.nativeEvent.locationX)}
      >
        {renderCandleSvg()}
      </View>
    );

    return (
      <View style={[styles.chartContainer, { height }]} onLayout={handleLayout}>
        {candleContent}

        {/* Live indicator badge */}
        {isLive ? (
          <View style={styles.liveBadge}>
            <LiveIndicator />
          </View>
        ) : null}

        {/* Tooltip — positioned relative to outer container */}
        {activePoint ? (
          <View style={[styles.tooltip, { left: 6 }]}>
            <Text style={styles.tooltipValue}>{formatValue(activePoint.value)}</Text>
            <Text style={styles.tooltipTime}>{formatTimestamp(activePoint.ts)}</Text>
          </View>
        ) : null}
      </View>
    );
  }

  /* ── Line chart (fills container width) ── */
  return (
    <View
      style={[styles.chartContainer, { height }]}
      onLayout={handleLayout}
      onStartShouldSetResponder={() => true}
      onResponderGrant={(event) => updateActiveIndex(event.nativeEvent.locationX)}
      onResponderMove={(event) => updateActiveIndex(event.nativeEvent.locationX)}
      onResponderRelease={() => {
        if (activeIndex === null) {
          if (points.length > 0) setActiveIndex(points.length - 1);
        }
      }}
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

      {/* Live indicator badge */}
      {isLive ? (
        <View style={styles.liveBadge}>
          <LiveIndicator />
        </View>
      ) : null}

      {activePoint ? (
        <View
          style={[
            styles.tooltip,
            {
              left: clamp(activePoint.x - 70, 6, Math.max(6, layoutWidth - 140)),
            },
          ]}
        >
          <Text style={styles.tooltipValue}>{formatValue(activePoint.value)}</Text>
          <Text style={styles.tooltipTime}>{formatTimestamp(activePoint.ts)}</Text>
        </View>
      ) : null}
    </View>
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
  tooltip: {
    position: "absolute",
    top: qsSpacing.sm,
    backgroundColor: qsColors.layer1,
    borderRadius: qsRadius.sm,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    paddingHorizontal: qsSpacing.sm,
    paddingVertical: 6,
    gap: 2,
  },
  tooltipValue: {
    color: qsColors.textPrimary,
    fontSize: 12,
    fontWeight: "600",
  },
  tooltipTime: {
    color: qsColors.textSubtle,
    fontSize: 11,
  },
  liveBadge: {
    position: "absolute",
    top: qsSpacing.sm,
    right: qsSpacing.sm,
  },
});
