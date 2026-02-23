import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useNavigation, type NavigationProp } from "@react-navigation/native";
import * as Clipboard from "expo-clipboard";
import React from "react";
import {
  FlatList,
  type ListRenderItemInfo,
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
import { Compass, SlidersHorizontal } from "@/src/ui/icons";
import { EmptyState } from "@/src/ui/EmptyState";
import { SkeletonRow } from "@/src/ui/Skeleton";
import { TokenAvatar } from "@/src/ui/TokenAvatar";
import { TokenListCard } from "@/src/ui/TokenListCard";

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

function formatCompactUsd(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "$0";
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
}

function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return "0.0%";
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${value.toFixed(1)}%`;
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
      .slice(0, 8);
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

  const renderRow = useCallback(
    ({ item }: ListRenderItemInfo<DiscoveryToken>) => (
      <TokenListCard
        symbol={item.symbol}
        name={item.name}
        imageUri={item.imageUri}
        mint={item.mint}
        marketCapUsd={item.marketCapUsd}
        oneHourVolumeUsd={item.oneHourVolumeUsd}
        oneHourTxCount={item.oneHourTxCount}
        oneHourChangePercent={item.oneHourChangePercent}
        platformLabel={launchpadLabel(item.platform, item.exchange) ?? undefined}
        twitterUrl={item.twitterUrl}
        telegramUrl={item.telegramUrl}
        websiteUrl={item.websiteUrl}
        onPress={() => handleOpenTokenDetail(item)}
        onToggleStar={() => toggleStar(item.mint)}
        isStarred={Boolean(starredMints[item.mint])}
        highlighted={selectedTokenAddress === item.mint}
      />
    ),
    [selectedTokenAddress, starredMints, handleOpenTokenDetail, toggleStar]
  );

  const handleFilterPress = useCallback(() => {
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

          {/* ── Top Movers carousel ── */}
          {!isInitialLoading && topMovers.length > 0 ? (
            <View style={styles.topMoversSection}>
              <Text style={styles.topMoversHeader}>Top Movers</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.topMoversScroll}
              >
                {topMovers.map((token) => {
                  const isPositive = token.oneHourChangePercent >= 0;
                  return (
                    <Pressable
                      key={token.mint}
                      style={styles.topMoverCard}
                      onPress={() => handleOpenTokenDetail(token)}
                    >
                      <TokenAvatar uri={token.imageUri} size={32} />
                      <Text style={styles.topMoverSymbol} numberOfLines={1}>
                        {token.symbol || "???"}
                      </Text>
                      <Text style={styles.topMoverMC} numberOfLines={1}>
                        {formatCompactUsd(token.marketCapUsd)}
                      </Text>
                      <Text
                        style={[
                          styles.topMoverChange,
                          { color: isPositive ? qsColors.buyGreen : qsColors.sellRed },
                        ]}
                        numberOfLines={1}
                      >
                        {formatPercent(token.oneHourChangePercent)}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          ) : null}

          {/* ── Tab pills + filter icon ── */}
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
        </View>
      }
      renderItem={renderRow}
      windowSize={10}
      maxToRenderPerBatch={10}
      removeClippedSubviews
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
    width: 120,
    backgroundColor: qsColors.layer1,
    borderRadius: qsRadius.lg,
    paddingVertical: 12,
    paddingHorizontal: qsSpacing.sm,
    alignItems: "center",
    gap: 4,
  },
  topMoverSymbol: {
    color: qsColors.textPrimary,
    fontSize: 13,
    fontWeight: qsTypography.weight.bold,
    marginTop: 4,
  },
  topMoverMC: {
    color: qsColors.textSecondary,
    fontSize: 11,
    fontWeight: qsTypography.weight.medium,
    fontVariant: ["tabular-nums"],
  },
  topMoverChange: {
    fontSize: 13,
    fontWeight: qsTypography.weight.bold,
    fontVariant: ["tabular-nums"],
  },
});
