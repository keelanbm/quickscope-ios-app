import type { RpcClient } from "@/src/lib/api/rpcClient";

export type TokenWatchlist = {
  id: number;
  name: string;
  description?: string;
  tokens: string[];
  isFavorites?: boolean;
};

export async function fetchTokenWatchlists(
  rpcClient: RpcClient
): Promise<TokenWatchlist[]> {
  const lists = await rpcClient.call<TokenWatchlist[]>("private/getAllTokenWatchlists", []);
  return (lists ?? []).map((list) => ({
    ...list,
    isFavorites: list.name === "favorites",
  }));
}

export async function createTokenWatchlist(
  rpcClient: RpcClient,
  name: string,
  description = ""
): Promise<number> {
  const params = { name, description };
  return rpcClient.call<number>("private/createTokenWatchlist", Object.values(params));
}

export async function deleteTokenWatchlist(
  rpcClient: RpcClient,
  watchlistId: number
): Promise<boolean> {
  const params = { watchlistId };
  return rpcClient.call<boolean>("private/deleteTokenWatchlist", Object.values(params));
}

export async function addTokenToWatchlist(
  rpcClient: RpcClient,
  watchlistId: number,
  tokenAddress: string
): Promise<boolean> {
  const params = { watchlistId, token: tokenAddress };
  return rpcClient.call<boolean>("private/addToTokenWatchlist", Object.values(params));
}

export async function removeTokenFromWatchlist(
  rpcClient: RpcClient,
  watchlistId: number,
  tokenAddress: string
): Promise<boolean> {
  const params = { watchlistId, token: tokenAddress };
  return rpcClient.call<boolean>("private/removeTokenFromWatchlist", Object.values(params));
}
