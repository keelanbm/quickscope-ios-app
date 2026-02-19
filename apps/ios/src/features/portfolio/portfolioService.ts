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

export type TraderPositions = {
  trader: string;
  sol_price_usd: number;
  positions: Array<{
    balance: number;
    bought_usd?: number;
    sold_usd?: number;
    total_pnl_quote?: number;
    total_pnl_change_proportion?: number;
    token_info?: {
      mint?: string;
      name?: string;
      symbol?: string;
      image_uri?: string;
      platform?: string;
      exchange?: string;
    };
  }>;
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

export async function fetchTraderPositions(
  rpcClient: RpcClient,
  account: string,
  filter: {
    include_zero_balances?: boolean;
    limit?: number;
    offset?: number;
    sort_column?: string;
  } = {}
): Promise<TraderPositions> {
  return rpcClient.call<TraderPositions>("public/getTraderPositions", [account, filter]);
}
