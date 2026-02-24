/**
 * LiveCandleGlow — pulsing glow behind the last candle.
 *
 * Oversized rect centered on last candle with pulsing opacity
 * (0.15 → 0.35, 1.5s loop). Only rendered when isLive=true.
 */
import React, { useEffect } from "react";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { Rect } from "react-native-svg";

import { qsColors } from "@/src/theme/tokens";

const AnimatedRect = Animated.createAnimatedComponent(Rect);

type LiveCandleGlowProps = {
  x: number;
  candleWidth: number;
  chartHeight: number;
};

const GLOW_PADDING = 6;

export function LiveCandleGlow({ x, candleWidth, chartHeight }: LiveCandleGlowProps) {
  const animOpacity = useSharedValue(0.15);

  useEffect(() => {
    animOpacity.value = withRepeat(
      withTiming(0.35, {
        duration: 1500,
        easing: Easing.inOut(Easing.sin),
      }),
      -1, // infinite
      true, // reverse
    );
  }, [animOpacity]);

  const glowProps = useAnimatedProps(() => ({
    opacity: animOpacity.value,
  }));

  return (
    <AnimatedRect
      x={x - GLOW_PADDING}
      y={0}
      width={candleWidth + GLOW_PADDING * 2}
      height={chartHeight}
      fill={qsColors.accent}
      rx={4}
      animatedProps={glowProps}
    />
  );
}
