import { useEffect, useMemo, useRef, useState } from "react";

import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import type { RpcClient } from "@/src/lib/api/rpcClient";
import { useAuthSession } from "@/src/features/auth/AuthSessionProvider";
import { useWalletConnect } from "@/src/features/wallet/WalletConnectProvider";
import {
  fetchAccountTokenHoldings,
  fetchTraderPositions,
  fetchTraderOverview,
  type AccountTokenHoldings,
  type TraderOverview,
} from "@/src/features/portfolio/portfolioService";
import { fetchWalletActivity } from "@/src/features/tracking/trackingService";
import type { PortfolioRouteParams } from "@/src/navigation/types";
import { qsColors, qsRadius, qsSpacing } from "@/src/theme/tokens";
import { SectionCard } from "@/src/ui/SectionCard";

type PortfolioScreenProps = {
  rpcClient: RpcClient;
  params?: PortfolioRouteParams;
};

type PositionRow = {
  id: string;
  symbol: string;
  name: string;
  value: string;
  pnl: string;
  pnlPositive: boolean;
  valueUsd: number;
};

type ActivityRow = {
  id: string;
  tokenSymbol: string;
  tokenName: string;
  tokenAddress: string;
  action: "Buy" | "Sell";
  amountSol: string;
  timeAgo: string;
};

type PortfolioTabId = "positions" | "trades" | "activity";

const portfolioTabs: { id: PortfolioTabId; label: string }[] = [
  { id: "positions", label: "Positions" },
  { id: "trades", label: "Trades" },
  { id: "activity", label: "Activity" },
];

const portfolioTabCopy: Record<PortfolioTabId, { title: string; subtitle: string }> = {
  positions: { title: "Positions", subtitle: "Top holdings by value" },
  trades: { title: "Trades", subtitle: "Closed positions (0 balance)" },
  activity: { title: "Activity", subtitle: "Recent swaps" },
};

function formatWalletAddress(address?: string): string {
  if (!address) {
    return "Not connected";
  }

  if (address.length <= 10) {
    return address;
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatUsd(value?: number): string {
  if (!value || !Number.isFinite(value)) {
    return "--";
  }

  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(2)}B`;
  }
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}K`;
  }
  return `$${value.toFixed(2)}`;
}

function formatAmount(value: number): string {
  if (!Number.isFinite(value)) {
    return "--";
  }

  if (value >= 1000) {
    return value.toFixed(0);
  }

  if (value >= 10) {
    return value.toFixed(2);
  }

  return value.toFixed(3);
}

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

