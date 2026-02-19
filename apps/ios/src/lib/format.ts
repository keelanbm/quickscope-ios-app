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
