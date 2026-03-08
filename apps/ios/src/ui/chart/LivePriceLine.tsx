/**
 * LivePriceLine — horizontal dashed line at current close price.
 *
 * Spans full chart width. Accent color at 40% opacity.
 */
import React from "react";
import { Line } from "react-native-svg";

import { qsColors } from "@/src/theme/tokens";

type LivePriceLineProps = {
  y: number;
  width: number;
};

export function LivePriceLine({ y, width }: LivePriceLineProps) {
  return (
    <Line
      x1={0}
      x2={width}
      y1={y}
      y2={y}
      stroke={qsColors.accent}
      strokeWidth={1}
      strokeDasharray="6 4"
      strokeOpacity={0.4}
    />
  );
}
