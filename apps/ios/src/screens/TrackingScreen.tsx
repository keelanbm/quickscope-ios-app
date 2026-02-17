import { useEffect, useMemo, useRef, useState } from "react";

import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { formatSol } from "@/src/lib/format";
import type { RpcClient } from "@/src/lib/api/rpcClient";
import { useAuthSession } from "@/src/features/auth/AuthSessionProvider";
import {
  fetchWalletActivity,
  fetchWalletWatchlist,
  fetchWalletWatchlists,
  type AllTransactionsTableRow,
  type TrackedWallet,
  type WalletWatchlist,
} from "@/src/features/tracking/trackingService";
import type { RootStack, TrackingRouteParams } from "@/src/navigation/types";
import { qsColors, qsRadius, qsSpacing } from "@/src/theme/tokens";
import { SectionCard } from "@/src/ui/SectionCard";

type TrackingScreenProps = {
  rpcClient: RpcClient;
  params?: TrackingRouteParams;
};

type ActivityRow = {
  id: string;
  tokenSymbol: string;
  tokenName: string;
  tokenAddress: string;
  walletLabel: string;
  action: "Buy" | "Sell" | "Add" | "Remove";
  amountSol: string;
  timeAgo: string;
};

const ACTION_LABELS: Record<string, ActivityRow["action"]> = {
  b: "Buy",
  s: "Sell",
  d: "Add",
  w: "Remove",
};

function formatTimeAgo(unixSeconds: number): string {
  if (!Number.isFinite(unixSeconds) || unixSeconds <= 0) {
    return "--";
  }

  const delta = Math.max(0, Math.floor(Date.now() / 1000) - unixSeconds);
  if (delta < 60) {
    return `${delta}s`;
  }
  if (delta < 3600) {
    return `${Math.floor(delta / 60)}m`;
  }
  if (delta < 86400) {
    return `${Math.floor(delta / 3600)}h`;
  }
  return `${Math.floor(delta / 86400)}d`;
}

function resolveWalletLabel(wallets: TrackedWallet[], maker: string): string {
  const wallet = wallets.find((entry) => entry.public_key === maker);
  return wallet?.name || `${maker.slice(0, 4)}...${maker.slice(-4)}`;
}

