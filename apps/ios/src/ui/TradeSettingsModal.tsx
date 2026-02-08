/**
 * TradeSettingsModal — Bottom sheet for editing trade profiles (P1/P2/P3).
 *
 * Allows the user to configure slippage, priority fee, and tip per profile.
 * Settings are persisted to AsyncStorage via tradeSettings module.
 */
import React, { forwardRef, useCallback, useMemo, useState, useEffect } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
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
import { X } from "@/src/ui/icons";

type TradeSettingsModalProps = {
  settings: TradeSettings;
  onSettingsChanged: (settings: TradeSettings) => void;
  onClose: () => void;
};

const SLIPPAGE_PRESETS = [500, 1000, 1500, 2500]; // bps

export const TradeSettingsModal = forwardRef<BottomSheet, TradeSettingsModalProps>(
  ({ settings, onSettingsChanged, onClose }, ref) => {
    const snapPoints = useMemo(() => ["70%", "90%"], []);

    const [editingIndex, setEditingIndex] = useState<0 | 1 | 2>(
      settings.activeProfileIndex
    );
    const [slippageText, setSlippageText] = useState("");
    const [priorityText, setPriorityText] = useState("");
    const [tipText, setTipText] = useState("");

    // Sync text fields when switching profiles
    useEffect(() => {
      const p = settings.profiles[editingIndex];
      setSlippageText((p.slippageBps / 100).toString());
      setPriorityText((p.priorityLamports / 1_000_000_000).toString());
      setTipText((p.tipLamports / 1_000_000_000).toString());
    }, [editingIndex, settings.profiles]);

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

      const updated: TradeSettings = {
        ...settings,
        profiles: [...settings.profiles] as [TradeProfile, TradeProfile, TradeProfile],
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
    }, [slippageText, priorityText, tipText, editingIndex, settings, onSettingsChanged]);

    const handleSlippagePreset = useCallback(
      (bps: number) => {
        setSlippageText((bps / 100).toString());
        haptics.light();
      },
      []
    );

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
            {SLIPPAGE_PRESETS.map((bps) => (
              <Pressable
                key={bps}
                onPress={() => handleSlippagePreset(bps)}
                style={[
                  styles.slippageChip,
                  Math.round(parseFloat(slippageText) * 100) === bps &&
                    styles.slippageChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.slippageChipText,
                    Math.round(parseFloat(slippageText) * 100) === bps &&
                      styles.slippageChipTextActive,
                  ]}
                >
                  {formatSlippage(bps)}
                </Text>
              </Pressable>
            ))}
          </View>
          <TextInput
            style={styles.input}
            value={slippageText}
            onChangeText={setSlippageText}
            keyboardType="decimal-pad"
            placeholder="15"
            placeholderTextColor={qsColors.textMuted}
          />

          {/* Priority Fee */}
          <Text style={styles.label}>Priority Fee (SOL)</Text>
          <TextInput
            style={styles.input}
            value={priorityText}
            onChangeText={setPriorityText}
            keyboardType="decimal-pad"
            placeholder="0.0001"
            placeholderTextColor={qsColors.textMuted}
          />

          {/* Tip */}
          <Text style={styles.label}>Jito Tip (SOL)</Text>
          <TextInput
            style={styles.input}
            value={tipText}
            onChangeText={setTipText}
            keyboardType="decimal-pad"
            placeholder="0.0001"
            placeholderTextColor={qsColors.textMuted}
          />

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
  slippageChip: {
    paddingHorizontal: qsSpacing.md,
    paddingVertical: qsSpacing.xs,
    borderRadius: qsRadius.sm,
    borderWidth: 1,
    borderColor: qsColors.layer3,
    backgroundColor: qsColors.layer2,
  },
  slippageChipActive: {
    backgroundColor: qsColors.brandDark,
    borderColor: qsColors.brand,
  },
  slippageChipText: {
    fontSize: qsTypography.size.xxs,
    fontWeight: qsTypography.weight.medium,
    color: qsColors.textMuted,
  },
  slippageChipTextActive: {
    color: qsColors.brand,
  },
  input: {
    backgroundColor: qsColors.layer2,
    borderWidth: 1,
    borderColor: qsColors.layer3,
    borderRadius: qsRadius.md,
    paddingHorizontal: qsSpacing.md,
    paddingVertical: qsSpacing.md,
    fontSize: qsTypography.size.sm,
    color: qsColors.textPrimary,
    marginBottom: qsSpacing.sm,
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
