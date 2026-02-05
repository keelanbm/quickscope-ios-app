import { useMemo, useState } from "react";

import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { useAuthSession } from "@/src/features/auth/AuthSessionProvider";
import {
  requestSwapQuote,
  type QuoteResult,
} from "@/src/features/trade/tradeQuoteService";
import type { RpcClient } from "@/src/lib/api/rpcClient";
import type { RootStack, TradeEntryRouteParams } from "@/src/navigation/types";
import { qsColors, qsRadius, qsSpacing } from "@/src/theme/tokens";

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

  const inputMint = params?.inputMint ?? SOL_MINT;
  const outputMint = params?.outputMint ?? params?.tokenAddress;

  const summaryLines = useMemo(() => {
    const lines: string[] = [];
    if (outputMint) {
      lines.push(`Token: ${outputMint}`);
    }
    lines.push(`Input mint: ${inputMint}`);
    if (!lines.length) {
      lines.push("No token selected yet.");
    }
    return lines;
  }, [inputMint, outputMint]);

  const quotePreview = useMemo(() => {
    if (!quote) {
      return undefined;
    }

    const raw = JSON.stringify(quote.raw, null, 2);
    return raw.length > 360 ? `${raw.slice(0, 360)}...` : raw;
  }, [quote]);

  const handleGetQuote = async () => {
    if (!walletAddress) {
      Alert.alert("Wallet required", "Connect your wallet to request a quote.");
      return;
    }

    if (!outputMint) {
      Alert.alert("Token required", "Select a token before requesting a quote.");
      return;
    }

    if (!hasValidAccessToken) {
      setQuoteError("Authenticate session before requesting a quote.");
      return;
    }

    const amountUi = parseAmount(amount);
    if (!Number.isFinite(amountUi) || amountUi <= 0) {
      Alert.alert("Invalid amount", "Enter an amount greater than 0.");
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

  return (
    <View style={styles.page}>
      <Text style={styles.title}>Trade</Text>
      <Text style={styles.subtitle}>
        Trade execution flow is being finalized. Token context and amount capture are ready.
      </Text>

      <View style={styles.contextCard}>
        {summaryLines.map((line) => (
          <Text key={line} style={styles.contextText}>
            {line}
          </Text>
        ))}
      </View>

      <View style={styles.amountBlock}>
        <Text style={styles.label}>Amount (SOL)</Text>
        <TextInput
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholder="0.0"
          placeholderTextColor={qsColors.textSubtle}
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
          <Text style={styles.contextText}>Out amount (atomic): {formatAtomic(quote.summary.outAmountAtomic)}</Text>
          <Text style={styles.contextText}>
            Min out (atomic): {formatAtomic(quote.summary.minOutAmountAtomic)}
          </Text>
          <Text style={styles.contextText}>
            Price impact: {formatPercent(quote.summary.priceImpactPercent)}
          </Text>
          <Text style={styles.contextText}>Route hops: {quote.summary.routeHopCount ?? "n/a"}</Text>
          <Text style={styles.contextText}>Slippage: {quote.slippageBps} bps</Text>
          {quotePreview ? <Text style={styles.rawQuoteText}>{quotePreview}</Text> : null}
        </View>
      ) : null}

      {quoteError ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Quote failed</Text>
          <Text style={styles.errorText}>{quoteError}</Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        <Pressable style={styles.primaryButton} onPress={handleGetQuote} disabled={isLoadingQuote}>
          <Text style={styles.primaryButtonText}>
            {isLoadingQuote ? "Getting Quote..." : "Get Quote"}
          </Text>
        </Pressable>
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
    backgroundColor: qsColors.bgCanvas,
    padding: qsSpacing.xl,
    gap: qsSpacing.md,
  },
  title: {
    color: qsColors.textPrimary,
    fontSize: 28,
    fontWeight: "700",
  },
  subtitle: {
    color: qsColors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  contextCard: {
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    borderRadius: qsRadius.md,
    backgroundColor: qsColors.bgCardSoft,
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
    color: qsColors.textSubtle,
    fontSize: 12,
  },
  amountInput: {
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    borderRadius: qsRadius.md,
    backgroundColor: qsColors.bgCard,
    color: qsColors.textPrimary,
    fontSize: 16,
    paddingHorizontal: qsSpacing.md,
    paddingVertical: 10,
  },
  quoteCard: {
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    borderRadius: qsRadius.md,
    backgroundColor: qsColors.bgCardSoft,
    padding: qsSpacing.md,
    gap: 6,
  },
  authCard: {
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    borderRadius: qsRadius.md,
    backgroundColor: qsColors.bgCardSoft,
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
    backgroundColor: qsColors.bgCard,
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
  rawQuoteText: {
    color: qsColors.textSubtle,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },
  errorCard: {
    borderWidth: 1,
    borderColor: qsColors.danger,
    borderRadius: qsRadius.md,
    backgroundColor: qsColors.bgCardSoft,
    padding: qsSpacing.md,
    gap: 4,
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
  primaryButton: {
    borderRadius: qsRadius.md,
    backgroundColor: qsColors.accent,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#061326",
    fontSize: 14,
    fontWeight: "700",
  },
  secondaryButton: {
    borderRadius: qsRadius.md,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    backgroundColor: qsColors.bgCard,
    paddingVertical: 10,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: qsColors.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
});
