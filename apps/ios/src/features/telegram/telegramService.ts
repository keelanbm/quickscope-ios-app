import type { RpcClient } from "@/src/lib/api/rpcClient";

export type TelegramChatInfo = {
  chat_id: number | string;
  user_id?: number | string;
  name: string;
  chat_type?: string;
  chat_image?: string;
};

export type TelegramMessageWithToken = {
  token_mint?: string;
  msg_body: string;
  username: string;
  ts: number;
  msg_id: number | string;
  reply_to_message_id?: number;
  chat_id: number | string;
  user_id: number | string;
};

export type TelegramMessagesResponse = {
  messages: TelegramMessageWithToken[];
};

export type TelegramUsernameAndId = {
  UserId: number;
  name: string;
};

export type ShareTokenResult = {
  success: boolean;
};

export async function fetchTelegramChats(
  rpcClient: RpcClient,
  limit = 100
): Promise<TelegramChatInfo[]> {
  return rpcClient.call<TelegramChatInfo[]>("private/getTelegramChats", [limit]);
}

/**
 * Check if the user has linked their Telegram account.
 * Returns their Telegram user ID and display name if linked.
 */
export async function fetchTelegramUserId(
  rpcClient: RpcClient
): Promise<TelegramUsernameAndId> {
  return rpcClient.call<TelegramUsernameAndId>("private/getTelegramUserId", []);
}

/**
 * Unlink the user's Telegram account.
 */
export async function unlinkTelegram(rpcClient: RpcClient): Promise<void> {
  await rpcClient.call<unknown>("private/unlinkTelegram", []);
}

/**
 * Generate a one-time access code for linking Telegram via the bot.
 * Code expires after ~30 seconds.
 */
export async function createAccessCode(rpcClient: RpcClient): Promise<string> {
  return rpcClient.call<string>("auth/createAccessCode", []);
}

/**
 * Share a token (scan) to one or more Telegram group chats.
 * Server-side: the bot sends the formatted message to each chat.
 */
export async function shareTokenToChats(
  rpcClient: RpcClient,
  params: {
    mintAddress: string;
    chatIds: (number | string)[];
    msg?: string;
  }
): Promise<ShareTokenResult> {
  const { mintAddress, chatIds, msg } = params;
  return rpcClient.call<ShareTokenResult>("private/shareToken", [
    mintAddress,
    chatIds,
    msg ?? "",
  ]);
}

export async function fetchTelegramMessages(
  rpcClient: RpcClient,
  params: {
    chatId: number | string;
    limit?: number;
    offset?: number;
    messageTypes?: number[];
  }
): Promise<TelegramMessagesResponse> {
  const { chatId, limit = 50, offset = 0, messageTypes } = params;
  return rpcClient.call<TelegramMessagesResponse>("private/getAllMessages", [
    limit,
    {
      chats: [chatId],
      message_types: messageTypes,
      offset,
    },
  ]);
}
