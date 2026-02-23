import type { RpcClient } from "@/src/lib/api/rpcClient";
import { SOL_MINT } from "@/src/lib/constants";
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const USDT_MINT = "Es9vMFrzaCERmJfrF4H2FYD6h7nGQ6GdQ4Yf9sC6pHf";

const KNOWN_MINT_DECIMALS: Record<string, number> = {
  [SOL_MINT]: 9,
  [USDC_MINT]: 6,
  [USDT_MINT]: 6,
};

export type QuoteRequestInput = {
  walletAddress: string;
  inputMint: string;
  outputMint: string;
  amountUi: number;
  inputTokenDecimals?: number;
  outputTokenDecimals?: number;
  slippageBps?: number;
};

export type TradeSwapQuote = {
  quickscope_fee_info?: {
    user_fee_rate_bps?: number | string;
    fee_amount_sol?: number | string;
  };
  amount_in?: number | string;
  amount_in_max?: number | string;
  amount_out?: number | string;
  amount_out_min?: number | string;
  outAmount?: number | string;
  otherAmountThreshold?: number | string;
  priceImpactPct?: number | string;
  routePlan?: unknown[];
};

export type QuoteSummary = {
  amountInAtomic?: number;
  amountInMaxAtomic?: number;
  outAmountAtomic?: number;
  minOutAmountAtomic?: number;
  priceImpactPercent?: number;
  feeAmountSol?: number;
  feeRateBps?: number;
  routeHopCount?: number;
  amountOutUi?: number;
  minOutAmountUi?: number;
};

export type QuoteResult = {
  requestedAtMs: number;
  inputMint: string;
  outputMint: string;
  inputTokenDecimals: number;
  outputTokenDecimals?: number;
  amountUi: number;
  amountAtomic: number;
  slippageBps: number;
  summary: QuoteSummary;
  raw: TradeSwapQuote;
};

function toNumber(value: unknown): number | undefined {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
}

function toTokenUnits(atomicAmount: number | undefined, decimals: number | undefined): number | undefined {
  if (atomicAmount === undefined || decimals === undefined) {
    return undefined;
  }

  return atomicAmount / 10 ** decimals;
}

function inferInputDecimals(inputMint: string, inputTokenDecimals?: number): number {
  if (typeof inputTokenDecimals === "number" && Number.isFinite(inputTokenDecimals)) {
    return inputTokenDecimals;
  }

  const fromMintMap = KNOWN_MINT_DECIMALS[inputMint];
  if (typeof fromMintMap === "number") {
    return fromMintMap;
  }

  throw new Error("Input token decimals are unavailable. Use SOL input or provide token decimals.");
}

function priceImpactToPercent(value: number | undefined): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (Math.abs(value) <= 1) {
    return value * 100;
  }

  return value;
}

function inferQuoteSummary(raw: TradeSwapQuote, outputTokenDecimals?: number): QuoteSummary {
  const amountInAtomic = toNumber(raw.amount_in);
  const amountInMaxAtomic = toNumber(raw.amount_in_max);
  const outAmountAtomic = toNumber(raw.amount_out ?? raw.outAmount);
  const minOutAmountAtomic = toNumber(raw.amount_out_min ?? raw.otherAmountThreshold);
  const priceImpactPercent = priceImpactToPercent(toNumber(raw.priceImpactPct));
  const feeAmountSol = toNumber(raw.quickscope_fee_info?.fee_amount_sol);
  const feeRateBps = toNumber(raw.quickscope_fee_info?.user_fee_rate_bps);
  const routePlan = raw.routePlan;
  const routeHopCount = Array.isArray(routePlan) ? routePlan.length : undefined;

  return {
    amountInAtomic,
    amountInMaxAtomic,
    outAmountAtomic,
    minOutAmountAtomic,
    priceImpactPercent,
    feeAmountSol,
    feeRateBps,
    routeHopCount,
    amountOutUi: toTokenUnits(outAmountAtomic, outputTokenDecimals),
    minOutAmountUi: toTokenUnits(minOutAmountAtomic, outputTokenDecimals),
  };
}

function toAtomicAmount(amountUi: number, inputTokenDecimals: number): number {
  const multiplier = 10 ** inputTokenDecimals;
  if (!Number.isFinite(multiplier) || multiplier <= 0) {
    throw new Error("Invalid token decimals for quote conversion.");
  }

  return Math.max(1, Math.floor(amountUi * multiplier));
}

export async function requestSwapQuote(
  rpcClient: RpcClient,
  input: QuoteRequestInput
): Promise<QuoteResult> {
  const amountUi = Number(input.amountUi);
  if (!Number.isFinite(amountUi) || amountUi <= 0) {
    throw new Error("Enter an amount greater than 0.");
  }

  const inputTokenDecimals = inferInputDecimals(input.inputMint, input.inputTokenDecimals);
  const slippageBps = input.slippageBps ?? 50;
  const amountAtomic = toAtomicAmount(amountUi, inputTokenDecimals);
  const raw = await rpcClient.call<TradeSwapQuote>("tx/getSwapQuote", [
    input.walletAddress,
    input.inputMint,
    input.outputMint,
    amountAtomic,
    slippageBps,
    {
      priority_fee_lamports: 0,
      tip_amount_lamports: 0,
    },
  ]);

  return {
    requestedAtMs: Date.now(),
    inputMint: input.inputMint,
    outputMint: input.outputMint,
    inputTokenDecimals,
    outputTokenDecimals: input.outputTokenDecimals,
    amountUi,
    amountAtomic,
    slippageBps,
    summary: inferQuoteSummary(raw, input.outputTokenDecimals),
    raw,
  };
}
