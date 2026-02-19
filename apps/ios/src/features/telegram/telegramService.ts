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

export async function fetchTelegramChats(
  rpcClient: RpcClient,
  limit = 100
): Promise<TelegramChatInfo[]> {
  return rpcClient.call<TelegramChatInfo[]>("private/getTelegramChats", [limit]);
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
