import { useCallback, useEffect, useRef, useState } from "react";

import * as Clipboard from "expo-clipboard";
import * as Linking from "expo-linking";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
  fetchReferralRates,
  fetchClaimHistory,
  requestClaim,
  setReferralCode,
  MIN_CLAIMABLE_REWARDS,
  type CumulativeEarnings,
  type UserClaimInfo,
  type EarningsByMint,
  type ReferralRates,
  type ClaimInfo,
} from "@/src/features/rewards/rewardsService";
import { qsColors, qsRadius, qsSpacing, qsTypography } from "@/src/theme/tokens";
import {
  Clock,
  Copy,
  Eye,
  ExternalLink,
  Gift,
  Info,
  Layers,
  Share2,
  SolanaIcon,
  Users,
  Zap,
} from "@/src/ui/icons";
import { EmptyState } from "@/src/ui/EmptyState";
import { SkeletonCard, SkeletonRow } from "@/src/ui/Skeleton";

type RewardsScreenProps = {
  rpcClient: RpcClient;
};

type RewardsTab = "earnings" | "history" | "tiers";

/* ── Formatters ── */

function formatSol(value?: number): string {
  if (value === undefined || !Number.isFinite(value)) return "—";
  if (value === 0) return "0.0000";
  if (Math.abs(value) >= 1000) return value.toFixed(0);
  if (Math.abs(value) >= 10) return value.toFixed(2);
  return value.toFixed(4);
}

function truncateMint(mint?: string): string {
  if (!mint) return "UNK";
  if (mint.length <= 10) return mint;
  return `${mint.slice(0, 4)}...${mint.slice(-4)}`;
}

function truncateSig(sig?: string): string {
  if (!sig) return "—";
  if (sig.length <= 12) return sig;
  return `${sig.slice(0, 6)}...${sig.slice(-4)}`;
}

