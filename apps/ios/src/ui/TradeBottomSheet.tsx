/**
 * TradeBottomSheet — expandable bottom sheet with full trade form
 *
 * Features:
 * - Buy/Sell tabs with color-coded UI
 * - Market orders only (no order type selector)
 * - Custom amount input with preset buttons
 * - Configurable SOL preset buttons for buy
 * - Configurable percentage sell buttons
 * - Settings info row with profile pills, slippage, and gear icon
 * - Quote request handler
 * - Haptic feedback on interactions
 * - Syncs with external activeSide prop (from QuickTradePanel)
 */

import React, { forwardRef, useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import type { BottomSheetBackdropProps } from "@gorhom/bottom-sheet";
import { qsColors, qsRadius, qsSpacing, qsTypography } from "@/src/theme/tokens";
import { PresetButton } from "@/src/ui/PresetButton";
import { X, Settings } from "@/src/ui/icons";
import { haptics } from "@/src/lib/haptics";
import { formatSlippage } from "@/src/features/trade/tradeSettings";

type TradeBottomSheetProps = {
  tokenAddress: string;
  tokenSymbol: string;
  tokenDecimals: number;
  userBalance?: number;
  /** SOL wallet balance for buy mode */
  walletBalance?: number;
  onQuoteRequest: (params: {
    side: "buy" | "sell";
    amount: number;
    orderType: "market";
  }) => void;
  onClose: () => void;
  onSettingsPress?: () => void;
  onProfilePress?: (index: 0 | 1 | 2) => void;
  defaultTab?: "buy" | "sell";
  /** Active side synced from QuickTradePanel */
  activeSide?: "buy" | "sell";
  activeProfileIndex?: 0 | 1 | 2;
  buyPresets?: number[];
  sellPresets?: number[];
  /** Current slippage in bps for display */
  slippageBps?: number;
  /** Current priority fee in lamports for display */
  priorityLamports?: number;
};

export const TradeBottomSheet = forwardRef<BottomSheet, TradeBottomSheetProps>(
  (
    {
      tokenSymbol,
      userBalance = 0,
      walletBalance = 0,
      onQuoteRequest,
      onClose,
      onSettingsPress,
      onProfilePress,
      defaultTab = "buy",
      activeSide,
      activeProfileIndex = 0,
      buyPresets: buyPresetsProps,
      sellPresets: sellPresetsProps,
      slippageBps = 1500,
      priorityLamports = 100_000,
    },
    ref
  ) => {
    const snapPoints = useMemo(() => ["55%", "85%"], []);

    const [activeTab, setActiveTab] = useState<"buy" | "sell">(defaultTab);
    const [amount, setAmount] = useState<string>("");
    const [activePreset, setActivePreset] = useState<number | null>(null);

    // Sync with external activeSide prop
    useEffect(() => {
      if (activeSide && activeSide !== activeTab) {
        setActiveTab(activeSide);
      }
    }, [activeSide]);

    // Backdrop component
    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.5}
          pressBehavior="close"
        />
      ),
      []
    );

    // Handle preset button press
    const handlePresetPress = useCallback((value: number, index: number) => {
      haptics.light();
      setAmount(value.toString());
      setActivePreset(index);
    }, []);

    // Handle amount input change
    const handleAmountChange = useCallback((text: string) => {
      setAmount(text);
      setActivePreset(null);
    }, []);

    // Handle get quote button
    const handleGetQuote = useCallback(() => {
      const numericAmount = parseFloat(amount);
      if (!isNaN(numericAmount) && numericAmount > 0) {
        onQuoteRequest({
          side: activeTab,
          amount: numericAmount,
          orderType: "market",
        });
      }
    }, [amount, activeTab, onQuoteRequest]);

    // Handle tab change
    const handleTabChange = useCallback((tab: "buy" | "sell") => {
      haptics.selection();
      setActiveTab(tab);
    }, []);

    // Handle profile pill press
    const handleProfilePress = useCallback((index: 0 | 1 | 2) => {
      haptics.light();
      onProfilePress?.(index);
    }, [onProfilePress]);

    // Handle settings press
    const handleSettingsPress = useCallback(() => {
      haptics.light();
      onSettingsPress?.();
    }, [onSettingsPress]);

    // Use configurable presets or defaults
    const defaultBuyPresets = [0.25, 0.5, 1, 5];
    const defaultSellPresets = [0.25, 0.5, 0.75, 1];

    const buyPresets = buyPresetsProps || defaultBuyPresets;
    const sellPresets = sellPresetsProps || defaultSellPresets;

    // Build buy preset buttons
    const buyPresetButtons = buyPresets.map((value, index) => ({
      label: `◎${value}`,
      value,
      index,
    }));

    // Build sell preset buttons (as fractions of balance)
    const sellPresetButtons = sellPresets.map((fraction, index) => ({
      label: `${(fraction * 100).toFixed(0)}%`,
      value: userBalance * fraction,
      index,
    }));

    return (
      <BottomSheet
        ref={ref}
        snapPoints={snapPoints}
        index={-1}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.handleIndicator}
        onClose={onClose}
      >
        <BottomSheetView style={styles.contentContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Trade {tokenSymbol}</Text>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeButton,
                { opacity: pressed ? 0.6 : 1 },
              ]}
            >
              <X size={20} color={qsColors.textSecondary} />
            </Pressable>
          </View>

          {/* Tab Selector */}
          <View style={styles.tabContainer}>
            <Pressable
              onPress={() => handleTabChange("buy")}
              style={({ pressed }) => [
                styles.tab,
                activeTab === "buy" && styles.tabActiveBuy,
                { opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "buy"
                    ? styles.tabTextActiveBuy
                    : styles.tabTextInactive,
                ]}
              >
                Buy
              </Text>
            </Pressable>
            <Pressable
              onPress={() => handleTabChange("sell")}
              style={({ pressed }) => [
                styles.tab,
                activeTab === "sell" && styles.tabActiveSell,
                { opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "sell"
                    ? styles.tabTextActiveSell
                    : styles.tabTextInactive,
                ]}
              >
                Sell
              </Text>
            </Pressable>
          </View>

          {/* Balance Display */}
          {activeTab === "sell" ? (
            <Text style={styles.balanceText}>
              Your balance: {userBalance.toFixed(6)} {tokenSymbol}
            </Text>
          ) : (
            <Text style={styles.balanceText}>
              SOL balance: ◎{walletBalance.toFixed(6)}
            </Text>
          )}

          {/* Amount Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder={activeTab === "buy" ? "Enter SOL amount" : "Enter amount"}
              placeholderTextColor={qsColors.textMuted}
              value={amount}
              onChangeText={handleAmountChange}
              keyboardType="numeric"
            />
          </View>

          {/* Preset Buttons */}
          <View style={styles.presetContainer}>
            {activeTab === "buy"
              ? buyPresetButtons.map((preset) => (
                  <PresetButton
                    key={preset.label}
                    label={preset.label}
                    variant="buy"
                    onPress={() => handlePresetPress(preset.value, preset.index)}
                    isActive={activePreset === preset.index}
                  />
                ))
              : sellPresetButtons.map((preset) => (
                  <PresetButton
                    key={preset.label}
                    label={preset.label}
                    variant="sell"
                    onPress={() => handlePresetPress(preset.value, preset.index)}
                    isActive={activePreset === preset.index}
                  />
                ))}
          </View>

          {/* Settings Info Row */}
          <View style={styles.settingsRow}>
            {/* Profile Pills */}
            <View style={styles.profilePills}>
              {([0, 1, 2] as const).map((index) => (
                <Pressable
                  key={index}
                  onPress={() => handleProfilePress(index)}
                  style={({ pressed }) => [
                    styles.profilePill,
                    activeProfileIndex === index && styles.profilePillActive,
                    { opacity: pressed ? 0.7 : 1 },
                  ]}
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

            {/* Slippage Display */}
            <View style={styles.settingsInfo}>
              <Text style={styles.settingsLabel}>Slippage:</Text>
              <Text style={styles.settingsValue}>{formatSlippage(slippageBps)}</Text>
            </View>

            {/* Settings Gear */}
            <Pressable
              onPress={handleSettingsPress}
              style={({ pressed }) => [
                styles.settingsButton,
                { opacity: pressed ? 0.6 : 1 },
              ]}
            >
              <Settings size={20} color={qsColors.textSecondary} />
            </Pressable>
          </View>

          {/* Get Quote Button */}
          <Pressable
            onPress={handleGetQuote}
            style={({ pressed }) => [
              styles.quoteButton,
              activeTab === "buy"
                ? styles.quoteButtonBuy
                : styles.quoteButtonSell,
              { opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Text style={styles.quoteButtonText}>Get Quote</Text>
          </Pressable>
        </BottomSheetView>
      </BottomSheet>
    );
  }
);

TradeBottomSheet.displayName = "TradeBottomSheet";

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: qsColors.layer1,
    borderTopLeftRadius: qsRadius.lg,
    borderTopRightRadius: qsRadius.lg,
  },
  handleIndicator: {
    backgroundColor: qsColors.layer3,
    width: 40,
    height: 4,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: qsSpacing.lg,
    paddingBottom: qsSpacing.xl,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: qsSpacing.lg,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: qsTypography.weight.bold,
    color: qsColors.textPrimary,
  },
  closeButton: {
    padding: qsSpacing.xs,
  },
  tabContainer: {
    flexDirection: "row",
    gap: qsSpacing.sm,
    marginBottom: qsSpacing.lg,
  },
  tab: {
    flex: 1,
    height: 44,
    borderRadius: qsRadius.lg,
    borderWidth: 1,
    borderColor: qsColors.layer3,
    backgroundColor: qsColors.layer2,
    alignItems: "center",
    justifyContent: "center",
  },
  tabActiveBuy: {
    backgroundColor: qsColors.buyGreenBg,
    borderColor: qsColors.buyGreen,
  },
  tabActiveSell: {
    backgroundColor: qsColors.sellRedBg,
    borderColor: qsColors.sellRed,
  },
  tabText: {
    fontSize: 16,
    fontWeight: qsTypography.weight.semi,
  },
  tabTextActiveBuy: {
    color: qsColors.buyGreen,
  },
  tabTextActiveSell: {
    color: qsColors.sellRed,
  },
  tabTextInactive: {
    color: qsColors.textMuted,
  },
  balanceText: {
    fontSize: 13,
    color: qsColors.textSecondary,
    marginBottom: qsSpacing.sm,
  },
  inputContainer: {
    marginBottom: qsSpacing.md,
  },
  input: {
    backgroundColor: qsColors.layer2,
    borderWidth: 1,
    borderColor: qsColors.layer3,
    borderRadius: qsRadius.md,
    paddingHorizontal: qsSpacing.md,
    paddingVertical: qsSpacing.md,
    fontSize: 16,
    color: qsColors.textPrimary,
  },
  presetContainer: {
    flexDirection: "row",
    gap: qsSpacing.sm,
    marginBottom: qsSpacing.md,
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: qsSpacing.xl,
    paddingVertical: qsSpacing.sm,
    paddingHorizontal: qsSpacing.xs,
  },
  profilePills: {
    flexDirection: "row",
    gap: qsSpacing.xs,
  },
  profilePill: {
    paddingHorizontal: qsSpacing.sm,
    paddingVertical: qsSpacing.xxs,
    borderRadius: qsRadius.sm,
    borderWidth: 1,
    borderColor: qsColors.layer3,
    backgroundColor: qsColors.layer2,
    minWidth: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  profilePillActive: {
    backgroundColor: qsColors.brandDark,
    borderColor: qsColors.brand,
  },
  profilePillText: {
    fontSize: 12,
    fontWeight: qsTypography.weight.semi,
    color: qsColors.textMuted,
  },
  profilePillTextActive: {
    color: qsColors.brand,
  },
  settingsInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: qsSpacing.xxs,
    flex: 1,
    justifyContent: "center",
  },
  settingsLabel: {
    fontSize: 13,
    color: qsColors.textMuted,
  },
  settingsValue: {
    fontSize: 13,
    fontWeight: qsTypography.weight.semi,
    color: qsColors.textPrimary,
  },
  settingsButton: {
    padding: qsSpacing.xs,
  },
  quoteButton: {
    height: 48,
    borderRadius: qsRadius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  quoteButtonBuy: {
    backgroundColor: qsColors.buyGreen,
  },
  quoteButtonSell: {
    backgroundColor: qsColors.sellRed,
  },
  quoteButtonText: {
    fontSize: 14,
    fontWeight: qsTypography.weight.bold,
    color: qsColors.layer0,
  },
});
