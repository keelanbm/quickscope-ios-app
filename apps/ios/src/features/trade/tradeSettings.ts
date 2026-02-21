/**
 * Persistent trade settings with P1/P2/P3 profile system.
 *
 * Stores slippage, priority fee, tip, and preset amounts per profile.
 * Persisted to AsyncStorage so settings survive app restarts.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

// ── Types ────────────────────────────────────────
export type TradeProfile = {
  /** Slippage tolerance in basis points (100 = 1%) */
  slippageBps: number;
  /** Priority fee in lamports */
  priorityLamports: number;
  /** Jito tip in lamports */
  tipLamports: number;
};

export type TradeSettings = {
  profiles: [TradeProfile, TradeProfile, TradeProfile];
  activeProfileIndex: 0 | 1 | 2;
  /** SOL amounts for buy preset buttons */
  buyPresets: [number, number, number, number];
  /** Fraction-of-balance for sell preset buttons (0-1) */
  sellPresets: [number, number, number, number];
  /** When true, preset taps execute immediately (skip TradeEntry). */
  instantTrade: boolean;
  /** Default expiration for limit orders (seconds). */
  defaultExpirationSeconds: number;
};

// ── Defaults ─────────────────────────────────────
const DEFAULT_PROFILE: TradeProfile = {
  slippageBps: 1500, // 15%
  priorityLamports: 100_000, // 0.0001 SOL
  tipLamports: 100_000, // 0.0001 SOL
};

export const DEFAULT_SETTINGS: TradeSettings = {
  profiles: [
    { ...DEFAULT_PROFILE },
    { ...DEFAULT_PROFILE, slippageBps: 2500 }, // P2 — more aggressive
    { ...DEFAULT_PROFILE, slippageBps: 5000 }, // P3 — max speed
  ],
  activeProfileIndex: 0,
  buyPresets: [0.25, 0.5, 1, 5],
  sellPresets: [0.25, 0.5, 0.75, 1],
  instantTrade: false,
  defaultExpirationSeconds: 604_800, // 7 days
};

const STORAGE_KEY = "qs_trade_settings_v1";

// ── Persistence ──────────────────────────────────

/** Load saved settings or return defaults. */
export async function loadTradeSettings(): Promise<TradeSettings> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return { ...DEFAULT_SETTINGS };
    return parsed as TradeSettings;
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

/** Persist settings. */
export async function saveTradeSettings(settings: TradeSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Fire-and-forget — don't break the UI for a cache write failure
  }
}

// ── Helpers ──────────────────────────────────────

/** Get the currently active profile from settings. */
export function activeProfile(settings: TradeSettings): TradeProfile {
  return settings.profiles[settings.activeProfileIndex];
}

/** Format slippage bps as a human-readable percentage string. */
export function formatSlippage(bps: number): string {
  return `${(bps / 100).toFixed(bps % 100 === 0 ? 0 : 1)}%`;
}

/** Format lamports as SOL string. */
export function formatLamports(lamports: number): string {
  const sol = lamports / 1_000_000_000;
  if (sol >= 0.01) return `${sol.toFixed(2)} SOL`;
  if (sol >= 0.001) return `${sol.toFixed(3)} SOL`;
  return `${sol.toFixed(4)} SOL`;
}
