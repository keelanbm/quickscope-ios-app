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
  return rpcClient.call<TokenWatchlist[]>("private/getAllTokenWatchlists", []);
}

export async function addTokenToWatchlist(
  rpcClient: RpcClient,
  watchlistId: number,
  tokenAddress: string
): Promise<boolean> {
  return rpcClient.call<boolean>("private/addToTokenWatchlist", [watchlistId, tokenAddress]);
}

export async function removeTokenFromWatchlist(
  rpcClient: RpcClient,
  watchlistId: number,
  tokenAddress: string
): Promise<boolean> {
  return rpcClient.call<boolean>("private/removeTokenFromWatchlist", [watchlistId, tokenAddress]);
}
