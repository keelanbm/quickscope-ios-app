/**
 * AnimatedCandle — single candlestick with fade-in on mount.
 *
 * Uses RN Animated for opacity fade-in. Position/size values set directly.
 */
import React, { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";
import { Line, Rect } from "react-native-svg";

import { qsColors } from "@/src/theme/tokens";

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
  const opacity = useRef(new Animated.Value(0)).current;
  const [opacityVal, setOpacityVal] = React.useState(0);

  useEffect(() => {
    const id = opacity.addListener(({ value }) => setOpacityVal(value));
    Animated.timing(opacity, {
      toValue: 1,
      duration: 200,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
    return () => opacity.removeListener(id);
  }, [opacity]);

  return (
    <>
      <Line
        x1={centerX}
        x2={centerX}
        y1={highY}
        y2={lowY}
        stroke={color}
        strokeWidth={1}
        opacity={opacityVal}
      />
      <Rect
        x={x}
        y={bodyTop}
        width={candleWidth}
        height={bodyHeight}
        fill={color}
        rx={1}
        opacity={opacityVal}
      />
    </>
  );
}
