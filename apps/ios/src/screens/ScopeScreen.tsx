import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useNavigation, type NavigationProp } from "@react-navigation/native";
import * as Clipboard from "expo-clipboard";
import {
  FlatList,
  type GestureResponderEvent,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import type { BottomSheetBackdropProps } from "@gorhom/bottom-sheet";

import { haptics } from "@/src/lib/haptics";
import { toast } from "@/src/lib/toast";
import {
  fetchScopeTokens,
  LAUNCHPAD_LABELS,
  LAUNCHPADS,
  EXCHANGES,
  type ScopeTabId,
  type ScopeToken,
  type ScopeFilters,
} from "@/src/features/scope/scopeService";
import type { RpcClient } from "@/src/lib/api/rpcClient";
import type { RootStack, RootTabs, ScopeRouteParams } from "@/src/navigation/types";
import { qsColors, qsRadius, qsSpacing, qsTypography } from "@/src/theme/tokens";
import { ChevronDown, Copy, Crosshair, SlidersHorizontal, Star, Zap, SolanaIcon, X, Check } from "@/src/ui/icons";
import { EmptyState } from "@/src/ui/EmptyState";
import { SkeletonRow } from "@/src/ui/Skeleton";
import { TokenAvatar } from "@/src/ui/TokenAvatar";

type ScopeScreenProps = {
  rpcClient: RpcClient;
  params?: ScopeRouteParams;
};

type ScopeTab = {
  id: ScopeTabId;
  label: string;
};

const tabs: ScopeTab[] = [
  { id: "new", label: "New" },
  { id: "graduating", label: "Graduating" },
  { id: "graduated", label: "Graduated" },
  { id: "scans", label: "Scans" },
];

/* ─── Platform filter options ─── */

type PlatformOption = {
  code: string;
  label: string;
};

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

/* ─── Filter preset definitions ─── */

type FilterPreset = {
  label: string;
  min?: number;
  max?: number;
};

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

/** Initial empty filters for all tabs */
const EMPTY_FILTERS: ScopeFilters = {};

function createInitialFilters(): Record<ScopeTabId, ScopeFilters> {
  return {
    new: { ...EMPTY_FILTERS },
    graduating: { ...EMPTY_FILTERS },
    graduated: { ...EMPTY_FILTERS },
    scans: { ...EMPTY_FILTERS },
  };
}

/** Check if a tab has any active user-set filters */
function hasActiveFilters(filters: ScopeFilters): boolean {
  return (
    (filters.exchanges !== undefined && filters.exchanges.length > 0) ||
    filters.minMarketCapSol !== undefined ||
    filters.maxMarketCapSol !== undefined ||
    filters.minVolumeSol !== undefined ||
    filters.maxVolumeSol !== undefined ||
    filters.minAgeSec !== undefined ||
    filters.maxAgeSec !== undefined ||
    filters.minTxCount !== undefined ||
    filters.maxTxCount !== undefined
  );
}

/** Get label for current exchange filter state */
function getExchangeLabel(filters: ScopeFilters): string {
  if (!filters.exchanges || filters.exchanges.length === 0) return "All Launchpads";
  if (filters.exchanges.length === 1) {
    return LAUNCHPAD_LABELS[filters.exchanges[0]] ?? "1 Platform";
  }
  return `${filters.exchanges.length} Platforms`;
}



/* ─── Formatters ─── */

function formatCompactUsd(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "$0";
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  if (value >= 1) return `$${value.toFixed(0)}`;
  return `$${value.toFixed(4)}`;
}

function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return "0%";
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${value.toFixed(1)}%`;
}

function formatCompactNumber(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "0";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(Math.round(value));
}

function formatAge(unixSeconds: number): string {
  if (!Number.isFinite(unixSeconds) || unixSeconds <= 0) return "--";
  const elapsed = Math.max(0, Math.floor(Date.now() / 1000) - unixSeconds);
  if (elapsed < 60) return `${elapsed}s`;
  if (elapsed < 3600) return `${Math.floor(elapsed / 60)}m`;
  if (elapsed < 86400) return `${Math.floor(elapsed / 3600)}h`;
  if (elapsed < 604800) return `${Math.floor(elapsed / 86400)}d`;
  return `${Math.floor(elapsed / 604800)}w`;
}

function getPlatformAbbrev(platform?: string): string | null {
  if (!platform) return null;
  const lower = platform.toLowerCase();
  if (lower.includes("pump")) return "PF";
  if (lower.includes("raydium")) return "RD";
  if (lower.includes("bonk") || lower.includes("letsbonk")) return "BK";
  if (lower.includes("moonshot")) return "MS";
  if (lower.includes("orca")) return "OR";
  if (lower.includes("jupiter")) return "JU";
  return platform.slice(0, 2).toUpperCase();
}

/* ─── Memoized Token Row ─── */

type ScopeTokenRowItemProps = {
  item: ScopeToken;
  isStarred: boolean;
  onPress: (token: ScopeToken) => void;
  onCopyAddress: (mint: string) => void;
  onToggleStar: (mint: string) => void;
  onQuickBuy: (event: GestureResponderEvent, token: ScopeToken) => void;
};

const ScopeTokenRowItem = React.memo(
  function ScopeTokenRowItem({
    item,
    isStarred,
    onPress,
    onCopyAddress,
    onToggleStar,
    onQuickBuy,
  }: ScopeTokenRowItemProps) {
    const isPositive = item.oneHourChangePercent >= 0;
    const age = formatAge(item.mintedAtSeconds);
    const platformAbbrev = getPlatformAbbrev(item.platform);
    const highScans = item.scanMentionsOneHour > 10;

    const stopRowPress = (event: GestureResponderEvent) => {
      event.stopPropagation();
    };

    return (
      <Pressable
        style={({ pressed }) => [styles.rowItem, pressed && styles.rowItemPressed]}
        onPress={() => onPress(item)}
      >
        {/* ── Row 1: image + identity + change% + quick buy ── */}
        <View style={styles.rowTop}>
          {/* Token image with platform badge */}
          <View style={styles.imageWrap}>
            <TokenAvatar uri={item.imageUri} size={36} />
            {platformAbbrev ? (
              <View style={styles.platformBadge}>
                <Text style={styles.platformBadgeText}>{platformAbbrev}</Text>
              </View>
            ) : null}
          </View>

          {/* Symbol + age + actions */}
          <View style={styles.identityCol}>
            <View style={styles.symbolRow}>
              <Text numberOfLines={1} style={styles.tokenSymbol}>
                {item.symbol || "???"}
              </Text>
              <View style={styles.agePillWrap}>
                <Text style={styles.agePillText}>{age}</Text>
              </View>
              <Pressable
                onPress={(e) => {
                  stopRowPress(e);
                  void onCopyAddress(item.mint);
                }}
                hitSlop={6}
              >
                <Copy size={11} color={qsColors.textTertiary} />
              </Pressable>
              <Pressable
                onPress={(e) => {
                  stopRowPress(e);
                  onToggleStar(item.mint);
                }}
                hitSlop={6}
              >
                <Star
                  size={12}
                  color={isStarred ? qsColors.accent : qsColors.textTertiary}
                  fill={isStarred ? qsColors.accent : "none"}
                />
              </Pressable>
            </View>
            <Text numberOfLines={1} style={styles.tokenName}>
              {item.name || "Unnamed"}
            </Text>
          </View>

          {/* 1h% change — large, color-coded */}
          <Text
            style={[
              styles.changePercent,
              { color: isPositive ? qsColors.buyGreen : qsColors.sellRed },
            ]}
          >
            {formatPercent(item.oneHourChangePercent)}
          </Text>

          {/* Quick Buy button */}
          <Pressable
            style={({ pressed }) => [
              styles.quickBuyButton,
              pressed && styles.quickBuyButtonPressed,
            ]}
            onPress={(e) => onQuickBuy(e, item)}
          >
            <SolanaIcon size={10} />
            <Text style={styles.quickBuyText}>0.1</Text>
          </Pressable>
        </View>

        {/* ── Row 2: Dense metric strip ── */}
        <View style={styles.metricsStrip}>
          <View style={styles.metricChip}>
            <Text style={styles.metricLabel}>MC</Text>
            <Text style={styles.metricVal}>{formatCompactUsd(item.marketCapUsd)}</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricChip}>
            <Text style={styles.metricLabel}>VOL</Text>
            <Text style={styles.metricVal}>{formatCompactUsd(item.oneHourVolumeUsd)}</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricChip}>
            <Text style={styles.metricLabel}>TXS</Text>
            <Text style={styles.metricVal}>{formatCompactNumber(item.oneHourTxCount)}</Text>
          </View>
          {item.scanMentionsOneHour > 0 ? (
            <>
              <View style={styles.metricDivider} />
              <View style={styles.metricChip}>
                <Text style={styles.metricLabel}>SCANS</Text>
                <Text
                  style={[
                    styles.metricVal,
                    highScans && styles.metricValAccent,
                  ]}
                >
                  {formatCompactNumber(item.scanMentionsOneHour)}
                </Text>
              </View>
            </>
          ) : null}
        </View>
      </Pressable>
    );
  },
  (prev, next) =>
    prev.item.mint === next.item.mint &&
    prev.item.oneHourChangePercent === next.item.oneHourChangePercent &&
    prev.item.marketCapUsd === next.item.marketCapUsd &&
    prev.item.oneHourVolumeUsd === next.item.oneHourVolumeUsd &&
    prev.item.oneHourTxCount === next.item.oneHourTxCount &&
    prev.item.scanMentionsOneHour === next.item.scanMentionsOneHour &&
    prev.isStarred === next.isStarred
);

/* ─── Main Screen ─── */

export function ScopeScreen({ rpcClient, params }: ScopeScreenProps) {
  const navigation = useNavigation<BottomTabNavigationProp<RootTabs>>();
  const rootNavigation = navigation.getParent<NavigationProp<RootStack>>();
  const requestSeqRef = useRef(0);
  const mountTimestampRef = useRef(Date.now());
  const firstDataLoggedRef = useRef(false);
  const filterSheetRef = useRef<BottomSheet>(null);
  const [activeTab, setActiveTab] = useState<ScopeTabId>("new");
  const [rows, setRows] = useState<ScopeToken[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorText, setErrorText] = useState<string | undefined>();
  const [starredMints, setStarredMints] = useState<Record<string, boolean>>({});

  // Per-tab filter state
  const [tabFilters, setTabFilters] = useState<Record<ScopeTabId, ScopeFilters>>(createInitialFilters);
  // Draft filters for the sheet (applied on "Apply")
  const [draftFilters, setDraftFilters] = useState<ScopeFilters>({});

  const currentFilters = tabFilters[activeTab];
  const filtersActive = hasActiveFilters(currentFilters);
  const exchangeLabel = getExchangeLabel(currentFilters);

  const loadRows = useCallback(
    async (options?: { refreshing?: boolean }) => {
      const requestId = ++requestSeqRef.current;
      const isRefreshingRequest = options?.refreshing ?? false;
      const fetchStartedAt = Date.now();
      if (__DEV__) {
        console.log("[perf] Scope fetch start", {
          tab: activeTab,
          kind: isRefreshingRequest ? "refresh" : "load",
          hasFilters: hasActiveFilters(currentFilters),
        });
      }
      if (isRefreshingRequest) {
        setIsRefreshing(true);
      } else {
        setIsInitialLoading(true);
      }

      try {
        const result = await fetchScopeTokens(
          rpcClient,
          activeTab,
          hasActiveFilters(currentFilters) ? currentFilters : undefined,
        );
        if (requestId !== requestSeqRef.current) {
          return;
        }

        setRows(result.rows);
        setErrorText(undefined);
        if (__DEV__) {
          console.log("[perf] Scope fetch success", {
            tab: activeTab,
            ms: Date.now() - fetchStartedAt,
            rows: result.rows.length,
          });
        }
        if (!firstDataLoggedRef.current) {
          firstDataLoggedRef.current = true;
          if (__DEV__) {
            console.log("[perf] Scope first data", {
              tab: activeTab,
              msSinceMount: Date.now() - mountTimestampRef.current,
            });
          }
        }
      } catch (error) {
        if (requestId !== requestSeqRef.current) {
          return;
        }

        setErrorText(String(error));
        if (__DEV__) {
          console.log("[perf] Scope fetch error", {
            tab: activeTab,
            ms: Date.now() - fetchStartedAt,
            error: String(error),
          });
        }
      } finally {
        if (requestId !== requestSeqRef.current) {
          return;
        }

        setIsInitialLoading(false);
        setIsRefreshing(false);
      }
    },
    [activeTab, currentFilters, rpcClient]
  );

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  const handleOpenTokenDetail = useCallback(
    (token: ScopeToken) => {
      rootNavigation?.navigate("TokenDetail", {
        source: "scope-row",
        tokenAddress: token.mint,
        tokenDecimals: token.tokenDecimals,
        symbol: token.symbol,
        name: token.name,
        imageUri: token.imageUri,
        platform: token.platform,
        exchange: token.exchange,
        marketCapUsd: token.marketCapUsd,
        oneHourVolumeUsd: token.oneHourVolumeUsd,
        oneHourTxCount: token.oneHourTxCount,
        oneHourChangePercent: token.oneHourChangePercent,
        mintedAtSeconds: token.mintedAtSeconds,
        scanMentionsOneHour: token.scanMentionsOneHour,
      });
    },
    [rootNavigation]
  );

  const toggleStar = useCallback((mint: string) => {
    setStarredMints((current) => ({
      ...current,
      [mint]: !current[mint],
    }));
  }, []);

  const handleCopyAddress = useCallback(async (mint: string) => {
    await Clipboard.setStringAsync(mint);
    haptics.success();
    toast.success("Copied", mint);
  }, []);

  const handleQuickBuy = useCallback(
    (event: GestureResponderEvent, token: ScopeToken) => {
      event.stopPropagation();
      // TODO: wire up quick buy sheet with pre-filled token
      toast.info("Quick Buy", `Buy ${token.symbol} — coming soon`);
    },
    []
  );

  // ── Filter sheet handlers ──

  const handleOpenFilterSheet = useCallback(() => {
    haptics.light();
    setDraftFilters({ ...currentFilters });
    filterSheetRef.current?.snapToIndex(0);
  }, [currentFilters]);

  const handleCloseFilterSheet = useCallback(() => {
    filterSheetRef.current?.close();
  }, []);

  const handleApplyFilters = useCallback(() => {
    haptics.selection();
    setTabFilters((prev) => ({
      ...prev,
      [activeTab]: { ...draftFilters },
    }));
    filterSheetRef.current?.close();
  }, [activeTab, draftFilters]);

  const handleResetFilters = useCallback(() => {
    haptics.light();
    setDraftFilters({});
  }, []);

  const handleToggleDraftExchange = useCallback((code: string) => {
    haptics.light();
    setDraftFilters((prev) => {
      const current = prev.exchanges ?? [];
      const next = current.includes(code)
        ? current.filter((c) => c !== code)
        : [...current, code];
      return { ...prev, exchanges: next.length > 0 ? next : undefined };
    });
  }, []);

  const handleSetDraftMcap = useCallback((preset: FilterPreset | null) => {
    haptics.light();
    setDraftFilters((prev) => ({
      ...prev,
      minMarketCapSol: preset?.min,
      maxMarketCapSol: preset?.max,
    }));
  }, []);

  const handleSetDraftVolume = useCallback((preset: FilterPreset | null) => {
    haptics.light();
    setDraftFilters((prev) => ({
      ...prev,
      minVolumeSol: preset?.min,
      maxVolumeSol: preset?.max,
    }));
  }, []);

  const handleSetDraftAge = useCallback((preset: FilterPreset | null) => {
    haptics.light();
    setDraftFilters((prev) => ({
      ...prev,
      minAgeSec: preset?.min,
      maxAgeSec: preset?.max,
    }));
  }, []);

  const handleSetDraftTx = useCallback((preset: FilterPreset | null) => {
    haptics.light();
    setDraftFilters((prev) => ({
      ...prev,
      minTxCount: preset?.min,
      maxTxCount: preset?.max,
    }));
  }, []);

  // Bottom sheet backdrop
  const renderFilterBackdrop = useCallback(
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

  const filterSnapPoints = useMemo(() => ["60%", "85%"], []);

  const renderItem = useCallback(
    ({ item }: { item: ScopeToken }) => (
      <ScopeTokenRowItem
        item={item}
        isStarred={Boolean(starredMints[item.mint])}
        onPress={handleOpenTokenDetail}
        onCopyAddress={handleCopyAddress}
        onToggleStar={toggleStar}
        onQuickBuy={handleQuickBuy}
      />
    ),
    [starredMints, handleOpenTokenDetail, handleCopyAddress, toggleStar, handleQuickBuy]
  );

  return (
    <View style={styles.page}>
    <FlatList
      data={rows}
      keyExtractor={(item) => item.mint}
      contentContainerStyle={styles.content}
      style={styles.listFlex}
      refreshControl={
        <RefreshControl
          tintColor={qsColors.textMuted}
          refreshing={isRefreshing}
          onRefresh={() => {
            haptics.light();
            void loadRows({ refreshing: true });
          }}
        />
      }
      ListHeaderComponent={
        <View style={styles.headerWrap}>
          {params?.source ? (
            <View style={styles.deepLinkNote}>
              <Text style={styles.deepLinkTitle}>Opened from deep link</Text>
            </View>
          ) : null}

          {errorText ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>Failed to load scope feed.</Text>
              <Text style={styles.errorText}>{errorText}</Text>
              <Pressable
                style={styles.retryButton}
                onPress={() => {
                  void loadRows();
                }}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </Pressable>
            </View>
          ) : null}

          {isInitialLoading ? (
            <View style={{ gap: 4 }}>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </View>
          ) : null}

          {/* ── Underline tabs ── */}
          <View style={styles.tabsWrap}>
            {tabs.map((tab) => {
              const active = tab.id === activeTab;
              return (
                <Pressable
                  key={tab.id}
                  onPress={() => {
                    haptics.selection();
                    setActiveTab(tab.id);
                  }}
                  style={[styles.tabButton, active ? styles.tabButtonActive : null]}
                >
                  <Text style={[styles.tabButtonText, active ? styles.tabButtonTextActive : null]}>
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* ── Filter row ── */}
          <View style={styles.filterRow}>
            <Pressable
              style={[
                styles.launchpadDropdown,
                currentFilters.exchanges && currentFilters.exchanges.length > 0 && styles.filterChipActive,
              ]}
              onPress={handleOpenFilterSheet}
            >
              <Text
                style={[
                  styles.launchpadDropdownText,
                  currentFilters.exchanges && currentFilters.exchanges.length > 0 && styles.filterChipTextActive,
                ]}
              >
                {exchangeLabel}
              </Text>
              <ChevronDown
                size={14}
                color={
                  currentFilters.exchanges && currentFilters.exchanges.length > 0
                    ? qsColors.accent
                    : qsColors.textSecondary
                }
              />
            </Pressable>
            <Pressable style={styles.solAmountButton}>
              <SolanaIcon size={12} />
              <Text style={styles.solAmountText}>0.1 SOL</Text>
            </Pressable>
            <Pressable
              style={[
                styles.filterIconButton,
                filtersActive && styles.filterIconButtonActive,
              ]}
              hitSlop={8}
              onPress={handleOpenFilterSheet}
            >
              <SlidersHorizontal
                size={18}
                color={filtersActive ? qsColors.accent : qsColors.textSecondary}
              />
              {filtersActive ? <View style={styles.filterBadge} /> : null}
            </Pressable>
          </View>
        </View>
      }
      renderItem={renderItem}
      windowSize={10}
      maxToRenderPerBatch={10}
      removeClippedSubviews
      ListEmptyComponent={
        !isInitialLoading && !errorText ? (
          <EmptyState
            icon={Crosshair}
            title="No scope results"
            subtitle="Pull down to refresh or check back for new signals."
          />
        ) : null
      }
    />

    {/* ── Filter Bottom Sheet ── */}
    <BottomSheet
      ref={filterSheetRef}
      snapPoints={filterSnapPoints}
      index={-1}
      enablePanDownToClose
      backdropComponent={renderFilterBackdrop}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
    >
      <BottomSheetScrollView contentContainerStyle={styles.sheetContent}>
        {/* Sheet header */}
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Filters</Text>
          <View style={styles.sheetHeaderActions}>
            <Pressable onPress={handleResetFilters} style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}>
              <Text style={styles.resetText}>Reset All</Text>
            </Pressable>
            <Pressable onPress={handleCloseFilterSheet} hitSlop={8}>
              <X size={20} color={qsColors.textSecondary} />
            </Pressable>
          </View>
        </View>

        {/* Platform / Exchange */}
        <View style={styles.filterSection}>
          <Text style={styles.filterSectionLabel}>Platform</Text>
          <View style={styles.chipRow}>
            {PLATFORM_OPTIONS.map((opt) => {
              const isActive = draftFilters.exchanges?.includes(opt.code) ?? false;
              return (
                <Pressable
                  key={opt.code}
                  onPress={() => handleToggleDraftExchange(opt.code)}
                  style={[styles.filterChip, isActive && styles.filterChipActive]}
                >
                  <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Market Cap */}
        <View style={styles.filterSection}>
          <Text style={styles.filterSectionLabel}>Market Cap</Text>
          <View style={styles.chipRow}>
            {MCAP_PRESETS.map((preset) => {
              const isActive =
                draftFilters.minMarketCapSol === preset.min &&
                draftFilters.maxMarketCapSol === preset.max;
              return (
                <Pressable
                  key={preset.label}
                  onPress={() => handleSetDraftMcap(isActive ? null : preset)}
                  style={[styles.filterChip, isActive && styles.filterChipActive]}
                >
                  <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                    {preset.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Volume 1H */}
        <View style={styles.filterSection}>
          <Text style={styles.filterSectionLabel}>Volume (1h)</Text>
          <View style={styles.chipRow}>
            {VOLUME_PRESETS.map((preset) => {
              const isActive =
                draftFilters.minVolumeSol === preset.min &&
                draftFilters.maxVolumeSol === preset.max;
              return (
                <Pressable
                  key={preset.label}
                  onPress={() => handleSetDraftVolume(isActive ? null : preset)}
                  style={[styles.filterChip, isActive && styles.filterChipActive]}
                >
                  <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                    {preset.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Age */}
        <View style={styles.filterSection}>
          <Text style={styles.filterSectionLabel}>Age</Text>
          <View style={styles.chipRow}>
            {AGE_PRESETS.map((preset) => {
              const isActive =
                draftFilters.minAgeSec === preset.min &&
                draftFilters.maxAgeSec === preset.max;
              return (
                <Pressable
                  key={preset.label}
                  onPress={() => handleSetDraftAge(isActive ? null : preset)}
                  style={[styles.filterChip, isActive && styles.filterChipActive]}
                >
                  <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                    {preset.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Transactions */}
        <View style={styles.filterSection}>
          <Text style={styles.filterSectionLabel}>Transactions (1h)</Text>
          <View style={styles.chipRow}>
            {TX_PRESETS.map((preset) => {
              const isActive =
                draftFilters.minTxCount === preset.min &&
                draftFilters.maxTxCount === preset.max;
              return (
                <Pressable
                  key={preset.label}
                  onPress={() => handleSetDraftTx(isActive ? null : preset)}
                  style={[styles.filterChip, isActive && styles.filterChipActive]}
                >
                  <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                    {preset.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Apply button */}
        <Pressable
          onPress={handleApplyFilters}
          style={({ pressed }) => [
            styles.applyButton,
            { opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <Check size={16} color={qsColors.layer0} />
          <Text style={styles.applyButtonText}>Apply Filters</Text>
        </Pressable>
      </BottomSheetScrollView>
    </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: qsColors.layer0,
  },
  listFlex: {
    flex: 1,
  },
  content: {
    paddingTop: qsSpacing.xs,
    paddingBottom: 140,
  },
  headerWrap: {
    gap: qsSpacing.md,
    marginBottom: qsSpacing.sm,
    paddingHorizontal: qsSpacing.lg,
  },

  // ── Underline tabs ──
  tabsWrap: {
    flexDirection: "row",
    gap: qsSpacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: qsColors.borderDefault,
  },
  tabButton: {
    paddingVertical: qsSpacing.sm,
    paddingHorizontal: qsSpacing.xs,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabButtonActive: {
    borderBottomColor: qsColors.accent,
  },
  tabButtonText: {
    color: qsColors.textTertiary,
    fontWeight: qsTypography.weight.semi,
    fontSize: 13,
  },
  tabButtonTextActive: {
    color: qsColors.textPrimary,
  },

  // ── Filter row ──
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: qsSpacing.sm,
  },
  launchpadDropdown: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: qsColors.layer2,
    borderRadius: qsRadius.sm,
    paddingVertical: qsSpacing.sm,
    paddingHorizontal: qsSpacing.md,
  },
  launchpadDropdownText: {
    color: qsColors.textSecondary,
    fontSize: 12,
    fontWeight: qsTypography.weight.semi,
  },
  solAmountButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: qsRadius.sm,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    paddingVertical: qsSpacing.sm,
    paddingHorizontal: qsSpacing.md,
  },
  solAmountText: {
    color: qsColors.textSecondary,
    fontSize: 12,
    fontWeight: qsTypography.weight.semi,
  },
  filterIconButton: {
    width: 36,
    height: 36,
    borderRadius: qsRadius.sm,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  filterIconButtonActive: {
    borderColor: qsColors.accent,
    backgroundColor: "rgba(119, 102, 247, 0.1)",
  },
  filterBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: qsColors.accent,
  },
  filterChipActive: {
    borderColor: qsColors.accent,
    backgroundColor: "rgba(119, 102, 247, 0.1)",
  },
  filterChipTextActive: {
    color: qsColors.accent,
  },

  // ── Deep link / error / loading ──
  deepLinkNote: {
    borderRadius: qsRadius.md,
    backgroundColor: qsColors.layer1,
    padding: qsSpacing.md,
    gap: 4,
  },
  deepLinkTitle: {
    color: qsColors.textMuted,
    fontSize: 12,
  },
  errorBox: {
    borderRadius: qsRadius.md,
    backgroundColor: qsColors.dangerDark,
    padding: qsSpacing.md,
    gap: 4,
  },
  errorText: {
    color: qsColors.dangerLight,
    fontSize: 12,
  },
  retryButton: {
    marginTop: 4,
    alignSelf: "flex-start",
    borderRadius: qsRadius.sm,
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: qsColors.dangerBg,
  },
  retryButtonText: {
    color: qsColors.dangerLight,
    fontSize: 11,
    fontWeight: qsTypography.weight.bold,
  },

  // ── Token rows — card style ──
  rowItem: {
    marginHorizontal: qsSpacing.lg,
    marginBottom: qsSpacing.sm,
    paddingHorizontal: qsSpacing.md,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: qsColors.layer1,
    borderRadius: qsRadius.lg,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    gap: 6,
  },
  rowItemPressed: {
    backgroundColor: qsColors.layer2,
  },

  // Row 1: image + identity + change + buy
  rowTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  // Token image with platform badge
  imageWrap: {
    width: 36,
    height: 36,
  },
  platformBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    minWidth: 16,
    height: 14,
    borderRadius: qsRadius.pill,
    backgroundColor: qsColors.layer2,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  platformBadgeText: {
    fontSize: 7,
    fontWeight: qsTypography.weight.bold,
    color: qsColors.textSecondary,
  },

  identityCol: {
    flex: 1,
    gap: 0,
  },
  symbolRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  tokenSymbol: {
    color: qsColors.textPrimary,
    fontSize: 14,
    fontWeight: qsTypography.weight.bold,
    flexShrink: 1,
  },

  // Age pill with background
  agePillWrap: {
    backgroundColor: qsColors.layer2,
    borderRadius: qsRadius.pill,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  agePillText: {
    color: qsColors.accent,
    fontSize: 10,
    fontWeight: qsTypography.weight.semi,
  },

  tokenName: {
    color: qsColors.textTertiary,
    fontSize: 10,
    marginTop: 1,
  },

  // 1h% change — prominent
  changePercent: {
    fontSize: 14,
    fontWeight: qsTypography.weight.bold,
    fontVariant: ["tabular-nums"],
    minWidth: 52,
    textAlign: "right",
  },

  // Quick buy
  quickBuyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    height: 28,
    paddingHorizontal: 10,
    borderRadius: qsRadius.pill,
    backgroundColor: qsColors.layer3,
    borderWidth: 1,
    borderColor: qsColors.borderSubtle,
  },
  quickBuyButtonPressed: {
    backgroundColor: qsColors.layer4,
  },
  quickBuyText: {
    color: qsColors.textSecondary,
    fontSize: 11,
    fontWeight: qsTypography.weight.bold,
    fontVariant: ["tabular-nums"],
  },

  // ── Row 2: Dense metric strip ──
  metricsStrip: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: qsColors.borderDefault,
    paddingTop: 6,
    marginTop: 2,
  },
  metricChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    justifyContent: "center",
  },
  metricLabel: {
    color: qsColors.textSubtle,
    fontSize: 10,
    fontWeight: qsTypography.weight.semi,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  metricVal: {
    color: qsColors.textPrimary,
    fontSize: 11,
    fontWeight: qsTypography.weight.semi,
    fontVariant: ["tabular-nums"],
  },
  metricValAccent: {
    color: qsColors.accent,
  },
  metricDivider: {
    width: 1,
    height: 12,
    backgroundColor: qsColors.borderSubtle,
    marginHorizontal: 4,
  },

  // ── Filter Bottom Sheet ──
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
    fontSize: 18,
    fontWeight: qsTypography.weight.bold,
    color: qsColors.textPrimary,
  },
  sheetHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: qsSpacing.md,
  },
  resetText: {
    fontSize: 13,
    fontWeight: qsTypography.weight.semi,
    color: qsColors.accent,
  },

  // Filter sections
  filterSection: {
    marginBottom: qsSpacing.xl,
  },
  filterSectionLabel: {
    fontSize: 13,
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
  filterChipText: {
    fontSize: 13,
    fontWeight: qsTypography.weight.semi,
    color: qsColors.textSecondary,
  },

  // Apply button
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
    fontSize: 14,
    fontWeight: qsTypography.weight.bold,
    color: qsColors.layer0,
  },
});
