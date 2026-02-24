/**
 * LivePriceLine — horizontal dashed line at current close price.
 *
 * Spans full chart width. Animated Y position via useAnimatedProps
 * for smooth transitions when price updates. Accent color at 40% opacity.
 */
import React, { useEffect } from "react";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { Line } from "react-native-svg";

import { qsColors } from "@/src/theme/tokens";

const AnimatedLine = Animated.createAnimatedComponent(Line);

const TIMING_CONFIG = {
  duration: 200,
  easing: Easing.out(Easing.quad),
};

type LivePriceLineProps = {
  y: number;
  width: number;
};

export function LivePriceLine({ y, width }: LivePriceLineProps) {
  const animY = useSharedValue(y);

  useEffect(() => {
    animY.value = withTiming(y, TIMING_CONFIG);
  }, [y, animY]);

  const lineProps = useAnimatedProps(() => ({
    y1: animY.value,
    y2: animY.value,
  }));

  return (
    <AnimatedLine
      x1={0}
      x2={width}
      stroke={qsColors.accent}
      strokeWidth={1}
      strokeDasharray="6 4"
      strokeOpacity={0.4}
      animatedProps={lineProps}
    />
  );
}
