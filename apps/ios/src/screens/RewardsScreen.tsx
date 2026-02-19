import { useCallback, useEffect, useRef, useState } from "react";

import * as Clipboard from "expo-clipboard";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { haptics } from "@/src/lib/haptics";
import { toast } from "@/src/lib/toast";
import type { RpcClient } from "@/src/lib/api/rpcClient";
import { useAuthSession } from "@/src/features/auth/AuthSessionProvider";
import {
  fetchCumulativeEarnings,
  fetchUserClaimInfo,
  fetchEarningsByMint,
  fetchReferralCode,
  requestClaim,
  type CumulativeEarnings,
  type UserClaimInfo,
  type EarningsByMint,
} from "@/src/features/rewards/rewardsService";
import { qsColors, qsRadius, qsSpacing, qsTypography } from "@/src/theme/tokens";
import { Copy, Eye, Gift, Share2, SolanaIcon } from "@/src/ui/icons";
import { EmptyState } from "@/src/ui/EmptyState";
import { SkeletonCard, SkeletonRow } from "@/src/ui/Skeleton";

type RewardsScreenProps = {
  rpcClient: RpcClient;
};

type RewardsTab = "cashback" | "scans" | "referrals";

/* ── Formatters ── */

function formatSol(value?: number): string {
  if (value === undefined || !Number.isFinite(value)) return "0.0000";
  if (Math.abs(value) >= 1000) return value.toFixed(0);
  if (Math.abs(value) >= 10) return value.toFixed(2);
  return value.toFixed(4);
}

function truncateMint(mint?: string): string {
  if (!mint) return "UNK";
  if (mint.length <= 10) return mint;
  return `${mint.slice(0, 4)}...${mint.slice(-4)}`;
}

