/**
 * LiveBreathingDot — pulsing dot at the last point on a line chart.
 *
 * Outer circle scales 1→1.4→1 with fading opacity (accent at 30%).
 * Inner solid dot stays fixed. Used only in line mode when isLive=true.
 */
import React, { useEffect } from "react";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { Circle } from "react-native-svg";

import { qsColors } from "@/src/theme/tokens";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type LiveBreathingDotProps = {
  cx: number;
  cy: number;
};

const OUTER_RADIUS = 8;

export function LiveBreathingDot({ cx, cy }: LiveBreathingDotProps) {
  const animScale = useSharedValue(1);
  const animOpacity = useSharedValue(0.3);

  useEffect(() => {
    animScale.value = withRepeat(
      withTiming(1.4, {
        duration: 1200,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true,
    );
    animOpacity.value = withRepeat(
      withTiming(0.08, {
        duration: 1200,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true,
    );
  }, [animScale, animOpacity]);

  const outerProps = useAnimatedProps(() => ({
    r: OUTER_RADIUS * animScale.value,
    opacity: animOpacity.value,
  }));

  return (
    <>
      <AnimatedCircle
        cx={cx}
        cy={cy}
        fill={qsColors.accent}
        animatedProps={outerProps}
      />
      <Circle
        cx={cx}
        cy={cy}
        r={4}
        fill={qsColors.accent}
      />
    </>
  );
}
