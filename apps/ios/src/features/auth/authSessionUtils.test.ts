import {
  getSolanaAddress,
  isFutureTimestamp,
  parseExpirationToUnixMs,
  shouldInvalidateSessionForWalletChange,
} from "@/src/features/auth/authSessionUtils";

describe("authSessionUtils", () => {
  describe("parseExpirationToUnixMs", () => {
    it("parses seconds-based unix values", () => {
      expect(parseExpirationToUnixMs("1770216600")).toBe(1_770_216_600_000);
    });

    it("keeps millisecond unix values", () => {
      expect(parseExpirationToUnixMs("1770216600000")).toBe(1_770_216_600_000);
    });

    it("parses ISO datetimes", () => {
      expect(parseExpirationToUnixMs("2026-02-04T12:00:00.000Z")).toBe(1_770_206_400_000);
    });

    it("returns undefined for invalid values", () => {
      expect(parseExpirationToUnixMs("not-a-date")).toBeUndefined();
      expect(parseExpirationToUnixMs(undefined)).toBeUndefined();
    });
  });

  describe("isFutureTimestamp", () => {
    it("returns true when timestamp is in the future", () => {
      expect(
        isFutureTimestamp(1_770_216_600_000, {
          nowMs: 1_770_200_000_000,
          skewMs: 30_000,
        })
      ).toBe(true);
    });

    it("returns false when timestamp falls inside skew window", () => {
      expect(
        isFutureTimestamp(1_770_200_010_000, {
          nowMs: 1_770_200_000_000,
          skewMs: 30_000,
        })
      ).toBe(false);
    });
  });

  describe("getSolanaAddress", () => {
    it("prefers the first solana address", () => {
      const value = getSolanaAddress([
        { addressType: "ethereum", address: "0xabc" },
        { addressType: "solana", address: "So11111111111111111111111111111111111111112" },
      ]);

      expect(value).toBe("So11111111111111111111111111111111111111112");
    });

    it("falls back to first address when no solana address exists", () => {
      const value = getSolanaAddress([{ addressType: "ethereum", address: "0xabc" }]);

      expect(value).toBe("0xabc");
    });
  });

  describe("shouldInvalidateSessionForWalletChange", () => {
    it("returns true when session and current wallet differ", () => {
      expect(
        shouldInvalidateSessionForWalletChange(
          "So11111111111111111111111111111111111111112",
          "Z8wPMesZqDZv4URMfBFH6kwFwM4fxjpdRG33tMjNFeP"
        )
      ).toBe(true);
    });

    it("returns false when wallet is missing or unchanged", () => {
      expect(
        shouldInvalidateSessionForWalletChange(
          "So11111111111111111111111111111111111111112",
          "So11111111111111111111111111111111111111112"
        )
      ).toBe(false);
      expect(
        shouldInvalidateSessionForWalletChange(
          "So11111111111111111111111111111111111111112",
          undefined
        )
      ).toBe(false);
    });
  });
});
