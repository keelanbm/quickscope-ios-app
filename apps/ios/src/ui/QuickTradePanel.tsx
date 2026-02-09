import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { haptics } from "@/src/lib/haptics";
import { qsColors, qsRadius, qsSpacing, qsShadows, qsTypography } from "@/src/theme/tokens";
import { PresetButton } from "@/src/ui/PresetButton";
import { Settings } from "@/src/ui/icons";

type QuickTradePanelProps = {
  tokenSymbol: string;
  tokenAddress: string;
  walletBalance?: number;
  /** Token balance for sell mode */
  tokenBalance?: number;
  onPresetPress: (params: { side: "buy" | "sell"; amount: number }) => void;
  onExpandPress: () => void;
  onSettingsPress?: () => void;
  onProfilePress?: (index: 0 | 1 | 2) => void;
  onSideChange?: (side: "buy" | "sell") => void;
  disabled?: boolean;
  buyPresets?: number[];
  sellPresets?: number[];
  activeSide?: "buy" | "sell";
  activeProfileIndex?: 0 | 1 | 2;
};

/**
 * QuickTradePanel - Persistent collapsed trade panel at the bottom of token detail screen.
 *
 * Features:
 * - Buy/Sell toggle with color-coded UI
 * - Dynamic presets: SOL amounts for buy, percentages for sell
 * - Profile pills (P1, P2, P3) for quick profile switching
 * - Wallet/token balance display
 * - Settings gear icon
 *
 * Usage:
 * <QuickTradePanel
 *   tokenSymbol="SOL"
 *   tokenAddress="So11111..."
 *   walletBalance={2.45}
 *   tokenBalance={100}
 *   onPresetPress={({ side, amount }) => handlePreset(side, amount)}
 *   onExpandPress={() => navigation.navigate("TradeEntry")}
 *   onSettingsPress={() => navigation.navigate("Settings")}
 *   onProfilePress={(idx) => setActiveProfile(idx)}
 *   activeSide="buy"
 *   activeProfileIndex={0}
 * />
 */
