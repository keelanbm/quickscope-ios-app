/**
 * TokenDetailScreen — Robinhood-inspired token detail with inline trade panel
 *
 * Layout (top to bottom):
 * 1. Hero: Price LEFT, token image RIGHT (Robinhood pattern)
 * 2. Social links + platform badge + watchlist
 * 3. Edge-to-edge area chart (280px, 0 horizontal padding)
 * 4. Timeframe selector pills
 * 5. Metric badges row (MC, Vol, TX, 1h Change)
 * 6. Holdings card (if wallet connected)
 * 7. Token details card (address, age, scan mentions)
 * 8. Persistent QuickTradePanel at bottom
 * 9. TradeBottomSheet (expand from quick panel)
 *
 * v2.1: UI treatment only — all existing data preserved, no feature changes.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Clipboard from "expo-clipboard";
import BottomSheet from "@gorhom/bottom-sheet";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { toast } from "@/src/lib/toast";
import type { RpcClient } from "@/src/lib/api/rpcClient";
import { useAuthSession } from "@/src/features/auth/AuthSessionProvider";
import type { RootStack, TokenDetailRouteParams } from "@/src/navigation/types";
import { qsColors, qsRadius, qsSpacing, qsShadows, qsTypography } from "@/src/theme/tokens";
import { fetchPositionPnl, type TraderTokenPosition } from "@/src/features/portfolio/portfolioService";
import {
  buildChartSeries,
  fetchLiveTokenInfo,
  fetchTokenCandles,
  type LiveTokenInfo,
  type TokenChartPoint,
  type ChartSeriesResult,
} from "@/src/features/token/tokenService";
import {
  addTokenToWatchlist,
  fetchTokenWatchlists,
  removeTokenFromWatchlist,
  type TokenWatchlist,
} from "@/src/features/watchlist/tokenWatchlistService";
import { TokenChart } from "@/src/ui/TokenChart";
import { MetricBadge } from "@/src/ui/MetricBadge";
import { SocialChips, type SocialLink } from "@/src/ui/SocialChips";
import { QuickTradePanel } from "@/src/ui/QuickTradePanel";
import { TradeBottomSheet } from "@/src/ui/TradeBottomSheet";
import { TradeSettingsModal } from "@/src/ui/TradeSettingsModal";
import {
  type TradeSettings,
  DEFAULT_SETTINGS,
  loadTradeSettings,
  activeProfile,
} from "@/src/features/trade/tradeSettings";
import { haptics } from "@/src/lib/haptics";
import { Copy, Star, ArrowLeft } from "@/src/ui/icons";

type TokenDetailScreenProps = {
  rpcClient: RpcClient;
  params?: TokenDetailRouteParams;
};

const fallbackTokenImage = "https://app.quickscope.gg/favicon.ico";

const chartTimeframes = [
  { id: "1h", label: "1h", rangeSeconds: 60 * 60, resolutionSeconds: 60 },
  { id: "6h", label: "6h", rangeSeconds: 6 * 60 * 60, resolutionSeconds: 5 * 60 },
  { id: "24h", label: "24h", rangeSeconds: 24 * 60 * 60, resolutionSeconds: 15 * 60 },
  { id: "7d", label: "7d", rangeSeconds: 7 * 24 * 60 * 60, resolutionSeconds: 60 * 60 },
] as const;

type ChartTimeframe = (typeof chartTimeframes)[number];

/* ── Formatters ── */

