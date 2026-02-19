import { useEffect, useMemo, useRef, useState } from "react";

import * as Clipboard from "expo-clipboard";
import {
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import type { RpcClient } from "@/src/lib/api/rpcClient";
import { useAuthSession } from "@/src/features/auth/AuthSessionProvider";
import { useWalletConnect } from "@/src/features/wallet/WalletConnectProvider";
import type { TokenDetailRouteParams } from "@/src/navigation/types";
import { qsColors, qsRadius, qsSpacing } from "@/src/theme/tokens";
import { fetchPositionPnl, type TraderTokenPosition } from "@/src/features/portfolio/portfolioService";
import {
  fetchTokenActivity,
  fetchTokenHolders,
  fetchTokenTraders,
  type TokenActivityRow,
  type TokenHolder,
  type TokenTrader,
} from "@/src/features/token/tokenInsightsService";
import {
  buildMarketCapSeries,
  buildMarketCapCandles,
  buildPriceSeries,
  buildPriceCandles,
  fetchLiveTokenInfo,
  fetchTokenCandles,
  fetchTokenCandlesReverse,
  type LiveTokenInfo,
  type TokenCandlePoint,
  type TokenMarketCapPoint,
} from "@/src/features/token/tokenService";
import {
  getQuoteTtlSecondsRemaining,
  isQuoteStale,
} from "@/src/features/trade/quoteUtils";
import {
  requestSwapQuote,
  type QuoteResult,
} from "@/src/features/trade/tradeQuoteService";
import { requestSwapExecution } from "@/src/features/trade/tradeExecutionService";
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
const SOL_MINT = "So11111111111111111111111111111111111111112";

const chartIntervals = [
  { id: "1s", label: "1s", resolutionSeconds: 1, rangeSeconds: 15 * 60 },
  { id: "1m", label: "1m", resolutionSeconds: 60, rangeSeconds: 6 * 60 * 60 },
  { id: "5m", label: "5m", resolutionSeconds: 5 * 60, rangeSeconds: 24 * 60 * 60 },
  { id: "15m", label: "15m", resolutionSeconds: 15 * 60, rangeSeconds: 7 * 24 * 60 * 60 },
  { id: "1h", label: "1h", resolutionSeconds: 60 * 60, rangeSeconds: 14 * 24 * 60 * 60 },
] as const;

type ChartInterval = (typeof chartIntervals)[number];

type DetailSectionId = "activity" | "traders" | "holders" | "dev";

const detailSections: { id: DetailSectionId; label: string }[] = [
  { id: "activity", label: "Activity" },
  { id: "traders", label: "Traders" },
  { id: "holders", label: "Holders" },
  { id: "dev", label: "Dev" },
];

type ChartVariant = "line" | "candle";

const activitySortOptions = [
  { id: "recent", label: "Recent", sortColumn: "index", sortOrder: false },
  { id: "amount", label: "Amount", sortColumn: "amount_quote", sortOrder: false },
] as const;

const activityTypeOptions = [
  { id: "all", label: "All", types: null as null | string[] },
  { id: "buys", label: "Buys", types: ["b"] },
  { id: "sells", label: "Sells", types: ["s"] },
] as const;

const traderSortOptions = [
  { id: "pnl", label: "PnL", sortColumn: "total_pnl_quote" },
  { id: "realized", label: "Realized", sortColumn: "realized_pnl_quote" },
  { id: "unrealized", label: "Unrealized", sortColumn: "unrealized_pnl_quote" },
] as const;

const holderSortOptions = [
  { id: "balance-desc", label: "Balance ↓", order: "desc" },
  { id: "balance-asc", label: "Balance ↑", order: "asc" },
] as const;

const amountPresets = [0.05, 0.1, 0.5, 1];
const pricePresetMultipliers = [1.05, 1.1, 1.2];

function formatCompactUsd(value: number | undefined): string {
  if (!value || !Number.isFinite(value) || value <= 0) {
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
  return `$${value.toFixed(2)}`;
}

function formatPercent(value: number | undefined): string {
  if (value === undefined || !Number.isFinite(value)) {
    return "n/a";
  }
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${value.toFixed(1)}%`;
}

function formatCompactNumber(value: number | undefined): string {
  if (value === undefined || !Number.isFinite(value)) {
    return "--";
  }

  const absValue = Math.abs(value);
  if (absValue >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2)}B`;
  }
  if (absValue >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  }
  if (absValue >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  if (absValue >= 1) {
    return value.toFixed(2);
  }

  return value.toFixed(4);
}

function formatTokenAmount(value: number | undefined, decimals = 6): string {
  if (value === undefined || !Number.isFinite(value)) {
    return "n/a";
  }

  const clamped = Math.max(0, Math.min(decimals, 8));
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: clamped,
  });
}

