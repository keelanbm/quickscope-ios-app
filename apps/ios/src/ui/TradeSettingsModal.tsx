/**
 * TradeSettingsModal — Bottom sheet for editing trade profiles (P1/P2/P3),
 * buy/sell presets, and instant trade toggle.
 *
 * Settings are persisted to AsyncStorage via tradeSettings module.
 */
import React, { forwardRef, useCallback, useMemo, useState, useEffect } from "react";
import { Alert, Pressable, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import type { BottomSheetBackdropProps } from "@gorhom/bottom-sheet";

import {
  qsColors,
  qsRadius,
  qsSpacing,
  qsTypography,
} from "@/src/theme/tokens";
import { haptics } from "@/src/lib/haptics";
import { toast } from "@/src/lib/toast";
import {
  type TradeSettings,
  type TradeProfile,
  saveTradeSettings,
  formatSlippage,
} from "@/src/features/trade/tradeSettings";
import { X, Zap } from "@/src/ui/icons";

type TradeSettingsModalProps = {
  settings: TradeSettings;
  onSettingsChanged: (settings: TradeSettings) => void;
  onClose: () => void;
};

const SLIPPAGE_PRESETS = [500, 1000, 1500, 2500]; // bps (5%, 10%, 15%, 25%)
const PRIORITY_PRESETS = [100_000, 1_000_000, 10_000_000]; // lamports → 0.0001, 0.001, 0.01 SOL
const TIP_PRESETS = [100_000, 1_000_000, 10_000_000]; // lamports → 0.0001, 0.001, 0.01 SOL

const lamportsToSol = (lamports: number) => (lamports / 1_000_000_000).toString();

export const TradeSettingsModal = forwardRef<BottomSheet, TradeSettingsModalProps>(
  ({ settings, onSettingsChanged, onClose }, ref) => {
    const snapPoints = useMemo(() => ["80%", "95%"], []);

    const [editingIndex, setEditingIndex] = useState<0 | 1 | 2>(
      settings.activeProfileIndex
    );
    const [slippageText, setSlippageText] = useState("");
    const [priorityText, setPriorityText] = useState("");
    const [tipText, setTipText] = useState("");

    // Buy preset text fields
    const [buyPresetTexts, setBuyPresetTexts] = useState<[string, string, string, string]>(
      settings.buyPresets.map(String) as [string, string, string, string]
    );
    // Sell preset text fields
    const [sellPresetTexts, setSellPresetTexts] = useState<[string, string, string, string]>(
      settings.sellPresets.map((v) => String(v * 100)) as [string, string, string, string]
    );

    // Sync text fields when switching profiles
    useEffect(() => {
      const p = settings.profiles[editingIndex];
      setSlippageText((p.slippageBps / 100).toString());
      setPriorityText((p.priorityLamports / 1_000_000_000).toString());
      setTipText((p.tipLamports / 1_000_000_000).toString());
    }, [editingIndex, settings.profiles]);

    // Sync presets when settings change externally
    useEffect(() => {
      setBuyPresetTexts(settings.buyPresets.map(String) as [string, string, string, string]);
      setSellPresetTexts(
        settings.sellPresets.map((v) => String(v * 100)) as [string, string, string, string]
      );
    }, [settings.buyPresets, settings.sellPresets]);

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

    const handleSave = useCallback(() => {
      const slippagePct = parseFloat(slippageText);
      const prioritySol = parseFloat(priorityText);
      const tipSol = parseFloat(tipText);

      if (isNaN(slippagePct) || slippagePct <= 0 || slippagePct > 100) {
        toast.warn("Invalid slippage", "Enter a value between 0.1% and 100%");
        return;
      }

      // Parse buy presets
      const parsedBuyPresets = buyPresetTexts.map((t) => {
        const v = parseFloat(t);
        return isNaN(v) || v <= 0 ? 0.25 : v;
      }) as [number, number, number, number];

      // Parse sell presets (input as %, store as 0-1 fraction)
      const parsedSellPresets = sellPresetTexts.map((t) => {
        const v = parseFloat(t);
        return isNaN(v) || v <= 0 || v > 100 ? 0.25 : v / 100;
      }) as [number, number, number, number];

      const updated: TradeSettings = {
        ...settings,
        profiles: [...settings.profiles] as [TradeProfile, TradeProfile, TradeProfile],
        buyPresets: parsedBuyPresets,
        sellPresets: parsedSellPresets,
      };

      updated.profiles[editingIndex] = {
        slippageBps: Math.round(slippagePct * 100),
        priorityLamports: isNaN(prioritySol) ? 0 : Math.round(prioritySol * 1_000_000_000),
        tipLamports: isNaN(tipSol) ? 0 : Math.round(tipSol * 1_000_000_000),
      };

      saveTradeSettings(updated);
      onSettingsChanged(updated);
      haptics.success();
      toast.success("Settings saved", `P${editingIndex + 1} profile updated`);
    }, [slippageText, priorityText, tipText, editingIndex, settings, onSettingsChanged, buyPresetTexts, sellPresetTexts]);

    const [slippageCustomFocused, setSlippageCustomFocused] = useState(false);
    const [priorityCustomFocused, setPriorityCustomFocused] = useState(false);
    const [tipCustomFocused, setTipCustomFocused] = useState(false);

    const isSlippagePreset = SLIPPAGE_PRESETS.includes(Math.round(parseFloat(slippageText) * 100));
    const isPriorityPreset = PRIORITY_PRESETS.includes(
      Math.round(parseFloat(priorityText) * 1_000_000_000)
    );
    const isTipPreset = TIP_PRESETS.includes(
      Math.round(parseFloat(tipText) * 1_000_000_000)
    );

    const handleSlippagePreset = useCallback(
      (bps: number) => {
        setSlippageText((bps / 100).toString());
        setSlippageCustomFocused(false);
        haptics.light();
      },
      []
    );

    const handlePriorityPreset = useCallback(
      (lamports: number) => {
        setPriorityText(lamportsToSol(lamports));
        setPriorityCustomFocused(false);
        haptics.light();
      },
      []
    );

    const handleTipPreset = useCallback(
      (lamports: number) => {
        setTipText(lamportsToSol(lamports));
        setTipCustomFocused(false);
        haptics.light();
      },
      []
    );

    const handleInstantTradeToggle = useCallback(
      (value: boolean) => {
        if (value) {
          Alert.alert(
            "Enable Instant Trade?",
            "Preset taps will execute trades immediately without confirmation. Make sure your slippage and settings are correct.",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Enable",
                style: "destructive",
                onPress: () => {
                  const updated = { ...settings, instantTrade: true };
                  saveTradeSettings(updated);
                  onSettingsChanged(updated);
                  haptics.success();
                },
              },
            ]
          );
        } else {
          const updated = { ...settings, instantTrade: false };
          saveTradeSettings(updated);
          onSettingsChanged(updated);
          haptics.light();
        }
      },
      [settings, onSettingsChanged]
    );

    const updateBuyPresetText = useCallback((index: number, value: string) => {
      setBuyPresetTexts((prev) => {
        const next = [...prev] as [string, string, string, string];
        next[index] = value;
        return next;
      });
    }, []);

    const updateSellPresetText = useCallback((index: number, value: string) => {
      setSellPresetTexts((prev) => {
        const next = [...prev] as [string, string, string, string];
        next[index] = value;
        return next;
      });
    }, []);

    return (
      <BottomSheet
        ref={ref}
        snapPoints={snapPoints}
        index={-1}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.sheetBg}
        handleIndicatorStyle={styles.handle}
        onClose={onClose}
      >
        <BottomSheetScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Trade Settings</Text>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeBtn,
                { opacity: pressed ? 0.6 : 1 },
              ]}
            >
              <X size={20} color={qsColors.textSecondary} />
            </Pressable>
          </View>

          {/* Profile Tabs */}
          <View style={styles.profileRow}>
            {([0, 1, 2] as const).map((idx) => (
              <Pressable
                key={idx}
                onPress={() => {
                  setEditingIndex(idx);
                  haptics.selection();
                }}
                style={[
                  styles.profilePill,
                  editingIndex === idx && styles.profilePillActive,
                ]}
              >
                <Text
                  style={[
                    styles.profilePillText,
                    editingIndex === idx && styles.profilePillTextActive,
                  ]}
                >
                  P{idx + 1}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Slippage */}
          <Text style={styles.label}>Slippage (%)</Text>
          <View style={styles.presetRow}>
            {SLIPPAGE_PRESETS.map((bps) => {
              const active = !slippageCustomFocused && Math.round(parseFloat(slippageText) * 100) === bps;
              return (
                <Pressable
                  key={bps}
                  onPress={() => handleSlippagePreset(bps)}
                  style={[
                    styles.presetChip,
                    active && styles.presetChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.presetChipText,
                      active && styles.presetChipTextActive,
                    ]}
                  >
                    {formatSlippage(bps)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <TextInput
            style={styles.fullWidthInput}
            value={slippageText}
            onChangeText={setSlippageText}
            onFocus={() => setSlippageCustomFocused(true)}
            onBlur={() => setSlippageCustomFocused(false)}
            keyboardType="decimal-pad"
            placeholder="Custom slippage"
            placeholderTextColor={qsColors.textMuted}
          />

          {/* Priority Fee */}
          <Text style={styles.label}>Priority Fee (SOL)</Text>
          <TextInput
            style={styles.fullWidthInput}
            value={priorityText}
            onChangeText={setPriorityText}
            onFocus={() => setPriorityCustomFocused(true)}
            onBlur={() => setPriorityCustomFocused(false)}
            keyboardType="decimal-pad"
            placeholder="0.0001"
            placeholderTextColor={qsColors.textMuted}
          />

          {/* Jito Tip */}
          <Text style={styles.label}>Jito Tip (SOL)</Text>
          <TextInput
            style={styles.fullWidthInput}
            value={tipText}
            onChangeText={setTipText}
            onFocus={() => setTipCustomFocused(true)}
            onBlur={() => setTipCustomFocused(false)}
            keyboardType="decimal-pad"
            placeholder="0.0001"
            placeholderTextColor={qsColors.textMuted}
          />

          {/* ── Buy Presets ── */}
          <Text style={styles.sectionTitle}>Buy Presets (SOL)</Text>
          <View style={styles.presetsInputRow}>
            {buyPresetTexts.map((text, index) => (
              <TextInput
                key={`buy-${index}`}
                style={styles.presetInput}
                value={text}
                onChangeText={(v) => updateBuyPresetText(index, v)}
                keyboardType="decimal-pad"
                placeholder={`${settings.buyPresets[index]}`}
                placeholderTextColor={qsColors.textMuted}
              />
            ))}
          </View>

          {/* ── Sell Presets ── */}
          <Text style={styles.sectionTitle}>Sell Presets (%)</Text>
          <View style={styles.presetsInputRow}>
            {sellPresetTexts.map((text, index) => (
              <TextInput
                key={`sell-${index}`}
                style={styles.presetInput}
                value={text}
                onChangeText={(v) => updateSellPresetText(index, v)}
                keyboardType="decimal-pad"
                placeholder={`${settings.sellPresets[index] * 100}`}
                placeholderTextColor={qsColors.textMuted}
              />
            ))}
          </View>

          {/* ── Instant Trade Toggle ── */}
          <View style={styles.instantTradeRow}>
            <View style={styles.instantTradeLabel}>
              <Zap size={16} color={settings.instantTrade ? qsColors.accent : qsColors.textTertiary} />
              <View style={styles.instantTradeLabelText}>
                <Text style={styles.instantTradeTitle}>Instant Trade</Text>
                <Text style={styles.instantTradeHint}>
                  Preset taps execute immediately
                </Text>
              </View>
            </View>
            <Switch
              value={settings.instantTrade}
              onValueChange={handleInstantTradeToggle}
              trackColor={{ false: qsColors.layer3, true: qsColors.accent }}
              thumbColor="#ffffff"
            />
          </View>

          {/* Save Button */}
          <Pressable
            onPress={handleSave}
            style={({ pressed }) => [
              styles.saveBtn,
              { opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Text style={styles.saveBtnText}>Save P{editingIndex + 1}</Text>
          </Pressable>
        </BottomSheetScrollView>
      </BottomSheet>
    );
  }
);

TradeSettingsModal.displayName = "TradeSettingsModal";

const styles = StyleSheet.create({
  sheetBg: {
    backgroundColor: qsColors.layer1,
    borderTopLeftRadius: qsRadius.xl,
    borderTopRightRadius: qsRadius.xl,
  },
  handle: {
    backgroundColor: qsColors.layer3,
    width: 40,
    height: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: qsSpacing.lg,
  },
  scrollContent: {
    paddingBottom: qsSpacing.xxxxl,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: qsSpacing.xl,
  },
  headerTitle: {
    fontSize: qsTypography.size.lg,
    fontWeight: qsTypography.weight.bold,
    color: qsColors.textPrimary,
  },
  closeBtn: {
    padding: qsSpacing.xs,
  },
  profileRow: {
    flexDirection: "row",
    gap: qsSpacing.sm,
    marginBottom: qsSpacing.xl,
  },
  profilePill: {
    flex: 1,
    height: 40,
    borderRadius: qsRadius.md,
    borderWidth: 1,
    borderColor: qsColors.layer3,
    backgroundColor: qsColors.layer2,
    alignItems: "center",
    justifyContent: "center",
  },
  profilePillActive: {
    backgroundColor: qsColors.brandDark,
    borderColor: qsColors.brand,
  },
  profilePillText: {
    fontSize: qsTypography.size.sm,
    fontWeight: qsTypography.weight.semi,
    color: qsColors.textMuted,
  },
  profilePillTextActive: {
    color: qsColors.brand,
  },
  label: {
    fontSize: qsTypography.size.xs,
    fontWeight: qsTypography.weight.medium,
    color: qsColors.textSecondary,
    marginBottom: qsSpacing.xs,
    marginTop: qsSpacing.md,
  },
  presetRow: {
    flexDirection: "row",
    gap: qsSpacing.sm,
    marginBottom: qsSpacing.sm,
  },
  presetChip: {
    flex: 1,
    height: 36,
    borderRadius: qsRadius.sm,
    borderWidth: 1,
    borderColor: qsColors.layer3,
    backgroundColor: qsColors.layer2,
    alignItems: "center",
    justifyContent: "center",
  },
  presetChipActive: {
    backgroundColor: qsColors.brandDark,
    borderColor: qsColors.brand,
  },
  presetChipText: {
    fontSize: qsTypography.size.xxs,
    fontWeight: qsTypography.weight.medium,
    color: qsColors.textMuted,
  },
  presetChipTextActive: {
    color: qsColors.brand,
  },
  customChip: {
    flex: 1,
    height: 36,
    borderRadius: qsRadius.sm,
    borderWidth: 1,
    borderColor: qsColors.layer3,
    backgroundColor: qsColors.layer2,
    justifyContent: "center",
  },
  customChipActive: {
    borderColor: qsColors.brand,
    backgroundColor: qsColors.brandDark,
  },
  customChipInput: {
    fontSize: qsTypography.size.xxs,
    fontWeight: qsTypography.weight.medium,
    color: qsColors.brand,
    textAlign: "center",
    paddingHorizontal: qsSpacing.xs,
    paddingVertical: 0,
    height: 34,
  },

  fullWidthInput: {
    backgroundColor: qsColors.layer2,
    borderWidth: 1,
    borderColor: qsColors.layer3,
    borderRadius: qsRadius.md,
    paddingHorizontal: qsSpacing.md,
    paddingVertical: qsSpacing.sm,
    fontSize: qsTypography.size.sm,
    color: qsColors.textPrimary,
    marginBottom: qsSpacing.sm,
  },

  /* Section titles for preset editors */
  sectionTitle: {
    fontSize: qsTypography.size.sm,
    fontWeight: qsTypography.weight.semi,
    color: qsColors.textPrimary,
    marginTop: qsSpacing.xl,
    marginBottom: qsSpacing.sm,
  },
  presetsInputRow: {
    flexDirection: "row",
    gap: qsSpacing.sm,
  },
  presetInput: {
    flex: 1,
    backgroundColor: qsColors.layer2,
    borderWidth: 1,
    borderColor: qsColors.layer3,
    borderRadius: qsRadius.md,
    paddingHorizontal: qsSpacing.sm,
    paddingVertical: qsSpacing.sm,
    fontSize: qsTypography.size.sm,
    color: qsColors.textPrimary,
    textAlign: "center",
  },

  /* Instant Trade toggle */
  instantTradeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: qsSpacing.xl,
    paddingVertical: qsSpacing.md,
    paddingHorizontal: qsSpacing.sm,
    backgroundColor: qsColors.layer2,
    borderRadius: qsRadius.md,
    borderWidth: 1,
    borderColor: qsColors.layer3,
  },
  instantTradeLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: qsSpacing.sm,
    flex: 1,
  },
  instantTradeLabelText: {
    gap: 2,
  },
  instantTradeTitle: {
    fontSize: qsTypography.size.sm,
    fontWeight: qsTypography.weight.semi,
    color: qsColors.textPrimary,
  },
  instantTradeHint: {
    fontSize: qsTypography.size.xxs,
    color: qsColors.textTertiary,
  },

  saveBtn: {
    height: 48,
    borderRadius: qsRadius.lg,
    backgroundColor: qsColors.brand,
    alignItems: "center",
    justifyContent: "center",
    marginTop: qsSpacing.xl,
  },
  saveBtnText: {
    fontSize: qsTypography.size.sm,
    fontWeight: qsTypography.weight.bold,
    color: "#ffffff",
  },
});
