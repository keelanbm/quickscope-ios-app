import { useEffect, useMemo, useRef, useState } from "react";

import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import type { RpcClient } from "@/src/lib/api/rpcClient";
import { useAuthSession } from "@/src/features/auth/AuthSessionProvider";
import { useWalletConnect } from "@/src/features/wallet/WalletConnectProvider";
import {
  addWalletToWatchlist,
  createWalletWatchlist,
  fetchWalletActivity,
  fetchWalletWatchlist,
  fetchWalletWatchlists,
  removeWalletFromWatchlist,
  type AllTransactionsTableRow,
  type TrackedWallet,
  type WalletWatchlist,
} from "@/src/features/tracking/trackingService";
import { ensurePrimaryAccount } from "@/src/features/account/accountService";
import {
  addTokenToWatchlist,
  createTokenWatchlist,
  fetchTokenWatchlists,
  removeTokenFromWatchlist,
  type TokenWatchlist,
} from "@/src/features/watchlist/tokenWatchlistService";
import { fetchLiveTokenInfos, type LiveTokenInfo } from "@/src/features/token/tokenService";
import {
  fetchTelegramChats,
  fetchTelegramMessages,
  type TelegramChatInfo,
  type TelegramMessageWithToken,
} from "@/src/features/telegram/telegramService";
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

type TokenTrackingRow = {
  id: string;
  tokenAddress: string;
  symbol: string;
  name: string;
};

type TrackingSectionId = "tokens" | "wallets" | "telegram";
type TelegramViewId = "messages" | "tokens";

const trackingSections: { id: TrackingSectionId; label: string }[] = [
  { id: "tokens", label: "Token Watchlists" },
  { id: "wallets", label: "Wallet Tracking" },
  { id: "telegram", label: "Telegram Feed" },
];

const telegramViews: { id: TelegramViewId; label: string }[] = [
  { id: "messages", label: "Messages" },
  { id: "tokens", label: "Tokens" },
];

const ACTION_LABELS: Record<string, ActivityRow["action"]> = {
  b: "Buy",
  s: "Sell",
  d: "Add",
  w: "Remove",
};

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

