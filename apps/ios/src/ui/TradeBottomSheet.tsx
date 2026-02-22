/**
 * TradeBottomSheet — expandable bottom sheet with full trade form
 *
 * Features:
 * - Buy/Sell tabs with color-coded UI
 * - Market/Limit mode toggle
 * - Custom amount input with preset buttons
 * - Limit mode: trigger MC input, expiration pills, order type auto-detection
 * - Configurable SOL preset buttons for buy
 * - Configurable percentage sell buttons
 * - Settings info row with profile pills, slippage, and gear icon
 * - Quote request handler (market) / order creation handler (limit)
 * - Haptic feedback on interactions
 * - Syncs with external activeSide prop (from QuickTradePanel)
 */

import React, { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import type { BottomSheetBackdropProps } from "@gorhom/bottom-sheet";
import { qsColors, qsRadius, qsSpacing, qsShadows, qsTypography } from "@/src/theme/tokens";
import { PresetButton } from "@/src/ui/PresetButton";
import { ChevronDown, X, Settings, Zap } from "@/src/ui/icons";
import { haptics } from "@/src/lib/haptics";
import { formatSlippage } from "@/src/features/trade/tradeSettings";
import {
  EXPIRATION_PRESETS,
  DEFAULT_EXPIRATION_SECONDS,
  detectOrderType,
  calcTriggerPrice,
  orderTypeLabel,
  type OrderType,
  type CreateTriggerOrderParams,
} from "@/src/features/trade/triggerOrderService";

type TradeMode = "market" | "limit" | "instant";

const MODE_LABELS: Record<TradeMode, string> = {
  market: "Market",
  limit: "Limit",
  instant: "Instant",
};

type TradeBottomSheetProps = {
  tokenAddress: string;
  tokenSymbol: string;
  tokenDecimals: number;
  userBalance?: number;
  /** SOL wallet balance for buy mode */
  walletBalance?: number;
  /** Current market cap in USD */
  currentMarketCapUsd?: number;
  /** Token total supply (for trigger price calc) */
  tokenSupply?: number;
  onQuoteRequest: (params: {
    side: "buy" | "sell";
    amount: number;
    orderType: "market";
  }) => void;
  onLimitOrderRequest?: (params: CreateTriggerOrderParams) => void;
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
  /** Wallet address for limit orders */
  walletAddress?: string;
  /** Whether a limit order is currently being submitted */
  isSubmittingOrder?: boolean;
};

export const TradeBottomSheet = forwardRef<BottomSheet, TradeBottomSheetProps>(
  (
    {
      tokenAddress,
      tokenSymbol,
      tokenDecimals,
      userBalance = 0,
      walletBalance = 0,
      currentMarketCapUsd,
      tokenSupply,
      onQuoteRequest,
      onLimitOrderRequest,
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
      walletAddress,
      isSubmittingOrder = false,
    },
    ref
  ) => {
    const snapPoints = useMemo(() => ["55%", "85%"], []);

    const [activeTab, setActiveTab] = useState<"buy" | "sell">(defaultTab);
    const [tradeMode, setTradeMode] = useState<TradeMode>("market");
    const [amount, setAmount] = useState<string>("");
    const [activePreset, setActivePreset] = useState<number | null>(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownOpacity = useRef(new Animated.Value(0)).current;

    // Limit mode state
    const [triggerMC, setTriggerMC] = useState<string>("");
    const [expirationSeconds, setExpirationSeconds] = useState(DEFAULT_EXPIRATION_SECONDS);
    const [showConfirmation, setShowConfirmation] = useState(false);

    // Sync with external activeSide prop
    useEffect(() => {
      if (activeSide && activeSide !== activeTab) {
        setActiveTab(activeSide);
      }
    }, [activeSide, activeTab]);

    // Reset limit fields when switching modes or tabs
    useEffect(() => {
      setTriggerMC("");
      setShowConfirmation(false);
    }, [tradeMode, activeTab]);

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

    // Derived limit order info
    const triggerMCNum = parseFloat(triggerMC) || 0;
    const amountNum = parseFloat(amount) || 0;

    const detectedOrderType: OrderType | null = useMemo(() => {
      if (tradeMode !== "limit" || triggerMCNum <= 0) return null;
      return detectOrderType(activeTab, triggerMCNum, currentMarketCapUsd ?? 0);
    }, [tradeMode, activeTab, triggerMCNum, currentMarketCapUsd]);

    const triggerPriceUSD = useMemo(() => {
      if (triggerMCNum <= 0 || !tokenSupply || tokenSupply <= 0) return 0;
      return calcTriggerPrice(triggerMCNum, tokenSupply);
    }, [triggerMCNum, tokenSupply]);

    // Dynamic button label
    const actionButtonLabel = useMemo(() => {
      if (tradeMode === "instant") {
        return activeTab === "buy" ? "Instant Buy" : "Instant Sell";
      }
      if (tradeMode === "market") return "Get Quote";
      if (!detectedOrderType || triggerMCNum <= 0) return "Enter Target MC";
      const mcLabel = formatCompactMC(triggerMCNum);
      return `${orderTypeLabel(detectedOrderType)} at $${mcLabel}`;
    }, [tradeMode, activeTab, detectedOrderType, triggerMCNum]);

    // Can submit?
    const canSubmit = useMemo(() => {
      if (amountNum <= 0) return false;
      if (tradeMode === "limit") {
        if (triggerMCNum <= 0) return false;
        if (!walletAddress) return false;
      }
      return true;
    }, [amountNum, tradeMode, triggerMCNum, walletAddress]);

    // Handle main button press
    const handleActionPress = useCallback(() => {
      if (!canSubmit) return;

      if (tradeMode === "market" || tradeMode === "instant") {
        onQuoteRequest({
          side: activeTab,
          amount: amountNum,
          orderType: "market",
        });
        return;
      }

      // Limit mode — show confirmation
      if (!showConfirmation) {
        setShowConfirmation(true);
        haptics.light();
        return;
      }

      // Confirmed — submit limit order
      if (!detectedOrderType || !walletAddress || !onLimitOrderRequest) return;

      onLimitOrderRequest({
        walletAddress,
        mint: tokenAddress,
        orderType: detectedOrderType,
        inputAmount: amountNum,
        tokenDecimals,
        triggerPriceUSD,
        expiresIn: expirationSeconds,
        slippageBps,
        priorityFeeLamports: priorityLamports,
        jitoTipLamports: 0,
      });
    }, [
      canSubmit,
      tradeMode,
      activeTab,
      amountNum,
      onQuoteRequest,
      showConfirmation,
      detectedOrderType,
      walletAddress,
      onLimitOrderRequest,
      tokenAddress,
      tokenDecimals,
      triggerPriceUSD,
      expirationSeconds,
      slippageBps,
      priorityLamports,
    ]);

    // Handle tab change
    const handleTabChange = useCallback((tab: "buy" | "sell") => {
      haptics.selection();
      setActiveTab(tab);
      setShowConfirmation(false);
    }, []);

    // Handle dropdown toggle
    const toggleDropdown = useCallback(() => {
      haptics.light();
      if (dropdownOpen) {
        Animated.timing(dropdownOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }).start(() => setDropdownOpen(false));
      } else {
        setDropdownOpen(true);
        Animated.timing(dropdownOpacity, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }).start();
      }
    }, [dropdownOpen, dropdownOpacity]);

    // Handle mode change via dropdown
    const handleModeSelect = useCallback((mode: TradeMode) => {
      haptics.selection();
      setTradeMode(mode);

      // Close dropdown
      Animated.timing(dropdownOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => setDropdownOpen(false));

      // Auto-expand sheet for limit mode, compact for others
      if (mode === "limit" && ref && typeof ref !== "function" && ref.current) {
        ref.current.snapToIndex(1); // 85%
      } else if (mode !== "limit" && ref && typeof ref !== "function" && ref.current) {
        ref.current.snapToIndex(0); // 55%
      }
    }, [dropdownOpacity, ref]);

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

    // Handle cancel confirmation
    const handleCancelConfirmation = useCallback(() => {
      setShowConfirmation(false);
    }, []);

    // Use configurable presets or defaults
    const defaultBuyPresets = [0.25, 0.5, 1, 5];
    const defaultSellPresets = [0.25, 0.5, 0.75, 1];

    const buyPresets = buyPresetsProps || defaultBuyPresets;
    const sellPresets = sellPresetsProps || defaultSellPresets;

    // Build buy preset buttons
    const buyPresetButtons = buyPresets.map((value, index) => ({
      label: ` ${value}`,
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
          {/* Header: Title + Mode Dropdown + Close */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Trade {tokenSymbol}</Text>

            <View style={styles.headerRight}>
              {/* Mode Dropdown */}
              <View style={styles.dropdownAnchor}>
                <Pressable
                  onPress={toggleDropdown}
                  style={({ pressed }) => [
                    styles.modeTrigger,
                    { opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  {tradeMode === "instant" && (
                    <Zap size={12} color={qsColors.accent} />
                  )}
                  <Text style={styles.modeTriggerText}>
                    {MODE_LABELS[tradeMode]}
                  </Text>
                  <ChevronDown
                    size={14}
                    color={qsColors.textTertiary}
                    style={dropdownOpen ? { transform: [{ rotate: "180deg" }] } : undefined}
                  />
                </Pressable>

                {dropdownOpen && (
                  <Animated.View style={[styles.dropdownMenu, { opacity: dropdownOpacity }]}>
                    {(["market", "limit", "instant"] as const).map((mode) => {
                      const isActive = tradeMode === mode;
                      return (
                        <Pressable
                          key={mode}
                          onPress={() => handleModeSelect(mode)}
                          style={({ pressed }) => [
                            styles.dropdownItem,
                            isActive && styles.dropdownItemActive,
                            { opacity: pressed ? 0.7 : 1 },
                          ]}
                        >
                          {mode === "instant" && (
                            <Zap size={12} color={isActive ? qsColors.accent : qsColors.textTertiary} />
                          )}
                          <Text
                            style={[
                              styles.dropdownItemText,
                              isActive && styles.dropdownItemTextActive,
                            ]}
                          >
                            {MODE_LABELS[mode]}
                          </Text>
                          {mode === "limit" && (
                            <Text style={styles.dropdownHint}>Expand</Text>
                          )}
                        </Pressable>
                      );
                    })}
                  </Animated.View>
                )}
              </View>

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

          {/* ── Limit Mode Fields ── */}
          {tradeMode === "limit" && (
            <View style={styles.limitSection}>
              {/* Trigger MC Input */}
              <Text style={styles.limitLabel}>Target Market Cap</Text>
              <View style={styles.inputContainer}>
                <View style={styles.mcInputRow}>
                  <Text style={styles.mcPrefix}>$</Text>
                  <TextInput
                    style={[styles.input, styles.mcInput]}
                    placeholder="e.g. 500000"
                    placeholderTextColor={qsColors.textMuted}
                    value={triggerMC}
                    onChangeText={(text) => {
                      setTriggerMC(text);
                      setShowConfirmation(false);
                    }}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Current MC reference */}
              {currentMarketCapUsd !== undefined && currentMarketCapUsd > 0 && (
                <Text style={styles.mcReference}>
                  Current MC: ${formatCompactMC(currentMarketCapUsd)}
                </Text>
              )}

              {/* Expiration Pills */}
              <Text style={styles.limitLabel}>Expires In</Text>
              <View style={styles.expirationRow}>
                {EXPIRATION_PRESETS.map((preset) => {
                  const isActive = expirationSeconds === preset.seconds;
                  return (
                    <Pressable
                      key={preset.label}
                      onPress={() => {
                        haptics.light();
                        setExpirationSeconds(preset.seconds);
                      }}
                      style={[
                        styles.expirationPill,
                        isActive && styles.expirationPillActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.expirationText,
                          isActive && styles.expirationTextActive,
                        ]}
                      >
                        {preset.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* Inline Confirmation (limit mode only) */}
          {showConfirmation && tradeMode === "limit" && detectedOrderType && (
            <View style={styles.confirmationBox}>
              <Text style={styles.confirmTitle}>Confirm Order</Text>
              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>Type</Text>
                <Text style={styles.confirmValue}>{orderTypeLabel(detectedOrderType)}</Text>
              </View>
              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>Amount</Text>
                <Text style={styles.confirmValue}>
                  {amountNum} {activeTab === "buy" ? "SOL" : tokenSymbol}
                </Text>
              </View>
              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>Trigger MC</Text>
                <Text style={styles.confirmValue}>${formatCompactMC(triggerMCNum)}</Text>
              </View>
              {triggerPriceUSD > 0 && (
                <View style={styles.confirmRow}>
                  <Text style={styles.confirmLabel}>Trigger Price</Text>
                  <Text style={styles.confirmValue}>${triggerPriceUSD.toFixed(10)}</Text>
                </View>
              )}
              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>Slippage</Text>
                <Text style={styles.confirmValue}>{formatSlippage(slippageBps)}</Text>
              </View>
              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>Expires</Text>
                <Text style={styles.confirmValue}>
                  {EXPIRATION_PRESETS.find((p) => p.seconds === expirationSeconds)?.label ?? "—"}
                </Text>
              </View>

              <View style={styles.confirmActions}>
                <Pressable
                  onPress={handleCancelConfirmation}
                  style={({ pressed }) => [
                    styles.confirmCancelBtn,
                    { opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <Text style={styles.confirmCancelText}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleActionPress}
                  disabled={isSubmittingOrder}
                  style={({ pressed }) => [
                    styles.confirmSubmitBtn,
                    activeTab === "buy" ? styles.quoteButtonBuy : styles.quoteButtonSell,
                    { opacity: pressed || isSubmittingOrder ? 0.6 : 1 },
                  ]}
                >
                  {isSubmittingOrder ? (
                    <ActivityIndicator size="small" color={qsColors.layer0} />
                  ) : (
                    <Text style={styles.quoteButtonText}>Confirm</Text>
                  )}
                </Pressable>
              </View>
            </View>
          )}

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

          {/* Action Button (Get Quote / Limit Order) */}
          {!showConfirmation && (
            <Pressable
              onPress={handleActionPress}
              disabled={!canSubmit || isSubmittingOrder}
              style={({ pressed }) => [
                styles.quoteButton,
                activeTab === "buy"
                  ? styles.quoteButtonBuy
                  : styles.quoteButtonSell,
                { opacity: pressed || !canSubmit || isSubmittingOrder ? 0.5 : 1 },
              ]}
            >
              {isSubmittingOrder ? (
                <ActivityIndicator size="small" color={qsColors.layer0} />
              ) : (
                <Text style={styles.quoteButtonText}>{actionButtonLabel}</Text>
              )}
            </Pressable>
          )}
        </BottomSheetView>
      </BottomSheet>
    );
  }
);

TradeBottomSheet.displayName = "TradeBottomSheet";

// ── Helpers ──────────────────────────────────────

function formatCompactMC(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toFixed(0);
}

// ── Styles ───────────────────────────────────────

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
    marginBottom: qsSpacing.md,
    zIndex: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: qsTypography.weight.bold,
    color: qsColors.textPrimary,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: qsSpacing.sm,
  },
  closeButton: {
    padding: qsSpacing.xs,
  },

  /* Mode dropdown */
  dropdownAnchor: {
    position: "relative",
    zIndex: 20,
  },
  modeTrigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: qsSpacing.md,
    paddingVertical: qsSpacing.xs,
    borderRadius: qsRadius.md,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    backgroundColor: qsColors.layer2,
  },
  modeTriggerText: {
    fontSize: 13,
    fontWeight: qsTypography.weight.semi,
    color: qsColors.textPrimary,
  },
  dropdownMenu: {
    position: "absolute",
    top: "100%",
    right: 0,
    marginTop: 4,
    backgroundColor: qsColors.layer2,
    borderRadius: qsRadius.md,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    minWidth: 140,
    overflow: "hidden",
    ...qsShadows.md,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: qsSpacing.md,
    paddingVertical: qsSpacing.sm,
  },
  dropdownItemActive: {
    backgroundColor: qsColors.layer3,
  },
  dropdownItemText: {
    fontSize: 14,
    fontWeight: qsTypography.weight.semi,
    color: qsColors.textSecondary,
  },
  dropdownItemTextActive: {
    color: qsColors.textPrimary,
  },
  dropdownHint: {
    marginLeft: "auto",
    fontSize: 10,
    fontWeight: qsTypography.weight.medium,
    color: qsColors.textSubtle,
  },

  /* Buy / Sell tabs */
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

  /* Balance */
  balanceText: {
    fontSize: 13,
    color: qsColors.textSecondary,
    marginBottom: qsSpacing.sm,
  },

  /* Amount input */
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

  /* Preset buttons */
  presetContainer: {
    flexDirection: "row",
    gap: qsSpacing.sm,
    marginBottom: qsSpacing.md,
  },

  /* ── Limit mode fields ── */
  limitSection: {
    marginBottom: qsSpacing.sm,
  },
  limitLabel: {
    fontSize: 13,
    fontWeight: qsTypography.weight.semi,
    color: qsColors.textSecondary,
    marginBottom: qsSpacing.xs,
  },
  mcInputRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  mcPrefix: {
    position: "absolute",
    left: qsSpacing.md,
    zIndex: 1,
    fontSize: 16,
    color: qsColors.textTertiary,
    fontWeight: qsTypography.weight.semi,
  },
  mcInput: {
    flex: 1,
    paddingLeft: qsSpacing.xl + qsSpacing.xs,
  },
  mcReference: {
    fontSize: 12,
    color: qsColors.textTertiary,
    marginTop: -qsSpacing.sm,
    marginBottom: qsSpacing.md,
  },
  expirationRow: {
    flexDirection: "row",
    gap: qsSpacing.sm,
    marginBottom: qsSpacing.md,
  },
  expirationPill: {
    paddingHorizontal: qsSpacing.lg,
    paddingVertical: qsSpacing.sm,
    borderRadius: qsRadius.pill,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    backgroundColor: qsColors.layer2,
  },
  expirationPillActive: {
    borderColor: qsColors.accent,
    backgroundColor: "rgba(119, 102, 247, 0.12)",
  },
  expirationText: {
    fontSize: 13,
    fontWeight: qsTypography.weight.semi,
    color: qsColors.textTertiary,
  },
  expirationTextActive: {
    color: qsColors.textPrimary,
  },

  /* ── Inline confirmation ── */
  confirmationBox: {
    backgroundColor: qsColors.layer2,
    borderRadius: qsRadius.md,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    padding: qsSpacing.md,
    marginBottom: qsSpacing.md,
  },
  confirmTitle: {
    fontSize: 14,
    fontWeight: qsTypography.weight.bold,
    color: qsColors.textPrimary,
    marginBottom: qsSpacing.sm,
  },
  confirmRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  confirmLabel: {
    fontSize: 13,
    color: qsColors.textTertiary,
  },
  confirmValue: {
    fontSize: 13,
    fontWeight: qsTypography.weight.semi,
    color: qsColors.textPrimary,
    fontVariant: ["tabular-nums"],
  },
  confirmActions: {
    flexDirection: "row",
    gap: qsSpacing.sm,
    marginTop: qsSpacing.md,
  },
  confirmCancelBtn: {
    flex: 1,
    height: 40,
    borderRadius: qsRadius.md,
    backgroundColor: qsColors.layer3,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmCancelText: {
    fontSize: 14,
    fontWeight: qsTypography.weight.semi,
    color: qsColors.textSecondary,
  },
  confirmSubmitBtn: {
    flex: 1,
    height: 40,
    borderRadius: qsRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },

  /* Settings row */
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

  /* Action button */
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
