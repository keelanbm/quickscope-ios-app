import React, { useCallback, useEffect, useRef, useState } from "react";

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
import type BottomSheet from "@gorhom/bottom-sheet";

import { haptics } from "@/src/lib/haptics";
import { formatCompactUsd, formatPercent, formatCompactNumber, formatAgeFromSeconds } from "@/src/lib/format";
import { toast } from "@/src/lib/toast";
import {
  fetchScopeTokens,
  LAUNCHPAD_LABELS,
  type ScopeTabId,
  type ScopeToken,
  type ScopeFilters,
} from "@/src/features/scope/scopeService";
import type { RpcClient } from "@/src/lib/api/rpcClient";
import type { RootStack, RootTabs, ScopeRouteParams } from "@/src/navigation/types";
import { qsColors, qsRadius, qsSpacing, qsTypography } from "@/src/theme/tokens";
import { ChevronDown, Copy, Crosshair, Globe, MessageCircle, SlidersHorizontal, Star, Zap, SolanaIcon, XIcon, TelegramIcon, Users, Shield, Bot, UserPlus } from "@/src/ui/icons";
import { EmptyState } from "@/src/ui/EmptyState";
import { SkeletonRow } from "@/src/ui/Skeleton";
import { TokenAvatar } from "@/src/ui/TokenAvatar";
import { TokenFilterSheet, hasActiveFilters, getExchangeLabel } from "@/src/ui/TokenFilterSheet";

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

function createInitialFilters(): Record<ScopeTabId, ScopeFilters> {
  return { new: {}, graduating: {}, graduated: {}, scans: {} };
}



/* ─── Formatters ─── */

function truncateAddress(mint: string): string {
  if (!mint || mint.length < 10) return mint || "—";
  return `${mint.slice(0, 4)}..${mint.slice(-4)}`;
}