function formatAddress(address: string): string {
  if (!address) {
    return "--";
  }
  if (address.length <= 10) {
    return address;
  }
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function resolveWalletLabel(wallets: TrackedWallet[], maker: string): string {
  const wallet = wallets.find((entry) => entry.public_key === maker);
  return wallet?.name || `${maker.slice(0, 4)}...${maker.slice(-4)}`;
}

export function TrackingScreen({ rpcClient, params }: TrackingScreenProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStack>>();
  const { hasValidAccessToken } = useAuthSession();
  const { ensureAuthenticated } = useWalletConnect();
  const requestRef = useRef(0);
  const [watchlists, setWatchlists] = useState<WalletWatchlist[]>([]);
  const [activeWatchlistId, setActiveWatchlistId] = useState<number | null>(null);
  const [wallets, setWallets] = useState<TrackedWallet[]>([]);
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [tokenWatchlists, setTokenWatchlists] = useState<TokenWatchlist[]>([]);
  const [activeTokenWatchlistId, setActiveTokenWatchlistId] = useState<number | null>(null);
  const [tokenRows, setTokenRows] = useState<TokenTrackingRow[]>([]);
  const [telegramChats, setTelegramChats] = useState<TelegramChatInfo[]>([]);
  const [activeTelegramChatId, setActiveTelegramChatId] = useState<string | null>(null);
  const [telegramMessages, setTelegramMessages] = useState<TelegramMessageWithToken[]>([]);
  const [telegramTokenInfo, setTelegramTokenInfo] = useState<Record<string, LiveTokenInfo>>({});
  const [telegramView, setTelegramView] = useState<TelegramViewId>("messages");
  const [activeSection, setActiveSection] = useState<TrackingSectionId>("tokens");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [isTokenLoading, setIsTokenLoading] = useState(false);
  const [telegramError, setTelegramError] = useState<string | null>(null);
  const [isTelegramLoading, setIsTelegramLoading] = useState(false);
  const [isTelegramMessagesLoading, setIsTelegramMessagesLoading] = useState(false);

  useEffect(() => {
    let isActive = true;
    const requestId = ++requestRef.current;
    setIsLoading(true);
    setErrorText(null);

    if (!hasValidAccessToken) {
      setWatchlists([]);
      setActiveWatchlistId(null);
      setWallets([]);
      setActivity([]);
      setTokenWatchlists([]);
      setTokenRows([]);
      setTelegramChats([]);
      setActiveTelegramChatId(null);
      setTelegramMessages([]);
      setTelegramTokenInfo({});
      setIsLoading(false);
      return;
    }

    Promise.all([fetchWalletWatchlists(rpcClient), fetchTokenWatchlists(rpcClient)])
      .then(([walletLists, tokenLists]) => {
        if (!isActive || requestId !== requestRef.current) {
          return;
        }
        const nextWalletLists = walletLists ?? [];
        const nextTokenLists = tokenLists ?? [];

        setWatchlists(nextWalletLists);
        setActiveWatchlistId((prev) => {
          if (prev && nextWalletLists.some((list) => list.list_id === prev)) {
            return prev;
          }
          return nextWalletLists[0]?.list_id ?? null;
        });

        setTokenWatchlists(nextTokenLists);
        setActiveTokenWatchlistId((prev) => {
          if (prev && nextTokenLists.some((list) => list.id === prev)) {
            return prev;
          }
          return nextTokenLists[0]?.id ?? null;
        });
      })
      .catch((error) => {
        if (!isActive || requestId !== requestRef.current) {
          return;
        }
        setErrorText(error instanceof Error ? error.message : "Failed to load watchlists.");
        setTokenError(error instanceof Error ? error.message : "Failed to load token lists.");
        setTokenWatchlists([]);
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
  }, [hasValidAccessToken, rpcClient]);

  useEffect(() => {
    if (activeWatchlistId === null) {
      setWallets([]);
      return;
    }

    let isActive = true;
    const requestId = ++requestRef.current;
    setErrorText(null);

    fetchWalletWatchlist(rpcClient, activeWatchlistId)
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
            amountSol: formatAmount(row.amount_quote ?? 0),
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

  useEffect(() => {
    if (!activeTokenWatchlistId) {
      setTokenRows([]);
      return;
    }

    const selectedList = tokenWatchlists.find((list) => list.id === activeTokenWatchlistId);
    const tokens = selectedList?.tokens ?? [];
    if (tokens.length === 0) {
      setTokenRows([]);
      return;
    }

    let isActive = true;
    setIsTokenLoading(true);
    setTokenError(null);

    fetchLiveTokenInfos(rpcClient, tokens)
      .then((map) => {
        if (!isActive) {
          return;
        }
        const rows = tokens.map((mint) => {
          const info: LiveTokenInfo | undefined = map[mint];
          const meta = info?.token_metadata;
          return {
            id: mint,
            tokenAddress: mint,
            symbol: meta?.symbol ?? mint.slice(0, 4),
            name: meta?.name ?? "Unknown token",
          };
        });
        setTokenRows(rows);
      })
      .catch((error) => {
        if (!isActive) {
          return;
        }
        setTokenError(error instanceof Error ? error.message : "Failed to load tokens.");
        setTokenRows([]);
      })
      .finally(() => {
        if (!isActive) {
          return;
        }
        setIsTokenLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [activeTokenWatchlistId, rpcClient, tokenWatchlists]);

  useEffect(() => {
    if (!hasValidAccessToken) {
      setTelegramChats([]);
      setActiveTelegramChatId(null);
      setTelegramMessages([]);
      setTelegramTokenInfo({});
      return;
    }

    let isActive = true;
    setIsTelegramLoading(true);
    setTelegramError(null);

    fetchTelegramChats(rpcClient)
      .then((chats) => {
        if (!isActive) {
          return;
        }
        const nextChats = chats ?? [];
        setTelegramChats(nextChats);
        setActiveTelegramChatId((prev) => {
          if (prev && nextChats.some((chat) => chat.chat_id.toString() === prev)) {
            return prev;
          }
          return nextChats[0]?.chat_id?.toString() ?? null;
        });
      })
      .catch((error) => {
        if (!isActive) {
          return;
        }
        setTelegramError(
          error instanceof Error ? error.message : "Failed to load Telegram chats."
        );
        setTelegramChats([]);
        setActiveTelegramChatId(null);
      })
      .finally(() => {
        if (!isActive) {
          return;
        }
        setIsTelegramLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [hasValidAccessToken, rpcClient]);

  useEffect(() => {
    if (!hasValidAccessToken || !activeTelegramChatId) {
      setTelegramMessages([]);
      setTelegramTokenInfo({});
      return;
    }

    let isActive = true;
    setIsTelegramMessagesLoading(true);
    setTelegramError(null);

    fetchTelegramMessages(rpcClient, { chatId: activeTelegramChatId, limit: 50 })
      .then((response) => {
        if (!isActive) {
          return;
        }
        const nextMessages = (response.messages ?? []).slice().sort((a, b) => b.ts - a.ts);
        setTelegramMessages(nextMessages);
      })
      .catch((error) => {
        if (!isActive) {
          return;
        }
        setTelegramError(
          error instanceof Error ? error.message : "Failed to load Telegram feed."
        );
        setTelegramMessages([]);
      })
      .finally(() => {
        if (!isActive) {
          return;
        }
        setIsTelegramMessagesLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [activeTelegramChatId, hasValidAccessToken, rpcClient]);

  useEffect(() => {
    const mints = Array.from(
      new Set(
        telegramMessages.map((message) => message.token_mint).filter((mint): mint is string =>
          Boolean(mint)
        )
      )
    );

    if (mints.length === 0) {
      setTelegramTokenInfo({});
      return;
    }

    let isActive = true;

    fetchLiveTokenInfos(rpcClient, mints)
      .then((map) => {
        if (!isActive) {
          return;
        }
        setTelegramTokenInfo(map ?? {});
      })
      .catch(() => {
        if (!isActive) {
          return;
        }
        setTelegramTokenInfo({});
      });

    return () => {
      isActive = false;
    };
  }, [rpcClient, telegramMessages]);

  const syncTokenWatchlists = async (preferredId?: number | null) => {
    try {
      const lists = await fetchTokenWatchlists(rpcClient);
      setTokenWatchlists(lists);
      setActiveTokenWatchlistId((prev) => {
        if (preferredId && lists.some((list) => list.id === preferredId)) {
          return preferredId;
        }
        if (prev && lists.some((list) => list.id === prev)) {
          return prev;
        }
        return lists[0]?.id ?? null;
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update token watchlists.";
      setTokenError(message);
      Alert.alert("Token watchlists", message);
    }
  };

  const syncWalletWatchlists = async (preferredId?: number | null) => {
    try {
      const lists = await fetchWalletWatchlists(rpcClient);
      setWatchlists(lists);
      setActiveWatchlistId((prev) => {
        if (preferredId && lists.some((list) => list.list_id === preferredId)) {
          return preferredId;
        }
        if (prev && lists.some((list) => list.list_id === prev)) {
          return prev;
        }
        return lists[0]?.list_id ?? null;
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update wallet watchlists.";
      setErrorText(message);
      Alert.alert("Wallet watchlists", message);
    }
  };

  const handleCreateTokenWatchlist = () => {
    if (!hasValidAccessToken) {
      ensureAuthenticated();
      return;
    }

    Alert.prompt(
      "New token watchlist",
      "Name your watchlist",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Create",
          onPress: async (value) => {
            const name = value?.trim();
            if (!name) {
              return;
            }
            try {
              await ensurePrimaryAccount(rpcClient);
              const id = await createTokenWatchlist(rpcClient, name);
              await syncTokenWatchlists(id);
            } catch (error) {
              const message =
                error instanceof Error ? error.message : "Failed to create watchlist.";
              setTokenError(message);
              Alert.alert("Token watchlists", message);
            }
          },
        },
      ],
      "plain-text"
    );
  };

  const handleAddToken = () => {
    if (!hasValidAccessToken) {
      ensureAuthenticated();
      return;
    }

    if (!activeTokenWatchlistId) {
      Alert.alert("Token watchlists", "Create or select a watchlist first.");
      return;
    }

    Alert.prompt(
      "Add token",
      "Paste a token address",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Add",
          onPress: async (value) => {
            const tokenAddress = value?.trim();
            if (!tokenAddress) {
              return;
            }
            try {
              await addTokenToWatchlist(rpcClient, activeTokenWatchlistId, tokenAddress);
              await syncTokenWatchlists(activeTokenWatchlistId);
            } catch (error) {
              const message =
                error instanceof Error ? error.message : "Failed to add token.";
              setTokenError(message);
              Alert.alert("Token watchlists", message);
            }
          },
        },
      ],
      "plain-text"
    );
  };

  const handleRemoveToken = (tokenAddress: string) => {
    if (!activeTokenWatchlistId) {
      return;
    }

    Alert.alert("Remove token", "Remove this token from the watchlist?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          void (async () => {
            try {
              await removeTokenFromWatchlist(rpcClient, activeTokenWatchlistId, tokenAddress);
              await syncTokenWatchlists(activeTokenWatchlistId);
            } catch (error) {
              const message =
                error instanceof Error ? error.message : "Failed to remove token.";
              setTokenError(message);
              Alert.alert("Token watchlists", message);
            }
          })();
        },
      },
    ]);
  };

  const handleCreateWalletWatchlist = () => {
    if (!hasValidAccessToken) {
      ensureAuthenticated();
      return;
    }

    Alert.prompt(
      "New wallet watchlist",
      "Name your watchlist",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Create",
          onPress: async (value) => {
            const name = value?.trim();
            if (!name) {
              return;
            }
            try {
              await ensurePrimaryAccount(rpcClient);
              const id = await createWalletWatchlist(rpcClient, name);
              await syncWalletWatchlists(id);
            } catch (error) {
              const message =
                error instanceof Error ? error.message : "Failed to create watchlist.";
              setErrorText(message);
              Alert.alert("Wallet watchlists", message);
            }
          },
        },
      ],
      "plain-text"
    );
  };

  const handleAddWallet = () => {
    if (!hasValidAccessToken) {
      ensureAuthenticated();
      return;
    }

    if (!activeWatchlistId) {
      Alert.alert("Wallet watchlists", "Create or select a watchlist first.");
      return;
    }

    Alert.prompt(
      "Add wallet",
      "Paste a wallet address",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Next",
          onPress: (value) => {
            const publicKey = value?.trim();
            if (!publicKey) {
              return;
            }
            Alert.prompt(
              "Wallet label",
              "Optional name for this wallet",
              [
                {
                  text: "Skip",
                  style: "cancel",
                  onPress: () => {
                    void (async () => {
                      try {
                        await addWalletToWatchlist(rpcClient, {
                          watchlistId: activeWatchlistId,
                          publicKey,
                          name: formatAddress(publicKey),
                          emoji: "👀",
                        });
                        const updated = await fetchWalletWatchlist(
                          rpcClient,
                          activeWatchlistId
                        );
                        setWallets(updated.wallets ?? []);
                      } catch (error) {
                        const message =
                          error instanceof Error ? error.message : "Failed to add wallet.";
                        setErrorText(message);
                        Alert.alert("Wallet watchlists", message);
                      }
                    })();
                  },
                },
                {
                  text: "Add",
                  onPress: (label) => {
                    void (async () => {
                      try {
                        await addWalletToWatchlist(rpcClient, {
                          watchlistId: activeWatchlistId,
                          publicKey,
                          name: label?.trim() || formatAddress(publicKey),
                          emoji: "👀",
                        });
                        const updated = await fetchWalletWatchlist(
                          rpcClient,
                          activeWatchlistId
                        );
                        setWallets(updated.wallets ?? []);
                      } catch (error) {
                        const message =
                          error instanceof Error ? error.message : "Failed to add wallet.";
                        setErrorText(message);
                        Alert.alert("Wallet watchlists", message);
                      }
                    })();
                  },
                },
              ],
              "plain-text"
            );
          },
        },
      ],
      "plain-text"
    );
  };

  const handleRemoveWallet = (publicKey: string) => {
    if (!activeWatchlistId) {
      return;
    }

    Alert.alert("Remove wallet", "Remove this wallet from the watchlist?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          void (async () => {
            try {
              await removeWalletFromWatchlist(rpcClient, activeWatchlistId, publicKey);
              const updated = await fetchWalletWatchlist(rpcClient, activeWatchlistId);
              setWallets(updated.wallets ?? []);
            } catch (error) {
              const message =
                error instanceof Error ? error.message : "Failed to remove wallet.";
              setErrorText(message);
              Alert.alert("Wallet watchlists", message);
            }
          })();
        },
      },
    ]);
  };

  const telegramTokenRows = useMemo(() => {
    const rows = new Map<string, { tokenMint: string; count: number; lastTs: number }>();
    telegramMessages.forEach((message) => {
      const mint = message.token_mint;
      if (!mint) {
        return;
      }
      const entry = rows.get(mint) ?? { tokenMint: mint, count: 0, lastTs: 0 };
      entry.count += 1;
      entry.lastTs = Math.max(entry.lastTs, message.ts ?? 0);
      rows.set(mint, entry);
    });

    return Array.from(rows.values()).sort((a, b) => b.count - a.count);
  }, [telegramMessages]);

  const chipHitSlop = { top: 6, bottom: 6, left: 6, right: 6 };

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <View style={styles.tabsRow}>
        {trackingSections.map((section) => {
          const isActive = section.id === activeSection;
          return (
            <Pressable
              key={section.id}
              style={[styles.tabPill, isActive && styles.tabPillActive]}
              onPress={() => setActiveSection(section.id)}
              hitSlop={chipHitSlop}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {section.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {activeSection === "wallets" ? (
        <SectionCard title="Wallet Tracking">
          {!hasValidAccessToken ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Authenticate to view wallet tracking.</Text>
              <Pressable style={styles.primaryButton} onPress={ensureAuthenticated}>
                <Text style={styles.primaryButtonText}>Authenticate session</Text>
              </Pressable>
            </View>
          ) : isLoading ? (
            <Text style={styles.emptyText}>Loading watchlists...</Text>
          ) : errorText ? (
            <Text style={styles.emptyText}>{errorText}</Text>
          ) : watchlists.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Create a watchlist to begin tracking.</Text>
              <Pressable style={styles.primaryButton} onPress={handleCreateWalletWatchlist}>
                <Text style={styles.primaryButtonText}>Create watchlist</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <View style={styles.watchlistTabsRow}>
                {watchlists.map((list) => {
                  const isActive = list.list_id === activeWatchlistId;
                  return (
                    <Pressable
                      key={list.list_id}
                      style={[styles.subTabPill, isActive && styles.subTabPillActive]}
                      onPress={() => setActiveWatchlistId(list.list_id)}
                      hitSlop={chipHitSlop}
                    >
                      <Text style={[styles.subTabText, isActive && styles.subTabTextActive]}>
                        {list.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <View style={styles.actionRow}>
                <Pressable style={styles.secondaryButton} onPress={handleCreateWalletWatchlist}>
                  <Text style={styles.secondaryButtonText}>New watchlist</Text>
                </Pressable>
                <Pressable style={styles.secondaryButton} onPress={handleAddWallet}>
                  <Text style={styles.secondaryButtonText}>Add wallet</Text>
                </Pressable>
              </View>
              {wallets.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>Add wallets to start tracking activity.</Text>
                  <Pressable style={styles.primaryButton} onPress={handleAddWallet}>
                    <Text style={styles.primaryButtonText}>Add wallets</Text>
                  </Pressable>
                </View>
              ) : (
                <>
                  <View style={styles.walletList}>
                    {wallets.map((wallet) => (
                      <View key={wallet.public_key} style={styles.walletRow}>
                        <View style={styles.rowMain}>
                          <View style={styles.tokenAvatar}>
                            <Text style={styles.tokenAvatarText}>
                              {wallet.emoji ?? wallet.name?.[0] ?? "W"}
                            </Text>
                          </View>
                          <View style={styles.rowText}>
                            <Text style={styles.tokenSymbol}>{wallet.name}</Text>
                            <Text style={styles.tokenName}>
                              {formatAddress(wallet.public_key)}
                            </Text>
                          </View>
                        </View>
                        <Pressable
                          style={styles.removeButton}
                          onPress={() => handleRemoveWallet(wallet.public_key)}
                        >
                          <Text style={styles.removeButtonText}>Remove</Text>
                        </Pressable>
                      </View>
                    ))}
                  </View>
                  <View style={styles.sectionDivider} />
                  {isLoadingActivity ? (
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
                </>
              )}
            </>
          )}
        </SectionCard>
      ) : activeSection === "tokens" ? (
        <SectionCard title="Token Watchlists">
          {!hasValidAccessToken ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Authenticate to view token watchlists.</Text>
              <Pressable style={styles.primaryButton} onPress={ensureAuthenticated}>
                <Text style={styles.primaryButtonText}>Authenticate session</Text>
              </Pressable>
            </View>
          ) : tokenWatchlists.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No token watchlists yet.</Text>
              <Pressable style={styles.primaryButton} onPress={handleCreateTokenWatchlist}>
                <Text style={styles.primaryButtonText}>Create watchlist</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <View style={styles.watchlistTabsRow}>
                {tokenWatchlists.map((list) => {
                  const isActive = list.id === activeTokenWatchlistId;
                  return (
                    <Pressable
                      key={list.id}
                      style={[styles.subTabPill, isActive && styles.subTabPillActive]}
                      onPress={() => setActiveTokenWatchlistId(list.id)}
                      hitSlop={chipHitSlop}
                    >
                      <Text style={[styles.subTabText, isActive && styles.subTabTextActive]}>
                        {list.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <View style={styles.actionRow}>
                <Pressable style={styles.secondaryButton} onPress={handleCreateTokenWatchlist}>
                  <Text style={styles.secondaryButtonText}>New watchlist</Text>
                </Pressable>
                <Pressable style={styles.secondaryButton} onPress={handleAddToken}>
                  <Text style={styles.secondaryButtonText}>Add token</Text>
                </Pressable>
              </View>
              {isTokenLoading ? (
                <Text style={styles.emptyText}>Loading tokens...</Text>
              ) : tokenError ? (
                <Text style={styles.emptyText}>{tokenError}</Text>
              ) : tokenRows.length === 0 ? (
                <Text style={styles.emptyText}>No tokens in this watchlist yet.</Text>
              ) : (
                tokenRows.map((token) => (
                  <View key={token.id} style={styles.tokenRow}>
                    <Pressable
                      style={styles.rowMain}
                      onPress={() =>
                        navigation.navigate("TokenDetail", {
                          source: "deep-link",
                          tokenAddress: token.tokenAddress,
                        })
                      }
                    >
                      <View style={styles.tokenAvatar}>
                        <Text style={styles.tokenAvatarText}>{token.symbol[0]}</Text>
                      </View>
                      <View style={styles.rowText}>
                        <Text style={styles.tokenSymbol}>{token.symbol}</Text>
                        <Text style={styles.tokenName}>{token.name}</Text>
                      </View>
                    </Pressable>
                    <Pressable
                      style={styles.removeButton}
                      onPress={() => handleRemoveToken(token.tokenAddress)}
                    >
                      <Text style={styles.removeButtonText}>Remove</Text>
                    </Pressable>
                  </View>
                ))
              )}
            </>
          )}
        </SectionCard>
      ) : (
        <SectionCard title="Telegram Feed">
          {!hasValidAccessToken ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Authenticate to view Telegram chats.</Text>
              <Pressable style={styles.primaryButton} onPress={ensureAuthenticated}>
                <Text style={styles.primaryButtonText}>Authenticate session</Text>
              </Pressable>
            </View>
          ) : isTelegramLoading ? (
            <Text style={styles.emptyText}>Loading Telegram chats...</Text>
          ) : telegramError ? (
            <Text style={styles.emptyText}>{telegramError}</Text>
          ) : telegramChats.length === 0 ? (
            <Text style={styles.emptyText}>No Telegram chats yet.</Text>
          ) : (
            <>
              <View style={styles.watchlistTabsRow}>
                {telegramChats.map((chat) => {
                  const chatId = chat.chat_id.toString();
                  const isActive = chatId === activeTelegramChatId;
                  return (
                    <Pressable
                      key={chatId}
                      style={[styles.subTabPill, isActive && styles.subTabPillActive]}
                      onPress={() => setActiveTelegramChatId(chatId)}
                      hitSlop={chipHitSlop}
                    >
                      <Text style={[styles.subTabText, isActive && styles.subTabTextActive]}>
                        {chat.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <View style={styles.viewTabsRow}>
                {telegramViews.map((view) => {
                  const isActive = view.id === telegramView;
                  return (
                    <Pressable
                      key={view.id}
                      style={[styles.subTabPill, isActive && styles.subTabPillActive]}
                      onPress={() => setTelegramView(view.id)}
                      hitSlop={chipHitSlop}
                    >
                      <Text style={[styles.subTabText, isActive && styles.subTabTextActive]}>
                        {view.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {isTelegramMessagesLoading ? (
                <Text style={styles.emptyText}>Loading feed...</Text>
              ) : telegramMessages.length === 0 ? (
                <Text style={styles.emptyText}>No messages yet.</Text>
              ) : telegramView === "messages" ? (
                telegramMessages.map((message) => {
                  const tokenMint = message.token_mint;
                  const tokenInfo = tokenMint ? telegramTokenInfo[tokenMint] : undefined;
                  const symbol = tokenInfo?.token_metadata?.symbol ?? tokenMint?.slice(0, 4);
                  const name = tokenInfo?.token_metadata?.name ?? "Token mention";
                  const avatarLetter =
                    symbol?.[0] ?? message.username?.[0]?.toUpperCase() ?? "T";
                  const body = message.msg_body?.trim() || "Message";

                  return (
                    <Pressable
                      key={message.msg_id.toString()}
                      style={styles.telegramRow}
                      onPress={() => {
                        if (!tokenMint) {
                          return;
                        }
                        navigation.navigate("TokenDetail", {
                          source: "deep-link",
                          tokenAddress: tokenMint,
                        });
                      }}
                    >
                      <View style={styles.rowLeft}>
                        <View style={styles.tokenAvatar}>
                          <Text style={styles.tokenAvatarText}>{avatarLetter}</Text>
                        </View>
                        <View style={styles.rowText}>
                          <Text style={styles.tokenSymbol}>
                            {symbol ? symbol : "Message"}
                          </Text>
                          <Text style={styles.tokenName} numberOfLines={1}>
                            {tokenMint ? name : `@${message.username}`}
                          </Text>
                          <Text style={styles.telegramMessage} numberOfLines={2}>
                            {body}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.rowRight}>
                        <Text style={styles.telegramMeta}>@{message.username}</Text>
                        <Text style={styles.timeText}>{formatTimeAgo(message.ts)}</Text>
                      </View>
                    </Pressable>
                  );
                })
              ) : telegramTokenRows.length === 0 ? (
                <Text style={styles.emptyText}>No token mentions yet.</Text>
              ) : (
                telegramTokenRows.map((row) => {
                  const tokenInfo = telegramTokenInfo[row.tokenMint];
                  const symbol = tokenInfo?.token_metadata?.symbol ?? row.tokenMint.slice(0, 4);
                  const name = tokenInfo?.token_metadata?.name ?? "Token";
                  return (
                    <Pressable
                      key={row.tokenMint}
                      style={styles.tokenRow}
                      onPress={() =>
                        navigation.navigate("TokenDetail", {
                          source: "deep-link",
                          tokenAddress: row.tokenMint,
                        })
                      }
                    >
                      <View style={styles.rowMain}>
                        <View style={styles.tokenAvatar}>
                          <Text style={styles.tokenAvatarText}>{symbol[0]}</Text>
                        </View>
                        <View style={styles.rowText}>
                          <Text style={styles.tokenSymbol}>{symbol}</Text>
                          <Text style={styles.tokenName}>{name}</Text>
                        </View>
                      </View>
                      <View style={styles.rowRight}>
                        <Text style={styles.amountText}>{row.count} msgs</Text>
                        <Text style={styles.timeText}>{formatTimeAgo(row.lastTs)}</Text>
                      </View>
                    </Pressable>
                  );
                })
              )}
            </>
          )}
        </SectionCard>
      )}

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
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: qsSpacing.sm,
  },
  secondaryButton: {
    borderRadius: qsRadius.sm,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    backgroundColor: qsColors.bgCard,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  secondaryButtonText: {
    color: qsColors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  watchlistTabsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: qsSpacing.sm,
  },
  viewTabsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: qsSpacing.xs,
  },
  subTabPill: {
    borderRadius: qsRadius.lg,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    backgroundColor: qsColors.bgCardSoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  subTabPillActive: {
    borderColor: qsColors.accent,
    backgroundColor: "rgba(78, 163, 255, 0.15)",
  },
  subTabText: {
    color: qsColors.textSubtle,
    fontSize: 11,
    fontWeight: "600",
  },
  subTabTextActive: {
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
  rowMain: {
    flexDirection: "row",
    alignItems: "center",
    gap: qsSpacing.sm,
    flex: 1,
  },
  tokenAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
  telegramRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderRadius: qsRadius.md,
    backgroundColor: qsColors.bgCardSoft,
    padding: qsSpacing.sm,
    gap: qsSpacing.sm,
  },
  telegramMessage: {
    color: qsColors.textMuted,
    fontSize: 12,
  },
  telegramMeta: {
    color: qsColors.textSubtle,
    fontSize: 11,
  },
  tokenRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: qsSpacing.sm,
    borderRadius: qsRadius.md,
    backgroundColor: qsColors.bgCardSoft,
    padding: qsSpacing.sm,
  },
  walletList: {
    gap: qsSpacing.sm,
  },
  walletRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: qsSpacing.sm,
    borderRadius: qsRadius.md,
    backgroundColor: qsColors.bgCardSoft,
    padding: qsSpacing.sm,
  },
  removeButton: {
    borderRadius: qsRadius.sm,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "transparent",
  },
  removeButtonText: {
    color: qsColors.textSubtle,
    fontSize: 11,
    fontWeight: "600",
  },
  rowText: {
    gap: 2,
  },
  tokenSymbol: {
    color: qsColors.textPrimary,
    fontSize: 13,
    fontWeight: "700",
  },
  tokenName: {
    color: qsColors.textMuted,
    fontSize: 11,
  },
  walletLabel: {
    color: qsColors.textSubtle,
    fontSize: 10,
  },
  rowRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  actionPill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: qsRadius.sm,
    fontSize: 10,
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
    fontSize: 11,
  },
  timeText: {
    color: qsColors.textSubtle,
    fontSize: 10,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: qsColors.borderDefault,
    opacity: 0.6,
    marginVertical: qsSpacing.sm,
  },
  contextText: {
    color: qsColors.textSubtle,
    fontSize: 12,
  },
});
