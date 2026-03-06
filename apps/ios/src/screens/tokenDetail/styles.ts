/**
 * Shared formatters and constants for the Token Detail screen.
 */

export const chartTimeframes = [
  { id: "1H",  label: "1H",  rangeSeconds: 3_600 as number | null },
  { id: "6H",  label: "6H",  rangeSeconds: 21_600 as number | null },
  { id: "1D",  label: "1D",  rangeSeconds: 86_400 as number | null },
  { id: "1W",  label: "1W",  rangeSeconds: 604_800 as number | null },
  { id: "All", label: "All", rangeSeconds: null as number | null },
] as const;

export type ChartTimeframe = (typeof chartTimeframes)[number];

const TARGET_CANDLES = 60;
const RESOLUTION_STEPS = [60, 300, 900, 3600, 14400];

/** Pick the best candle resolution to target ~60 candles for a given time range. */
export function computeResolution(rangeSeconds: number): number {
  const ideal = Math.floor(rangeSeconds / TARGET_CANDLES);
  let best = RESOLUTION_STEPS[0];
  for (const step of RESOLUTION_STEPS) {
    if (step <= ideal) best = step;
    else break;
  }
  return best;
}

export const fallbackTokenImage = "https://app.quickscope.gg/favicon.ico";

/* ── Formatters ── */

export {
  formatCompactUsd,
  formatPercent,
  formatAgeFromSeconds,
  formatSol,
  formatChartTimestamp,
} from "@/src/lib/format";
