/**
 * SearchScreen – Quickscope iOS
 *
 * Three visual states:
 *   1. Zero-state  (empty query)  → Recent searches + Trending tokens
 *   2. Active search (typing)     → Instant filtered results, relevance-ranked
 *   3. CA paste    (32+ chars)    → Auto-navigate to TokenDetail
 *
 * UX upgrades over previous version:
 *   - Recent searches persisted in AsyncStorage (last 10)
 *   - Trending section in zero-state (top 8 by 1h volume)
 *   - Skeleton rows during initial load
 *   - Auto-focus keyboard on mount
 *   - Contract address auto-detect with haptic + instant navigation
 *   - Clear / Cancel affordances
 *   - Pull-to-refresh reloads the search index
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useNavigation, type NavigationProp } from "@react-navigation/native";
import * as Clipboard from "expo-clipboard";
import { haptics } from "@/src/lib/haptics";
import {
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

import { toast } from "@/src/lib/toast";
import {
  addRecentSearch,
  clearRecentSearches,
  getRecentSearches,
  removeRecentSearch,
  type RecentSearchEntry,
} from "@/src/features/search/recentSearchesStorage";
import {
  fetchSearchTokens,
  type SearchToken,
} from "@/src/features/search/searchService";
import type { RpcClient } from "@/src/lib/api/rpcClient";
import type { RootStack, TradeRouteParams } from "@/src/navigation/types";
import { qsColors, qsRadius, qsSpacing, qsTypography } from "@/src/theme/tokens";
import { Clock, Copy, Search, TrendingUp, X } from "@/src/ui/icons";
import { EmptyState } from "@/src/ui/EmptyState";

// ────────────────────────────────────────────────────────────────
//  Props
// ────────────────────────────────────────────────────────────────
type SearchScreenProps = {
  rpcClient: RpcClient;
  params?: TradeRouteParams;
};

// ────────────────────────────────────────────────────────────────
//  Constants
// ────────────────────────────────────────────────────────────────
const fallbackTokenImage = "https://app.quickscope.gg/favicon.ico";
const SOLANA_ADDRESS_MIN_LENGTH = 32;
const TRENDING_LIMIT = 8;
const RESULT_LIMIT = 80;
const SKELETON_COUNT = 6;

// ────────────────────────────────────────────────────────────────
//  Helpers (pure)
// ────────────────────────────────────────────────────────────────
function formatCompactUsd(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "$0";
  const a = Math.abs(value);
  if (a >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (a >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (a >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  if (a >= 1) return `$${value.toFixed(2)}`;
  return `$${value.toFixed(4)}`;
}

function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return "0.0%";
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${value.toFixed(1)}%`;
}

function formatCompactNumber(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "0";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(Math.round(value));
}

function formatAgeFromSeconds(unixSeconds: number): string {
  if (!Number.isFinite(unixSeconds) || unixSeconds <= 0) return "n/a";
  const elapsed = Math.max(0, Math.floor(Date.now() / 1000) - unixSeconds);
  if (elapsed < 60) return `${elapsed}s`;
  if (elapsed < 3600) return `${Math.floor(elapsed / 60)}m`;
  if (elapsed < 86400) return `${Math.floor(elapsed / 3600)}h`;
  if (elapsed < 604800) return `${Math.floor(elapsed / 86400)}d`;
  return `${Math.floor(elapsed / 604800)}w`;
}

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

function initialQueryFromParams(params?: TradeRouteParams): string {
  if (!params) return "";
  return params.tokenAddress || params.inputMint || params.outputMint || "";
}

/** Returns true if text looks like a Solana contract address. */
function looksLikeSolanaAddress(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < SOLANA_ADDRESS_MIN_LENGTH) return false;
  // Base58 characters only (no 0, O, I, l)
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(trimmed);
}

