export const QUOTE_TTL_MS = 30_000;

export function getQuoteAgeMs(quoteRequestedAtMs: number, nowMs = Date.now()): number {
  if (!Number.isFinite(quoteRequestedAtMs) || quoteRequestedAtMs <= 0) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.max(0, nowMs - quoteRequestedAtMs);
}

export function isQuoteStale(quoteRequestedAtMs: number, nowMs = Date.now()): boolean {
  return getQuoteAgeMs(quoteRequestedAtMs, nowMs) > QUOTE_TTL_MS;
}

export function getQuoteTtlSecondsRemaining(
  quoteRequestedAtMs: number,
  nowMs = Date.now()
): number {
  const remainingMs = Math.max(0, QUOTE_TTL_MS - getQuoteAgeMs(quoteRequestedAtMs, nowMs));
  return Math.ceil(remainingMs / 1000);
}
