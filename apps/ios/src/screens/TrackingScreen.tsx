import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useNavigation, type NavigationProp } from "@react-navigation/native";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { haptics } from "@/src/lib/haptics";
import type { RpcClient } from "@/src/lib/api/rpcClient";
import { useAuthSession } from "@/src/features/auth/AuthSessionProvider";
import { TrackingFloatingNav, type TrackingTabId } from "@/src/ui/TrackingFloatingNav";
import {
  fetchWalletActivity,
  fetchWalletWatchlist,
  fetchWalletWatchlists,
  type AllTransactionsTableRow,
  type TrackedWallet,
  type WalletWatchlist,
} from "@/src/features/tracking/trackingService";
import {
  fetchTelegramEvents,
  type TelegramEvent,
} from "@/src/features/tracking/telegramEventsService";
import {
  fetchTokenWatchlists,
  fetchWatchlistTokens,
  type EnrichedWatchlistToken,
  type TokenWatchlist,
} from "@/src/features/watchlist/tokenWatchlistService";
import type { RootStack, RootTabs, TrackingRouteParams } from "@/src/navigation/types";
import { qsColors, qsRadius, qsSpacing, qsTypography } from "@/src/theme/tokens";
import { Activity, Eye, MessageCircle, Star, TrendingDown, TrendingUp, Wallet } from "@/src/ui/icons";
import { EmptyState } from "@/src/ui/EmptyState";
import { SkeletonRow } from "@/src/ui/Skeleton";
import { TokenAvatar } from "@/src/ui/TokenAvatar";

/* ─── Types ─── */

type TrackingScreenProps = {
  rpcClient: RpcClient;
  params?: TrackingRouteParams;
};

// TrackingTabId imported from TrackingFloatingNav

const TAB_TITLES: Record<TrackingTabId, string> = {
  wallets: "Wallets",
  tokens: "Tokens",
  chats: "Chats",
};

/* ─── Wallet activity types ─── */

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

/* ─── Formatters ─── */

function formatCompactUsd(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "$0";
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  if (value >= 1) return `$${value.toFixed(0)}`;
  return `$${value.toFixed(4)}`;
}

