import type { RpcClient } from "@/src/lib/api/rpcClient";
import type { LiveTokenInfo } from "@/src/features/token/tokenService";

export type TokenActivityRow = {
  amount_base: number;
  amount_quote: number;
  index: string;
  maker: string;
  mint: string;
  price?: number;
  quote_asset_price_usd?: number;
  signature: string;
  ts: number;
  type: string;
};

export type TokenActivityResponse = {
  token_info?: LiveTokenInfo;
  table: {
    rows: TokenActivityRow[];
  };
};

export async function fetchTokenActivity(
  rpcClient: RpcClient,
  params: {
    mint: string;
    rowLimit?: number;
    sortColumn?: string;
    sortOrder?: boolean;
  }
): Promise<TokenActivityResponse> {
  const { mint, rowLimit = 30, sortColumn = "index", sortOrder = false } = params;

  return rpcClient.call<TokenActivityResponse>("public/filterAllTransactionsTable", [
    {
      address_filters: [
        {
          column: "mint",
          addresses: [mint],
        },
      ],
      row_limit: rowLimit,
      sort_column: sortColumn,
      sort_order: sortOrder,
    },
  ]);
}

export type TokenHolder = {
  owner: string;
  balance: number;
  labels?: string[];
};

export type TokenHoldersResponse = {
  holder_count: number;
  holders: TokenHolder[];
};

export async function fetchTokenHolders(
  rpcClient: RpcClient,
  params: {
    mint: string;
    limit?: number;
    offset?: number;
    includeZeroBalances?: boolean;
  }
): Promise<TokenHoldersResponse> {
  const { mint, limit = 50, offset = 0, includeZeroBalances = false } = params;

  return rpcClient.call<TokenHoldersResponse>("public/getTokenHolders", [
    mint,
    { limit, offset, includeZeroBalances },
  ]);
}

export type TokenTrader = {
  trader: string;
  bought_usd: number;
  sold_usd: number;
  balance: number;
  realized_pnl_quote: number;
  unrealized_pnl_quote: number;
  total_pnl_quote: number;
  total_pnl_change_proportion: number;
  last_trade_ts: number;
};

export type TokenTradersResponse = {
  sol_price_usd: number;
  token_info?: LiveTokenInfo;
  traders: TokenTrader[];
};

export async function fetchTokenTraders(
  rpcClient: RpcClient,
  params: {
    mint: string;
    limit?: number;
    offset?: number;
    sortColumn?: string;
  }
): Promise<TokenTradersResponse> {
  const { mint, limit = 40, offset = 0, sortColumn = "total_pnl_quote" } = params;

  return rpcClient.call<TokenTradersResponse>("public/getTokenTraders", [
    mint,
    { limit, offset, sort_column: sortColumn },
  ]);
}
