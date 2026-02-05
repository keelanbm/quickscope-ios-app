import type { RpcClient } from "@/src/lib/api/rpcClient";

export type WalletWatchlist = {
  list_id: number;
  name: string;
  description?: string;
};

export type TrackedWallet = {
  list_id: number;
  public_key: string;
  name: string;
  emoji?: string;
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
  return rpcClient.call<WalletWatchlist[]>("private/getAllWalletWatchlists", []);
}

export async function fetchWalletWatchlist(
  rpcClient: RpcClient,
  watchlistId: number
): Promise<WalletWatchlistResponse> {
  return rpcClient.call<WalletWatchlistResponse>("private/getWalletWatchlist", [watchlistId]);
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
