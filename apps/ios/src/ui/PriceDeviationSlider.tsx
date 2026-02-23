/**
 * PriceDeviationSlider — compact inline slider for limit order trigger MC.
 *
 * Matches reference: thin track line with tick marks at -100%, -50%, 0%, +50%, +100%,
 * small draggable thumb, and a compact % input box on the right.
 */

import { useCallback, useMemo, useState } from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
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
  deviationPercent: number; // -100 to +100
  onDeviationChange: (percent: number) => void;
  side: "buy" | "sell";
  minPercent?: number;
  maxPercent?: number;
};

const TRACK_HEIGHT = 2;
const THUMB_SIZE = 14;
const SNAP_THRESHOLD = 3;
const TICK_POSITIONS = [-100, -50, 0, 50, 100];

export function PriceDeviationSlider({
  currentMC,
  deviationPercent,
  onDeviationChange,
  side,
  minPercent = -100,
  maxPercent = 100,
}: Props) {
  const trackWidth = useSharedValue(0);
  const translateX = useSharedValue(0);
  const [inputText, setInputText] = useState(String(deviationPercent));

  const percentToX = useCallback(
    (pct: number, width: number) => {
      const range = maxPercent - minPercent;
      return ((pct - minPercent) / range) * width;
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
      runOnJS(setInputText)(String(snapped));
    })
    .onEnd(() => {
      "worklet";
      runOnJS(haptics.light)();
    });

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value - THUMB_SIZE / 2 }],
  }));

  // Thumb color
  const fillColor = useMemo(() => {
    if (deviationPercent === 0) return qsColors.accent;
    if (side === "sell") {
      return deviationPercent >= 0 ? qsColors.buyGreen : qsColors.sellRed;
    }
    return deviationPercent <= 0 ? qsColors.buyGreen : qsColors.accent;
  }, [side, deviationPercent]);

  // Handle % input submit
  const handleInputSubmit = useCallback(() => {
    const val = parseInt(inputText, 10);
    if (isNaN(val)) {
      setInputText(String(deviationPercent));
      return;
    }
    const clamped = Math.max(minPercent, Math.min(maxPercent, val));
    onDeviationChange(clamped);
    setInputText(String(clamped));
    haptics.light();
    // Sync thumb position
    const width = trackWidth.value;
    if (width > 0) {
      translateX.value = percentToX(clamped, width);
    }
  }, [inputText, deviationPercent, minPercent, maxPercent, onDeviationChange, trackWidth, translateX, percentToX]);

  // Sync inputText when parent changes deviationPercent
  const displayText = String(deviationPercent);
  if (inputText !== displayText && !isNaN(parseInt(inputText, 10))) {
    // Only sync if not actively editing
  }

  // Tick mark positions as percentages
  const tickPositions = useMemo(() => {
    const range = maxPercent - minPercent;
    return TICK_POSITIONS.filter((t) => t >= minPercent && t <= maxPercent).map((t) => ({
      value: t,
      left: ((t - minPercent) / range) * 100,
    }));
  }, [minPercent, maxPercent]);

  return (
    <View style={styles.container}>
      {/* Slider + % input in one row */}
      <View style={styles.sliderRow}>
        {/* Track area */}
        <View style={styles.trackWrap}>
          <GestureDetector gesture={panGesture}>
            <View
              style={styles.trackHitArea}
              onLayout={(e) => {
                const width = e.nativeEvent.layout.width;
                trackWidth.value = width;
                translateX.value = percentToX(deviationPercent, width);
              }}
            >
              {/* Thin track line */}
              <View style={styles.track} />

              {/* Tick marks */}
              {tickPositions.map((tick) => (
                <View
                  key={tick.value}
                  style={[
                    styles.tick,
                    { left: `${tick.left}%` },
                    tick.value === 0 && styles.tickCenter,
                  ]}
                />
              ))}

              {/* Thumb */}
              <Animated.View
                style={[styles.thumb, thumbStyle, { backgroundColor: fillColor }]}
              />
            </View>
          </GestureDetector>

          {/* Tick labels */}
          <View style={styles.tickLabelsRow}>
            {tickPositions.map((tick) => (
              <Text
                key={tick.value}
                style={[
                  styles.tickLabel,
                  { left: `${tick.left}%` },
                  tick.value === 0 && styles.tickLabelCenter,
                ]}
              >
                {tick.value > 0 ? `+${tick.value}%` : `${tick.value}%`}
              </Text>
            ))}
          </View>
        </View>

        {/* % input box */}
        <View style={styles.percentInputWrap}>
          <TextInput
            style={styles.percentInput}
            value={inputText}
            onChangeText={setInputText}
            onBlur={handleInputSubmit}
            onSubmitEditing={handleInputSubmit}
            keyboardType="number-pad"
            returnKeyType="done"
            selectTextOnFocus
            maxLength={4}
          />
          <Text style={styles.percentSymbol}>%</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 2,
  },
  sliderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: qsSpacing.md,
  },
  trackWrap: {
    flex: 1,
    paddingTop: 4,
  },
  trackHitArea: {
    height: 24,
    justifyContent: "center",
  },
  track: {
    height: TRACK_HEIGHT,
    backgroundColor: qsColors.textSubtle,
    borderRadius: 1,
  },
  tick: {
    position: "absolute",
    width: 1,
    height: 8,
    backgroundColor: qsColors.textSubtle,
    top: 8,
    marginLeft: -0.5,
  },
  tickCenter: {
    height: 10,
    top: 7,
    backgroundColor: qsColors.textTertiary,
  },
  thumb: {
    position: "absolute",
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    top: (24 - THUMB_SIZE) / 2,
    borderWidth: 2,
    borderColor: qsColors.textPrimary,
  },
  tickLabelsRow: {
    position: "relative",
    height: 14,
    marginTop: 2,
  },
  tickLabel: {
    position: "absolute",
    color: qsColors.textSubtle,
    fontSize: 9,
    fontVariant: ["tabular-nums"],
    transform: [{ translateX: -14 }],
  },
  tickLabelCenter: {
    color: qsColors.textTertiary,
  },
  percentInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: qsColors.layer3,
    borderRadius: qsRadius.sm,
    paddingHorizontal: qsSpacing.sm,
    paddingVertical: qsSpacing.xs,
    minWidth: 56,
    gap: 2,
  },
  percentInput: {
    color: qsColors.textPrimary,
    fontSize: qsTypography.size.sm,
    fontWeight: qsTypography.weight.semi,
    fontVariant: ["tabular-nums"],
    padding: 0,
    minWidth: 28,
    textAlign: "right",
  },
  percentSymbol: {
    color: qsColors.textTertiary,
    fontSize: qsTypography.size.sm,
    fontWeight: qsTypography.weight.semi,
  },
});
