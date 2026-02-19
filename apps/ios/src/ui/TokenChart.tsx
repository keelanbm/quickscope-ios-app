import { useEffect, useMemo, useState } from "react";

import { LayoutChangeEvent, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, G, Line, Path, Rect } from "react-native-svg";

import { qsColors, qsRadius, qsSpacing } from "@/src/theme/tokens";

export type TokenChartPoint = {
  ts: number;
  value: number;
};

export type TokenChartCandle = {
  ts: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

type TokenChartProps = {
  data: TokenChartPoint[];
  candles?: TokenChartCandle[];
  height?: number;
  isLoading?: boolean;
  variant?: "line" | "candle";
  formatValue: (value: number) => string;
  formatTimestamp: (timestampSeconds: number) => string;
};

type ChartPoint = {
  x: number;
  y: number;
  ts: number;
  value: number;
};

type CandlePoint = {
  x: number;
  bodyWidth: number;
  openY: number;
  closeY: number;
  highY: number;
  lowY: number;
  ts: number;
  open: number;
  high: number;
  low: number;
  close: number;
  color: string;
};

const chartFill = "rgba(78, 163, 255, 0.18)";
const chartStroke = qsColors.accent;
const candleUp = qsColors.success;
const candleDown = qsColors.danger;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function TokenChart({
  data,
  candles,
  height = 160,
  isLoading = false,
  variant = "line",
  formatValue,
  formatTimestamp,
}: TokenChartProps) {
  const [layoutWidth, setLayoutWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const chartData = useMemo(() => {
    return (data ?? []).filter((point) => Number.isFinite(point.value) && point.ts > 0);
  }, [data]);

  const candleData = useMemo(() => {
    return (candles ?? []).filter(
      (point) =>
        Number.isFinite(point.open) &&
        Number.isFinite(point.high) &&
        Number.isFinite(point.low) &&
        Number.isFinite(point.close) &&
        point.ts > 0
    );
  }, [candles]);

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

  const candlePoints = useMemo<CandlePoint[]>(() => {
    if (!layoutWidth || candleData.length === 0) {
      return [];
    }

    const highs = candleData.map((point) => point.high);
    const lows = candleData.map((point) => point.low);
    const minValue = Math.min(...lows);
    const maxValue = Math.max(...highs);
    const range = maxValue - minValue || 1;
    const padding = range * 0.12;
    const paddedMin = minValue - padding;
    const paddedMax = maxValue + padding;
    const span = paddedMax - paddedMin || 1;
    const count = candleData.length;
    const bandWidth = layoutWidth / count;
    const bodyWidth = Math.max(3, bandWidth * 0.6);

    return candleData.map((point, index) => {
      const x = bandWidth * index + bandWidth / 2;
      const toY = (value: number) =>
        height - ((value - paddedMin) / span) * height;
      const openY = toY(point.open);
      const closeY = toY(point.close);
      const highY = toY(point.high);
      const lowY = toY(point.low);
      const color = point.close >= point.open ? candleUp : candleDown;

      return {
        x,
        bodyWidth,
        openY,
        closeY,
        highY,
        lowY,
        ts: point.ts,
        open: point.open,
        high: point.high,
        low: point.low,
        close: point.close,
        color,
      };
    });
  }, [candleData, height, layoutWidth]);

  useEffect(() => {
    const length = variant === "candle" ? candlePoints.length : points.length;
    if (length > 0 && activeIndex === null) {
      setActiveIndex(length - 1);
    }
  }, [activeIndex, candlePoints.length, points.length, variant]);

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

    if (variant === "candle") {
      return "";
    }

    const first = points[0];
    const last = points[points.length - 1];
    return `${linePath} L ${last.x} ${height} L ${first.x} ${height} Z`;
  }, [height, linePath, points, variant]);

  const activePoint = useMemo(() => {
    if (activeIndex === null) {
      return null;
    }

    if (variant === "candle") {
      if (candlePoints.length === 0) {
        return null;
      }
      return candlePoints[clamp(activeIndex, 0, candlePoints.length - 1)];
    }

    if (points.length === 0) {
      return null;
    }

    return points[clamp(activeIndex, 0, points.length - 1)];
  }, [activeIndex, candlePoints, points, variant]);

  const handleLayout = (event: LayoutChangeEvent) => {
    setLayoutWidth(event.nativeEvent.layout.width);
  };

  const updateActiveIndex = (xPosition: number) => {
    const length = variant === "candle" ? candlePoints.length : points.length;
    if (length === 0 || layoutWidth === 0) {
      return;
    }

    const nextIndex = Math.round((xPosition / layoutWidth) * (length - 1));
    setActiveIndex(clamp(nextIndex, 0, length - 1));
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

  if (variant === "candle" ? candleData.length === 0 : chartData.length === 0) {
    return (
      <View style={[styles.chartContainer, { height }]} onLayout={handleLayout}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>No chart data yet.</Text>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[styles.chartContainer, { height }]}
      onLayout={handleLayout}
      onStartShouldSetResponder={() => true}
      onResponderGrant={(event) => updateActiveIndex(event.nativeEvent.locationX)}
      onResponderMove={(event) => updateActiveIndex(event.nativeEvent.locationX)}
      onResponderRelease={() => {
        if (activeIndex === null && points.length > 0) {
          setActiveIndex(points.length - 1);
        }
      }}
    >
      <Svg width={layoutWidth} height={height}>
        {variant === "line" ? (
          <>
            {areaPath ? <Path d={areaPath} fill={chartFill} /> : null}
            {linePath ? (
              <Path d={linePath} stroke={chartStroke} strokeWidth={2} fill="none" />
            ) : null}
          </>
        ) : null}
        {variant === "candle" && candlePoints.length > 0 ? (
          <>
            {candlePoints.map((point, index) => {
              const bodyTop = Math.min(point.openY, point.closeY);
              const bodyHeight = Math.max(2, Math.abs(point.closeY - point.openY));
              return (
                <G key={`${point.ts}-${index}`}>
                  <Line
                    x1={point.x}
                    y1={point.highY}
                    x2={point.x}
                    y2={point.lowY}
                    stroke={point.color}
                    strokeWidth={1.5}
                  />
                  <Rect
                    x={point.x - point.bodyWidth / 2}
                    y={bodyTop}
                    width={point.bodyWidth}
                    height={bodyHeight}
                    fill={point.color}
                    rx={2}
                  />
                </G>
              );
            })}
          </>
        ) : null}
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
            {"y" in activePoint ? (
              <Circle
                cx={activePoint.x}
                cy={activePoint.y}
                r={4}
                fill={chartStroke}
                stroke={qsColors.bgCanvas}
                strokeWidth={2}
              />
            ) : (
              <Circle
                cx={activePoint.x}
                cy={activePoint.closeY}
                r={4}
                fill={activePoint.color}
                stroke={qsColors.bgCanvas}
                strokeWidth={2}
              />
            )}
          </>
        ) : null}
      </Svg>
      {activePoint ? (
        <View
          style={[
            styles.tooltip,
            {
              left: clamp(activePoint.x - 70, 6, Math.max(6, layoutWidth - 140)),
            },
          ]}
        >
          {"value" in activePoint ? (
            <Text style={styles.tooltipValue}>{formatValue(activePoint.value)}</Text>
          ) : (
            <Text style={styles.tooltipValue}>{formatValue(activePoint.close)}</Text>
          )}
          <Text style={styles.tooltipTime}>{formatTimestamp(activePoint.ts)}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  chartContainer: {
    borderRadius: qsRadius.md,
    backgroundColor: qsColors.bgCardSoft,
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
    backgroundColor: qsColors.bgCard,
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
});
