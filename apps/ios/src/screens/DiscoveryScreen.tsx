import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useNavigation, type NavigationProp } from "@react-navigation/native";
import * as Clipboard from "expo-clipboard";
import {
  FlatList,
  type GestureResponderEvent,
  Image,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { haptics } from "@/src/lib/haptics";
import {
  fetchDiscoveryTokens,
  type DiscoveryTabId,
  type DiscoveryToken,
} from "@/src/features/discovery/discoveryService";
import type { RpcClient } from "@/src/lib/api/rpcClient";
import { toast } from "@/src/lib/toast";
import type { DiscoveryRouteParams, RootStack, RootTabs } from "@/src/navigation/types";
import { qsColors, qsRadius, qsSpacing, qsTypography } from "@/src/theme/tokens";
import { Compass, Copy, Globe, Star, XIcon, TelegramIcon, SlidersHorizontal } from "@/src/ui/icons";
import { EmptyState } from "@/src/ui/EmptyState";
import { SkeletonRow } from "@/src/ui/Skeleton";

type DiscoveryScreenProps = {
  rpcClient: RpcClient;
  params?: DiscoveryRouteParams;
};

type DiscoveryTab = {
  id: DiscoveryTabId;
  label: string;
};

const tabs: DiscoveryTab[] = [
  { id: "trending", label: "Trending" },
  { id: "gainers", label: "Gainers" },
  { id: "scan-feed", label: "Scans" },
];

const fallbackTokenImage =
  "https://app.quickscope.gg/favicon.ico";

function formatCompactUsd(value: number): string {
  if (!Number.isFinite(value) || value <= 0) {
    return "$0";
  }

  const absValue = Math.abs(value);
  if (absValue >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(2)}B`;
  }
  if (absValue >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }
  if (absValue >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}K`;
  }
  if (absValue >= 1) {
    return `$${value.toFixed(2)}`;
  }

  return `$${value.toFixed(4)}`;
}

function formatPercent(value: number): string {
  if (!Number.isFinite(value)) {
    return "0.0%";
  }

  const prefix = value > 0 ? "+" : "";
  return `${prefix}${value.toFixed(1)}%`;
}

function formatCompactNumber(value: number): string {
  if (!Number.isFinite(value) || value <= 0) {
    return "0";
  }

  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }

  return String(Math.round(value));
}

function formatAgeFromSeconds(unixSeconds: number): string {
  if (!Number.isFinite(unixSeconds) || unixSeconds <= 0) {
    return "n/a";
  }

  const elapsedSeconds = Math.max(0, Math.floor(Date.now() / 1000) - unixSeconds);
  if (elapsedSeconds < 60) {
    return `${elapsedSeconds}s`;
  }
  if (elapsedSeconds < 3600) {
    return `${Math.floor(elapsedSeconds / 60)}m`;
  }
  if (elapsedSeconds < 86400) {
    return `${Math.floor(elapsedSeconds / 3600)}h`;
  }
  if (elapsedSeconds < 604800) {
    return `${Math.floor(elapsedSeconds / 86400)}d`;
  }
  return `${Math.floor(elapsedSeconds / 604800)}w`;
}

/** Short label for the launchpad / exchange */
function launchpadLabel(platform?: string, exchange?: string): string | null {
  const raw = (platform || exchange || "").toLowerCase();
  if (!raw) return null;
  if (raw.includes("pump")) return "Pump";
  if (raw.includes("meteora")) return "Met";
  if (raw.includes("raydium")) return "Ray";
  if (raw.includes("orca")) return "Orca";
  if (raw.includes("bonk")) return "Bonk";
  if (raw.includes("believe")) return "Blv";
  if (raw.includes("moonshot")) return "Moon";
  if (raw.includes("jupiter") || raw.includes("jup")) return "Jup";
  // fallback: first 4 chars capitalized
  return raw.charAt(0).toUpperCase() + raw.slice(1, 4);
}

