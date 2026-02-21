import type { RpcClient } from "@/src/lib/api/rpcClient";

// ── Tab & filter types ──

export type ScopeTabId = "new" | "graduating" | "graduated" | "scans";

/** User-configurable filters (per-tab). All fields optional — omitted = no filter. */
export type ScopeFilters = {
  /** Exchange/launchpad codes to include (e.g. ['p','b']). Overrides tab default when set. */
  exchanges?: string[];
  /** Market cap range in SOL */
  minMarketCapSol?: number;
  maxMarketCapSol?: number;
  /** 1h volume range in SOL */
  minVolumeSol?: number;
  maxVolumeSol?: number;
  /** Age range in seconds (mint_ts) */
  minAgeSec?: number;
  maxAgeSec?: number;
  /** 1h transaction count range */
  minTxCount?: number;
  maxTxCount?: number;
};

// ── Exchange / launchpad constants (from web terminal types/exchanges.ts) ──

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

/** Default exchange filter for most tabs (matches web terminal) */
const DEFAULT_EXCHANGES = ["p", "b"];

// ── Tab configuration ──

type TabConfig = {
  sortColumn: string;
  /** true = we want descending order */
  sortOrderDescending: boolean;
  /** Default string_filters baked into the tab (exchange + bonding status) */
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

/** Build the numeric_filters array from user-configurable ScopeFilters */
function buildNumericFilters(filters?: ScopeFilters): NumericFilter[] | undefined {
  if (!filters) return undefined;

  const result: NumericFilter[] = [];

  if (filters.minMarketCapSol !== undefined || filters.maxMarketCapSol !== undefined) {
    result.push({ column: "market_cap_sol", min: filters.minMarketCapSol, max: filters.maxMarketCapSol });
  }
  if (filters.minVolumeSol !== undefined || filters.maxVolumeSol !== undefined) {
    result.push({ column: "one_hour_volume_sol", min: filters.minVolumeSol, max: filters.maxVolumeSol });
  }
  if (filters.minAgeSec !== undefined || filters.maxAgeSec !== undefined) {
    // Convert age constraints to mint_ts range:
    // minAgeSec → max mint_ts (newer than X seconds ago)
    // maxAgeSec → min mint_ts (older than X seconds ago)
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

  return result.length > 0 ? result : undefined;
}

/** Build the string_filters array, merging tab defaults with user overrides */
function buildStringFilters(
  tabDefaults: StringFilter[],
  filters?: ScopeFilters
): StringFilter[] | undefined {
  const result: StringFilter[] = [];

  // Exchange filter: user override or tab default
  if (filters?.exchanges && filters.exchanges.length > 0) {
    result.push({ column: "exchange", values: filters.exchanges });
  } else {
    const exchangeDefault = tabDefaults.find((f) => f.column === "exchange");
    if (exchangeDefault) {
      result.push(exchangeDefault);
    }
  }

  // Status filter: always from tab defaults (not user-configurable)
  const statusDefault = tabDefaults.find((f) => f.column === "status");
  if (statusDefault) {
    result.push(statusDefault);
  }

  return result.length > 0 ? result : undefined;
}

// ── Main fetch ──

export async function fetchScopeTokens(
  rpcClient: RpcClient,
  tab: ScopeTabId,
  filters?: ScopeFilters
): Promise<ScopeResult> {
  const config = tabConfigs[tab];

  const numeric_filters = buildNumericFilters(filters);
  const string_filters = buildStringFilters(config.defaultStringFilters, filters);

  // sort_order: true = ascending, false = descending (confirmed from web terminal)
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
