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
  holders?: number;
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
  open?: string;
  high?: string;
  low?: string;
  close: string;
  quote_asset_price_usd: number;
};

export type TokenCandlesResponse = {
  base_asset_supply?: number;
  base_asset_decimals?: number;
  candles?: TokenCandle[];
};

export type TokenMarketCapPoint = {
  ts: number;
  value: number;
};

export type TokenCandlePoint = {
  ts: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

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

export function buildMarketCapSeries({
  candles,
  tokenInfo,
  candlesResponse,
}: {
  candles: TokenCandle[];
  tokenInfo?: LiveTokenInfo | null;
  candlesResponse?: TokenCandlesResponse;
}): TokenMarketCapPoint[] {
  const supplyInfo = deriveSupplyFromInfo(tokenInfo ?? undefined, candlesResponse);
  if (!supplyInfo) {
    return [];
  }

  const naturalSupply = supplyInfo.supply / Math.pow(10, supplyInfo.decimals);

  return (candles ?? [])
    .map((candle) => {
      const closeQuote = toNumber(candle.close);
      const quoteUsd = toNumber(candle.quote_asset_price_usd);
      const priceUsd = closeQuote * quoteUsd;

      return {
        ts: toNumber(candle.ts),
        value: priceUsd * naturalSupply,
      };
    })
    .filter((point) => point.ts > 0 && Number.isFinite(point.value))
    .sort((a, b) => a.ts - b.ts);
}

export function buildPriceSeries(candles: TokenCandle[]): TokenMarketCapPoint[] {
  return (candles ?? [])
    .map((candle) => {
      const closeQuote = toNumber(candle.close);
      const quoteUsd = toNumber(candle.quote_asset_price_usd);
      const priceUsd = closeQuote * quoteUsd;

      return {
        ts: toNumber(candle.ts),
        value: priceUsd,
      };
    })
    .filter((point) => point.ts > 0 && Number.isFinite(point.value))
    .sort((a, b) => a.ts - b.ts);
}

export function buildMarketCapCandles({
  candles,
  tokenInfo,
  candlesResponse,
}: {
  candles: TokenCandle[];
  tokenInfo?: LiveTokenInfo | null;
  candlesResponse?: TokenCandlesResponse;
}): TokenCandlePoint[] {
  const supplyInfo = deriveSupplyFromInfo(tokenInfo ?? undefined, candlesResponse);
  if (!supplyInfo) {
    return [];
  }

  const naturalSupply = supplyInfo.supply / Math.pow(10, supplyInfo.decimals);

  return (candles ?? [])
    .map((candle) => {
      const quoteUsd = toNumber(candle.quote_asset_price_usd);
      const open = toNumber(candle.open) * quoteUsd * naturalSupply;
      const high = toNumber(candle.high) * quoteUsd * naturalSupply;
      const low = toNumber(candle.low) * quoteUsd * naturalSupply;
      const close = toNumber(candle.close) * quoteUsd * naturalSupply;

      return {
        ts: toNumber(candle.ts),
        open,
        high,
        low,
        close,
      };
    })
    .filter((point) => point.ts > 0 && Number.isFinite(point.close))
    .sort((a, b) => a.ts - b.ts);
}

export function buildPriceCandles(candles: TokenCandle[]): TokenCandlePoint[] {
  return (candles ?? [])
    .map((candle) => {
      const quoteUsd = toNumber(candle.quote_asset_price_usd);
      return {
        ts: toNumber(candle.ts),
        open: toNumber(candle.open) * quoteUsd,
        high: toNumber(candle.high) * quoteUsd,
        low: toNumber(candle.low) * quoteUsd,
        close: toNumber(candle.close) * quoteUsd,
      };
    })
    .filter((point) => point.ts > 0 && Number.isFinite(point.close))
    .sort((a, b) => a.ts - b.ts);
}

export async function fetchLiveTokenInfo(
  rpcClient: RpcClient,
  tokenAddress: string
): Promise<LiveTokenInfo | null> {
  if (!tokenAddress) {
    return null;
  }

  return rpcClient.call<LiveTokenInfo>("public/getLiveTokenInfo", [tokenAddress]);
}

export async function fetchLiveTokenInfos(
  rpcClient: RpcClient,
  tokenAddresses: string[]
): Promise<Record<string, LiveTokenInfo>> {
  if (!tokenAddresses || tokenAddresses.length === 0) {
    return {};
  }

  const response = await rpcClient.call<{ token_info_map: Record<string, LiveTokenInfo | null> }>(
    "public/getLiveTokenInfos",
    [tokenAddresses]
  );

  const map = response?.token_info_map ?? {};
  return Object.fromEntries(
    Object.entries(map).filter(([, info]) => info !== null) as [string, LiveTokenInfo][]
  );
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

export async function fetchTokenCandlesReverse(
  rpcClient: RpcClient,
  params: {
    tokenAddress: string;
    before: number;
    resolutionSeconds: number;
    limit: number;
  }
): Promise<TokenCandlesResponse> {
  const { tokenAddress, before, resolutionSeconds, limit } = params;

  return rpcClient.call<TokenCandlesResponse>("public/getTokenCandlesReverse", [
    tokenAddress,
    before,
    resolutionSeconds,
    limit,
  ]);
}

/* ── Convenience wrapper used by TokenDetailScreen ── */

export type TokenChartPoint = {
  ts: number;
  value: number;
};

export function buildChartSeries({
  candles,
  tokenInfo,
  candlesResponse,
}: {
  candles: TokenCandle[];
  tokenInfo?: LiveTokenInfo | null;
  candlesResponse?: TokenCandlesResponse;
}): { points: TokenChartPoint[]; mode: "mcap" | "price" } {
  const mcap = buildMarketCapSeries({ candles, tokenInfo, candlesResponse });
  if (mcap.length > 0) {
    return { points: mcap, mode: "mcap" };
  }

  const price = buildPriceSeries(candles);
  return { points: price, mode: "price" };
}

export function buildCandleChartSeries({
  candles,
  tokenInfo,
  candlesResponse,
}: {
  candles: TokenCandle[];
  tokenInfo?: LiveTokenInfo | null;
  candlesResponse?: TokenCandlesResponse;
}): { candles: TokenCandlePoint[]; mode: "mcap" | "price" } {
  const mcap = buildMarketCapCandles({ candles, tokenInfo, candlesResponse });
  if (mcap.length > 0) {
    return { candles: mcap, mode: "mcap" };
  }

  const price = buildPriceCandles(candles);
  return { candles: price, mode: "price" };
}
