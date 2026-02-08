import type { RpcClient } from "@/src/lib/api/rpcClient";

export type TraderOverview = {
  trader: string;
  sol_price_usd: number;
  cumulatives?: {
    bought_usd_cumulative: number;
    sold_usd_cumulative: number;
  };
  holdings?: {
    sol_balance: number;
    value_sol: number;
    value_usd: number;
  };
};

export type TokenHoldings = {
  token_info?: {
    token_metadata?: {
      mint?: string;
      name?: string;
      symbol?: string;
      image_uri?: string;
      platform?: string;
      exchange?: string;
    };
    mint_info?: {
      decimals?: number;
    };
  };
  balance: number;
  value_sol: number;
};

export type AccountTokenHoldings = {
  sol_balance: number;
  value_sol: number;
  value_usd: number;
  sol_price_usd: number;
  token_holdings: TokenHoldings[];
};

export type TraderTokenPosition = {
  trader: string;
  sol_price_usd: number;
  position: {
    balance: number;
    total_pnl_quote: number;
    total_pnl_change_proportion: number;
  };
};

export async function fetchTraderOverview(
  rpcClient: RpcClient,
  account: string
): Promise<TraderOverview> {
  return rpcClient.call<TraderOverview>("public/getTraderOverview", [account]);
}

export async function fetchAccountTokenHoldings(
  rpcClient: RpcClient,
  account: string
): Promise<AccountTokenHoldings> {
  return rpcClient.call<AccountTokenHoldings>("public/getAccountTokenHoldings", [
    account,
    { only_supported_tokens: true, include_zero_balances: false },
  ]);
}

export async function fetchPositionPnl(
  rpcClient: RpcClient,
  account: string,
  mint: string
): Promise<TraderTokenPosition> {
  return rpcClient.call<TraderTokenPosition>("public/getPositionPnl", [account, mint]);
}

/* ── Positions (with full PnL) ── */

export type MinimalTokenInfo = {
  mint?: string;
  name?: string;
  symbol?: string;
  image_uri?: string;
  platform?: string;
  exchange?: string;
};

export type Position = {
  token_info?: MinimalTokenInfo;
  balance: number;
  position_value_quote: number;
  total_pnl_quote: number;
  total_pnl_change_proportion: number;
  unrealized_pnl_quote: number;
  unrealized_pnl_change_proportion: number;
  realized_pnl_quote: number;
  realized_pnl_change_proportion: number;
  average_entry_price_quote: number;
  average_exit_price_quote: number;
  bought_quote: number;
  sold_quote: number;
  first_trade_ts: number;
  last_trade_ts: number;
};

export type PositionsResponse = {
  trader: string;
  sol_price_usd: number;
  sol_balance: number;
  positions: Position[];
};

export async function fetchTraderPositions(
  rpcClient: RpcClient,
  account: string,
  filter?: { limit?: number; offset?: number; sort_column?: string }
): Promise<PositionsResponse> {
  return rpcClient.call<PositionsResponse>("public/getTraderPositions", [
    account,
    filter ?? {},
  ]);
}

/* ── Transaction history ── */

export type TransactionRow = {
  ts: number;
  type: "b" | "s" | "d" | "w";
  mint: string;
  amount_base: number;
  amount_quote: number;
  price: number;
  quote_asset_price_usd: number;
  signature: string;
  maker: string;
  exchange: string;
  index: string;
};

export type TransactionsResponse = {
  mint_to_token_info?: Record<string, { token_metadata?: MinimalTokenInfo }>;
  table?: {
    rows?: TransactionRow[];
  };
};

export async function fetchTransactionHistory(
  rpcClient: RpcClient,
  account: string,
  limit = 50
): Promise<TransactionsResponse> {
  return rpcClient.call<TransactionsResponse>("public/filterAllTransactionsTable", [
    [account],
    {
      address_filters: [{ column: "maker", addresses: [account] }],
      row_limit: limit,
      sort_column: "index",
      sort_order: false,
    },
  ]);
}
