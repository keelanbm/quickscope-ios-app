import { StyleSheet, Text, View } from "react-native";

import { qsColors, qsRadius, qsSpacing } from "@/src/theme/tokens";

type MetricBadgeVariant = "default" | "positive" | "negative" | "highlight";
type MetricBadgeSize = "sm" | "md" | "lg";

type MetricBadgeProps = {
  label: string;
  value: string;
  variant?: MetricBadgeVariant;
  size?: MetricBadgeSize;
};

const VALUE_COLORS: Record<MetricBadgeVariant, string> = {
  default: qsColors.textSecondary,
  positive: qsColors.buyGreen,
  negative: qsColors.sellRed,
  highlight: qsColors.metricHighlight,
};

const LABEL_SIZES: Record<MetricBadgeSize, number> = { sm: 9, md: 12, lg: 13 };
const VALUE_SIZES: Record<MetricBadgeSize, number> = { sm: 12, md: 16, lg: 18 };
const PADDINGS: Record<MetricBadgeSize, number> = {
  sm: qsSpacing.xs,
  md: qsSpacing.md,
  lg: qsSpacing.lg,
};

export function MetricBadge({
  label,
  value,
  variant = "default",
  size = "md",
}: MetricBadgeProps) {
  return (
    <View style={[styles.container, { padding: PADDINGS[size] }, size === "sm" && styles.containerSm]}>
      <Text style={[styles.label, { fontSize: LABEL_SIZES[size] }]}>{label}</Text>
      <Text
        style={[
          styles.value,
          { fontSize: VALUE_SIZES[size], color: VALUE_COLORS[variant] },
        ]}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: qsColors.layer1,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    borderRadius: qsRadius.md,
    gap: 4,
  },
  containerSm: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: qsSpacing.sm,
    paddingVertical: 6,
  },
  label: {
    color: qsColors.textTertiary,
    fontWeight: "500",
  },
  value: {
    color: qsColors.textSecondary,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
});
