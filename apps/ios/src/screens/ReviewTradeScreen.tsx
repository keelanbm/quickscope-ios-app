import { Pressable, StyleSheet, Text, View } from "react-native";

import type { ReviewTradeRouteParams } from "@/src/navigation/types";
import { qsColors, qsRadius, qsSpacing } from "@/src/theme/tokens";

type ReviewTradeScreenProps = {
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

export function ReviewTradeScreen({ params }: ReviewTradeScreenProps) {
  return (
    <View style={styles.page}>
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
        <Text style={styles.line}>
          Execution is intentionally disabled in this build while we finalize tx/swap safety checks.
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.disabledButton} disabled>
          <Text style={styles.disabledButtonText}>Execute Trade (Coming Soon)</Text>
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
  actions: {
    marginTop: "auto",
  },
  disabledButton: {
    borderRadius: qsRadius.md,
    backgroundColor: qsColors.borderDefault,
    paddingVertical: 12,
    alignItems: "center",
  },
  disabledButtonText: {
    color: qsColors.textSubtle,
    fontSize: 14,
    fontWeight: "700",
  },
});
