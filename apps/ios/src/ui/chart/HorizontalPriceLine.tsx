/**
 * HorizontalPriceLine — horizontal dashed line at touch Y position.
 *
 * Shows during active scrub with a small price label on the right edge.
 */
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Line } from "react-native-svg";

import { qsColors, qsRadius, qsSpacing } from "@/src/theme/tokens";

type HorizontalPriceLineProps = {
  /** Y position in chart coordinates */
  y: number;
  /** Full chart width */
  width: number;
  /** Chart height for clamping the label */
  chartHeight: number;
  /** Formatted price string */
  priceLabel: string;
};

export function HorizontalPriceLine({
  y,
  width,
  chartHeight,
  priceLabel,
}: HorizontalPriceLineProps) {
  const clampedY = Math.min(Math.max(y - 10, 0), chartHeight - 20);

  return (
    <>
      <Line
        x1={0}
        x2={width}
        y1={y}
        y2={y}
        stroke={qsColors.textTertiary}
        strokeWidth={0.5}
        strokeDasharray="4 3"
        strokeOpacity={0.6}
      />
      {/* Price label positioned outside SVG via absolute positioning */}
      <View style={[styles.label, { top: clampedY }]}>
        <Text style={styles.labelText} numberOfLines={1}>
          {priceLabel}
        </Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  label: {
    position: "absolute",
    right: qsSpacing.xs,
    backgroundColor: qsColors.layer3,
    borderRadius: qsRadius.xs,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  labelText: {
    color: qsColors.textSecondary,
    fontSize: 9,
    fontWeight: "500",
    fontVariant: ["tabular-nums"],
  },
});
