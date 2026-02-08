import type { RpcClient } from "@/src/lib/api/rpcClient";

export type TokenMetadata = {
  name?: string;
  symbol?: string;
  image_uri?: string;
  twitter_url?: string;
  telegram_url?: string;
  website_url?: string;
  twitter?: string;
  telegram?: string;
  website?: string;
};

export type LiveTokenInfo = {
  token_metadata?: TokenMetadata;
  mint_info?: {
    supply?: number;
    decimals?: number;
  };
  token_price_info?: {
    quote_asset_price_usd?: number;
    price_usd?: number;
    daily_trade_info?: {
      daily_change_proportion?: number;
    };
  };
  mint_transaction?: {
    ts?: number;
  };
};

export type TokenCandle = {
  ts: number;
  close: string;
  quote_asset_price_usd: number;
};

export type TokenCandlesResponse = {
  base_asset_supply?: number;
  base_asset_decimals?: number;
  candles?: TokenCandle[];
};

export type TokenChartPoint = {
  ts: number;
  value: number;
};

/** @deprecated Use TokenChartPoint instead */
export type TokenMarketCapPoint = TokenChartPoint;

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function deriveSupplyFromInfo(
  info?: LiveTokenInfo,
  candlesResponse?: TokenCandlesResponse
): { supply: number; decimals: number } | undefined {
  const supply = info?.mint_info?.supply;
  const decimals = info?.mint_info?.decimals;

  if (Number.isFinite(supply) && Number.isFinite(decimals)) {
    return { supply: Number(supply), decimals: Number(decimals) };
  }

  if (
    Number.isFinite(candlesResponse?.base_asset_supply) &&
    Number.isFinite(candlesResponse?.base_asset_decimals)
  ) {
    return {
      supply: Number(candlesResponse?.base_asset_supply),
      decimals: Number(candlesResponse?.base_asset_decimals),
    };
  }

  return undefined;
}

export type ChartSeriesResult = {
  points: TokenChartPoint[];
  /** "mcap" when supply is available, "price" as fallback */
  mode: "mcap" | "price";
};

export function buildChartSeries({
  candles,
  tokenInfo,
  candlesResponse,
}: {
  candles: TokenCandle[];
  tokenInfo?: LiveTokenInfo | null;
  candlesResponse?: TokenCandlesResponse;
}): ChartSeriesResult {
  const supplyInfo = deriveSupplyFromInfo(tokenInfo ?? undefined, candlesResponse);

  const useMcap = !!supplyInfo;
  const naturalSupply = useMcap
    ? supplyInfo.supply / Math.pow(10, supplyInfo.decimals)
    : 1;

  const points = (candles ?? [])
    .map((candle) => {
      const closeQuote = toNumber(candle.close);
      const quoteUsd = toNumber(candle.quote_asset_price_usd);
      const priceUsd = closeQuote * quoteUsd;

      return {
        ts: toNumber(candle.ts),
        value: useMcap ? priceUsd * naturalSupply : priceUsd,
      };
    })
    .filter((point) => point.ts > 0 && Number.isFinite(point.value) && point.value > 0)
    .sort((a, b) => a.ts - b.ts);

  return { points, mode: useMcap ? "mcap" : "price" };
}

/** @deprecated Use buildChartSeries instead */
export function buildMarketCapSeries(args: {
  candles: TokenCandle[];
  tokenInfo?: LiveTokenInfo | null;
  candlesResponse?: TokenCandlesResponse;
}): TokenChartPoint[] {
  return buildChartSeries(args).points;
}

export async function fetchLiveTokenInfo(
  rpcClient: RpcClient,
  tokenAddress: string
): Promise<LiveTokenInfo | null> {
  if (!tokenAddress) {
    return null;
  }

  return rpcClient.call<LiveTokenInfo>("public/getLiveTokenInfo", [{ mint: tokenAddress }]);
}

export async function fetchTokenCandles(
  rpcClient: RpcClient,
  params: {
    tokenAddress: string;
    from: number;
    to: number;
    resolutionSeconds: number;
  }
): Promise<TokenCandlesResponse> {
  const { tokenAddress, from, to, resolutionSeconds } = params;

  return rpcClient.call<TokenCandlesResponse>("public/getTokenCandles", [
    tokenAddress,
    from,
    to,
    resolutionSeconds,
  ]);
}
