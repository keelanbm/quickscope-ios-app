/**
 * AnimatedCandle — single candlestick with reanimated transitions.
 *
 * Body height/position animate via withTiming (150ms) for smooth updates.
 * Fades in on mount via opacity transition.
 */
import React, { useEffect } from "react";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { Line, Rect } from "react-native-svg";

import { qsColors } from "@/src/theme/tokens";

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedLine = Animated.createAnimatedComponent(Line);

const TIMING_CONFIG = {
  duration: 150,
  easing: Easing.out(Easing.quad),
};

type AnimatedCandleProps = {
  x: number;
  centerX: number;
  highY: number;
  lowY: number;
  bodyTop: number;
  bodyHeight: number;
  isGreen: boolean;
  candleWidth: number;
};

export function AnimatedCandle({
  x,
  centerX,
  highY,
  lowY,
  bodyTop,
  bodyHeight,
  isGreen,
  candleWidth,
}: AnimatedCandleProps) {
  const color = isGreen ? qsColors.candleGreen : qsColors.candleRed;

  // Animated shared values
  const animHighY = useSharedValue(highY);
  const animLowY = useSharedValue(lowY);
  const animBodyTop = useSharedValue(bodyTop);
  const animBodyHeight = useSharedValue(bodyHeight);
  const animOpacity = useSharedValue(0);

  // Drive animations on value changes
  useEffect(() => {
    animHighY.value = withTiming(highY, TIMING_CONFIG);
    animLowY.value = withTiming(lowY, TIMING_CONFIG);
    animBodyTop.value = withTiming(bodyTop, TIMING_CONFIG);
    animBodyHeight.value = withTiming(bodyHeight, TIMING_CONFIG);
  }, [highY, lowY, bodyTop, bodyHeight, animHighY, animLowY, animBodyTop, animBodyHeight]);

  // Fade in on mount
  useEffect(() => {
    animOpacity.value = withTiming(1, { duration: 200 });
  }, [animOpacity]);

  const wickProps = useAnimatedProps(() => ({
    y1: animHighY.value,
    y2: animLowY.value,
    opacity: animOpacity.value,
  }));

  const bodyProps = useAnimatedProps(() => ({
    y: animBodyTop.value,
    height: animBodyHeight.value,
    opacity: animOpacity.value,
  }));

  return (
    <>
      <AnimatedLine
        x1={centerX}
        x2={centerX}
        stroke={color}
        strokeWidth={1}
        animatedProps={wickProps}
      />
      <AnimatedRect
        x={x}
        width={candleWidth}
        fill={color}
        rx={1}
        animatedProps={bodyProps}
      />
    </>
  );
}