export function QuickTradePanel({
  tokenSymbol,
  tokenAddress,
  walletBalance = 0,
  tokenBalance = 0,
  onPresetPress,
  onExpandPress,
  onSettingsPress,
  onProfilePress,
  onSideChange,
  disabled = false,
  buyPresets = [0.25, 0.5, 1, 5],
  sellPresets = [25, 50, 75, 100],
  activeSide = "buy",
  activeProfileIndex = 0,
}: QuickTradePanelProps) {
  const insets = useSafeAreaInsets();
  const [side, setSide] = useState<"buy" | "sell">(activeSide);

  const isBuy = side === "buy";
  const currentBalance = isBuy ? walletBalance : tokenBalance;
  const balanceLabel = isBuy ? "SOL" : tokenSymbol;

  const handleSideToggle = (newSide: "buy" | "sell") => {
    if (newSide === side || disabled) return;
    haptics.selection();
    setSide(newSide);
    onSideChange?.(newSide);
  };

  const handleProfilePress = (index: 0 | 1 | 2) => {
    if (disabled) return;
    haptics.selection();
    onProfilePress?.(index);
  };

  const handlePresetPress = (amount: number) => {
    haptics.light();
    onPresetPress({ side, amount });
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: qsSpacing.lg + insets.bottom,
        },
      ]}
    >
      {/* Buy/Sell Toggle + Settings */}
      <View style={styles.topRow}>
        <View style={styles.sideToggle}>
          <Pressable
            onPress={() => handleSideToggle("buy")}
            disabled={disabled}
            style={({ pressed }) => [
              styles.sideToggleButton,
              isBuy && styles.sideToggleButtonActive,
              isBuy && styles.sideToggleButtonBuy,
              { opacity: disabled ? 0.4 : pressed ? 0.8 : 1 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Buy"
            accessibilityState={{ selected: isBuy }}
          >
            <Text
              style={[
                styles.sideToggleText,
                isBuy && styles.sideToggleTextActive,
                isBuy && styles.sideToggleTextBuy,
              ]}
            >
              BUY
            </Text>
          </Pressable>

          <Pressable
            onPress={() => handleSideToggle("sell")}
            disabled={disabled}
            style={({ pressed }) => [
              styles.sideToggleButton,
              !isBuy && styles.sideToggleButtonActive,
              !isBuy && styles.sideToggleButtonSell,
              { opacity: disabled ? 0.4 : pressed ? 0.8 : 1 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Sell"
            accessibilityState={{ selected: !isBuy }}
          >
            <Text
              style={[
                styles.sideToggleText,
                !isBuy && styles.sideToggleTextActive,
                !isBuy && styles.sideToggleTextSell,
              ]}
            >
              SELL
            </Text>
          </Pressable>
        </View>

        {onSettingsPress && (
          <Pressable
            onPress={onSettingsPress}
            disabled={disabled}
            style={({ pressed }) => [
              styles.settingsButton,
              { opacity: disabled ? 0.4 : pressed ? 0.7 : 1 },
            ]}
            accessibilityLabel="Trade settings"
            accessibilityRole="button"
          >
            <Settings size={20} color={qsColors.textSecondary} />
          </Pressable>
        )}
      </View>

      {/* Preset Buttons */}
      <View style={styles.presetsRow}>
        {(isBuy ? buyPresets : sellPresets).map((amount, index) => (
          <PresetButton
            key={`preset-${side}-${amount}-${index}`}
            label={isBuy ? `◎${amount}` : `${amount}%`}
            variant="neutral"
            onPress={() => handlePresetPress(amount)}
            disabled={disabled}
          />
        ))}
      </View>

      {/* Balance + Profile Pills */}
      <View style={styles.bottomRow}>
        <Text style={styles.balanceText}>
          Balance: {currentBalance.toFixed(2)} {balanceLabel}
        </Text>

        {onProfilePress && (
          <View style={styles.profilePills}>
            {([0, 1, 2] as const).map((index) => (
              <Pressable
                key={`profile-${index}`}
                onPress={() => handleProfilePress(index)}
                disabled={disabled}
                style={({ pressed }) => [
                  styles.profilePill,
                  activeProfileIndex === index && styles.profilePillActive,
                  { opacity: disabled ? 0.4 : pressed ? 0.7 : 1 },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Profile ${index + 1}`}
                accessibilityState={{ selected: activeProfileIndex === index }}
              >
                <Text
                  style={[
                    styles.profilePillText,
                    activeProfileIndex === index && styles.profilePillTextActive,
                  ]}
                >
                  P{index + 1}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: qsColors.layer1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: qsSpacing.md,
    paddingHorizontal: qsSpacing.lg,
    gap: qsSpacing.md,
    ...qsShadows.lg,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sideToggle: {
    flexDirection: "row",
    backgroundColor: qsColors.layer2,
    borderRadius: qsRadius.pill,
    padding: 2,
    gap: 2,
  },
  sideToggleButton: {
    paddingHorizontal: qsSpacing.lg,
    paddingVertical: qsSpacing.xs,
    borderRadius: qsRadius.pill,
    minWidth: 72,
    alignItems: "center",
    justifyContent: "center",
  },
  sideToggleButtonActive: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sideToggleButtonBuy: {
    backgroundColor: qsColors.buyGreenBg,
  },
  sideToggleButtonSell: {
    backgroundColor: qsColors.sellRedBg,
  },
  sideToggleText: {
    fontSize: qsTypography.size.sm,
    fontWeight: qsTypography.weight.semi,
    color: qsColors.textSecondary,
  },
  sideToggleTextActive: {
    fontWeight: qsTypography.weight.bold,
  },
  sideToggleTextBuy: {
    color: qsColors.buyGreen,
  },
  sideToggleTextSell: {
    color: qsColors.sellRed,
  },
  settingsButton: {
    padding: qsSpacing.xs,
  },
  presetsRow: {
    flexDirection: "row",
    gap: qsSpacing.md,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  balanceText: {
    fontSize: qsTypography.size.sm,
    fontWeight: qsTypography.weight.medium,
    color: qsColors.textSecondary,
  },
  profilePills: {
    flexDirection: "row",
    gap: qsSpacing.xs,
  },
  profilePill: {
    paddingHorizontal: qsSpacing.sm,
    paddingVertical: qsSpacing.xs,
    borderRadius: qsRadius.md,
    backgroundColor: qsColors.layer2,
    minWidth: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  profilePillActive: {
    backgroundColor: qsColors.brand,
  },
  profilePillText: {
    fontSize: qsTypography.size.xs,
    fontWeight: qsTypography.weight.semi,
    color: qsColors.textSecondary,
  },
  profilePillTextActive: {
    color: qsColors.textPrimary,
    fontWeight: qsTypography.weight.bold,
  },
});
