import { useMemo } from "react";

import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import type { PortfolioRouteParams } from "@/src/navigation/types";
import { qsColors, qsRadius, qsSpacing } from "@/src/theme/tokens";
import { SectionCard } from "@/src/ui/SectionCard";

type PortfolioScreenProps = {
  params?: PortfolioRouteParams;
};

type PositionRow = {
  id: string;
  symbol: string;
  name: string;
  value: string;
  pnl: string;
  pnlPositive: boolean;
};

const mockPositions: PositionRow[] = [
  { id: "pos-1", symbol: "ARC", name: "AI Rig Corp", value: "$1.35K", pnl: "+12.4%", pnlPositive: true },
  { id: "pos-2", symbol: "WIF", name: "dogwifhat", value: "$820", pnl: "-4.8%", pnlPositive: false },
  { id: "pos-3", symbol: "BONK", name: "Bonk", value: "$412", pnl: "+6.1%", pnlPositive: true },
];

function formatWalletAddress(address?: string): string {
  if (!address) {
    return "Not connected";
  }

  if (address.length <= 10) {
    return address;
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function PortfolioScreen({ params }: PortfolioScreenProps) {
  const stats = useMemo(
    () => [
      { label: "Balance", value: "--" },
      { label: "Positions", value: mockPositions.length.toString() },
      { label: "Total Volume", value: "--" },
      { label: "Unrealized PnL", value: "--" },
    ],
    []
  );

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Portfolio</Text>
        <Text style={styles.subtitle}>Snapshot of balances and active positions.</Text>
      </View>

      <View style={styles.walletCard}>
        <View style={styles.walletAvatar}>
          <Text style={styles.walletAvatarText}>Q</Text>
        </View>
        <View style={styles.walletText}>
          <Text style={styles.walletName}>Primary Wallet</Text>
          <Text style={styles.walletAddress}>{formatWalletAddress(params?.walletAddress)}</Text>
        </View>
        <Pressable style={styles.walletButton}>
          <Text style={styles.walletButtonText}>Manage</Text>
        </Pressable>
      </View>

      <View style={styles.statsRow}>
        {stats.map((stat) => (
          <View key={stat.label} style={styles.statCard}>
            <Text style={styles.statLabel}>{stat.label}</Text>
            <Text style={styles.statValue}>{stat.value}</Text>
          </View>
        ))}
      </View>

      <SectionCard title="Positions" subtitle="Top holdings by value">
        {mockPositions.map((position) => (
          <View key={position.id} style={styles.positionRow}>
            <View style={styles.positionLeft}>
              <View style={styles.positionAvatar}>
                <Text style={styles.positionAvatarText}>{position.symbol[0]}</Text>
              </View>
              <View style={styles.positionText}>
                <Text style={styles.positionSymbol}>{position.symbol}</Text>
                <Text style={styles.positionName}>{position.name}</Text>
              </View>
            </View>
            <View style={styles.positionRight}>
              <Text style={styles.positionValue}>{position.value}</Text>
              <Text
                style={[
                  styles.positionPnl,
                  position.pnlPositive ? styles.pnlPositive : styles.pnlNegative,
                ]}
              >
                {position.pnl}
              </Text>
            </View>
          </View>
        ))}
      </SectionCard>

      {params?.source ? (
        <Text style={styles.contextText}>Opened from a deep link.</Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: qsColors.bgCanvas,
  },
  content: {
    padding: qsSpacing.xl,
    gap: qsSpacing.md,
  },
  header: {
    gap: 4,
  },
  title: {
    color: qsColors.textPrimary,
    fontSize: 26,
    fontWeight: "700",
  },
  subtitle: {
    color: qsColors.textMuted,
    fontSize: 14,
  },
  walletCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: qsSpacing.sm,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    borderRadius: qsRadius.md,
    backgroundColor: qsColors.bgCard,
    padding: qsSpacing.sm,
  },
  walletAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: qsColors.bgCardSoft,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    alignItems: "center",
    justifyContent: "center",
  },
  walletAvatarText: {
    color: qsColors.textPrimary,
    fontWeight: "700",
  },
  walletText: {
    flex: 1,
    gap: 2,
  },
  walletName: {
    color: qsColors.textPrimary,
    fontSize: 15,
    fontWeight: "600",
  },
  walletAddress: {
    color: qsColors.textSubtle,
    fontSize: 12,
  },
  walletButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: qsRadius.sm,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    backgroundColor: qsColors.bgCardSoft,
  },
  walletButtonText: {
    color: qsColors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: qsSpacing.sm,
  },
  statCard: {
    width: "48%",
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    borderRadius: qsRadius.md,
    backgroundColor: qsColors.bgCardSoft,
    padding: qsSpacing.sm,
    gap: 4,
  },
  statLabel: {
    color: qsColors.textSubtle,
    fontSize: 11,
  },
  statValue: {
    color: qsColors.textSecondary,
    fontSize: 16,
    fontWeight: "700",
  },
  positionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    borderRadius: qsRadius.md,
    backgroundColor: qsColors.bgCardSoft,
    padding: qsSpacing.sm,
    gap: qsSpacing.sm,
  },
  positionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: qsSpacing.sm,
    flex: 1,
  },
  positionAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: qsColors.bgCard,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    alignItems: "center",
    justifyContent: "center",
  },
  positionAvatarText: {
    color: qsColors.textPrimary,
    fontWeight: "700",
  },
  positionText: {
    gap: 2,
  },
  positionSymbol: {
    color: qsColors.textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  positionName: {
    color: qsColors.textMuted,
    fontSize: 12,
  },
  positionRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  positionValue: {
    color: qsColors.textSecondary,
    fontSize: 12,
  },
  positionPnl: {
    fontSize: 12,
    fontWeight: "700",
  },
  pnlPositive: {
    color: qsColors.success,
  },
  pnlNegative: {
    color: qsColors.danger,
  },
  contextText: {
    color: qsColors.textSubtle,
    fontSize: 12,
  },
});
