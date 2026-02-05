import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import type { RootStack, TokenDetailRouteParams } from "@/src/navigation/types";
import { qsColors, qsRadius, qsSpacing } from "@/src/theme/tokens";

type TokenDetailScreenProps = {
  params?: TokenDetailRouteParams;
};

const fallbackTokenImage = "https://app.quickscope.gg/favicon.ico";

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

export function TokenDetailScreen({ params }: TokenDetailScreenProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStack>>();

  if (!params?.tokenAddress) {
    return (
      <View style={styles.page}>
        <Text style={styles.title}>Token Detail</Text>
        <Text style={styles.subtitle}>No token context was provided.</Text>
      </View>
    );
  }

  const platformLabel = (params.platform || params.exchange || "unknown").toUpperCase();
  const oneHourChange = params.oneHourChangePercent;

  return (
    <View style={styles.page}>
      <View style={styles.hero}>
        <Image source={{ uri: params.imageUri || fallbackTokenImage }} style={styles.tokenImage} />
        <View style={styles.heroText}>
          <Text style={styles.symbol}>{params.symbol || "Unknown"}</Text>
          <Text style={styles.name}>{params.name || "Unnamed token"}</Text>
          <Text style={styles.tagPill}>{platformLabel}</Text>
        </View>
      </View>

      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Market Cap</Text>
          <Text style={styles.metricValue}>{formatCompactUsd(params.marketCapUsd)}</Text>
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

      <View style={styles.detailsCard}>
        <Text style={styles.detailLine}>Address: {params.tokenAddress}</Text>
        <Text style={styles.detailLine}>Age: {formatAgeFromSeconds(params.mintedAtSeconds)}</Text>
        {typeof params.scanMentionsOneHour === "number" ? (
          <Text style={styles.detailLine}>
            Scan mentions (1h): {params.scanMentionsOneHour}
          </Text>
        ) : null}
        {params.source ? <Text style={styles.detailLine}>Opened from: {params.source}</Text> : null}
      </View>

      <View style={styles.ctaWrap}>
        <Pressable
          style={styles.primaryCta}
          onPress={() =>
            navigation.navigate("TradeEntry", {
              source: "deep-link",
              tokenAddress: params.tokenAddress,
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
  detailsCard: {
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    borderRadius: qsRadius.md,
    backgroundColor: qsColors.bgCardSoft,
    padding: qsSpacing.md,
    gap: 6,
  },
  detailLine: {
    color: qsColors.textSecondary,
    fontSize: 12,
  },
  ctaWrap: {
    marginTop: "auto",
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
