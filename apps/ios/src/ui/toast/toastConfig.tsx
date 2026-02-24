/**
 * Custom toast rendering styled with Quickscope design tokens.
 *
 * Usage: pass `toastConfig` to `<Toast config={toastConfig} />` in App root.
 */
import React from "react";
import { Text, View, StyleSheet } from "react-native";
import type { ToastConfigParams } from "react-native-toast-message";

import {
  qsColors,
  qsRadius,
  qsShadows,
  qsSpacing,
  qsTypography,
} from "@/src/theme/tokens";

// ── colour accents per type ─────────────────────
const ACCENT: Record<string, string> = {
  success: qsColors.success,
  error: qsColors.danger,
  info: qsColors.brand,
  warn: qsColors.warning,
};

function QSToast({ text1, text2, type }: ToastConfigParams<unknown>) {
  const accent = ACCENT[type ?? "info"] ?? qsColors.brand;

  return (
    <View style={[styles.container, { borderLeftColor: accent }]}>
      <Text style={styles.title} numberOfLines={2}>
        {text1}
      </Text>
      {text2 ? (
        <Text style={styles.message} numberOfLines={3}>
          {text2}
        </Text>
      ) : null}
    </View>
  );
}

export const toastConfig = {
  success: (props: ToastConfigParams<unknown>) => <QSToast {...props} />,
  error: (props: ToastConfigParams<unknown>) => <QSToast {...props} />,
  info: (props: ToastConfigParams<unknown>) => <QSToast {...props} />,
  warn: (props: ToastConfigParams<unknown>) => <QSToast {...props} />,
};

const styles = StyleSheet.create({
  container: {
    width: "90%",
    backgroundColor: qsColors.layer1,
    borderRadius: qsRadius.md,
    borderLeftWidth: 4,
    paddingVertical: qsSpacing.md,
    paddingHorizontal: qsSpacing.lg,
    ...qsShadows.lg,
  },
  title: {
    color: qsColors.textPrimary,
    fontSize: qsTypography.size.sm,
    fontWeight: qsTypography.weight.semi,
    lineHeight: qsTypography.lineHeight.sm,
  },
  message: {
    color: qsColors.textSecondary,
    fontSize: qsTypography.size.xs,
    fontWeight: qsTypography.weight.regular,
    lineHeight: qsTypography.lineHeight.xs,
    marginTop: qsSpacing.xs,
  },
});
