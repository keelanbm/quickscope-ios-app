import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useNavigation, type NavigationProp } from "@react-navigation/native";
import * as Clipboard from "expo-clipboard";
import {
  FlatList,
  Linking,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { haptics } from "@/src/lib/haptics";
import { formatCompactUsd, formatPercent, formatCompactNumber, formatAgeFromSeconds, formatSol } from "@/src/lib/format";
import type { RpcClient } from "@/src/lib/api/rpcClient";
import { toast } from "@/src/lib/toast";
import { useAuthSession } from "@/src/features/auth/AuthSessionProvider";
import type { TrackingTabId } from "@/src/ui/TrackingFloatingNav";
import {
  fetchWalletActivity,
  fetchWalletWatchlist,
  fetchWalletWatchlists,
  type AllTransactionsTableRow,
  type TrackedWallet,
  type WalletWatchlist,
} from "@/src/features/tracking/trackingService";
import {
  fetchTelegramChats,
  fetchTelegramMessages,
  type TelegramChat,
  type TelegramMessage,
} from "@/src/features/tracking/telegramEventsService";
import {
  fetchTokenWatchlists,
  fetchWatchlistTokens,
  type EnrichedWatchlistToken,
  type TokenWatchlist,
} from "@/src/features/watchlist/tokenWatchlistService";
import type { RootStack, RootTabs, TrackingRouteParams } from "@/src/navigation/types";
import { qsColors, qsRadius, qsSpacing, qsTypography } from "@/src/theme/tokens";
import { Activity, ChevronDown, Copy, Eye, Globe, MessageCircle, Star, TrendingDown, TrendingUp, Wallet } from "@/src/ui/icons";
import { XIcon, TelegramIcon } from "@/src/ui/icons/BrandIcons";
import { EmptyState } from "@/src/ui/EmptyState";
import { SkeletonRow } from "@/src/ui/Skeleton";
import { ListPickerDrawer, type ListPickerItem } from "@/src/ui/ListPickerDrawer";
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

const TABS: { id: TrackingTabId; label: string }[] = [
  { id: "wallets", label: "Wallets" },
  { id: "tokens", label: "Tokens" },
  { id: "chats", label: "Chats" },
];

/* ─── Wallet activity types ─── */

type ActivityRow = {
  id: string;
  tokenSymbol: string;
  tokenName: string;
  tokenAddress: string;
  imageUri?: string;
  walletLabel: string;
  walletPublicKey: string;
  walletEmoji?: string;
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

function resolveWalletInfo(wallets: TrackedWallet[], maker: string): { label: string; emoji?: string } {
  const wallet = wallets.find((entry) => entry.public_key === maker);
  return {
    label: wallet?.name || `${maker.slice(0, 4)}...${maker.slice(-4)}`,
    emoji: wallet?.emoji,
  };
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

  // ── Wallet activity filters ──
  const [activityActionFilter, setActivityActionFilter] = useState<"all" | "Buy" | "Sell">("all");

  // ── Chats tab state ──
  const [telegramChats, setTelegramChats] = useState<TelegramChat[]>([]);
  const [telegramMessages, setTelegramMessages] = useState<TelegramMessage[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const activeChatIdRef = useRef(activeChatId);
  activeChatIdRef.current = activeChatId;

  // ── List picker drawer ──
  const [listDrawerVisible, setListDrawerVisible] = useState(false);

  const drawerTitle = activeTab === "wallets" ? "Wallet Lists" : activeTab === "tokens" ? "Token Lists" : "Chats";

  const drawerItems: ListPickerItem[] = useMemo(() => {
    if (activeTab === "wallets") {
      return walletWatchlists.map((wl) => ({ id: wl.list_id.toString(), label: wl.name }));
    }
    if (activeTab === "tokens") {
      return tokenWatchlists.map((wl) => ({
        id: String(wl.id),
        label: wl.name,
        subtitle: `${wl.tokens.length} token${wl.tokens.length !== 1 ? "s" : ""}`,
      }));
    }
    return telegramChats.map((c) => ({
      id: c.chatId,
      label: c.name,
      imageUri: c.chatImage || undefined,
      icon: <MessageCircle size={14} color={qsColors.textTertiary} />,
    }));
  }, [activeTab, walletWatchlists, tokenWatchlists, telegramChats]);

  const activeListId =
    activeTab === "wallets"
      ? activeWalletWatchlistId
      : activeTab === "tokens"
        ? String(activeTokenWatchlistId)
        : activeChatId;

  const activeListLabel = drawerItems.find((i) => i.id === activeListId)?.label ?? "Select list";

  const handleDrawerSelect = useCallback(
    async (id: string) => {
      if (activeTab === "wallets") setActiveWalletWatchlistId(id);
      else if (activeTab === "tokens") setActiveTokenWatchlistId(Number(id));
      else if (activeTab === "chats") {
        setActiveChatId(id);
        setIsLoading(true);
        try {
          const msgs = await fetchTelegramMessages(rpcClient, id);
          setTelegramMessages(msgs);
        } catch {
          setErrorText("Failed to load chat messages.");
        } finally {
          setIsLoading(false);
        }
      }
    },
    [activeTab, rpcClient]
  );

  // Dynamic header title based on active tab
  useLayoutEffect(() => {
    navigation.setOptions({ title: TAB_TITLES[activeTab] });
  }, [activeTab, navigation]);

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
        const mapped = (data.table?.rows ?? []).map((row: AllTransactionsTableRow, idx: number) => {
          const tokenInfo = tokenInfoMap[row.mint]?.token_metadata;
          return {
            id: `${row.signature || row.index}-${idx}`,
            tokenSymbol: tokenInfo?.symbol ?? row.mint.slice(0, 4),
            tokenName: tokenInfo?.name ?? "Unknown token",
            tokenAddress: row.mint,
            imageUri: tokenInfo?.image_uri,
            walletLabel: resolveWalletInfo(wallets, row.maker).label,
            walletPublicKey: row.maker,
            walletEmoji: resolveWalletInfo(wallets, row.maker).emoji,
            action: ACTION_LABELS[row.type] ?? ("Buy" as const),
            amountSol: formatSol(row.amount_quote ?? 0),
            timeAgo: formatAgeFromSeconds(row.ts),
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
        const chats = await fetchTelegramChats(rpcClient);
        if (requestId !== requestRef.current) return;
        setTelegramChats(chats);

        const targetChatId = activeChatIdRef.current ?? chats[0]?.chatId ?? null;
        if (targetChatId) {
          if (targetChatId !== activeChatIdRef.current) setActiveChatId(targetChatId);
          const msgs = await fetchTelegramMessages(rpcClient, targetChatId);
          if (requestId !== requestRef.current) return;
          setTelegramMessages(msgs);
        } else {
          setTelegramMessages([]);
        }
      } catch (error) {
        if (requestId !== requestRef.current) return;
        setErrorText(error instanceof Error ? error.message : "Failed to load chat messages.");
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

  // Only re-load when activeTab changes or the active list within that tab changes
  useEffect(() => {
    void loadCurrentTab();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, activeWalletWatchlistId, activeTokenWatchlistId]);

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

  const handleOpenWalletDetail = useCallback(
    (walletAddress: string, walletName?: string, walletEmoji?: string) => {
      rootNavigation?.navigate("WalletDetail", {
        source: "tracking-row",
        walletAddress,
        walletName,
        walletEmoji,
      });
    },
    [rootNavigation]
  );

  /* ═══ Render helpers ═══ */

  /** Tab-specific column headers */
  function renderColumnHeaders() {
    if (activeTab === "tokens") {
      // Simple watchlist rows — no column headers needed
      return null;
    }

    if (activeTab === "wallets") {
      // Clean activity feed — no column headers needed
      return null;
    }

    if (activeTab === "chats") {
      return null;
    }

    return null;
  }

  /** Inline toolbar: list picker trigger (left) + action filter chips (right, wallets only) */
  function renderToolbar() {
    const hasLists = drawerItems.length > 0;
    // Only show toolbar on wallets / tokens tabs (chats has no list concept)
    if (activeTab === "chats") return null;

    const actionOptions: Array<{ label: string; value: "all" | "Buy" | "Sell" }> = [
      { label: "All", value: "all" },
      { label: "Buys", value: "Buy" },
      { label: "Sells", value: "Sell" },
    ];

    return (
      <View style={styles.toolbarRow}>
        {/* List picker trigger */}
        {hasLists ? (
          <Pressable
            onPress={() => setListDrawerVisible(true)}
            style={styles.listTrigger}
            hitSlop={6}
          >
            <Text numberOfLines={1} style={styles.listTriggerLabel}>
              {activeListLabel}
            </Text>
            <ChevronDown size={14} color={qsColors.textTertiary} />
          </Pressable>
        ) : (
          <View style={{ flex: 1 }} />
        )}

        {/* Action filter chips — wallets tab only */}
        {activeTab === "wallets" && activity.length > 0 ? (
          <View style={styles.actionChipRow}>
            {actionOptions.map((opt) => {
              const active = activityActionFilter === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  style={[styles.actionChip, active && styles.actionChipActive]}
                  onPress={() => {
                    haptics.selection();
                    setActivityActionFilter(opt.value);
                  }}
                >
                  <Text style={[styles.actionChipText, active && styles.actionChipTextActive]}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </View>
    );
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

    if (activeTab === "chats" && telegramMessages.length > 0) {
      return (
        <View style={styles.summaryRow}>
          <MessageCircle size={14} color={qsColors.textSubtle} />
          <Text style={styles.summaryText}>
            {telegramMessages.length} message{telegramMessages.length !== 1 ? "s" : ""}
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
      if (telegramMessages.length === 0) {
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
    | { type: "chat"; data: TelegramMessage };

  // Apply wallet activity filters
  const filteredActivity = activity.filter((row) => {
    if (activityActionFilter !== "all" && row.action !== activityActionFilter) return false;
    return true;
  });

  let listData: ListItem[] = [];
  if (activeTab === "tokens") {
    listData = watchlistTokens.map((t) => ({ type: "token" as const, data: t }));
  } else if (activeTab === "wallets") {
    listData = filteredActivity.map((a) => ({ type: "activity" as const, data: a }));
  } else {
    listData = telegramMessages.map((e) => ({ type: "chat" as const, data: e }));
  }

  const handleTabChange = (tab: TrackingTabId) => {
    haptics.selection();
    setActiveTab(tab);
  };

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

          {/* ── Underline tabs ── */}
          <View style={styles.tabsWrap}>
            {TABS.map((tab) => {
              const active = tab.id === activeTab;
              return (
                <Pressable
                  key={tab.id}
                  onPress={() => handleTabChange(tab.id)}
                  style={[styles.tabButton, active && styles.tabButtonActive]}
                >
                  <Text style={[styles.tabButtonText, active && styles.tabButtonTextActive]}>
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* ── Toolbar: list picker + filters ── */}
          {renderToolbar()}

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
                <TokenAvatar uri={token.imageUri} size={44} />
                <View style={styles.nameColumn}>
                  {/* Symbol + copy CA */}
                  <View style={styles.symbolRow}>
                    <Text numberOfLines={1} style={styles.tokenSymbol}>
                      {token.symbol}
                    </Text>
                    <Pressable
                      hitSlop={8}
                      onPress={async (e) => {
                        e.stopPropagation();
                        await Clipboard.setStringAsync(token.mint);
                        haptics.success();
                        toast.success("Copied", token.mint);
                      }}
                    >
                      <Copy size={12} color={qsColors.textSubtle} />
                    </Pressable>
                  </View>
                  {/* Social links row */}
                  <View style={styles.socialRow}>
                    {token.twitterUrl ? (
                      <Pressable hitSlop={6} onPress={() => Linking.openURL(token.twitterUrl!)}>
                        <XIcon size={12} color={qsColors.textTertiary} />
                      </Pressable>
                    ) : null}
                    {token.telegramUrl ? (
                      <Pressable hitSlop={6} onPress={() => Linking.openURL(token.telegramUrl!)}>
                        <TelegramIcon size={12} color={qsColors.textTertiary} />
                      </Pressable>
                    ) : null}
                    {token.websiteUrl ? (
                      <Pressable hitSlop={6} onPress={() => Linking.openURL(token.websiteUrl!)}>
                        <Globe size={12} color={qsColors.textTertiary} />
                      </Pressable>
                    ) : null}
                    {!token.twitterUrl && !token.telegramUrl && !token.websiteUrl ? (
                      <Text style={styles.tokenName}>{token.name}</Text>
                    ) : null}
                  </View>
                </View>
                <View style={styles.priceColumn}>
                  <View style={styles.mcRow}>
                    <Text numberOfLines={1} style={styles.priceValue}>
                      {formatCompactUsd(token.marketCapUsd)}
                    </Text>
                    <Text style={styles.mcSublabel}>MC</Text>
                  </View>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.changeInline,
                      { color: isPositive ? qsColors.buyGreen : qsColors.sellRed },
                    ]}
                  >
                    {isPositive ? "▲" : "▼"} {formatPercent(token.oneHourChangePercent)}
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
                <TokenAvatar uri={row.imageUri} size={44} />
                <View style={styles.nameColumn}>
                  <Text numberOfLines={1} style={styles.tokenSymbol}>
                    {row.tokenSymbol}
                  </Text>
                  <View style={styles.walletMetaRow}>
                    <Pressable
                      hitSlop={6}
                      style={styles.walletMetaTap}
                      onPress={() =>
                        handleOpenWalletDetail(
                          row.walletPublicKey,
                          row.walletLabel,
                          row.walletEmoji
                        )
                      }
                    >
                      <Wallet size={10} color={qsColors.accent} />
                      <Text numberOfLines={1} style={styles.walletMetaTextTap}>
                        {row.walletLabel}
                      </Text>
                    </Pressable>
                    <Text style={styles.walletMetaDot}>·</Text>
                    <Text style={styles.walletMetaText}>{row.timeAgo}</Text>
                  </View>
                </View>
                <View style={styles.activityRight}>
                  <View style={styles.activityAmountRow}>
                    <Text numberOfLines={1} style={styles.activityAmount}>
                      {row.amountSol} SOL
                    </Text>
                  </View>
                  <ActionPill action={row.action} />
                </View>
              </View>
            </Pressable>
          );
        }

        /* ── Telegram message row ── */
        const msg = item.data;
        const msgTypeLabel = msg.msgType === 1 ? "Token" : msg.msgType === 2 ? "Tweet" : "Text";
        return (
          <Pressable
            style={({ pressed }) => [styles.chatRowItem, pressed && { opacity: 0.7 }]}
            onPress={msg.tokenMint ? () => handleOpenTokenDetail(msg.tokenMint!) : undefined}
          >
            <View style={styles.chatMessageCard}>
              <View style={styles.chatCardInner}>
                <View style={styles.chatAvatarCircle}>
                  <MessageCircle size={16} color={qsColors.textTertiary} />
                </View>
                <View style={styles.chatCardContent}>
                  <Text style={styles.chatMessageBody} numberOfLines={4}>
                    {msg.body || "—"}
                  </Text>
                  <View style={styles.chatMessageMeta}>
                    <Text style={styles.chatMessageUsername}>@{msg.username}</Text>
                    <Text style={styles.chatMetaDot}>·</Text>
                    <Text style={styles.chatMessageTime}>
                      {formatAgeFromSeconds(msg.timestamp)}
                    </Text>
                    <Text style={styles.chatMetaDot}>·</Text>
                    <Text style={[
                      styles.chatMessageType,
                      msg.msgType === 1 && { color: qsColors.accent },
                    ]}>
                      {msgTypeLabel}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </Pressable>
        );
      }}
      ListEmptyComponent={renderEmptyState()}
    />
    <ListPickerDrawer
      visible={listDrawerVisible}
      onClose={() => setListDrawerVisible(false)}
      title={drawerTitle}
      items={drawerItems}
      activeId={activeListId}
      onSelect={handleDrawerSelect}
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
    paddingBottom: 80,
  },
  headerWrap: {
    gap: qsSpacing.md,
    marginBottom: qsSpacing.sm,
    paddingHorizontal: qsSpacing.lg,
  },

  // ── Underline tabs ──
  tabsWrap: {
    flexDirection: "row",
    gap: qsSpacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: qsColors.borderDefault,
  },
  tabButton: {
    paddingVertical: qsSpacing.sm,
    paddingHorizontal: qsSpacing.xs,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabButtonActive: {
    borderBottomColor: qsColors.accent,
  },
  tabButtonText: {
    color: qsColors.textTertiary,
    fontWeight: qsTypography.weight.semi,
    fontSize: qsTypography.size.xs,
  },
  tabButtonTextActive: {
    color: qsColors.textPrimary,
  },

  // ── Toolbar (list picker + action chips) ──
  toolbarRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: qsSpacing.sm,
  },
  listTrigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: qsColors.layer2,
    borderRadius: qsRadius.md,
    paddingVertical: 8,
    paddingHorizontal: qsSpacing.md,
    flexShrink: 1,
  },
  listTriggerLabel: {
    color: qsColors.textPrimary,
    fontSize: 14,
    fontWeight: qsTypography.weight.semi,
    flexShrink: 1,
  },
  actionChipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionChip: {
    borderRadius: qsRadius.md,
    backgroundColor: qsColors.layer2,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  actionChipActive: {
    backgroundColor: qsColors.accent,
  },
  actionChipText: {
    color: qsColors.textTertiary,
    fontSize: 13,
    fontWeight: qsTypography.weight.semi,
  },
  actionChipTextActive: {
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
  chatRowItem: {
    paddingHorizontal: qsSpacing.lg,
    paddingVertical: qsSpacing.xs,
  },
  chatAvatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: qsColors.layer3,
    alignItems: "center",
    justifyContent: "center",
  },
  chatMessageCard: {
    backgroundColor: qsColors.layer1,
    borderRadius: qsRadius.md,
    padding: qsSpacing.md,
  },
  chatCardInner: {
    flexDirection: "row",
    gap: qsSpacing.sm,
  },
  chatCardContent: {
    flex: 1,
    gap: qsSpacing.xs,
  },
  chatMessageBody: {
    color: qsColors.textPrimary,
    fontSize: qsTypography.size.xs,
    fontWeight: qsTypography.weight.regular,
    lineHeight: 18,
  },
  chatMessageMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  chatMessageUsername: {
    color: qsColors.textTertiary,
    fontSize: qsTypography.size.xxxs + 1,
    fontWeight: qsTypography.weight.medium,
  },
  chatMetaDot: {
    color: qsColors.textSubtle,
    fontSize: qsTypography.size.xxxs + 1,
  },
  chatMessageTime: {
    color: qsColors.textSubtle,
    fontSize: qsTypography.size.xxxs + 1,
    fontWeight: qsTypography.weight.medium,
  },
  chatMessageType: {
    color: qsColors.textSubtle,
    fontSize: qsTypography.size.xxxs + 1,
    fontWeight: qsTypography.weight.semi,
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
  symbolRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  socialRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 2,
  },

  // Price column (token watchlist)
  priceColumn: {
    alignItems: "flex-end",
    gap: 2,
  },
  mcRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  priceValue: {
    color: qsColors.textPrimary,
    fontSize: 16,
    fontWeight: qsTypography.weight.bold,
    fontVariant: ["tabular-nums"],
  },
  mcSublabel: {
    color: qsColors.textSubtle,
    fontSize: 10,
    fontWeight: qsTypography.weight.medium,
  },
  changeInline: {
    fontSize: 12,
    fontWeight: qsTypography.weight.semi,
    fontVariant: ["tabular-nums"],
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

  // ── Wallet activity rows ──
  walletMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  walletMetaText: {
    color: qsColors.textSubtle,
    fontSize: 11,
    fontWeight: qsTypography.weight.medium,
  },
  walletMetaTap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  walletMetaTextTap: {
    color: qsColors.accent,
    fontSize: 11,
    fontWeight: qsTypography.weight.medium,
  },
  walletMetaDot: {
    color: qsColors.textSubtle,
    fontSize: 11,
  },
  activityRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  activityAmountRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 3,
  },
  activityAmount: {
    color: qsColors.textPrimary,
    fontSize: 15,
    fontWeight: qsTypography.weight.bold,
    fontVariant: ["tabular-nums"],
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
