import type { RpcClient } from "@/src/lib/api/rpcClient";

export type ScopeTabId = "new-pairs" | "momentum" | "scan-surge";

type ScopeSort = {
  sortColumn: string;
  sortOrderDescending: boolean;
};

type ScopeTokenRow = {
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

type ScopeTableResponse = {
  sol_price_usd: number;
  table: {
    rows: ScopeTokenRow[];
  };
};

export type ScopeToken = {
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

type ScopeResult = {
  tab: ScopeTabId;
  fetchedAtMs: number;
  rows: ScopeToken[];
};

const tabSorts: Record<ScopeTabId, ScopeSort> = {
  "new-pairs": {
    sortColumn: "mint_ts",
    sortOrderDescending: true,
  },
  momentum: {
    sortColumn: "one_hour_tx_count",
    sortOrderDescending: true,
  },
  "scan-surge": {
    sortColumn: "telegram_mentions_1h",
    sortOrderDescending: true,
  },
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

export async function fetchScopeTokens(
  rpcClient: RpcClient,
  tab: ScopeTabId
): Promise<ScopeResult> {
  const sort = tabSorts[tab];
  const response = await rpcClient.call<ScopeTableResponse>("public/filterTokensTable", [
    {
      filter: {
        sort_column: sort.sortColumn,
        sort_order: !sort.sortOrderDescending,
        row_limit: 50,
      },
    },
  ]);

  const solPriceUsd = toNumber(response.sol_price_usd);

  return {
    tab,
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