function formatDate(ts: number): string {
  const d = new Date(ts * 1000);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function formatDateTime(ts: number): string {
  const d = new Date(ts * 1000);
  return `${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })} ${d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`;
}

const REFERRAL_CODE_REGEX = /^[a-zA-Z0-9]{1,15}$/;

export function RewardsScreen({ rpcClient }: RewardsScreenProps) {
  useAuthSession();
  const requestRef = useRef(0);

  /* ── State ── */
  const [earnings, setEarnings] = useState<CumulativeEarnings | null>(null);
  const [claimInfo, setClaimInfo] = useState<UserClaimInfo | null>(null);
  const [earningsByMint, setEarningsByMint] = useState<EarningsByMint[]>([]);
  const [referralCode, setReferralCodeState] = useState<string | null>(null);
  const [rates, setRates] = useState<ReferralRates | null>(null);
  const [claimHistory, setClaimHistory] = useState<ClaimInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [activeTab, setActiveTab] = useState<RewardsTab>("earnings");
  const [errorText, setErrorText] = useState<string | null>(null);

  // Referral code input
  const [codeInput, setCodeInput] = useState("");
  const [isSettingCode, setIsSettingCode] = useState(false);

  /* ── Data loading ── */
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
        const [nextEarnings, nextClaim, nextByMint, nextReferral, nextRates, nextHistory] =
          await Promise.all([
            fetchCumulativeEarnings(rpcClient).catch(() => null),
            fetchUserClaimInfo(rpcClient).catch(() => null),
            fetchEarningsByMint(rpcClient, { limit: 100, sort_order: false }).catch(() => []),
            fetchReferralCode(rpcClient).catch(() => null),
            fetchReferralRates(rpcClient).catch(() => null),
            fetchClaimHistory(rpcClient, { limit: 50, sort_order: false }).catch(() => []),
          ]);
        if (requestId !== requestRef.current) return;
        setEarnings(nextEarnings);
        setClaimInfo(nextClaim);
        setEarningsByMint(nextByMint as EarningsByMint[]);
        setReferralCodeState(nextReferral);
        setRates(nextRates);
        setClaimHistory(nextHistory as ClaimInfo[]);
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

  /* ── Handlers ── */
  const handleClaim = useCallback(async () => {
    if (isClaiming) return;
    const unclaimed = claimInfo?.unclaimed ?? 0;
    if (unclaimed < MIN_CLAIMABLE_REWARDS) {
      toast.error("Minimum Not Met", `You need at least ${MIN_CLAIMABLE_REWARDS} SOL to claim.`);
      return;
    }
    setIsClaiming(true);
    try {
      const result = await requestClaim(rpcClient);
      if (result) {
        haptics.success();
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
  }, [rpcClient, isClaiming, claimInfo, loadData]);

  const handleCopyReferral = useCallback(async () => {
    if (!referralCode) return;
    const link = `https://app.quickscope.gg/@${referralCode}`;
    await Clipboard.setStringAsync(link);
    haptics.success();
    toast.success("Copied", "Referral link copied to clipboard.");
  }, [referralCode]);

  const handleSetReferralCode = useCallback(async () => {
    const trimmed = codeInput.trim();
    if (!REFERRAL_CODE_REGEX.test(trimmed)) {
      toast.error("Invalid Code", "Code must be 1-15 alphanumeric characters.");
      return;
    }
    setIsSettingCode(true);
    try {
      const ok = await setReferralCode(rpcClient, trimmed);
      if (ok) {
        haptics.success();
        toast.success("Code Set", `Your referral code is now @${trimmed}`);
        setReferralCodeState(trimmed);
        setCodeInput("");
      } else {
        toast.error("Unavailable", "That code is already taken. Try another.");
      }
    } catch (error) {
      toast.error("Error", error instanceof Error ? error.message : "Failed to set code.");
    } finally {
      setIsSettingCode(false);
    }
  }, [rpcClient, codeInput]);

  /* ── Tabs ── */
  const tabs: { id: RewardsTab; label: string }[] = [
    { id: "earnings", label: "Earnings" },
    { id: "history", label: "History" },
    { id: "tiers", label: "Tiers" },
  ];

  /* ── Derived values ── */
  const totalEarnings = earnings?.total_earnings_including_cashback ?? 0;
  const scanEarnings = (earnings?.l1_earnings ?? 0) + (earnings?.l2_earnings ?? 0) + (earnings?.l3_earnings ?? 0);
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
          {/* ── Summary card ── */}
          <View style={styles.summaryCard}>
            <Text style={styles.sectionLabel}>Total Earned</Text>
            <View style={styles.summaryValueRow}>
              <SolanaIcon size={20} />
              <Text style={styles.summaryValue}>{formatSol(totalEarnings)}</Text>
              <Text style={styles.summaryUnit}>SOL</Text>
            </View>

            {/* Breakdown row */}
            <View style={styles.breakdownRow}>
              <BreakdownItem label="Scans" value={scanEarnings} />
              <BreakdownItem label="Referrals" value={earnings?.signup_earnings} />
              <BreakdownItem label="Groups" value={earnings?.tg_group_earnings} />
              <BreakdownItem label="Cashback" value={earnings?.cashback_earnings} />
            </View>
          </View>

          {/* ── Claim card ── */}
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
              disabled={isClaiming || unclaimed < MIN_CLAIMABLE_REWARDS}
              style={({ pressed }) => [
                styles.claimButton,
                (isClaiming || unclaimed < MIN_CLAIMABLE_REWARDS) && styles.claimButtonDisabled,
                pressed && !isClaiming && unclaimed >= MIN_CLAIMABLE_REWARDS && styles.claimButtonPressed,
              ]}
            >
              {isClaiming ? (
                <ActivityIndicator color={qsColors.textPrimary} size="small" />
              ) : (
                <Text style={styles.claimButtonText}>
                  {unclaimed >= MIN_CLAIMABLE_REWARDS
                    ? `Claim ${formatSol(unclaimed)} SOL`
                    : `Min ${MIN_CLAIMABLE_REWARDS} SOL to claim`}
                </Text>
              )}
            </Pressable>
          </View>

          {/* ── Referral section ── */}
          <View style={styles.referralCard}>
            {referralCode ? (
              <>
                <View style={styles.referralHeader}>
                  <Text style={styles.sectionLabel}>Your Referral Code</Text>
                  <Pressable onPress={handleCopyReferral} hitSlop={8}>
                    <Copy size={16} color={qsColors.textTertiary} />
                  </Pressable>
                </View>
                <Text style={styles.referralCodeText}>@{referralCode}</Text>
                <Text style={styles.referralHint}>
                  Share your link to earn commissions on referral trades.
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.sectionLabel}>Set Referral Code</Text>
                <Text style={styles.referralHint}>
                  Choose a unique code so others can sign up with your link.
                </Text>
                <View style={styles.referralInputRow}>
                  <TextInput
                    style={styles.referralInput}
                    placeholder="mycode"
                    placeholderTextColor={qsColors.textSubtle}
                    value={codeInput}
                    onChangeText={setCodeInput}
                    autoCapitalize="none"
                    autoCorrect={false}
                    maxLength={15}
                  />
                  <Pressable
                    onPress={handleSetReferralCode}
                    disabled={isSettingCode || !codeInput.trim()}
                    style={({ pressed }) => [
                      styles.setCodeButton,
                      (isSettingCode || !codeInput.trim()) && styles.setCodeButtonDisabled,
                      pressed && styles.claimButtonPressed,
                    ]}
                  >
                    {isSettingCode ? (
                      <ActivityIndicator color={qsColors.textPrimary} size="small" />
                    ) : (
                      <Text style={styles.setCodeButtonText}>Set</Text>
                    )}
                  </Pressable>
                </View>
              </>
            )}
          </View>

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
          {activeTab === "earnings" ? (
            <EarningsTab data={earningsByMint} />
          ) : activeTab === "history" ? (
            <ClaimHistoryTab data={claimHistory} />
          ) : (
            <TiersTab rates={rates} />
          )}
        </>
      )}
    </ScrollView>
  );
}

