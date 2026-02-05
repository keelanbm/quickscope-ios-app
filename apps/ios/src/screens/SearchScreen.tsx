import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
  TextInput,
  View,
} from "react-native";

import {
  fetchSearchTokens,
  type SearchToken,
} from "@/src/features/search/searchService";
import type { RpcClient } from "@/src/lib/api/rpcClient";
import type { RootStack, TradeRouteParams } from "@/src/navigation/types";
import { qsColors, qsRadius, qsSpacing } from "@/src/theme/tokens";

type SearchScreenProps = {
  rpcClient: RpcClient;
  params?: TradeRouteParams;
};

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

function initialQueryFromParams(params?: TradeRouteParams): string {
  if (!params) {
    return "";
  }

  return params.tokenAddress || params.inputMint || params.outputMint || "";
}

function tokenRelevance(token: SearchToken, normalizedQuery: string): number {
  const mint = token.mint.toLowerCase();
  const symbol = (token.symbol || "").toLowerCase();
  const name = (token.name || "").toLowerCase();

  if (mint === normalizedQuery) {
    return 1000;
  }
  if (symbol === normalizedQuery) {
    return 900;
  }
  if (symbol.startsWith(normalizedQuery)) {
    return 800;
  }
  if (name.startsWith(normalizedQuery)) {
    return 700;
  }
  if (mint.includes(normalizedQuery)) {
    return 600;
  }
  if (symbol.includes(normalizedQuery)) {
    return 500;
  }
  if (name.includes(normalizedQuery)) {
    return 400;
  }

  return 0;
}

