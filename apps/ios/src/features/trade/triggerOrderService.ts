/**
 * Trigger order service — limit buy, limit sell, and stop-loss orders.
 *
 * Wraps the RPC endpoints:
 * - tx/createTriggerOrder
 * - tx/getTriggerOrders
 * - tx/cancelTriggerOrder
 */
import type { RpcClient } from "@/src/lib/api/rpcClient";

// ── Types ────────────────────────────────────────

export type OrderType = "limit_buy" | "limit_sell" | "stop_loss";

export type OrderStatus =
  | "active"
  | "executing"
  | "filled"
  | "cancelled"
  | "expired"
  | "failed";

export type TriggerOrder = {
  uuid: string;
  userAccount: string;
  orderType: OrderType;
  mint: string;
  inputAmount: string;
  initialPriceUSD: number;
  triggerPriceUSD: number;
  expiresAt: number;
  createdAt: number;
  updatedAt: number;
  status: OrderStatus;
  priorityFeeLamports: string;
  jitoTipLamports: string;
  slippageBps: number;
  signature: string | null;
};

export type CreateTriggerOrderParams = {
  walletAddress: string;
  mint: string;
  orderType: OrderType;
  inputAmount: number;
  tokenDecimals: number;
  triggerPriceUSD: number;
  expiresIn: number;
  slippageBps: number;
  priorityFeeLamports: number;
  jitoTipLamports: number;
};

export type GetTriggerOrdersParams = {
  walletAddress: string;
  mint?: string;
  status?: OrderStatus[];
};

// ── Expiration presets (seconds) ─────────────────

export const EXPIRATION_PRESETS = [
  { label: "1d", seconds: 86_400 },
  { label: "3d", seconds: 259_200 },
  { label: "7d", seconds: 604_800 },
] as const;

export const DEFAULT_EXPIRATION_SECONDS = 604_800; // 7 days

// ── Order type auto-detection ────────────────────

export function detectOrderType(
  side: "buy" | "sell",
  triggerMC: number,
  currentMC: number
): OrderType {
  if (side === "buy") return "limit_buy";
  return triggerMC > currentMC ? "limit_sell" : "stop_loss";
}

// ── Trigger price calculation ────────────────────

export function calcTriggerPrice(triggerMC: number, tokenSupply: number): number {
  if (tokenSupply <= 0) return 0;
  return triggerMC / tokenSupply;
}

// ── Display helpers ──────────────────────────────

const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  limit_buy: "Limit Buy",
  limit_sell: "Limit Sell",
  stop_loss: "Stop Loss",
};

export function orderTypeLabel(type: OrderType): string {
  return ORDER_TYPE_LABELS[type];
}

export function formatExpiresIn(expiresAtSeconds: number): string {
  const now = Math.floor(Date.now() / 1000);
  const remaining = expiresAtSeconds - now;
  if (remaining <= 0) return "Expired";

  const days = Math.floor(remaining / 86_400);
  const hours = Math.floor((remaining % 86_400) / 3_600);

  if (days > 0) return `${days}d ${hours}h`;
  const minutes = Math.floor((remaining % 3_600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

// ── API calls ────────────────────────────────────

export async function createTriggerOrder(
  rpcClient: RpcClient,
  params: CreateTriggerOrderParams
): Promise<TriggerOrder> {
  return rpcClient.call<TriggerOrder>("tx/createTriggerOrder", [
    {
      wallet_address: params.walletAddress,
      mint: params.mint,
      order_type: params.orderType,
      input_amount: params.inputAmount,
      token_decimals: params.tokenDecimals,
      trigger_price_usd: params.triggerPriceUSD,
      expires_in: params.expiresIn,
      slippage_bps: params.slippageBps,
      priority_fee_lamports: params.priorityFeeLamports,
      jito_tip_lamports: params.jitoTipLamports,
    },
  ]);
}

export async function getTriggerOrders(
  rpcClient: RpcClient,
  params: GetTriggerOrdersParams
): Promise<TriggerOrder[]> {
  const result = await rpcClient.call<{ orders?: TriggerOrder[] }>(
    "tx/getTriggerOrders",
    [
      {
        wallet_address: params.walletAddress,
        ...(params.mint ? { mint: params.mint } : {}),
        ...(params.status ? { status: params.status } : {}),
      },
    ]
  );
  return result.orders ?? [];
}

export async function cancelTriggerOrder(
  rpcClient: RpcClient,
  orderId: string
): Promise<void> {
  await rpcClient.call<unknown>("tx/cancelTriggerOrder", [orderId]);
}
