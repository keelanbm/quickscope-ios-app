import type { RpcClient } from "@/src/lib/api/rpcClient";
import {
  fetchTraderOverview,
  fetchTraderPositions,
  quoteToUsd,
  type Position,
} from "@/src/features/portfolio/portfolioService";
import {
  fetchTokenWatchlists,
  fetchWatchlistTokens,
} from "@/src/features/watchlist/tokenWatchlistService";
import {
  fetchWalletWatchlists,
  fetchWalletWatchlist,
  fetchWalletActivity,
  type AllTransactionsTableRow,
} from "@/src/features/tracking/trackingService";
import {
  fetchTelegramChats,
  fetchTelegramMessages,
} from "@/src/features/tracking/telegramEventsService";

import PortfolioWidget from "@/src/widgets/PortfolioWidget";
import WatchlistWidget from "@/src/widgets/WatchlistWidget";
import WalletActivityWidget from "@/src/widgets/WalletActivityWidget";
import ChatPulseWidget from "@/src/widgets/ChatPulseWidget";

// ── Helpers ──

function formatUsd(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
}

function formatPercent(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

function formatSol(value: number): string {
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toFixed(2);
}

function timeAgo(date: Date): string {
  const mins = Math.floor((Date.now() - date.getTime()) / 60_000);
  if (mins < 1) return "Updated just now";
  if (mins < 60) return `Updated ${mins}m ago`;
  return `Updated ${Math.floor(mins / 60)}h ago`;
}

// ── Portfolio Widget ──

export async function updatePortfolioWidget(
  rpcClient: RpcClient,
  account: string
): Promise<void> {
  try {
    const [overview, positionsResp] = await Promise.all([
      fetchTraderOverview(rpcClient, account),
      fetchTraderPositions(rpcClient, account, {
        limit: 3,
        sort_column: "position_value_quote",
        include_zero_balances: false,
      }),
    ]);

    const totalValueUsd = overview.holdings?.value_usd ?? 0;
    const solPrice = positionsResp.sol_price_usd ?? overview.sol_price_usd ?? 0;

    // Compute total PnL from positions
    let totalPnl = 0;
    let unrealizedPnl = 0;
    for (const pos of positionsResp.positions) {
      totalPnl += quoteToUsd(pos.total_pnl_quote, pos.token_info, solPrice);
      unrealizedPnl += quoteToUsd(pos.unrealized_pnl_quote, pos.token_info, solPrice);
    }

    const pnlPercent = totalValueUsd > 0 ? (totalPnl / totalValueUsd) * 100 : 0;

    const topHoldings = positionsResp.positions.slice(0, 3).map((pos: Position) => {
      const valueUsd = quoteToUsd(pos.position_value_quote, pos.token_info, solPrice);
      const pnl = pos.total_pnl_change_proportion * 100;
      return {
        symbol: pos.token_info?.symbol ?? "???",
        valueUsd: formatUsd(valueUsd),
        pnlPercent: formatPercent(pnl),
        isPositive: pnl >= 0,
      };
    });

    PortfolioWidget.updateSnapshot({
      totalValueUsd: formatUsd(totalValueUsd),
      pnl24h: formatUsd(totalPnl),
      pnl24hPercent: formatPercent(pnlPercent),
      isPnlPositive: totalPnl >= 0,
      unrealizedPnl: formatUsd(unrealizedPnl),
      topHoldings,
      updatedAt: timeAgo(new Date()),
    });
  } catch (e) {
    console.warn("[PortfolioWidget] update failed:", e);
  }
}

// ── Watchlist Widget ──

export async function updateWatchlistWidget(
  rpcClient: RpcClient
): Promise<void> {
  try {
    const watchlists = await fetchTokenWatchlists(rpcClient);
    const favorites = watchlists.find((w) => w.isFavorites);
    const list = favorites ?? watchlists[0];
    if (!list || list.tokens.length === 0) {
      WatchlistWidget.updateSnapshot({
        watchlistName: "Watchlist",
        tokens: [],
        updatedAt: "No tokens yet",
      });
      return;
    }

    const tokens = await fetchWatchlistTokens(rpcClient, list.tokens.slice(0, 3));

    WatchlistWidget.updateSnapshot({
      watchlistName: list.name,
      tokens: tokens.map((t) => ({
        symbol: t.symbol,
        marketCap: formatUsd(t.marketCapUsd),
        oneHourChange: formatPercent(t.oneHourChangePercent),
        isPositive: t.oneHourChangePercent >= 0,
      })),
      updatedAt: timeAgo(new Date()),
    });
  } catch (e) {
    console.warn("[WatchlistWidget] update failed:", e);
  }
}

// ── Wallet Activity Widget ──

export async function updateWalletActivityWidget(
  rpcClient: RpcClient
): Promise<void> {
  try {
    const watchlists = await fetchWalletWatchlists(rpcClient);
    if (watchlists.length === 0) {
      WalletActivityWidget.updateSnapshot({
        windowLabel: "30 min",
        tokens: [],
        updatedAt: "No wallets tracked",
      });
      return;
    }

    // Gather all tracked wallet addresses
    const walletSet = new Set<string>();
    for (const wl of watchlists.slice(0, 5)) {
      const resp = await fetchWalletWatchlist(rpcClient, wl.list_id);
      for (const w of resp.wallets ?? []) {
        walletSet.add(w.public_key);
      }
    }

    const allWallets = [...walletSet];
    if (allWallets.length === 0) {
      WalletActivityWidget.updateSnapshot({
        windowLabel: "30 min",
        tokens: [],
        updatedAt: "No wallets found",
      });
      return;
    }

    const activity = await fetchWalletActivity(rpcClient, allWallets, 100);
    const rows = activity.table?.rows ?? [];
    const tokenInfo = activity.mint_to_token_info ?? {};

    // Filter to last 30 minutes
    const thirtyMinAgo = Date.now() / 1000 - 30 * 60;
    const recentRows = rows.filter((r: AllTransactionsTableRow) => r.ts >= thirtyMinAgo);

    // Aggregate by token
    const tokenMap = new Map<
      string,
      { symbol: string; tradeCount: number; volumeSol: number; buys: number; total: number }
    >();
    for (const row of recentRows) {
      const existing = tokenMap.get(row.mint);
      const symbol =
        tokenInfo[row.mint]?.token_metadata?.symbol ?? row.mint.slice(0, 6);
      if (existing) {
        existing.tradeCount++;
        existing.volumeSol += Math.abs(row.amount_quote);
        if (row.type === "b") existing.buys++;
        existing.total++;
      } else {
        tokenMap.set(row.mint, {
          symbol,
          tradeCount: 1,
          volumeSol: Math.abs(row.amount_quote),
          buys: row.type === "b" ? 1 : 0,
          total: 1,
        });
      }
    }

    // Sort by trade count, take top 3
    const sorted = [...tokenMap.values()]
      .sort((a, b) => b.tradeCount - a.tradeCount)
      .slice(0, 3);

    WalletActivityWidget.updateSnapshot({
      windowLabel: "30 min",
      tokens: sorted.map((t) => ({
        symbol: t.symbol,
        tradeCount: String(t.tradeCount),
        volumeSol: formatSol(t.volumeSol),
        buyRatio: t.total > 0 ? t.buys / t.total : 0.5,
      })),
      updatedAt: timeAgo(new Date()),
    });
  } catch (e) {
    console.warn("[WalletActivityWidget] update failed:", e);
  }
}

// ── Chat Pulse Widget ──

export async function updateChatPulseWidget(
  rpcClient: RpcClient
): Promise<void> {
  try {
    const chats = await fetchTelegramChats(rpcClient);
    if (chats.length === 0) {
      ChatPulseWidget.updateSnapshot({
        windowLabel: "1h",
        tokens: [],
        updatedAt: "No chats connected",
      });
      return;
    }

    const oneHourAgo = Date.now() / 1000 - 60 * 60;
    const tokenMentions = new Map<
      string,
      { mint: string; count: number; senders: Set<string>; chatNames: Set<string> }
    >();

    // Check up to 5 most recent chats
    for (const chat of chats.slice(0, 5)) {
      const messages = await fetchTelegramMessages(rpcClient, chat.chatId, {
        messageTypes: [1], // token mentions only
        limit: 50,
      });

      for (const msg of messages) {
        if (msg.timestamp < oneHourAgo) continue;
        if (!msg.tokenMint) continue;

        const existing = tokenMentions.get(msg.tokenMint);
        if (existing) {
          existing.count++;
          existing.senders.add(msg.username);
          existing.chatNames.add(chat.name);
        } else {
          tokenMentions.set(msg.tokenMint, {
            mint: msg.tokenMint,
            count: 1,
            senders: new Set([msg.username]),
            chatNames: new Set([chat.name]),
          });
        }
      }
    }

    // Sort by mention count, take top 3
    const sorted = [...tokenMentions.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    // Resolve token symbols
    const mints = sorted.map((t) => t.mint);
    const tokenData =
      mints.length > 0 ? await fetchWatchlistTokens(rpcClient, mints) : [];
    const symbolMap = new Map(tokenData.map((t) => [t.mint, t.symbol]));

    ChatPulseWidget.updateSnapshot({
      windowLabel: "1h",
      tokens: sorted.map((t) => ({
        symbol: symbolMap.get(t.mint) ?? t.mint.slice(0, 6),
        mentionCount: String(t.count),
        uniqueSenders: String(t.senders.size),
        chatNames: [...t.chatNames].slice(0, 2).join(", "),
      })),
      updatedAt: timeAgo(new Date()),
    });
  } catch (e) {
    console.warn("[ChatPulseWidget] update failed:", e);
  }
}

// ── Update all widgets ──

export async function updateAllWidgets(
  rpcClient: RpcClient,
  account: string
): Promise<void> {
  await Promise.allSettled([
    updatePortfolioWidget(rpcClient, account),
    updateWatchlistWidget(rpcClient),
    updateWalletActivityWidget(rpcClient),
    updateChatPulseWidget(rpcClient),
  ]);
}
