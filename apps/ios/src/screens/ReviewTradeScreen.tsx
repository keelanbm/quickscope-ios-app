import { useEffect, useState } from "react";

import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Clipboard from "expo-clipboard";
import { Alert, Linking, Pressable, StyleSheet, Text, View } from "react-native";

import { useAuthSession } from "@/src/features/auth/AuthSessionProvider";
import { haptics } from "@/src/lib/haptics";
import { formatTokenAmount, formatTime } from "@/src/lib/format";
import {
  getQuoteTtlSecondsRemaining,
  isQuoteStale,
} from "@/src/features/trade/quoteUtils";
import { requestSwapExecution } from "@/src/features/trade/tradeExecutionService";
import type { RpcClient } from "@/src/lib/api/rpcClient";
import { toast } from "@/src/lib/toast";
import type { ReviewTradeRouteParams, RootStack } from "@/src/navigation/types";
import { qsColors, qsRadius, qsSpacing } from "@/src/theme/tokens";
import { AlertCircle, CircleCheck, Clock, Copy, ExternalLink, Zap } from "@/src/ui/icons";

type ReviewTradeScreenProps = {
  rpcClient: RpcClient;
  executionEnabled: boolean;
  params: ReviewTradeRouteParams;
};

function formatPercent(value: number | undefined): string {
  if (value === undefined || !Number.isFinite(value)) {
    return "n/a";
  }

  return `${value.toFixed(2)}%`;
}

