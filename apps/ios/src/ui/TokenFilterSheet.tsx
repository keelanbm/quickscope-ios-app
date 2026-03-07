import React, { useCallback, useMemo, useState } from "react";

import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import type { BottomSheetBackdropProps } from "@gorhom/bottom-sheet";

import { haptics } from "@/src/lib/haptics";
import {
  LAUNCHPADS,
  EXCHANGES,
  LAUNCHPAD_LABELS,
  type ScopeFilters,
} from "@/src/features/scope/scopeService";
import { qsColors, qsRadius, qsSpacing, qsTypography } from "@/src/theme/tokens";
import { Check, X } from "@/src/ui/icons";

// ── Platform options ──

type PlatformOption = { code: string; label: string };

const PLATFORM_OPTIONS: PlatformOption[] = [
  { code: LAUNCHPADS.Pumpfun, label: "Pump" },
  { code: LAUNCHPADS.Bonkfun, label: "Bonk" },
  { code: LAUNCHPADS.Believe, label: "Believe" },
  { code: LAUNCHPADS.Heaven, label: "Heaven" },
  { code: LAUNCHPADS.Moonshot, label: "Moonshot" },
  { code: LAUNCHPADS.JupStudio, label: "Jup Studio" },
  { code: LAUNCHPADS.Bags, label: "Bags" },
  { code: LAUNCHPADS.LaunchLab, label: "LaunchLab" },
  { code: LAUNCHPADS.DBC, label: "DBC" },
  { code: EXCHANGES.Raydium, label: "Raydium" },
  { code: EXCHANGES.PumpSwap, label: "PumpSwap" },
];

// ── Preset definitions ──

type FilterPreset = { label: string; min?: number; max?: number };

const MCAP_PRESETS: FilterPreset[] = [
  { label: "<$10K", max: 10_000 },
  { label: "$10K–$100K", min: 10_000, max: 100_000 },
  { label: "$100K–$1M", min: 100_000, max: 1_000_000 },
  { label: "$1M+", min: 1_000_000 },
];

const VOLUME_PRESETS: FilterPreset[] = [
  { label: ">$1K", min: 1_000 },
  { label: ">$10K", min: 10_000 },
  { label: ">$50K", min: 50_000 },
  { label: ">$100K", min: 100_000 },
];

const AGE_PRESETS: FilterPreset[] = [
  { label: "<5m", max: 5 * 60 },
  { label: "<30m", max: 30 * 60 },
  { label: "<1h", max: 3600 },
  { label: "<6h", max: 6 * 3600 },
  { label: "<24h", max: 24 * 3600 },
];

const TX_PRESETS: FilterPreset[] = [
  { label: ">10", min: 10 },
  { label: ">50", min: 50 },
  { label: ">100", min: 100 },
  { label: ">500", min: 500 },
];

const HOLDER_PRESETS: FilterPreset[] = [
  { label: ">50", min: 50 },
  { label: ">100", min: 100 },
  { label: ">500", min: 500 },
  { label: ">1K", min: 1_000 },
];

const TOP25_PRESETS: FilterPreset[] = [
  { label: "<25%", max: 0.25 },
  { label: "<50%", max: 0.5 },
  { label: "<75%", max: 0.75 },
];

const DEV_PRESETS: FilterPreset[] = [
  { label: "<5%", max: 0.05 },
  { label: "<10%", max: 0.1 },
  { label: "<25%", max: 0.25 },
];

const BONDING_CURVE_PRESETS: FilterPreset[] = [
  { label: "<25%", max: 0.25 },
  { label: "25–50%", min: 0.25, max: 0.5 },
  { label: "50–75%", min: 0.5, max: 0.75 },
  { label: ">75%", min: 0.75 },
];

const TWITTER_FOLLOWER_PRESETS: FilterPreset[] = [
  { label: ">100", min: 100 },
  { label: ">1K", min: 1_000 },
  { label: ">10K", min: 10_000 },
];

// ── Helpers ──

export function hasActiveFilters(filters: ScopeFilters): boolean {
  return Object.values(filters).some(
    (v) => v !== undefined && v !== false && (!Array.isArray(v) || v.length > 0),
  );
}

export function getExchangeLabel(filters: ScopeFilters): string {
  if (!filters.exchanges || filters.exchanges.length === 0) return "All Launchpads";
  if (filters.exchanges.length === 1) {
    return LAUNCHPAD_LABELS[filters.exchanges[0]] ?? "1 Platform";
  }
  return `${filters.exchanges.length} Platforms`;
}

// ── Component ──

type TokenFilterSheetProps = {
  sheetRef: React.RefObject<BottomSheet | null>;
  filters: ScopeFilters;
  onApply: (filters: ScopeFilters) => void;
};

