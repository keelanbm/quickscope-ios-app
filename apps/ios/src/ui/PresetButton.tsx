import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { qsColors, qsRadius } from "@/src/theme/tokens";

type PresetButtonProps = {
  label: string;
  variant: "buy" | "sell" | "neutral" | "muted";
  onPress: () => void;
  isActive?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
};

export function PresetButton({
  label,
  variant,
  onPress,
  isActive = false,
  disabled = false,
  icon,
}: PresetButtonProps) {
  const bg = isActive
    ? variant === "buy"
      ? qsColors.buyGreen
      : variant === "sell"
        ? qsColors.sellRed
        : qsColors.accent
    : variant === "buy"
      ? qsColors.buyGreenBg
      : variant === "sell"
        ? qsColors.sellRedBg
        : variant === "muted"
          ? qsColors.layer2
          : "rgba(255,255,255,0.1)";

  const border = variant === "buy"
    ? qsColors.buyGreen
    : variant === "sell"
      ? qsColors.sellRed
      : variant === "muted"
        ? qsColors.layer2
        : "rgba(255,255,255,0.15)";

  const textColor = isActive
    ? qsColors.layer0
    : variant === "buy"
      ? qsColors.buyGreen
      : variant === "sell"
        ? qsColors.sellRed
        : qsColors.textPrimary;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: bg,
          borderColor: border,
          opacity: disabled ? 0.4 : pressed ? 0.8 : 1,
        },
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={styles.content}>
        {icon}
        <Text style={[styles.text, { color: textColor }]}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    height: 40,
    borderRadius: qsRadius.lg,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 60,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  text: {
    fontSize: 14,
    fontWeight: "600",
  },
});
