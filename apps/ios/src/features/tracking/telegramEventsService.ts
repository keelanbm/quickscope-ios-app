import type { RpcClient } from "@/src/lib/api/rpcClient";

type RawTelegramEvent = {
  idx: number;
  ts: number;
  event_type?: string;
  mint?: string;
  chat_id?: string;
  user_id?: string;
  symbol?: string;
  name?: string;
  image_uri?: string;
  initial_price_usd?: number;
  current_price_usd?: number;
  peak_return?: number;
};

type TelegramEventsFeedResponse = {
  events: RawTelegramEvent[];
};

export type TelegramEvent = {
  id: number;
  timestamp: number;
  eventType: string;
  mint: string;
  symbol: string;
  name: string;
  imageUri?: string;
  chatId: string;
  userId: string;
  initialPriceUsd: number;
  currentPriceUsd: number;
  peakReturnPercent: number;
};

function toNumber(value: unknown): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

export async function fetchTelegramEvents(
  rpcClient: RpcClient,
  limit = 30,
  offset = 0
): Promise<TelegramEvent[]> {
  const response = await rpcClient.call<TelegramEventsFeedResponse>(
    "private/getTelegramEventsFeed",
    [{ limit, offset, sort_column: "ts", sort_order: false }]
  );

  return (response.events ?? []).map((event) => ({
    id: event.idx,
    timestamp: toNumber(event.ts),
    eventType: event.event_type || "scan",
    mint: event.mint || "",
    symbol: event.symbol || event.mint?.slice(0, 4) || "???",
    name: event.name || "Unknown",
    imageUri: event.image_uri,
    chatId: event.chat_id || "",
    userId: event.user_id || "",
    initialPriceUsd: toNumber(event.initial_price_usd),
    currentPriceUsd: toNumber(event.current_price_usd),
    peakReturnPercent: toNumber(event.peak_return) * 100,
  }));
}
