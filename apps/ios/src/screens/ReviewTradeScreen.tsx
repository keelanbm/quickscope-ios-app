import { useEffect, useState } from "react";

import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Clipboard from "expo-clipboard";
import { Alert, Linking, Pressable, StyleSheet, Text, View } from "react-native";

import { useAuthSession } from "@/src/features/auth/AuthSessionProvider";
import {
  getQuoteTtlSecondsRemaining,
  isQuoteStale,
} from "@/src/features/trade/quoteUtils";
import { requestSwapExecution } from "@/src/features/trade/tradeExecutionService";
import type { RpcClient } from "@/src/lib/api/rpcClient";
import type { ReviewTradeRouteParams, RootStack } from "@/src/navigation/types";
import { qsColors, qsRadius, qsSpacing } from "@/src/theme/tokens";

type ReviewTradeScreenProps = {
  rpcClient: RpcClient;
  executionEnabled: boolean;
  params: ReviewTradeRouteParams;
};

function formatAmount(value: number | undefined, decimals = 6): string {
  if (value === undefined || !Number.isFinite(value)) {
    return "n/a";
  }

  const clamped = Math.max(0, Math.min(decimals, 8));
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: clamped,
  });
}

function formatPercent(value: number | undefined): string {
  if (value === undefined || !Number.isFinite(value)) {
    return "n/a";
  }

  return `${value.toFixed(2)}%`;
}

function formatTime(value: number): string {
  if (!Number.isFinite(value) || value <= 0) {
    return "n/a";
  }

  return new Date(value).toLocaleTimeString();
}

