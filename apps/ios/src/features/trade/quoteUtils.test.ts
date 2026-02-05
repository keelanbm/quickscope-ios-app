import {
  QUOTE_TTL_MS,
  getQuoteAgeMs,
  getQuoteTtlSecondsRemaining,
  isQuoteStale,
} from "@/src/features/trade/quoteUtils";

describe("quoteUtils", () => {
  it("computes quote age with lower bound at zero", () => {
    expect(getQuoteAgeMs(1000, 900)).toBe(0);
    expect(getQuoteAgeMs(1000, 1750)).toBe(750);
  });

  it("marks stale only after ttl threshold", () => {
    expect(isQuoteStale(1000, 1000 + QUOTE_TTL_MS)).toBe(false);
    expect(isQuoteStale(1000, 1000 + QUOTE_TTL_MS + 1)).toBe(true);
  });

  it("returns remaining ttl seconds", () => {
    expect(getQuoteTtlSecondsRemaining(1000, 1000)).toBe(30);
    expect(getQuoteTtlSecondsRemaining(1000, 1000 + 12_345)).toBe(18);
    expect(getQuoteTtlSecondsRemaining(1000, 1000 + QUOTE_TTL_MS + 1)).toBe(0);
  });
});
