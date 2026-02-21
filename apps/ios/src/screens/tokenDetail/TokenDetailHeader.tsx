/**
 * Condensed token detail header.
 *
 * Layout:
 * [Back]
 * [Image 40x40] [Symbol] [Age pill]  [Copy] [Star]
 *               [Name · Contract]
 * [MC $1.2M]  [+12.5%]
 * [Platform pill] [Social chips]
 */
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { qsColors, qsRadius, qsSpacing, qsTypography } from "@/src/theme/tokens";
import { SocialChips, type SocialLink } from "@/src/ui/SocialChips";
import { ArrowLeft, Copy, Star, Clock } from "@/src/ui/icons";
import { TokenAvatar } from "@/src/ui/TokenAvatar";
import { haptics } from "@/src/lib/haptics";
import { formatCompactUsd, formatPercent } from "./styles";

type TokenDetailHeaderProps = {
  imageUri: string | undefined;
  symbol: string;
  name: string;
  tokenAddress: string;
  age: string;
  platformLabel: string;
  socialLinks: SocialLink[];
  marketCapUsd: number | undefined;
  oneHourChange: number | undefined;
  isTracked: boolean;
  isWatchlistLoading: boolean;
  isWatchlistUpdating: boolean;
  hasValidAccessToken: boolean;
  onCopyAddress: () => void;
  onToggleWatchlist: () => void;
  onGoBack: () => void;
  scanMentionsOneHour?: number;
};

export function TokenDetailHeader({
  imageUri,
  symbol,
  name,
  tokenAddress,
  age,
  platformLabel,
  socialLinks,
  marketCapUsd,
  oneHourChange,
  isTracked,
  isWatchlistLoading,
  isWatchlistUpdating,
  hasValidAccessToken,
  onCopyAddress,
  onToggleWatchlist,
  onGoBack,
}: TokenDetailHeaderProps) {
  const truncatedAddress = `${tokenAddress.slice(0, 6)}...${tokenAddress.slice(-4)}`;
  const tracked = isTracked && hasValidAccessToken;

  return (
    <View style={styles.wrap}>
      {/* Back button */}
      <Pressable
        onPress={onGoBack}
        style={({ pressed }) => [styles.backButton, { opacity: pressed ? 0.6 : 1 }]}
      >
        <ArrowLeft size={20} color={qsColors.textSecondary} />
      </Pressable>

      {/* Identity row: image + symbol + age + actions */}
      <View style={styles.identityRow}>
        <TokenAvatar uri={imageUri} size={40} />
        <View style={styles.identityInfo}>
          {/* Top: Symbol + age + copy + star */}
          <View style={styles.symbolRow}>
            <Text style={styles.symbol} numberOfLines={1}>{symbol}</Text>

            {age !== "n/a" && (
              <View style={styles.agePill}>
                <Clock size={10} color={qsColors.textTertiary} />
                <Text style={styles.ageText}>{age}</Text>
              </View>
            )}

            <View style={styles.actionIcons}>
              <Pressable
                onPress={() => { haptics.light(); onCopyAddress(); }}
                style={({ pressed }) => [styles.iconButton, { opacity: pressed ? 0.5 : 1 }]}
                hitSlop={8}
              >
                <Copy size={14} color={qsColors.accent} />
              </Pressable>

              <Pressable
                onPress={() => { haptics.light(); onToggleWatchlist(); }}
                style={({ pressed }) => [styles.iconButton, { opacity: pressed ? 0.5 : 1 }]}
                disabled={isWatchlistLoading || isWatchlistUpdating}
                hitSlop={8}
              >
                <Star
                  size={16}
                  color={tracked ? qsColors.accent : qsColors.textTertiary}
                  fill={tracked ? qsColors.accent : "transparent"}
                />
              </Pressable>
            </View>
          </View>

          {/* Bottom: Name · contract */}
          <Pressable onPress={() => { haptics.light(); onCopyAddress(); }}>
            <Text style={styles.nameAndAddress} numberOfLines={1}>
              {name}
              <Text style={styles.separator}> · </Text>
              <Text style={styles.address}>{truncatedAddress}</Text>
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Price row: MC + change  |  social icons right */}
      <View style={styles.priceRow}>
        <View style={styles.priceLeft}>
          <Text style={styles.marketCap}>{formatCompactUsd(marketCapUsd)}</Text>
          {oneHourChange !== undefined && (
            <Text
              style={[
                styles.change,
                oneHourChange >= 0 ? styles.changePositive : styles.changeNegative,
              ]}
            >
              {formatPercent(oneHourChange)}
            </Text>
          )}
        </View>
        {socialLinks.length > 0 && <SocialChips links={socialLinks} size="sm" />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: qsSpacing.lg,
    gap: qsSpacing.sm,
  },

  backButton: {
    paddingTop: qsSpacing.md,
    paddingBottom: qsSpacing.xs,
    alignSelf: "flex-start",
  },

  /* Identity row */
  identityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: qsSpacing.md,
  },
  identityInfo: {
    flex: 1,
    gap: 2,
  },

  /* Symbol row with actions */
  symbolRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: qsSpacing.sm,
  },
  symbol: {
    color: qsColors.textPrimary,
    fontSize: qsTypography.size.xxl,
    fontWeight: qsTypography.weight.bold,
    letterSpacing: -0.3,
  },
  agePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: qsColors.layer2,
    borderRadius: qsRadius.pill,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  ageText: {
    color: qsColors.textTertiary,
    fontSize: 10,
    fontWeight: qsTypography.weight.semi,
  },
  actionIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: qsSpacing.sm,
    marginLeft: "auto",
  },
  iconButton: {
    padding: 4,
  },

  /* Name + address */
  nameAndAddress: {
    color: qsColors.textTertiary,
    fontSize: qsTypography.size.sm,
  },
  separator: {
    color: qsColors.textMuted,
  },
  address: {
    fontFamily: "Courier",
    fontSize: 11,
    color: qsColors.textMuted,
  },

  /* Price row */
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  priceLeft: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: qsSpacing.sm,
  },
  marketCap: {
    color: qsColors.textPrimary,
    fontSize: qsTypography.size.xxl,
    fontWeight: qsTypography.weight.semi,
  },
  change: {
    fontSize: qsTypography.size.sm,
    fontWeight: qsTypography.weight.semi,
  },
  changePositive: {
    color: qsColors.buyGreen,
  },
  changeNegative: {
    color: qsColors.sellRed,
  },
});