export function SearchScreen({ rpcClient, params }: SearchScreenProps) {
  const navigation = useNavigation<NavigationProp<RootStack>>();
  const requestSeqRef = useRef(0);
  const [rows, setRows] = useState<SearchToken[]>([]);
  const [query, setQuery] = useState(initialQueryFromParams(params));
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorText, setErrorText] = useState<string | undefined>();
  const [lastUpdatedMs, setLastUpdatedMs] = useState<number | undefined>();

  useEffect(() => {
    setQuery(initialQueryFromParams(params));
  }, [params]);

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
        const result = await fetchSearchTokens(rpcClient);
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
    [rpcClient]
  );

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return rows.slice(0, 60);
    }

    return rows
      .map((token) => ({
        token,
        relevance: tokenRelevance(token, normalizedQuery),
      }))
      .filter((entry) => entry.relevance > 0)
      .sort((left, right) => {
        if (right.relevance !== left.relevance) {
          return right.relevance - left.relevance;
        }

        return right.token.oneHourVolumeUsd - left.token.oneHourVolumeUsd;
      })
      .slice(0, 80)
      .map((entry) => entry.token);
  }, [query, rows]);

  const updatedText = useMemo(() => {
    if (!lastUpdatedMs) {
      return "Not synced";
    }

    return `Updated ${new Date(lastUpdatedMs).toLocaleTimeString()}`;
  }, [lastUpdatedMs]);

  const stopRowPress = useCallback((event: GestureResponderEvent) => {
    event.stopPropagation();
  }, []);

  const handleOpenTokenDetail = useCallback(
    (token: SearchToken) => {
      navigation.navigate("TokenDetail", {
        source: "deep-link",
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
    [navigation]
  );

  const handleOpenTokenDetailFromAddress = useCallback(
    (tokenAddress: string) => {
      navigation.navigate("TokenDetail", {
        source: "deep-link",
        tokenAddress,
      });
    },
    [navigation]
  );

  const handleCopyAddress = useCallback(async (mint: string) => {
    await Clipboard.setStringAsync(mint);
    Alert.alert("Address copied", mint);
  }, []);

  return (
    <FlatList
      data={filteredRows}
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
          <Text style={styles.title}>Search</Text>
          <Text style={styles.subtitle}>Find tokens by symbol, name, or contract address.</Text>
          <Text style={styles.metaText}>{updatedText}</Text>

          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search ticker, name, or CA"
            placeholderTextColor={qsColors.textSubtle}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.searchInput}
          />

          {params?.source ? (
            <View style={styles.deepLinkNote}>
              <Text style={styles.deepLinkTitle}>Opened from deep link</Text>
              {params.tokenAddress ? (
                <>
                  <Text style={styles.deepLinkBody}>Token: {params.tokenAddress}</Text>
                  <Pressable
                    style={styles.deepLinkAction}
                    onPress={() => handleOpenTokenDetailFromAddress(params.tokenAddress!)}
                  >
                    <Text style={styles.deepLinkActionText}>Open token detail</Text>
                  </Pressable>
                </>
              ) : null}
              {params.inputMint ? (
                <Text style={styles.deepLinkBody}>Input mint: {params.inputMint}</Text>
              ) : null}
              {params.outputMint ? (
                <Text style={styles.deepLinkBody}>Output mint: {params.outputMint}</Text>
              ) : null}
              {params.amount ? <Text style={styles.deepLinkBody}>Amount: {params.amount}</Text> : null}
            </View>
          ) : null}

          {errorText ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>Failed to load token search index.</Text>
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

          {isInitialLoading ? <Text style={styles.loadingText}>Loading search index...</Text> : null}
        </View>
      }
      renderItem={({ item }) => {
        const platformLabel = (item.platform || item.exchange || "unknown").toUpperCase();

        return (
          <Pressable style={styles.rowItem} onPress={() => handleOpenTokenDetail(item)}>
            <View style={styles.rowMain}>
              <View style={styles.tokenColumn}>
                <Image source={{ uri: item.imageUri || fallbackTokenImage }} style={styles.tokenImage} />
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
                <Text
                  style={[
                    styles.metricChange,
                    item.oneHourChangePercent >= 0 ? styles.metricChangePositive : styles.metricChangeNegative,
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
                  <Text style={styles.openText}>Open</Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        );
      }}
      ListEmptyComponent={
        !isInitialLoading && !errorText ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>No matches</Text>
            <Text style={styles.emptyBody}>
              Try a different symbol, name, or contract address.
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
  title: {
    color: qsColors.textPrimary,
    fontSize: 28,
    fontWeight: "700",
  },
  subtitle: {
    color: qsColors.textMuted,
    fontSize: 13,
  },
  metaText: {
    color: qsColors.textSubtle,
    fontSize: 11,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    borderRadius: qsRadius.md,
    backgroundColor: qsColors.bgCard,
    color: qsColors.textPrimary,
    fontSize: 14,
    paddingHorizontal: qsSpacing.md,
    paddingVertical: 10,
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
  deepLinkAction: {
    marginTop: 4,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    borderRadius: qsRadius.sm,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: qsColors.bgCard,
  },
  deepLinkActionText: {
    color: qsColors.accent,
    fontSize: 11,
    fontWeight: "700",
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
  rowItem: {
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    borderRadius: qsRadius.md,
    paddingVertical: qsSpacing.xs,
    paddingHorizontal: qsSpacing.sm,
    marginTop: qsSpacing.xs,
    backgroundColor: qsColors.bgCard,
  },
  rowMain: {
    flexDirection: "row",
    alignItems: "center",
  },
  tokenColumn: {
    flex: 1.8,
    flexDirection: "row",
    alignItems: "center",
    gap: qsSpacing.xs,
    paddingRight: qsSpacing.xs,
  },
  tokenImage: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: qsColors.bgCardSoft,
  },
  tokenTextColumn: {
    flex: 1,
  },
  tokenSymbol: {
    color: qsColors.textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  tokenName: {
    color: qsColors.textMuted,
    fontSize: 11,
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
    gap: 2,
    paddingRight: qsSpacing.xs,
  },
  metricValue: {
    color: qsColors.textSecondary,
    fontSize: 12,
    fontVariant: ["tabular-nums"],
    fontWeight: "600",
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
    width: 52,
    alignItems: "flex-end",
    gap: 4,
  },
  linkText: {
    color: qsColors.textMuted,
    fontSize: 11,
    textDecorationLine: "underline",
  },
  openText: {
    color: qsColors.accent,
    fontSize: 12,
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
