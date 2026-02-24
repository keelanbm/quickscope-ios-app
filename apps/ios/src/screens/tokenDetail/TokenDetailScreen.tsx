/**
 * TokenDetailScreen — Decomposed token detail with condensed header,
 * tab system, and inline trade panel.
 *
 * Layout (top to bottom):
 * 1. Condensed header: Image LEFT, symbol + age + copy + star
 * 2. Edge-to-edge area chart
 * 3. Timeframe selector pills
 * 4. Metric badges row (Vol, TX, Scans — MC/Change in header)
 * 5. Holdings bar (if wallet connected)
 * 6. Tabs: Activity, Traders, Holders
 * 7. Persistent QuickTradePanel at bottom
 * 8. TradeBottomSheet + TradeSettingsModal overlays
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Clipboard from "expo-clipboard";
import BottomSheet from "@gorhom/bottom-sheet";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { toast } from "@/src/lib/toast";
import type { RpcClient } from "@/src/lib/api/rpcClient";
import { useAuthSession } from "@/src/features/auth/AuthSessionProvider";
import type { RootStack, TokenDetailRouteParams } from "@/src/navigation/types";
import { qsColors, qsRadius, qsSpacing, qsTypography } from "@/src/theme/tokens";
import { fetchPositionPnl, type TraderTokenPosition } from "@/src/features/portfolio/portfolioService";
import {
  buildChartSeries,
  buildCandleChartSeries,
  fetchLiveTokenInfo,
  fetchTokenCandles,
  type LiveTokenInfo,
  type TokenChartPoint,
  type TokenCandlePoint,
} from "@/src/features/token/tokenService";
import {
  addTokenToWatchlist,
  fetchTokenWatchlists,
  removeTokenFromWatchlist,
  type TokenWatchlist,
} from "@/src/features/watchlist/tokenWatchlistService";
import { TokenChart } from "@/src/ui/TokenChart";
import type { ChartSignal } from "@/src/ui/TokenChart";
import { SignalFilterChips } from "@/src/ui/chart/SignalFilterChips";
import type { SignalType } from "@/src/ui/chart/chartTypes";
import { FILTER_SIGNAL_TYPES } from "@/src/ui/chart/chartSignalTypes";
import { fetchHistoricalSignals } from "@/src/features/token/tokenSignalService";
import type { SocialLink } from "@/src/ui/SocialChips";
import { QuickTradePanel } from "@/src/ui/QuickTradePanel";
import { TradeBottomSheet } from "@/src/ui/TradeBottomSheet";
import { TradeSettingsModal } from "@/src/ui/TradeSettingsModal";
import {
  type TradeSettings,
  DEFAULT_SETTINGS,
  loadTradeSettings,
  activeProfile,
} from "@/src/features/trade/tradeSettings";
import {
  createTriggerOrder,
  type CreateTriggerOrderParams,
} from "@/src/features/trade/triggerOrderService";
import { requestSwapQuote } from "@/src/features/trade/tradeQuoteService";
import { requestSwapExecution } from "@/src/features/trade/tradeExecutionService";
import { haptics } from "@/src/lib/haptics";
import { ArrowLeft, Zap } from "@/src/ui/icons";

import { TokenDetailHeader } from "./TokenDetailHeader";
import { TokenDetailMetrics } from "./TokenDetailMetrics";
// TokenDetailHoldings removed — target UI doesn't show holdings bar
import { TokenDetailTabs } from "./TokenDetailTabs";
import {
  chartTimeframes,
  type ChartTimeframe,
  formatCompactUsd,
  formatChartTimestamp,
  formatAgeFromSeconds,
  formatPercent,
  fallbackTokenImage,
} from "./styles";

type TokenDetailScreenProps = {
  rpcClient: RpcClient;
  params?: TokenDetailRouteParams;
};

export function TokenDetailScreen({ rpcClient, params }: TokenDetailScreenProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStack>>();
  const insets = useSafeAreaInsets();
  const { walletAddress, hasValidAccessToken, authenticateFromWallet } = useAuthSession();
  const chartRequestIdRef = useRef(0);
  const positionRequestIdRef = useRef(0);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const settingsSheetRef = useRef<BottomSheet>(null);

  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const stickyHeaderStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [100, 140], [0, 1], Extrapolation.CLAMP),
    transform: [
      {
        translateY: interpolate(scrollY.value, [100, 140], [-10, 0], Extrapolation.CLAMP),
      },
    ],
  }));

  const [selectedTimeframe, setSelectedTimeframe] = useState<ChartTimeframe>(chartTimeframes[2]);
  const [liveInfo, setLiveInfo] = useState<LiveTokenInfo | null>(null);
  const [chartData, setChartData] = useState<TokenChartPoint[]>([]);
  const [candleData, setCandleData] = useState<TokenCandlePoint[]>([]);
  const [chartMode, setChartMode] = useState<"mcap" | "price">("mcap");
  const [chartType, setChartType] = useState<"line" | "candle">("candle");
  const [isChartLoading, setIsChartLoading] = useState(false);
  const [chartError, setChartError] = useState<string | null>(null);
  const [positionInfo, setPositionInfo] = useState<TraderTokenPosition | null>(null);
  const [positionError, setPositionError] = useState<string | null>(null);
  const [watchlists, setWatchlists] = useState<TokenWatchlist[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [watchlistError, setWatchlistError] = useState<string | null>(null);
  const [isWatchlistLoading, setIsWatchlistLoading] = useState(false);
  const [isWatchlistUpdating, setIsWatchlistUpdating] = useState(false);
  const [tradeSettings, setTradeSettings] = useState<TradeSettings>(DEFAULT_SETTINGS);
  const [tradeSide, setTradeSide] = useState<"buy" | "sell">("buy");
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [signals, setSignals] = useState<ChartSignal[]>([]);
  const [activeSignalTypes, setActiveSignalTypes] = useState<Set<SignalType>>(
    () => new Set(FILTER_SIGNAL_TYPES),
  );

  const tokenAddress = params?.tokenAddress ?? "";

  /* ── Data fetching ── */

  useEffect(() => {
    if (!tokenAddress) return;
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

        const rawCandles = candlesResponse.candles ?? [];
        const result = buildChartSeries({
          candles: rawCandles,
          tokenInfo: tokenInfo ?? null,
          candlesResponse,
        });
        const candleResult = buildCandleChartSeries({
          candles: rawCandles,
          tokenInfo: tokenInfo ?? null,
          candlesResponse,
        });

        setChartData(result.points);
        setCandleData(candleResult.candles);
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

  // Fetch historical signals for chart overlay
  useEffect(() => {
    if (!tokenAddress) return;
    let isActive = true;

    fetchHistoricalSignals(rpcClient, tokenAddress)
      .then((data) => {
        if (isActive) setSignals(data);
      })
      .catch(() => {
        // Signals are non-critical — fail silently
        if (isActive) setSignals([]);
      });

    return () => { isActive = false; };
  }, [rpcClient, tokenAddress]);

  const handleSignalToggle = useCallback((type: SignalType) => {
    setActiveSignalTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }, []);

  const currentProfile = activeProfile(tradeSettings);

  /* ── Derived data ── */

  const tokenMeta = useMemo(() => {
    const metadata = liveInfo?.token_metadata;
    return {
      symbol: metadata?.symbol ?? params?.symbol ?? "Unknown",
      name: metadata?.name ?? params?.name ?? "Unnamed token",
      imageUri: metadata?.image_uri ?? params?.imageUri,
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

  const marketCapUsd = params?.marketCapUsd;
  const oneHourChange = params?.oneHourChangePercent;
  const platformLabel = (params?.platform || params?.exchange || "unknown").toUpperCase();
  const mintedAtSeconds = liveInfo?.mint_transaction?.ts ?? params?.mintedAtSeconds;

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
      setTradeSide(presetParams.side);
      bottomSheetRef.current?.snapToIndex(0);
    },
    []
  );

  const handleExpandTrade = useCallback(() => {
    bottomSheetRef.current?.snapToIndex(0);
  }, []);

  const handleLimitPress = useCallback(() => {
    // Open the bottom sheet (which has the limit mode toggle)
    bottomSheetRef.current?.snapToIndex(1); // snap to larger size for limit form
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
      setTradeSide(quoteParams.side);
      bottomSheetRef.current?.snapToIndex(0);
    },
    []
  );

  const handleMarketQuoteRequest = useCallback(
    async (params2: { side: "buy" | "sell"; amountUi: number; inputMint: string; outputMint: string }) => {
      const quote = await requestSwapQuote(rpcClient, {
        walletAddress: walletAddress!,
        inputMint: params2.inputMint,
        outputMint: params2.outputMint,
        amountUi: params2.amountUi,
        slippageBps: currentProfile.slippageBps,
      });
      return quote;
    },
    [rpcClient, walletAddress, currentProfile.slippageBps]
  );

  const handleExecuteSwap = useCallback(
    async (swapParams: { quoteResult: { inputMint: string; outputMint: string; amountAtomic: number; slippageBps: number }; side: "buy" | "sell" }) => {
      const result = await requestSwapExecution(rpcClient, {
        walletAddress: walletAddress!,
        inputMint: swapParams.quoteResult.inputMint,
        outputMint: swapParams.quoteResult.outputMint,
        amountAtomic: swapParams.quoteResult.amountAtomic,
        slippageBps: swapParams.quoteResult.slippageBps,
        priorityFeeLamports: currentProfile.priorityLamports,
        jitoTipLamports: currentProfile.tipLamports ?? 0,
      });
      return result;
    },
    [rpcClient, walletAddress, currentProfile]
  );

  const handleLimitOrderRequest = useCallback(
    async (orderParams: Omit<CreateTriggerOrderParams, "walletAddress">) => {
      if (!walletAddress) {
        toast.info("Connect wallet", "Connect your wallet to place limit orders.");
        return;
      }
      setIsSubmittingOrder(true);
      try {
        await createTriggerOrder(rpcClient, {
          ...orderParams,
          walletAddress,
        });
        toast.success("Order placed", "Your trigger order has been created.");
        bottomSheetRef.current?.close();
      } catch (err) {
        toast.error(
          "Order failed",
          err instanceof Error ? err.message : "Failed to create order."
        );
      } finally {
        setIsSubmittingOrder(false);
      }
    },
    [rpcClient, walletAddress]
  );

  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  /* ── Early return AFTER all hooks ── */

  if (!tokenAddress) {
    return (
      <View style={styles.page}>
        <Text style={styles.fallbackTitle}>Token Detail</Text>
        <Text style={styles.fallbackSubtitle}>No token context was provided.</Text>
      </View>
    );
  }

  /* ── Render ── */

  return (
    <View style={[styles.page, { paddingTop: insets.top }]}>
      {/* Sticky condensed header */}
      <Animated.View style={[styles.stickyHeader, stickyHeaderStyle]} pointerEvents="box-none">
        <View style={styles.stickyHeaderInner}>
          <Pressable
            onPress={handleGoBack}
            style={({ pressed }) => [styles.stickyBack, { opacity: pressed ? 0.6 : 1 }]}
          >
            <ArrowLeft size={18} color={qsColors.textSecondary} />
          </Pressable>
          <Image
            source={{ uri: tokenMeta.imageUri || fallbackTokenImage }}
            style={styles.stickyImage}
          />
          <Text style={styles.stickySymbol} numberOfLines={1}>{tokenMeta.symbol}</Text>
          <Text style={styles.stickyMcap}>{formatCompactUsd(marketCapUsd)}</Text>
          {oneHourChange !== undefined && (
            <Text
              style={[
                styles.stickyChange,
                oneHourChange >= 0 ? styles.stickyChangePositive : styles.stickyChangeNegative,
              ]}
            >
              {formatPercent(oneHourChange)}
            </Text>
          )}
        </View>
      </Animated.View>

      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {/* ── Condensed Header ── */}
        <TokenDetailHeader
          imageUri={tokenMeta.imageUri}
          symbol={tokenMeta.symbol}
          name={tokenMeta.name}
          tokenAddress={tokenAddress}
          age={formatAgeFromSeconds(mintedAtSeconds)}
          platformLabel={platformLabel}
          socialLinks={socialLinks}
          marketCapUsd={marketCapUsd}
          oneHourChange={oneHourChange}
          isTracked={isTracked}
          isWatchlistLoading={isWatchlistLoading}
          isWatchlistUpdating={isWatchlistUpdating}
          hasValidAccessToken={hasValidAccessToken}
          onCopyAddress={handleCopyAddress}
          onToggleWatchlist={handleToggleWatchlist}
          onGoBack={handleGoBack}
          scanMentionsOneHour={params?.scanMentionsOneHour}
        />

        {/* ── Timeframe pills + chart type toggle (above chart) ── */}
        <View style={styles.timeframeRow}>
          <View style={styles.timeframePills}>
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
          <View style={styles.chartTypeToggle}>
            {(["line", "candle"] as const).map((type) => {
              const isActive = chartType === type;
              return (
                <Pressable
                  key={type}
                  onPress={() => setChartType(type)}
                  style={[
                    styles.chartTypePill,
                    isActive && styles.chartTypePillActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.chartTypeText,
                      isActive && styles.chartTypeTextActive,
                    ]}
                  >
                    {type === "line" ? "Line" : "Candle"}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ── Signal filter chips ── */}
        {signals.length > 0 && (
          <SignalFilterChips
            activeTypes={activeSignalTypes}
            onToggle={handleSignalToggle}
          />
        )}

        {/* ── Edge-to-edge Chart ── */}
        <View style={styles.chartSection}>
          <TokenChart
            data={chartData}
            candleData={candleData}
            chartType={chartType}
            height={280}
            isLive
            isLoading={isChartLoading}
            signals={signals}
            visibleSignalTypes={activeSignalTypes}
            formatValue={formatCompactUsd}
            formatTimestamp={(ts) => formatChartTimestamp(ts, selectedTimeframe.id)}
          />
          {chartError ? <Text style={styles.errorHint}>Chart unavailable.</Text> : null}
        </View>

        {/* ── Metric badges ── */}
        <TokenDetailMetrics
          oneHourVolumeUsd={params?.oneHourVolumeUsd}
          oneHourTxCount={params?.oneHourTxCount}
          scanMentionsOneHour={params?.scanMentionsOneHour}
          holdersCount={liveInfo?.token_metadata?.holders}
        />

        {/* ── Tabs: Activity, Traders, Holders, Orders ── */}
        <TokenDetailTabs
          rpcClient={rpcClient}
          tokenAddress={tokenAddress}
          walletAddress={walletAddress ?? undefined}
        />

        {/* Bottom spacer for QuickTradePanel */}
        <View style={{ height: 160 }} />
      </Animated.ScrollView>

      {/* ── Persistent QuickTradePanel ── */}
      <View style={styles.tradePanelWrap}>
        {tradeSettings.instantTrade && (
          <View style={styles.instantBadge}>
            <Zap size={12} color={qsColors.accent} />
            <Text style={styles.instantBadgeText}>Instant</Text>
          </View>
        )}
        <QuickTradePanel
          tokenSymbol={tokenMeta.symbol}
          tokenAddress={tokenAddress}
          walletBalance={positionInfo?.position?.balance}
          tokenBalance={positionInfo?.position?.balance}
          currentMarketCapUsd={marketCapUsd}
          onPresetPress={handleQuickTrade}
          onExpandPress={handleExpandTrade}
          onLimitPress={handleLimitPress}
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
        tokenDecimals={params?.tokenDecimals ?? 9}
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
        currentMarketCapUsd={marketCapUsd}
        tokenSupply={liveInfo?.mint_info?.supply}
        walletAddress={walletAddress ?? undefined}
        onLimitOrderRequest={handleLimitOrderRequest}
        isSubmittingOrder={isSubmittingOrder}
        onMarketQuoteRequest={handleMarketQuoteRequest}
        onExecuteSwap={handleExecuteSwap}
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

  /* Sticky condensed header */
  stickyHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: qsColors.layer0,
    borderBottomWidth: 1,
    borderBottomColor: qsColors.layer3,
  },
  stickyHeaderInner: {
    flexDirection: "row",
    alignItems: "center",
    height: 44,
    paddingHorizontal: qsSpacing.lg,
    gap: qsSpacing.sm,
  },
  stickyBack: {
    padding: 4,
    marginRight: 4,
  },
  stickyImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: qsColors.layer2,
  },
  stickySymbol: {
    color: qsColors.textPrimary,
    fontSize: qsTypography.size.sm,
    fontWeight: qsTypography.weight.bold,
  },
  stickyMcap: {
    color: qsColors.textSecondary,
    fontSize: qsTypography.size.sm,
    fontWeight: qsTypography.weight.semi,
    marginLeft: "auto",
  },
  stickyChange: {
    fontSize: qsTypography.size.xs,
    fontWeight: qsTypography.weight.semi,
  },
  stickyChangePositive: {
    color: qsColors.buyGreen,
  },
  stickyChangeNegative: {
    color: qsColors.sellRed,
  },

  /* Edge-to-edge chart */
  chartSection: {
    marginHorizontal: 0,
    marginBottom: qsSpacing.lg,
  },

  /* Timeframe pills */
  timeframeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: qsSpacing.lg,
    marginTop: qsSpacing.md,
    marginBottom: qsSpacing.xs,
  },
  timeframePills: {
    flexDirection: "row",
    gap: qsSpacing.sm,
  },
  chartTypeToggle: {
    flexDirection: "row",
    backgroundColor: qsColors.layer1,
    borderRadius: qsRadius.md,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    overflow: "hidden",
  },
  chartTypePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chartTypePillActive: {
    backgroundColor: qsColors.layer3,
  },
  chartTypeText: {
    color: qsColors.textTertiary,
    fontSize: 11,
    fontWeight: qsTypography.weight.semi,
  },
  chartTypeTextActive: {
    color: qsColors.textPrimary,
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

  /* Instant trade badge */
  instantBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "center",
    backgroundColor: "rgba(119, 102, 247, 0.15)",
    borderRadius: qsRadius.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: -6,
    zIndex: 1,
  },
  instantBadgeText: {
    color: qsColors.accent,
    fontSize: 10,
    fontWeight: qsTypography.weight.semi,
  },
});
