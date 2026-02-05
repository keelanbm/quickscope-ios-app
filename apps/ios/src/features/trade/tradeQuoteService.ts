import type { RpcClient } from "@/src/lib/api/rpcClient";

const SOL_MINT = "So11111111111111111111111111111111111111112";
const LAMPORTS_PER_SOL = 1_000_000_000;

type QuoteResponseShape = Record<string, unknown>;

export type QuoteRequestInput = {
  walletAddress: string;
  inputMint: string;
  outputMint: string;
  amountUi: number;
  slippageBps?: number;
};

export type QuoteSummary = {
  outAmountAtomic?: number;
  minOutAmountAtomic?: number;
  priceImpactPercent?: number;
  routeHopCount?: number;
};

export type QuoteResult = {
  requestedAtMs: number;
  inputMint: string;
  outputMint: string;
  amountUi: number;
  amountAtomic: number;
  slippageBps: number;
  summary: QuoteSummary;
  raw: unknown;
};

function toNumber(value: unknown): number | undefined {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
}

function asObject(value: unknown): QuoteResponseShape | undefined {
  return value && typeof value === "object" ? (value as QuoteResponseShape) : undefined;
}

function pickNumber(obj: QuoteResponseShape | undefined, keys: string[]): number | undefined {
  if (!obj) {
    return undefined;
  }

  for (const key of keys) {
    const numeric = toNumber(obj[key]);
    if (numeric !== undefined) {
      return numeric;
    }
  }

  return undefined;
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

function inferQuoteSummary(raw: unknown): QuoteSummary {
  const object = asObject(raw);
  const routePlan = object?.routePlan;
  const routeHopCount = Array.isArray(routePlan) ? routePlan.length : undefined;

  return {
    outAmountAtomic: pickNumber(object, ["outAmount", "out_amount", "amountOut"]),
    minOutAmountAtomic: pickNumber(object, [
      "otherAmountThreshold",
      "minOutAmount",
      "min_out_amount",
    ]),
    priceImpactPercent: priceImpactToPercent(
      pickNumber(object, ["priceImpactPct", "price_impact_pct", "priceImpactPercent"])
    ),
    routeHopCount,
  };
}

function toAtomicAmount(amountUi: number, inputMint: string): number {
  if (inputMint !== SOL_MINT) {
    throw new Error("Only SOL-input quote requests are enabled in this build.");
  }

  return Math.max(1, Math.floor(amountUi * LAMPORTS_PER_SOL));
}

export async function requestSwapQuote(
  rpcClient: RpcClient,
  input: QuoteRequestInput
): Promise<QuoteResult> {
  const amountUi = Number(input.amountUi);
  if (!Number.isFinite(amountUi) || amountUi <= 0) {
    throw new Error("Enter an amount greater than 0.");
  }

  const slippageBps = input.slippageBps ?? 50;
  const amountAtomic = toAtomicAmount(amountUi, input.inputMint);
  const raw = await rpcClient.call<unknown>("tx/getSwapQuote", [
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
    amountUi,
    amountAtomic,
    slippageBps,
    summary: inferQuoteSummary(raw),
    raw,
  };
}
