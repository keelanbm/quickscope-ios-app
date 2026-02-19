import type { RpcClient } from "@/src/lib/api/rpcClient";

export type DiscoveryTabId = "trending" | "gainers";

type DiscoverySort = {
  sortColumn: string;
  sortOrderDescending: boolean;
};

type DiscoveryTokenRow = {
  mint: string;
  symbol: string;
  name: string;
  image_uri?: string;
  platform?: string;
  exchange?: string;
  twitter_url?: string;
  telegram_url?: string;
  website_url?: string;
  mint_ts: number;
  market_cap_sol: number;
  one_hour_volume_sol: number;
  one_hour_tx_count: number;
  one_hour_change: number;
  telegram_mentions_1h: number;
  decimals?: number;
};

type DiscoveryTableResponse = {
  sol_price_usd: number;
  table: {
    rows: DiscoveryTokenRow[];
  };
};

export type DiscoveryToken = {
  mint: string;
  symbol: string;
  name: string;
  imageUri?: string;
  platform?: string;
  exchange?: string;
  twitterUrl?: string;
  telegramUrl?: string;
  websiteUrl?: string;
  mintedAtSeconds: number;
  marketCapUsd: number;
  oneHourVolumeUsd: number;
  oneHourTxCount: number;
  oneHourChangePercent: number;
  scanMentionsOneHour: number;
  tokenDecimals?: number;
};

type DiscoveryResult = {
  tab: DiscoveryTabId;
  fetchedAtMs: number;
  rows: DiscoveryToken[];
};

const tabSorts: Record<DiscoveryTabId, DiscoverySort> = {
  trending: {
    sortColumn: "one_hour_volume_sol",
    sortOrderDescending: true,
  },
  gainers: {
    sortColumn: "one_hour_change",
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

export async function fetchDiscoveryTokens(
  rpcClient: RpcClient,
  tab: DiscoveryTabId
): Promise<DiscoveryResult> {
  const sort = tabSorts[tab];
  const response = await rpcClient.call<DiscoveryTableResponse>("public/filterTokensTable", [
    {
      filter: {
        sort_column: sort.sortColumn,
        sort_order: !sort.sortOrderDescending,
        row_limit: 20,
      },
    },
  ]);

  const solPriceUsd = toNumber(response.sol_price_usd);
  const nowSeconds = Math.floor(Date.now() / 1000);

  let mappedRows = (response.table?.rows ?? []).map((row) => {
    const tokenDecimals = toOptionalInteger(row.decimals);

    return {
      mint: row.mint,
      symbol: row.symbol,
      name: row.name,
      imageUri: row.image_uri,
      platform: row.platform,
      exchange: row.exchange,
      twitterUrl: row.twitter_url,
      telegramUrl: row.telegram_url,
      websiteUrl: row.website_url,
      mintedAtSeconds: toNumber(row.mint_ts),
      marketCapUsd: toNumber(row.market_cap_sol) * solPriceUsd,
      oneHourVolumeUsd: toNumber(row.one_hour_volume_sol) * solPriceUsd,
      oneHourTxCount: toNumber(row.one_hour_tx_count),
      oneHourChangePercent: toNumber(row.one_hour_change) * 100,
      scanMentionsOneHour: toNumber(row.telegram_mentions_1h),
      ...(tokenDecimals !== undefined ? { tokenDecimals } : null),
    };
  });

  // "trending" tab acts as "New Pairs" — only show tokens minted in the last hour
  if (tab === "trending") {
    const oneHourAgo = nowSeconds - 3600;
    mappedRows = mappedRows.filter(
      (row) => row.mintedAtSeconds > 0 && row.mintedAtSeconds >= oneHourAgo
    );
  }

  return {
    tab,
    fetchedAtMs: Date.now(),
    rows: mappedRows,
  };
}
