/**
 * Reusable empty state component with icon, title, and subtitle.
 *
 * Provides a consistent look across all screens when
 * lists or sections have no data to display.
 */
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { LucideIcon } from "lucide-react-native";

import { qsColors, qsRadius, qsSpacing, qsTypography } from "@/src/theme/tokens";

type EmptyStateProps = {
  /** Lucide icon component to render above the title. */
  icon: LucideIcon;
  /** Primary message — short, scannable. */
  title: string;
  /** Supporting detail or call-to-action hint. */
  subtitle?: string;
  /** Icon size in px (default 32). */
  iconSize?: number;
  /** Optional override for icon colour. */
  iconColor?: string;
};

export function EmptyState({
  icon: Icon,
  title,
  subtitle,
  iconSize = 32,
  iconColor = qsColors.textMuted,
}: EmptyStateProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.iconCircle}>
        <Icon size={iconSize} color={iconColor} strokeWidth={1.5} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: qsRadius.lg,
    backgroundColor: qsColors.layer1,
    padding: qsSpacing.xl,
    gap: qsSpacing.sm,
    alignItems: "center",
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: qsColors.layer2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: qsSpacing.xs,
  },
  title: {
    color: qsColors.textPrimary,
    fontSize: qsTypography.size.md,
    fontWeight: qsTypography.weight.semi,
    textAlign: "center",
  },
  subtitle: {
    color: qsColors.textMuted,
    fontSize: qsTypography.size.sm,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 260,
  },
});