export function ReviewTradeScreen({ rpcClient, executionEnabled, params }: ReviewTradeScreenProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStack>>();
  const { walletAddress, hasValidAccessToken, authenticateFromWallet, status } = useAuthSession();
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionError, setExecutionError] = useState<string | undefined>();
  const [executionStateText, setExecutionStateText] = useState<string | undefined>();
  const [executionSignature, setExecutionSignature] = useState<string | undefined>();
  const [executionTime, setExecutionTime] = useState<string | undefined>();
  const quoteIsStale = isQuoteStale(params.quoteRequestedAtMs, nowMs);
  const quoteTtlSeconds = getQuoteTtlSecondsRemaining(params.quoteRequestedAtMs, nowMs);
  const walletMismatch = walletAddress !== undefined && walletAddress !== params.walletAddress;

  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const executionBlockedReason = !executionEnabled
    ? "Execution is disabled in this build."
    : quoteIsStale
      ? "Quote expired. Refresh quote before execution."
      : !hasValidAccessToken
        ? "Session is not authenticated."
        : walletMismatch
          ? "Connected wallet does not match quote wallet."
          : undefined;

  const handleExecute = async () => {
    if (executionBlockedReason || isExecuting) {
      return;
    }

    const shouldExecute = await new Promise<boolean>((resolve) => {
      Alert.alert(
        "Execute trade?",
        "This will submit tx/swap with the reviewed quote context.",
        [
          { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
          { text: "Execute", style: "destructive", onPress: () => resolve(true) },
        ]
      );
    });

    if (!shouldExecute) {
      return;
    }

    setExecutionError(undefined);
    setExecutionStateText(undefined);
    setExecutionSignature(undefined);
    setExecutionTime(undefined);
    setIsExecuting(true);

    try {
      const result = await requestSwapExecution(rpcClient, {
        walletAddress: params.walletAddress,
        inputMint: params.inputMint,
        outputMint: params.outputMint,
        amountAtomic: params.amountAtomic,
        slippageBps: params.slippageBps,
      });

      const statusText = result.status ? result.status.toUpperCase() : "SUBMITTED";
      const signatureSuffix = result.signature ? ` • ${result.signature.slice(0, 12)}...` : "";
      setExecutionStateText(`${statusText}${signatureSuffix}`);
      setExecutionSignature(result.signature);
      setExecutionTime(result.executionTime);
    } catch (error) {
      setExecutionError(String(error));
    } finally {
      setIsExecuting(false);
    }
  };

  const handleCopySignature = async () => {
    if (!executionSignature) {
      return;
    }

    await Clipboard.setStringAsync(executionSignature);
    Alert.alert("Signature copied", executionSignature);
  };

  const handleOpenExplorer = async () => {
    if (!executionSignature) {
      return;
    }

    const url = `https://solscan.io/tx/${executionSignature}`;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        Alert.alert("Invalid link", "Unable to open explorer link.");
        return;
      }

      await Linking.openURL(url);
    } catch (error) {
      Alert.alert("Open failed", String(error));
    }
  };

  return (
    <View style={styles.page}>
      <View style={styles.headerRow}>
        <View
          style={[
            styles.modeBadge,
            executionEnabled ? styles.modeBadgeEnabled : styles.modeBadgeDisabled,
          ]}
        >
          <Text
            style={[
              styles.modeBadgeText,
              executionEnabled ? styles.modeBadgeTextEnabled : styles.modeBadgeTextDisabled,
            ]}
          >
            {executionEnabled ? "DEV: Execution ON" : "DEV: Execution OFF"}
          </Text>
        </View>
      </View>
      <Text style={styles.title}>Review Trade</Text>
      <Text style={styles.subtitle}>
        Final execute wiring is next. This step confirms quote context before placing any trade.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Route</Text>
        <Text style={styles.line}>From: {params.inputMint}</Text>
        <Text style={styles.line}>To: {params.outputMint}</Text>
        <Text style={styles.line}>Wallet: {params.walletAddress}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Quote</Text>
        <Text style={[styles.meta, quoteIsStale ? styles.metaDanger : null]}>
          {quoteIsStale ? "Quote expired" : `Quote valid for ~${quoteTtlSeconds}s`}
        </Text>
        <Text style={styles.line}>
          You pay: {formatAmount(params.amountUi, params.inputTokenDecimals)}
        </Text>
        <Text style={styles.line}>
          Est. receive:{" "}
          {params.estimatedOutAmountUi !== undefined
            ? formatAmount(params.estimatedOutAmountUi, params.outputTokenDecimals ?? 6)
            : "n/a"}
        </Text>
        <Text style={styles.line}>
          Min receive:{" "}
          {params.minOutAmountUi !== undefined
            ? formatAmount(params.minOutAmountUi, params.outputTokenDecimals ?? 6)
            : "n/a"}
        </Text>
        <Text style={styles.line}>Price impact: {formatPercent(params.priceImpactPercent)}</Text>
        <Text style={styles.line}>Slippage: {params.slippageBps} bps</Text>
        <Text style={styles.line}>Fee: {params.feeAmountSol ?? "n/a"} SOL</Text>
        <Text style={styles.line}>Route hops: {params.routeHopCount ?? "n/a"}</Text>
        <Text style={styles.meta}>Quoted at {formatTime(params.quoteRequestedAtMs)}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Execution status</Text>
        <Text style={styles.line}>{executionBlockedReason ?? "Ready for execution."}</Text>
        {executionStateText ? <Text style={styles.successText}>Result: {executionStateText}</Text> : null}
        {executionTime ? <Text style={styles.meta}>Executed at {executionTime}</Text> : null}
        {executionSignature ? (
          <View style={styles.signatureRow}>
            <Pressable style={styles.signatureButton} onPress={handleCopySignature}>
              <Text style={styles.signatureButtonText}>Copy signature</Text>
            </Pressable>
            <Pressable style={styles.signatureButton} onPress={handleOpenExplorer}>
              <Text style={styles.signatureButtonText}>View on Solscan</Text>
            </Pressable>
          </View>
        ) : null}
        {executionError ? <Text style={styles.errorText}>{executionError}</Text> : null}
        {!hasValidAccessToken ? (
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
        ) : null}
        {walletMismatch ? (
          <Text style={styles.errorText}>Quote wallet and connected wallet do not match.</Text>
        ) : null}
      </View>

      <View style={styles.actions}>
        <Pressable
          style={[
            styles.executeButton,
            executionBlockedReason ? styles.executeButtonDisabled : null,
          ]}
          onPress={() => {
            void handleExecute();
          }}
          disabled={Boolean(executionBlockedReason) || isExecuting}
        >
          <Text
            style={[
              styles.executeButtonText,
              executionBlockedReason ? styles.executeButtonTextDisabled : null,
            ]}
          >
            {isExecuting ? "Executing..." : "Execute Trade"}
          </Text>
        </Pressable>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Back to Trade</Text>
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
  headerRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  modeBadge: {
    borderRadius: qsRadius.lg,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  modeBadgeEnabled: {
    borderColor: qsColors.success,
    backgroundColor: "#103029",
  },
  modeBadgeDisabled: {
    borderColor: qsColors.borderDefault,
    backgroundColor: qsColors.bgCard,
  },
  modeBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  modeBadgeTextEnabled: {
    color: qsColors.success,
  },
  modeBadgeTextDisabled: {
    color: qsColors.textSubtle,
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
  card: {
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    borderRadius: qsRadius.md,
    backgroundColor: qsColors.bgCardSoft,
    padding: qsSpacing.md,
    gap: 6,
  },
  cardTitle: {
    color: qsColors.textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  line: {
    color: qsColors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  meta: {
    color: qsColors.textSubtle,
    fontSize: 11,
    marginTop: 2,
  },
  metaDanger: {
    color: qsColors.danger,
  },
  successText: {
    color: qsColors.success,
    fontSize: 12,
    lineHeight: 18,
  },
  errorText: {
    color: qsColors.danger,
    fontSize: 12,
    lineHeight: 18,
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
  signatureRow: {
    flexDirection: "row",
    gap: qsSpacing.sm,
    flexWrap: "wrap",
  },
  signatureButton: {
    borderRadius: qsRadius.md,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    backgroundColor: qsColors.bgCard,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  signatureButtonText: {
    color: qsColors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  actions: {
    marginTop: "auto",
    gap: qsSpacing.sm,
  },
  executeButton: {
    borderRadius: qsRadius.md,
    backgroundColor: qsColors.accent,
    paddingVertical: 12,
    alignItems: "center",
  },
  executeButtonDisabled: {
    backgroundColor: qsColors.borderDefault,
  },
  executeButtonText: {
    color: "#061326",
    fontSize: 14,
    fontWeight: "700",
  },
  executeButtonTextDisabled: {
    color: qsColors.textSubtle,
  },
  backButton: {
    borderRadius: qsRadius.md,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    backgroundColor: qsColors.bgCard,
    paddingVertical: 10,
    alignItems: "center",
  },
  backButtonText: {
    color: qsColors.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },
});