function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return "0%";
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${value.toFixed(1)}%`;
}

function formatCompactNumber(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "0";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(Math.round(value));
}

function formatAmount(value: number): string {
  if (!Number.isFinite(value)) return "--";
  if (value >= 1000) return value.toFixed(0);
  if (value >= 10) return value.toFixed(2);
  return value.toFixed(3);
}

function formatTimeAgo(unixSeconds: number): string {
  if (!Number.isFinite(unixSeconds) || unixSeconds <= 0) return "--";
  const delta = Math.max(0, Math.floor(Date.now() / 1000) - unixSeconds);
  if (delta < 60) return `${delta}s`;
  if (delta < 3600) return `${Math.floor(delta / 60)}m`;
  if (delta < 86400) return `${Math.floor(delta / 3600)}h`;
  return `${Math.floor(delta / 86400)}d`;
}

function resolveWalletLabel(wallets: TrackedWallet[], maker: string): string {
  const wallet = wallets.find((entry) => entry.public_key === maker);
  return wallet?.name || `${maker.slice(0, 4)}...${maker.slice(-4)}`;
}

/* ─── Sub-components ─── */

function ActionPill({ action }: { action: ActivityRow["action"] }) {
  const isBuy = action === "Buy";
  const isSell = action === "Sell";
  const pillStyle = [
    styles.actionPill,
    isBuy ? styles.buyPill : isSell ? styles.sellPill : styles.neutralPill,
  ];
  const textColor = isBuy
    ? qsColors.buyGreen
    : isSell
      ? qsColors.sellRed
      : qsColors.textSecondary;

  return (
    <View style={pillStyle}>
      {isBuy ? (
        <TrendingUp size={11} color={qsColors.buyGreen} />
      ) : isSell ? (
        <TrendingDown size={11} color={qsColors.sellRed} />
      ) : null}
      <Text style={[styles.actionPillText, { color: textColor }]}>{action}</Text>
    </View>
  );
}

/* ─── Main component ─── */

export function TrackingScreen({ rpcClient, params }: TrackingScreenProps) {
  const navigation = useNavigation<BottomTabNavigationProp<RootTabs>>();
  const rootNavigation = navigation.getParent<NavigationProp<RootStack>>();
  useAuthSession(); // ensures auth context is available
  const requestRef = useRef(0);

  const [activeTab, setActiveTab] = useState<TrackingTabId>("wallets");
  const [navExpanded, setNavExpanded] = useState(false);
  const scrollOffsetRef = useRef(0);

  // Dynamic header title based on active tab
  useLayoutEffect(() => {
    navigation.setOptions({ title: TAB_TITLES[activeTab] });
  }, [activeTab, navigation]);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  // ── Tokens tab state ──
  const [tokenWatchlists, setTokenWatchlists] = useState<TokenWatchlist[]>([]);
  const [activeTokenWatchlistId, setActiveTokenWatchlistId] = useState<number | null>(null);
  const [watchlistTokens, setWatchlistTokens] = useState<EnrichedWatchlistToken[]>([]);

  // ── Wallets tab state ──
  const [walletWatchlists, setWalletWatchlists] = useState<WalletWatchlist[]>([]);
  const [activeWalletWatchlistId, setActiveWalletWatchlistId] = useState<string | null>(null);
  const [trackedWallets, setTrackedWallets] = useState<TrackedWallet[]>([]);
  const [activity, setActivity] = useState<ActivityRow[]>([]);

  // ── Chats tab state ──
  const [telegramEvents, setTelegramEvents] = useState<TelegramEvent[]>([]);

  /* ═══ Tokens tab loading ═══ */

  const loadTokensTab = useCallback(
    async (options?: { refreshing?: boolean }) => {
      const requestId = ++requestRef.current;
      if (options?.refreshing) setIsRefreshing(true);
      else setIsLoading(true);
      setErrorText(null);

      try {
        const lists = await fetchTokenWatchlists(rpcClient);
        if (requestId !== requestRef.current) return;
        setTokenWatchlists(lists ?? []);

        const targetId = activeTokenWatchlistId ?? lists?.[0]?.id ?? null;
        if (targetId !== activeTokenWatchlistId) setActiveTokenWatchlistId(targetId);

        const targetList = (lists ?? []).find((l) => l.id === targetId);
        const mints = targetList?.tokens ?? [];

        if (mints.length > 0) {
          const tokens = await fetchWatchlistTokens(rpcClient, mints);
          if (requestId !== requestRef.current) return;
          setWatchlistTokens(tokens);
        } else {
          setWatchlistTokens([]);
        }
      } catch (error) {
        if (requestId !== requestRef.current) return;
        setErrorText(error instanceof Error ? error.message : "Failed to load token watchlist.");
      } finally {
        if (requestId !== requestRef.current) return;
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [rpcClient, activeTokenWatchlistId]
  );

  /* ═══ Wallets tab loading ═══ */

  const loadWalletsTab = useCallback(
    async (options?: { refreshing?: boolean }) => {
      const requestId = ++requestRef.current;
      if (options?.refreshing) setIsRefreshing(true);
      else setIsLoading(true);
      setErrorText(null);

      try {
        const lists = await fetchWalletWatchlists(rpcClient);
        if (requestId !== requestRef.current) return;
        setWalletWatchlists(lists ?? []);

        const targetId = activeWalletWatchlistId ?? lists?.[0]?.list_id?.toString() ?? null;
        if (targetId !== activeWalletWatchlistId) setActiveWalletWatchlistId(targetId);

        if (!targetId) {
          setTrackedWallets([]);
          setActivity([]);
          return;
        }

        const watchlist = await fetchWalletWatchlist(rpcClient, Number(targetId));
        if (requestId !== requestRef.current) return;
        const wallets = watchlist.wallets ?? [];
        setTrackedWallets(wallets);

        if (wallets.length === 0) {
          setActivity([]);
          return;
        }

        const walletAddresses = wallets.map((w) => w.public_key);
        const data = await fetchWalletActivity(rpcClient, walletAddresses);
        if (requestId !== requestRef.current) return;

        const tokenInfoMap = data.mint_to_token_info ?? {};
        const mapped = (data.table?.rows ?? []).map((row: AllTransactionsTableRow) => {
          const tokenInfo = tokenInfoMap[row.mint]?.token_metadata;
          return {
            id: row.signature || row.index,
            tokenSymbol: tokenInfo?.symbol ?? row.mint.slice(0, 4),
            tokenName: tokenInfo?.name ?? "Unknown token",
            tokenAddress: row.mint,
            walletLabel: resolveWalletLabel(wallets, row.maker),
            action: ACTION_LABELS[row.type] ?? ("Buy" as const),
            amountSol: formatAmount(row.amount_quote ?? 0),
            timeAgo: formatTimeAgo(row.ts),
          };
        });
        setActivity(mapped);
      } catch (error) {
        if (requestId !== requestRef.current) return;
        setErrorText(error instanceof Error ? error.message : "Failed to load wallet activity.");
      } finally {
        if (requestId !== requestRef.current) return;
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [rpcClient, activeWalletWatchlistId]
  );

  /* ═══ Chats tab loading ═══ */

  const loadChatsTab = useCallback(
    async (options?: { refreshing?: boolean }) => {
      const requestId = ++requestRef.current;
      if (options?.refreshing) setIsRefreshing(true);
      else setIsLoading(true);
      setErrorText(null);

      try {
        const events = await fetchTelegramEvents(rpcClient);
        if (requestId !== requestRef.current) return;
        setTelegramEvents(events);
      } catch (error) {
        if (requestId !== requestRef.current) return;
        setErrorText(error instanceof Error ? error.message : "Failed to load chat events.");
      } finally {
        if (requestId !== requestRef.current) return;
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [rpcClient]
  );

  /* ═══ Tab change / load effect ═══ */

  const loadCurrentTab = useCallback(
    (options?: { refreshing?: boolean }) => {
      if (activeTab === "tokens") return loadTokensTab(options);
      if (activeTab === "wallets") return loadWalletsTab(options);
      return loadChatsTab(options);
    },
    [activeTab, loadTokensTab, loadWalletsTab, loadChatsTab]
  );

  useEffect(() => {
    void loadCurrentTab();
  }, [loadCurrentTab]);

  const handleOpenTokenDetail = useCallback(
    (tokenAddress: string, symbol?: string) => {
      rootNavigation?.navigate("TokenDetail", {
        source: "deep-link",
        tokenAddress,
        symbol,
      });
    },
    [rootNavigation]
  );

  /* ═══ Render helpers ═══ */

  /** Watchlist sub-pills (below main tabs) */
  function renderWatchlistPills() {
    if (activeTab === "tokens" && tokenWatchlists.length > 0) {
      return (
        <View style={styles.watchlistPills}>
          {tokenWatchlists.map((wl) => {
            const active = wl.id === activeTokenWatchlistId;
            return (
              <Pressable
                key={wl.id}
                style={[styles.watchlistPill, active && styles.watchlistPillActive]}
                onPress={() => setActiveTokenWatchlistId(wl.id)}
              >
                <Text style={[styles.watchlistPillText, active && styles.watchlistPillTextActive]}>
                  {wl.name} ({wl.tokens.length})
                </Text>
              </Pressable>
            );
          })}
        </View>
      );
    }

    if (activeTab === "wallets" && walletWatchlists.length > 0) {
      return (
        <View style={styles.watchlistPills}>
          {walletWatchlists.map((wl) => {
            const id = wl.list_id.toString();
            const active = id === activeWalletWatchlistId;
            return (
              <Pressable
                key={wl.list_id}
                style={[styles.watchlistPill, active && styles.watchlistPillActive]}
                onPress={() => setActiveWalletWatchlistId(id)}
              >
                <Text style={[styles.watchlistPillText, active && styles.watchlistPillTextActive]}>
                  {wl.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      );
    }

    return null;
  }

  /** Tab-specific column headers */
  function renderColumnHeaders() {
    if (activeTab === "tokens" && watchlistTokens.length > 0) {
      return (
        <View style={styles.columnHeaders}>
          <View style={styles.colHeaderLeft}>
            <Text style={styles.colHeaderText}>Token</Text>
          </View>
          <View style={styles.colHeaderMetric}>
            <Text style={styles.colHeaderText}>MC</Text>
          </View>
          <View style={styles.colHeaderMetric}>
            <Text style={styles.colHeaderText}>1h%</Text>
          </View>
        </View>
      );
    }

    if (activeTab === "wallets" && activity.length > 0) {
      return (
        <View style={styles.columnHeaders}>
          <View style={styles.colHeaderLeft}>
            <Text style={styles.colHeaderText}>Activity</Text>
          </View>
          <View style={styles.colHeaderRight}>
            <Text style={styles.colHeaderText}>Amount</Text>
          </View>
        </View>
      );
    }

    if (activeTab === "chats" && telegramEvents.length > 0) {
      return (
        <View style={styles.columnHeaders}>
          <View style={styles.colHeaderLeft}>
            <Text style={styles.colHeaderText}>Token</Text>
          </View>
          <View style={styles.colHeaderRight}>
            <Text style={styles.colHeaderText}>Return</Text>
          </View>
        </View>
      );
    }

    return null;
  }

  /** Tab-specific summary line */
  function renderSummary() {
    if (activeTab === "wallets" && trackedWallets.length > 0) {
      return (
        <View style={styles.summaryRow}>
          <Eye size={14} color={qsColors.textSubtle} />
          <Text style={styles.summaryText}>
            {trackedWallets.length} wallet{trackedWallets.length !== 1 ? "s" : ""} tracked
          </Text>
        </View>
      );
    }

    if (activeTab === "chats" && telegramEvents.length > 0) {
      return (
        <View style={styles.summaryRow}>
          <MessageCircle size={14} color={qsColors.textSubtle} />
          <Text style={styles.summaryText}>
            {telegramEvents.length} recent event{telegramEvents.length !== 1 ? "s" : ""}
          </Text>
        </View>
      );
    }

    return null;
  }

  /** Empty state per tab */
  function renderEmptyState() {
    if (isLoading) return null;

    if (activeTab === "tokens") {
      if (tokenWatchlists.length === 0) {
        return (
          <EmptyState
            icon={Star}
            title="No token watchlists"
            subtitle="Create a watchlist to track your favorite tokens."
          />
        );
      }
      if (watchlistTokens.length === 0) {
        return (
          <EmptyState
            icon={Eye}
            title="No tokens in this list"
            subtitle="Add tokens to this watchlist from the discovery or search screen."
          />
        );
      }
    }

    if (activeTab === "wallets") {
      if (walletWatchlists.length === 0) {
        return (
          <EmptyState
            icon={Wallet}
            title="No wallet watchlists"
            subtitle="Track wallet activity by adding wallets to watch."
          />
        );
      }
      if (trackedWallets.length === 0) {
        return (
          <EmptyState
            icon={Wallet}
            title="No wallets tracked"
            subtitle="Add wallets to monitor their trading activity."
          />
        );
      }
      if (activity.length === 0) {
        return (
          <EmptyState
            icon={Activity}
            title="No activity yet"
            subtitle="Tracked wallet activity will appear here."
          />
        );
      }
    }

    if (activeTab === "chats") {
      if (telegramEvents.length === 0) {
        return (
          <EmptyState
            icon={MessageCircle}
            title="No chat events"
            subtitle="Connect Telegram channels to see token mentions."
          />
        );
      }
    }

    return null;
  }

  /* ─── Build the flat list data based on active tab ─── */

  type ListItem =
    | { type: "token"; data: EnrichedWatchlistToken }
    | { type: "activity"; data: ActivityRow }
    | { type: "chat"; data: TelegramEvent };

  let listData: ListItem[] = [];
  if (activeTab === "tokens") {
    listData = watchlistTokens.map((t) => ({ type: "token" as const, data: t }));
  } else if (activeTab === "wallets") {
    listData = activity.map((a) => ({ type: "activity" as const, data: a }));
  } else {
    listData = telegramEvents.map((e) => ({ type: "chat" as const, data: e }));
  }

  const handleTabChange = (tab: TrackingTabId) => {
    setActiveTab(tab);
    // Collapse after a short delay so user sees the switch
    setTimeout(() => setNavExpanded(false), 300);
  };

  const handleScroll = useCallback((event: { nativeEvent: { contentOffset: { y: number } } }) => {
    const y = event.nativeEvent.contentOffset.y;
    scrollOffsetRef.current = y;

    // Collapse popout if user scrolls while expanded
    if (y > 20 && navExpanded) {
      setNavExpanded(false);
    }
  }, [navExpanded]);

  return (
    <View style={styles.page}>
    <FlatList
      data={listData}
      keyExtractor={(item, index) => {
        if (item.type === "token") return item.data.mint;
        if (item.type === "activity") return item.data.id;
        return String(item.data.id ?? index);
      }}
      contentContainerStyle={styles.content}
      style={{ flex: 1 }}
      onScroll={handleScroll}
      scrollEventThrottle={16}
      refreshControl={
        <RefreshControl
          tintColor={qsColors.textMuted}
          refreshing={isRefreshing}
          onRefresh={() => {
            haptics.light();
            void loadCurrentTab({ refreshing: true });
          }}
        />
      }
      ListHeaderComponent={
        <View style={styles.headerWrap}>
          {/* Deep link context */}
          {params?.source ? (
            <View style={styles.deepLinkNote}>
              <Text style={styles.deepLinkTitle}>Opened from deep link</Text>
            </View>
          ) : null}

          {/* Error */}
          {errorText ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorText}</Text>
              <Pressable
                style={styles.retryButton}
                onPress={() => { void loadCurrentTab(); }}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </Pressable>
            </View>
          ) : null}

          {/* Loading */}
          {isLoading ? (
            <View style={{ gap: 4 }}>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </View>
          ) : null}

          {/* ── Watchlist sub-pills ── */}
          {renderWatchlistPills()}

          {/* ── Summary line ── */}
          {renderSummary()}

          {/* ── Column headers ── */}
          {renderColumnHeaders()}
        </View>
      }
      renderItem={({ item }) => {
        /* ── Token watchlist row ── */
        if (item.type === "token") {
          const token = item.data;
          const isPositive = token.oneHourChangePercent >= 0;
          return (
            <Pressable
              style={styles.rowItem}
              onPress={() => handleOpenTokenDetail(token.mint, token.symbol)}
            >
              <View style={styles.rowMain}>
                <TokenAvatar uri={token.imageUri} size={36} />
                <View style={styles.nameColumn}>
                  <Text numberOfLines={1} style={styles.tokenSymbol}>
                    {token.symbol}
                  </Text>
                  <Text numberOfLines={1} style={styles.tokenName}>
                    {token.name}
                  </Text>
                </View>
                <View style={styles.metricCol}>
                  <Text numberOfLines={1} style={styles.metricValue}>
                    {formatCompactUsd(token.marketCapUsd)}
                  </Text>
                  <Text numberOfLines={1} style={styles.metricSub}>
                    {formatCompactUsd(token.oneHourVolumeUsd)} vol
                  </Text>
                </View>
                <View style={styles.metricCol}>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.changeValue,
                      { color: isPositive ? qsColors.buyGreen : qsColors.sellRed },
                    ]}
                  >
                    {formatPercent(token.oneHourChangePercent)}
                  </Text>
                  <Text numberOfLines={1} style={styles.metricSub}>
                    {formatCompactNumber(token.holders)} hldr
                  </Text>
                </View>
              </View>
            </Pressable>
          );
        }

        /* ── Wallet activity row ── */
        if (item.type === "activity") {
          const row = item.data;
          return (
            <Pressable
              style={styles.rowItem}
              onPress={() => handleOpenTokenDetail(row.tokenAddress, row.tokenSymbol)}
            >
              <View style={styles.rowMain}>
                <View style={styles.tokenAvatar}>
                  <Text style={styles.tokenAvatarText}>{row.tokenSymbol[0]}</Text>
                </View>
                <View style={styles.nameColumn}>
                  <View style={styles.nameRow}>
                    <Text numberOfLines={1} style={styles.tokenSymbol}>
                      {row.tokenSymbol}
                    </Text>
                    <ActionPill action={row.action} />
                  </View>
                  <Text numberOfLines={1} style={styles.tokenName}>
                    {row.tokenName}
                  </Text>
                </View>
                <View style={styles.metricCol}>
                  <Text numberOfLines={1} style={styles.metricValue}>
                    {row.amountSol} SOL
                  </Text>
                  <Text numberOfLines={1} style={styles.metricSub}>
                    {row.timeAgo}
                  </Text>
                </View>
              </View>
              <View style={styles.rowFooter}>
                <Wallet size={10} color={qsColors.textSubtle} />
                <Text numberOfLines={1} style={styles.walletLabel}>
                  {row.walletLabel}
                </Text>
              </View>
            </Pressable>
          );
        }

        /* ── Telegram chat event row ── */
        const event = item.data;
        const returnPositive = event.peakReturnPercent >= 0;
        return (
          <Pressable
            style={styles.rowItem}
            onPress={() => handleOpenTokenDetail(event.mint, event.symbol)}
          >
            <View style={styles.rowMain}>
              <TokenAvatar uri={event.imageUri} size={36} />
              <View style={styles.nameColumn}>
                <Text numberOfLines={1} style={styles.tokenSymbol}>
                  {event.symbol}
                </Text>
                <Text numberOfLines={1} style={styles.tokenName}>
                  {event.eventType} · {formatTimeAgo(event.timestamp)}
                </Text>
              </View>
              <View style={styles.metricCol}>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.changeValue,
                    { color: returnPositive ? qsColors.buyGreen : qsColors.sellRed },
                  ]}
                >
                  {formatPercent(event.peakReturnPercent)}
                </Text>
                <Text numberOfLines={1} style={styles.metricSub}>
                  peak
                </Text>
              </View>
            </View>
            {event.chatId ? (
              <View style={styles.rowFooter}>
                <MessageCircle size={10} color={qsColors.textSubtle} />
                <Text numberOfLines={1} style={styles.walletLabel}>
                  {event.chatId}
                </Text>
              </View>
            ) : null}
          </Pressable>
        );
      }}
      ListEmptyComponent={renderEmptyState()}
    />
    <TrackingFloatingNav
      activeTab={activeTab}
      onTabChange={handleTabChange}
      expanded={navExpanded}
      onToggle={() => setNavExpanded((prev) => !prev)}
    />
    </View>
  );
}

/* ═══════════════════════════ Styles ═══════════════════════════ */

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: qsColors.layer0,
  },
  content: {
    paddingTop: qsSpacing.xs,
    paddingBottom: 140,
  },
  headerWrap: {
    gap: qsSpacing.md,
    marginBottom: qsSpacing.sm,
    paddingHorizontal: qsSpacing.lg,
  },

  // ── Watchlist sub-pills ──
  watchlistPills: {
    flexDirection: "row",
    gap: qsSpacing.xs,
    flexWrap: "wrap",
  },
  watchlistPill: {
    borderRadius: qsRadius.pill,
    backgroundColor: qsColors.layer2,
    paddingVertical: qsSpacing.xs,
    paddingHorizontal: qsSpacing.md,
  },
  watchlistPillActive: {
    backgroundColor: qsColors.accent,
  },
  watchlistPillText: {
    color: qsColors.textTertiary,
    fontSize: 12,
    fontWeight: qsTypography.weight.medium,
  },
  watchlistPillTextActive: {
    color: qsColors.textPrimary,
  },

  // ── Summary line ──
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  summaryText: {
    color: qsColors.textSubtle,
    fontSize: 12,
    fontWeight: qsTypography.weight.medium,
  },

  // ── Column headers ──
  columnHeaders: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  colHeaderLeft: {
    flex: 1,
  },
  colHeaderMetric: {
    alignItems: "flex-end",
    minWidth: 64,
  },
  colHeaderRight: {
    alignItems: "flex-end",
    minWidth: 80,
  },
  colHeaderText: {
    color: qsColors.textSubtle,
    fontSize: 10,
    fontWeight: qsTypography.weight.semi,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // ── Deep link / error / loading ──
  deepLinkNote: {
    borderRadius: qsRadius.md,
    backgroundColor: qsColors.layer1,
    padding: qsSpacing.md,
    gap: 4,
  },
  deepLinkTitle: {
    color: qsColors.textMuted,
    fontSize: 12,
  },
  errorBox: {
    borderRadius: qsRadius.md,
    backgroundColor: qsColors.dangerDark,
    padding: qsSpacing.md,
    gap: 4,
  },
  errorText: {
    color: qsColors.dangerLight,
    fontSize: 12,
  },
  retryButton: {
    marginTop: 4,
    alignSelf: "flex-start",
    borderRadius: qsRadius.sm,
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: qsColors.dangerBg,
  },
  retryButtonText: {
    color: qsColors.dangerLight,
    fontSize: 11,
    fontWeight: qsTypography.weight.bold,
  },

  // ── Rows (shared across tabs) ──
  rowItem: {
    paddingHorizontal: qsSpacing.lg,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: qsColors.layer0,
  },
  rowMain: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  // Token image (for tokens/chats tabs)
  tokenImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: qsColors.layer3,
  },

  // Token avatar fallback (for wallets tab)
  tokenAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: qsColors.layer2,
    alignItems: "center",
    justifyContent: "center",
  },
  tokenAvatarText: {
    color: qsColors.textPrimary,
    fontSize: 14,
    fontWeight: qsTypography.weight.bold,
  },

  // Name column
  nameColumn: {
    flex: 1,
    gap: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  tokenSymbol: {
    color: qsColors.textPrimary,
    fontSize: 14,
    fontWeight: qsTypography.weight.bold,
    flexShrink: 1,
  },
  tokenName: {
    color: qsColors.textTertiary,
    fontSize: 11,
  },

  // Metric columns
  metricCol: {
    alignItems: "flex-end",
    gap: 2,
    minWidth: 64,
  },
  metricValue: {
    color: qsColors.textPrimary,
    fontSize: 12,
    fontWeight: qsTypography.weight.semi,
    fontVariant: ["tabular-nums"],
  },
  metricSub: {
    color: qsColors.textTertiary,
    fontSize: 11,
    fontWeight: qsTypography.weight.medium,
    fontVariant: ["tabular-nums"],
  },
  changeValue: {
    fontSize: 12,
    fontWeight: qsTypography.weight.bold,
    fontVariant: ["tabular-nums"],
  },

  // Footer
  rowFooter: {
    marginTop: 4,
    marginLeft: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  walletLabel: {
    color: qsColors.textSubtle,
    fontSize: 10,
    fontWeight: qsTypography.weight.medium,
  },

  // ── Action pills (wallets tab) ──
  actionPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: qsRadius.xs,
    overflow: "hidden",
  },
  actionPillText: {
    fontSize: 10,
    fontWeight: qsTypography.weight.bold,
  },
  buyPill: {
    backgroundColor: qsColors.buyGreenBg,
  },
  sellPill: {
    backgroundColor: qsColors.sellRedBg,
  },
  neutralPill: {
    backgroundColor: qsColors.layer3,
  },

});
