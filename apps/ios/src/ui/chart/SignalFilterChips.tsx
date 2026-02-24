/**
 * SignalFilterChips — horizontal row of toggle chips for signal visibility.
 *
 * Compact (20px height) chips. Active = colored background, inactive = layer2.
 * Returns updated Set<SignalType> via onToggle callback.
 */
import React, { useCallback } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { qsColors, qsRadius, qsSpacing } from "@/src/theme/tokens";
import type { SignalType } from "@/src/ui/chart/chartTypes";
import {
  FILTER_SIGNAL_TYPES,
  SIGNAL_CONFIG,
} from "@/src/ui/chart/chartSignalTypes";

type SignalFilterChipsProps = {
  /** Currently visible signal types */
  activeTypes: Set<SignalType>;
  /** Called when a chip is toggled */
  onToggle: (type: SignalType) => void;
};

export function SignalFilterChips({ activeTypes, onToggle }: SignalFilterChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {FILTER_SIGNAL_TYPES.map((type) => (
        <ChipButton
          key={type}
          type={type}
          isActive={activeTypes.has(type)}
          onToggle={onToggle}
        />
      ))}
    </ScrollView>
  );
}

type ChipButtonProps = {
  type: SignalType;
  isActive: boolean;
  onToggle: (type: SignalType) => void;
};

function ChipButton({ type, isActive, onToggle }: ChipButtonProps) {
  const config = SIGNAL_CONFIG[type];
  const handlePress = useCallback(() => onToggle(type), [type, onToggle]);

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.chip,
        isActive
          ? { backgroundColor: config.bg, borderColor: config.fill }
          : styles.chipInactive,
        pressed && styles.chipPressed,
      ]}
    >
      {isActive ? (
        <View style={[styles.dot, { backgroundColor: config.fill }]} />
      ) : null}
      <Text
        style={[
          styles.chipText,
          { color: isActive ? config.fill : qsColors.textTertiary },
        ]}
        numberOfLines={1}
      >
        {config.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: qsSpacing.xs,
    paddingHorizontal: qsSpacing.sm,
    paddingVertical: qsSpacing.xs,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    height: 20,
    paddingHorizontal: qsSpacing.sm,
    borderRadius: qsRadius.sm,
    borderWidth: 1,
  },
  chipInactive: {
    backgroundColor: qsColors.layer2,
    borderColor: qsColors.borderSubtle,
  },
  chipPressed: {
    opacity: 0.7,
  },
  chipText: {
    fontSize: 10,
    fontWeight: "600",
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