export function PortfolioScreen({ rpcClient, params }: PortfolioScreenProps) {
  const { walletAddress, hasValidAccessToken } = useAuthSession();
  const { ensureAuthenticated } = useWalletConnect();
  const requestRef = useRef(0);
  const [overview, setOverview] = useState<TraderOverview | null>(null);
  const [holdings, setHoldings] = useState<AccountTokenHoldings | null>(null);
  const [closedPositions, setClosedPositions] = useState<PositionRow[]>([]);
  const [activityRows, setActivityRows] = useState<ActivityRow[]>([]);
  const [activeTab, setActiveTab] = useState<PortfolioTabId>("positions");
  const [isLoading, setIsLoading] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [isActivityLoading, setIsActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState<string | null>(null);
  const chipHitSlop = { top: 6, bottom: 6, left: 6, right: 6 };

  useEffect(() => {
    if (!walletAddress) {
      setOverview(null);
      setHoldings(null);
      setIsLoading(false);
      return;
    }

    let isActive = true;
    const requestId = ++requestRef.current;
    setIsLoading(true);
    setErrorText(null);

    Promise.all([
      fetchTraderOverview(rpcClient, walletAddress),
      fetchAccountTokenHoldings(rpcClient, walletAddress),
      fetchTraderPositions(rpcClient, walletAddress, {
        include_zero_balances: true,
        limit: 50,
      }),
    ])
      .then(([nextOverview, nextHoldings, positionsResponse]) => {
        if (!isActive || requestId !== requestRef.current) {
          return;
        }
        setOverview(nextOverview);
        setHoldings(nextHoldings);
        setClosedPositions(() => {
          const positions = positionsResponse?.positions ?? [];
          return positions
            .filter((position) => Number(position.balance) <= 0)
            .map((position) => {
              const meta = position.token_info ?? {};
              const symbol = meta.symbol ?? "UNK";
              const name = meta.name ?? "Unknown token";
              const pnl = position.total_pnl_change_proportion;
              const pnlPercent =
                pnl !== undefined && Number.isFinite(pnl) ? pnl * 100 : undefined;
              const pnlLabel = pnlPercent === undefined ? "--" : `${pnlPercent.toFixed(1)}%`;
              const pnlPositive = pnlPercent === undefined ? true : pnlPercent >= 0;
              const valueUsd = (position.bought_usd ?? 0) + (position.sold_usd ?? 0);

              return {
                id: meta.mint ?? symbol,
                symbol,
                name,
                value: formatUsd(valueUsd || undefined),
                pnl: pnlLabel,
                pnlPositive,
                valueUsd,
              };
            })
            .sort((a, b) => b.valueUsd - a.valueUsd);
        });
      })
      .catch((error) => {
        if (!isActive || requestId !== requestRef.current) {
          return;
        }
        setErrorText(error instanceof Error ? error.message : "Failed to load portfolio.");
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
  }, [rpcClient, walletAddress]);

  useEffect(() => {
    if (!walletAddress) {
      setActivityRows([]);
      return;
    }

    let isActive = true;
    const requestId = ++requestRef.current;
    setIsActivityLoading(true);
    setActivityError(null);

    fetchWalletActivity(rpcClient, [walletAddress])
      .then((data) => {
        if (!isActive || requestId !== requestRef.current) {
          return;
        }
        const tokenInfoMap = data.mint_to_token_info ?? {};
        const rows = (data.table?.rows ?? []).filter(
          (row) => row.type === "b" || row.type === "s"
        );
        const mapped = rows.map((row) => {
          const tokenInfo = tokenInfoMap[row.mint]?.token_metadata;
          const tokenSymbol = tokenInfo?.symbol ?? row.mint.slice(0, 4);
          const tokenName = tokenInfo?.name ?? "Unknown token";
          const action = row.type === "s" ? "Sell" : "Buy";
          return {
            id: row.signature || row.index,
            tokenSymbol,
            tokenName,
            tokenAddress: row.mint,
            action,
            amountSol: formatAmount(row.amount_quote ?? 0),
            timeAgo: formatTimeAgo(row.ts),
          };
        });

        setActivityRows(mapped);
      })
      .catch((error) => {
        if (!isActive || requestId !== requestRef.current) {
          return;
        }
        setActivityError(error instanceof Error ? error.message : "Failed to load activity.");
        setActivityRows([]);
      })
      .finally(() => {
        if (!isActive || requestId !== requestRef.current) {
          return;
        }
        setIsActivityLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [rpcClient, walletAddress]);

  const positions = useMemo<PositionRow[]>(() => {
    if (!holdings?.token_holdings) {
      return [];
    }

    const solPriceUsd = holdings.sol_price_usd || overview?.sol_price_usd || 0;
    return holdings.token_holdings
      .map((entry) => {
        const tokenMeta = entry.token_info?.token_metadata;
        const symbol = tokenMeta?.symbol ?? "UNK";
        const name = tokenMeta?.name ?? "Unknown token";
        const valueUsd = entry.value_sol * solPriceUsd;

        return {
          id: tokenMeta?.mint ?? symbol,
          symbol,
          name,
          value: formatUsd(valueUsd),
          pnl: "--",
          pnlPositive: true,
          valueUsd,
        };
      })
      .sort((a, b) => {
        return b.valueUsd - a.valueUsd;
      })
      .slice(0, 6);
  }, [holdings, overview?.sol_price_usd]);

  const stats = useMemo(() => {
    const solPriceUsd = holdings?.sol_price_usd || overview?.sol_price_usd || 0;
    const solBalanceUsd = holdings?.sol_balance ? holdings.sol_balance * solPriceUsd : undefined;
    const _positionsValueUsd = holdings?.value_usd;
    const totalVolumeUsd =
      (overview?.cumulatives?.bought_usd_cumulative ?? 0) +
      (overview?.cumulatives?.sold_usd_cumulative ?? 0);

    return [
      { label: "Balance", value: formatUsd(solBalanceUsd) },
      { label: "Positions", value: positions.length.toString() },
      { label: "Total Volume", value: formatUsd(totalVolumeUsd || undefined) },
      { label: "Unrealized PnL", value: "--" },
    ];
  }, [holdings, overview, positions.length]);

  const handleAuthenticate = async () => {
    await ensureAuthenticated();
  };

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <View style={styles.walletCard}>
        <View style={styles.walletAvatar}>
          <Text style={styles.walletAvatarText}>Q</Text>
        </View>
        <View style={styles.walletText}>
          <Text style={styles.walletName}>Primary Wallet</Text>
          <Text style={styles.walletAddress}>
            {formatWalletAddress(walletAddress ?? params?.walletAddress)}
          </Text>
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

      <View style={styles.tabsRow}>
        {portfolioTabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <Pressable
              key={tab.id}
              style={[styles.tabPill, isActive && styles.tabPillActive]}
              onPress={() => setActiveTab(tab.id)}
              hitSlop={chipHitSlop}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <SectionCard
        title={portfolioTabCopy[activeTab].title}
        subtitle={portfolioTabCopy[activeTab].subtitle}
      >
        {!hasValidAccessToken ? (
          <View style={styles.emptyState}>
            <Text style={styles.contextText}>Authenticate to load portfolio data.</Text>
            <Pressable style={styles.primaryButton} onPress={handleAuthenticate}>
              <Text style={styles.primaryButtonText}>Authenticate session</Text>
            </Pressable>
          </View>
        ) : activeTab === "positions" ? (
          isLoading ? (
            <Text style={styles.contextText}>Loading positions...</Text>
          ) : errorText ? (
            <Text style={styles.contextText}>{errorText}</Text>
          ) : positions.length === 0 ? (
            <Text style={styles.contextText}>No positions yet.</Text>
          ) : (
            positions.map((position) => (
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
            ))
          )
        ) : activeTab === "trades" ? (
          closedPositions.length === 0 ? (
            <Text style={styles.contextText}>No closed positions yet.</Text>
          ) : (
            closedPositions.map((position) => (
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
            ))
          )
        ) : isActivityLoading ? (
          <Text style={styles.contextText}>Loading activity...</Text>
        ) : activityError ? (
          <Text style={styles.contextText}>{activityError}</Text>
        ) : activityRows.length === 0 ? (
          <Text style={styles.contextText}>No trade activity yet.</Text>
        ) : (
          activityRows.map((row) => (
            <View key={row.id} style={styles.positionRow}>
              <View style={styles.positionLeft}>
                <View style={styles.positionAvatar}>
                  <Text style={styles.positionAvatarText}>{row.tokenSymbol[0]}</Text>
                </View>
                <View style={styles.positionText}>
                  <Text style={styles.positionSymbol}>{row.tokenSymbol}</Text>
                  <Text style={styles.positionName}>{row.tokenName}</Text>
                </View>
              </View>
              <View style={styles.positionRight}>
                <Text
                  style={[
                    styles.actionPill,
                    row.action === "Buy" ? styles.pnlPositive : styles.pnlNegative,
                  ]}
                >
                  {row.action}
                </Text>
                <Text style={styles.positionValue}>{row.amountSol} SOL</Text>
                <Text style={styles.positionName}>{row.timeAgo}</Text>
              </View>
            </View>
          ))
        )}
      </SectionCard>

      {__DEV__ && params?.source ? (
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
    padding: qsSpacing.lg,
    gap: qsSpacing.md,
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
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tabPillActive: {
    borderColor: qsColors.accent,
    backgroundColor: "rgba(78, 163, 255, 0.15)",
  },
  tabText: {
    color: qsColors.textSubtle,
    fontSize: 11,
    fontWeight: "600",
  },
  tabTextActive: {
    color: qsColors.textPrimary,
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
    width: 32,
    height: 32,
    borderRadius: 16,
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
    fontSize: 13,
    fontWeight: "700",
  },
  positionName: {
    color: qsColors.textMuted,
    fontSize: 11,
  },
  positionRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  positionValue: {
    color: qsColors.textSecondary,
    fontSize: 11,
  },
  positionPnl: {
    fontSize: 11,
    fontWeight: "700",
  },
  actionPill: {
    fontSize: 10,
    fontWeight: "700",
    color: qsColors.textSecondary,
  },
  emptyState: {
    alignItems: "center",
    gap: qsSpacing.sm,
    paddingVertical: qsSpacing.sm,
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
