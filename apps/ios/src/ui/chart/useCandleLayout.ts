/**
 * useCandleLayout — computes dynamic candle width based on data count vs container.
 *
 * When few candles exist (common for new tokens), candles expand to fill the
 * container width (up to MAX_WIDTH). When many candles exist, width stays at
 * MIN_WIDTH and the chart becomes horizontally scrollable.
 */
import { useMemo } from "react";

const MIN_WIDTH = 8;
const MAX_WIDTH = 20;
const GAP = 3;

type CandleLayout = {
  candleWidth: number;
  gap: number;
  svgWidth: number;
  scrollable: boolean;
};

export function useCandleLayout(
  candleCount: number,
  containerWidth: number,
): CandleLayout {
  return useMemo(() => {
    if (candleCount <= 0 || containerWidth <= 0) {
      return { candleWidth: MIN_WIDTH, gap: GAP, svgWidth: 0, scrollable: false };
    }

    const minTotalWidth =
      candleCount * MIN_WIDTH + (candleCount - 1) * GAP;

    if (minTotalWidth <= containerWidth) {
      // Expand candles to fill available space
      const expandedWidth = Math.min(
        MAX_WIDTH,
        (containerWidth - (candleCount - 1) * GAP) / candleCount,
      );
      const svgWidth = candleCount * expandedWidth + (candleCount - 1) * GAP;
      return {
        candleWidth: expandedWidth,
        gap: GAP,
        svgWidth: Math.min(svgWidth, containerWidth),
        scrollable: false,
      };
    }

    // Too many candles — use minimum width with scroll
    return {
      candleWidth: MIN_WIDTH,
      gap: GAP,
      svgWidth: minTotalWidth,
      scrollable: true,
    };
  }, [candleCount, containerWidth]);
}