export function TokenFilterSheet({ sheetRef, filters, onApply }: TokenFilterSheetProps) {
  const [draft, setDraft] = useState<ScopeFilters>({});
  const snapPoints = useMemo(() => ["65%", "90%"], []);

  const handleSheetChange = useCallback(
    (index: number) => {
      if (index >= 0) {
        setDraft({ ...filters });
      }
    },
    [filters],
  );

  const handleApply = useCallback(() => {
    haptics.selection();
    onApply(draft);
    sheetRef.current?.close();
  }, [draft, onApply, sheetRef]);

  const handleReset = useCallback(() => {
    haptics.light();
    setDraft({});
  }, []);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} pressBehavior="close" />
    ),
    [],
  );

  // ── Draft updaters ──

  const toggleExchange = useCallback((code: string) => {
    haptics.light();
    setDraft((prev) => {
      const current = prev.exchanges ?? [];
      const next = current.includes(code) ? current.filter((c) => c !== code) : [...current, code];
      return { ...prev, exchanges: next.length > 0 ? next : undefined };
    });
  }, []);

  const setPreset = useCallback(
    (minKey: keyof ScopeFilters, maxKey: keyof ScopeFilters) =>
      (preset: FilterPreset | null) => {
        haptics.light();
        setDraft((prev) => ({ ...prev, [minKey]: preset?.min, [maxKey]: preset?.max }));
      },
    [],
  );

  const toggleBool = useCallback((key: keyof ScopeFilters) => {
    haptics.light();
    setDraft((prev) => ({ ...prev, [key]: prev[key] ? undefined : true }));
  }, []);

  const setMcap = setPreset("minMarketCapSol", "maxMarketCapSol");
  const setVolume = setPreset("minVolumeSol", "maxVolumeSol");
  const setAge = setPreset("minAgeSec", "maxAgeSec");
  const setTx = setPreset("minTxCount", "maxTxCount");
  const setHolder = setPreset("minHolderCount", "maxHolderCount");
  const setTop25 = setPreset("minTop25Pct", "maxTop25Pct");
  const setDev = setPreset("minDevPct", "maxDevPct");
  const setBondingCurve = setPreset("minBondingCurvePct", "maxBondingCurvePct");
  const setTwitterFollowers = setPreset("minTwitterFollowers", "maxTwitterFollowers");

  return (
    <BottomSheet
      ref={sheetRef}
      snapPoints={snapPoints}
      index={-1}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
      onChange={handleSheetChange}
    >
      <BottomSheetScrollView contentContainerStyle={styles.sheetContent}>
        {/* Header */}
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Filters</Text>
          <View style={styles.sheetHeaderActions}>
            <Pressable onPress={handleReset} style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}>
              <Text style={styles.resetText}>Reset All</Text>
            </Pressable>
            <Pressable onPress={() => sheetRef.current?.close()} hitSlop={8}>
              <X size={20} color={qsColors.textSecondary} />
            </Pressable>
          </View>
        </View>

        <FilterSection label="Platform">
          {PLATFORM_OPTIONS.map((opt) => (
            <FilterChip
              key={opt.code}
              label={opt.label}
              active={draft.exchanges?.includes(opt.code) ?? false}
              onPress={() => toggleExchange(opt.code)}
            />
          ))}
        </FilterSection>

        <PresetSection label="Market Cap" presets={MCAP_PRESETS} currentMin={draft.minMarketCapSol} currentMax={draft.maxMarketCapSol} onSelect={setMcap} />
        <PresetSection label="Volume (1h)" presets={VOLUME_PRESETS} currentMin={draft.minVolumeSol} currentMax={draft.maxVolumeSol} onSelect={setVolume} />
        <PresetSection label="Age" presets={AGE_PRESETS} currentMin={draft.minAgeSec} currentMax={draft.maxAgeSec} onSelect={setAge} />
        <PresetSection label="Transactions (1h)" presets={TX_PRESETS} currentMin={draft.minTxCount} currentMax={draft.maxTxCount} onSelect={setTx} />
        <PresetSection label="Holders" presets={HOLDER_PRESETS} currentMin={draft.minHolderCount} currentMax={draft.maxHolderCount} onSelect={setHolder} />
        <PresetSection label="Top 25 Holdings" presets={TOP25_PRESETS} currentMin={draft.minTop25Pct} currentMax={draft.maxTop25Pct} onSelect={setTop25} />
        <PresetSection label="Dev Holdings" presets={DEV_PRESETS} currentMin={draft.minDevPct} currentMax={draft.maxDevPct} onSelect={setDev} />
        <PresetSection label="Bonding Curve" presets={BONDING_CURVE_PRESETS} currentMin={draft.minBondingCurvePct} currentMax={draft.maxBondingCurvePct} onSelect={setBondingCurve} />
        <PresetSection label="Twitter Followers" presets={TWITTER_FOLLOWER_PRESETS} currentMin={draft.minTwitterFollowers} currentMax={draft.maxTwitterFollowers} onSelect={setTwitterFollowers} />

        <View style={styles.filterSection}>
          <Text style={styles.filterSectionLabel}>Socials</Text>
          <BoolToggle label="Has Twitter" value={draft.hasTwitter} onToggle={() => toggleBool("hasTwitter")} />
          <BoolToggle label="Has Telegram" value={draft.hasTelegram} onToggle={() => toggleBool("hasTelegram")} />
          <BoolToggle label="Has Website" value={draft.hasWebsite} onToggle={() => toggleBool("hasWebsite")} />
        </View>

        <Pressable
          onPress={handleApply}
          style={({ pressed }) => [styles.applyButton, { opacity: pressed ? 0.8 : 1 }]}
        >
          <Check size={16} color={qsColors.layer0} />
          <Text style={styles.applyButtonText}>Apply Filters</Text>
        </Pressable>
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

