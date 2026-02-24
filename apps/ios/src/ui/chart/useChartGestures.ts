/**
 * useChartGestures — Pan + Pinch gestures for chart interaction.
 *
 * Pan: long-press (200ms) activates scrub mode with crosshair + tooltip.
 *      Fires haptic on candle boundary crossings.
 * Pinch: adjusts horizontal scale (1.0-3.0x).
 *
 * Returns composed gesture and shared values for integration with TokenChart.
 */
import { useCallback, useRef } from "react";
import { Gesture, type ComposedGesture } from "react-native-gesture-handler";
import {
  useSharedValue,
  runOnJS,
  type SharedValue,
} from "react-native-reanimated";
import { haptics } from "@/src/lib/haptics";

type UseChartGesturesOptions = {
  /** Total number of data points (candles or line points) */
  dataLength: number;
  /** Width of the container */
  layoutWidth: number;
  /** Candle step size (candleWidth + gap) — 0 for line charts */
  candleStep: number;
  /** Callback when active index changes */
  onIndexChange: (index: number) => void;
  /** Callback when scrub mode starts */
  onScrubStart?: () => void;
  /** Callback when scrub mode ends */
  onScrubEnd?: () => void;
  /** Callback when pinch scale changes */
  onScaleChange?: (scale: number) => void;
};

type UseChartGesturesResult = {
  gesture: ComposedGesture;
  isScrubbing: SharedValue<boolean>;
  pinchScale: SharedValue<number>;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function useChartGestures({
  dataLength,
  layoutWidth,
  candleStep,
  onIndexChange,
  onScrubStart,
  onScrubEnd,
  onScaleChange,
}: UseChartGesturesOptions): UseChartGesturesResult {
  const isScrubbing = useSharedValue(false);
  const pinchScale = useSharedValue(1);
  const lastIndex = useRef(-1);

  const fireHaptic = useCallback(() => {
    haptics.selection();
  }, []);

  const handleIndexUpdate = useCallback(
    (x: number) => {
      if (dataLength <= 0) return;

      let nextIndex: number;
      if (candleStep > 0) {
        nextIndex = Math.round(x / candleStep);
      } else if (layoutWidth > 0) {
        nextIndex = Math.round((x / layoutWidth) * (dataLength - 1));
      } else {
        return;
      }

      nextIndex = clamp(nextIndex, 0, dataLength - 1);

      if (nextIndex !== lastIndex.current) {
        lastIndex.current = nextIndex;
        onIndexChange(nextIndex);
        fireHaptic();
      }
    },
    [dataLength, layoutWidth, candleStep, onIndexChange, fireHaptic],
  );

  const startScrub = useCallback(() => {
    onScrubStart?.();
  }, [onScrubStart]);

  const endScrub = useCallback(() => {
    lastIndex.current = -1;
    onScrubEnd?.();
  }, [onScrubEnd]);

  const updateScale = useCallback(
    (scale: number) => {
      onScaleChange?.(scale);
    },
    [onScaleChange],
  );

  // Long-press pan — activates scrub after 200ms hold
  const panGesture = Gesture.Pan()
    .activateAfterLongPress(200)
    .onStart((e) => {
      "worklet";
      isScrubbing.value = true;
      runOnJS(startScrub)();
      runOnJS(handleIndexUpdate)(e.x);
    })
    .onUpdate((e) => {
      "worklet";
      runOnJS(handleIndexUpdate)(e.x);
    })
    .onEnd(() => {
      "worklet";
      isScrubbing.value = false;
      runOnJS(endScrub)();
    });

  // Pinch gesture — scale 1.0-3.0x
  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      "worklet";
      const newScale = clamp(e.scale, 1, 3);
      pinchScale.value = newScale;
      runOnJS(updateScale)(newScale);
    })
    .onEnd(() => {
      "worklet";
      // Keep the scale where user left it
    });

  const gesture = Gesture.Simultaneous(panGesture, pinchGesture);

  return { gesture, isScrubbing, pinchScale };
}