function parseAmount(value: string): number {
  return Number.parseFloat(value.trim());
}

function formatAgeFromSeconds(unixSeconds: number | undefined): string {
  if (!unixSeconds || !Number.isFinite(unixSeconds) || unixSeconds <= 0) {
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

function formatChartTimestamp(timestampSeconds: number, resolutionSeconds: number): string {
  if (!timestampSeconds) {
    return "--";
  }

  const date = new Date(timestampSeconds * 1000);
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");

  if (resolutionSeconds <= 60) {
    return `${hours}:${minutes}:${seconds}`;
  }

  if (resolutionSeconds <= 60 * 60) {
    return `${hours}:${minutes}`;
  }

  if (resolutionSeconds <= 15 * 60) {
    return `${date.getMonth() + 1}/${date.getDate()} ${hours}:${minutes}`;
  }

  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function formatTimeAgo(unixSeconds: number | undefined): string {
  if (!unixSeconds || !Number.isFinite(unixSeconds) || unixSeconds <= 0) {
    return "--";
  }

  const delta = Math.max(0, Math.floor(Date.now() / 1000) - unixSeconds);
  if (delta < 60) {
    return `${delta}s`;
  }
  if (delta < 3600) {
    return `${Math.floor(delta / 60)}m`;
  }
  if (delta < 86400) {
    return `${Math.floor(delta / 3600)}h`;
  }
  return `${Math.floor(delta / 86400)}d`;
}

function formatAddress(address: string | undefined): string {
  if (!address) {
    return "--";
  }
  if (address.length <= 10) {
    return address;
  }
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function formatSol(value: number | undefined): string {
  if (value === undefined || !Number.isFinite(value)) {
    return "--";
  }

  if (Math.abs(value) >= 1000) {
    return value.toFixed(0);
  }

  if (Math.abs(value) >= 10) {
    return value.toFixed(2);
  }

  return value.toFixed(3);
}

export function TokenDetailScreen({ rpcClient, params }: TokenDetailScreenProps) {
  const { walletAddress, hasValidAccessToken } = useAuthSession();
  const { ensureAuthenticated } = useWalletConnect();
  const chartRequestIdRef = useRef(0);
  const positionRequestIdRef = useRef(0);
  const [selectedInterval, setSelectedInterval] = useState<ChartInterval>(chartIntervals[1]);
  const [liveInfo, setLiveInfo] = useState<LiveTokenInfo | null>(null);
  const [chartMetricLabel, setChartMetricLabel] = useState("Market Cap");
  const [chartVariant, setChartVariant] = useState<ChartVariant>("line");
  const [chartData, setChartData] = useState<TokenMarketCapPoint[]>([]);
  const [chartCandles, setChartCandles] = useState<TokenCandlePoint[]>([]);
  const [isChartLoading, setIsChartLoading] = useState(false);
  const [chartError, setChartError] = useState<string | null>(null);
  const [positionInfo, setPositionInfo] = useState<TraderTokenPosition | null>(null);
  const [positionError, setPositionError] = useState<string | null>(null);
  const [watchlists, setWatchlists] = useState<TokenWatchlist[]>([]);
  const [watchlistError, setWatchlistError] = useState<string | null>(null);
  const [isWatchlistLoading, setIsWatchlistLoading] = useState(false);
  const [isWatchlistUpdating, setIsWatchlistUpdating] = useState(false);
  const [activeDetailSection, setActiveDetailSection] =
    useState<DetailSectionId>("activity");
  const [activityRows, setActivityRows] = useState<TokenActivityRow[]>([]);
  const [isActivityLoading, setIsActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState<string | null>(null);
  const [activitySort, setActivitySort] = useState(activitySortOptions[0]);
  const [activityType, setActivityType] = useState(activityTypeOptions[0]);
  const [traderRows, setTraderRows] = useState<TokenTrader[]>([]);
  const [isTradersLoading, setIsTradersLoading] = useState(false);
  const [tradersError, setTradersError] = useState<string | null>(null);
  const [traderSort, setTraderSort] = useState(traderSortOptions[0]);
  const [holderRows, setHolderRows] = useState<TokenHolder[]>([]);
  const [isHoldersLoading, setIsHoldersLoading] = useState(false);
  const [holdersError, setHoldersError] = useState<string | null>(null);
  const [holderSort, setHolderSort] = useState(holderSortOptions[0]);
  const [orderType, setOrderType] = useState<"instant" | "market">("market");
  const [tradeAmount, setTradeAmount] = useState("");
  const [targetPrice, setTargetPrice] = useState("");
  const [tradeQuote, setTradeQuote] = useState<QuoteResult | undefined>();
  const [tradeError, setTradeError] = useState<string | null>(null);
  const [isTradeLoading, setIsTradeLoading] = useState(false);
  const [isTradeExecuting, setIsTradeExecuting] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const chipHitSlop = { top: 6, bottom: 6, left: 6, right: 6 };

  const tokenAddress = params?.tokenAddress ?? "";

  useEffect(() => {
    let isActive = true;
    const requestId = ++chartRequestIdRef.current;

    const load = async () => {
      setIsChartLoading(true);
      setChartError(null);

      try {
        const nowSeconds = Math.floor(Date.now() / 1000);
        const fromSeconds = nowSeconds - selectedInterval.rangeSeconds;

        const [tokenInfo, candlesResponse] = await Promise.all([
          fetchLiveTokenInfo(rpcClient, tokenAddress),
          fetchTokenCandles(rpcClient, {
            tokenAddress,
            from: fromSeconds,
            to: nowSeconds,
            resolutionSeconds: selectedInterval.resolutionSeconds,
          }),
        ]);

        let resolvedCandlesResponse = candlesResponse;
        let candles = candlesResponse.candles ?? [];

        if (candles.length === 0) {
          const reverseResponse = await fetchTokenCandlesReverse(rpcClient, {
            tokenAddress,
            before: nowSeconds,
            resolutionSeconds: selectedInterval.resolutionSeconds,
            limit: 240,
          });

          if (reverseResponse.candles && reverseResponse.candles.length > 0) {
            resolvedCandlesResponse = reverseResponse;
            candles = reverseResponse.candles ?? [];
          }
        }

        if (!isActive || requestId !== chartRequestIdRef.current) {
          return;
        }

        setLiveInfo(tokenInfo ?? null);

        const marketCapSeries = buildMarketCapSeries({
          candles,
          tokenInfo: tokenInfo ?? null,
          candlesResponse: resolvedCandlesResponse,
        });
        const marketCapCandles = buildMarketCapCandles({
          candles,
          tokenInfo: tokenInfo ?? null,
          candlesResponse: resolvedCandlesResponse,
        });

        if (marketCapSeries.length > 0 && marketCapCandles.length > 0) {
          setChartMetricLabel("Market Cap");
          setChartData(marketCapSeries);
          setChartCandles(marketCapCandles);
        } else {
          const priceSeries = buildPriceSeries(candles);
          const priceCandles = buildPriceCandles(candles);
          setChartMetricLabel(priceSeries.length > 0 ? "Price" : "Market Cap");
          setChartData(priceSeries);
          setChartCandles(priceCandles);
        }
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
  }, [rpcClient, selectedInterval, tokenAddress]);

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
    if (!tradeQuote) {
      return;
    }

    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, [tradeQuote]);

  useEffect(() => {
    setTradeQuote(undefined);
    setTradeError(null);
  }, [orderType, tradeAmount, tokenAddress]);

  useEffect(() => {
    if (activeDetailSection !== "activity") {
      return;
    }

    let isActive = true;
    setIsActivityLoading(true);
    setActivityError(null);

    fetchTokenActivity(rpcClient, {
      mint: tokenAddress,
      rowLimit: 40,
      sortColumn: activitySort.sortColumn,
      sortOrder: activitySort.sortOrder,
    })
      .then((response) => {
        if (!isActive) {
          return;
        }
        setActivityRows(response.table?.rows ?? []);
      })
      .catch((error) => {
        if (!isActive) {
          return;
        }
        setActivityError(error instanceof Error ? error.message : "Failed to load activity.");
        setActivityRows([]);
      })
      .finally(() => {
        if (!isActive) {
          return;
        }
        setIsActivityLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [activeDetailSection, activitySort, rpcClient, tokenAddress]);

  useEffect(() => {
    if (activeDetailSection !== "traders") {
      return;
    }

    let isActive = true;
    setIsTradersLoading(true);
    setTradersError(null);

    fetchTokenTraders(rpcClient, {
      mint: tokenAddress,
      limit: 40,
      sortColumn: traderSort.sortColumn,
    })
      .then((response) => {
        if (!isActive) {
          return;
        }
        setTraderRows(response.traders ?? []);
      })
      .catch((error) => {
        if (!isActive) {
          return;
        }
        setTradersError(error instanceof Error ? error.message : "Failed to load traders.");
        setTraderRows([]);
      })
      .finally(() => {
        if (!isActive) {
          return;
        }
        setIsTradersLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [activeDetailSection, rpcClient, tokenAddress, traderSort]);

  useEffect(() => {
    if (activeDetailSection !== "holders") {
      return;
    }

    let isActive = true;
    setIsHoldersLoading(true);
    setHoldersError(null);

    fetchTokenHolders(rpcClient, {
      mint: tokenAddress,
      limit: 40,
    })
      .then((response) => {
        if (!isActive) {
          return;
        }
        setHolderRows(response.holders ?? []);
      })
      .catch((error) => {
        if (!isActive) {
          return;
        }
        setHoldersError(error instanceof Error ? error.message : "Failed to load holders.");
        setHolderRows([]);
      })
      .finally(() => {
        if (!isActive) {
          return;
        }
        setIsHoldersLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [activeDetailSection, rpcClient, tokenAddress]);

  const totalSupply = useMemo(() => {
    const supply = liveInfo?.mint_info?.supply;
    const decimals = liveInfo?.mint_info?.decimals;
    if (!Number.isFinite(supply) || !Number.isFinite(decimals)) {
      return undefined;
    }
    return Number(supply) / Math.pow(10, Number(decimals));
  }, [liveInfo?.mint_info?.decimals, liveInfo?.mint_info?.supply]);

  const sortedHolders = useMemo(() => {
    const rows = [...holderRows];
    rows.sort((a, b) => {
      const delta = a.balance - b.balance;
      return holderSort.order === "asc" ? delta : -delta;
    });
    return rows;
  }, [holderRows, holderSort.order]);

  const filteredActivityRows = useMemo(() => {
    if (!activityType.types) {
      return activityRows;
    }
    return activityRows.filter((row) => activityType.types?.includes(row.type));
  }, [activityRows, activityType.types]);

  const tradeQuoteIsStale = tradeQuote
    ? isQuoteStale(tradeQuote.requestedAtMs, nowMs)
    : false;
  const tradeQuoteTtl = tradeQuote
    ? getQuoteTtlSecondsRemaining(tradeQuote.requestedAtMs, nowMs)
    : 0;

  const handleGetMarketQuote = async () => {
    if (!walletAddress) {
      Alert.alert("Wallet required", "Connect your wallet to request a quote.");
      return;
    }

    if (!hasValidAccessToken) {
      setTradeError("Authenticate session before requesting a quote.");
      return;
    }

    const amountUi = parseAmount(tradeAmount);
    if (!Number.isFinite(amountUi) || amountUi <= 0) {
      Alert.alert("Invalid amount", "Enter an amount greater than 0.");
      return;
    }

    setIsTradeLoading(true);
    setTradeError(null);
    setTradeQuote(undefined);

    try {
      const nextQuote = await requestSwapQuote(rpcClient, {
        walletAddress,
        inputMint: SOL_MINT,
        outputMint: tokenAddress,
        amountUi,
        outputTokenDecimals: params?.tokenDecimals,
      });
      setTradeQuote(nextQuote);
    } catch (error) {
      setTradeError(String(error));
    } finally {
      setIsTradeLoading(false);
    }
  };

  const handleExecuteMarket = async () => {
    if (!walletAddress || !tradeQuote) {
      return;
    }

    if (tradeQuoteIsStale) {
      Alert.alert("Quote expired", "Refresh quote before executing.");
      return;
    }

    setIsTradeExecuting(true);
    setTradeError(null);

    try {
      await requestSwapExecution(rpcClient, {
        walletAddress,
        inputMint: tradeQuote.inputMint,
        outputMint: tradeQuote.outputMint,
        amountAtomic: tradeQuote.amountAtomic,
        slippageBps: tradeQuote.slippageBps,
      });
      Alert.alert("Trade submitted", "Market trade submitted.");
    } catch (error) {
      Alert.alert("Trade failed", String(error));
    } finally {
      setIsTradeExecuting(false);
    }
  };

  const handleInstantTrade = async () => {
    if (!walletAddress) {
      Alert.alert("Wallet required", "Connect your wallet to trade.");
      return;
    }

    if (!hasValidAccessToken) {
      setTradeError("Authenticate session before trading.");
      return;
    }

    const amountUi = parseAmount(tradeAmount);
    if (!Number.isFinite(amountUi) || amountUi <= 0) {
      Alert.alert("Invalid amount", "Enter an amount greater than 0.");
      return;
    }

    setIsTradeExecuting(true);
    setTradeError(null);

    try {
      const nextQuote = await requestSwapQuote(rpcClient, {
        walletAddress,
        inputMint: SOL_MINT,
        outputMint: tokenAddress,
        amountUi,
        outputTokenDecimals: params?.tokenDecimals,
      });

      await requestSwapExecution(rpcClient, {
        walletAddress,
        inputMint: nextQuote.inputMint,
        outputMint: nextQuote.outputMint,
        amountAtomic: nextQuote.amountAtomic,
        slippageBps: nextQuote.slippageBps,
      });

      Alert.alert("Trade submitted", "Instant trade submitted.");
    } catch (error) {
      Alert.alert("Trade failed", String(error));
    } finally {
      setIsTradeExecuting(false);
    }
  };

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
  const livePriceUsd = liveInfo?.token_price_info?.price_usd;

  const handleCopyAddress = async () => {
    await Clipboard.setStringAsync(tokenAddress);
    Alert.alert("Copied", "Token address copied to clipboard.");
  };

  const handleToggleWatchlist = async () => {
    if (!hasValidAccessToken) {
      await ensureAuthenticated();
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

  if (!tokenAddress) {
    return (
      <View style={styles.page}>
        <Text style={styles.title}>Token Detail</Text>
        <Text style={styles.subtitle}>No token context was provided.</Text>
      </View>
    );
  }

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
            <Text style={styles.sectionTitle}>{chartMetricLabel}</Text>
            <View style={styles.chartControls}>
              <View style={styles.chartToggleRow}>
                {(["line", "candle"] as const).map((variant) => {
                  const isActive = chartVariant === variant;
                  return (
                    <Pressable
                      key={variant}
                      onPress={() => setChartVariant(variant)}
                      style={[
                        styles.timeframePill,
                        isActive && styles.timeframePillActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.timeframeText,
                          isActive && styles.timeframeTextActive,
                        ]}
                      >
                        {variant === "line" ? "Line" : "Candles"}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <View style={styles.timeframeRow}>
                {chartIntervals.map((frame) => {
                  const isActive = frame.id === selectedInterval.id;
                  return (
                    <Pressable
                      key={frame.id}
                      onPress={() => setSelectedInterval(frame)}
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
          </View>
          <TokenChart
            data={chartData}
            candles={chartCandles}
            height={170}
            isLoading={isChartLoading}
            variant={chartVariant}
            formatValue={formatCompactUsd}
            formatTimestamp={(ts) =>
              formatChartTimestamp(ts, selectedInterval.resolutionSeconds)
            }
          />
          {chartError ? <Text style={styles.chartError}>Chart unavailable.</Text> : null}
        </View>

        <View style={styles.sectionDivider} />

        <View style={styles.detailTabsRow}>
          {detailSections.map((section) => {
            const isActive = section.id === activeDetailSection;
            return (
              <Pressable
                key={section.id}
                onPress={() => setActiveDetailSection(section.id)}
                style={[styles.detailTab, isActive && styles.detailTabActive]}
                hitSlop={chipHitSlop}
              >
                <Text style={[styles.detailTabText, isActive && styles.detailTabTextActive]}>
                  {section.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.detailPanel}>
          <View style={styles.detailPanelHeader}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}
            >
              {activeDetailSection === "activity"
                ? [
                    ...activityTypeOptions.map((option) => {
                      const isActive = option.id === activityType.id;
                      return (
                        <Pressable
                          key={option.id}
                          style={[styles.filterPill, isActive && styles.filterPillActive]}
                          onPress={() => setActivityType(option)}
                          hitSlop={chipHitSlop}
                        >
                          <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                            {option.label}
                          </Text>
                        </Pressable>
                      );
                    }),
                    ...activitySortOptions.map((option) => {
                      const isActive = option.id === activitySort.id;
                      return (
                      <Pressable
                        key={option.id}
                        style={[styles.filterPill, isActive && styles.filterPillActive]}
                        onPress={() => setActivitySort(option)}
                        hitSlop={chipHitSlop}
                      >
                          <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                            {option.label}
                          </Text>
                        </Pressable>
                      );
                    }),
                  ]
                : null}
              {activeDetailSection === "traders"
                ? traderSortOptions.map((option) => {
                    const isActive = option.id === traderSort.id;
                    return (
                      <Pressable
                        key={option.id}
                        style={[styles.filterPill, isActive && styles.filterPillActive]}
                        onPress={() => setTraderSort(option)}
                        hitSlop={chipHitSlop}
                      >
                        <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })
                : null}
              {activeDetailSection === "holders"
                ? holderSortOptions.map((option) => {
                    const isActive = option.id === holderSort.id;
                    return (
                      <Pressable
                        key={option.id}
                        style={[styles.filterPill, isActive && styles.filterPillActive]}
                        onPress={() => setHolderSort(option)}
                        hitSlop={chipHitSlop}
                      >
                        <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })
                : null}
            </ScrollView>
            <Pressable
              style={styles.filterButton}
              onPress={() => Alert.alert("Filters", "Advanced filters are coming soon.")}
            >
              <Text style={styles.filterButtonText}>Filter</Text>
            </Pressable>
          </View>

          {activeDetailSection === "activity" ? (
            isActivityLoading ? (
              <Text style={styles.detailEmptyText}>Loading activity...</Text>
            ) : activityError ? (
              <Text style={styles.detailEmptyText}>{activityError}</Text>
            ) : filteredActivityRows.length === 0 ? (
              <Text style={styles.detailEmptyText}>No activity yet.</Text>
            ) : (
              filteredActivityRows.map((row) => {
                const action =
                  row.type === "b"
                    ? "Buy"
                    : row.type === "s"
                      ? "Sell"
                      : row.type === "d"
                        ? "Add"
                        : row.type === "w"
                          ? "Remove"
                          : "Trade";
                const priceLabel =
                  row.price && Number.isFinite(row.price)
                    ? `$${row.price.toFixed(6)}`
                    : undefined;
                return (
                  <View key={row.signature} style={styles.detailRowItem}>
                    <View style={styles.detailRowMain}>
                      <Text
                        style={[
                          styles.detailRowTitle,
                          action === "Buy"
                            ? styles.metricPositive
                            : action === "Sell"
                              ? styles.metricNegative
                              : null,
                        ]}
                      >
                        {action}
                      </Text>
                      <Text style={styles.detailRowSub}>
                        {formatAddress(row.maker)} · {formatTimeAgo(row.ts)}
                        {priceLabel ? ` · ${priceLabel}` : ""}
                      </Text>
                    </View>
                    <View style={styles.detailRowMeta}>
                      <Text style={styles.detailRowValue}>
                        {formatSol(row.amount_quote)} SOL
                      </Text>
                      <Text style={styles.detailRowSub}>{row.index}</Text>
                    </View>
                  </View>
                );
              })
            )
          ) : activeDetailSection === "traders" ? (
            isTradersLoading ? (
              <Text style={styles.detailEmptyText}>Loading traders...</Text>
            ) : tradersError ? (
              <Text style={styles.detailEmptyText}>{tradersError}</Text>
            ) : traderRows.length === 0 ? (
              <Text style={styles.detailEmptyText}>No traders yet.</Text>
            ) : (
              traderRows.map((row) => (
                <View key={row.trader} style={styles.detailRowItem}>
                  <View style={styles.detailRowMain}>
                    <Text style={styles.detailRowTitle}>{formatAddress(row.trader)}</Text>
                    <Text style={styles.detailRowSub}>
                      Bought {formatCompactUsd(row.bought_usd)} · Sold {formatCompactUsd(row.sold_usd)}
                    </Text>
                  </View>
                  <View style={styles.detailRowMeta}>
                    <Text
                      style={[
                        styles.detailRowValue,
                        row.total_pnl_quote >= 0 ? styles.metricPositive : styles.metricNegative,
                      ]}
                    >
                      {formatCompactUsd(row.total_pnl_quote)}
                    </Text>
                    <Text style={styles.detailRowSub}>
                      {formatPercent(row.total_pnl_change_proportion * 100)}
                    </Text>
                  </View>
                </View>
              ))
            )
          ) : activeDetailSection === "holders" ? (
            isHoldersLoading ? (
              <Text style={styles.detailEmptyText}>Loading holders...</Text>
            ) : holdersError ? (
              <Text style={styles.detailEmptyText}>{holdersError}</Text>
            ) : sortedHolders.length === 0 ? (
              <Text style={styles.detailEmptyText}>No holders yet.</Text>
            ) : (
              sortedHolders.map((row) => {
                const percent =
                  totalSupply && totalSupply > 0 ? (row.balance / totalSupply) * 100 : undefined;
                return (
                  <View key={row.owner} style={styles.detailRowItem}>
                    <View style={styles.detailRowMain}>
                      <Text style={styles.detailRowTitle}>{formatAddress(row.owner)}</Text>
                      <Text style={styles.detailRowSub}>
                        {percent !== undefined ? `${percent.toFixed(2)}%` : "—"}
                      </Text>
                    </View>
                    <View style={styles.detailRowMeta}>
                      <Text style={styles.detailRowValue}>
                        {formatCompactNumber(row.balance)}
                      </Text>
                      <Text style={styles.detailRowSub}>
                        {row.labels?.length ? row.labels.join(", ") : "Balance"}
                      </Text>
                    </View>
                  </View>
                );
              })
            )
          ) : (
            <Text style={styles.detailEmptyText}>Dev activity insights are coming soon.</Text>
          )}
        </View>

        <View style={styles.tradePanel}>
          <View style={styles.tradeHeader}>
            <Text style={styles.tradeTitle}>Trade</Text>
            <View style={styles.orderTypeRow}>
              {(["instant", "market"] as const).map((type) => {
                const isActive = orderType === type;
                return (
                  <Pressable
                    key={type}
                    style={[styles.orderTypePill, isActive && styles.orderTypePillActive]}
                    onPress={() => setOrderType(type)}
                  >
                    <Text style={[styles.orderTypeText, isActive && styles.orderTypeTextActive]}>
                      {type === "instant" ? "Instant" : "Market"}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.tradeInputRow}>
            <Text style={styles.tradeLabel}>Amount</Text>
            <TextInput
              value={tradeAmount}
              onChangeText={setTradeAmount}
              keyboardType="decimal-pad"
              placeholder="0.0"
              placeholderTextColor={qsColors.textSubtle}
              style={styles.tradeInput}
            />
          </View>
          <View style={styles.tradePresetRow}>
            {amountPresets.map((preset) => (
              <Pressable
                key={preset}
                style={styles.tradePresetPill}
                onPress={() => setTradeAmount(String(preset))}
              >
                <Text style={styles.tradePresetText}>{preset} SOL</Text>
              </Pressable>
            ))}
          </View>

          {orderType === "market" ? (
            <View style={styles.tradeInputRow}>
              <Text style={styles.tradeLabel}>Target price (optional)</Text>
              <TextInput
                value={targetPrice}
                onChangeText={setTargetPrice}
                keyboardType="decimal-pad"
                placeholder="0.0"
                placeholderTextColor={qsColors.textSubtle}
                style={styles.tradeInput}
              />
              {livePriceUsd ? (
                <View style={styles.tradePresetRow}>
                  {pricePresetMultipliers.map((multiplier) => (
                    <Pressable
                      key={multiplier}
                      style={styles.tradePresetPill}
                      onPress={() =>
                        setTargetPrice((livePriceUsd * multiplier).toFixed(6))
                      }
                    >
                      <Text style={styles.tradePresetText}>
                        +{Math.round((multiplier - 1) * 100)}%
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : (
                <Text style={styles.tradeHelperText}>
                  Live price unavailable for presets.
                </Text>
              )}
            </View>
          ) : null}

          {!hasValidAccessToken ? (
            <Pressable
              style={styles.authButton}
              onPress={() => {
                void ensureAuthenticated();
              }}
            >
              <Text style={styles.authButtonText}>Authenticate Session</Text>
            </Pressable>
          ) : null}

          {tradeQuote && orderType === "market" ? (
            <View style={styles.tradeQuoteCard}>
              <Text style={styles.tradeQuoteTitle}>
                Quote {tradeQuoteIsStale ? "expired" : `valid ~${tradeQuoteTtl}s`}
              </Text>
              <Text style={styles.tradeQuoteLine}>
                Est receive:{" "}
                {formatTokenAmount(
                  tradeQuote.summary.amountOutUi,
                  tradeQuote.outputTokenDecimals ?? params?.tokenDecimals ?? 6
                )}
              </Text>
              <Text style={styles.tradeQuoteLine}>
                Min receive:{" "}
                {formatTokenAmount(
                  tradeQuote.summary.minOutAmountUi,
                  tradeQuote.outputTokenDecimals ?? params?.tokenDecimals ?? 6
                )}
              </Text>
              <Text style={styles.tradeQuoteLine}>
                Price impact: {tradeQuote.summary.priceImpactPercent?.toFixed(2) ?? "n/a"}%
              </Text>
            </View>
          ) : null}

          {tradeError ? <Text style={styles.tradeError}>{tradeError}</Text> : null}

          <Pressable
            style={styles.tradePrimaryButton}
            onPress={() => {
              if (orderType === "instant") {
                void handleInstantTrade();
              } else if (tradeQuote) {
                void handleExecuteMarket();
              } else {
                void handleGetMarketQuote();
              }
            }}
            disabled={isTradeLoading || isTradeExecuting}
          >
            <Text style={styles.tradePrimaryText}>
              {orderType === "instant"
                ? isTradeExecuting
                  ? "Buying..."
                  : "Buy Instantly"
                : tradeQuote
                  ? isTradeExecuting
                    ? "Executing..."
                    : "Buy Market"
                  : isTradeLoading
                    ? "Getting Quote..."
                    : "Get Quote"}
            </Text>
          </Pressable>
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
          {__DEV__ && params.source ? (
            <Text style={styles.detailLine}>Opened from: {params.source}</Text>
          ) : null}
        </View>
      </ScrollView>

      <View style={styles.ctaSpacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: qsColors.bgCanvas,
  },
  scrollContent: {
    padding: qsSpacing.lg,
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
  chartControls: {
    alignItems: "flex-end",
    gap: qsSpacing.xs,
  },
  chartToggleRow: {
    flexDirection: "row",
    gap: qsSpacing.xs,
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
  sectionDivider: {
    height: 1,
    backgroundColor: qsColors.borderDefault,
    opacity: 0.6,
  },
  detailTabsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: qsSpacing.sm,
  },
  detailTab: {
    borderRadius: qsRadius.lg,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    backgroundColor: qsColors.bgCard,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  detailTabActive: {
    borderColor: qsColors.accent,
    backgroundColor: "rgba(78, 163, 255, 0.15)",
  },
  detailTabText: {
    color: qsColors.textSubtle,
    fontSize: 11,
    fontWeight: "600",
  },
  detailTabTextActive: {
    color: qsColors.textPrimary,
  },
  detailPanel: {
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    borderRadius: qsRadius.md,
    backgroundColor: qsColors.bgCardSoft,
    padding: qsSpacing.sm,
    gap: qsSpacing.sm,
  },
  detailPanelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: qsSpacing.sm,
  },
  filterRow: {
    flexDirection: "row",
    gap: qsSpacing.xs,
    flex: 1,
    paddingRight: qsSpacing.sm,
  },
  filterPill: {
    borderRadius: qsRadius.lg,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    backgroundColor: qsColors.bgCard,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  filterPillActive: {
    borderColor: qsColors.accent,
    backgroundColor: "rgba(78, 163, 255, 0.15)",
  },
  filterText: {
    color: qsColors.textSubtle,
    fontSize: 11,
    fontWeight: "600",
  },
  filterTextActive: {
    color: qsColors.textPrimary,
  },
  filterButton: {
    borderRadius: qsRadius.sm,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: qsColors.bgCard,
  },
  filterButtonText: {
    color: qsColors.textSecondary,
    fontSize: 11,
    fontWeight: "600",
  },
  detailEmptyText: {
    color: qsColors.textSubtle,
    fontSize: 11,
  },
  detailRowItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: qsSpacing.sm,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: qsColors.borderDefault,
  },
  detailRowMain: {
    flex: 1,
    gap: 2,
  },
  detailRowTitle: {
    color: qsColors.textPrimary,
    fontSize: 12,
    fontWeight: "700",
  },
  detailRowSub: {
    color: qsColors.textSubtle,
    fontSize: 10,
  },
  detailRowMeta: {
    alignItems: "flex-end",
    gap: 2,
  },
  detailRowValue: {
    color: qsColors.textSecondary,
    fontSize: 11,
    fontWeight: "600",
  },
  tradePanel: {
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    borderRadius: qsRadius.md,
    backgroundColor: qsColors.bgCardSoft,
    padding: qsSpacing.md,
    gap: qsSpacing.sm,
  },
  tradeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: qsSpacing.sm,
  },
  tradeTitle: {
    color: qsColors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
  orderTypeRow: {
    flexDirection: "row",
    gap: qsSpacing.xs,
  },
  orderTypePill: {
    borderRadius: qsRadius.lg,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    backgroundColor: qsColors.bgCard,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  orderTypePillActive: {
    borderColor: qsColors.accent,
    backgroundColor: "rgba(78, 163, 255, 0.15)",
  },
  orderTypeText: {
    color: qsColors.textSubtle,
    fontSize: 11,
    fontWeight: "600",
  },
  orderTypeTextActive: {
    color: qsColors.textPrimary,
  },
  tradeInputRow: {
    gap: 6,
  },
  tradeLabel: {
    color: qsColors.textSubtle,
    fontSize: 12,
  },
  tradeInput: {
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    borderRadius: qsRadius.md,
    backgroundColor: qsColors.bgCard,
    color: qsColors.textPrimary,
    fontSize: 16,
    paddingHorizontal: qsSpacing.md,
    paddingVertical: 10,
  },
  tradePresetRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: qsSpacing.xs,
  },
  tradePresetPill: {
    borderRadius: qsRadius.lg,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    backgroundColor: qsColors.bgCard,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tradePresetText: {
    color: qsColors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  tradeHelperText: {
    color: qsColors.textSubtle,
    fontSize: 11,
  },
  tradeQuoteCard: {
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    borderRadius: qsRadius.md,
    backgroundColor: qsColors.bgCard,
    padding: qsSpacing.sm,
    gap: 4,
  },
  tradeQuoteTitle: {
    color: qsColors.textPrimary,
    fontSize: 12,
    fontWeight: "700",
  },
  tradeQuoteLine: {
    color: qsColors.textSecondary,
    fontSize: 12,
  },
  tradeError: {
    color: qsColors.danger,
    fontSize: 12,
  },
  tradePrimaryButton: {
    borderRadius: qsRadius.md,
    backgroundColor: qsColors.accent,
    paddingVertical: 12,
    alignItems: "center",
  },
  tradePrimaryText: {
    color: "#061326",
    fontSize: 14,
    fontWeight: "700",
  },
  authButton: {
    borderRadius: qsRadius.md,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: qsColors.bgCard,
  },
  authButtonText: {
    color: qsColors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
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
  ctaSpacer: {
    height: qsSpacing.lg,
  },
});
