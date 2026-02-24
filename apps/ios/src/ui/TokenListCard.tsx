import { memo } from "react";

import { StyleSheet, Text, View } from "react-native";

import { formatCompactUsd, formatPercent, formatCompactNumber } from "@/src/lib/format";
import { qsColors, qsRadius, qsSpacing } from "@/src/theme/tokens";
import { AnimatedPressable } from "@/src/ui/AnimatedPressable";
import { SocialChips, type SocialLink } from "@/src/ui/SocialChips";
import { SparklineChart } from "@/src/ui/SparklineChart";
import { Star, Zap } from "@/src/ui/icons";
import { TokenAvatar } from "@/src/ui/TokenAvatar";

type SparklinePoint = { ts: number; value: number };

type TokenListCardProps = {
  // Core data
  symbol: string;
  name: string;
  imageUri?: string;
  mint: string;

  // Metrics
  marketCapUsd: number;
  oneHourVolumeUsd?: number;
  oneHourTxCount?: number;
  oneHourChangePercent: number;

  // Badge / label
  platformLabel?: string;

  // Social links
  twitterUrl?: string;
  telegramUrl?: string;
  websiteUrl?: string;

  // Sparkline
  sparklineData?: SparklinePoint[];

  // Callbacks
  onPress: () => void;
  onQuickTrade?: () => void;
  onToggleStar?: () => void;
  isStarred?: boolean;

  // Highlighted state
  highlighted?: boolean;
};

function TokenListCardInner({
  symbol,
  name,
  imageUri,
  marketCapUsd,
  oneHourVolumeUsd,
  oneHourTxCount,
  oneHourChangePercent,
  platformLabel,
  twitterUrl,
  telegramUrl,
  websiteUrl,
  sparklineData,
  onPress,
  onQuickTrade,
  onToggleStar,
  isStarred = false,
  highlighted = false,
}: TokenListCardProps) {
  const isPositive = oneHourChangePercent >= 0;

  // Build social links array
  const socialLinks: SocialLink[] = [];
  if (twitterUrl) socialLinks.push({ type: "twitter", url: twitterUrl });
  if (telegramUrl) socialLinks.push({ type: "telegram", url: telegramUrl });
  if (websiteUrl) socialLinks.push({ type: "website", url: websiteUrl });

  // Build meta string
  const metaParts: string[] = [];
  if (oneHourVolumeUsd != null && oneHourVolumeUsd > 0) {
    metaParts.push(`Vol ${formatCompactUsd(oneHourVolumeUsd)}`);
  }
  if (oneHourTxCount != null && oneHourTxCount > 0) {
    metaParts.push(`TX ${formatCompactNumber(oneHourTxCount)}`);
  }

  return (
    <AnimatedPressable
      style={[
        styles.container,
        highlighted && styles.containerHighlighted,
      ]}
      onPress={onPress}
    >
      {/* Row 1: Main Data */}
      <View style={styles.mainRow}>
        {/* Token Image */}
        <View style={styles.imageContainer}>
          <TokenAvatar uri={imageUri} size={36} />
        </View>

        {/* Token Info */}
        <View style={styles.tokenInfo}>
          <Text style={styles.symbol} numberOfLines={1}>
            {symbol}
          </Text>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          {platformLabel ? (
            <View style={styles.platformBadge}>
              <Text style={styles.platformText}>{platformLabel}</Text>
            </View>
          ) : null}
        </View>

        {/* MC */}
        <View style={styles.mcColumn}>
          <Text style={styles.mcValue}>{formatCompactUsd(marketCapUsd)}</Text>
        </View>

        {/* 1h Change */}
        <View style={styles.changeColumn}>
          <Text
            style={[
              styles.changeValue,
              { color: isPositive ? qsColors.buyGreen : qsColors.sellRed },
            ]}
          >
            {formatPercent(oneHourChangePercent)}
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actionsColumn}>
          {onToggleStar ? (
            <AnimatedPressable onPress={onToggleStar} hitSlop={8}>
              <Star
                size={16}
                color={isStarred ? qsColors.accent : qsColors.textTertiary}
                fill={isStarred ? qsColors.accent : "none"}
              />
            </AnimatedPressable>
          ) : null}
          {onQuickTrade ? (
            <AnimatedPressable
              style={styles.quickTradeButton}
              onPress={onQuickTrade}
              hitSlop={4}
            >
              <Zap size={12} color={qsColors.textSecondary} />
            </AnimatedPressable>
          ) : null}
        </View>
      </View>

      {/* Row 2: Sparkline (optional) */}
      {sparklineData && sparklineData.length >= 2 ? (
        <View style={styles.sparklineRow}>
          <SparklineChart
            data={sparklineData}
            width={120}
            height={40}
            positive={isPositive}
          />
        </View>
      ) : null}

      {/* Row 3: Footer Meta */}
      {metaParts.length > 0 || socialLinks.length > 0 ? (
        <View style={styles.footerRow}>
          {metaParts.length > 0 ? (
            <Text style={styles.metaText}>{metaParts.join(" \u00B7 ")}</Text>
          ) : null}
          <SocialChips links={socialLinks} size="sm" />
        </View>
      ) : null}
    </AnimatedPressable>
  );
}

export const TokenListCard = memo(TokenListCardInner);

const styles = StyleSheet.create({
  container: {
    backgroundColor: qsColors.layer0,
    borderBottomWidth: 1,
    borderBottomColor: qsColors.borderDefault,
    paddingHorizontal: qsSpacing.sm,
    paddingVertical: qsSpacing.sm,
    minHeight: 64,
    gap: 6,
  },
  containerHighlighted: {
    backgroundColor: qsColors.layer1,
  },
  containerPressed: {
    backgroundColor: qsColors.pressedOverlay,
  },
  // Row 1
  mainRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: qsSpacing.sm,
  },
  imageContainer: {
    width: 40,
    height: 40,
  },
  tokenImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: qsColors.layer3,
  },
  imageFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: qsColors.layer3,
    alignItems: "center",
    justifyContent: "center",
  },
  imageFallbackText: {
    color: qsColors.textPrimary,
    fontWeight: "700",
    fontSize: 16,
  },
  tokenInfo: {
    flex: 2.5,
    gap: 1,
  },
  symbol: {
    fontSize: 15,
    fontWeight: "700",
    color: qsColors.textPrimary,
  },
  name: {
    fontSize: 11,
    color: qsColors.textMuted,
  },
  platformBadge: {
    alignSelf: "flex-start",
    backgroundColor: qsColors.layer2,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    borderRadius: qsRadius.pill,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginTop: 2,
  },
  platformText: {
    fontSize: 9,
    fontWeight: "600",
    color: qsColors.textSubtle,
  },
  mcColumn: {
    flex: 1.2,
    alignItems: "flex-end",
  },
  mcValue: {
    fontSize: 12,
    fontWeight: "600",
    color: qsColors.textSecondary,
    fontVariant: ["tabular-nums"],
  },
  changeColumn: {
    flex: 1,
    alignItems: "flex-end",
  },
  changeValue: {
    fontSize: 13,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  actionsColumn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minWidth: 40,
    justifyContent: "flex-end",
  },
  quickTradeButton: {
    backgroundColor: qsColors.layer4,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    borderRadius: qsRadius.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  // Row 2: Sparkline
  sparklineRow: {
    marginLeft: 48,
  },
  // Row 3: Footer
  footerRow: {
    marginLeft: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: qsSpacing.sm,
  },
  metaText: {
    fontSize: 10,
    color: qsColors.textSubtle,
  },
});
