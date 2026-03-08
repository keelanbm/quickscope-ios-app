import { useCallback, useEffect, useMemo, useState } from "react";

import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  type AccountSettings,
  type AccountTradeSettings,
  type ExecutionPreset,
  DEFAULT_ACCOUNT_SETTINGS,
  DEFAULT_ACCOUNT_TRADE_SETTINGS,
  bpsToPercent,
  fetchAccountSettings,
  fetchAccountTradeSettings,
  lamportsToSol,
  percentToBps,
  solToLamports,
  updateAccountSettings,
  updateAccountTradeSettings,
  validateTradeSettings,
} from "@/src/features/account/settingsService";
import {
  type DiscoveryCardSource,
  DISCOVERY_CARD_SOURCE_OPTIONS,
  useDiscoveryCardSource,
} from "@/src/features/discovery/discoveryCardsPreference";
import type { RpcClient } from "@/src/lib/api/rpcClient";
import { haptics } from "@/src/lib/haptics";
import { toast } from "@/src/lib/toast";
import { qsColors, qsRadius, qsSpacing, qsTypography } from "@/src/theme/tokens";
import { Check, Clock, Star, TrendingUp, Wallet } from "@/src/ui/icons";

// ── Helpers ──────────────────────────────────────

type TradeAction = "buy" | "sell";
type PresetIndex = 0 | 1 | 2;

function presetToDisplay(p: ExecutionPreset) {
  return {
    slippage: bpsToPercent(p.slippage_bps),
    priorityFee: lamportsToSol(p.priority_fee_lamports),
    tip: lamportsToSol(p.jito_tip_lamports),
  };
}

function displayToPreset(d: { slippage: string; priorityFee: string; tip: string }): ExecutionPreset {
  return {
    slippage_bps: percentToBps(d.slippage),
    priority_fee_lamports: solToLamports(d.priorityFee),
    jito_tip_lamports: solToLamports(d.tip),
  };
}

// ── Segmented Control ────────────────────────────

