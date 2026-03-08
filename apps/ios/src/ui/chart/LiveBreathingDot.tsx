/**
 * LiveBreathingDot — pulsing dot at the last point on a line chart.
 *
 * Outer circle scales 1→1.4→1 with fading opacity (accent at 30%).
 * Inner solid dot stays fixed. Used only in line mode when isLive=true.
 */
import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing } from "react-native";
import { Circle } from "react-native-svg";

import { qsColors } from "@/src/theme/tokens";

type LiveBreathingDotProps = {
  cx: number;
  cy: number;
};

const OUTER_RADIUS = 8;

export function LiveBreathingDot({ cx, cy }: LiveBreathingDotProps) {
  const anim = useRef(new Animated.Value(0)).current;
  const [pulse, setPulse] = useState({ scale: 1, opacity: 0.3 });

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
      ]),
    );

    const id = anim.addListener(({ value }) => {
      setPulse({
        scale: 1 + value * 0.4,
        opacity: 0.3 - value * 0.22,
      });
    });

    loop.start();
    return () => {
      loop.stop();
      anim.removeListener(id);
    };
  }, [anim]);

  return (
    <>
      <Circle
        cx={cx}
        cy={cy}
        r={OUTER_RADIUS * pulse.scale}
        fill={qsColors.accent}
        opacity={pulse.opacity}
      />
      <Circle cx={cx} cy={cy} r={4} fill={qsColors.accent} />
    </>
  );
}