export function TrackingScreen({ rpcClient, params }: TrackingScreenProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStack>>();
  const { walletAddress } = useAuthSession();
  const requestRef = useRef(0);
  const [watchlists, setWatchlists] = useState<WalletWatchlist[]>([]);
  const [activeWatchlistId, setActiveWatchlistId] = useState<string | null>(null);
  const [wallets, setWallets] = useState<TrackedWallet[]>([]);
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    const requestId = ++requestRef.current;
    setIsLoading(true);
    setErrorText(null);

    fetchWalletWatchlists(rpcClient)
      .then((data) => {
        if (!isActive || requestId !== requestRef.current) {
          return;
        }
        setWatchlists(data ?? []);
        setActiveWatchlistId((prev) => prev ?? data?.[0]?.list_id?.toString() ?? null);
      })
      .catch((error) => {
        if (!isActive || requestId !== requestRef.current) {
          return;
        }
        setErrorText(error instanceof Error ? error.message : "Failed to load watchlists.");
      })
      .finally(() => {
        if (!isActive || requestId !== requestRef.current) {
          return;
        }
        setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [rpcClient]);

  useEffect(() => {
    if (!activeWatchlistId) {
      setWallets([]);
      return;
    }

    let isActive = true;
    const requestId = ++requestRef.current;
    setErrorText(null);

    fetchWalletWatchlist(rpcClient, Number(activeWatchlistId))
      .then((data) => {
        if (!isActive || requestId !== requestRef.current) {
          return;
        }
        setWallets(data.wallets ?? []);
      })
      .catch((error) => {
        if (!isActive || requestId !== requestRef.current) {
          return;
        }
        setErrorText(error instanceof Error ? error.message : "Failed to load watchlist.");
        setWallets([]);
      });

    return () => {
      isActive = false;
    };
  }, [activeWatchlistId, rpcClient]);

  useEffect(() => {
    if (wallets.length === 0) {
      setActivity([]);
      return;
    }

    let isActive = true;
    const requestId = ++requestRef.current;
    setIsLoadingActivity(true);
    setErrorText(null);

    const walletAddresses = wallets.map((wallet) => wallet.public_key);

    fetchWalletActivity(rpcClient, walletAddresses)
      .then((data) => {
        if (!isActive || requestId !== requestRef.current) {
          return;
        }
        const tokenInfoMap = data.mint_to_token_info ?? {};
        const rows = data.table?.rows ?? [];
        const mapped = rows.map((row: AllTransactionsTableRow) => {
          const tokenInfo = tokenInfoMap[row.mint]?.token_metadata;
          const tokenSymbol = tokenInfo?.symbol ?? row.mint.slice(0, 4);
          const tokenName = tokenInfo?.name ?? "Unknown token";
          const action = ACTION_LABELS[row.type] ?? "Buy";
          return {
            id: row.signature || row.index,
            tokenSymbol,
            tokenName,
            tokenAddress: row.mint,
            walletLabel: resolveWalletLabel(wallets, row.maker),
            action,
            amountSol: formatSol(row.amount_quote ?? 0),
            timeAgo: formatTimeAgo(row.ts),
          };
        });

        setActivity(mapped);
      })
      .catch((error) => {
        if (!isActive || requestId !== requestRef.current) {
          return;
        }
        setErrorText(error instanceof Error ? error.message : "Failed to load activity.");
        setActivity([]);
      })
      .finally(() => {
        if (!isActive || requestId !== requestRef.current) {
          return;
        }
        setIsLoadingActivity(false);
      });

    return () => {
      isActive = false;
    };
  }, [rpcClient, wallets]);

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
          const id = watchlist.list_id.toString();
          const isActive = id === activeWatchlistId;
          return (
            <Pressable
              key={watchlist.list_id}
              style={[styles.tabPill, isActive && styles.tabPillActive]}
              onPress={() => setActiveWatchlistId(id)}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {watchlist.name}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <SectionCard title="Recent Activity" subtitle="Latest tracked wallet actions">
        {isLoading ? (
          <Text style={styles.emptyText}>Loading watchlists...</Text>
        ) : errorText ? (
          <Text style={styles.emptyText}>{errorText}</Text>
        ) : watchlists.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Create a watchlist to begin tracking.</Text>
            <Pressable
              style={styles.primaryButton}
              onPress={() => Alert.alert("Coming soon", "Watchlist creation is not yet available.")}
            >
              <Text style={styles.primaryButtonText}>Create watchlist</Text>
            </Pressable>
          </View>
        ) : wallets.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Add wallets to start tracking activity.</Text>
            <Pressable
              style={styles.primaryButton}
              onPress={() => Alert.alert("Coming soon", "Wallet tracking setup is not yet available.")}
            >
              <Text style={styles.primaryButtonText}>Add wallets</Text>
            </Pressable>
          </View>
        ) : isLoadingActivity ? (
          <Text style={styles.emptyText}>Loading activity...</Text>
        ) : activity.length === 0 ? (
          <Text style={styles.emptyText}>No activity yet for this watchlist.</Text>
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
                    row.action === "Buy"
                      ? styles.buyPill
                      : row.action === "Sell"
                        ? styles.sellPill
                        : styles.neutralPill,
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
  neutralPill: {
    backgroundColor: "rgba(79, 92, 120, 0.35)",
    color: qsColors.textSecondary,
  },
  amountText: {
    color: qsColors.textSecondary,
    fontSize: 12,
  },
  timeText: {
    color: qsColors.textSubtle,
    fontSize: 11,
  },
});