function SegmentedControl<T extends string>({
  options,
  selected,
  onSelect,
  tintColor,
  tintBg,
}: {
  options: { value: T; label: string }[];
  selected: T;
  onSelect: (v: T) => void;
  tintColor?: string;
  tintBg?: string;
}) {
  return (
    <View style={styles.segmentedRow}>
      {options.map((o) => {
        const active = o.value === selected;
        return (
          <Pressable
            key={o.value}
            style={[
              styles.segmentedItem,
              active && {
                backgroundColor: tintBg ?? "rgba(119, 102, 247, 0.15)",
                borderWidth: 1,
                borderColor: tintColor ?? qsColors.accent,
              },
            ]}
            onPress={() => onSelect(o.value)}
          >
            <Text
              style={[
                styles.segmentedLabel,
                active && { color: tintColor ?? qsColors.accent },
              ]}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ── Field Row ────────────────────────────────────

function FieldRow({
  label,
  value,
  onChangeText,
  suffix,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  suffix?: string;
}) {
  return (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.fieldInputWrap}>
        <TextInput
          style={styles.fieldInput}
          value={value}
          onChangeText={onChangeText}
          keyboardType="decimal-pad"
          placeholderTextColor={qsColors.textSubtle}
          returnKeyType="done"
        />
        {suffix ? <Text style={styles.fieldSuffix}>{suffix}</Text> : null}
      </View>
    </View>
  );
}

// ── Selectable Card ──────────────────────────────

function SelectableCard({
  selected,
  onPress,
  label,
  description,
  preview,
}: {
  selected: boolean;
  onPress: () => void;
  label: string;
  description: string;
  preview: React.ReactNode;
}) {
  return (
    <Pressable
      style={[styles.selectableCard, selected && styles.selectableCardActive]}
      onPress={onPress}
    >
      {selected ? (
        <View style={styles.checkBadge}>
          <Check size={10} color="#fff" />
        </View>
      ) : null}
      {preview}
      <Text style={styles.selectableCardLabel}>{label}</Text>
      <Text style={styles.selectableCardDesc}>{description}</Text>
    </Pressable>
  );
}

// ── Section Header ───────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

// ── Main Screen ──────────────────────────────────

type Props = { rpcClient: RpcClient };

export function SettingsScreen({ rpcClient }: Props) {
  // ── Loading state ──
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ── Account settings (general) ──
  const [accountSettings, setAccountSettings] = useState<AccountSettings>(DEFAULT_ACCOUNT_SETTINGS);

  // ── Trade settings ──
  const [tradeSettings, setTradeSettings] = useState<AccountTradeSettings>(
    DEFAULT_ACCOUNT_TRADE_SETTINGS
  );

  // ── UI state ──
  const [tradeAction, setTradeAction] = useState<TradeAction>("buy");
  const [presetIndex, setPresetIndex] = useState<PresetIndex>(0);

  // ── Editable display values (human-readable strings) ──
  const [quickBuyAmount, setQuickBuyAmount] = useState("");
  const [quickSellPercent, setQuickSellPercent] = useState("");
  const [quickBuyOptions, setQuickBuyOptions] = useState<string[]>([]);
  const [quickSellOptions, setQuickSellOptions] = useState<string[]>([]);

  // Execution preset display values (per buy/sell + P1/P2/P3)
  const [buyPresetDisplay, setBuyPresetDisplay] = useState<
    { slippage: string; priorityFee: string; tip: string }[]
  >([]);
  const [sellPresetDisplay, setSellPresetDisplay] = useState<
    { slippage: string; priorityFee: string; tip: string }[]
  >([]);

  // Discovery card source
  const { source: discoveryCardSource, setSource: setDiscoveryCardSource } = useDiscoveryCardSource();

  // Multi-wallet
  const [batchMode, setBatchMode] = useState<"exact" | "split">("exact");
  const [buyVariance, setBuyVariance] = useState("0");
  const [sellVariance, setSellVariance] = useState("0");

  // ── Hydrate from server ──
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [acctRes, tradeRes] = await Promise.all([
          fetchAccountSettings(rpcClient).catch(() => null),
          fetchAccountTradeSettings(rpcClient).catch(() => null),
        ]);

        if (cancelled) return;

        const acct = acctRes ?? DEFAULT_ACCOUNT_SETTINGS;
        const trade = tradeRes?.account_trade_settings ?? DEFAULT_ACCOUNT_TRADE_SETTINGS;

        setAccountSettings(acct);
        setTradeSettings(trade);

        // Populate display values
        setQuickBuyAmount(lamportsToSol(trade.quick_buy_amount_lamports));
        setQuickSellPercent(bpsToPercent(trade.quick_sell_bps));
        setQuickBuyOptions(trade.quick_buy_options_lamports.map(lamportsToSol));
        setQuickSellOptions(trade.quick_sell_options_bps.map(bpsToPercent));
        setBuyPresetDisplay(trade.buy_presets.map(presetToDisplay));
        setSellPresetDisplay(trade.sell_presets.map(presetToDisplay));
        setBatchMode(trade.batch_trade_mode);
        setBuyVariance(String(trade.stealth_buy_variance));
        setSellVariance(String(trade.stealth_sell_variance));
      } catch {
        toast.error("Settings", "Failed to load settings");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [rpcClient]);

  // ── Current preset display ──
  const currentPresetDisplay = useMemo(() => {
    const arr = tradeAction === "buy" ? buyPresetDisplay : sellPresetDisplay;
    return arr[presetIndex] ?? { slippage: "", priorityFee: "", tip: "" };
  }, [tradeAction, presetIndex, buyPresetDisplay, sellPresetDisplay]);

  const updatePresetField = useCallback(
    (field: "slippage" | "priorityFee" | "tip", value: string) => {
      const setter = tradeAction === "buy" ? setBuyPresetDisplay : setSellPresetDisplay;
      setter((prev) => {
        const copy = [...prev];
        copy[presetIndex] = { ...copy[presetIndex], [field]: value };
        return copy;
      });
    },
    [tradeAction, presetIndex]
  );

  const updateQuickBuyOption = useCallback((index: number, value: string) => {
    setQuickBuyOptions((prev) => {
      const copy = [...prev];
      copy[index] = value;
      return copy;
    });
  }, []);

  const updateQuickSellOption = useCallback((index: number, value: string) => {
    setQuickSellOptions((prev) => {
      const copy = [...prev];
      copy[index] = value;
      return copy;
    });
  }, []);

  // ── Save ──
  const handleSave = useCallback(async () => {
    // Build final trade settings from display values
    const newTrade: AccountTradeSettings = {
      ...tradeSettings,
      buy_presets: buyPresetDisplay.map(displayToPreset) as [
        ExecutionPreset,
        ExecutionPreset,
        ExecutionPreset,
      ],
      sell_presets: sellPresetDisplay.map(displayToPreset) as [
        ExecutionPreset,
        ExecutionPreset,
        ExecutionPreset,
      ],
      quick_buy_options_lamports: quickBuyOptions.map(solToLamports),
      quick_sell_options_bps: quickSellOptions.map(percentToBps),
      quick_buy_amount_lamports: solToLamports(quickBuyAmount),
      quick_sell_bps: percentToBps(quickSellPercent),
      batch_trade_mode: batchMode,
      stealth_buy_variance: Math.min(50, Math.max(0, parseInt(buyVariance) || 0)),
      stealth_sell_variance: Math.min(50, Math.max(0, parseInt(sellVariance) || 0)),
    };

    const error = validateTradeSettings(newTrade);
    if (error) {
      toast.error("Validation", error);
      return;
    }

    setSaving(true);
    try {
      await Promise.all([
        updateAccountTradeSettings(rpcClient, newTrade),
        updateAccountSettings(rpcClient, accountSettings),
      ]);
      setTradeSettings(newTrade);
      toast.success("Settings", "Settings saved");
    } catch {
      toast.error("Settings", "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }, [
    rpcClient,
    tradeSettings,
    accountSettings,
    buyPresetDisplay,
    sellPresetDisplay,
    quickBuyOptions,
    quickSellOptions,
    quickBuyAmount,
    quickSellPercent,
    batchMode,
    buyVariance,
    sellVariance,
  ]);

  // ── General settings handlers ──
  const setPriceDisplayMode = useCallback(
    (mode: "price" | "market_cap") => {
      setAccountSettings((prev) => ({ ...prev, price_display_mode: mode }));
    },
    []
  );

  const setTokenImageMode = useCallback(
    (mode: "circle" | "square") => {
      setAccountSettings((prev) => ({ ...prev, token_image_display_mode: mode }));
    },
    []
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={qsColors.accent} />
      </View>
    );
  }

  const isBuy = tradeAction === "buy";

  return (
    <View style={styles.page}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Trade Presets ── */}
        <SectionHeader title="Trade Presets" />

        {/* Buy / Sell toggle */}
        <SegmentedControl
          options={[
            { value: "buy" as TradeAction, label: "Buy" },
            { value: "sell" as TradeAction, label: "Sell" },
          ]}
          selected={tradeAction}
          onSelect={setTradeAction}
          tintColor={isBuy ? qsColors.buyGreen : qsColors.sellRed}
          tintBg={isBuy ? qsColors.buyGreenBg : qsColors.sellRedBg}
        />

        {/* Quick Amount */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {isBuy ? "Default Buy Amount" : "Default Sell %"}
          </Text>
          <Text style={styles.cardSubtitle}>
            {isBuy ? "Amount used for one-click quick buy" : "Percentage used for one-click quick sell"}
          </Text>
          <View style={styles.fieldInputWrap}>
            <TextInput
              style={styles.fieldInput}
              value={isBuy ? quickBuyAmount : quickSellPercent}
              onChangeText={isBuy ? setQuickBuyAmount : setQuickSellPercent}
              keyboardType="decimal-pad"
              placeholderTextColor={qsColors.textSubtle}
              returnKeyType="done"
            />
            <Text style={styles.fieldSuffix}>{isBuy ? "SOL" : "%"}</Text>
          </View>
        </View>

        {/* Quick Options Grid */}
        <Text style={styles.subSectionTitle}>
          {isBuy ? "Quick Buy Options" : "Quick Sell Options"}
        </Text>
        <View style={styles.optionsGrid}>
          {isBuy
            ? quickBuyOptions.map((val, i) => (
                <View key={`qb-${i}`} style={styles.optionCell}>
                  <View style={styles.fieldInputWrap}>
                    <TextInput
                      style={styles.fieldInput}
                      value={val}
                      onChangeText={(v) => updateQuickBuyOption(i, v)}
                      keyboardType="decimal-pad"
                      returnKeyType="done"
                      placeholderTextColor={qsColors.textSubtle}
                    />
                    <Text style={styles.fieldSuffix}>SOL</Text>
                  </View>
                </View>
              ))
            : quickSellOptions.map((val, i) => (
                <View key={`qs-${i}`} style={styles.optionCell}>
                  <View style={styles.fieldInputWrap}>
                    <TextInput
                      style={styles.fieldInput}
                      value={val}
                      onChangeText={(v) => updateQuickSellOption(i, v)}
                      keyboardType="decimal-pad"
                      returnKeyType="done"
                      placeholderTextColor={qsColors.textSubtle}
                    />
                    <Text style={styles.fieldSuffix}>%</Text>
                  </View>
                </View>
              ))}
        </View>

        {/* Execution Presets */}
        <Text style={styles.subSectionTitle}>Execution Settings</Text>
        <SegmentedControl
          options={[
            { value: "0" as string, label: "P1" },
            { value: "1" as string, label: "P2" },
            { value: "2" as string, label: "P3" },
          ]}
          selected={String(presetIndex)}
          onSelect={(v) => setPresetIndex(Number(v) as PresetIndex)}
        />

        <View style={styles.card}>
          <FieldRow
            label="Slippage"
            value={currentPresetDisplay.slippage}
            onChangeText={(v) => updatePresetField("slippage", v)}
            suffix="%"
          />
          <View style={styles.fieldDivider} />
          <FieldRow
            label="Priority Fee"
            value={currentPresetDisplay.priorityFee}
            onChangeText={(v) => updatePresetField("priorityFee", v)}
            suffix="SOL"
          />
          <View style={styles.fieldDivider} />
          <FieldRow
            label="Bribe / Tip"
            value={currentPresetDisplay.tip}
            onChangeText={(v) => updatePresetField("tip", v)}
            suffix="SOL"
          />
        </View>

        {/* Multi-Wallet Execution */}
        <Text style={styles.subSectionTitle}>Multi-Wallet Execution</Text>

        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Batch Trade Mode</Text>
          <SegmentedControl
            options={[
              { value: "exact" as const, label: "Exact" },
              { value: "split" as const, label: "Split" },
            ]}
            selected={batchMode}
            onSelect={setBatchMode}
          />
          <Text style={styles.multiWalletHint}>
            {batchMode === "exact"
              ? "Each wallet trades the full amount"
              : "Total amount divided across selected wallets"}
          </Text>
        </View>

        <View style={styles.card}>
          <FieldRow
            label="Buy Variance"
            value={buyVariance}
            onChangeText={setBuyVariance}
            suffix="%"
          />
          <View style={styles.fieldDivider} />
          <FieldRow
            label="Sell Variance"
            value={sellVariance}
            onChangeText={setSellVariance}
            suffix="%"
          />
        </View>

        {/* ── General ── */}
        <SectionHeader title="General" />

        {/* Price Display Mode */}
        <Text style={styles.subSectionTitle}>Price Display Mode</Text>
        <View style={styles.cardsRow}>
          <SelectableCard
            selected={accountSettings.price_display_mode === "price"}
            onPress={() => setPriceDisplayMode("price")}
            label="Price"
            description="Token price in USD"
            preview={<PricePreview mode="price" />}
          />
          <SelectableCard
            selected={accountSettings.price_display_mode === "market_cap"}
            onPress={() => setPriceDisplayMode("market_cap")}
            label="Market Cap"
            description="Total market cap"
            preview={<PricePreview mode="mcap" />}
          />
        </View>

        {/* Token Image Shape */}
        <Text style={styles.subSectionTitle}>Token Image Shape</Text>
        <View style={styles.cardsRow}>
          <SelectableCard
            selected={accountSettings.token_image_display_mode === "circle"}
            onPress={() => setTokenImageMode("circle")}
            label="Circle"
            description="Circular token images"
            preview={<TokenShapePreview shape="circle" />}
          />
          <SelectableCard
            selected={accountSettings.token_image_display_mode === "square"}
            onPress={() => setTokenImageMode("square")}
            label="Square"
            description="Rounded square images"
            preview={<TokenShapePreview shape="square" />}
          />
        </View>

        {/* Discovery Cards Source */}
        <Text style={styles.subSectionTitle}>Discovery Cards</Text>
        <Text style={styles.discoveryCardsHint}>
          Choose what appears in the carousel at the top of Discover
        </Text>
        <View style={styles.discoveryCardsList}>
          {DISCOVERY_CARD_SOURCE_OPTIONS.map((opt) => {
            const active = discoveryCardSource === opt.value;
            const Icon = DISCOVERY_CARD_ICONS[opt.value];
            return (
              <Pressable
                key={opt.value}
                style={[styles.discoveryCardOption, active && styles.discoveryCardOptionActive]}
                onPress={() => {
                  haptics.selection();
                  void setDiscoveryCardSource(opt.value);
                }}
              >
                <View style={[styles.discoveryCardIconWrap, active && styles.discoveryCardIconWrapActive]}>
                  <Icon size={16} color={active ? qsColors.accent : qsColors.textTertiary} />
                </View>
                <View style={styles.discoveryCardTextWrap}>
                  <Text style={[styles.discoveryCardLabel, active && styles.discoveryCardLabelActive]}>
                    {opt.label}
                  </Text>
                  <Text style={styles.discoveryCardDesc}>{opt.description}</Text>
                </View>
                {active ? (
                  <View style={styles.discoveryCardCheck}>
                    <Check size={12} color="#fff" />
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>

        {/* Bottom spacer for button */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Save button */}
      <View style={styles.bottomBar}>
        <Pressable
          style={({ pressed }) => [styles.saveButton, pressed && styles.saveButtonPressed]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={qsColors.textPrimary} />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

// ── Discovery Card Icons ─────────────────────────

const DISCOVERY_CARD_ICONS: Record<DiscoveryCardSource, typeof TrendingUp> = {
  top_movers: TrendingUp,
  watchlist: Star,
  recent: Clock,
  holdings: Wallet,
};

// ── Preview Components ───────────────────────────

function PricePreview({ mode }: { mode: "price" | "mcap" }) {
  return (
    <View style={styles.previewRow}>
      <View style={styles.previewDot} />
      <Text style={styles.previewSymbol}>QS</Text>
      <Text style={styles.previewValue}>
        {mode === "price" ? "$0.0042" : "$4.2M"}
      </Text>
    </View>
  );
}

function TokenShapePreview({ shape }: { shape: "circle" | "square" }) {
  return (
    <View style={styles.previewRow}>
      <View
        style={[
          styles.tokenShapeBox,
          { borderRadius: shape === "circle" ? 16 : 6 },
        ]}
      >
        <Text style={styles.tokenShapeEmoji}>Q</Text>
      </View>
      <Text style={styles.previewSymbol}>QS</Text>
    </View>
  );
}

// ── Styles ───────────────────────────────────────

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: qsColors.layer0,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: qsColors.layer0,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: qsSpacing.lg,
    gap: qsSpacing.md,
  },

  // Section
  sectionTitle: {
    fontSize: qsTypography.size.lg,
    fontWeight: qsTypography.weight.bold,
    color: qsColors.textPrimary,
    marginTop: qsSpacing.lg,
    marginBottom: qsSpacing.xs,
  },
  subSectionTitle: {
    fontSize: qsTypography.size.sm,
    fontWeight: qsTypography.weight.semi,
    color: qsColors.textSecondary,
    marginTop: qsSpacing.sm,
  },

  // Card
  card: {
    backgroundColor: qsColors.layer1,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    borderRadius: qsRadius.lg,
    padding: qsSpacing.md,
    gap: qsSpacing.sm,
  },
  cardTitle: {
    fontSize: qsTypography.size.sm,
    fontWeight: qsTypography.weight.medium,
    color: qsColors.textPrimary,
  },
  cardSubtitle: {
    fontSize: qsTypography.size.xxs,
    color: qsColors.textTertiary,
    marginBottom: qsSpacing.xs,
  },

  // Segmented Control
  segmentedRow: {
    flexDirection: "row",
    backgroundColor: qsColors.layer2,
    borderRadius: qsRadius.md,
    padding: 3,
    gap: 3,
  },
  segmentedItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: qsRadius.sm,
    borderWidth: 1,
    borderColor: "transparent",
  },
  segmentedLabel: {
    fontSize: qsTypography.size.xs,
    fontWeight: qsTypography.weight.medium,
    color: qsColors.textTertiary,
  },

  // Field Row
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  fieldLabel: {
    fontSize: qsTypography.size.sm,
    fontWeight: qsTypography.weight.medium,
    color: qsColors.textPrimary,
  },
  fieldInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: qsColors.layer3,
    borderRadius: qsRadius.sm,
    paddingHorizontal: qsSpacing.sm,
    height: 34,
    minWidth: 110,
  },
  fieldInput: {
    flex: 1,
    color: qsColors.textPrimary,
    fontSize: qsTypography.size.xs,
    fontVariant: ["tabular-nums"],
    padding: 0,
  },
  fieldSuffix: {
    fontSize: qsTypography.size.xxs,
    color: qsColors.textTertiary,
    marginLeft: qsSpacing.xs,
  },
  fieldDivider: {
    height: 1,
    backgroundColor: qsColors.borderDefault,
  },

  // Options Grid
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: qsSpacing.sm,
  },
  optionCell: {
    width: "30%",
    flexGrow: 1,
  },

  // Multi-wallet
  multiWalletHint: {
    fontSize: qsTypography.size.xxs,
    color: qsColors.textTertiary,
  },

  // Selectable Card
  cardsRow: {
    flexDirection: "row",
    gap: qsSpacing.sm,
  },
  selectableCard: {
    flex: 1,
    backgroundColor: qsColors.layer2,
    borderRadius: qsRadius.lg,
    padding: qsSpacing.md,
    gap: qsSpacing.sm,
    borderWidth: 1,
    borderColor: "transparent",
  },
  selectableCardActive: {
    backgroundColor: "rgba(119, 102, 247, 0.1)",
    borderColor: "rgba(119, 102, 247, 0.4)",
  },
  checkBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: qsColors.accent,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  selectableCardLabel: {
    fontSize: qsTypography.size.sm,
    fontWeight: qsTypography.weight.medium,
    color: qsColors.textPrimary,
  },
  selectableCardDesc: {
    fontSize: qsTypography.size.xxs,
    color: qsColors.textTertiary,
  },

  // Preview
  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: qsColors.layer3,
    borderRadius: qsRadius.sm,
    paddingHorizontal: qsSpacing.sm,
    paddingVertical: qsSpacing.sm,
    gap: qsSpacing.sm,
  },
  previewDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: qsColors.accent,
  },
  previewSymbol: {
    fontSize: qsTypography.size.xxs,
    fontWeight: qsTypography.weight.medium,
    color: qsColors.textPrimary,
    flex: 1,
  },
  previewValue: {
    fontSize: qsTypography.size.xs,
    fontWeight: qsTypography.weight.medium,
    color: qsColors.textPrimary,
    fontVariant: ["tabular-nums"],
  },
  tokenShapeBox: {
    width: 32,
    height: 32,
    backgroundColor: qsColors.layer2,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  tokenShapeEmoji: {
    fontSize: 16,
    fontWeight: qsTypography.weight.bold,
    color: qsColors.accent,
  },

  // Discovery Cards
  discoveryCardsHint: {
    fontSize: qsTypography.size.xxs,
    color: qsColors.textTertiary,
  },
  discoveryCardsList: {
    gap: qsSpacing.sm,
  },
  discoveryCardOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: qsColors.layer1,
    borderRadius: qsRadius.lg,
    padding: qsSpacing.md,
    gap: qsSpacing.md,
    borderWidth: 1,
    borderColor: "transparent",
  },
  discoveryCardOptionActive: {
    backgroundColor: "rgba(119, 102, 247, 0.08)",
    borderColor: "rgba(119, 102, 247, 0.3)",
  },
  discoveryCardIconWrap: {
    width: 36,
    height: 36,
    borderRadius: qsRadius.md,
    backgroundColor: qsColors.layer3,
    alignItems: "center",
    justifyContent: "center",
  },
  discoveryCardIconWrapActive: {
    backgroundColor: "rgba(119, 102, 247, 0.15)",
  },
  discoveryCardTextWrap: {
    flex: 1,
    gap: 2,
  },
  discoveryCardLabel: {
    fontSize: qsTypography.size.sm,
    fontWeight: qsTypography.weight.medium,
    color: qsColors.textPrimary,
  },
  discoveryCardLabelActive: {
    color: qsColors.accent,
  },
  discoveryCardDesc: {
    fontSize: qsTypography.size.xxs,
    color: qsColors.textTertiary,
  },
  discoveryCardCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: qsColors.accent,
    alignItems: "center",
    justifyContent: "center",
  },

  // Bottom bar
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: qsSpacing.lg,
    paddingBottom: 34,
    paddingTop: qsSpacing.md,
    backgroundColor: qsColors.layer0,
    borderTopWidth: 1,
    borderTopColor: qsColors.borderDefault,
  },
  saveButton: {
    backgroundColor: qsColors.accent,
    borderRadius: qsRadius.md,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonPressed: {
    backgroundColor: qsColors.accentDeep,
  },
  saveButtonText: {
    fontSize: qsTypography.size.base,
    fontWeight: qsTypography.weight.semi,
    color: qsColors.textPrimary,
  },
});
