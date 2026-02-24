/**
 * Shared formatters and constants for the Token Detail screen.
 */

export const chartTimeframes = [
  { id: "1m", label: "1m", rangeSeconds: 60 * 60, resolutionSeconds: 60 },
  { id: "5m", label: "5m", rangeSeconds: 3 * 60 * 60, resolutionSeconds: 5 * 60 },
  { id: "15m", label: "15m", rangeSeconds: 6 * 60 * 60, resolutionSeconds: 15 * 60 },
  { id: "1h", label: "1h", rangeSeconds: 24 * 60 * 60, resolutionSeconds: 60 * 60 },
] as const;

export type ChartTimeframe = (typeof chartTimeframes)[number];

export const fallbackTokenImage = "https://app.quickscope.gg/favicon.ico";

/* ── Formatters ── */

export {
  formatCompactUsd,
  formatPercent,
  formatAgeFromSeconds,
  formatSol,
  formatChartTimestamp,
} from "@/src/lib/format";
