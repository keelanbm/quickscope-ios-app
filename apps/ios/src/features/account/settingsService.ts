import type { RpcClient } from "@/src/lib/api/rpcClient";

// ── Types ────────────────────────────────────────

export type AccountSettings = {
  price_display_mode: "price" | "market_cap";
  language: string;
  timezone: string;
  token_image_display_mode: "circle" | "square";
};

export type ExecutionPreset = {
  priority_fee_lamports: number;
  jito_tip_lamports: number;
  slippage_bps: number;
};

export type AccountTradeSettings = {
  buy_presets: [ExecutionPreset, ExecutionPreset, ExecutionPreset];
  sell_presets: [ExecutionPreset, ExecutionPreset, ExecutionPreset];
  quick_buy_options_lamports: number[];
  quick_sell_options_bps: number[];
  quick_buy_amount_lamports: number;
  quick_sell_bps: number;
  batch_trade_mode: "exact" | "split";
  stealth_buy_variance: number;
  stealth_sell_variance: number;
  stealth_ignore_100_sell: boolean;
  stealth_buy_delay_ms: number;
  stealth_sell_delay_ms: number;
  stealth_insta_threshold: number;
  split_deviation: number;
};

export type AccountTradeSettingsRow = {
  account_trade_settings: AccountTradeSettings;
  nonce: number;
};

// ── Defaults (matches web terminal-frontend/src/constants/trade-settings.tsx) ──

const DEFAULT_PRESET: ExecutionPreset = {
  priority_fee_lamports: 1_000_000,
  jito_tip_lamports: 1_000_000,
  slippage_bps: 500,
};

export const DEFAULT_ACCOUNT_TRADE_SETTINGS: AccountTradeSettings = {
  buy_presets: [
    { ...DEFAULT_PRESET },
    { priority_fee_lamports: 10_000_000, jito_tip_lamports: 10_000_000, slippage_bps: 2000 },
    { priority_fee_lamports: 0, jito_tip_lamports: 0, slippage_bps: 300 },
  ],
  sell_presets: [
    { ...DEFAULT_PRESET },
    { priority_fee_lamports: 10_000_000, jito_tip_lamports: 10_000_000, slippage_bps: 2000 },
    { priority_fee_lamports: 0, jito_tip_lamports: 0, slippage_bps: 300 },
  ],
  quick_buy_options_lamports: [
    250_000_000, 500_000_000, 1_000_000_000, 5_000_000_000, 10_000_000_000, 20_000_000_000,
  ],
  quick_sell_options_bps: [100, 500, 1000, 2500, 5000, 10000],
  quick_buy_amount_lamports: 100_000_000,
  quick_sell_bps: 10000,
  batch_trade_mode: "exact",
  stealth_buy_variance: 0,
  stealth_sell_variance: 0,
  stealth_ignore_100_sell: true,
  stealth_buy_delay_ms: 0,
  stealth_sell_delay_ms: 0,
  stealth_insta_threshold: 0,
  split_deviation: 0,
};

export const DEFAULT_ACCOUNT_SETTINGS: AccountSettings = {
  price_display_mode: "market_cap",
  language: "en",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  token_image_display_mode: "circle",
};

// ── Unit conversions ─────────────────────────────

const LAMPORTS_PER_SOL = 1_000_000_000;

export function lamportsToSol(lamports: number): string {
  return (lamports / LAMPORTS_PER_SOL).toString();
}

export function solToLamports(sol: string): number {
  const n = parseFloat(sol);
  if (isNaN(n) || n < 0) return 0;
  return Math.round(n * LAMPORTS_PER_SOL);
}

export function bpsToPercent(bps: number): string {
  return (bps / 100).toString();
}

export function percentToBps(pct: string): number {
  const n = parseFloat(pct);
  if (isNaN(n) || n < 0) return 0;
  return Math.round(n * 100);
}

// ── Validation (matches web terminal-frontend/src/lib/trade-settings.ts) ──

export function validateTradeSettings(s: AccountTradeSettings): string | null {
  const allPresets = [
    ...s.buy_presets.map((p, i) => ({ p, i, side: "Buy" })),
    ...s.sell_presets.map((p, i) => ({ p, i, side: "Sell" })),
  ];
  for (const { p, i, side } of allPresets) {
    if (p.priority_fee_lamports > 200_000_000)
      return `${side} P${i + 1} priority fee exceeds max 0.2 SOL`;
    if (p.jito_tip_lamports > 200_000_000)
      return `${side} P${i + 1} bribe exceeds max 0.2 SOL`;
    if (p.slippage_bps < 50 || p.slippage_bps > 5000)
      return `${side} P${i + 1} slippage must be 0.5%-50%`;
  }
  for (let i = 0; i < s.quick_buy_options_lamports.length; i++) {
    if (s.quick_buy_options_lamports[i] === 0) return `Quick buy option ${i + 1} cannot be 0`;
    if (s.quick_buy_options_lamports[i] > 1_000_000_000_000)
      return `Quick buy option ${i + 1} exceeds max 1000 SOL`;
  }
  for (let i = 0; i < s.quick_sell_options_bps.length; i++) {
    if (s.quick_sell_options_bps[i] === 0) return `Quick sell option ${i + 1} cannot be 0`;
    if (s.quick_sell_options_bps[i] > 10000)
      return `Quick sell option ${i + 1} exceeds max 100%`;
  }
  if (s.quick_buy_amount_lamports === 0) return "Quick buy amount cannot be 0";
  if (s.quick_buy_amount_lamports > 1_000_000_000_000) return "Quick buy amount exceeds max 1000 SOL";
  if (s.quick_sell_bps === 0) return "Quick sell percentage cannot be 0";
  if (s.quick_sell_bps > 10000) return "Quick sell percentage exceeds max 100%";
  if (s.stealth_buy_variance > 50) return "Buy variance exceeds max 50%";
  if (s.stealth_sell_variance > 50) return "Sell variance exceeds max 50%";
  return null;
}

// ── API ──────────────────────────────────────────

export async function fetchAccountSettings(rpcClient: RpcClient): Promise<AccountSettings> {
  return rpcClient.call<AccountSettings>("private/getAccountSettings", []);
}

export async function updateAccountSettings(
  rpcClient: RpcClient,
  settings: AccountSettings
): Promise<void> {
  await rpcClient.call<void>("private/setAccountSettings", [settings]);
}

export async function fetchAccountTradeSettings(
  rpcClient: RpcClient
): Promise<AccountTradeSettingsRow> {
  return rpcClient.call<AccountTradeSettingsRow>("private/getAccountTradeSettings", []);
}

export async function updateAccountTradeSettings(
  rpcClient: RpcClient,
  settings: AccountTradeSettings
): Promise<void> {
  await rpcClient.call<void>("private/setAccountTradeSettings", [settings]);
}
