import { useEffect, useMemo, useState } from "react";

import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { useAuthSession } from "@/src/features/auth/AuthSessionProvider";
import {
  getQuoteTtlSecondsRemaining,
  isQuoteStale,
} from "@/src/features/trade/quoteUtils";
import {
  requestSwapQuote,
  type QuoteResult,
} from "@/src/features/trade/tradeQuoteService";
import type { RpcClient } from "@/src/lib/api/rpcClient";
import { toast } from "@/src/lib/toast";
import type { RootStack, TradeEntryRouteParams } from "@/src/navigation/types";
import { qsColors, qsRadius, qsSpacing } from "@/src/theme/tokens";
import { AlertCircle, Clock, Zap } from "@/src/ui/icons";

const SOL_MINT = "So11111111111111111111111111111111111111112";

type TradeEntryScreenProps = {
  rpcClient: RpcClient;
  params?: TradeEntryRouteParams;
};

function formatAtomic(value: number | undefined): string {
  if (value === undefined) {
    return "n/a";
  }

  return value.toLocaleString();
}

function formatTokenAmount(value: number | undefined, decimals = 6): string {
  if (value === undefined || !Number.isFinite(value)) {
    return "n/a";
  }

  const clampedDecimals = Math.max(0, Math.min(decimals, 8));
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: clampedDecimals,
  });
}

function formatPercent(value: number | undefined): string {
  if (value === undefined) {
    return "n/a";
  }

  return `${value.toFixed(2)}%`;
}

function parseAmount(value: string): number {
  return Number.parseFloat(value.trim());
}