// ── Sub-components ──

function FilterSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.filterSection}>
      <Text style={styles.filterSectionLabel}>{label}</Text>
      <View style={styles.chipRow}>{children}</View>
    </View>
  );
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.filterChip, active && styles.filterChipActive]}>
      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{label}</Text>
    </Pressable>
  );
}

function PresetSection({
  label,
  presets,
  currentMin,
  currentMax,
  onSelect,
}: {
  label: string;
  presets: FilterPreset[];
  currentMin?: number;
  currentMax?: number;
  onSelect: (preset: FilterPreset | null) => void;
}) {
  return (
    <FilterSection label={label}>
      {presets.map((preset) => {
        const isActive = currentMin === preset.min && currentMax === preset.max;
        return (
          <FilterChip
            key={preset.label}
            label={preset.label}
            active={isActive}
            onPress={() => onSelect(isActive ? null : preset)}
          />
        );
      })}
    </FilterSection>
  );
}

function BoolToggle({ label, value, onToggle }: { label: string; value?: boolean; onToggle: () => void }) {
  return (
    <Pressable onPress={onToggle} style={styles.boolRow}>
      <Text style={styles.boolLabel}>{label}</Text>
      <Switch
        value={Boolean(value)}
        onValueChange={onToggle}
        trackColor={{ false: qsColors.layer3, true: qsColors.accent }}
        thumbColor={qsColors.textPrimary}
        style={styles.boolSwitch}
      />
    </Pressable>
  );
}

// ── Styles ──

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
  sheetContent: {
    paddingHorizontal: qsSpacing.lg,
    paddingBottom: qsSpacing.xxxl,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: qsSpacing.xl,
  },
  sheetTitle: {
    fontSize: qsTypography.size.lg,
    fontWeight: qsTypography.weight.bold,
    color: qsColors.textPrimary,
  },
  sheetHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: qsSpacing.md,
  },
  resetText: {
    fontSize: qsTypography.size.xs,
    fontWeight: qsTypography.weight.semi,
    color: qsColors.accent,
  },
  filterSection: {
    marginBottom: qsSpacing.xl,
  },
  filterSectionLabel: {
    fontSize: qsTypography.size.xs,
    fontWeight: qsTypography.weight.semi,
    color: qsColors.textSecondary,
    marginBottom: qsSpacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: qsSpacing.sm,
  },
  filterChip: {
    paddingHorizontal: qsSpacing.md,
    paddingVertical: qsSpacing.sm,
    borderRadius: qsRadius.md,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    backgroundColor: qsColors.layer2,
  },
  filterChipActive: {
    borderColor: qsColors.accent,
    backgroundColor: "rgba(119, 102, 247, 0.1)",
  },
  filterChipText: {
    fontSize: qsTypography.size.xs,
    fontWeight: qsTypography.weight.semi,
    color: qsColors.textSecondary,
  },
  filterChipTextActive: {
    color: qsColors.accent,
  },
  boolRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: qsSpacing.sm,
  },
  boolLabel: {
    fontSize: qsTypography.size.sm,
    fontWeight: qsTypography.weight.medium,
    color: qsColors.textSecondary,
  },
  boolSwitch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
  applyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: qsSpacing.sm,
    height: 48,
    borderRadius: qsRadius.lg,
    backgroundColor: qsColors.accent,
    marginTop: qsSpacing.md,
  },
  applyButtonText: {
    fontSize: qsTypography.size.sm,
    fontWeight: qsTypography.weight.bold,
    color: qsColors.layer0,
  },
});
