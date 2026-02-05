import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useNavigation, type NavigationProp } from "@react-navigation/native";
import * as Clipboard from "expo-clipboard";
import {
  Alert,
  FlatList,
  type GestureResponderEvent,
  Image,
  Linking,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  fetchDiscoveryTokens,
  type DiscoveryTabId,
  type DiscoveryToken,
} from "@/src/features/discovery/discoveryService";
import type { RpcClient } from "@/src/lib/api/rpcClient";
import type { DiscoveryRouteParams, RootStack, RootTabs } from "@/src/navigation/types";
import { qsColors, qsRadius, qsSpacing } from "@/src/theme/tokens";

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
  { id: "scan-feed", label: "Scan Feed" },
  { id: "gainers", label: "Gainers" },
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

function tabSubtitle(activeTab: DiscoveryTabId): string {
  if (activeTab === "scan-feed") {
    return "Sorted by 1h scan mentions";
  }

  if (activeTab === "gainers") {
    return "Sorted by 1h percentage gain";
  }

  return "Sorted by 1h volume";
}

export function DiscoveryScreen({ rpcClient, params }: DiscoveryScreenProps) {
  const navigation = useNavigation<BottomTabNavigationProp<RootTabs>>();
  const rootNavigation = navigation.getParent<NavigationProp<RootStack>>();
  const requestSeqRef = useRef(0);
  const [activeTab, setActiveTab] = useState<DiscoveryTabId>("trending");
  const [rows, setRows] = useState<DiscoveryToken[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorText, setErrorText] = useState<string | undefined>();
  const [lastUpdatedMs, setLastUpdatedMs] = useState<number | undefined>();
  const [starredMints, setStarredMints] = useState<Record<string, boolean>>({});

  const loadRows = useCallback(
    async (options?: { refreshing?: boolean }) => {
      const requestId = ++requestSeqRef.current;
      const isRefreshingRequest = options?.refreshing ?? false;
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
      } catch (error) {
        if (requestId !== requestSeqRef.current) {
          return;
        }

        setErrorText(String(error));
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
  const rowCountText = useMemo(() => `${rows.length} tokens`, [rows.length]);
  const updatedText = useMemo(() => {
    if (!lastUpdatedMs) {
      return "Not synced";
    }

    return `Updated ${new Date(lastUpdatedMs).toLocaleTimeString()}`;
  }, [lastUpdatedMs]);

  const toggleStar = useCallback((mint: string) => {
    setStarredMints((current) => ({
      ...current,
      [mint]: !current[mint],
    }));
  }, []);

  const handleCopyAddress = useCallback(async (mint: string) => {
    await Clipboard.setStringAsync(mint);
    Alert.alert("Address copied", mint);
  }, []);

  const handleOpenExternal = useCallback(async (url: string) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        Alert.alert("Invalid link", "Unable to open this URL.");
        return;
      }

      await Linking.openURL(url);
    } catch (error) {
      Alert.alert("Open failed", String(error));
    }
  }, []);

  const handleOpenTokenDetail = useCallback(
    (token: DiscoveryToken) => {
      rootNavigation?.navigate("TokenDetail", {
        source: "discovery-row",
        tokenAddress: token.mint,
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
            void loadRows({ refreshing: true });
          }}
        />
      }
      ListHeaderComponent={
        <View style={styles.headerWrap}>
          <Text style={styles.title}>Discovery</Text>
          <Text style={styles.subtitle}>{tabSubtitle(activeTab)}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>{rowCountText}</Text>
            <Text style={styles.metaText}>{updatedText}</Text>
          </View>

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
            <Text style={styles.loadingText}>Loading tokens...</Text>
          ) : null}

          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.tableHeaderToken]}>Token</Text>
            <Text style={[styles.tableHeaderText, styles.tableHeaderMetric]}>MC</Text>
            <Text style={[styles.tableHeaderText, styles.tableHeaderMetric]}>Age</Text>
            <Text style={[styles.tableHeaderText, styles.tableHeaderMetric]}>1h</Text>
            <Text style={[styles.tableHeaderText, styles.tableHeaderActions]}>Act</Text>
          </View>
        </View>
      }
      renderItem={({ item }) => {
        const highlighted = selectedTokenAddress === item.mint;
        const isStarred = Boolean(starredMints[item.mint]);
        const platformLabel = (item.platform || item.exchange || "unknown").toUpperCase();

        return (
          <Pressable
            style={[styles.rowItem, highlighted ? styles.rowItemHighlighted : null]}
            onPress={() => handleOpenTokenDetail(item)}
          >
            <View style={styles.rowMain}>
              <View style={styles.tokenColumn}>
                <Image
                  source={{ uri: item.imageUri || fallbackTokenImage }}
                  style={styles.tokenImage}
                />
                <View style={styles.tokenTextColumn}>
                  <Text numberOfLines={1} style={styles.tokenSymbol}>
                    {item.symbol || "Unknown"}
                  </Text>
                  <Text numberOfLines={1} style={styles.tokenName}>
                    {item.name || "Unnamed"}
                  </Text>
                  <Text style={styles.tagPill}>{platformLabel}</Text>
                </View>
              </View>

              <View style={styles.metricColumn}>
                <Text numberOfLines={1} style={styles.metricValue}>
                  {formatCompactUsd(item.marketCapUsd)}
                </Text>
              </View>

              <View style={styles.metricColumn}>
                <Text numberOfLines={1} style={styles.metricValue}>
                  {formatAgeFromSeconds(item.mintedAtSeconds)}
                </Text>
              </View>

              <View style={styles.metricColumn}>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.metricChange,
                    item.oneHourChangePercent >= 0
                      ? styles.metricChangePositive
                      : styles.metricChangeNegative,
                  ]}
                >
                  {formatPercent(item.oneHourChangePercent)}
                </Text>
              </View>

              <View style={styles.actionsColumn}>
                <Pressable
                  onPress={(event) => {
                    stopRowPress(event);
                    toggleStar(item.mint);
                  }}
                  hitSlop={6}
                >
                  <Text style={styles.starText}>{isStarred ? "★" : "☆"}</Text>
                </Pressable>
                <Pressable
                  style={styles.tradeButton}
                  onPress={(event) => {
                    stopRowPress(event);
                    rootNavigation?.navigate("TradeEntry", {
                      source: "deep-link",
                      tokenAddress: item.mint,
                    });
                  }}
                >
                  <Text style={styles.tradeButtonText}>Trade</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.rowFooter}>
              <Text numberOfLines={1} style={styles.footerMeta}>
                1h Vol {formatCompactUsd(item.oneHourVolumeUsd)} • Tx {item.oneHourTxCount}
                {activeTab === "scan-feed" ? ` • Scans ${item.scanMentionsOneHour}` : ""}
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
                    <Text style={styles.linkChipText}>X</Text>
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
                    <Text style={styles.linkChipText}>TG</Text>
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
                    <Text style={styles.linkChipText}>Web</Text>
                  </Pressable>
                ) : null}
                <Pressable
                  style={styles.linkChip}
                  onPress={(event) => {
                    stopRowPress(event);
                    void handleCopyAddress(item.mint);
                  }}
                >
                  <Text style={styles.linkChipText}>Copy</Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        );
      }}
      ListEmptyComponent={
        isInitialLoading ? null : (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>No tokens returned</Text>
            <Text style={styles.emptyBody}>Try another tab or pull to refresh.</Text>
          </View>
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: qsColors.bgCanvas,
  },
  content: {
    paddingHorizontal: qsSpacing.xl,
    paddingTop: qsSpacing.xl,
    paddingBottom: 140,
  },
  headerWrap: {
    gap: qsSpacing.sm,
    marginBottom: qsSpacing.xs,
  },
  title: {
    color: qsColors.textPrimary,
    fontSize: 30,
    fontWeight: "700",
  },
  subtitle: {
    color: qsColors.textMuted,
    fontSize: 14,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metaText: {
    color: qsColors.textSubtle,
    fontSize: 12,
  },
  tabsWrap: {
    flexDirection: "row",
    gap: qsSpacing.sm,
    marginTop: qsSpacing.sm,
  },
  tabButton: {
    borderRadius: qsRadius.md,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    backgroundColor: qsColors.bgCard,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  tabButtonActive: {
    backgroundColor: "#2a2f4a",
    borderColor: "#6d74a8",
  },
  tabButtonText: {
    color: qsColors.textMuted,
    fontWeight: "600",
    fontSize: 13,
  },
  tabButtonTextActive: {
    color: qsColors.textPrimary,
  },
  deepLinkNote: {
    borderRadius: qsRadius.md,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    backgroundColor: qsColors.bgCardSoft,
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
    borderWidth: 1,
    borderColor: "#6d3232",
    backgroundColor: "#2a171b",
    padding: qsSpacing.md,
    gap: 4,
  },
  errorText: {
    color: "#ffb4b4",
    fontSize: 12,
  },
  retryButton: {
    marginTop: 4,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#834242",
    borderRadius: qsRadius.sm,
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: "#3f2025",
  },
  retryButtonText: {
    color: "#ffcece",
    fontSize: 11,
    fontWeight: "700",
  },
  loadingText: {
    color: qsColors.textSubtle,
    fontSize: 13,
  },
  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: qsColors.borderDefault,
    backgroundColor: qsColors.bgCardSoft,
    paddingVertical: 8,
    paddingHorizontal: qsSpacing.sm,
  },
  tableHeaderText: {
    color: qsColors.textSubtle,
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  tableHeaderToken: {
    flex: 1,
  },
  tableHeaderMetric: {
    width: 64,
    textAlign: "right",
  },
  tableHeaderActions: {
    width: 72,
    textAlign: "right",
  },
  rowItem: {
    borderBottomWidth: 1,
    borderColor: qsColors.borderDefault,
    paddingHorizontal: qsSpacing.sm,
    paddingTop: qsSpacing.sm,
    paddingBottom: 10,
    backgroundColor: qsColors.bgCanvas,
  },
  rowItemHighlighted: {
    backgroundColor: "#141c2e",
  },
  rowMain: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 48,
  },
  tokenColumn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: qsSpacing.sm,
  },
  tokenImage: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#2c3347",
  },
  tokenTextColumn: {
    flex: 1,
    gap: 1,
  },
  tokenSymbol: {
    color: qsColors.textPrimary,
    fontSize: 15,
    fontWeight: "700",
  },
  tokenName: {
    color: qsColors.textMuted,
    fontSize: 11,
  },
  tagPill: {
    color: qsColors.textSubtle,
    backgroundColor: "#23283a",
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 999,
    fontSize: 9,
    fontWeight: "600",
    overflow: "hidden",
    alignSelf: "flex-start",
    marginTop: 2,
  },
  metricColumn: {
    width: 64,
    alignItems: "flex-end",
    justifyContent: "center",
    paddingLeft: 4,
  },
  metricValue: {
    color: qsColors.textSecondary,
    fontSize: 11,
    fontWeight: "500",
  },
  metricChange: {
    fontSize: 11,
    fontWeight: "700",
  },
  metricChangePositive: {
    color: qsColors.success,
  },
  metricChangeNegative: {
    color: qsColors.danger,
  },
  actionsColumn: {
    width: 72,
    alignItems: "flex-end",
    gap: 6,
  },
  starText: {
    color: "#ffe08f",
    fontSize: 18,
    lineHeight: 18,
  },
  tradeButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    backgroundColor: "#27204a",
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tradeButtonText: {
    color: qsColors.textPrimary,
    fontSize: 11,
    fontWeight: "600",
  },
  rowFooter: {
    marginTop: 6,
    marginLeft: 42,
    gap: 6,
  },
  footerMeta: {
    color: qsColors.textSubtle,
    fontSize: 11,
  },
  linksRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: qsSpacing.xs,
  },
  linkChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    backgroundColor: "#1d2232",
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  linkChipText: {
    color: qsColors.textSecondary,
    fontSize: 10,
    fontWeight: "600",
  },
  emptyWrap: {
    borderRadius: qsRadius.md,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    backgroundColor: qsColors.bgCard,
    padding: qsSpacing.lg,
    gap: 4,
  },
  emptyTitle: {
    color: qsColors.textPrimary,
    fontSize: 15,
    fontWeight: "600",
  },
  emptyBody: {
    color: qsColors.textMuted,
    fontSize: 13,
  },
});