function formatCompactUsd(value: number | undefined): string {
  if (!value || !Number.isFinite(value) || value <= 0) {
    return "$0";
  }
  const absValue = Math.abs(value);
  if (absValue >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (absValue >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (absValue >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
}

function formatPercent(value: number | undefined): string {
  if (value === undefined || !Number.isFinite(value)) return "n/a";
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${value.toFixed(1)}%`;
}

function formatAgeFromSeconds(unixSeconds: number | undefined): string {
  if (!unixSeconds || !Number.isFinite(unixSeconds) || unixSeconds <= 0) return "n/a";
  const elapsedSeconds = Math.max(0, Math.floor(Date.now() / 1000) - unixSeconds);
  if (elapsedSeconds < 60) return `${elapsedSeconds}s`;
  if (elapsedSeconds < 3600) return `${Math.floor(elapsedSeconds / 60)}m`;
  if (elapsedSeconds < 86400) return `${Math.floor(elapsedSeconds / 3600)}h`;
  if (elapsedSeconds < 604800) return `${Math.floor(elapsedSeconds / 86400)}d`;
  return `${Math.floor(elapsedSeconds / 604800)}w`;
}

function formatChartTimestamp(timestampSeconds: number, timeframeId: string): string {
  if (!timestampSeconds) return "--";
  const date = new Date(timestampSeconds * 1000);
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  if (timeframeId === "1h" || timeframeId === "6h") return `${hours}:${minutes}`;
  if (timeframeId === "24h") return `${date.getMonth() + 1}/${date.getDate()} ${hours}:${minutes}`;
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function formatSol(value: number | undefined): string {
  if (value === undefined || !Number.isFinite(value)) return "--";
  if (Math.abs(value) >= 1000) return value.toFixed(0);
  if (Math.abs(value) >= 10) return value.toFixed(2);
  return value.toFixed(3);
}

export function TokenDetailScreen({ rpcClient, params }: TokenDetailScreenProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStack>>();
  const insets = useSafeAreaInsets();
  const { walletAddress, hasValidAccessToken, authenticateFromWallet } = useAuthSession();
  const chartRequestIdRef = useRef(0);
  const positionRequestIdRef = useRef(0);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const settingsSheetRef = useRef<BottomSheet>(null);

  const [selectedTimeframe, setSelectedTimeframe] = useState<ChartTimeframe>(chartTimeframes[2]);
  const [liveInfo, setLiveInfo] = useState<LiveTokenInfo | null>(null);
  const [chartData, setChartData] = useState<TokenChartPoint[]>([]);
  const [chartMode, setChartMode] = useState<"mcap" | "price">("mcap");
  const [isChartLoading, setIsChartLoading] = useState(false);
  const [chartError, setChartError] = useState<string | null>(null);
  const [positionInfo, setPositionInfo] = useState<TraderTokenPosition | null>(null);
  const [positionError, setPositionError] = useState<string | null>(null);
  const [watchlists, setWatchlists] = useState<TokenWatchlist[]>([]);
  const [watchlistError, setWatchlistError] = useState<string | null>(null);
  const [isWatchlistLoading, setIsWatchlistLoading] = useState(false);
  const [isWatchlistUpdating, setIsWatchlistUpdating] = useState(false);
  const [tradeSettings, setTradeSettings] = useState<TradeSettings>(DEFAULT_SETTINGS);
  const [tradeSide, setTradeSide] = useState<"buy" | "sell">("buy");

  if (!params?.tokenAddress) {
    return (
      <View style={styles.page}>
        <Text style={styles.fallbackTitle}>Token Detail</Text>
        <Text style={styles.fallbackSubtitle}>No token context was provided.</Text>
      </View>
    );
  }

  const tokenAddress = params.tokenAddress;

  /* ── Data fetching (unchanged logic) ── */

  useEffect(() => {
    let isActive = true;
    const requestId = ++chartRequestIdRef.current;

    const load = async () => {
      setIsChartLoading(true);
      setChartError(null);

      try {
        const nowSeconds = Math.floor(Date.now() / 1000);
        const fromSeconds = nowSeconds - selectedTimeframe.rangeSeconds;

        const [tokenInfo, candlesResponse] = await Promise.all([
          fetchLiveTokenInfo(rpcClient, tokenAddress),
          fetchTokenCandles(rpcClient, {
            tokenAddress,
            from: fromSeconds,
            to: nowSeconds,
            resolutionSeconds: selectedTimeframe.resolutionSeconds,
          }),
        ]);

        if (!isActive || requestId !== chartRequestIdRef.current) return;

        setLiveInfo(tokenInfo ?? null);

        const result = buildChartSeries({
          candles: candlesResponse.candles ?? [],
          tokenInfo: tokenInfo ?? null,
          candlesResponse,
        });

        setChartData(result.points);
        setChartMode(result.mode);
      } catch (error) {
        if (!isActive || requestId !== chartRequestIdRef.current) return;
        setChartError(error instanceof Error ? error.message : "Failed to load chart.");
      } finally {
        if (!isActive || requestId !== chartRequestIdRef.current) return;
        setIsChartLoading(false);
      }
    };

    void load();
    return () => { isActive = false; };
  }, [rpcClient, selectedTimeframe, tokenAddress]);

  useEffect(() => {
    if (!hasValidAccessToken) {
      setWatchlists([]);
      return;
    }

    let isActive = true;
    setIsWatchlistLoading(true);
    setWatchlistError(null);

    fetchTokenWatchlists(rpcClient)
      .then((data) => { if (isActive) setWatchlists(data ?? []); })
      .catch((error) => {
        if (!isActive) return;
        setWatchlistError(error instanceof Error ? error.message : "Failed to load watchlists.");
        setWatchlists([]);
      })
      .finally(() => { if (isActive) setIsWatchlistLoading(false); });

    return () => { isActive = false; };
  }, [hasValidAccessToken, rpcClient]);

  useEffect(() => {
    if (!walletAddress || !tokenAddress) {
      setPositionInfo(null);
      return;
    }

    let isActive = true;
    const requestId = ++positionRequestIdRef.current;
    setPositionError(null);

    fetchPositionPnl(rpcClient, walletAddress, tokenAddress)
      .then((data) => {
        if (isActive && requestId === positionRequestIdRef.current) setPositionInfo(data);
      })
      .catch((error) => {
        if (!isActive || requestId !== positionRequestIdRef.current) return;
        setPositionError(error instanceof Error ? error.message : "Failed to load position.");
        setPositionInfo(null);
      });

    return () => { isActive = false; };
  }, [rpcClient, tokenAddress, walletAddress]);

  // Load trade settings on mount
  useEffect(() => {
    loadTradeSettings().then(setTradeSettings);
  }, []);

  const currentProfile = activeProfile(tradeSettings);

  /* ── Derived data ── */

  const tokenMeta = useMemo(() => {
    const metadata = liveInfo?.token_metadata;
    return {
      symbol: metadata?.symbol ?? params.symbol ?? "Unknown",
      name: metadata?.name ?? params.name ?? "Unnamed token",
      imageUri: metadata?.image_uri ?? params.imageUri,
      twitterUrl: metadata?.twitter_url ?? metadata?.twitter,
      telegramUrl: metadata?.telegram_url ?? metadata?.telegram,
      websiteUrl: metadata?.website_url ?? metadata?.website,
    };
  }, [liveInfo, params]);

  const activeWatchlist = useMemo(() => {
    if (watchlists.length === 0) return undefined;
    return (
      watchlists.find(
        (list) => list.isFavorites || list.name.toLowerCase() === "favorites"
      ) ?? watchlists[0]
    );
  }, [watchlists]);

  const isTracked = useMemo(() => {
    if (!activeWatchlist) return false;
    return activeWatchlist.tokens?.includes(tokenAddress) ?? false;
  }, [activeWatchlist, tokenAddress]);

  const marketCapUsd = params.marketCapUsd;
  const oneHourChange = params.oneHourChangePercent;
  const platformLabel = (params.platform || params.exchange || "unknown").toUpperCase();
  const mintedAtSeconds = liveInfo?.mint_transaction?.ts ?? params.mintedAtSeconds;

  const socialLinks = useMemo<SocialLink[]>(() => {
    const links: SocialLink[] = [];
    if (tokenMeta.twitterUrl) links.push({ type: "twitter", url: tokenMeta.twitterUrl });
    if (tokenMeta.telegramUrl) links.push({ type: "telegram", url: tokenMeta.telegramUrl });
    if (tokenMeta.websiteUrl) links.push({ type: "website", url: tokenMeta.websiteUrl });
    return links;
  }, [tokenMeta]);

  /* ── Handlers ── */

  const handleCopyAddress = useCallback(async () => {
    await Clipboard.setStringAsync(tokenAddress);
    toast.success("Copied", "Token address copied to clipboard.");
  }, [tokenAddress]);

  const handleToggleWatchlist = useCallback(async () => {
    if (!hasValidAccessToken) {
      await authenticateFromWallet();
      return;
    }

    if (!activeWatchlist) {
      toast.info("No watchlists", "Create a watchlist on web to start tracking.");
      return;
    }

    if (isWatchlistUpdating) return;

    setIsWatchlistUpdating(true);
    setWatchlistError(null);

    try {
      if (isTracked) {
        await removeTokenFromWatchlist(rpcClient, activeWatchlist.id, tokenAddress);
      } else {
        await addTokenToWatchlist(rpcClient, activeWatchlist.id, tokenAddress);
      }

      setWatchlists((prev) =>
        prev.map((list) => {
          if (list.id !== activeWatchlist.id) return list;
          const nextTokens = isTracked
            ? list.tokens.filter((mint) => mint !== tokenAddress)
            : [...list.tokens, tokenAddress];
          return { ...list, tokens: nextTokens };
        })
      );
    } catch (error) {
      setWatchlistError(
        error instanceof Error ? error.message : "Failed to update watchlist."
      );
    } finally {
      setIsWatchlistUpdating(false);
    }
  }, [
    hasValidAccessToken,
    authenticateFromWallet,
    activeWatchlist,
    isWatchlistUpdating,
    isTracked,
    rpcClient,
    tokenAddress,
  ]);

  const handleQuickTrade = useCallback(
    (presetParams: { side: "buy" | "sell"; amount: number }) => {
      navigation.navigate("TradeEntry", {
        source: "deep-link",
        tokenAddress,
        outputMintDecimals: params.tokenDecimals,
        amount: presetParams.amount.toString(),
      });
    },
    [navigation, tokenAddress, params.tokenDecimals]
  );

  const handleExpandTrade = useCallback(() => {
    bottomSheetRef.current?.snapToIndex(0);
  }, []);

  const handleBottomSheetClose = useCallback(() => {
    bottomSheetRef.current?.close();
  }, []);

  const handleOpenSettings = useCallback(() => {
    settingsSheetRef.current?.snapToIndex(0);
  }, []);

  const handleCloseSettings = useCallback(() => {
    settingsSheetRef.current?.close();
  }, []);

  const handleProfilePress = useCallback(
    (index: 0 | 1 | 2) => {
      setTradeSettings((prev) => ({ ...prev, activeProfileIndex: index }));
      haptics.selection();
    },
    []
  );

  const handleSideChange = useCallback((side: "buy" | "sell") => {
    setTradeSide(side);
  }, []);

  const handleQuoteRequest = useCallback(
    (quoteParams: { side: "buy" | "sell"; amount: number; orderType: "market" }) => {
      navigation.navigate("TradeEntry", {
        source: "deep-link",
        tokenAddress,
        outputMintDecimals: params.tokenDecimals,
        amount: quoteParams.amount.toString(),
      });
    },
    [navigation, tokenAddress, params.tokenDecimals]
  );

  /* ── Render ── */

  return (
    <View style={[styles.page, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Back button ── */}
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [
            styles.backButton,
            { opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <ArrowLeft size={20} color={qsColors.textSecondary} />
        </Pressable>

        {/* ── Hero: Price LEFT, Token Image RIGHT (Robinhood pattern) ── */}
        <View style={styles.hero}>
          <View style={styles.heroLeft}>
            <Text style={styles.heroSymbol}>{tokenMeta.symbol}</Text>
            <Text style={styles.heroName}>{tokenMeta.name}</Text>
            <View style={styles.heroPriceRow}>
              <Text style={styles.heroPrice}>
                {formatCompactUsd(marketCapUsd)}
              </Text>
              {oneHourChange !== undefined && (
                <Text
                  style={[
                    styles.heroChange,
                    oneHourChange >= 0 ? styles.changePositive : styles.changeNegative,
                  ]}
                >
                  {formatPercent(oneHourChange)}
                </Text>
              )}
            </View>
          </View>
          <Image
            source={{ uri: tokenMeta.imageUri || fallbackTokenImage }}
            style={styles.heroImage}
          />
        </View>

        {/* ── Social + Platform + Watchlist row ── */}
        <View style={styles.metaRow}>
          <View style={styles.metaLeft}>
            <Text style={styles.platformPill}>{platformLabel}</Text>
            {socialLinks.length > 0 && <SocialChips links={socialLinks} size="sm" />}
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.watchlistButton,
              isTracked && hasValidAccessToken ? styles.watchlistButtonActive : null,
              { opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={handleToggleWatchlist}
            disabled={isWatchlistLoading || isWatchlistUpdating}
          >
            <Star
              size={16}
              color={
                isTracked && hasValidAccessToken
                  ? qsColors.accent
                  : qsColors.textSecondary
              }
            />
            <Text
              style={[
                styles.watchlistText,
                isTracked && hasValidAccessToken ? styles.watchlistTextActive : null,
              ]}
            >
              {!hasValidAccessToken
                ? "Login"
                : isTracked
                  ? "Tracked"
                  : "Track"}
            </Text>
          </Pressable>
        </View>
        {watchlistError ? (
          <Text style={styles.errorHint}>Watchlist unavailable.</Text>
        ) : null}

        {/* ── Edge-to-edge Chart ── */}
        <View style={styles.chartSection}>
          {chartData.length > 0 && (
            <Text style={styles.chartModeLabel}>
              {chartMode === "mcap" ? "Market Cap" : "Price (USD)"}
            </Text>
          )}
          <TokenChart
            data={chartData}
            height={280}
            isLoading={isChartLoading}
            formatValue={formatCompactUsd}
            formatTimestamp={(ts) => formatChartTimestamp(ts, selectedTimeframe.id)}
          />
          {chartError ? <Text style={styles.errorHint}>Chart unavailable.</Text> : null}
        </View>

        {/* ── Timeframe pills ── */}
        <View style={styles.timeframeRow}>
          {chartTimeframes.map((frame) => {
            const isActive = frame.id === selectedTimeframe.id;
            return (
              <Pressable
                key={frame.id}
                onPress={() => setSelectedTimeframe(frame)}
                style={({ pressed }) => [
                  styles.timeframePill,
                  isActive && styles.timeframePillActive,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Text
                  style={[
                    styles.timeframeText,
                    isActive && styles.timeframeTextActive,
                  ]}
                >
                  {frame.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* ── Metric badges ── */}
        <View style={styles.metricsRow}>
          <MetricBadge label="MC" value={formatCompactUsd(marketCapUsd)} />
          <MetricBadge label="Vol 1h" value={formatCompactUsd(params.oneHourVolumeUsd)} />
          <MetricBadge
            label="TX 1h"
            value={params.oneHourTxCount?.toLocaleString() || "n/a"}
          />
          <MetricBadge
            label="Change"
            value={formatPercent(oneHourChange)}
            variant={
              oneHourChange !== undefined
                ? oneHourChange >= 0
                  ? "positive"
                  : "negative"
                : "default"
            }
          />
        </View>

        {/* ── Holdings card (wallet connected) ── */}
        {walletAddress ? (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Holdings</Text>
              {positionError ? (
                <Text style={styles.errorHint}>Unavailable</Text>
              ) : null}
            </View>
            <View style={styles.holdingsRow}>
              <View style={styles.holdingStat}>
                <Text style={styles.holdingLabel}>Balance</Text>
                <Text style={styles.holdingValue}>
                  {formatSol(positionInfo?.position?.balance)}
                </Text>
              </View>
              <View style={styles.holdingStat}>
                <Text style={styles.holdingLabel}>Total PnL</Text>
                <Text
                  style={[
                    styles.holdingValue,
                    positionInfo?.position?.total_pnl_quote
                      ? positionInfo.position.total_pnl_quote >= 0
                        ? styles.changePositive
                        : styles.changeNegative
                      : null,
                  ]}
                >
                  {formatSol(positionInfo?.position?.total_pnl_quote)}
                </Text>
              </View>
              <View style={styles.holdingStat}>
                <Text style={styles.holdingLabel}>PnL %</Text>
                <Text
                  style={[
                    styles.holdingValue,
                    positionInfo?.position?.total_pnl_change_proportion
                      ? positionInfo.position.total_pnl_change_proportion >= 0
                        ? styles.changePositive
                        : styles.changeNegative
                      : null,
                  ]}
                >
                  {formatPercent(
                    positionInfo?.position?.total_pnl_change_proportion !== undefined
                      ? positionInfo.position.total_pnl_change_proportion * 100
                      : undefined
                  )}
                </Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* ── Token details card ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Details</Text>
            <Pressable
              onPress={handleCopyAddress}
              style={({ pressed }) => [
                styles.copyButton,
                { opacity: pressed ? 0.6 : 1 },
              ]}
            >
              <Copy size={14} color={qsColors.accent} />
              <Text style={styles.copyText}>Copy</Text>
            </Pressable>
          </View>
          <Text style={styles.addressText} numberOfLines={1} ellipsizeMode="middle">
            {tokenAddress}
          </Text>
          <Text style={styles.detailLine}>Age: {formatAgeFromSeconds(mintedAtSeconds)}</Text>
          {typeof params.scanMentionsOneHour === "number" ? (
            <Text style={styles.detailLine}>
              Scan mentions (1h): {params.scanMentionsOneHour}
            </Text>
          ) : null}
        </View>

        {/* Bottom spacer for QuickTradePanel */}
        <View style={{ height: 160 }} />
      </ScrollView>

      {/* ── Persistent QuickTradePanel ── */}
      <View style={styles.tradePanelWrap}>
        <QuickTradePanel
          tokenSymbol={tokenMeta.symbol}
          tokenAddress={tokenAddress}
          walletBalance={positionInfo?.position?.balance}
          tokenBalance={positionInfo?.position?.balance}
          onPresetPress={handleQuickTrade}
          onExpandPress={handleExpandTrade}
          onSettingsPress={handleOpenSettings}
          onProfilePress={handleProfilePress}
          onSideChange={handleSideChange}
          activeSide={tradeSide}
          activeProfileIndex={tradeSettings.activeProfileIndex}
          buyPresets={tradeSettings.buyPresets}
          sellPresets={tradeSettings.sellPresets}
        />
      </View>

      {/* ── TradeBottomSheet (expandable) ── */}
      <TradeBottomSheet
        ref={bottomSheetRef}
        tokenAddress={tokenAddress}
        tokenSymbol={tokenMeta.symbol}
        tokenDecimals={params.tokenDecimals ?? 9}
        userBalance={positionInfo?.position?.balance ?? 0}
        onQuoteRequest={handleQuoteRequest}
        onClose={handleBottomSheetClose}
        onSettingsPress={handleOpenSettings}
        onProfilePress={handleProfilePress}
        activeSide={tradeSide}
        activeProfileIndex={tradeSettings.activeProfileIndex}
        buyPresets={tradeSettings.buyPresets}
        sellPresets={tradeSettings.sellPresets}
        slippageBps={currentProfile.slippageBps}
        priorityLamports={currentProfile.priorityLamports}
      />

      {/* ── Trade Settings Modal ── */}
      <TradeSettingsModal
        ref={settingsSheetRef}
        settings={tradeSettings}
        onSettingsChanged={setTradeSettings}
        onClose={handleCloseSettings}
      />
    </View>
  );
}

/* ── Styles ── */

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: qsColors.layer0,
  },
  scrollContent: {
    paddingBottom: qsSpacing.lg,
  },
  fallbackTitle: {
    color: qsColors.textPrimary,
    fontSize: qsTypography.size.xxxl,
    fontWeight: qsTypography.weight.bold,
    padding: qsSpacing.xl,
  },
  fallbackSubtitle: {
    color: qsColors.textTertiary,
    fontSize: qsTypography.size.sm,
    paddingHorizontal: qsSpacing.xl,
  },

  /* Back button */
  backButton: {
    paddingHorizontal: qsSpacing.lg,
    paddingTop: qsSpacing.md,
    paddingBottom: qsSpacing.xs,
    alignSelf: "flex-start",
  },

  /* Hero — Price LEFT, Image RIGHT */
  hero: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: qsSpacing.lg,
    paddingTop: qsSpacing.sm,
    paddingBottom: qsSpacing.md,
  },
  heroLeft: {
    flex: 1,
    gap: 2,
  },
  heroSymbol: {
    color: qsColors.textPrimary,
    fontSize: qsTypography.size.xxxxl,
    fontWeight: qsTypography.weight.bold,
    letterSpacing: -0.5,
  },
  heroName: {
    color: qsColors.textTertiary,
    fontSize: qsTypography.size.sm,
    marginBottom: qsSpacing.xs,
  },
  heroPriceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: qsSpacing.sm,
  },
  heroPrice: {
    color: qsColors.textPrimary,
    fontSize: qsTypography.size.xxl,
    fontWeight: qsTypography.weight.semi,
  },
  heroChange: {
    fontSize: qsTypography.size.sm,
    fontWeight: qsTypography.weight.semi,
  },
  changePositive: {
    color: qsColors.buyGreen,
  },
  changeNegative: {
    color: qsColors.sellRed,
  },
  heroImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: qsColors.layer2,
    marginLeft: qsSpacing.md,
  },

  /* Meta row — social + platform + watchlist */
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: qsSpacing.lg,
    paddingBottom: qsSpacing.md,
  },
  metaLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: qsSpacing.sm,
    flex: 1,
  },
  platformPill: {
    color: qsColors.textTertiary,
    backgroundColor: qsColors.layer2,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    borderRadius: qsRadius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontSize: 10,
    fontWeight: qsTypography.weight.semi,
    overflow: "hidden",
  },

  /* Watchlist */
  watchlistButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: qsRadius.pill,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    backgroundColor: qsColors.layer1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  watchlistButtonActive: {
    borderColor: qsColors.accent,
    backgroundColor: "rgba(119, 102, 247, 0.15)",
  },
  watchlistText: {
    color: qsColors.textSecondary,
    fontSize: 12,
    fontWeight: qsTypography.weight.semi,
  },
  watchlistTextActive: {
    color: qsColors.textPrimary,
  },

  /* Edge-to-edge chart */
  chartSection: {
    marginHorizontal: 0, // edge-to-edge
    marginBottom: qsSpacing.sm,
  },
  chartModeLabel: {
    color: qsColors.textTertiary,
    fontSize: 10,
    fontWeight: qsTypography.weight.semi,
    paddingHorizontal: qsSpacing.lg,
    marginBottom: 4,
  },

  /* Timeframe pills */
  timeframeRow: {
    flexDirection: "row",
    gap: qsSpacing.sm,
    paddingHorizontal: qsSpacing.lg,
    marginBottom: qsSpacing.lg,
  },
  timeframePill: {
    borderRadius: qsRadius.pill,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: qsColors.layer1,
  },
  timeframePillActive: {
    borderColor: qsColors.accent,
    backgroundColor: "rgba(119, 102, 247, 0.12)",
  },
  timeframeText: {
    color: qsColors.textTertiary,
    fontSize: 12,
    fontWeight: qsTypography.weight.semi,
  },
  timeframeTextActive: {
    color: qsColors.textPrimary,
  },

  /* Metric badges row */
  metricsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: qsSpacing.sm,
    paddingHorizontal: qsSpacing.lg,
    marginBottom: qsSpacing.lg,
  },

  /* Card (reused for holdings + details) */
  card: {
    marginHorizontal: qsSpacing.lg,
    marginBottom: qsSpacing.md,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    borderRadius: qsRadius.md,
    backgroundColor: qsColors.layer1,
    padding: qsSpacing.md,
    gap: qsSpacing.sm,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: {
    color: qsColors.textPrimary,
    fontSize: qsTypography.size.md,
    fontWeight: qsTypography.weight.semi,
  },

  /* Holdings */
  holdingsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: qsSpacing.sm,
  },
  holdingStat: {
    flex: 1,
    gap: 4,
  },
  holdingLabel: {
    color: qsColors.textTertiary,
    fontSize: 11,
  },
  holdingValue: {
    color: qsColors.textSecondary,
    fontSize: 14,
    fontWeight: qsTypography.weight.semi,
  },

  /* Details */
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  copyText: {
    color: qsColors.accent,
    fontSize: 12,
    fontWeight: qsTypography.weight.semi,
  },
  addressText: {
    color: qsColors.textSecondary,
    fontSize: 12,
    fontFamily: "Courier",
  },
  detailLine: {
    color: qsColors.textSecondary,
    fontSize: 12,
  },

  /* Error */
  errorHint: {
    color: qsColors.textTertiary,
    fontSize: 12,
    paddingHorizontal: qsSpacing.lg,
  },

  /* Persistent QuickTradePanel */
  tradePanelWrap: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
});
