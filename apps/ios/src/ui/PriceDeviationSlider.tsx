/**
 * PriceDeviationSlider — draggable slider for setting limit order trigger MC
 * as a percentage deviation from current market cap.
 *
 * Range: -90% to +500% (configurable)
 * Center notch at 0% = current MC
 * Green right of center (limit sell), Red left (stop loss), Purple left on buy side
 */

import { useCallback, useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
} from "react-native-reanimated";
import { qsColors, qsRadius, qsSpacing, qsTypography } from "@/src/theme/tokens";
import { haptics } from "@/src/lib/haptics";

type Props = {
  currentMC: number;
  deviationPercent: number; // -90 to +500
  onDeviationChange: (percent: number) => void;
  side: "buy" | "sell";
  minPercent?: number; // default -90
  maxPercent?: number; // default +500
};

const TRACK_HEIGHT = 40;
const THUMB_SIZE = 28;
const SNAP_THRESHOLD = 3; // snap to 0% within ±3%

export function PriceDeviationSlider({
  currentMC,
  deviationPercent,
  onDeviationChange,
  side,
  minPercent = -90,
  maxPercent = 500,
}: Props) {
  const trackWidth = useSharedValue(0);
  const translateX = useSharedValue(0);

  // Convert percent to x position
  const percentToX = useCallback(
    (pct: number, width: number) => {
      const range = maxPercent - minPercent;
      return ((pct - minPercent) / range) * width;
    },
    [minPercent, maxPercent],
  );

  // Convert x position to percent
  const xToPercent = useCallback(
    (x: number, width: number) => {
      const range = maxPercent - minPercent;
      const pct = (x / width) * range + minPercent;
      // Snap to zero near center
      if (Math.abs(pct) < SNAP_THRESHOLD) return 0;
      return Math.round(pct);
    },
    [minPercent, maxPercent],
  );

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      "worklet";
      const width = trackWidth.value;
      if (width <= 0) return;
      const clampedX = Math.max(0, Math.min(e.x, width));
      translateX.value = clampedX;
      const range = maxPercent - minPercent;
      const pct = (clampedX / width) * range + minPercent;
      const snapped = Math.abs(pct) < SNAP_THRESHOLD ? 0 : Math.round(pct);
      runOnJS(onDeviationChange)(snapped);
    })
    .onEnd(() => {
      "worklet";
      runOnJS(haptics.light)();
    });

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value - THUMB_SIZE / 2 }],
  }));

  const targetMC = currentMC * (1 + deviationPercent / 100);
  const deviationLabel =
    deviationPercent >= 0 ? `+${deviationPercent}%` : `${deviationPercent}%`;

  // Fill color: green for profit direction, red for loss direction
  const fillColor = useMemo(() => {
    if (side === "sell") {
      return deviationPercent >= 0 ? qsColors.buyGreen : qsColors.sellRed;
    }
    // Buy side: below current = good (buying dip)
    return deviationPercent <= 0 ? qsColors.buyGreen : qsColors.accent;
  }, [side, deviationPercent]);

  // Center notch position (memoized for layout callback)
  const centerNotchLeft = useMemo(() => {
    const range = maxPercent - minPercent;
    return `${((0 - minPercent) / range) * 100}%`;
  }, [minPercent, maxPercent]);

  const formatMC = (mc: number): string => {
    if (mc >= 1_000_000) return `$${(mc / 1_000_000).toFixed(2)}M`;
    if (mc >= 1_000) return `$${(mc / 1_000).toFixed(1)}K`;
    return `$${mc.toFixed(0)}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>Price Deviation</Text>
        <Text style={[styles.deviationText, { color: fillColor }]}>
          {deviationLabel}
        </Text>
      </View>

      <GestureDetector gesture={panGesture}>
        <View
          style={styles.track}
          onLayout={(e) => {
            const width = e.nativeEvent.layout.width;
            trackWidth.value = width;
            translateX.value = percentToX(deviationPercent, width);
          }}
        >
          {/* Center notch (0%) */}
          <View style={[styles.centerNotch, { left: centerNotchLeft as unknown as number }]} />

          {/* Thumb */}
          <Animated.View
            style={[styles.thumb, thumbStyle, { backgroundColor: fillColor }]}
          />
        </View>
      </GestureDetector>

      <View style={styles.mcRow}>
        <Text style={styles.mcLabel}>Target MC</Text>
        <Text style={styles.mcValue}>{formatMC(targetMC)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: qsSpacing.lg,
    gap: qsSpacing.sm,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  label: {
    color: qsColors.textTertiary,
    fontSize: qsTypography.size.xxs,
  },
  deviationText: {
    fontSize: qsTypography.size.sm,
    fontWeight: qsTypography.weight.semi,
  },
  track: {
    height: TRACK_HEIGHT,
    backgroundColor: qsColors.layer3,
    borderRadius: qsRadius.md,
    justifyContent: "center",
  },
  centerNotch: {
    position: "absolute",
    width: 2,
    height: TRACK_HEIGHT - 8,
    backgroundColor: qsColors.textSubtle,
    borderRadius: 1,
  },
  thumb: {
    position: "absolute",
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    borderWidth: 2,
    borderColor: qsColors.textPrimary,
  },
  mcRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  mcLabel: {
    color: qsColors.textTertiary,
    fontSize: qsTypography.size.xxs,
  },
  mcValue: {
    color: qsColors.textPrimary,
    fontSize: qsTypography.size.sm,
    fontWeight: qsTypography.weight.semi,
    fontVariant: ["tabular-nums"],
  },
});