export function RewardsScreen({ rpcClient }: RewardsScreenProps) {
  useAuthSession(); // ensures auth context is available
  const requestRef = useRef(0);

  const [earnings, setEarnings] = useState<CumulativeEarnings | null>(null);
  const [claimInfo, setClaimInfo] = useState<UserClaimInfo | null>(null);
  const [earningsByMint, setEarningsByMint] = useState<EarningsByMint[]>([]);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [activeTab, setActiveTab] = useState<RewardsTab>("cashback");
  const [errorText, setErrorText] = useState<string | null>(null);

  const loadData = useCallback(
    async (options?: { refreshing?: boolean }) => {
      const requestId = ++requestRef.current;
      if (options?.refreshing) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setErrorText(null);

      try {
        const [nextEarnings, nextClaim, nextByMint, nextReferral] = await Promise.all([
          fetchCumulativeEarnings(rpcClient).catch(() => null),
          fetchUserClaimInfo(rpcClient).catch(() => null),
          fetchEarningsByMint(rpcClient, { limit: 100, sort_order: false }).catch(() => []),
          fetchReferralCode(rpcClient).catch(() => null),
        ]);
        if (requestId !== requestRef.current) return;
        setEarnings(nextEarnings);
        setClaimInfo(nextClaim);
        setEarningsByMint(nextByMint as EarningsByMint[]);
        setReferralCode(nextReferral);
      } catch (error) {
        if (requestId !== requestRef.current) return;
        setErrorText(error instanceof Error ? error.message : "Failed to load rewards.");
      } finally {
        if (requestId !== requestRef.current) return;
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [rpcClient]
  );

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleClaim = useCallback(async () => {
    if (isClaiming) return;
    setIsClaiming(true);
    try {
      const result = await requestClaim(rpcClient);
      if (result) {
        toast.success("Claim Submitted", "Your claim has been submitted and will be processed shortly.");
        void loadData({ refreshing: true });
      } else {
        toast.error("Claim Failed", "Unable to submit claim. Please try again later.");
      }
    } catch (error) {
      toast.error("Claim Error", error instanceof Error ? error.message : "An error occurred.");
    } finally {
      setIsClaiming(false);
    }
  }, [rpcClient, isClaiming, loadData]);

  const handleCopyReferral = useCallback(async () => {
    if (!referralCode) return;
    const link = `https://app.quickscope.gg?ref=${referralCode}`;
    await Clipboard.setStringAsync(link);
    haptics.success();
    toast.success("Copied", "Referral link copied to clipboard.");
  }, [referralCode]);

  /* ── Tabs ── */

  const tabs: { id: RewardsTab; label: string }[] = [
    { id: "cashback", label: "Cashback" },
    { id: "scans", label: "Scans" },
    { id: "referrals", label: "Referrals" },
  ];

  /* ── Render ── */

  const lifetimeEarnings = earnings?.cumulative_earnings ?? 0;
  const unclaimed = claimInfo?.unclaimed ?? 0;
  const pending = claimInfo?.pending ?? 0;
  const claimed = claimInfo?.claimed ?? 0;

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          tintColor={qsColors.textMuted}
          refreshing={isRefreshing}
          onRefresh={() => { haptics.light(); void loadData({ refreshing: true }); }}
        />
      }
    >
      {/* Error */}
      {errorText ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{errorText}</Text>
        </View>
      ) : null}

      {isLoading ? (
        <View style={{ gap: qsSpacing.lg }}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </View>
      ) : (
        <>
          {/* ── Summary section ── */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Lifetime Earnings</Text>
            <View style={styles.summaryValueRow}>
              <SolanaIcon size={20} />
              <Text style={styles.summaryValue}>{formatSol(lifetimeEarnings)}</Text>
              <Text style={styles.summaryValueSecondary}>SOL</Text>
            </View>
          </View>

          {/* ── Claim section ── */}
          <View style={styles.claimCard}>
            <View style={styles.claimStatsRow}>
              <View style={styles.claimStat}>
                <Text style={styles.claimStatLabel}>Unclaimed</Text>
                <Text style={styles.claimStatValue}>{formatSol(unclaimed)}</Text>
              </View>
              <View style={styles.claimStat}>
                <Text style={styles.claimStatLabel}>Pending</Text>
                <Text style={styles.claimStatValue}>{formatSol(pending)}</Text>
              </View>
              <View style={styles.claimStat}>
                <Text style={styles.claimStatLabel}>Claimed</Text>
                <Text style={styles.claimStatValue}>{formatSol(claimed)}</Text>
              </View>
            </View>

            <Pressable
              onPress={handleClaim}
              disabled={isClaiming || unclaimed <= 0}
              style={({ pressed }) => [
                styles.claimButton,
                (isClaiming || unclaimed <= 0) && styles.claimButtonDisabled,
                pressed && !isClaiming && unclaimed > 0 && styles.claimButtonPressed,
              ]}
            >
              {isClaiming ? (
                <ActivityIndicator color={qsColors.textPrimary} size="small" />
              ) : (
                <Text style={styles.claimButtonText}>
                  {unclaimed > 0 ? `Claim ${formatSol(unclaimed)} SOL` : "Nothing to claim"}
                </Text>
              )}
            </Pressable>
          </View>

          {/* ── Referral code ── */}
          {referralCode ? (
            <View style={styles.referralCard}>
              <View style={styles.referralHeader}>
                <Text style={styles.referralTitle}>Your Referral Code</Text>
                <Pressable onPress={handleCopyReferral} hitSlop={8}>
                  <Copy size={16} color={qsColors.textTertiary} />
                </Pressable>
              </View>
              <Text style={styles.referralCode}>{referralCode}</Text>
              <Text style={styles.referralHint}>
                Share your link to earn signup bonuses.
              </Text>
            </View>
          ) : null}

          {/* ── Tab bar ── */}
          <View style={styles.tabBar}>
            {tabs.map((tab) => {
              const isActive = tab.id === activeTab;
              return (
                <Pressable
                  key={tab.id}
                  onPress={() => { haptics.selection(); setActiveTab(tab.id); }}
                  style={[styles.tab, isActive && styles.tabActive]}
                >
                  <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* ── Tab content ── */}
          {activeTab === "cashback" ? (
            <CashbackTab data={earningsByMint} />
          ) : activeTab === "scans" ? (
            <ScansTab data={earningsByMint} />
          ) : (
            <ReferralsTab data={earningsByMint} />
          )}
        </>
      )}
    </ScrollView>
  );
}

/* ── Sub-components for tabs ── */

function CashbackTab({ data }: { data: EarningsByMint[] }) {
  const filtered = data.filter((row) => row.cashback_earnings > 0);

  if (filtered.length === 0) {
    return (
      <EmptyState
        icon={Gift}
        title="No cashback earnings yet"
        subtitle="Trade tokens to earn cashback rewards."
      />
    );
  }

  return (
    <View style={styles.tableWrap}>
      {/* Header */}
      <View style={styles.tableHeader}>
        <Text style={[styles.headerCell, styles.cellToken]}>Token</Text>
        <Text style={[styles.headerCell, styles.cellValue]}>Cashback (SOL)</Text>
      </View>
      {filtered.map((row) => (
        <View key={row.token_mint} style={styles.tableRow}>
          <Text numberOfLines={1} style={[styles.rowCell, styles.cellToken]}>
            {truncateMint(row.token_mint)}
          </Text>
          <Text style={[styles.rowCell, styles.cellValue]}>
            {formatSol(row.cashback_earnings)}
          </Text>
        </View>
      ))}
    </View>
  );
}

function ScansTab({ data }: { data: EarningsByMint[] }) {
  const filtered = data.filter(
    (row) => row.l1_earnings > 0 || row.l2_earnings > 0 || row.l3_earnings > 0
  );

  if (filtered.length === 0) {
    return (
      <EmptyState
        icon={Eye}
        title="No scan earnings yet"
        subtitle="Scan tokens to earn rewards on discoveries."
      />
    );
  }

  return (
    <View style={styles.tableWrap}>
      {/* Header */}
      <View style={styles.tableHeader}>
        <Text style={[styles.headerCell, styles.cellToken]}>Token</Text>
        <Text style={[styles.headerCell, styles.cellScan]}>L1</Text>
        <Text style={[styles.headerCell, styles.cellScan]}>L2</Text>
        <Text style={[styles.headerCell, styles.cellScan]}>L3</Text>
      </View>
      {filtered.map((row) => (
        <View key={row.token_mint} style={styles.tableRow}>
          <Text numberOfLines={1} style={[styles.rowCell, styles.cellToken]}>
            {truncateMint(row.token_mint)}
          </Text>
          <Text style={[styles.rowCell, styles.cellScan]}>
            {formatSol(row.l1_earnings)}
          </Text>
          <Text style={[styles.rowCell, styles.cellScan]}>
            {formatSol(row.l2_earnings)}
          </Text>
          <Text style={[styles.rowCell, styles.cellScan]}>
            {formatSol(row.l3_earnings)}
          </Text>
        </View>
      ))}
    </View>
  );
}

function ReferralsTab({ data }: { data: EarningsByMint[] }) {
  const filtered = data.filter((row) => row.signup_earnings > 0);

  if (filtered.length === 0) {
    return (
      <EmptyState
        icon={Share2}
        title="No referral earnings yet"
        subtitle="Share your referral link to earn commissions."
      />
    );
  }

  return (
    <View style={styles.tableWrap}>
      {/* Header */}
      <View style={styles.tableHeader}>
        <Text style={[styles.headerCell, styles.cellToken]}>Token</Text>
        <Text style={[styles.headerCell, styles.cellValue]}>Signup (SOL)</Text>
      </View>
      {filtered.map((row) => (
        <View key={row.token_mint} style={styles.tableRow}>
          <Text numberOfLines={1} style={[styles.rowCell, styles.cellToken]}>
            {truncateMint(row.token_mint)}
          </Text>
          <Text style={[styles.rowCell, styles.cellValue]}>
            {formatSol(row.signup_earnings)}
          </Text>
        </View>
      ))}
    </View>
  );
}

/* ── Styles ── */

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: qsColors.layer0,
  },
  content: {
    paddingTop: qsSpacing.md,
    paddingBottom: 140,
    gap: qsSpacing.lg,
    paddingHorizontal: qsSpacing.lg,
  },

  // ── Error ──
  errorBox: {
    borderRadius: qsRadius.md,
    backgroundColor: qsColors.dangerDark,
    padding: qsSpacing.md,
  },
  errorText: {
    color: qsColors.dangerLight,
    fontSize: 12,
  },

  // ── Summary card ──
  summaryCard: {
    borderRadius: qsRadius.lg,
    backgroundColor: qsColors.layer1,
    padding: qsSpacing.lg,
    gap: qsSpacing.sm,
  },
  summaryTitle: {
    color: qsColors.textTertiary,
    fontSize: 12,
    fontWeight: qsTypography.weight.medium,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  summaryValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  summaryValue: {
    color: qsColors.textPrimary,
    fontSize: 28,
    fontWeight: qsTypography.weight.bold,
    fontVariant: ["tabular-nums"],
  },
  summaryValueSecondary: {
    color: qsColors.textTertiary,
    fontSize: 16,
    fontWeight: qsTypography.weight.medium,
    alignSelf: "flex-end",
    marginBottom: 2,
  },

  // ── Claim card ──
  claimCard: {
    borderRadius: qsRadius.lg,
    backgroundColor: qsColors.layer1,
    padding: qsSpacing.lg,
    gap: qsSpacing.md,
  },
  claimStatsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  claimStat: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  claimStatLabel: {
    color: qsColors.textTertiary,
    fontSize: 11,
    fontWeight: qsTypography.weight.medium,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  claimStatValue: {
    color: qsColors.textPrimary,
    fontSize: 16,
    fontWeight: qsTypography.weight.bold,
    fontVariant: ["tabular-nums"],
  },
  claimButton: {
    backgroundColor: qsColors.accent,
    borderRadius: qsRadius.md,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  claimButtonDisabled: {
    backgroundColor: qsColors.layer3,
    opacity: 0.6,
  },
  claimButtonPressed: {
    backgroundColor: qsColors.accentDeep,
  },
  claimButtonText: {
    color: qsColors.textPrimary,
    fontSize: 15,
    fontWeight: qsTypography.weight.bold,
  },

  // ── Referral card ──
  referralCard: {
    borderRadius: qsRadius.lg,
    backgroundColor: qsColors.layer1,
    padding: qsSpacing.lg,
    gap: qsSpacing.sm,
  },
  referralHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  referralTitle: {
    color: qsColors.textTertiary,
    fontSize: 12,
    fontWeight: qsTypography.weight.medium,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  referralCode: {
    color: qsColors.accent,
    fontSize: 18,
    fontWeight: qsTypography.weight.bold,
    fontVariant: ["tabular-nums"],
  },
  referralHint: {
    color: qsColors.textSubtle,
    fontSize: 12,
  },

  // ── Tab bar ──
  tabBar: {
    flexDirection: "row",
    gap: qsSpacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: qsColors.borderDefault,
    paddingBottom: 0,
  },
  tab: {
    paddingVertical: qsSpacing.sm,
    paddingHorizontal: qsSpacing.xs,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: qsColors.accent,
  },
  tabText: {
    color: qsColors.textTertiary,
    fontSize: 13,
    fontWeight: qsTypography.weight.semi,
  },
  tabTextActive: {
    color: qsColors.textPrimary,
  },

  // ── Table ──
  tableWrap: {
    gap: 0,
  },
  tableHeader: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: qsColors.borderDefault,
  },
  headerCell: {
    color: qsColors.textTertiary,
    fontSize: 11,
    fontWeight: qsTypography.weight.semi,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: qsColors.borderDefault,
  },
  rowCell: {
    color: qsColors.textPrimary,
    fontSize: 13,
    fontVariant: ["tabular-nums"],
  },
  cellToken: {
    flex: 1,
  },
  cellValue: {
    width: 100,
    textAlign: "right",
  },
  cellScan: {
    width: 70,
    textAlign: "right",
  },

});
