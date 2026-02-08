import { useMemo } from "react";

import { View } from "react-native";
import Svg, { Defs, LinearGradient, Path, Stop } from "react-native-svg";

import { qsColors } from "@/src/theme/tokens";

type SparklinePoint = {
  ts: number;
  value: number;
};

type SparklineChartProps = {
  data: SparklinePoint[];
  width: number;
  height: number;
  strokeColor?: string;
  fillColor?: string;
  strokeWidth?: number;
  positive?: boolean;
};

export function SparklineChart({
  data,
  width,
  height,
  strokeColor,
  fillColor,
  strokeWidth = 1.5,
  positive,
}: SparklineChartProps) {
  const resolvedStroke = strokeColor ?? (positive === false ? qsColors.sellRed : positive ? qsColors.buyGreen : qsColors.sparklineStroke);
  const resolvedFill = fillColor ?? (positive === false ? qsColors.sellRedBg : positive ? qsColors.buyGreenBg : qsColors.sparklineFill);

  const paths = useMemo(() => {
    const points = (data ?? []).filter((p) => Number.isFinite(p.value));
    if (points.length < 2 || width <= 0 || height <= 0) {
      return { line: "", area: "" };
    }

    const values = points.map((p) => p.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const padY = height * 0.05;
    const usableH = height - padY * 2;
    const step = width / (points.length - 1);

    const coords = points.map((p, i) => ({
      x: i * step,
      y: padY + usableH - ((p.value - min) / range) * usableH,
    }));

    const line = coords
      .map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
      .join(" ");

    const last = coords[coords.length - 1];
    const first = coords[0];
    const area = `${line} L ${last.x.toFixed(1)} ${height} L ${first.x.toFixed(1)} ${height} Z`;

    return { line, area };
  }, [data, width, height]);

  if (!paths.line) {
    return <View style={{ width, height }} />;
  }

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={resolvedFill} stopOpacity="0.6" />
          <Stop offset="1" stopColor={resolvedFill} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      {paths.area ? <Path d={paths.area} fill="url(#sparkFill)" /> : null}
      <Path d={paths.line} stroke={resolvedStroke} strokeWidth={strokeWidth} fill="none" />
    </Svg>
  );
}
