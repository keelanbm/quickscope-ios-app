/**
 * Signal overlay constants — colors and display config.
 *
 * Color palette reuses HolderRow LABEL_COLORS for visual consistency.
 */
import type { SignalType } from "@/src/ui/chart/chartTypes";

export type SignalColorConfig = {
  /** Solid color for marker fill */
  fill: string;
  /** 15% opacity background for chips / tooltips */
  bg: string;
  /** Human-readable short label */
  label: string;
};

/**
 * Signal color/label map.
 * Colors match HolderRow.tsx LABEL_COLORS for consistency across the app.
 */
export const SIGNAL_CONFIG: Record<SignalType, SignalColorConfig> = {
  dev_buy: { fill: "#c084fc", bg: "rgba(168, 85, 247, 0.15)", label: "Dev Buy" },
  dev_sell: { fill: "#c084fc", bg: "rgba(168, 85, 247, 0.15)", label: "Dev Sell" },
  user_buy: { fill: "#60a5fa", bg: "rgba(59, 130, 246, 0.15)", label: "Buy" },
  user_sell: { fill: "#f87171", bg: "rgba(239, 68, 68, 0.15)", label: "Sell" },
  watchlist_buy: { fill: "#fbbf24", bg: "rgba(234, 179, 8, 0.15)", label: "WL Buy" },
  watchlist_sell: { fill: "#fbbf24", bg: "rgba(234, 179, 8, 0.15)", label: "WL Sell" },
  whale: { fill: "#60a5fa", bg: "rgba(59, 130, 246, 0.15)", label: "Whale" },
  sniper: { fill: "#f87171", bg: "rgba(239, 68, 68, 0.15)", label: "Sniper" },
  bot: { fill: "#f87171", bg: "rgba(239, 68, 68, 0.15)", label: "Bot" },
  insider: { fill: "#fb923c", bg: "rgba(249, 115, 22, 0.15)", label: "Insider" },
};

/** Signal types available for filter chips. */
export const FILTER_SIGNAL_TYPES: SignalType[] = [
  "dev_buy",
  "dev_sell",
  "whale",
  "sniper",
  "bot",
  "insider",
];
