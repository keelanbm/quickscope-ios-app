import { describe, expect, it } from "@jest/globals";
import {
  formatCompactUsd,
  formatPercent,
  formatAgeFromSeconds,
  formatWalletAddress,
  formatSol,
} from "./format";

describe("formatCompactUsd", () => {
  it("formats billions", () => {
    expect(formatCompactUsd(1_500_000_000)).toBe("$1.50B");
  });

  it("formats millions", () => {
    expect(formatCompactUsd(1_200_000)).toBe("$1.20M");
  });

  it("formats thousands", () => {
    expect(formatCompactUsd(450_000)).toBe("$450.0K");
  });

  it("formats dollars", () => {
    expect(formatCompactUsd(42.5)).toBe("$42.50");
  });

  it("formats sub-dollar", () => {
    expect(formatCompactUsd(0.0045)).toBe("$0.0045");
  });

  it("returns $0 for zero and negative", () => {
    expect(formatCompactUsd(0)).toBe("$0");
    expect(formatCompactUsd(-5)).toBe("$0");
  });

  it("returns $0 for non-finite", () => {
    expect(formatCompactUsd(NaN)).toBe("$0");
    expect(formatCompactUsd(Infinity)).toBe("$0");
  });

  it("handles undefined via overload", () => {
    expect(formatCompactUsd(undefined)).toBe("--");
  });
});

describe("formatPercent", () => {
  it("formats positive with plus prefix", () => {
    expect(formatPercent(12.5)).toBe("+12.5%");
  });

  it("formats negative", () => {
    expect(formatPercent(-8.3)).toBe("-8.3%");
  });

  it("formats zero", () => {
    expect(formatPercent(0)).toBe("0.0%");
  });

  it("returns 0.0% for non-finite", () => {
    expect(formatPercent(NaN)).toBe("0.0%");
  });

  it("handles undefined via overload", () => {
    expect(formatPercent(undefined)).toBe("--");
  });
});

describe("formatAgeFromSeconds", () => {
  it("formats seconds", () => {
    const now = Math.floor(Date.now() / 1000);
    expect(formatAgeFromSeconds(now - 30)).toBe("30s");
  });

  it("formats minutes", () => {
    const now = Math.floor(Date.now() / 1000);
    expect(formatAgeFromSeconds(now - 300)).toBe("5m");
  });

  it("formats hours", () => {
    const now = Math.floor(Date.now() / 1000);
    expect(formatAgeFromSeconds(now - 7200)).toBe("2h");
  });

  it("formats days", () => {
    const now = Math.floor(Date.now() / 1000);
    expect(formatAgeFromSeconds(now - 172800)).toBe("2d");
  });

  it("formats weeks", () => {
    const now = Math.floor(Date.now() / 1000);
    expect(formatAgeFromSeconds(now - 1209600)).toBe("2w");
  });

  it("returns n/a for invalid", () => {
    expect(formatAgeFromSeconds(0)).toBe("n/a");
    expect(formatAgeFromSeconds(-1)).toBe("n/a");
    expect(formatAgeFromSeconds(NaN)).toBe("n/a");
  });

  it("handles undefined via overload", () => {
    expect(formatAgeFromSeconds(undefined)).toBe("--");
  });
});

describe("formatWalletAddress", () => {
  it("truncates long addresses", () => {
    expect(formatWalletAddress("ABCDEFghijklmnopqrstuvwxyz12345678")).toBe(
      "ABCDEF...5678"
    );
  });

  it("returns short addresses as-is", () => {
    expect(formatWalletAddress("ABCDEFGH")).toBe("ABCDEFGH");
  });

  it("returns placeholder for undefined", () => {
    expect(formatWalletAddress(undefined)).toBe("Not connected");
  });
});

describe("formatSol", () => {
  it("formats large values with no decimals", () => {
    expect(formatSol(1500)).toBe("1500");
  });

  it("formats medium values with 2 decimals", () => {
    expect(formatSol(42.567)).toBe("42.57");
  });

  it("formats small values with 3 decimals", () => {
    expect(formatSol(1.5678)).toBe("1.568");
  });

  it("returns -- for undefined", () => {
    expect(formatSol(undefined)).toBe("--");
  });
});
