import React, { useCallback, useMemo, useState } from "react";

import {
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import SimpleBottomSheet, { type SimpleBottomSheetRef, SimpleBottomSheetScrollView } from "@/src/ui/SimpleBottomSheet";

import { haptics } from "@/src/lib/haptics";
import {
  LAUNCHPADS,
  EXCHANGES,
  LAUNCHPAD_LABELS,
  type ScopeFilters,
} from "@/src/features/scope/scopeService";
import { qsColors, qsRadius, qsSpacing, qsTypography } from "@/src/theme/tokens";
import { Check, RefreshCw, X } from "@/src/ui/icons";

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

// ── Category definitions ──

type FilterCategoryId = "launchpads" | "metrics" | "audit" | "socials";

type FilterCategoryDef = {
  id: FilterCategoryId;
  label: string;
};

const FILTER_CATEGORIES: FilterCategoryDef[] = [
  { id: "launchpads", label: "Launchpads" },
  { id: "audit", label: "Audit" },
  { id: "metrics", label: "$ Metrics" },
  { id: "socials", label: "Socials" },
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

function countCategoryFilters(filters: ScopeFilters, category: FilterCategoryId): number {
  let count = 0;
  switch (category) {
    case "launchpads":
      if (filters.exchanges && filters.exchanges.length > 0) count++;
      break;
    case "metrics":
      if (filters.minMarketCapSol !== undefined || filters.maxMarketCapSol !== undefined) count++;
      if (filters.minVolumeSol !== undefined || filters.maxVolumeSol !== undefined) count++;
      if (filters.minAgeSec !== undefined || filters.maxAgeSec !== undefined) count++;
      if (filters.minTxCount !== undefined || filters.maxTxCount !== undefined) count++;
      if (filters.minHolderCount !== undefined || filters.maxHolderCount !== undefined) count++;
      break;
    case "audit":
      if (filters.minTop25Pct !== undefined || filters.maxTop25Pct !== undefined) count++;
      if (filters.minDevPct !== undefined || filters.maxDevPct !== undefined) count++;
      if (filters.minBondingCurvePct !== undefined || filters.maxBondingCurvePct !== undefined) count++;
      break;
    case "socials":
      if (filters.minTwitterFollowers !== undefined || filters.maxTwitterFollowers !== undefined) count++;
      if (filters.hasTwitter) count++;
      if (filters.hasTelegram) count++;
      if (filters.hasWebsite) count++;
      break;
  }
  return count;
}

// ── Component ──

type TokenFilterSheetProps = {
  sheetRef: React.RefObject<SimpleBottomSheetRef | null>;
  filters: ScopeFilters;
  onApply: (filters: ScopeFilters) => void;
};

export function TokenFilterSheet({ sheetRef, filters, onApply }: TokenFilterSheetProps) {
  const [draft, setDraft] = useState<ScopeFilters>({});
  const [activeCategory, setActiveCategory] = useState<FilterCategoryId>("launchpads");
  const snapPoints = useMemo(() => ["75%"], []);

  const handleSheetChange = useCallback(
    (index: number) => {
      if (index >= 0) {
        setDraft({ ...filters });
        setActiveCategory("launchpads");
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
    // Reset only current category
    setDraft((prev) => {
      const next = { ...prev };
      switch (activeCategory) {
        case "launchpads":
          next.exchanges = undefined;
          break;
        case "metrics":
          next.minMarketCapSol = undefined;
          next.maxMarketCapSol = undefined;
          next.minVolumeSol = undefined;
          next.maxVolumeSol = undefined;
          next.minAgeSec = undefined;
          next.maxAgeSec = undefined;
          next.minTxCount = undefined;
          next.maxTxCount = undefined;
          next.minHolderCount = undefined;
          next.maxHolderCount = undefined;
          break;
        case "audit":
          next.minTop25Pct = undefined;
          next.maxTop25Pct = undefined;
          next.minDevPct = undefined;
          next.maxDevPct = undefined;
          next.minBondingCurvePct = undefined;
          next.maxBondingCurvePct = undefined;
          break;
        case "socials":
          next.minTwitterFollowers = undefined;
          next.maxTwitterFollowers = undefined;
          next.hasTwitter = undefined;
          next.hasTelegram = undefined;
          next.hasWebsite = undefined;
          break;
      }
      return next;
    });
  }, [activeCategory]);

  // ── Draft updaters ──

  const toggleExchange = useCallback((code: string) => {
    haptics.light();
    setDraft((prev) => {
      const current = prev.exchanges ?? [];
      const next = current.includes(code) ? current.filter((c) => c !== code) : [...current, code];
      return { ...prev, exchanges: next.length > 0 ? next : undefined };
    });
  }, []);

  const toggleAllExchanges = useCallback(() => {
    haptics.light();
    setDraft((prev) => {
      const allSelected = prev.exchanges === undefined || prev.exchanges.length === 0;
      // If currently showing all (no filter), select none. If some selected, select all (clear filter).
      if (!allSelected) {
        return { ...prev, exchanges: undefined };
      }
      // "Unselect All" = empty array = filter to nothing
      return { ...prev, exchanges: [] };
    });
  }, []);

  const setNumericFilter = useCallback(
    (minKey: keyof ScopeFilters, maxKey: keyof ScopeFilters, min: number | undefined, max: number | undefined) => {
      setDraft((prev) => ({ ...prev, [minKey]: min, [maxKey]: max }));
    },
    [],
  );

  const toggleBool = useCallback((key: keyof ScopeFilters) => {
    haptics.light();
    setDraft((prev) => ({ ...prev, [key]: prev[key] ? undefined : true }));
  }, []);

  // Category badge counts
  const categoryCounts = useMemo(() => {
    const counts: Record<FilterCategoryId, number> = {
      launchpads: 0,
      metrics: 0,
      audit: 0,
      socials: 0,
    };
    for (const cat of FILTER_CATEGORIES) {
      counts[cat.id] = countCategoryFilters(draft, cat.id);
    }
    return counts;
  }, [draft]);

  const totalActive = Object.values(categoryCounts).reduce((a, b) => a + b, 0);

  const allExchangesSelected = draft.exchanges === undefined || draft.exchanges.length === 0;

  return (
    <SimpleBottomSheet
      ref={sheetRef}
      snapPoints={snapPoints}
      index={-1}
      enablePanDownToClose
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
      onChange={handleSheetChange}
    >
      {/* Header */}
      <View style={styles.sheetHeader}>
        <Text style={styles.sheetTitle}>Filters</Text>
        <Pressable onPress={() => sheetRef.current?.close()} hitSlop={8}>
          <X size={20} color={qsColors.textSecondary} />
        </Pressable>
      </View>

      {/* Category tabs */}
      <View style={styles.categoryRow}>
        {FILTER_CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.id;
          const count = categoryCounts[cat.id];
          return (
            <Pressable
              key={`cat-${cat.id}`}
              onPress={() => {
                haptics.selection();
                setActiveCategory(cat.id);
              }}
              style={[styles.categoryTab, isActive && styles.categoryTabActive]}
            >
              <Text style={[styles.categoryTabText, isActive && styles.categoryTabTextActive]}>
                {cat.label}
              </Text>
              {count > 0 ? (
                <View style={[styles.categoryBadge, isActive && styles.categoryBadgeActive]}>
                  <Text style={[styles.categoryBadgeText, isActive && styles.categoryBadgeTextActive]}>
                    {count}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      {/* Category content */}
      <SimpleBottomSheetScrollView contentContainerStyle={styles.sheetContent} keyboardShouldPersistTaps="handled">
        {activeCategory === "launchpads" && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>Launchpads</Text>
              <Pressable onPress={toggleAllExchanges} hitSlop={8}>
                <Text style={styles.selectAllText}>
                  {allExchangesSelected ? "Unselect All" : "Select All"}
                </Text>
              </Pressable>
            </View>
            <View style={styles.platformGrid}>
              {PLATFORM_OPTIONS.map((opt) => {
                const isSelected = allExchangesSelected || (draft.exchanges?.includes(opt.code) ?? false);
                return (
                  <Pressable
                    key={`plat-${opt.code}`}
                    onPress={() => toggleExchange(opt.code)}
                    style={[styles.platformChip, isSelected && styles.platformChipActive]}
                  >
                    <Text style={[styles.platformChipText, isSelected && styles.platformChipTextActive]}>
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {activeCategory === "metrics" && (
          <View style={styles.sectionGap}>
            <NumericFilterRow
              label="Market Cap"
              unit="USD"
              currentMin={draft.minMarketCapSol}
              currentMax={draft.maxMarketCapSol}
              onChange={(min, max) => setNumericFilter("minMarketCapSol", "maxMarketCapSol", min, max)}
            />
            <NumericFilterRow
              label="Volume (1h)"
              unit="USD"
              currentMin={draft.minVolumeSol}
              currentMax={draft.maxVolumeSol}
              onChange={(min, max) => setNumericFilter("minVolumeSol", "maxVolumeSol", min, max)}
            />
            <NumericFilterRow
              label="Age"
              unit="sec"
              currentMin={draft.minAgeSec}
              currentMax={draft.maxAgeSec}
              onChange={(min, max) => setNumericFilter("minAgeSec", "maxAgeSec", min, max)}
            />
            <NumericFilterRow
              label="Transactions (1h)"
              currentMin={draft.minTxCount}
              currentMax={draft.maxTxCount}
              onChange={(min, max) => setNumericFilter("minTxCount", "maxTxCount", min, max)}
            />
            <NumericFilterRow
              label="Holders"
              currentMin={draft.minHolderCount}
              currentMax={draft.maxHolderCount}
              onChange={(min, max) => setNumericFilter("minHolderCount", "maxHolderCount", min, max)}
            />
          </View>
        )}

        {activeCategory === "audit" && (
          <View style={styles.sectionGap}>
            <NumericFilterRow
              label="Top 25 Holdings"
              unit="%"
              currentMin={draft.minTop25Pct}
              currentMax={draft.maxTop25Pct}
              onChange={(min, max) => setNumericFilter("minTop25Pct", "maxTop25Pct", min, max)}
            />
            <NumericFilterRow
              label="Dev Holdings"
              unit="%"
              currentMin={draft.minDevPct}
              currentMax={draft.maxDevPct}
              onChange={(min, max) => setNumericFilter("minDevPct", "maxDevPct", min, max)}
            />
            <NumericFilterRow
              label="Bonding Curve"
              unit="%"
              currentMin={draft.minBondingCurvePct}
              currentMax={draft.maxBondingCurvePct}
              onChange={(min, max) => setNumericFilter("minBondingCurvePct", "maxBondingCurvePct", min, max)}
            />
          </View>
        )}

        {activeCategory === "socials" && (
          <View style={styles.sectionGap}>
            <NumericFilterRow
              label="Twitter Followers"
              currentMin={draft.minTwitterFollowers}
              currentMax={draft.maxTwitterFollowers}
              onChange={(min, max) => setNumericFilter("minTwitterFollowers", "maxTwitterFollowers", min, max)}
            />
            <BoolToggle label="Has Twitter" value={draft.hasTwitter} onToggle={() => toggleBool("hasTwitter")} />
            <BoolToggle label="Has Telegram" value={draft.hasTelegram} onToggle={() => toggleBool("hasTelegram")} />
            <BoolToggle label="Has Website" value={draft.hasWebsite} onToggle={() => toggleBool("hasWebsite")} />
          </View>
        )}

        {/* Footer buttons — inline */}
        <View style={styles.footer}>
          <Pressable
            onPress={handleReset}
            style={({ pressed }) => [styles.resetButton, { opacity: pressed ? 0.6 : 1 }]}
          >
            <RefreshCw size={14} color={qsColors.textSecondary} />
            <Text style={styles.resetButtonText}>Reset</Text>
          </Pressable>
          <Pressable
            onPress={handleApply}
            style={({ pressed }) => [styles.applyButton, { opacity: pressed ? 0.8 : 1 }]}
          >
            <Text style={styles.applyButtonText}>
              Apply All{totalActive > 0 ? ` (${totalActive})` : ""}
            </Text>
          </Pressable>
        </View>
      </SimpleBottomSheetScrollView>
    </SimpleBottomSheet>
  );
}

// ── Sub-components ──

function NumericFilterRow({
  label,
  unit,
  currentMin,
  currentMax,
  onChange,
}: {
  label: string;
  unit?: string;
  currentMin?: number;
  currentMax?: number;
  onChange: (min: number | undefined, max: number | undefined) => void;
}) {
  const hasActive = currentMin !== undefined || currentMax !== undefined;

  const parseNum = (text: string): number | undefined => {
    const n = Number(text.replace(/,/g, ""));
    return Number.isNaN(n) || text.trim() === "" ? undefined : n;
  };

  return (
    <View style={styles.numericSection}>
      <Text style={[styles.numericLabel, hasActive && styles.numericLabelActive]}>{label}</Text>
      <View style={styles.numericInputRow}>
        <View style={styles.numericInputWrap}>
          <TextInput
            style={styles.numericInput}
            placeholder="Min"
            placeholderTextColor={qsColors.textSubtle}
            keyboardType="numeric"
            returnKeyType="done"
            value={currentMin != null ? String(currentMin) : ""}
            onChangeText={(text) => onChange(parseNum(text), currentMax)}
          />
          {unit ? <Text style={styles.numericUnit}>{unit}</Text> : null}
        </View>
        <View style={styles.numericInputWrap}>
          <TextInput
            style={styles.numericInput}
            placeholder="Max"
            placeholderTextColor={qsColors.textSubtle}
            keyboardType="numeric"
            returnKeyType="done"
            value={currentMax != null ? String(currentMax) : ""}
            onChangeText={(text) => onChange(currentMin, parseNum(text))}
          />
          {unit ? <Text style={styles.numericUnit}>{unit}</Text> : null}
        </View>
      </View>
    </View>
  );
}

function BoolToggle({ label, value, onToggle }: { label: string; value?: boolean; onToggle: () => void }) {
  return (
    <Pressable onPress={onToggle} style={styles.boolRow}>
      <Text style={[styles.boolLabel, value && styles.boolLabelActive]}>{label}</Text>
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

  // Header
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: qsSpacing.lg,
    paddingBottom: qsSpacing.sm,
  },
  sheetTitle: {
    fontSize: qsTypography.size.lg,
    fontWeight: qsTypography.weight.bold,
    color: qsColors.textPrimary,
  },

  // Category tabs
  categoryRow: {
    flexDirection: "row",
    gap: qsSpacing.xs,
    paddingHorizontal: qsSpacing.lg,
    paddingBottom: qsSpacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: qsColors.borderDefault,
  },
  categoryTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: qsSpacing.xs,
    paddingHorizontal: qsSpacing.md,
    paddingVertical: qsSpacing.xs,
    borderRadius: qsRadius.md,
  },
  categoryTabActive: {
    backgroundColor: qsColors.layer3,
  },
  categoryTabText: {
    fontSize: qsTypography.size.xs,
    fontWeight: qsTypography.weight.semi,
    color: qsColors.textSecondary,
  },
  categoryTabTextActive: {
    color: qsColors.textPrimary,
  },
  categoryBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: qsColors.layer3,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: qsSpacing.xxs,
  },
  categoryBadgeActive: {
    backgroundColor: qsColors.accent,
  },
  categoryBadgeText: {
    fontSize: qsTypography.size.xxxs,
    fontWeight: qsTypography.weight.bold,
    color: qsColors.textSecondary,
  },
  categoryBadgeTextActive: {
    color: qsColors.layer0,
  },

  // Content area
  sheetContent: {
    paddingHorizontal: qsSpacing.lg,
    paddingTop: qsSpacing.md,
    paddingBottom: 100, // clear tab bar
  },

  // Section header with Select All
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: qsSpacing.sm,
  },
  sectionLabel: {
    fontSize: qsTypography.size.xs,
    fontWeight: qsTypography.weight.semi,
    color: qsColors.textSecondary,
  },
  selectAllText: {
    fontSize: qsTypography.size.xxs,
    color: qsColors.textTertiary,
  },

  // Platform grid — 3 columns
  platformGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: qsSpacing.sm,
  },
  platformChip: {
    width: "31%",
    paddingVertical: qsSpacing.sm,
    paddingHorizontal: qsSpacing.sm,
    borderRadius: qsRadius.md,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    backgroundColor: qsColors.layer2,
    alignItems: "center",
  },
  platformChipActive: {
    borderColor: qsColors.accent,
    backgroundColor: "rgba(119, 102, 247, 0.1)",
  },
  platformChipText: {
    fontSize: qsTypography.size.xxs,
    fontWeight: qsTypography.weight.semi,
    color: qsColors.textTertiary,
  },
  platformChipTextActive: {
    color: qsColors.accent,
  },

  // Numeric filter sections
  sectionGap: {
    gap: qsSpacing.lg,
  },
  numericSection: {
    gap: qsSpacing.xxs,
  },
  numericLabel: {
    fontSize: qsTypography.size.xs,
    fontWeight: qsTypography.weight.semi,
    color: qsColors.textSecondary,
  },
  numericLabelActive: {
    color: qsColors.textPrimary,
  },
  numericInputRow: {
    flexDirection: "row",
    gap: qsSpacing.sm,
  },
  numericInputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: qsRadius.sm,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    backgroundColor: qsColors.layer2,
    paddingRight: qsSpacing.sm,
  },
  numericInput: {
    flex: 1,
    height: 36,
    paddingHorizontal: qsSpacing.sm,
    fontSize: qsTypography.size.xs,
    color: qsColors.textPrimary,
    fontVariant: ["tabular-nums"],
  },
  numericUnit: {
    fontSize: qsTypography.size.xxxs,
    color: qsColors.textTertiary,
    fontWeight: qsTypography.weight.semi,
  },

  // Bool toggles
  boolRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: qsSpacing.xs,
  },
  boolLabel: {
    fontSize: qsTypography.size.xs,
    fontWeight: qsTypography.weight.semi,
    color: qsColors.textSecondary,
  },
  boolLabelActive: {
    color: qsColors.textPrimary,
  },
  boolSwitch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },

  // Sticky footer
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: qsSpacing.md,
    marginTop: qsSpacing.xl,
    paddingTop: qsSpacing.md,
    borderTopWidth: 1,
    borderTopColor: qsColors.borderDefault,
  },
  resetButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: qsSpacing.xs,
    paddingVertical: qsSpacing.sm,
    paddingHorizontal: qsSpacing.md,
  },
  resetButtonText: {
    fontSize: qsTypography.size.sm,
    fontWeight: qsTypography.weight.semi,
    color: qsColors.textSecondary,
  },
  applyButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 48,
    borderRadius: qsRadius.lg,
    backgroundColor: qsColors.accent,
  },
  applyButtonText: {
    fontSize: qsTypography.size.sm,
    fontWeight: qsTypography.weight.bold,
    color: qsColors.layer0,
  },
});
