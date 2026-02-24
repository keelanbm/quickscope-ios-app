import { useEffect } from "react";
import { StyleSheet, View, type DimensionValue, type ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { qsColors, qsRadius, qsSpacing } from "@/src/theme/tokens";

type SkeletonBaseProps = {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
};

function SkeletonBase({
  width,
  height = 14,
  borderRadius = 4,
  style,
}: SkeletonBaseProps) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.7, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: (width ?? "100%") as DimensionValue,
          height,
          borderRadius,
          backgroundColor: qsColors.borderDefault,
        },
        style,
        animatedStyle,
      ]}
    />
  );
}

export function SkeletonRow({ style }: { style?: ViewStyle }) {
  return (
    <View style={[skeletonStyles.row, style]}>
      <SkeletonBase width={32} height={32} borderRadius={16} />
      <View style={skeletonStyles.rowContent}>
        <SkeletonBase width={100} height={12} />
        <SkeletonBase width={60} height={10} />
      </View>
      <View style={skeletonStyles.rowRight}>
        <SkeletonBase width={50} height={12} />
        <SkeletonBase width={40} height={10} />
      </View>
    </View>
  );
}

export function SkeletonCard({ style }: { style?: ViewStyle }) {
  return (
    <View style={[skeletonStyles.card, style]}>
      <SkeletonBase width={80} height={12} />
      <SkeletonBase width={120} height={20} style={{ marginTop: 8 }} />
      <SkeletonBase width={60} height={10} style={{ marginTop: 6 }} />
    </View>
  );
}

export function SkeletonChart({
  height = 160,
  style,
}: {
  height?: number;
  style?: ViewStyle;
}) {
  return (
    <View style={[skeletonStyles.chart, { height }, style]}>
      <SkeletonBase
        width="100%"
        height={height - 24}
        borderRadius={qsRadius.md}
      />
    </View>
  );
}

export function SkeletonRows({
  count = 5,
  style,
}: {
  count?: number;
  style?: ViewStyle;
}) {
  return (
    <View style={style}>
      {Array.from({ length: count }, (_, i) => (
        <SkeletonRow key={i} />
      ))}
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: qsSpacing.md,
    paddingVertical: qsSpacing.sm,
    gap: qsSpacing.sm,
  },
  rowContent: {
    flex: 1,
    gap: qsSpacing.xs,
  },
  rowRight: {
    alignItems: "flex-end",
    gap: qsSpacing.xs,
  },
  card: {
    backgroundColor: qsColors.bgCardSoft,
    borderRadius: qsRadius.md,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    padding: qsSpacing.md,
    gap: qsSpacing.xs,
  },
  chart: {
    backgroundColor: qsColors.bgCardSoft,
    borderRadius: qsRadius.md,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    padding: qsSpacing.sm,
  },
});
