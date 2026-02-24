/**
 * VolumeOverlay — semi-transparent volume bars in the bottom portion of the chart.
 *
 * Bars are colored by candle direction (green/red) at 20% opacity.
 * Height is proportional to volume, scaled independently from price.
 * Rendered as the first SVG layer (behind candles).
 */
import React, { useMemo } from "react";
import { Rect } from "react-native-svg";

import { qsColors } from "@/src/theme/tokens";
import type { CandleRenderData } from "@/src/ui/chart/chartTypes";

/** Fraction of total chart height reserved for volume bars. */
const VOLUME_ZONE_RATIO = 0.22;

type VolumeOverlayProps = {
  candles: CandleRenderData[];
  candleWidth: number;
  chartHeight: number;
};

export function VolumeOverlay({
  candles,
  candleWidth,
  chartHeight,
}: VolumeOverlayProps) {
  const bars = useMemo(() => {
    const maxVolume = candles.reduce(
      (max, c) => Math.max(max, c.volume ?? 0),
      0,
    );
    if (maxVolume <= 0) return [];

    const zoneHeight = chartHeight * VOLUME_ZONE_RATIO;
    const baseY = chartHeight;

    return candles
      .filter((c) => (c.volume ?? 0) > 0)
      .map((c) => {
        const ratio = (c.volume ?? 0) / maxVolume;
        const barHeight = Math.max(1, ratio * zoneHeight);

        return {
          x: c.x,
          y: baseY - barHeight,
          width: candleWidth,
          height: barHeight,
          fill: c.isGreen ? qsColors.buyGreen : qsColors.sellRed,
          key: c.index,
        };
      });
  }, [candles, candleWidth, chartHeight]);

  if (bars.length === 0) return null;

  return (
    <>
      {bars.map((bar) => (
        <Rect
          key={`vol-${bar.key}`}
          x={bar.x}
          y={bar.y}
          width={bar.width}
          height={bar.height}
          fill={bar.fill}
          opacity={0.18}
        />
      ))}
    </>
  );
}
