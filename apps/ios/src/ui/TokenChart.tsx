import { useEffect, useMemo, useState } from "react";

import { LayoutChangeEvent, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Line, Path } from "react-native-svg";

import { qsColors, qsRadius, qsSpacing } from "@/src/theme/tokens";

export type TokenChartPoint = {
  ts: number;
  value: number;
};

type TokenChartProps = {
  data: TokenChartPoint[];
  height?: number;
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
  height = 160,
  isLoading = false,
  formatValue,
  formatTimestamp,
}: TokenChartProps) {
  const [layoutWidth, setLayoutWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const chartData = useMemo(() => {
    return (data ?? []).filter((point) => Number.isFinite(point.value) && point.ts > 0);
  }, [data]);

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

  useEffect(() => {
    if (points.length > 0 && activeIndex === null) {
      setActiveIndex(points.length - 1);
    }
  }, [activeIndex, points.length]);

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
    if (activeIndex === null || points.length === 0) {
      return null;
    }

    return points[clamp(activeIndex, 0, points.length - 1)];
  }, [activeIndex, points]);

  const handleLayout = (event: LayoutChangeEvent) => {
    setLayoutWidth(event.nativeEvent.layout.width);
  };

  const updateActiveIndex = (xPosition: number) => {
    if (points.length === 0 || layoutWidth === 0) {
      return;
    }

    const nextIndex = Math.round((xPosition / layoutWidth) * (points.length - 1));
    setActiveIndex(clamp(nextIndex, 0, points.length - 1));
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

  if (chartData.length === 0) {
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
        {areaPath ? <Path d={areaPath} fill={chartFill} /> : null}
        {linePath ? <Path d={linePath} stroke={chartStroke} strokeWidth={2} fill="none" /> : null}
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
});
