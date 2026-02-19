import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useNavigation, type NavigationProp } from "@react-navigation/native";
import * as Clipboard from "expo-clipboard";
import {
  Alert,
  FlatList,
  type GestureResponderEvent,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  fetchScopeTokens,
  type ScopeTabId,
  type ScopeToken,
} from "@/src/features/scope/scopeService";
import type { RpcClient } from "@/src/lib/api/rpcClient";
import type { RootStack, RootTabs, ScopeRouteParams } from "@/src/navigation/types";
import { qsColors, qsRadius, qsSpacing } from "@/src/theme/tokens";

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
  { id: "graduated", label: "Graduated" },
  { id: "scan-feed", label: "Scan Feed" },
];

const fallbackTokenImage = "https://app.quickscope.gg/favicon.ico";

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
  const [lastUpdatedMs, setLastUpdatedMs] = useState<number | undefined>();

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
        setLastUpdatedMs(result.fetchedAtMs);
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

  const rowCountText = useMemo(() => `${rows.length} tokens`, [rows.length]);
  const updatedText = useMemo(() => {
    if (!lastUpdatedMs) {
      return "Not synced";
    }

    return `Updated ${new Date(lastUpdatedMs).toLocaleTimeString()}`;
  }, [lastUpdatedMs]);

  const handleCopyAddress = useCallback(async (mint: string) => {
    await Clipboard.setStringAsync(mint);
    Alert.alert("Address copied", mint);
  }, []);

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
  const chipHitSlop = { top: 6, bottom: 6, left: 6, right: 6 };

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
          <View style={styles.tabsWrap}>
            {tabs.map((tab) => {
              const active = tab.id === activeTab;
              return (
                <Pressable
                  key={tab.id}
                  onPress={() => setActiveTab(tab.id)}
                  style={[styles.tabButton, active ? styles.tabButtonActive : null]}
                  hitSlop={chipHitSlop}
                >
                  <Text style={[styles.tabButtonText, active ? styles.tabButtonTextActive : null]}>
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
            <Pressable style={styles.filterButton} hitSlop={chipHitSlop}>
              <Text style={styles.filterButtonText}>Filter</Text>
            </Pressable>
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaText}>{rowCountText}</Text>
            <Text style={styles.metaText}>{updatedText}</Text>
          </View>

          {__DEV__ && params?.source ? (
            <View style={styles.deepLinkNote}>
              <Text style={styles.deepLinkTitle}>Opened from deep link</Text>
              <Text style={styles.deepLinkBody}>
                Scope feed launched from a quickscope://scope style route.
              </Text>
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

          {isInitialLoading ? <Text style={styles.loadingText}>Loading scope feed...</Text> : null}

          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.tableHeaderToken]}>Token</Text>
            <Text style={[styles.tableHeaderText, styles.tableHeaderMetric]}>MC</Text>
            <Text style={[styles.tableHeaderText, styles.tableHeaderMetric]}>Age</Text>
            <Text style={[styles.tableHeaderText, styles.tableHeaderMetric]}>1h Tx</Text>
            <Text style={[styles.tableHeaderText, styles.tableHeaderMetric]}>1h %</Text>
            <Text style={[styles.tableHeaderText, styles.tableHeaderActions]}>Act</Text>
          </View>
        </View>
      }
      renderItem={({ item }) => {
        const platformLabel = (item.platform || item.exchange || "unknown").toUpperCase();

        return (
          <Pressable style={styles.rowItem} onPress={() => handleOpenTokenDetail(item)}>
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
                <Text numberOfLines={1} style={styles.metricValue}>
                  {item.oneHourTxCount.toLocaleString()}
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
                    void handleCopyAddress(item.mint);
                  }}
                  hitSlop={6}
                >
                  <Text style={styles.linkText}>Copy</Text>
                </Pressable>
                <Pressable
                  onPress={(event) => {
                    stopRowPress(event);
                    handleOpenTokenDetail(item);
                  }}
                  hitSlop={6}
                >
                  <Text style={styles.tradeText}>Trade</Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        );
      }}
      ListEmptyComponent={
        !isInitialLoading && !errorText ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>No scope results</Text>
            <Text style={styles.emptyBody}>
              Pull to refresh or switch tabs to load a different sort lens.
            </Text>
          </View>
        ) : null
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
    paddingHorizontal: qsSpacing.lg,
    paddingBottom: qsSpacing.xl,
  },
  headerWrap: {
    paddingTop: qsSpacing.lg,
    paddingBottom: qsSpacing.sm,
    gap: qsSpacing.sm,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metaText: {
    color: qsColors.textSubtle,
    fontSize: 11,
  },
  tabsWrap: {
    flexDirection: "row",
    gap: qsSpacing.xs,
    flexWrap: "wrap",
  },
  tabButton: {
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    borderRadius: qsRadius.lg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: qsColors.bgCardSoft,
  },
  tabButtonActive: {
    backgroundColor: "#13253d",
    borderColor: qsColors.accent,
  },
  tabButtonText: {
    color: qsColors.textSecondary,
    fontSize: 11,
    fontWeight: "600",
  },
  tabButtonTextActive: {
    color: qsColors.accent,
  },
  filterButton: {
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    borderRadius: qsRadius.lg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: qsColors.bgCardSoft,
  },
  filterButtonText: {
    color: qsColors.textSecondary,
    fontSize: 11,
    fontWeight: "600",
  },
  deepLinkNote: {
    borderWidth: 1,
    borderColor: qsColors.accent,
    borderRadius: qsRadius.md,
    backgroundColor: qsColors.bgCardSoft,
    padding: qsSpacing.sm,
    gap: 4,
  },
  deepLinkTitle: {
    color: qsColors.textPrimary,
    fontSize: 12,
    fontWeight: "600",
  },
  deepLinkBody: {
    color: qsColors.textSecondary,
    fontSize: 12,
  },
  errorBox: {
    borderWidth: 1,
    borderColor: qsColors.danger,
    borderRadius: qsRadius.md,
    padding: qsSpacing.sm,
    backgroundColor: "#3a1e2a",
    gap: 2,
  },
  errorText: {
    color: qsColors.danger,
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
    color: qsColors.textMuted,
    fontSize: 12,
  },
  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    borderRadius: qsRadius.md,
    paddingVertical: 6,
    paddingHorizontal: qsSpacing.sm,
    backgroundColor: qsColors.bgCardSoft,
  },
  tableHeaderText: {
    color: qsColors.textSubtle,
    fontSize: 9,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  tableHeaderToken: {
    flex: 2.2,
  },
  tableHeaderMetric: {
    flex: 1,
    textAlign: "right",
  },
  tableHeaderActions: {
    flex: 1.1,
    textAlign: "right",
  },
  rowItem: {
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    borderRadius: qsRadius.md,
    paddingVertical: 6,
    paddingHorizontal: qsSpacing.sm,
    marginTop: qsSpacing.xs,
    backgroundColor: qsColors.bgCard,
  },
  rowMain: {
    flexDirection: "row",
    alignItems: "center",
  },
  tokenColumn: {
    flex: 2.2,
    flexDirection: "row",
    alignItems: "center",
    gap: qsSpacing.xs,
    paddingRight: qsSpacing.xs,
  },
  tokenImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: qsColors.bgCardSoft,
  },
  tokenTextColumn: {
    flex: 1,
  },
  tokenSymbol: {
    color: qsColors.textPrimary,
    fontSize: 12,
    fontWeight: "700",
  },
  tokenName: {
    color: qsColors.textMuted,
    fontSize: 10,
  },
  tagPill: {
    marginTop: 2,
    alignSelf: "flex-start",
    color: qsColors.textSubtle,
    backgroundColor: qsColors.bgCardSoft,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    borderRadius: qsRadius.lg,
    paddingHorizontal: 6,
    fontSize: 9,
    overflow: "hidden",
  },
  metricColumn: {
    flex: 1,
    alignItems: "flex-end",
    paddingRight: qsSpacing.xs,
  },
  metricValue: {
    color: qsColors.textSecondary,
    fontSize: 11,
    fontVariant: ["tabular-nums"],
  },
  metricChange: {
    fontSize: 11,
    fontVariant: ["tabular-nums"],
    fontWeight: "600",
  },
  metricChangePositive: {
    color: qsColors.success,
  },
  metricChangeNegative: {
    color: qsColors.danger,
  },
  actionsColumn: {
    flex: 1.1,
    alignItems: "flex-end",
    gap: 4,
  },
  linkText: {
    color: qsColors.textMuted,
    fontSize: 11,
    textDecorationLine: "underline",
  },
  tradeText: {
    color: qsColors.accent,
    fontSize: 11,
    fontWeight: "700",
  },
  emptyBox: {
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    borderRadius: qsRadius.md,
    padding: qsSpacing.md,
    marginTop: qsSpacing.sm,
    backgroundColor: qsColors.bgCardSoft,
    gap: 4,
  },
  emptyTitle: {
    color: qsColors.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
  emptyBody: {
    color: qsColors.textMuted,
    fontSize: 12,
  },
});
