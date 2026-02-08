/**
 * Skeleton loading components with animated shimmer effect.
 *
 * Uses react-native-reanimated for smooth shimmer animation.
 * Colours: layer2 base → layer3 highlight.
 */
import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from "react-native-reanimated";

import { qsColors, qsRadius, qsSpacing } from "@/src/theme/tokens";

// ── Shimmer wrapper ──────────────────────────────

function Shimmer({
  width,
  height,
  radius = qsRadius.sm,
  style,
}: {
  width: number | string;
  height: number;
  radius?: number;
  style?: object;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0.4, 0.8]),
  }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: qsColors.layer3,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

// ── Primitive components ─────────────────────────

/** Single line placeholder (text, numbers). */
export function SkeletonLine({
  width = "100%",
  height = 14,
  radius,
}: {
  width?: number | string;
  height?: number;
  radius?: number;
}) {
  return <Shimmer width={width} height={height} radius={radius ?? qsRadius.xs} />;
}

/** Box placeholder (images, cards, icons). */
export function SkeletonBox({
  width,
  height,
  radius,
}: {
  width: number;
  height: number;
  radius?: number;
}) {
  return <Shimmer width={width} height={height} radius={radius ?? qsRadius.md} />;
}

// ── Composite components ─────────────────────────

/** Token row skeleton — icon + 2 text lines + metric on right. */
export function SkeletonRow() {
  return (
    <View style={skStyles.row}>
      {/* Icon */}
      <Shimmer width={36} height={36} radius={18} />

      {/* Text lines */}
      <View style={skStyles.rowTextCol}>
        <Shimmer width={80} height={13} radius={qsRadius.xs} />
        <Shimmer width={56} height={10} radius={qsRadius.xs} />
      </View>

      {/* Right metric */}
      <View style={skStyles.rowRight}>
        <Shimmer width={52} height={13} radius={qsRadius.xs} />
        <Shimmer width={36} height={10} radius={qsRadius.xs} />
      </View>
    </View>
  );
}

/** Card skeleton — full-width card with a few lines. */
export function SkeletonCard() {
  return (
    <View style={skStyles.card}>
      <Shimmer width="60%" height={16} radius={qsRadius.xs} />
      <Shimmer width="100%" height={12} radius={qsRadius.xs} />
      <Shimmer width="80%" height={12} radius={qsRadius.xs} />
      <Shimmer width="40%" height={12} radius={qsRadius.xs} />
    </View>
  );
}

/** Chart area skeleton — full-width rectangle. */
export function SkeletonChart({ height = 280 }: { height?: number }) {
  return (
    <View style={skStyles.chartWrap}>
      <Shimmer width="100%" height={height} radius={0} />
    </View>
  );
}

/** Stats grid skeleton — 4 metric badges. */
export function SkeletonMetrics() {
  return (
    <View style={skStyles.metricsRow}>
      {Array.from({ length: 4 }).map((_, i) => (
        <Shimmer key={i} width={72} height={40} radius={qsRadius.md} />
      ))}
    </View>
  );
}

// ── Styles ───────────────────────────────────────

const skStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: qsSpacing.lg,
    paddingVertical: qsSpacing.md,
    gap: qsSpacing.md,
  },
  rowTextCol: {
    flex: 1,
    gap: 6,
  },
  rowRight: {
    alignItems: "flex-end",
    gap: 6,
  },
  card: {
    marginHorizontal: qsSpacing.lg,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    borderRadius: qsRadius.md,
    backgroundColor: qsColors.layer1,
    padding: qsSpacing.md,
    gap: qsSpacing.sm,
  },
  chartWrap: {
    marginBottom: qsSpacing.sm,
  },
  metricsRow: {
    flexDirection: "row",
    gap: qsSpacing.sm,
    paddingHorizontal: qsSpacing.lg,
    marginBottom: qsSpacing.lg,
  },
});