/* ─── Memoized Token Row (Axiom Surge–inspired 4-row card) ─── */

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
    const age = formatAgeFromSeconds(item.mintedAtSeconds);

    const highScans = item.scanMentionsOneHour > 10;

    // Future fields — not yet returned by API
    const athUsd = (item as Record<string, unknown>).athUsd as number | undefined;
    const athMultiplier = (item as Record<string, unknown>).athMultiplier as number | undefined;
    const twitterUrl = (item as Record<string, unknown>).twitterUrl as string | undefined;
    const telegramUrl = (item as Record<string, unknown>).telegramUrl as string | undefined;
    const websiteUrl = (item as Record<string, unknown>).websiteUrl as string | undefined;

    const stopRowPress = (event: GestureResponderEvent) => {
      event.stopPropagation();
    };

    return (
      <Pressable
        style={({ pressed }) => [styles.rowItem, pressed && styles.rowItemPressed]}
        onPress={() => onPress(item)}
      >
        {/* ── Row 1: Avatar + Identity + Age ── */}
        <View style={styles.row1}>
          {/* Token avatar with launchpad badge */}
          <View style={styles.imageWrap}>
            <TokenAvatar uri={item.imageUri} size={48} platform={item.platform} />
          </View>

          {/* Symbol + Name + Copy + Star */}
          <View style={styles.identityCol}>
            <View style={styles.symbolRow}>
              <Text numberOfLines={1} style={styles.tokenSymbol}>
                {item.symbol || "???"}
              </Text>
              <Text numberOfLines={1} style={styles.tokenName}>
                {item.name || "Unnamed"}
              </Text>
              <Pressable
                onPress={(e) => {
                  stopRowPress(e);
                  void onCopyAddress(item.mint);
                }}
                hitSlop={8}
              >
                <Copy size={12} color={qsColors.textTertiary} />
              </Pressable>
              <Pressable
                onPress={(e) => {
                  stopRowPress(e);
                  onToggleStar(item.mint);
                }}
                hitSlop={8}
              >
                <Star
                  size={12}
                  color={isStarred ? qsColors.accent : qsColors.textTertiary}
                  fill={isStarred ? qsColors.accent : "none"}
                />
              </Pressable>
            </View>
          </View>

          {/* Age — top right */}
          <Text style={styles.ageText}>{age}</Text>
        </View>

        {/* ── Row 2: Holder Analytics + MC ── */}
        <View style={styles.row2}>
          <View style={styles.analyticsRow}>
            {item.holderCount != null ? (
              <View style={styles.analyticsPill}>
                <Users size={10} color={qsColors.textTertiary} />
                <Text style={styles.analyticsPillText}>{formatCompactNumber(item.holderCount)}</Text>
              </View>
            ) : null}
            {item.devHoldingsPct != null ? (
              <View style={[styles.analyticsPill, item.devHoldingsPct > 10 ? styles.analyticsPillWarn : null]}>
                <Shield size={10} color={item.devHoldingsPct > 10 ? qsColors.sellRed : qsColors.textTertiary} />
                <Text style={[styles.analyticsPillText, item.devHoldingsPct > 10 ? styles.analyticsPillTextWarn : null]}>
                  {Math.round(item.devHoldingsPct)}%
                </Text>
              </View>
            ) : null}
            {item.insiderCount != null && item.insiderCount > 0 ? (
              <View style={[styles.analyticsPill, item.insiderCount > 5 ? styles.analyticsPillWarn : null]}>
                <UserPlus size={10} color={item.insiderCount > 5 ? qsColors.sellRed : qsColors.textTertiary} />
                <Text style={[styles.analyticsPillText, item.insiderCount > 5 ? styles.analyticsPillTextWarn : null]}>
                  {item.insiderCount}
                </Text>
              </View>
            ) : null}
            {item.botCount != null && item.botCount > 0 ? (
              <View style={[styles.analyticsPill, item.botCount > 5 ? styles.analyticsPillWarn : null]}>
                <Bot size={10} color={item.botCount > 5 ? qsColors.sellRed : qsColors.textTertiary} />
                <Text style={[styles.analyticsPillText, item.botCount > 5 ? styles.analyticsPillTextWarn : null]}>
                  {item.botCount}
                </Text>
              </View>
            ) : null}
            {item.top25Pct != null ? (
              <View style={[styles.analyticsPill, item.top25Pct > 50 ? styles.analyticsPillWarn : null]}>
                <Text style={[styles.analyticsPillLabel, item.top25Pct > 50 ? styles.analyticsPillTextWarn : null]}>T25</Text>
                <Text style={[styles.analyticsPillText, item.top25Pct > 50 ? styles.analyticsPillTextWarn : null]}>
                  {Math.round(item.top25Pct)}%
                </Text>
              </View>
            ) : null}
          </View>
          <View style={styles.priceCluster}>
            <Text style={styles.priceHero}>{formatCompactUsd(item.marketCapUsd)}</Text>
            <Text
              style={[
                styles.changePercent,
                { color: isPositive ? qsColors.buyGreen : qsColors.sellRed },
              ]}
            >
              {formatPercent(item.oneHourChangePercent)}
            </Text>
          </View>
        </View>

        {/* ── Row 3: Social & ATH ── */}
        <View style={styles.row3}>
          {/* Left: age pill + abbreviated address + social icons */}
          <View style={styles.socialCluster}>
            <Text style={styles.addressText}>{truncateAddress(item.mint)}</Text>
            {twitterUrl ? (
              <Pressable hitSlop={8} onPress={stopRowPress}>
                <XIcon size={13} color={qsColors.textTertiary} />
              </Pressable>
            ) : null}
            {telegramUrl ? (
              <Pressable hitSlop={8} onPress={stopRowPress}>
                <TelegramIcon size={13} color={qsColors.textTertiary} />
              </Pressable>
            ) : null}
            {websiteUrl ? (
              <Pressable hitSlop={8} onPress={stopRowPress}>
                <Globe size={13} color={qsColors.textTertiary} />
              </Pressable>
            ) : null}
          </View>

          {/* Right: ATH */}
          <View style={styles.athCluster}>
            <Text style={styles.athLabel}>ATH</Text>
            <Text style={styles.athValue}>
              {athUsd != null ? formatCompactUsd(athUsd) : "—"}
            </Text>
            {athMultiplier != null ? (
              <Text style={styles.athMultiplier}>{athMultiplier.toFixed(2)}x</Text>
            ) : null}
          </View>
        </View>

        {/* ── Row 4: Dense Metrics + Chips + Quick Buy ── */}
        <View style={styles.row4}>
          {/* Metrics */}
          <View style={styles.metricsCluster}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>V</Text>
              <Text style={styles.metricVal}>{formatCompactUsd(item.oneHourVolumeUsd)}</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>TX</Text>
              <Text style={styles.metricVal}>{formatCompactNumber(item.oneHourTxCount)}</Text>
            </View>
            {item.scanMentionsOneHour > 0 ? (
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>S</Text>
                <Text style={[styles.metricVal, highScans && styles.metricValAccent]}>
                  {formatCompactNumber(item.scanMentionsOneHour)}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Quick Buy pill — pushed right */}
          <View style={{ flex: 1 }} />
          <Pressable
            style={({ pressed }) => [
              styles.quickBuyButton,
              pressed && styles.quickBuyButtonPressed,
            ]}
            onPress={(e) => onQuickBuy(e, item)}
          >
            <Zap size={10} color={qsColors.accent} />
            <Text style={styles.quickBuyText}>0.1</Text>
          </Pressable>
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
    filterSheetRef.current?.snapToIndex(0);
  }, []);

  const handleApplyFilters = useCallback(
    (newFilters: ScopeFilters) => {
      setTabFilters((prev) => ({ ...prev, [activeTab]: newFilters }));
    },
    [activeTab],
  );

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
            <View style={{ gap: qsSpacing.xs }}>
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

    <TokenFilterSheet sheetRef={filterSheetRef} filters={currentFilters} onApply={handleApplyFilters} />
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
    fontSize: qsTypography.size.xs,
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
    gap: qsSpacing.xs,
    backgroundColor: qsColors.layer2,
    borderRadius: qsRadius.sm,
    paddingVertical: qsSpacing.sm,
    paddingHorizontal: qsSpacing.md,
  },
  launchpadDropdownText: {
    color: qsColors.textSecondary,
    fontSize: qsTypography.size.xxs,
    fontWeight: qsTypography.weight.semi,
  },
  solAmountButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: qsSpacing.xs,
    borderRadius: qsRadius.sm,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    paddingVertical: qsSpacing.sm,
    paddingHorizontal: qsSpacing.md,
  },
  solAmountText: {
    color: qsColors.textSecondary,
    fontSize: qsTypography.size.xxs,
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
    backgroundColor: qsColors.hoverOverlay,
  },
  filterBadge: {
    position: "absolute",
    top: qsSpacing.xs,
    right: qsSpacing.xs,
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
    gap: qsSpacing.xs,
  },
  deepLinkTitle: {
    color: qsColors.textMuted,
    fontSize: qsTypography.size.xxs,
  },
  errorBox: {
    borderRadius: qsRadius.md,
    backgroundColor: qsColors.dangerDark,
    padding: qsSpacing.md,
    gap: qsSpacing.xs,
  },
  errorText: {
    color: qsColors.dangerLight,
    fontSize: qsTypography.size.xxs,
  },
  retryButton: {
    marginTop: qsSpacing.xs,
    alignSelf: "flex-start",
    borderRadius: qsRadius.sm,
    paddingVertical: qsSpacing.xs,
    paddingHorizontal: qsSpacing.sm,
    backgroundColor: qsColors.dangerBg,
  },
  retryButtonText: {
    color: qsColors.dangerLight,
    fontSize: 11,
    fontWeight: qsTypography.weight.bold,
  },

  // ── Token rows — 4-row card style (Axiom Surge layout) ──
  rowItem: {
    marginHorizontal: qsSpacing.lg,
    marginBottom: qsSpacing.sm,
    padding: qsSpacing.md,
    backgroundColor: qsColors.layer1,
    borderRadius: qsRadius.lg,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    gap: qsSpacing.sm,
  },
  rowItemPressed: {
    backgroundColor: qsColors.layer2,
  },

  // ── Row 1: Avatar + Identity + Age ──
  row1: {
    flexDirection: "row",
    alignItems: "center",
    gap: qsSpacing.md,
  },
  imageWrap: {
    width: 48,
    height: 48,
  },
  identityCol: {
    flex: 1,
    justifyContent: "center",
  },
  symbolRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: qsSpacing.xs,
  },
  tokenSymbol: {
    color: qsColors.textPrimary,
    fontSize: qsTypography.size.base,
    fontWeight: qsTypography.weight.bold,
    flexShrink: 1,
  },
  tokenName: {
    color: qsColors.textSecondary,
    fontSize: qsTypography.size.xxs,
    flexShrink: 1,
  },
  ageText: {
    color: qsColors.textTertiary,
    fontSize: qsTypography.size.xxs,
    fontWeight: qsTypography.weight.semi,
    fontVariant: ["tabular-nums"],
  },

  // ── Row 2: Price Hero ──
  row2: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  analyticsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: qsSpacing.xs,
    flex: 1,
    flexWrap: "wrap",
  },
  analyticsPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: qsColors.layer2,
    borderRadius: qsRadius.sm,
    paddingVertical: 2,
    paddingHorizontal: qsSpacing.xs,
  },
  analyticsPillWarn: {
    backgroundColor: qsColors.sellRedBg,
  },
  analyticsPillText: {
    color: qsColors.textSecondary,
    fontSize: 10,
    fontWeight: qsTypography.weight.semi,
    fontVariant: ["tabular-nums"],
  },
  analyticsPillLabel: {
    color: qsColors.textTertiary,
    fontSize: 9,
    fontWeight: qsTypography.weight.bold,
    letterSpacing: 0.3,
  },
  analyticsPillTextWarn: {
    color: qsColors.sellRed,
  },
  priceCluster: {
    flexDirection: "row",
    alignItems: "center",
    gap: qsSpacing.xs,
  },
  priceHero: {
    color: qsColors.textPrimary,
    fontSize: qsTypography.size.md,
    fontWeight: qsTypography.weight.bold,
    fontVariant: ["tabular-nums"],
  },
  changePercent: {
    fontSize: qsTypography.size.xs,
    fontWeight: qsTypography.weight.semi,
    fontVariant: ["tabular-nums"],
  },

  // ── Row 3: Social & ATH ──
  row3: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  socialCluster: {
    flexDirection: "row",
    alignItems: "center",
    gap: qsSpacing.sm,
  },
  addressText: {
    color: qsColors.textTertiary,
    fontSize: 11,
    fontWeight: qsTypography.weight.medium,
    fontVariant: ["tabular-nums"],
  },
  athCluster: {
    flexDirection: "row",
    alignItems: "center",
    gap: qsSpacing.xs,
  },
  athLabel: {
    color: qsColors.textSubtle,
    fontSize: qsTypography.size.xxxs,
    fontWeight: qsTypography.weight.semi,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  athValue: {
    color: qsColors.textSecondary,
    fontSize: 11,
    fontWeight: qsTypography.weight.semi,
    fontVariant: ["tabular-nums"],
  },
  athMultiplier: {
    color: qsColors.textTertiary,
    fontSize: qsTypography.size.xxxs,
    fontWeight: qsTypography.weight.medium,
    fontVariant: ["tabular-nums"],
  },

  // ── Row 4: Dense Metrics + Chips + Quick Buy ──
  row4: {
    flexDirection: "row",
    alignItems: "center",
    gap: qsSpacing.sm,
    borderTopWidth: 1,
    borderTopColor: qsColors.borderDefault,
    paddingTop: qsSpacing.sm,
    marginTop: qsSpacing.xxs,
  },
  metricsCluster: {
    flexDirection: "row",
    alignItems: "center",
    gap: qsSpacing.sm,
  },
  metricItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: qsSpacing.xxs,
  },
  metricLabel: {
    color: qsColors.textSubtle,
    fontSize: qsTypography.size.xxxs,
    fontWeight: qsTypography.weight.semi,
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

  // Quick buy
  quickBuyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: qsSpacing.xxs,
    height: 28,
    paddingHorizontal: qsSpacing.sm,
    borderRadius: qsRadius.pill,
    backgroundColor: qsColors.layer4,
  },
  quickBuyButtonPressed: {
    backgroundColor: qsColors.layer5,
  },
  quickBuyText: {
    color: qsColors.textPrimary,
    fontSize: 11,
    fontWeight: qsTypography.weight.bold,
    fontVariant: ["tabular-nums"],
  },

});
