import type { RpcClient } from "@/src/lib/api/rpcClient";

// ── Tab & filter types ──

export type ScopeTabId = "new" | "graduating" | "graduated" | "scans";

export type ScopeFilters = {
  exchanges?: string[];
  minMarketCapSol?: number;
  maxMarketCapSol?: number;
  minVolumeSol?: number;
  maxVolumeSol?: number;
  minAgeSec?: number;
  maxAgeSec?: number;
  minTxCount?: number;
  maxTxCount?: number;
  minHolderCount?: number;
  maxHolderCount?: number;
  minTop25Pct?: number;
  maxTop25Pct?: number;
  minDevPct?: number;
  maxDevPct?: number;
  minBondingCurvePct?: number;
  maxBondingCurvePct?: number;
  minTwitterFollowers?: number;
  maxTwitterFollowers?: number;
  hasTwitter?: boolean;
  hasTelegram?: boolean;
  hasWebsite?: boolean;
};

// ── Exchange / launchpad constants ──

export const LAUNCHPADS = {
  Pumpfun: "p",
  Bonkfun: "b",
  Believe: "l",
  Heaven: "h",
  Moonshot: "m",
  JupStudio: "j",
  Bags: "s",
  LaunchLab: "a",
  DBC: "f",
} as const;

export const EXCHANGES = {
  Raydium: "v",
  RaydiumCPMM: "r",
  PumpSwap: "w",
  DammV1: "d",
  DammV2: "e",
} as const;

export const LAUNCHPAD_LABELS: Record<string, string> = {
  p: "Pump",
  b: "Bonk",
  l: "Believe",
  h: "Heaven",
  m: "Moonshot",
  j: "Jup Studio",
  s: "Bags",
  a: "LaunchLab",
  f: "DBC",
  v: "Raydium",
  r: "Raydium",
  w: "PumpSwap",
  d: "Damm",
  e: "Damm",
};

const DEFAULT_EXCHANGES = ["p", "b"];

// ── Tab configuration ──

type TabConfig = {
  sortColumn: string;
  sortOrderDescending: boolean;
  defaultStringFilters: Array<{ column: string; values: string[] }>;
};

const tabConfigs: Record<ScopeTabId, TabConfig> = {
  new: {
    sortColumn: "mint_ts",
    sortOrderDescending: true,
    defaultStringFilters: [
      { column: "exchange", values: DEFAULT_EXCHANGES },
      { column: "status", values: ["Not Bonded"] },
    ],
  },
  graduating: {
    sortColumn: "market_cap_sol",
    sortOrderDescending: true,
    defaultStringFilters: [
      { column: "exchange", values: DEFAULT_EXCHANGES },
      { column: "status", values: ["Not Bonded"] },
    ],
  },
  graduated: {
    sortColumn: "pair_creation_ts",
    sortOrderDescending: true,
    defaultStringFilters: [
      { column: "exchange", values: DEFAULT_EXCHANGES },
      { column: "status", values: ["Bonded"] },
    ],
  },
  scans: {
    sortColumn: "telegram_mentions_1h",
    sortOrderDescending: true,
    defaultStringFilters: [],
  },
};

// ── API types ──

type NumericFilter = { column: string; min?: number; max?: number };
type StringFilter = { column: string; values: string[] };

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

// ── Helpers ──

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

export function buildNumericFilters(
  filters?: ScopeFilters,
): NumericFilter[] | undefined {
  if (!filters) return undefined;

  const result: NumericFilter[] = [];

  if (filters.minMarketCapSol !== undefined || filters.maxMarketCapSol !== undefined) {
    result.push({ column: "market_cap_sol", min: filters.minMarketCapSol, max: filters.maxMarketCapSol });
  }
  if (filters.minVolumeSol !== undefined || filters.maxVolumeSol !== undefined) {
    result.push({ column: "one_hour_volume_sol", min: filters.minVolumeSol, max: filters.maxVolumeSol });
  }
  if (filters.minAgeSec !== undefined || filters.maxAgeSec !== undefined) {
    const now = Math.floor(Date.now() / 1000);
    result.push({
      column: "mint_ts",
      min: filters.maxAgeSec !== undefined ? now - filters.maxAgeSec : undefined,
      max: filters.minAgeSec !== undefined ? now - filters.minAgeSec : undefined,
    });
  }
  if (filters.minTxCount !== undefined || filters.maxTxCount !== undefined) {
    result.push({ column: "one_hour_tx_count", min: filters.minTxCount, max: filters.maxTxCount });
  }
  if (filters.minHolderCount !== undefined || filters.maxHolderCount !== undefined) {
    result.push({ column: "holder_count", min: filters.minHolderCount, max: filters.maxHolderCount });
  }
  if (filters.minTop25Pct !== undefined || filters.maxTop25Pct !== undefined) {
    result.push({ column: "top_25_holdings_proportion", min: filters.minTop25Pct, max: filters.maxTop25Pct });
  }
  if (filters.minDevPct !== undefined || filters.maxDevPct !== undefined) {
    result.push({ column: "dev_holdings_proportion", min: filters.minDevPct, max: filters.maxDevPct });
  }
  if (filters.minBondingCurvePct !== undefined || filters.maxBondingCurvePct !== undefined) {
    result.push({ column: "bonding_curve_progress", min: filters.minBondingCurvePct, max: filters.maxBondingCurvePct });
  }
  if (filters.minTwitterFollowers !== undefined || filters.maxTwitterFollowers !== undefined) {
    result.push({ column: "twitter_followers", min: filters.minTwitterFollowers, max: filters.maxTwitterFollowers });
  }

  return result.length > 0 ? result : undefined;
}

export function buildStringFilters(
  tabDefaults: StringFilter[],
  filters?: ScopeFilters,
): StringFilter[] | undefined {
  const result: StringFilter[] = [];

  if (filters?.exchanges && filters.exchanges.length > 0) {
    result.push({ column: "exchange", values: filters.exchanges });
  } else {
    const exchangeDefault = tabDefaults.find((f) => f.column === "exchange");
    if (exchangeDefault) {
      result.push(exchangeDefault);
    }
  }

  const statusDefault = tabDefaults.find((f) => f.column === "status");
  if (statusDefault) {
    result.push(statusDefault);
  }

  if (filters?.hasTwitter) {
    result.push({ column: "has_twitter", values: ["true"] });
  }
  if (filters?.hasTelegram) {
    result.push({ column: "has_telegram", values: ["true"] });
  }
  if (filters?.hasWebsite) {
    result.push({ column: "has_website", values: ["true"] });
  }

  return result.length > 0 ? result : undefined;
}

// ── Main fetch ──

export async function fetchScopeTokens(
  rpcClient: RpcClient,
  tab: ScopeTabId,
  filters?: ScopeFilters,
): Promise<ScopeResult> {
  const config = tabConfigs[tab];

  const numeric_filters = buildNumericFilters(filters);
  const string_filters = buildStringFilters(config.defaultStringFilters, filters);

  const response = await rpcClient.call<ScopeTableResponse>("public/filterTokensTable", [
    {
      filter: {
        sort_column: config.sortColumn,
        sort_order: !config.sortOrderDescending,
        row_limit: 20,
        ...(numeric_filters ? { numeric_filters } : null),
        ...(string_filters ? { string_filters } : null),
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
