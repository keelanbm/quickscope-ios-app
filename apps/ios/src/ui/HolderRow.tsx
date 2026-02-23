/**
 * HolderRow — single token holder list item.
 *
 * Layout:
 * [Rank]  [Truncated Address]  [Labels]     [% Bar + % Text]
 *  #1      HqNf...7kWp         🐋 whale      ████░░  12.5%
 */
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { qsColors, qsRadius, qsSpacing, qsTypography } from "@/src/theme/tokens";
import { Copy } from "@/src/ui/icons";
import { haptics } from "@/src/lib/haptics";
import * as Clipboard from "expo-clipboard";
import type { TokenHolder } from "@/src/features/token/tokenInsightsService";

type HolderRowProps = {
  holder: TokenHolder;
  rank: number;
  /** Total supply used to calculate % */
  totalSupply: number;
};

const LABEL_COLORS: Record<string, { bg: string; text: string }> = {
  whale: { bg: "rgba(59, 130, 246, 0.15)", text: "#60a5fa" },
  bot: { bg: "rgba(239, 68, 68, 0.15)", text: "#f87171" },
  dev: { bg: "rgba(168, 85, 247, 0.15)", text: "#c084fc" },
  team: { bg: "rgba(234, 179, 8, 0.15)", text: "#fbbf24" },
  sniper: { bg: "rgba(239, 68, 68, 0.15)", text: "#f87171" },
  insider: { bg: "rgba(249, 115, 22, 0.15)", text: "#fb923c" },
};

function truncateAddress(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function formatBalance(balance: number): string {
  if (balance >= 1_000_000_000) return `${(balance / 1_000_000_000).toFixed(1)}B`;
  if (balance >= 1_000_000) return `${(balance / 1_000_000).toFixed(1)}M`;
  if (balance >= 1_000) return `${(balance / 1_000).toFixed(1)}K`;
  return balance.toFixed(0);
}

function getBarColor(pct: number): string {
  if (pct > 5) return qsColors.sellRed;
  if (pct > 1) return qsColors.warning;
  return qsColors.buyGreen;
}

export function HolderRow({ holder, rank, totalSupply }: HolderRowProps) {
  const pct = totalSupply > 0 ? (holder.balance / totalSupply) * 100 : 0;
  const barWidth = Math.min(pct, 100); // cap at 100%
  const barColor = getBarColor(pct);

  const handleCopy = () => {
    haptics.light();
    void Clipboard.setStringAsync(holder.owner);
  };

  return (
    <View style={styles.row}>
      {/* Rank */}
      <Text style={styles.rank}>#{rank}</Text>

      {/* Address + labels */}
      <View style={styles.addressCol}>
        <View style={styles.addressRow}>
          <Text style={styles.address} numberOfLines={1}>
            {truncateAddress(holder.owner)}
          </Text>
          <Pressable
            onPress={handleCopy}
            hitSlop={6}
            style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
          >
            <Copy size={12} color={qsColors.textSubtle} />
          </Pressable>
        </View>
        {holder.labels && holder.labels.length > 0 && (
          <View style={styles.labelsRow}>
            {holder.labels.map((label) => {
              const colors = LABEL_COLORS[label.toLowerCase()] ?? {
                bg: "rgba(119, 102, 247, 0.12)",
                text: qsColors.accent,
              };
              return (
                <View
                  key={label}
                  style={[styles.labelBadge, { backgroundColor: colors.bg }]}
                >
                  <Text style={[styles.labelText, { color: colors.text }]}>
                    {label}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Balance */}
      <Text style={styles.balance}>{formatBalance(holder.balance)}</Text>

      {/* % bar + text */}
      <View style={styles.pctCol}>
        <Text style={styles.pctText}>{pct < 0.01 ? "<0.01" : pct.toFixed(2)}%</Text>
        <View style={styles.barTrack}>
          <View
            style={[
              styles.barFill,
              { width: `${Math.max(barWidth, 1)}%`, backgroundColor: barColor },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: qsSpacing.sm,
    paddingHorizontal: qsSpacing.lg,
    gap: qsSpacing.sm,
  },
  rank: {
    width: 28,
    fontSize: 12,
    fontWeight: qsTypography.weight.bold,
    color: qsColors.textTertiary,
    fontVariant: ["tabular-nums"],
  },
  addressCol: {
    flex: 1,
    gap: 2,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  address: {
    fontSize: 13,
    fontWeight: qsTypography.weight.semi,
    color: qsColors.textPrimary,
    fontFamily: "monospace",
  },
  labelsRow: {
    flexDirection: "row",
    gap: 4,
    flexWrap: "wrap",
  },
  labelBadge: {
    borderRadius: qsRadius.xs,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  labelText: {
    fontSize: 9,
    fontWeight: qsTypography.weight.semi,
    textTransform: "uppercase",
  },
  balance: {
    width: 52,
    textAlign: "right",
    fontSize: 12,
    fontWeight: qsTypography.weight.medium,
    color: qsColors.textSecondary,
    fontVariant: ["tabular-nums"],
  },
  pctCol: {
    width: 68,
    alignItems: "flex-end",
    gap: 3,
  },
  pctText: {
    fontSize: 12,
    fontWeight: qsTypography.weight.semi,
    color: qsColors.textPrimary,
    fontVariant: ["tabular-nums"],
  },
  barTrack: {
    width: "100%",
    height: 3,
    borderRadius: 2,
    backgroundColor: qsColors.layer3,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 2,
  },
});