export function DiscoveryScreen({ rpcClient, params }: DiscoveryScreenProps) {
  const navigation = useNavigation<BottomTabNavigationProp<RootTabs>>();
  const rootNavigation = navigation.getParent<NavigationProp<RootStack>>();
  const requestSeqRef = useRef(0);
  const mountTimestampRef = useRef(Date.now());
  const firstDataLoggedRef = useRef(false);
  const [activeTab, setActiveTab] = useState<DiscoveryTabId>("trending");
  const [rows, setRows] = useState<DiscoveryToken[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorText, setErrorText] = useState<string | undefined>();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [lastUpdatedMs, setLastUpdatedMs] = useState<number | undefined>();
  const [starredMints, setStarredMints] = useState<Record<string, boolean>>({});

  const loadRows = useCallback(
    async (options?: { refreshing?: boolean }) => {
      const requestId = ++requestSeqRef.current;
      const isRefreshingRequest = options?.refreshing ?? false;
      const fetchStartedAt = Date.now();
      if (__DEV__) {
        console.log("[perf] Discovery fetch start", {
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
        const result = await fetchDiscoveryTokens(rpcClient, activeTab);
        if (requestId !== requestSeqRef.current) {
          return;
        }

        setRows(result.rows);
        setLastUpdatedMs(result.fetchedAtMs);
        setErrorText(undefined);
        if (__DEV__) {
          console.log("[perf] Discovery fetch success", {
            tab: activeTab,
            ms: Date.now() - fetchStartedAt,
            rows: result.rows.length,
          });
        }
        if (!firstDataLoggedRef.current) {
          firstDataLoggedRef.current = true;
          if (__DEV__) {
            console.log("[perf] Discovery first data", {
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
          console.log("[perf] Discovery fetch error", {
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

  const selectedTokenAddress = params?.tokenAddress;

  const topMovers = useMemo(() => {
    return rows
      .slice()
      .sort((a, b) => b.oneHourChangePercent - a.oneHourChangePercent)
      .slice(0, 5);
  }, [rows]);

  const toggleStar = useCallback((mint: string) => {
    setStarredMints((current) => ({
      ...current,
      [mint]: !current[mint],
    }));
  }, []);

  const handleCopyAddress = useCallback(async (mint: string) => {
    await Clipboard.setStringAsync(mint);
    haptics.success();
    toast.success("Address copied", mint);
  }, []);

  const handleOpenExternal = useCallback(async (url: string) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        toast.error("Invalid link", "Unable to open this URL.");
        return;
      }

      await Linking.openURL(url);
    } catch (error) {
      toast.error("Open failed", String(error));
    }
  }, []);

  const handleOpenTokenDetail = useCallback(
    (token: DiscoveryToken) => {
      rootNavigation?.navigate("TokenDetail", {
        source: "discovery-row",
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

  const handleFilterPress = useCallback(() => {
    // TODO: open filter sheet
    toast.info("Filters", "Filter preferences coming soon.");
  }, []);

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
          {selectedTokenAddress ? (
            <View style={styles.deepLinkNote}>
              <Text style={styles.deepLinkTitle}>Opened from deep link</Text>
              <Text style={styles.deepLinkBody}>{selectedTokenAddress}</Text>
            </View>
          ) : null}

          {errorText ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>Failed to load discovery list.</Text>
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

          {/* ── Top Movers (above tabs) ── */}
          {!isInitialLoading && topMovers.length > 0 ? (
            <View style={styles.topMoversSection}>
              <Text style={styles.topMoversHeader}>Top Movers</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.topMoversScroll}
              >
                {topMovers.map((token) => {
                  const changeColor =
                    token.oneHourChangePercent >= 0 ? qsColors.buyGreen : qsColors.sellRed;
                  return (
                    <Pressable
                      key={token.mint}
                      style={styles.topMoverCard}
                      onPress={() => handleOpenTokenDetail(token)}
                    >
                      <Image
                        source={{ uri: token.imageUri || fallbackTokenImage }}
                        style={styles.topMoverImage}
                      />
                      <Text style={styles.topMoverSymbol} numberOfLines={1}>
                        {token.symbol || "Unknown"}
                      </Text>
                      <Text style={[styles.topMoverChange, { color: changeColor }]}>
                        {formatPercent(token.oneHourChangePercent)}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          ) : null}

          {/* ── Tab pills + filter icon (below Top Movers) ── */}
          <View style={styles.tabRow}>
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
            <Pressable onPress={handleFilterPress} style={styles.filterButton} hitSlop={8}>
              <SlidersHorizontal size={18} color={qsColors.textSecondary} />
            </Pressable>
          </View>

          {/* ── Column headers ── */}
          {!isInitialLoading && rows.length > 0 ? (
            <View style={styles.columnHeaders}>
              <View style={styles.colHeaderLeft}>
                <Text style={styles.colHeaderText}>Token</Text>
              </View>
              <View style={styles.colHeaderMetric}>
                <Text style={styles.colHeaderText}>
                  {activeTab === "scan-feed" ? "Vol / Scans" : "Vol / TXs"}
                </Text>
              </View>
              <View style={styles.colHeaderMetric}>
                <Text style={styles.colHeaderText}>MC / 1h</Text>
              </View>
            </View>
          ) : null}
        </View>
      }
      renderItem={({ item }) => {
        const highlighted = selectedTokenAddress === item.mint;
        const isStarred = Boolean(starredMints[item.mint]);
        const badge = launchpadLabel(item.platform, item.exchange);
        const isPositive = item.oneHourChangePercent >= 0;

        return (
          <Pressable
            style={[styles.rowItem, highlighted ? styles.rowItemHighlighted : null]}
            onPress={() => handleOpenTokenDetail(item)}
          >
            {/* ── Main row: image + name + metric columns ── */}
            <View style={styles.rowMain}>
              {/* Token image with launchpad badge overlay */}
              <View style={styles.imageWrap}>
                <Image
                  source={{ uri: item.imageUri || fallbackTokenImage }}
                  style={styles.tokenImage}
                />
                {badge ? (
                  <View style={styles.launchBadge}>
                    <Text style={styles.launchBadgeText}>{badge}</Text>
                  </View>
                ) : null}
              </View>

              {/* Name column with star + copy inline */}
              <View style={styles.nameColumn}>
                <View style={styles.nameRow}>
                  <Text numberOfLines={1} style={styles.tokenSymbol}>
                    {item.symbol || "Unknown"}
                  </Text>
                  <Pressable
                    onPress={(event) => {
                      stopRowPress(event);
                      void handleCopyAddress(item.mint);
                    }}
                    hitSlop={6}
                  >
                    <Copy size={12} color={qsColors.textTertiary} />
                  </Pressable>
                  <Pressable
                    onPress={(event) => {
                      stopRowPress(event);
                      toggleStar(item.mint);
                    }}
                    hitSlop={6}
                  >
                    <Star
                      size={13}
                      color={isStarred ? qsColors.accent : qsColors.textTertiary}
                      fill={isStarred ? qsColors.accent : "none"}
                    />
                  </Pressable>
                </View>
                <Text numberOfLines={1} style={styles.tokenName}>
                  {item.name || "Unnamed"}
                </Text>
              </View>

              {/* Vol / TX (or Scans) column */}
              <View style={styles.metricCol}>
                <Text numberOfLines={1} style={styles.metricValue}>
                  {formatCompactUsd(item.oneHourVolumeUsd)}
                </Text>
                <Text numberOfLines={1} style={styles.metricSub}>
                  {activeTab === "scan-feed"
                    ? `${formatCompactNumber(item.scanMentionsOneHour)} scans`
                    : `${formatCompactNumber(item.oneHourTxCount)} txs`}
                </Text>
              </View>

              {/* MC / 1h% column */}
              <View style={styles.metricCol}>
                <Text numberOfLines={1} style={styles.metricValue}>
                  {formatCompactUsd(item.marketCapUsd)}
                </Text>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.changeValue,
                    { color: isPositive ? qsColors.buyGreen : qsColors.sellRed },
                  ]}
                >
                  {formatPercent(item.oneHourChangePercent)}
                </Text>
              </View>
            </View>

            {/* ── Footer: age + social links ── */}
            <View style={styles.rowFooter}>
              <Text style={styles.ageText}>
                {formatAgeFromSeconds(item.mintedAtSeconds)}
              </Text>
              <View style={styles.linksRow}>
                {item.twitterUrl ? (
                  <Pressable
                    style={styles.linkChip}
                    onPress={(event) => {
                      stopRowPress(event);
                      void handleOpenExternal(item.twitterUrl!);
                    }}
                  >
                    <XIcon size={13} color={qsColors.textSecondary} />
                  </Pressable>
                ) : null}
                {item.telegramUrl ? (
                  <Pressable
                    style={styles.linkChip}
                    onPress={(event) => {
                      stopRowPress(event);
                      void handleOpenExternal(item.telegramUrl!);
                    }}
                  >
                    <TelegramIcon size={13} color={qsColors.textSecondary} />
                  </Pressable>
                ) : null}
                {item.websiteUrl ? (
                  <Pressable
                    style={styles.linkChip}
                    onPress={(event) => {
                      stopRowPress(event);
                      void handleOpenExternal(item.websiteUrl!);
                    }}
                  >
                    <Globe size={13} color={qsColors.textSecondary} />
                  </Pressable>
                ) : null}
              </View>
            </View>
          </Pressable>
        );
      }}
      ListEmptyComponent={
        isInitialLoading ? null : (
          <EmptyState
            icon={Compass}
            title="No tokens found"
            subtitle="Try a different category or pull down to refresh."
          />
        )
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

  // ── Tabs + filter ──
  tabRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: qsSpacing.sm,
  },
  tabsWrap: {
    flex: 1,
    flexDirection: "row",
    gap: qsSpacing.sm,
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
  filterButton: {
    width: 36,
    height: 36,
    borderRadius: qsRadius.pill,
    backgroundColor: qsColors.layer2,
    alignItems: "center",
    justifyContent: "center",
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
  deepLinkBody: {
    color: qsColors.textSecondary,
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

  // ── Top Movers ──
  topMoversSection: {
    gap: qsSpacing.sm,
  },
  topMoversHeader: {
    color: qsColors.textPrimary,
    fontSize: 15,
    fontWeight: qsTypography.weight.semi,
  },
  topMoversScroll: {
    gap: qsSpacing.sm,
  },
  topMoverCard: {
    width: 110,
    backgroundColor: qsColors.layer1,
    borderRadius: qsRadius.lg,
    paddingVertical: 12,
    paddingHorizontal: qsSpacing.sm,
    alignItems: "center",
    gap: 6,
  },
  topMoverImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: qsColors.layer3,
  },
  topMoverSymbol: {
    color: qsColors.textPrimary,
    fontSize: 12,
    fontWeight: qsTypography.weight.semi,
  },
  topMoverChange: {
    fontSize: 12,
    fontWeight: qsTypography.weight.bold,
  },

  // ── Token rows ──
  rowItem: {
    paddingHorizontal: qsSpacing.lg,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: qsColors.layer0,
  },
  rowItemHighlighted: {
    backgroundColor: qsColors.layer1,
  },
  rowMain: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  // Image with launchpad badge overlay
  imageWrap: {
    width: 44,
    height: 44,
    position: "relative",
  },
  tokenImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: qsColors.layer3,
  },
  launchBadge: {
    position: "absolute",
    top: -3,
    left: -5,
    backgroundColor: qsColors.layer1,
    borderRadius: qsRadius.xs,
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
  launchBadgeText: {
    fontSize: 8,
    fontWeight: qsTypography.weight.bold,
    color: qsColors.textSecondary,
  },

  // Name column
  nameColumn: {
    flex: 1,
    gap: 1,
  },
  nameRow: {
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
  tokenName: {
    color: qsColors.textTertiary,
    fontSize: 11,
  },
  ageText: {
    color: qsColors.buyGreen,
    fontSize: 10,
    fontWeight: qsTypography.weight.semi,
  },

  // GMGN-style metric columns (Vol/TX and MC/1h%)
  metricCol: {
    alignItems: "flex-end",
    gap: 2,
    minWidth: 64,
  },
  metricValue: {
    color: qsColors.textPrimary,
    fontSize: 12,
    fontWeight: qsTypography.weight.semi,
    fontVariant: ["tabular-nums"],
  },
  metricSub: {
    color: qsColors.textSecondary,
    fontSize: 12,
    fontWeight: qsTypography.weight.semi,
    fontVariant: ["tabular-nums"],
  },
  changeValue: {
    fontSize: 12,
    fontWeight: qsTypography.weight.semi,
    fontVariant: ["tabular-nums"],
  },

  // Column headers
  columnHeaders: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: qsSpacing.lg,
    gap: 8,
  },
  colHeaderLeft: {
    flex: 1,
  },
  colHeaderMetric: {
    alignItems: "flex-end",
    minWidth: 64,
  },
  colHeaderText: {
    color: qsColors.textSubtle,
    fontSize: 10,
    fontWeight: qsTypography.weight.semi,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Footer
  rowFooter: {
    marginTop: 4,
    marginLeft: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  footerMeta: {
    color: qsColors.textSubtle,
    fontSize: 10,
  },
  linksRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  linkChip: {
    borderRadius: 999,
    backgroundColor: qsColors.layer2,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },

});
