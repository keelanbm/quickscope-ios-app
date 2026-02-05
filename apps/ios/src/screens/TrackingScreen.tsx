import { useMemo, useState } from "react";

import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import type { RootStack, TrackingRouteParams } from "@/src/navigation/types";
import { qsColors, qsRadius, qsSpacing } from "@/src/theme/tokens";
import { SectionCard } from "@/src/ui/SectionCard";

type TrackingScreenProps = {
  params?: TrackingRouteParams;
};

type Watchlist = {
  id: string;
  name: string;
};

type ActivityRow = {
  id: string;
  tokenSymbol: string;
  tokenName: string;
  tokenAddress: string;
  walletLabel: string;
  action: "Buy" | "Sell";
  amountSol: string;
  timeAgo: string;
};

const watchlists: Watchlist[] = [
  { id: "main", name: "Main" },
  { id: "whales", name: "Whales" },
];

const activityByWatchlist: Record<string, ActivityRow[]> = {
  main: [
    {
      id: "row-1",
      tokenSymbol: "ARC",
      tokenName: "AI Rig Corp",
      tokenAddress: "So11111111111111111111111111111111111111112",
      walletLabel: "Alpha Wallet",
      action: "Buy",
      amountSol: "0.45",
      timeAgo: "2m",
    },
    {
      id: "row-2",
      tokenSymbol: "WIF",
      tokenName: "dogwifhat",
      tokenAddress: "So11111111111111111111111111111111111111112",
      walletLabel: "Alpha Wallet",
      action: "Sell",
      amountSol: "1.2",
      timeAgo: "12m",
    },
    {
      id: "row-3",
      tokenSymbol: "BONK",
      tokenName: "Bonk",
      tokenAddress: "So11111111111111111111111111111111111111112",
      walletLabel: "Scout Wallet",
      action: "Buy",
      amountSol: "0.08",
      timeAgo: "27m",
    },
  ],
  whales: [
    {
      id: "row-4",
      tokenSymbol: "POPCAT",
      tokenName: "Popcat",
      tokenAddress: "So11111111111111111111111111111111111111112",
      walletLabel: "Whale #1",
      action: "Buy",
      amountSol: "14.5",
      timeAgo: "4m",
    },
  ],
};

export function TrackingScreen({ params }: TrackingScreenProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStack>>();
  const [activeWatchlistId, setActiveWatchlistId] = useState(watchlists[0]?.id ?? "main");

  const activity = useMemo(
    () => activityByWatchlist[activeWatchlistId] ?? [],
    [activeWatchlistId]
  );

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Tracking</Text>
        <Text style={styles.subtitle}>
          Wallet and token tracking snapshots based on your watchlists.
        </Text>
      </View>

      <View style={styles.tabsRow}>
        {watchlists.map((watchlist) => {
          const isActive = watchlist.id === activeWatchlistId;
          return (
            <Pressable
              key={watchlist.id}
              style={[styles.tabPill, isActive && styles.tabPillActive]}
              onPress={() => setActiveWatchlistId(watchlist.id)}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {watchlist.name}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <SectionCard title="Recent Activity" subtitle="Latest tracked wallet actions">
        {activity.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No activity yet for this watchlist.</Text>
            <Pressable style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Add wallets</Text>
            </Pressable>
          </View>
        ) : (
          activity.map((row) => (
            <Pressable
              key={row.id}
              style={styles.activityRow}
              onPress={() =>
                navigation.navigate("TokenDetail", {
                  source: "deep-link",
                  tokenAddress: row.tokenAddress,
                })
              }
            >
              <View style={styles.rowLeft}>
                <View style={styles.tokenAvatar}>
                  <Text style={styles.tokenAvatarText}>{row.tokenSymbol[0]}</Text>
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.tokenSymbol}>{row.tokenSymbol}</Text>
                  <Text style={styles.tokenName}>{row.tokenName}</Text>
                  <Text style={styles.walletLabel}>{row.walletLabel}</Text>
                </View>
              </View>
              <View style={styles.rowRight}>
                <Text
                  style={[
                    styles.actionPill,
                    row.action === "Buy" ? styles.buyPill : styles.sellPill,
                  ]}
                >
                  {row.action}
                </Text>
                <Text style={styles.amountText}>{row.amountSol} SOL</Text>
                <Text style={styles.timeText}>{row.timeAgo}</Text>
              </View>
            </Pressable>
          ))
        )}
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
  tabsRow: {
    flexDirection: "row",
    gap: qsSpacing.sm,
  },
  tabPill: {
    borderRadius: qsRadius.lg,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    backgroundColor: qsColors.bgCard,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tabPillActive: {
    borderColor: qsColors.accent,
    backgroundColor: "rgba(78, 163, 255, 0.15)",
  },
  tabText: {
    color: qsColors.textSubtle,
    fontSize: 12,
    fontWeight: "600",
  },
  tabTextActive: {
    color: qsColors.textPrimary,
  },
  emptyState: {
    alignItems: "center",
    gap: qsSpacing.sm,
    paddingVertical: qsSpacing.sm,
  },
  emptyText: {
    color: qsColors.textSubtle,
    fontSize: 12,
  },
  primaryButton: {
    backgroundColor: qsColors.accent,
    borderRadius: qsRadius.sm,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  primaryButtonText: {
    color: "#061326",
    fontSize: 12,
    fontWeight: "700",
  },
  activityRow: {
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
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: qsSpacing.sm,
    flex: 1,
  },
  tokenAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: qsColors.bgCard,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    alignItems: "center",
    justifyContent: "center",
  },
  tokenAvatarText: {
    color: qsColors.textPrimary,
    fontWeight: "700",
  },
  rowText: {
    gap: 2,
  },
  tokenSymbol: {
    color: qsColors.textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  tokenName: {
    color: qsColors.textMuted,
    fontSize: 12,
  },
  walletLabel: {
    color: qsColors.textSubtle,
    fontSize: 11,
  },
  rowRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  actionPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: qsRadius.sm,
    fontSize: 11,
    fontWeight: "700",
    overflow: "hidden",
  },
  buyPill: {
    backgroundColor: "rgba(53, 210, 142, 0.2)",
    color: qsColors.success,
  },
  sellPill: {
    backgroundColor: "rgba(255, 107, 107, 0.2)",
    color: qsColors.danger,
  },
  amountText: {
    color: qsColors.textSecondary,
    fontSize: 12,
  },
  timeText: {
    color: qsColors.textSubtle,
    fontSize: 11,
  },
  contextText: {
    color: qsColors.textSubtle,
    fontSize: 12,
  },
});
