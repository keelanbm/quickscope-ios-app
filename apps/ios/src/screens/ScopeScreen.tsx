import { useCallback, useEffect, useRef, useState } from "react";

import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useNavigation, type NavigationProp } from "@react-navigation/native";
import * as Clipboard from "expo-clipboard";
import {
  FlatList,
  type GestureResponderEvent,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { haptics } from "@/src/lib/haptics";
import { toast } from "@/src/lib/toast";
import {
  fetchScopeTokens,
  type ScopeTabId,
  type ScopeToken,
} from "@/src/features/scope/scopeService";
import type { RpcClient } from "@/src/lib/api/rpcClient";
import type { RootStack, RootTabs, ScopeRouteParams } from "@/src/navigation/types";
import { qsColors, qsRadius, qsSpacing, qsTypography } from "@/src/theme/tokens";
import { Copy, Crosshair, Star, Zap } from "@/src/ui/icons";
import { EmptyState } from "@/src/ui/EmptyState";
import { SkeletonRow } from "@/src/ui/Skeleton";

type ScopeScreenProps = {
  rpcClient: RpcClient;
  params?: ScopeRouteParams;
};

type ScopeTab = {
  id: ScopeTabId;
  label: string;
};

const tabs: ScopeTab[] = [
  { id: "new-pairs", label: "New Pairs" },
  { id: "momentum", label: "Momentum" },
  { id: "scan-surge", label: "Scan Surge" },
];

const fallbackTokenImage = "https://app.quickscope.gg/favicon.ico";

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

/** Short launchpad label */
function launchpadLabel(platform?: string, exchange?: string): string | null {
  const raw = (platform || exchange || "").toLowerCase();
  if (!raw) return null;
  if (raw.includes("pump")) return "PUMP";
  if (raw.includes("believe")) return "BLV";
  if (raw.includes("meteora")) return "MET";
  if (raw.includes("raydium")) return "RAY";
  if (raw.includes("orca")) return "ORCA";
  if (raw.includes("bonk")) return "BONK";
  if (raw.includes("moonshot")) return "MOON";
  if (raw.includes("jupiter") || raw.includes("jup")) return "JUP";
  return raw.slice(0, 4).toUpperCase();
}

/* ─── Component ─── */

export function ScopeScreen({ rpcClient, params }: ScopeScreenProps) {
  const navigation = useNavigation<BottomTabNavigationProp<RootTabs>>();
  const rootNavigation = navigation.getParent<NavigationProp<RootStack>>();
  const requestSeqRef = useRef(0);
  const mountTimestampRef = useRef(Date.now());
  const firstDataLoggedRef = useRef(false);
  const [activeTab, setActiveTab] = useState<ScopeTabId>("new-pairs");
  const [rows, setRows] = useState<ScopeToken[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorText, setErrorText] = useState<string | undefined>();
  const [starredMints, setStarredMints] = useState<Record<string, boolean>>({});

  const loadRows = useCallback(
    async (options?: { refreshing?: boolean }) => {
      const requestId = ++requestSeqRef.current;
      const isRefreshingRequest = options?.refreshing ?? false;
      const fetchStartedAt = Date.now();
      if (__DEV__) {
        console.log("[perf] Scope fetch start", {
          tab: activeTab,
          kind: isRefreshingRequest ? "refresh" : "load",
        });
      }
      if (isRefreshingRequest) {
        setIsRefreshing(true);
      } else {
        setIsInitialLoading(true);
      }

      try {
        const result = await fetchScopeTokens(rpcClient, activeTab);
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
    [activeTab, rpcClient]
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

  const stopRowPress = useCallback((event: GestureResponderEvent) => {
    event.stopPropagation();
  }, []);

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
      stopRowPress(event);
      // TODO: wire up quick buy sheet with pre-filled token
      toast.info("Quick Buy", `Buy ${token.symbol} — coming soon`);
    },
    [stopRowPress]
  );

  return (
    <FlatList
      data={rows}
      keyExtractor={(item) => item.mint}
      contentContainerStyle={styles.content}
      style={styles.page}
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

          {/* ── Tab pills ── */}
          <View style={styles.tabsWrap}>
            {tabs.map((tab) => {
              const active = tab.id === activeTab;
              return (
                <Pressable
                  key={tab.id}
                  onPress={() => setActiveTab(tab.id)}
                  style={[styles.tabButton, active ? styles.tabButtonActive : null]}
                >
                  <Text style={[styles.tabButtonText, active ? styles.tabButtonTextActive : null]}>
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      }
      renderItem={({ item }) => {
        const isStarred = Boolean(starredMints[item.mint]);
        const badge = launchpadLabel(item.platform, item.exchange);
        const isPositive = item.oneHourChangePercent >= 0;
        const age = formatAge(item.mintedAtSeconds);

        return (
          <Pressable style={styles.rowItem} onPress={() => handleOpenTokenDetail(item)}>
            {/* ── Row 1: image + identity + change% + quick buy ── */}
            <View style={styles.rowTop}>
              {/* Small token image */}
              <Image
                source={{ uri: item.imageUri || fallbackTokenImage }}
                style={styles.tokenImage}
              />

              {/* Symbol + badge + actions */}
              <View style={styles.identityCol}>
                <View style={styles.symbolRow}>
                  <Text numberOfLines={1} style={styles.tokenSymbol}>
                    {item.symbol || "???"}
                  </Text>
                  {badge ? (
                    <View style={styles.launchBadge}>
                      <Text style={styles.launchBadgeText}>{badge}</Text>
                    </View>
                  ) : null}
                  <Text style={styles.agePill}>{age}</Text>
                  <Pressable
                    onPress={(e) => {
                      stopRowPress(e);
                      void handleCopyAddress(item.mint);
                    }}
                    hitSlop={6}
                  >
                    <Copy size={11} color={qsColors.textTertiary} />
                  </Pressable>
                  <Pressable
                    onPress={(e) => {
                      stopRowPress(e);
                      toggleStar(item.mint);
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
                style={styles.quickBuyButton}
                onPress={(e) => handleQuickBuy(e, item)}
              >
                <Zap size={11} color={qsColors.layer0} />
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
                <Text style={styles.metricLabel}>Vol</Text>
                <Text style={styles.metricVal}>{formatCompactUsd(item.oneHourVolumeUsd)}</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricChip}>
                <Text style={styles.metricLabel}>TXs</Text>
                <Text style={styles.metricVal}>{formatCompactNumber(item.oneHourTxCount)}</Text>
              </View>
              {item.scanMentionsOneHour > 0 ? (
                <>
                  <View style={styles.metricDivider} />
                  <View style={styles.metricChip}>
                    <Text style={styles.metricLabel}>Scans</Text>
                    <Text style={styles.metricVal}>
                      {formatCompactNumber(item.scanMentionsOneHour)}
                    </Text>
                  </View>
                </>
              ) : null}
            </View>
          </Pressable>
        );
      }}
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
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: qsColors.layer0,
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

  // ── Tabs ──
  tabsWrap: {
    flexDirection: "row",
    gap: qsSpacing.sm,
    flexWrap: "wrap",
  },
  tabButton: {
    borderRadius: qsRadius.pill,
    backgroundColor: qsColors.layer2,
    paddingVertical: qsSpacing.sm,
    paddingHorizontal: qsSpacing.lg,
  },
  tabButtonActive: {
    backgroundColor: qsColors.accent,
  },
  tabButtonText: {
    color: qsColors.textTertiary,
    fontWeight: qsTypography.weight.semi,
    fontSize: 13,
  },
  tabButtonTextActive: {
    color: qsColors.textPrimary,
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

  // ── Token rows — compact card style ──
  rowItem: {
    marginHorizontal: qsSpacing.lg,
    marginBottom: 6,
    backgroundColor: qsColors.layer1,
    borderRadius: qsRadius.md,
    paddingHorizontal: qsSpacing.md,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 6,
  },

  // Row 1: image + identity + change + buy
  rowTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tokenImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: qsColors.layer3,
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
  launchBadge: {
    backgroundColor: qsColors.layer2,
    borderRadius: qsRadius.xs,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  launchBadgeText: {
    fontSize: 8,
    fontWeight: qsTypography.weight.bold,
    color: qsColors.textSecondary,
    letterSpacing: 0.3,
  },
  agePill: {
    color: qsColors.buyGreen,
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
    gap: 2,
    height: 28,
    paddingHorizontal: 8,
    borderRadius: qsRadius.pill,
    backgroundColor: qsColors.accent,
  },
  quickBuyText: {
    color: qsColors.layer0,
    fontSize: 11,
    fontWeight: qsTypography.weight.bold,
    fontVariant: ["tabular-nums"],
  },

  // ── Row 2: Dense metric strip ──
  metricsStrip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: qsColors.layer2,
    borderRadius: qsRadius.xs,
    paddingVertical: 4,
    paddingHorizontal: 8,
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
  metricDivider: {
    width: 1,
    height: 12,
    backgroundColor: qsColors.layer3,
    marginHorizontal: 4,
  },

});
