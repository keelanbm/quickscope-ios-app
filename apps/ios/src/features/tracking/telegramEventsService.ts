import type { RpcClient } from "@/src/lib/api/rpcClient";

/* ── Chat list (for drawer sidebar) ── */

export type TelegramChat = {
  chatId: string;
  name: string;
  chatType: string;
  chatImage: string;
  msgCount: number;
  lastMsgTs: number;
};

type RawTelegramChat = {
  chat_id: number | string;
  user_id?: number | string;
  name?: string;
  chat_type?: string;
  chat_image?: string;
  msg_count?: number;
  last_msg_ts?: number;
};

export async function fetchTelegramChats(
  rpcClient: RpcClient
): Promise<TelegramChat[]> {
  const response = await rpcClient.call<RawTelegramChat[]>(
    "private/getTelegramChats",
    []
  );

  const chats = Array.isArray(response) ? response : [];

  return chats
    .filter((c) => c.chat_type !== "private")
    .map((c) => ({
      chatId: String(c.chat_id),
      name: c.name || "Unknown chat",
      chatType: c.chat_type || "group",
      chatImage: c.chat_image || "",
      msgCount: c.msg_count ?? 0,
      lastMsgTs: c.last_msg_ts ?? 0,
    }))
    .sort((a, b) => b.lastMsgTs - a.lastMsgTs);
}

/* ── Messages for a selected chat ── */

export type TelegramMessage = {
  id: string;
  chatId: string;
  userId: string;
  username: string;
  body: string;
  timestamp: number;
  tokenMint: string | null;
  msgType: number; // 0=text, 1=token, 2=tweet
};

type RawMessage = {
  msg_id: number | string;
  chat_id: number | string;
  user_id: number | string;
  username?: string;
  msg_body?: string;
  ts?: number;
  token_mint?: string;
  msg_type?: number;
  reply_to_message_id?: number;
};

type AllMessagesResponse = {
  messages: RawMessage[] | null;
};

export async function fetchTelegramMessages(
  rpcClient: RpcClient,
  chatId: string,
  options?: { messageTypes?: number[]; limit?: number; offset?: number }
): Promise<TelegramMessage[]> {
  const limit = options?.limit ?? 50;
  const filter: Record<string, unknown> = {
    chats: [chatId],
    offset: options?.offset ?? 0,
  };
  if (options?.messageTypes && options.messageTypes.length > 0) {
    filter.message_types = options.messageTypes;
  }

  const response = await rpcClient.call<AllMessagesResponse>(
    "private/getAllMessages",
    [limit, filter]
  );

  const messages = response?.messages ?? [];

  return messages.map((m) => ({
    id: String(m.msg_id),
    chatId: String(m.chat_id),
    userId: String(m.user_id),
    username: m.username || "anon",
    body: m.msg_body || "",
    timestamp: m.ts ?? 0,
    tokenMint: m.token_mint && m.token_mint !== "11111111111111111111111111111111" ? m.token_mint : null,
    msgType: m.msg_type ?? 0,
  }));
}

/* ── Legacy export kept for backward compat (type only) ── */
export type TelegramEvent = TelegramMessage;
