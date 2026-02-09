/**
 * Shared formatters and constants for the Token Detail screen.
 */

export const chartTimeframes = [
  { id: "1h", label: "1h", rangeSeconds: 60 * 60, resolutionSeconds: 60 },
  { id: "6h", label: "6h", rangeSeconds: 6 * 60 * 60, resolutionSeconds: 5 * 60 },
  { id: "24h", label: "24h", rangeSeconds: 24 * 60 * 60, resolutionSeconds: 15 * 60 },
  { id: "7d", label: "7d", rangeSeconds: 7 * 24 * 60 * 60, resolutionSeconds: 60 * 60 },
] as const;

export type ChartTimeframe = (typeof chartTimeframes)[number];

export const fallbackTokenImage = "https://app.quickscope.gg/favicon.ico";

/* ── Formatters ── */

export function formatCompactUsd(value: number | undefined): string {
  if (!value || !Number.isFinite(value) || value <= 0) return "$0";
  const absValue = Math.abs(value);
  if (absValue >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (absValue >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (absValue >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
}

export function formatPercent(value: number | undefined): string {
  if (value === undefined || !Number.isFinite(value)) return "n/a";
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${value.toFixed(1)}%`;
}

export function formatAgeFromSeconds(unixSeconds: number | undefined): string {
  if (!unixSeconds || !Number.isFinite(unixSeconds) || unixSeconds <= 0) return "n/a";
  const elapsedSeconds = Math.max(0, Math.floor(Date.now() / 1000) - unixSeconds);
  if (elapsedSeconds < 60) return `${elapsedSeconds}s`;
  if (elapsedSeconds < 3600) return `${Math.floor(elapsedSeconds / 60)}m`;
  if (elapsedSeconds < 86400) return `${Math.floor(elapsedSeconds / 3600)}h`;
  if (elapsedSeconds < 604800) return `${Math.floor(elapsedSeconds / 86400)}d`;
  return `${Math.floor(elapsedSeconds / 604800)}w`;
}

export function formatChartTimestamp(timestampSeconds: number, timeframeId: string): string {
  if (!timestampSeconds) return "--";
  const date = new Date(timestampSeconds * 1000);
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  if (timeframeId === "1h" || timeframeId === "6h") return `${hours}:${minutes}`;
  if (timeframeId === "24h") return `${date.getMonth() + 1}/${date.getDate()} ${hours}:${minutes}`;
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export function formatSol(value: number | undefined): string {
  if (value === undefined || !Number.isFinite(value)) return "--";
  if (Math.abs(value) >= 1000) return value.toFixed(0);
  if (Math.abs(value) >= 10) return value.toFixed(2);
  return value.toFixed(3);
}
