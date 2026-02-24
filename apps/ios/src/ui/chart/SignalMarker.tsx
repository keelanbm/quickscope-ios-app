/**
 * SignalMarker — small colored diamond below a candle on the chart.
 *
 * Tappable — fires `onTap` with signal data for showing a mini-tooltip.
 * Multiple signals at the same timestamp are offset vertically (8px each).
 */
import React from "react";
import { G, Rect } from "react-native-svg";

import type { ChartSignal } from "@/src/ui/chart/chartTypes";
import { SIGNAL_CONFIG } from "@/src/ui/chart/chartSignalTypes";

const DIAMOND_SIZE = 6;
const STACK_OFFSET = 8;

type SignalMarkerProps = {
  signal: ChartSignal;
  /** X coordinate (center of the candle) */
  cx: number;
  /** Y coordinate — base position below candle low */
  baseY: number;
  /** Stack index for multiple signals at same timestamp (0-based) */
  stackIndex: number;
  /** Called when marker is tapped */
  onPress?: (signal: ChartSignal) => void;
};

export function SignalMarker({
  signal,
  cx,
  baseY,
  stackIndex,
  onPress,
}: SignalMarkerProps) {
  const config = SIGNAL_CONFIG[signal.type];
  const y = baseY + stackIndex * STACK_OFFSET;

  return (
    <G
      onPress={onPress ? () => onPress(signal) : undefined}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Rect
        x={cx - DIAMOND_SIZE / 2}
        y={y - DIAMOND_SIZE / 2}
        width={DIAMOND_SIZE}
        height={DIAMOND_SIZE}
        fill={config.fill}
        opacity={0.85}
        rotation={45}
        origin={`${cx}, ${y}`}
      />
    </G>
  );
}
