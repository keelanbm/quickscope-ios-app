/**
 * HorizontalPriceLine — horizontal dashed line at touch Y position.
 *
 * Shows during active scrub with a small price label on the right edge.
 * Animated Y position via reanimated shared value.
 */
import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { Line } from "react-native-svg";

import { qsColors, qsRadius, qsSpacing } from "@/src/theme/tokens";

const AnimatedLine = Animated.createAnimatedComponent(Line);

const TIMING_CONFIG = {
  duration: 100,
  easing: Easing.out(Easing.quad),
};

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
  const animY = useSharedValue(y);

  useEffect(() => {
    animY.value = withTiming(y, TIMING_CONFIG);
  }, [y, animY]);

  const lineProps = useAnimatedProps(() => ({
    y1: animY.value,
    y2: animY.value,
  }));

  const labelStyle = useAnimatedStyle(() => {
    // Keep label within chart bounds
    const clampedY = Math.min(
      Math.max(animY.value - 10, 0),
      chartHeight - 20,
    );
    return {
      top: clampedY,
    };
  });

  return (
    <>
      <AnimatedLine
        x1={0}
        x2={width}
        stroke={qsColors.textTertiary}
        strokeWidth={0.5}
        strokeDasharray="4 3"
        strokeOpacity={0.6}
        animatedProps={lineProps}
      />
      {/* Price label positioned outside SVG via absolute positioning */}
      <Animated.View style={[styles.label, labelStyle]}>
        <Text style={styles.labelText} numberOfLines={1}>
          {priceLabel}
        </Text>
      </Animated.View>
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