export function ReviewTradeScreen({ rpcClient, executionEnabled, params }: ReviewTradeScreenProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStack>>();
  const { walletAddress, hasValidAccessToken, authenticateFromWallet, status } = useAuthSession();
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionError, setExecutionError] = useState<string | undefined>();
  const [executionTone, setExecutionTone] = useState<"success" | "error" | "info" | undefined>();
  const [executionSignature, setExecutionSignature] = useState<string | undefined>();
  const [executionCreationTime, setExecutionCreationTime] = useState<string | undefined>();
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
    setExecutionTone(undefined);
    setExecutionSignature(undefined);
    setExecutionCreationTime(undefined);
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

      setExecutionSignature(result.signature);
      setExecutionCreationTime(result.creationTime);
      setExecutionTime(result.executionTime);

      const normalizedStatus = result.status?.toLowerCase();
      const isFailure =
        Boolean(result.errorPreview) ||
        normalizedStatus === "failed" ||
        normalizedStatus === "error" ||
        normalizedStatus === "expired";
      const isSuccess =
        normalizedStatus === "confirmed" ||
        normalizedStatus === "finalized" ||
        normalizedStatus === "success";

      if (isFailure) {
        const body = result.errorPreview ?? "Swap execution failed.";
        setExecutionTone("error");
        toast.error("Trade failed", body);
      } else if (isSuccess) {
        setExecutionTone("success");
        toast.success("Trade success", "Trade executed successfully.");
      } else {
        setExecutionTone("info");
        toast.info("Trade submitted", "Trade submitted. Status will update when finalized.");
      }
    } catch (error) {
      const message = String(error);
      setExecutionError(message);
      setExecutionTone("error");
      toast.error("Trade failed", message);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleCopySignature = async () => {
    if (!executionSignature) {
      return;
    }

    await Clipboard.setStringAsync(executionSignature);
    haptics.success();
    toast.success("Signature copied", executionSignature);
  };

  const handleOpenExplorer = async () => {
    if (!executionSignature) {
      return;
    }

    const url = `https://solscan.io/tx/${executionSignature}`;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        toast.error("Invalid link", "Unable to open explorer link.");
        return;
      }

      await Linking.openURL(url);
    } catch (error) {
      toast.error("Open failed", String(error));
    }
  };

  return (
    <View style={styles.page}>
      {__DEV__ ? (
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
      ) : null}
      <Text style={styles.title}>Review Trade</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Route</Text>
        <Text style={styles.line}>From: {params.inputMint}</Text>
        <Text style={styles.line}>To: {params.outputMint}</Text>
        <Text style={styles.line}>Wallet: {params.walletAddress}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Quote</Text>
        <View style={styles.ttlRow}>
          <Clock size={14} color={quoteIsStale ? qsColors.danger : qsColors.textTertiary} />
          <Text style={[styles.meta, quoteIsStale ? styles.metaDanger : null]}>
            {quoteIsStale ? "Quote expired" : `Quote valid for ~${quoteTtlSeconds}s`}
          </Text>
        </View>
        <Text style={styles.line}>
          You pay: {formatTokenAmount(params.amountUi, params.inputTokenDecimals)}
        </Text>
        <Text style={styles.line}>
          Est. receive:{" "}
          {params.estimatedOutAmountUi !== undefined
            ? formatTokenAmount(params.estimatedOutAmountUi, params.outputTokenDecimals ?? 6)
            : "n/a"}
        </Text>
        <Text style={styles.line}>
          Min receive:{" "}
          {params.minOutAmountUi !== undefined
            ? formatTokenAmount(params.minOutAmountUi, params.outputTokenDecimals ?? 6)
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
        {executionBlockedReason ? (
          <View style={styles.statusRow}>
            <AlertCircle size={14} color={qsColors.warning} />
            <Text style={styles.line}>{executionBlockedReason}</Text>
          </View>
        ) : (
          <View style={styles.statusRow}>
            <CircleCheck size={14} color={qsColors.success} />
            <Text style={styles.line}>Ready for execution.</Text>
          </View>
        )}
        {executionCreationTime && executionTime ? (
          <Text
            style={[
              styles.meta,
              executionTone === "success"
                ? styles.metaSuccess
                : executionTone === "error"
                  ? styles.metaDanger
                  : null,
            ]}
          >
            Duration:{" "}
            {(() => {
              const start = new Date(executionCreationTime).getTime();
              const end = new Date(executionTime).getTime();
              if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
                return "n/a";
              }
              return `${((end - start) / 1000).toFixed(2)}s`;
            })()}
          </Text>
        ) : executionTime ? (
          <Text
            style={[
              styles.meta,
              executionTone === "success"
                ? styles.metaSuccess
                : executionTone === "error"
                  ? styles.metaDanger
                  : null,
            ]}
          >
            Executed at {executionTime}
          </Text>
        ) : null}
        {executionTone === "success" && executionSignature ? (
          <View style={styles.successBanner}>
            <CircleCheck size={16} color={qsColors.success} />
            <Text style={styles.successText}>Trade executed successfully</Text>
          </View>
        ) : null}
        {executionTone === "error" && !executionSignature ? (
          <View style={styles.errorBanner}>
            <AlertCircle size={16} color={qsColors.danger} />
            <Text style={styles.errorBannerText}>Trade failed</Text>
          </View>
        ) : null}
        {executionSignature ? (
          <View style={styles.signatureRow}>
            <Text style={styles.signatureText}>
              Signature: {executionSignature.slice(0, 12)}...
            </Text>
            <Pressable style={styles.signatureButton} onPress={handleCopySignature}>
              <View style={styles.sigButtonRow}>
                <Copy size={14} color={qsColors.textSecondary} />
                <Text style={styles.signatureButtonText}>Copy</Text>
              </View>
            </Pressable>
            <Pressable style={styles.signatureButton} onPress={handleOpenExplorer}>
              <View style={styles.sigButtonRow}>
                <ExternalLink size={14} color={qsColors.textSecondary} />
                <Text style={styles.signatureButtonText}>Solscan</Text>
              </View>
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
          <View style={styles.buttonRow}>
            <Zap
              size={16}
              color={executionBlockedReason ? qsColors.textTertiary : qsColors.layer0}
            />
            <Text
              style={[
                styles.executeButtonText,
                executionBlockedReason ? styles.executeButtonTextDisabled : null,
              ]}
            >
              {isExecuting ? "Executing..." : "Execute Trade"}
            </Text>
          </View>
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
    backgroundColor: qsColors.layer0,
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
    backgroundColor: qsColors.successDark,
  },
  modeBadgeDisabled: {
    borderColor: qsColors.borderDefault,
    backgroundColor: qsColors.layer1,
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
    color: qsColors.textTertiary,
  },
  title: {
    color: qsColors.textPrimary,
    fontSize: 28,
    fontWeight: "700",
  },
  card: {
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    borderRadius: qsRadius.md,
    backgroundColor: qsColors.layer1,
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
    color: qsColors.textTertiary,
    fontSize: 11,
    marginTop: 2,
  },
  metaSuccess: {
    color: qsColors.success,
  },
  metaDanger: {
    color: qsColors.danger,
  },
  ttlRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: qsColors.successDark,
    borderRadius: qsRadius.sm,
    paddingHorizontal: qsSpacing.sm,
    paddingVertical: 6,
    marginTop: 4,
  },
  successText: {
    color: qsColors.success,
    fontSize: 12,
    fontWeight: "600",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: qsColors.dangerDark,
    borderRadius: qsRadius.sm,
    paddingHorizontal: qsSpacing.sm,
    paddingVertical: 6,
    marginTop: 4,
  },
  errorBannerText: {
    color: qsColors.danger,
    fontSize: 12,
    fontWeight: "600",
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
    backgroundColor: qsColors.layer1,
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
    alignItems: "center",
  },
  signatureText: {
    color: qsColors.textSecondary,
    fontSize: 12,
  },
  signatureButton: {
    borderRadius: qsRadius.md,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    backgroundColor: qsColors.layer2,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  sigButtonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
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
  buttonRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
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
    color: qsColors.layer0,
    fontSize: 14,
    fontWeight: "700",
  },
  executeButtonTextDisabled: {
    color: qsColors.textTertiary,
  },
  backButton: {
    borderRadius: qsRadius.md,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    backgroundColor: qsColors.layer1,
    paddingVertical: 10,
    alignItems: "center",
  },
  backButtonText: {
    color: qsColors.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },
});