export function TradeEntryScreen({ rpcClient, params }: TradeEntryScreenProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStack>>();
  const { walletAddress, hasValidAccessToken, authenticateFromWallet, status } = useAuthSession();
  const [amount, setAmount] = useState(params?.amount ?? "");
  const [quote, setQuote] = useState<QuoteResult | undefined>();
  const [quoteError, setQuoteError] = useState<string | undefined>();
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());

  const inputMint = params?.inputMint ?? SOL_MINT;
  const outputMint = params?.outputMint ?? params?.tokenAddress;
  const inputMintDecimals = params?.inputMintDecimals;
  const outputMintDecimals = params?.outputMintDecimals;

  const summaryLines = useMemo(() => {
    const lines: string[] = [];
    if (outputMint) {
      lines.push(`Token: ${outputMint}`);
    }
    lines.push(`Input mint: ${inputMint}`);
    if (outputMint && outputMint !== params?.tokenAddress) {
      lines.push(`Output mint: ${outputMint}`);
    }
    if (!lines.length) {
      lines.push("No token selected yet.");
    }
    return lines;
  }, [inputMint, outputMint, params?.tokenAddress]);

  useEffect(() => {
    if (!quote) {
      return;
    }

    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, [quote]);

  const quoteIsStale = quote ? isQuoteStale(quote.requestedAtMs, nowMs) : false;
  const quoteTtlSeconds = quote ? getQuoteTtlSecondsRemaining(quote.requestedAtMs, nowMs) : 0;

  const handleGetQuote = async () => {
    if (!walletAddress) {
      toast.warn("Wallet required", "Connect your wallet to request a quote.");
      return;
    }

    if (!outputMint) {
      toast.warn("Token required", "Select a token before requesting a quote.");
      return;
    }

    if (!hasValidAccessToken) {
      setQuoteError("Authenticate session before requesting a quote.");
      return;
    }

    const amountUi = parseAmount(amount);
    if (!Number.isFinite(amountUi) || amountUi <= 0) {
      toast.warn("Invalid amount", "Enter an amount greater than 0.");
      return;
    }

    setIsLoadingQuote(true);
    setQuote(undefined);
    setQuoteError(undefined);

    try {
      const nextQuote = await requestSwapQuote(rpcClient, {
        walletAddress,
        inputMint,
        outputMint,
        amountUi,
        inputTokenDecimals: inputMintDecimals,
        outputTokenDecimals: outputMintDecimals,
      });
      setQuote(nextQuote);
    } catch (error) {
      const message = String(error);
      if (message.toLowerCase().includes("authentication required")) {
        setQuoteError("Session expired. Authenticate again to request a quote.");
      } else {
        setQuoteError(message);
      }
    } finally {
      setIsLoadingQuote(false);
    }
  };

  const handleReviewTrade = () => {
    if (!quote || !walletAddress || !outputMint) {
      return;
    }
    if (quoteIsStale) {
      toast.warn("Quote expired", "Refresh quote before continuing to review.");
      return;
    }

    navigation.navigate("ReviewTrade", {
      source: "trade-entry",
      walletAddress,
      inputMint: quote.inputMint,
      outputMint,
      amountUi: quote.amountUi,
      amountAtomic: quote.amountAtomic,
      inputTokenDecimals: quote.inputTokenDecimals,
      outputTokenDecimals: quote.outputTokenDecimals,
      slippageBps: quote.slippageBps,
      estimatedOutAmountUi: quote.summary.amountOutUi,
      minOutAmountUi: quote.summary.minOutAmountUi,
      estimatedOutAmountAtomic: quote.summary.outAmountAtomic,
      minOutAmountAtomic: quote.summary.minOutAmountAtomic,
      priceImpactPercent: quote.summary.priceImpactPercent,
      feeAmountSol: quote.summary.feeAmountSol,
      feeRateBps: quote.summary.feeRateBps,
      routeHopCount: quote.summary.routeHopCount,
      quoteRequestedAtMs: quote.requestedAtMs,
    });
  };

  return (
    <View style={styles.page}>
      <Text style={styles.title}>Trade</Text>

      <View style={styles.contextCard}>
        {summaryLines.map((line) => (
          <Text key={line} style={styles.contextText}>
            {line}
          </Text>
        ))}
      </View>

      <View style={styles.amountBlock}>
        <Text style={styles.label}>Amount</Text>
        <TextInput
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholder="0.0"
          placeholderTextColor={qsColors.textTertiary}
          style={styles.amountInput}
        />
      </View>

      {!hasValidAccessToken ? (
        <View style={styles.authCard}>
          <Text style={styles.authTitle}>Session required</Text>
          <Text style={styles.contextText}>Authenticate to request protected tx quotes.</Text>
          <Pressable
            style={styles.authButton}
            onPress={() => {
              void authenticateFromWallet();
            }}
            disabled={status === "authenticating"}
          >
            <Text style={styles.authButtonText}>
              {status === "authenticating" ? "Authenticating..." : "Authenticate Session"}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {quote ? (
        <View style={styles.quoteCard}>
          <Text style={styles.quoteTitle}>Quote ready</Text>
          <View style={styles.ttlRow}>
            <Clock size={14} color={quoteIsStale ? qsColors.danger : qsColors.textTertiary} />
            <Text style={[styles.quoteMeta, quoteIsStale ? styles.quoteMetaDanger : null]}>
              {quoteIsStale ? "Quote expired" : `Quote valid for ~${quoteTtlSeconds}s`}
            </Text>
          </View>
          <Text style={styles.contextText}>
            You pay: {formatTokenAmount(quote.amountUi, quote.inputTokenDecimals)} (
            {formatAtomic(quote.summary.amountInAtomic)} atomic)
          </Text>
          <Text style={styles.contextText}>
            Estimated receive:{" "}
            {quote.summary.amountOutUi !== undefined
              ? formatTokenAmount(quote.summary.amountOutUi, quote.outputTokenDecimals ?? 6)
              : formatAtomic(quote.summary.outAmountAtomic)}
          </Text>
          <Text style={styles.contextText}>
            Min receive:{" "}
            {quote.summary.minOutAmountUi !== undefined
              ? formatTokenAmount(quote.summary.minOutAmountUi, quote.outputTokenDecimals ?? 6)
              : formatAtomic(quote.summary.minOutAmountAtomic)}
          </Text>
          <Text style={styles.contextText}>
            Price impact: {formatPercent(quote.summary.priceImpactPercent)}
          </Text>
          <Text style={styles.contextText}>Fee: {quote.summary.feeAmountSol ?? "n/a"} SOL</Text>
          <Text style={styles.contextText}>Route hops: {quote.summary.routeHopCount ?? "n/a"}</Text>
          <Text style={styles.contextText}>Slippage: {quote.slippageBps} bps</Text>
          {quote.summary.feeRateBps !== undefined ? (
            <Text style={styles.contextText}>Fee rate: {quote.summary.feeRateBps} bps</Text>
          ) : null}
          {quoteIsStale ? (
            <Text style={styles.staleWarning}>Refresh quote before reviewing trade.</Text>
          ) : null}
        </View>
      ) : null}

      {quoteError ? (
        <View style={styles.errorCard}>
          <View style={styles.errorTitleRow}>
            <AlertCircle size={14} color={qsColors.danger} />
            <Text style={styles.errorTitle}>Quote failed</Text>
          </View>
          <Text style={styles.errorText}>{quoteError}</Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        <Pressable style={styles.primaryButton} onPress={handleGetQuote} disabled={isLoadingQuote}>
          <View style={styles.buttonRow}>
            <Zap size={16} color={qsColors.layer0} />
            <Text style={styles.primaryButtonText}>
              {isLoadingQuote ? "Getting Quote..." : "Get Quote"}
            </Text>
          </View>
        </Pressable>
        {quote ? (
          <Pressable style={styles.reviewButton} onPress={handleReviewTrade}>
            <View style={styles.buttonRow}>
              <Zap size={16} color={qsColors.accent} />
              <Text style={styles.reviewButtonText}>Review Trade</Text>
            </View>
          </Pressable>
        ) : null}
        <Pressable
          style={styles.secondaryButton}
          onPress={() => navigation.navigate("MainTabs", { screen: "Trade" })}
        >
          <Text style={styles.secondaryButtonText}>Open Search</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: qsColors.layer0,
    padding: qsSpacing.xl,
    gap: qsSpacing.md,
  },
  title: {
    color: qsColors.textPrimary,
    fontSize: 28,
    fontWeight: "700",
  },
  contextCard: {
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    borderRadius: qsRadius.md,
    backgroundColor: qsColors.layer2,
    padding: qsSpacing.md,
    gap: 6,
  },
  contextText: {
    color: qsColors.textSecondary,
    fontSize: 12,
  },
  amountBlock: {
    gap: 6,
  },
  label: {
    color: qsColors.textTertiary,
    fontSize: 12,
  },
  amountInput: {
    borderWidth: 1,
    borderColor: qsColors.layer3,
    borderRadius: qsRadius.md,
    backgroundColor: qsColors.layer2,
    color: qsColors.textPrimary,
    fontSize: 16,
    paddingHorizontal: qsSpacing.md,
    paddingVertical: 10,
  },
  quoteCard: {
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    borderRadius: qsRadius.md,
    backgroundColor: qsColors.layer1,
    padding: qsSpacing.md,
    gap: 6,
  },
  authCard: {
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    borderRadius: qsRadius.md,
    backgroundColor: qsColors.layer2,
    padding: qsSpacing.md,
    gap: 8,
  },
  authTitle: {
    color: qsColors.textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  authButton: {
    borderRadius: qsRadius.md,
    borderWidth: 1,
    borderColor: qsColors.accent,
    backgroundColor: qsColors.layer1,
    paddingVertical: 8,
    alignItems: "center",
  },
  authButtonText: {
    color: qsColors.accent,
    fontSize: 13,
    fontWeight: "600",
  },
  quoteTitle: {
    color: qsColors.textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  ttlRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  quoteMeta: {
    color: qsColors.textTertiary,
    fontSize: 11,
  },
  quoteMetaDanger: {
    color: qsColors.danger,
  },
  staleWarning: {
    color: qsColors.danger,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
  errorCard: {
    borderWidth: 1,
    borderColor: qsColors.danger,
    borderRadius: qsRadius.md,
    backgroundColor: qsColors.dangerDark,
    padding: qsSpacing.md,
    gap: 4,
  },
  errorTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  errorTitle: {
    color: qsColors.danger,
    fontSize: 14,
    fontWeight: "700",
  },
  errorText: {
    color: qsColors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  actions: {
    marginTop: "auto",
    gap: qsSpacing.sm,
  },
  buttonRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  primaryButton: {
    borderRadius: qsRadius.md,
    backgroundColor: qsColors.accent,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryButtonText: {
    color: qsColors.layer0,
    fontSize: 14,
    fontWeight: "700",
  },
  secondaryButton: {
    borderRadius: qsRadius.md,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    backgroundColor: qsColors.layer1,
    paddingVertical: 10,
    alignItems: "center",
  },
  reviewButton: {
    borderRadius: qsRadius.md,
    borderWidth: 1,
    borderColor: qsColors.accent,
    backgroundColor: qsColors.layer2,
    paddingVertical: 10,
    alignItems: "center",
  },
  reviewButtonText: {
    color: qsColors.accent,
    fontSize: 13,
    fontWeight: "700",
  },
  secondaryButtonText: {
    color: qsColors.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
});
