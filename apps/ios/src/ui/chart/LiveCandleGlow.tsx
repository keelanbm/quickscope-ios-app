/**
 * LiveCandleGlow — pulsing glow behind the last candle.
 *
 * Oversized rect centered on last candle with pulsing opacity
 * (0.15 → 0.35, 1.5s loop). Only rendered when isLive=true.
 */
import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing } from "react-native";
import { Rect } from "react-native-svg";

import { qsColors } from "@/src/theme/tokens";

type LiveCandleGlowProps = {
  x: number;
  candleWidth: number;
  chartHeight: number;
};

const GLOW_PADDING = 6;

export function LiveCandleGlow({ x, candleWidth, chartHeight }: LiveCandleGlowProps) {
  const anim = useRef(new Animated.Value(0)).current;
  const [glowOpacity, setGlowOpacity] = useState(0.15);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
      ]),
    );

    const id = anim.addListener(({ value }) => {
      setGlowOpacity(0.15 + value * 0.2);
    });

    loop.start();
    return () => {
      loop.stop();
      anim.removeListener(id);
    };
  }, [anim]);

  return (
    <Rect
      x={x - GLOW_PADDING}
      y={0}
      width={candleWidth + GLOW_PADDING * 2}
      height={chartHeight}
      fill={qsColors.accent}
      rx={4}
      opacity={glowOpacity}
    />
  );
}
