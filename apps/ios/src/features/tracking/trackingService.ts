import type { RpcClient } from "@/src/lib/api/rpcClient";

export type WalletWatchlist = {
  list_id: number;
  name: string;
  description?: string;
  isFavorites?: boolean;
};

export type TrackedWallet = {
  list_id: number;
  public_key: string;
  name: string;
  emoji?: string;
  description?: string;
};

export type WalletWatchlistResponse = {
  wallet_watchlist: WalletWatchlist;
  wallets: TrackedWallet[] | null;
};

export type TokenMetadata = {
  mint?: string;
  name?: string;
  symbol?: string;
  image_uri?: string;
  platform?: string;
  exchange?: string;
};

export type AllTransactionsTableRow = {
  amount_base: number;
  amount_quote: number;
  index: string;
  maker: string;
  mint: string;
  ts: number;
  type: string;
  signature: string;
};

export type AllTransactionsTableResponse = {
  mint_to_token_info: Record<
    string,
    {
      token_metadata?: TokenMetadata;
    }
  >;
  table: {
    rows: AllTransactionsTableRow[];
  };
};

export async function fetchWalletWatchlists(
  rpcClient: RpcClient
): Promise<WalletWatchlist[]> {
  const lists = await rpcClient.call<WalletWatchlist[]>("private/getAllWalletWatchlists", []);
  return (lists ?? []).map((list) => ({
    ...list,
    isFavorites: list.name === "favorites",
  }));
}

export async function createWalletWatchlist(
  rpcClient: RpcClient,
  name: string,
  description = ""
): Promise<number> {
  const params = { name, description };
  return rpcClient.call<number>("private/createWalletWatchlist", Object.values(params));
}

export async function addWalletToWatchlist(
  rpcClient: RpcClient,
  params: {
    watchlistId: number;
    publicKey: string;
    name: string;
    description?: string;
    emoji: string;
  }
): Promise<boolean> {
  const payload = {
    watchlistId: params.watchlistId,
    publicKey: params.publicKey,
    name: params.name,
    description: params.description ?? "",
    emoji: params.emoji,
  };
  return rpcClient.call<boolean>("private/addToWalletWatchlist", Object.values(payload));
}

export async function removeWalletFromWatchlist(
  rpcClient: RpcClient,
  watchlistId: number,
  publicKey: string
): Promise<boolean> {
  const params = { watchlistId, publicKey };
  return rpcClient.call<boolean>("private/removeWalletFromWatchlist", Object.values(params));
}

export async function fetchWalletWatchlist(
  rpcClient: RpcClient,
  watchlistId: number
): Promise<WalletWatchlistResponse> {
  const params = { watchlistId };
  return rpcClient.call<WalletWatchlistResponse>("private/getWalletWatchlist", Object.values(params));
}

export async function fetchWalletActivity(
  rpcClient: RpcClient,
  addresses: string[],
  rowLimit = 30
): Promise<AllTransactionsTableResponse> {
  return rpcClient.call<AllTransactionsTableResponse>("public/filterAllTransactionsTable", [
    {
      address_filters: [
        {
          column: "maker",
          addresses,
        },
      ],
      row_limit: rowLimit,
      sort_column: "index",
      sort_order: false,
    },
  ]);
}
