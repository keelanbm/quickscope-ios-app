/**
 * Shared chart types used across all chart sub-components.
 */

/** Single data point for line charts. */
export type TokenChartPoint = {
  ts: number;
  value: number;
};

/** OHLC candle with optional volume. */
export type TokenCandlePoint = {
  ts: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};

/** Pre-computed render data for a single candle. */
export type CandleRenderData = {
  index: number;
  x: number;
  centerX: number;
  highY: number;
  lowY: number;
  bodyTop: number;
  bodyHeight: number;
  isGreen: boolean;
  ts: number;
  close: number;
  volume?: number;
};

/** Signal type identifiers matching web frontend mark system. */
export type SignalType =
  | "dev_buy"
  | "dev_sell"
  | "user_buy"
  | "user_sell"
  | "watchlist_buy"
  | "watchlist_sell"
  | "whale"
  | "sniper"
  | "bot"
  | "insider";

/** A signal overlay on the chart (dev buy, whale, etc.). */
export type ChartSignal = {
  ts: number;
  type: SignalType;
  wallet?: string;
  amount?: number;
  signature?: string;
};
