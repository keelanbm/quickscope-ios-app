import type { RpcClient } from "@/src/lib/api/rpcClient";

export type TokenWatchlist = {
  id: number;
  name: string;
  description?: string;
  tokens: string[];
  isFavorites?: boolean;
};

/** Row returned by filterTokensTable when queried for specific mints */
export type WatchlistTokenRow = {
  mint: string;
  symbol: string;
  name: string;
  image_uri?: string;
  platform?: string;
  exchange?: string;
  market_cap_sol: number;
  one_hour_volume_sol: number;
  one_hour_change: number;
  one_day_volume_sol: number;
  one_day_change: number;
  holders: number;
};

type WatchlistTokenTableResponse = {
  sol_price_usd: number;
  table: {
    rows: WatchlistTokenRow[];
  };
};

export type EnrichedWatchlistToken = {
  mint: string;
  symbol: string;
  name: string;
  imageUri?: string;
  marketCapUsd: number;
  oneHourVolumeUsd: number;
  oneHourChangePercent: number;
  oneDayVolumeUsd: number;
  oneDayChangePercent: number;
  holders: number;
};

function toNumber(value: unknown): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

export async function fetchTokenWatchlists(
  rpcClient: RpcClient
): Promise<TokenWatchlist[]> {
  return rpcClient.call<TokenWatchlist[]>("private/getAllTokenWatchlists", []);
}

export async function fetchWatchlistTokens(
  rpcClient: RpcClient,
  mints: string[]
): Promise<EnrichedWatchlistToken[]> {
  if (mints.length === 0) return [];

  const response = await rpcClient.call<WatchlistTokenTableResponse>(
    "public/filterTokensTable",
    [
      {
        filter: {
          sort_column: "one_day_volume_sol",
          sort_order: false,
          row_limit: mints.length,
          mint_filter: mints,
        },
      },
    ]
  );

  const solPriceUsd = toNumber(response.sol_price_usd);

  return (response.table?.rows ?? []).map((row) => ({
    mint: row.mint,
    symbol: row.symbol || "???",
    name: row.name || "Unknown",
    imageUri: row.image_uri,
    marketCapUsd: toNumber(row.market_cap_sol) * solPriceUsd,
    oneHourVolumeUsd: toNumber(row.one_hour_volume_sol) * solPriceUsd,
    oneHourChangePercent: toNumber(row.one_hour_change) * 100,
    oneDayVolumeUsd: toNumber(row.one_day_volume_sol) * solPriceUsd,
    oneDayChangePercent: toNumber(row.one_day_change) * 100,
    holders: toNumber(row.holders),
  }));
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
