export function formatCompactUsd(value: number): string;
export function formatCompactUsd(value: number | undefined): string;
export function formatCompactUsd(value: number | undefined): string {
  if (value === undefined) {
    return "--";
  }

  if (!Number.isFinite(value) || value <= 0) {
    return "$0";
  }

  const absValue = Math.abs(value);
  if (absValue >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(2)}B`;
  }
  if (absValue >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }
  if (absValue >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}K`;
  }
  if (absValue >= 1) {
    return `$${value.toFixed(2)}`;
  }

  return `$${value.toFixed(4)}`;
}

export function formatPercent(value: number): string;
export function formatPercent(value: number | undefined): string;
export function formatPercent(value: number | undefined): string {
  if (value === undefined) {
    return "--";
  }

  if (!Number.isFinite(value)) {
    return "0.0%";
  }

  const prefix = value > 0 ? "+" : "";
  return `${prefix}${value.toFixed(1)}%`;
}

export function formatAgeFromSeconds(unixSeconds: number): string;
export function formatAgeFromSeconds(unixSeconds: number | undefined): string;
export function formatAgeFromSeconds(unixSeconds: number | undefined): string {
  if (unixSeconds === undefined) {
    return "--";
  }

  if (!Number.isFinite(unixSeconds) || unixSeconds <= 0) {
    return "n/a";
  }

  const elapsedSeconds = Math.max(
    0,
    Math.floor(Date.now() / 1000) - unixSeconds
  );
  if (elapsedSeconds < 60) {
    return `${elapsedSeconds}s`;
  }
  if (elapsedSeconds < 3600) {
    return `${Math.floor(elapsedSeconds / 60)}m`;
  }
  if (elapsedSeconds < 86400) {
    return `${Math.floor(elapsedSeconds / 3600)}h`;
  }
  if (elapsedSeconds < 604800) {
    return `${Math.floor(elapsedSeconds / 86400)}d`;
  }
  return `${Math.floor(elapsedSeconds / 604800)}w`;
}

export function formatWalletAddress(address?: string): string {
  if (!address) {
    return "Not connected";
  }

  if (address.length <= 10) {
    return address;
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatSol(value: number): string;
export function formatSol(value: number | undefined): string;
export function formatSol(value: number | undefined): string {
  if (value === undefined || !Number.isFinite(value)) {
    return "--";
  }

  if (Math.abs(value) >= 1000) {
    return value.toFixed(0);
  }

  if (Math.abs(value) >= 10) {
    return value.toFixed(2);
  }

  return value.toFixed(3);
}

export function formatCompactNumber(value: number): string;
export function formatCompactNumber(value: number | undefined): string;
export function formatCompactNumber(value: number | undefined): string {
  if (value === undefined) {
    return "--";
  }

  if (!Number.isFinite(value) || value <= 0) {
    return "0";
  }

  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }

  return String(Math.round(value));
}

export function formatChartTimestamp(
  timestampSeconds: number,
  timeframeId: string
): string {
  if (!timestampSeconds) {
    return "--";
  }

  const date = new Date(timestampSeconds * 1000);
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");

  if (
    timeframeId === "1m" ||
    timeframeId === "5m" ||
    timeframeId === "15m"
  ) {
    return `${hours}:${minutes}`;
  }
  if (timeframeId === "1h") {
    return `${date.getMonth() + 1}/${date.getDate()} ${hours}:${minutes}`;
  }

  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export function formatTime(value: number): string {
  if (!Number.isFinite(value) || value <= 0) {
    return "n/a";
  }

  return new Date(value).toLocaleTimeString();
}

export function formatAtomic(value: number): string;
export function formatAtomic(value: number | undefined): string;
export function formatAtomic(value: number | undefined): string {
  if (value === undefined) {
    return "n/a";
  }

  return value.toLocaleString();
}

export function formatSignedUsd(value: number | undefined): string {
  if (value === undefined || value === 0) return "--";
  const abs = Math.abs(value);
  const prefix = value < 0 ? "-" : "+";
  if (abs >= 1_000_000) return `${prefix}$${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${prefix}$${(abs / 1_000).toFixed(1)}K`;
  if (abs >= 1) return `${prefix}$${abs.toFixed(2)}`;
  return `${prefix}$${abs.toFixed(4)}`;
}

export function formatTokenAmount(value: number | undefined, decimals?: number): string {
  if (value === undefined || !Number.isFinite(value)) {
    return "n/a";
  }

  const clamped = Math.max(0, Math.min(decimals ?? 6, 8));
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: clamped,
  });
}
