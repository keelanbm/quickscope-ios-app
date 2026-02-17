import { useEffect, useMemo, useRef, useState } from "react";

import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Clipboard from "expo-clipboard";
import {
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { formatAgeFromSeconds, formatCompactUsd, formatPercent, formatSol } from "@/src/lib/format";
import type { RpcClient } from "@/src/lib/api/rpcClient";
import { useAuthSession } from "@/src/features/auth/AuthSessionProvider";
import type { RootStack, TokenDetailRouteParams } from "@/src/navigation/types";
import { qsColors, qsRadius, qsSpacing } from "@/src/theme/tokens";
import { fetchPositionPnl, type TraderTokenPosition } from "@/src/features/portfolio/portfolioService";
import {
  buildMarketCapSeries,
  fetchLiveTokenInfo,
  fetchTokenCandles,
  type LiveTokenInfo,
  type TokenMarketCapPoint,
} from "@/src/features/token/tokenService";
import {
  addTokenToWatchlist,
  fetchTokenWatchlists,
  removeTokenFromWatchlist,
  type TokenWatchlist,
} from "@/src/features/watchlist/tokenWatchlistService";
import { TokenChart } from "@/src/ui/TokenChart";

type TokenDetailScreenProps = {
  rpcClient: RpcClient;
  params?: TokenDetailRouteParams;
};

const fallbackTokenImage = "https://app.quickscope.gg/favicon.ico";

const chartTimeframes = [
  { id: "1m", label: "1m", rangeSeconds: 60 * 60, resolutionSeconds: 60 },
  { id: "15m", label: "15m", rangeSeconds: 6 * 60 * 60, resolutionSeconds: 15 * 60 },
  { id: "1h", label: "1h", rangeSeconds: 24 * 60 * 60, resolutionSeconds: 60 * 60 },
  { id: "6h", label: "6h", rangeSeconds: 7 * 24 * 60 * 60, resolutionSeconds: 6 * 60 * 60 },
] as const;

type ChartTimeframe = (typeof chartTimeframes)[number];

function formatChartTimestamp(timestampSeconds: number, timeframeId: string): string {
  if (!timestampSeconds) {
    return "--";
  }

  const date = new Date(timestampSeconds * 1000);
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");

  if (timeframeId === "1m" || timeframeId === "15m") {
    return `${hours}:${minutes}`;
  }

  if (timeframeId === "1h") {
    return `${date.getMonth() + 1}/${date.getDate()} ${hours}:${minutes}`;
  }

  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export function TokenDetailScreen({ rpcClient, params }: TokenDetailScreenProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStack>>();
  const { walletAddress, hasValidAccessToken, authenticateFromWallet } = useAuthSession();
  const chartRequestIdRef = useRef(0);
  const positionRequestIdRef = useRef(0);
  const [selectedTimeframe, setSelectedTimeframe] = useState<ChartTimeframe>(
    chartTimeframes[2]
  );
  const [liveInfo, setLiveInfo] = useState<LiveTokenInfo | null>(null);
  const [chartData, setChartData] = useState<TokenMarketCapPoint[]>([]);
  const [isChartLoading, setIsChartLoading] = useState(false);
  const [chartError, setChartError] = useState<string | null>(null);
  const [positionInfo, setPositionInfo] = useState<TraderTokenPosition | null>(null);
  const [positionError, setPositionError] = useState<string | null>(null);
  const [watchlists, setWatchlists] = useState<TokenWatchlist[]>([]);
  const [watchlistError, setWatchlistError] = useState<string | null>(null);
  const [isWatchlistLoading, setIsWatchlistLoading] = useState(false);
  const [isWatchlistUpdating, setIsWatchlistUpdating] = useState(false);

  if (!params?.tokenAddress) {
    return (
      <View style={styles.page}>
        <Text style={styles.title}>Token Detail</Text>
        <Text style={styles.subtitle}>No token context was provided.</Text>
      </View>
    );
  }

  const tokenAddress = params.tokenAddress;

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

        if (!isActive || requestId !== chartRequestIdRef.current) {
          return;
        }

        setLiveInfo(tokenInfo ?? null);

        const series = buildMarketCapSeries({
          candles: candlesResponse.candles ?? [],
          tokenInfo: tokenInfo ?? null,
          candlesResponse,
        });

        setChartData(series);
      } catch (error) {
        if (!isActive || requestId !== chartRequestIdRef.current) {
          return;
        }
        setChartError(error instanceof Error ? error.message : "Failed to load chart.");
      } finally {
        if (!isActive || requestId !== chartRequestIdRef.current) {
          return;
        }
        setIsChartLoading(false);
      }
    };

    void load();

    return () => {
      isActive = false;
    };
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
      .then((data) => {
        if (!isActive) {
          return;
        }
        setWatchlists(data ?? []);
      })
      .catch((error) => {
        if (!isActive) {
          return;
        }
        setWatchlistError(
          error instanceof Error ? error.message : "Failed to load watchlists."
        );
        setWatchlists([]);
      })
      .finally(() => {
        if (!isActive) {
          return;
        }
        setIsWatchlistLoading(false);
      });

    return () => {
      isActive = false;
    };
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
        if (!isActive || requestId !== positionRequestIdRef.current) {
          return;
        }
        setPositionInfo(data);
      })
      .catch((error) => {
        if (!isActive || requestId !== positionRequestIdRef.current) {
          return;
        }
        setPositionError(error instanceof Error ? error.message : "Failed to load position.");
        setPositionInfo(null);
      });

    return () => {
      isActive = false;
    };
  }, [rpcClient, tokenAddress, walletAddress]);

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
    if (watchlists.length === 0) {
      return undefined;
    }

    return (
      watchlists.find(
        (list) => list.isFavorites || list.name.toLowerCase() === "favorites"
      ) ?? watchlists[0]
    );
  }, [watchlists]);

  const isTracked = useMemo(() => {
    if (!activeWatchlist) {
      return false;
    }
    return activeWatchlist.tokens?.includes(tokenAddress) ?? false;
  }, [activeWatchlist, tokenAddress]);

  const marketCapUsd = params.marketCapUsd;
  const oneHourChange = params.oneHourChangePercent;
  const platformLabel = (params.platform || params.exchange || "unknown").toUpperCase();
  const mintedAtSeconds = liveInfo?.mint_transaction?.ts ?? params.mintedAtSeconds;

  const handleCopyAddress = async () => {
    await Clipboard.setStringAsync(tokenAddress);
    Alert.alert("Copied", "Token address copied to clipboard.");
  };

  const handleToggleWatchlist = async () => {
    if (!hasValidAccessToken) {
      await authenticateFromWallet();
      return;
    }

    if (!activeWatchlist) {
      Alert.alert("No watchlists", "Create a watchlist on web to start tracking.");
      return;
    }

    if (isWatchlistUpdating) {
      return;
    }

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
          if (list.id !== activeWatchlist.id) {
            return list;
          }

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
  };

  const socialLinks = [
    { label: "X", url: tokenMeta.twitterUrl },
    { label: "TG", url: tokenMeta.telegramUrl },
    { label: "Web", url: tokenMeta.websiteUrl },
  ].filter((link) => Boolean(link.url));

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Image
            source={{ uri: tokenMeta.imageUri || fallbackTokenImage }}
            style={styles.tokenImage}
          />
          <View style={styles.heroText}>
            <Text style={styles.symbol}>{tokenMeta.symbol}</Text>
            <Text style={styles.name}>{tokenMeta.name}</Text>
            <Text style={styles.tagPill}>{platformLabel}</Text>
          </View>
        </View>

        {socialLinks.length > 0 ? (
          <View style={styles.socialRow}>
            {socialLinks.map((link) => (
              <Pressable
                key={link.label}
                style={styles.socialPill}
                onPress={() => link.url && Linking.openURL(link.url)}
              >
                <Text style={styles.socialText}>{link.label}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        <View style={styles.watchlistRow}>
          <Pressable
            style={[
              styles.watchlistButton,
              isTracked && hasValidAccessToken ? styles.watchlistButtonActive : null,
            ]}
            onPress={handleToggleWatchlist}
            disabled={isWatchlistLoading || isWatchlistUpdating}
          >
            <Text
              style={[
                styles.watchlistText,
                isTracked && hasValidAccessToken ? styles.watchlistTextActive : null,
              ]}
            >
              {!hasValidAccessToken
                ? "Authenticate for watchlists"
                : activeWatchlist
                  ? isTracked
                    ? "In Watchlist"
                    : "Add to Watchlist"
                  : isWatchlistLoading
                    ? "Loading watchlists..."
                    : "No watchlists yet"}
            </Text>
          </Pressable>
          {watchlistError ? <Text style={styles.watchlistError}>Watchlist unavailable.</Text> : null}
        </View>

        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Market Cap</Text>
            <Text style={styles.metricValue}>{formatCompactUsd(marketCapUsd)}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>1h Volume</Text>
            <Text style={styles.metricValue}>{formatCompactUsd(params.oneHourVolumeUsd)}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>1h Tx</Text>
            <Text style={styles.metricValue}>
              {params.oneHourTxCount?.toLocaleString() || "n/a"}
            </Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>1h Change</Text>
            <Text
              style={[
                styles.metricValue,
                oneHourChange !== undefined
                  ? oneHourChange >= 0
                    ? styles.metricPositive
                    : styles.metricNegative
                  : null,
              ]}
            >
              {formatPercent(oneHourChange)}
            </Text>
          </View>
        </View>

        {walletAddress ? (
          <View style={styles.holdingsCard}>
            <View style={styles.holdingsHeader}>
              <Text style={styles.sectionTitle}>Holdings</Text>
              {positionError ? (
                <Text style={styles.holdingsError}>Unavailable</Text>
              ) : null}
            </View>
            <View style={styles.holdingsRow}>
              <View style={styles.holdingsStat}>
                <Text style={styles.holdingsLabel}>Balance</Text>
                <Text style={styles.holdingsValue}>
                  {formatSol(positionInfo?.position?.balance)}
                </Text>
              </View>
              <View style={styles.holdingsStat}>
                <Text style={styles.holdingsLabel}>Total PnL</Text>
                <Text
                  style={[
                    styles.holdingsValue,
                    positionInfo?.position?.total_pnl_quote
                      ? positionInfo.position.total_pnl_quote >= 0
                        ? styles.metricPositive
                        : styles.metricNegative
                      : null,
                  ]}
                >
                  {formatSol(positionInfo?.position?.total_pnl_quote)}
                </Text>
              </View>
              <View style={styles.holdingsStat}>
                <Text style={styles.holdingsLabel}>PnL %</Text>
                <Text
                  style={[
                    styles.holdingsValue,
                    positionInfo?.position?.total_pnl_change_proportion
                      ? positionInfo.position.total_pnl_change_proportion >= 0
                        ? styles.metricPositive
                        : styles.metricNegative
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

        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.sectionTitle}>Market Cap</Text>
            <View style={styles.timeframeRow}>
              {chartTimeframes.map((frame) => {
                const isActive = frame.id === selectedTimeframe.id;
                return (
                  <Pressable
                    key={frame.id}
                    onPress={() => setSelectedTimeframe(frame)}
                    style={[styles.timeframePill, isActive && styles.timeframePillActive]}
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
          </View>
          <TokenChart
            data={chartData}
            height={170}
            isLoading={isChartLoading}
            formatValue={formatCompactUsd}
            formatTimestamp={(ts) => formatChartTimestamp(ts, selectedTimeframe.id)}
          />
          {chartError ? <Text style={styles.chartError}>Chart unavailable.</Text> : null}
        </View>

        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Address</Text>
            <Pressable onPress={handleCopyAddress}>
              <Text style={styles.copyText}>Copy</Text>
            </Pressable>
          </View>
          <Text style={styles.detailLine}>{tokenAddress}</Text>
          <Text style={styles.detailLine}>Age: {formatAgeFromSeconds(mintedAtSeconds)}</Text>
          {typeof params.scanMentionsOneHour === "number" ? (
            <Text style={styles.detailLine}>
              Scan mentions (1h): {params.scanMentionsOneHour}
            </Text>
          ) : null}
          {params.source ? (
            <Text style={styles.detailLine}>Opened from: {params.source}</Text>
          ) : null}
        </View>
      </ScrollView>

      <View style={styles.ctaWrap}>
        <Pressable
          style={styles.primaryCta}
          onPress={() =>
            navigation.navigate("TradeEntry", {
              source: "deep-link",
              tokenAddress,
              outputMintDecimals: params.tokenDecimals,
            })
          }
        >
          <Text style={styles.primaryCtaText}>Trade</Text>
        </Pressable>
        <Pressable
          style={styles.secondaryCta}
          onPress={() => navigation.navigate("MainTabs", { screen: "Discovery" })}
        >
          <Text style={styles.secondaryCtaText}>Back to Discover</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: qsColors.bgCanvas,
  },
  scrollContent: {
    padding: qsSpacing.xl,
    gap: qsSpacing.md,
    paddingBottom: qsSpacing.lg,
  },
  title: {
    color: qsColors.textPrimary,
    fontSize: 28,
    fontWeight: "700",
  },
  subtitle: {
    color: qsColors.textMuted,
    fontSize: 14,
  },
  hero: {
    flexDirection: "row",
    gap: qsSpacing.md,
    alignItems: "center",
  },
  tokenImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: qsColors.bgCardSoft,
  },
  heroText: {
    flex: 1,
    gap: 2,
  },
  symbol: {
    color: qsColors.textPrimary,
    fontSize: 28,
    fontWeight: "700",
  },
  name: {
    color: qsColors.textMuted,
    fontSize: 14,
  },
  socialRow: {
    flexDirection: "row",
    gap: qsSpacing.sm,
  },
  socialPill: {
    borderRadius: qsRadius.lg,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    backgroundColor: qsColors.bgCard,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  socialText: {
    color: qsColors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  watchlistRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: qsSpacing.sm,
  },
  watchlistButton: {
    borderRadius: qsRadius.lg,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    backgroundColor: qsColors.bgCard,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  watchlistButtonActive: {
    borderColor: qsColors.accent,
    backgroundColor: "rgba(78, 163, 255, 0.18)",
  },
  watchlistText: {
    color: qsColors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  watchlistTextActive: {
    color: qsColors.textPrimary,
  },
  watchlistError: {
    color: qsColors.textSubtle,
    fontSize: 12,
  },
  tagPill: {
    marginTop: 6,
    alignSelf: "flex-start",
    color: qsColors.textSubtle,
    backgroundColor: qsColors.bgCardSoft,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    borderRadius: qsRadius.lg,
    paddingHorizontal: 8,
    fontSize: 10,
    overflow: "hidden",
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: qsSpacing.sm,
  },
  metricCard: {
    width: "48%",
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    borderRadius: qsRadius.md,
    backgroundColor: qsColors.bgCard,
    padding: qsSpacing.sm,
    gap: 4,
  },
  metricLabel: {
    color: qsColors.textSubtle,
    fontSize: 11,
  },
  metricValue: {
    color: qsColors.textSecondary,
    fontSize: 16,
    fontWeight: "700",
  },
  metricPositive: {
    color: qsColors.success,
  },
  metricNegative: {
    color: qsColors.danger,
  },
  chartCard: {
    gap: qsSpacing.sm,
  },
  holdingsCard: {
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    borderRadius: qsRadius.md,
    backgroundColor: qsColors.bgCard,
    padding: qsSpacing.md,
    gap: qsSpacing.sm,
  },
  holdingsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  holdingsError: {
    color: qsColors.textSubtle,
    fontSize: 12,
  },
  holdingsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: qsSpacing.sm,
  },
  holdingsStat: {
    flex: 1,
    gap: 4,
  },
  holdingsLabel: {
    color: qsColors.textSubtle,
    fontSize: 11,
  },
  holdingsValue: {
    color: qsColors.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },
  chartHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: qsSpacing.sm,
  },
  sectionTitle: {
    color: qsColors.textPrimary,
    fontSize: 16,
    fontWeight: "600",
  },
  timeframeRow: {
    flexDirection: "row",
    gap: qsSpacing.xs,
  },
  timeframePill: {
    borderRadius: qsRadius.sm,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: qsColors.bgCard,
  },
  timeframePillActive: {
    borderColor: qsColors.accent,
    backgroundColor: "rgba(78, 163, 255, 0.15)",
  },
  timeframeText: {
    color: qsColors.textSubtle,
    fontSize: 11,
    fontWeight: "600",
  },
  timeframeTextActive: {
    color: qsColors.textPrimary,
  },
  chartError: {
    color: qsColors.textSubtle,
    fontSize: 12,
  },
  detailsCard: {
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    borderRadius: qsRadius.md,
    backgroundColor: qsColors.bgCardSoft,
    padding: qsSpacing.md,
    gap: 6,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  detailLabel: {
    color: qsColors.textSubtle,
    fontSize: 12,
  },
  copyText: {
    color: qsColors.accent,
    fontSize: 12,
    fontWeight: "600",
  },
  detailLine: {
    color: qsColors.textSecondary,
    fontSize: 12,
  },
  ctaWrap: {
    borderTopWidth: 1,
    borderTopColor: qsColors.borderDefault,
    backgroundColor: qsColors.bgCanvas,
    paddingHorizontal: qsSpacing.xl,
    paddingVertical: qsSpacing.sm,
    gap: qsSpacing.sm,
  },
  primaryCta: {
    borderRadius: qsRadius.md,
    backgroundColor: qsColors.accent,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryCtaText: {
    color: "#061326",
    fontSize: 14,
    fontWeight: "700",
  },
  secondaryCta: {
    borderRadius: qsRadius.md,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    backgroundColor: qsColors.bgCard,
    paddingVertical: 10,
    alignItems: "center",
  },
  secondaryCtaText: {
    color: qsColors.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
});