/* ── Sub-components ── */

function BreakdownItem({ label, value }: { label: string; value?: number }) {
  return (
    <View style={styles.breakdownItem}>
      <Text style={styles.breakdownLabel}>{label}</Text>
      <Text style={styles.breakdownValue}>{formatSol(value)}</Text>
    </View>
  );
}

function EarningsTab({ data }: { data: EarningsByMint[] }) {
  const filtered = data.filter((row) => row.total_earnings_including_cashback > 0);

  if (filtered.length === 0) {
    return (
      <EmptyState
        icon={Eye}
        title="No earnings yet"
        subtitle="Scan and trade tokens to start earning rewards."
      />
    );
  }

  return (
    <View style={styles.tableWrap}>
      <View style={styles.tableHeader}>
        <Text style={[styles.headerCell, styles.cellToken]}>Token</Text>
        <Text style={[styles.headerCell, styles.cellScan]}>Scans</Text>
        <Text style={[styles.headerCell, styles.cellScan]}>Refs</Text>
        <Text style={[styles.headerCell, styles.cellScan]}>Total</Text>
      </View>
      {filtered.map((row) => {
        const scans = row.l1_earnings + row.l2_earnings + row.l3_earnings;
        return (
          <View key={row.token_mint} style={styles.tableRow}>
            <Text numberOfLines={1} style={[styles.rowCell, styles.cellToken]}>
              {truncateMint(row.token_mint)}
            </Text>
            <Text style={[styles.rowCell, styles.cellScan]}>
              {formatSol(scans)}
            </Text>
            <Text style={[styles.rowCell, styles.cellScan]}>
              {formatSol(row.signup_earnings)}
            </Text>
            <Text style={[styles.rowCell, styles.cellScan, styles.textAccent]}>
              {formatSol(row.total_earnings_including_cashback)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function ClaimHistoryTab({ data }: { data: ClaimInfo[] }) {
  if (data.length === 0) {
    return (
      <EmptyState
        icon={Clock}
        title="No claim history"
        subtitle="Your past claims will appear here."
      />
    );
  }

  return (
    <View style={styles.tableWrap}>
      <View style={styles.tableHeader}>
        <Text style={[styles.headerCell, styles.cellToken]}>Date</Text>
        <Text style={[styles.headerCell, styles.cellScan]}>Amount</Text>
        <Text style={[styles.headerCell, styles.cellScan]}>Status</Text>
        <Text style={[styles.headerCell, { width: 60, textAlign: "right" }]}>Tx</Text>
      </View>
      {data.map((row, idx) => (
        <View key={row.signature || idx} style={styles.tableRow}>
          <Text numberOfLines={1} style={[styles.rowCell, styles.cellToken]}>
            {formatDateTime(row.last_update_ts)}
          </Text>
          <Text style={[styles.rowCell, styles.cellScan]}>
            {formatSol(row.claim_amount)}
          </Text>
          <Text
            style={[
              styles.rowCell,
              styles.cellScan,
              { color: row.status === "success" ? qsColors.buyGreen : qsColors.textTertiary },
            ]}
          >
            {row.status}
          </Text>
          <Pressable
            style={{ width: 60, alignItems: "flex-end", justifyContent: "center" }}
            onPress={() => {
              if (row.signature) {
                void Linking.openURL(`https://solscan.io/tx/${row.signature}`);
              }
            }}
            disabled={!row.signature}
            hitSlop={8}
          >
            {row.signature ? (
              <ExternalLink size={14} color={qsColors.accent} />
            ) : (
              <Text style={[styles.rowCell, { color: qsColors.textSubtle }]}>—</Text>
            )}
          </Pressable>
        </View>
      ))}
    </View>
  );
}

function TiersTab({ rates }: { rates: ReferralRates | null }) {
  if (!rates) {
    return (
      <EmptyState
        icon={Info}
        title="Tiers unavailable"
        subtitle="Unable to load reward tier information."
      />
    );
  }

  const tiers = [
    { label: "Level 1 Scan", rate: rates.l1_rate_bps, icon: Eye, desc: "Earn on tokens you scan first" },
    { label: "Level 2 Scan", rate: rates.l2_rate_bps, icon: Layers, desc: "Earn on second-level discoveries" },
    { label: "Level 3 Scan", rate: rates.l3_rate_bps, icon: Zap, desc: "Earn on third-level discoveries" },
  ];

  const bonuses = [
    { label: "User Referral", rate: rates.signup_rate_bps, icon: Users, desc: "Earn on all trades from your referrals" },
    { label: "Group Owner", rate: rates.tg_group_rate_bps, icon: Share2, desc: "Earn on trades from your Telegram group" },
    { label: "Cashback", rate: rates.cashback_rate_bps, icon: Gift, desc: "Earn back on your own trades" },
  ];

  return (
    <View style={styles.tiersWrap}>
      <Text style={styles.tiersSectionTitle}>Scan Tiers</Text>
      {tiers.map((t) => (
        <TierCard key={t.label} {...t} />
      ))}

      <Text style={[styles.tiersSectionTitle, { marginTop: qsSpacing.lg }]}>Bonus Programs</Text>
      {bonuses.map((b) => (
        <TierCard key={b.label} {...b} />
      ))}

      <Text style={styles.tiersFooter}>
        QuickScope is the only terminal where you earn from your alpha.
      </Text>
    </View>
  );
}

function TierCard({
  label,
  rate,
  icon: Icon,
  desc,
}: {
  label: string;
  rate: number;
  icon: React.ComponentType<{ size: number; color: string }>;
  desc: string;
}) {
  const pct = (rate / 100).toFixed(2);
  return (
    <View style={styles.tierCard}>
      <View style={styles.tierCardHeader}>
        <Icon size={16} color={qsColors.accent} />
        <Text style={styles.tierCardLabel}>{label}</Text>
        <Text style={styles.tierCardRate}>{pct}%</Text>
      </View>
      <Text style={styles.tierCardDesc}>{desc}</Text>
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

  // ── Section label (reused) ──
  sectionLabel: {
    color: qsColors.textTertiary,
    fontSize: 12,
    fontWeight: qsTypography.weight.medium,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },

  // ── Summary card ──
  summaryCard: {
    borderRadius: qsRadius.lg,
    backgroundColor: qsColors.layer1,
    padding: qsSpacing.lg,
    gap: qsSpacing.md,
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
  summaryUnit: {
    color: qsColors.textTertiary,
    fontSize: 16,
    fontWeight: qsTypography.weight.medium,
    alignSelf: "flex-end",
    marginBottom: 2,
  },

  // ── Breakdown row ──
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: qsColors.borderDefault,
    paddingTop: qsSpacing.md,
  },
  breakdownItem: {
    alignItems: "center",
    gap: 2,
  },
  breakdownLabel: {
    color: qsColors.textSubtle,
    fontSize: 10,
    fontWeight: qsTypography.weight.medium,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  breakdownValue: {
    color: qsColors.textSecondary,
    fontSize: 13,
    fontWeight: qsTypography.weight.semi,
    fontVariant: ["tabular-nums"],
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
  referralCodeText: {
    color: qsColors.accent,
    fontSize: 18,
    fontWeight: qsTypography.weight.bold,
  },
  referralHint: {
    color: qsColors.textSubtle,
    fontSize: 12,
  },
  referralInputRow: {
    flexDirection: "row",
    gap: qsSpacing.sm,
    marginTop: qsSpacing.xs,
  },
  referralInput: {
    flex: 1,
    backgroundColor: qsColors.layer2,
    borderRadius: qsRadius.md,
    paddingHorizontal: qsSpacing.md,
    paddingVertical: 10,
    color: qsColors.textPrimary,
    fontSize: 15,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
  },
  setCodeButton: {
    backgroundColor: qsColors.accent,
    borderRadius: qsRadius.md,
    paddingHorizontal: qsSpacing.xl,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  setCodeButtonDisabled: {
    backgroundColor: qsColors.layer3,
    opacity: 0.6,
  },
  setCodeButtonText: {
    color: qsColors.textPrimary,
    fontSize: 15,
    fontWeight: qsTypography.weight.bold,
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
    alignItems: "center",
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
  textAccent: {
    color: qsColors.accent,
    fontWeight: qsTypography.weight.semi,
  },

  // ── Tiers ──
  tiersWrap: {
    gap: qsSpacing.sm,
  },
  tiersSectionTitle: {
    color: qsColors.textSecondary,
    fontSize: 14,
    fontWeight: qsTypography.weight.semi,
  },
  tierCard: {
    backgroundColor: qsColors.layer1,
    borderRadius: qsRadius.md,
    padding: qsSpacing.md,
    gap: 4,
  },
  tierCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: qsSpacing.sm,
  },
  tierCardLabel: {
    color: qsColors.textPrimary,
    fontSize: 14,
    fontWeight: qsTypography.weight.semi,
    flex: 1,
  },
  tierCardRate: {
    color: qsColors.accent,
    fontSize: 16,
    fontWeight: qsTypography.weight.bold,
    fontVariant: ["tabular-nums"],
  },
  tierCardDesc: {
    color: qsColors.textSubtle,
    fontSize: 12,
    marginLeft: 24,
  },
  tiersFooter: {
    color: qsColors.textSubtle,
    fontSize: 11,
    textAlign: "center",
    marginTop: qsSpacing.md,
    fontStyle: "italic",
  },
});
