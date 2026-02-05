import type { RpcClient } from "@/src/lib/api/rpcClient";

type SearchTokenRow = {
  mint: string;
  symbol: string;
  name: string;
  image_uri?: string;
  platform?: string;
  exchange?: string;
  mint_ts: number;
  market_cap_sol: number;
  one_hour_tx_count: number;
  one_hour_volume_sol: number;
  one_hour_change: number;
  telegram_mentions_1h: number;
  decimals?: number;
};

type SearchTableResponse = {
  sol_price_usd: number;
  table: {
    rows: SearchTokenRow[];
  };
};

export type SearchToken = {
  mint: string;
  symbol: string;
  name: string;
  imageUri?: string;
  platform?: string;
  exchange?: string;
  mintedAtSeconds: number;
  marketCapUsd: number;
  oneHourTxCount: number;
  oneHourVolumeUsd: number;
  oneHourChangePercent: number;
  scanMentionsOneHour: number;
  tokenDecimals?: number;
};

export type SearchResult = {
  fetchedAtMs: number;
  rows: SearchToken[];
};

function toNumber(value: unknown): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function toOptionalInteger(value: unknown): number | undefined {
  const numeric = Number(value);
  if (!Number.isInteger(numeric) || numeric < 0) {
    return undefined;
  }

  return numeric;
}

export async function fetchSearchTokens(rpcClient: RpcClient): Promise<SearchResult> {
  const response = await rpcClient.call<SearchTableResponse>("public/filterTokensTable", [
    {
      filter: {
        sort_column: "one_hour_volume_sol",
        sort_order: false,
        row_limit: 200,
      },
    },
  ]);

  const solPriceUsd = toNumber(response.sol_price_usd);

  return {
    fetchedAtMs: Date.now(),
    rows: (response.table?.rows ?? []).map((row) => {
      const tokenDecimals = toOptionalInteger(row.decimals);

      return {
        mint: row.mint,
        symbol: row.symbol,
        name: row.name,
        imageUri: row.image_uri,
        platform: row.platform,
        exchange: row.exchange,
        mintedAtSeconds: toNumber(row.mint_ts),
        marketCapUsd: toNumber(row.market_cap_sol) * solPriceUsd,
        oneHourTxCount: toNumber(row.one_hour_tx_count),
        oneHourVolumeUsd: toNumber(row.one_hour_volume_sol) * solPriceUsd,
        oneHourChangePercent: toNumber(row.one_hour_change) * 100,
        scanMentionsOneHour: toNumber(row.telegram_mentions_1h),
        ...(tokenDecimals !== undefined ? { tokenDecimals } : null),
      };
    }),
  };
}