function tokenRelevance(token: SearchToken, normalizedQuery: string): number {
  const mint = token.mint.toLowerCase();
  const symbol = (token.symbol || "").toLowerCase();
  const name = (token.name || "").toLowerCase();

  if (mint === normalizedQuery) return 1000;
  if (symbol === normalizedQuery) return 900;
  if (symbol.startsWith(normalizedQuery)) return 800;
  if (name.startsWith(normalizedQuery)) return 700;
  if (mint.includes(normalizedQuery)) return 600;
  if (symbol.includes(normalizedQuery)) return 500;
  if (name.includes(normalizedQuery)) return 400;
  return 0;
}

// ────────────────────────────────────────────────────────────────
//  Component
// ────────────────────────────────────────────────────────────────
export function SearchScreen({ rpcClient, params }: SearchScreenProps) {
  const navigation = useNavigation<NavigationProp<RootStack>>();
  const requestSeqRef = useRef(0);
  const inputRef = useRef<TextInput>(null);

  // ── State ──
  const [rows, setRows] = useState<SearchToken[]>([]);
  const [query, setQuery] = useState(initialQueryFromParams(params));
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorText, setErrorText] = useState<string | undefined>();
  const [recentSearches, setRecentSearches] = useState<RecentSearchEntry[]>([]);

  // ── Deep link param sync ──
  useEffect(() => {
    setQuery(initialQueryFromParams(params));
  }, [params]);

  // ── Load recent searches on mount ──
  useEffect(() => {
    void getRecentSearches().then(setRecentSearches);
  }, []);

  // ── Auto-focus keyboard ──
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 350);
    return () => clearTimeout(timer);
  }, []);

  // ── Data fetching ──
  const loadRows = useCallback(
    async (options?: { refreshing?: boolean }) => {
      const requestId = ++requestSeqRef.current;
      const isRefreshingReq = options?.refreshing ?? false;
      if (isRefreshingReq) {
        setIsRefreshing(true);
      } else {
        setIsInitialLoading(true);
      }

      try {
        const result = await fetchSearchTokens(rpcClient);
        if (requestId !== requestSeqRef.current) return;
        setRows(result.rows);
        setErrorText(undefined);
      } catch (error) {
        if (requestId !== requestSeqRef.current) return;
        setErrorText(String(error));
      } finally {
        if (requestId !== requestSeqRef.current) return;
        setIsInitialLoading(false);
        setIsRefreshing(false);
      }
    },
    [rpcClient],
  );

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  // ── Contract address auto-detect ──
  useEffect(() => {
    if (looksLikeSolanaAddress(query)) {
      const address = query.trim();
      haptics.medium();

      // Try to find this token in the already-loaded search index
      const knownToken = rows.find((t) => t.mint === address);

      navigation.navigate("TokenDetail", {
        source: "deep-link",
        tokenAddress: address,
        ...(knownToken
          ? {
              tokenDecimals: knownToken.tokenDecimals,
              symbol: knownToken.symbol,
              name: knownToken.name,
              imageUri: knownToken.imageUri,
              platform: knownToken.platform,
              exchange: knownToken.exchange,
              marketCapUsd: knownToken.marketCapUsd,
              oneHourVolumeUsd: knownToken.oneHourVolumeUsd,
              oneHourTxCount: knownToken.oneHourTxCount,
              oneHourChangePercent: knownToken.oneHourChangePercent,
              mintedAtSeconds: knownToken.mintedAtSeconds,
              scanMentionsOneHour: knownToken.scanMentionsOneHour,
            }
          : {}),
      });

      // Record in recents
      void addRecentSearch({
        mint: address,
        symbol: knownToken?.symbol ?? address.slice(0, 6) + "…",
        name: knownToken?.name ?? "Contract address",
        imageUri: knownToken?.imageUri,
      }).then(setRecentSearches);
      setQuery("");
    }
  }, [query, navigation, rows]);

  // ── Derived data ──
  const isZeroState = query.trim().length === 0;

  const trendingTokens = useMemo(() => {
    return rows.slice(0, TRENDING_LIMIT);
  }, [rows]);

  const filteredRows = useMemo(() => {
    const nq = query.trim().toLowerCase();
    if (!nq) return [];

    return rows
      .map((token) => ({ token, relevance: tokenRelevance(token, nq) }))
      .filter((e) => e.relevance > 0)
      .sort((a, b) => {
        if (b.relevance !== a.relevance) return b.relevance - a.relevance;
        return b.token.oneHourVolumeUsd - a.token.oneHourVolumeUsd;
      })
      .slice(0, RESULT_LIMIT)
      .map((e) => e.token);
  }, [query, rows]);

  // ── Callbacks ──
  const stopRowPress = useCallback((event: GestureResponderEvent) => {
    event.stopPropagation();
  }, []);

  const handleOpenTokenDetail = useCallback(
    (token: SearchToken) => {
      haptics.light();
      void addRecentSearch({
        mint: token.mint,
        symbol: token.symbol,
        name: token.name,
        imageUri: token.imageUri,
      }).then(setRecentSearches);

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
    [navigation],
  );

  const handleOpenRecentSearch = useCallback(
    (entry: RecentSearchEntry) => {
      haptics.light();
      // Re-record to bump timestamp
      void addRecentSearch({
        mint: entry.mint,
        symbol: entry.symbol,
        name: entry.name,
        imageUri: entry.imageUri,
      }).then(setRecentSearches);

      navigation.navigate("TokenDetail", {
        source: "deep-link",
        tokenAddress: entry.mint,
      });
    },
    [navigation],
  );

  const handleRemoveRecentSearch = useCallback((mint: string) => {
    void removeRecentSearch(mint).then(setRecentSearches);
  }, []);

  const handleClearAllRecent = useCallback(() => {
    void clearRecentSearches();
    setRecentSearches([]);
  }, []);

  const handleCopyAddress = useCallback(async (mint: string) => {
    await Clipboard.setStringAsync(mint);
    haptics.success();
    toast.success("Address copied", mint);
  }, []);

  const handleClearQuery = useCallback(() => {
    setQuery("");
    inputRef.current?.focus();
  }, []);

  // ── Skeleton row component ──
  const renderSkeletonRows = useCallback(() => {
    return (
      <View style={styles.skeletonWrap}>
        {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
          <View key={i} style={styles.skeletonRow}>
            <View style={styles.skeletonCircle} />
            <View style={styles.skeletonLines}>
              <View style={[styles.skeletonLine, { width: "60%" }]} />
              <View style={[styles.skeletonLine, { width: "40%" }]} />
            </View>
            <View style={styles.skeletonLines}>
              <View style={[styles.skeletonLine, { width: 48 }]} />
              <View style={[styles.skeletonLine, { width: 32 }]} />
            </View>
          </View>
        ))}
      </View>
    );
  }, []);

  // ── Token row renderer (shared between trending & results) ──
  const renderTokenRow = useCallback(
    (item: SearchToken) => {
      const badge = launchpadLabel(item.platform, item.exchange);
      const isPositive = item.oneHourChangePercent >= 0;

      return (
        <Pressable
          key={item.mint}
          style={styles.rowItem}
          onPress={() => handleOpenTokenDetail(item)}
        >
          <View style={styles.rowMain}>
            {/* Token image with launchpad badge */}
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

            {/* Name column with copy */}
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
              </View>
              <Text numberOfLines={1} style={styles.tokenName}>
                {item.name || "Unnamed"}
              </Text>
            </View>

            {/* Vol / TX column */}
            <View style={styles.metricCol}>
              <Text numberOfLines={1} style={styles.metricValue}>
                {formatCompactUsd(item.oneHourVolumeUsd)}
              </Text>
              <Text numberOfLines={1} style={styles.metricSub}>
                {formatCompactNumber(item.oneHourTxCount)} txs
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

          {/* Footer: age */}
          <View style={styles.rowFooter}>
            <Text style={styles.ageText}>
              {formatAgeFromSeconds(item.mintedAtSeconds)}
            </Text>
          </View>
        </Pressable>
      );
    },
    [handleCopyAddress, handleOpenTokenDetail, stopRowPress],
  );

  // ── Zero-state content ──
  const renderZeroState = useCallback(() => {
    return (
      <View style={styles.zeroStateWrap}>
        {/* ── Recent Searches ── */}
        {recentSearches.length > 0 ? (
          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeader}>
              <Clock size={14} color={qsColors.textSubtle} />
              <Text style={styles.sectionTitle}>Recent</Text>
              <Pressable onPress={handleClearAllRecent} hitSlop={8}>
                <Text style={styles.clearAllText}>Clear all</Text>
              </Pressable>
            </View>
            <View style={styles.recentChipsWrap}>
              {recentSearches.map((entry) => (
                <Pressable
                  key={entry.mint}
                  style={styles.recentChip}
                  onPress={() => handleOpenRecentSearch(entry)}
                >
                  {entry.imageUri ? (
                    <Image
                      source={{ uri: entry.imageUri }}
                      style={styles.recentChipImage}
                    />
                  ) : null}
                  <Text numberOfLines={1} style={styles.recentChipText}>
                    {entry.symbol}
                  </Text>
                  <Pressable
                    onPress={(event) => {
                      stopRowPress(event);
                      handleRemoveRecentSearch(entry.mint);
                    }}
                    hitSlop={6}
                  >
                    <X size={12} color={qsColors.textSubtle} />
                  </Pressable>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {/* ── Trending Tokens ── */}
        {trendingTokens.length > 0 ? (
          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeader}>
              <TrendingUp size={14} color={qsColors.accent} />
              <Text style={styles.sectionTitle}>Trending</Text>
              <Text style={styles.sectionSubtitle}>by 1h volume</Text>
            </View>

            {/* Column headers */}
            <View style={styles.columnHeaders}>
              <View style={styles.colHeaderLeft}>
                <Text style={styles.colHeaderText}>Token</Text>
              </View>
              <View style={styles.colHeaderMetric}>
                <Text style={styles.colHeaderText}>Vol / TXs</Text>
              </View>
              <View style={styles.colHeaderMetric}>
                <Text style={styles.colHeaderText}>MC / 1h</Text>
              </View>
            </View>

            {trendingTokens.map((token) => renderTokenRow(token))}
          </View>
        ) : null}
      </View>
    );
  }, [
    recentSearches,
    trendingTokens,
    handleClearAllRecent,
    handleOpenRecentSearch,
    handleRemoveRecentSearch,
    renderTokenRow,
    stopRowPress,
  ]);

  // ── Main render ──
  return (
    <FlatList
      data={isZeroState ? [] : filteredRows}
      keyExtractor={(item) => item.mint}
      contentContainerStyle={styles.content}
      style={styles.page}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
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
          {/* ── Search bar ── */}
          <View style={styles.searchWrap}>
            <Search size={16} color={qsColors.textSubtle} />
            <TextInput
              ref={inputRef}
              value={query}
              onChangeText={setQuery}
              placeholder="Search ticker, name, or paste CA"
              placeholderTextColor={qsColors.textSubtle}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              style={styles.searchInput}
            />
            {query.length > 0 ? (
              <Pressable onPress={handleClearQuery} hitSlop={8}>
                <View style={styles.clearButton}>
                  <X size={14} color={qsColors.textSecondary} />
                </View>
              </Pressable>
            ) : null}
          </View>

          {/* ── Deep link banner ── */}
          {params?.source ? (
            <View style={styles.deepLinkNote}>
              <Text style={styles.deepLinkTitle}>Opened from deep link</Text>
              {params.tokenAddress ? (
                <Text style={styles.deepLinkBody}>
                  {params.tokenAddress}
                </Text>
              ) : null}
            </View>
          ) : null}

          {/* ── Error state ── */}
          {errorText ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>
                Failed to load token search index.
              </Text>
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

          {/* ── Skeleton loading ── */}
          {isInitialLoading ? renderSkeletonRows() : null}

          {/* ── Zero-state (recent + trending) ── */}
          {!isInitialLoading && isZeroState ? renderZeroState() : null}

          {/* ── Active search column headers ── */}
          {!isInitialLoading && !isZeroState && filteredRows.length > 0 ? (
            <>
              <Text style={styles.resultCount}>
                {filteredRows.length} result{filteredRows.length !== 1 ? "s" : ""}
              </Text>
              <View style={styles.columnHeaders}>
                <View style={styles.colHeaderLeft}>
                  <Text style={styles.colHeaderText}>Token</Text>
                </View>
                <View style={styles.colHeaderMetric}>
                  <Text style={styles.colHeaderText}>Vol / TXs</Text>
                </View>
                <View style={styles.colHeaderMetric}>
                  <Text style={styles.colHeaderText}>MC / 1h</Text>
                </View>
              </View>
            </>
          ) : null}
        </View>
      }
      renderItem={({ item }) => renderTokenRow(item)}
      ListEmptyComponent={
        !isInitialLoading && !isZeroState && !errorText ? (
          <EmptyState
            icon={Search}
            title="No matches"
            subtitle="Try a different search term or paste a token address."
          />
        ) : null
      }
    />
  );
}

// ────────────────────────────────────────────────────────────────
//  Styles
// ────────────────────────────────────────────────────────────────
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

  // ── Search bar ──
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: qsSpacing.sm,
    backgroundColor: qsColors.layer2,
    borderRadius: qsRadius.lg,
    paddingHorizontal: qsSpacing.md,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    color: qsColors.textPrimary,
    fontSize: 14,
    padding: 0,
  },
  clearButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: qsColors.layer3,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Deep link / error ──
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
    backgroundColor: "rgba(239, 68, 68, 0.2)",
  },
  retryButtonText: {
    color: qsColors.dangerLight,
    fontSize: 11,
    fontWeight: "700",
  },

  // ── Skeleton loading ──
  skeletonWrap: {
    gap: 14,
    paddingTop: qsSpacing.sm,
  },
  skeletonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  skeletonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: qsColors.layer2,
  },
  skeletonLines: {
    flex: 1,
    gap: 6,
  },
  skeletonLine: {
    height: 10,
    borderRadius: 4,
    backgroundColor: qsColors.layer2,
  },

  // ── Zero-state ──
  zeroStateWrap: {
    gap: qsSpacing.xl,
  },

  // ── Section headers ──
  sectionWrap: {
    gap: qsSpacing.sm,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sectionTitle: {
    color: qsColors.textPrimary,
    fontSize: 14,
    fontWeight: qsTypography.weight.semi,
    flex: 1,
  },
  sectionSubtitle: {
    color: qsColors.textSubtle,
    fontSize: 11,
  },
  clearAllText: {
    color: qsColors.textSubtle,
    fontSize: 12,
    fontWeight: qsTypography.weight.medium,
  },

  // ── Recent search chips ──
  recentChipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: qsSpacing.sm,
  },
  recentChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: qsColors.layer1,
    borderRadius: qsRadius.pill,
    paddingVertical: 7,
    paddingLeft: 8,
    paddingRight: 10,
  },
  recentChipImage: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: qsColors.layer3,
  },
  recentChipText: {
    color: qsColors.textSecondary,
    fontSize: 12,
    fontWeight: qsTypography.weight.semi,
    maxWidth: 80,
  },

  // ── Column headers ──
  columnHeaders: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: qsSpacing.lg,
    gap: 8,
  },
  colHeaderLeft: {
    marginLeft: 48, // 40px image + 8px gap
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

  // ── Result count ──
  resultCount: {
    color: qsColors.textSubtle,
    fontSize: 11,
    fontWeight: qsTypography.weight.medium,
  },

  // ── Token rows ──
  rowItem: {
    paddingHorizontal: qsSpacing.lg,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: qsColors.layer0,
  },
  rowMain: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  imageWrap: {
    width: 40,
    height: 40,
    position: "relative",
  },
  tokenImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  rowFooter: {
    marginTop: 4,
    marginLeft: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  ageText: {
    color: qsColors.buyGreen,
    fontSize: 10,
    fontWeight: qsTypography.weight.semi,
  },

});
