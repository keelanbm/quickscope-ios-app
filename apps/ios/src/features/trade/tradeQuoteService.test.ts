import type { RpcClient } from "@/src/lib/api/rpcClient";
import { requestSwapQuote } from "@/src/features/trade/tradeQuoteService";

describe("requestSwapQuote", () => {
  it("calls tx/getSwapQuote with token-decimal atomic amount and defaults", async () => {
    const call = jest.fn().mockResolvedValue({
      amount_in: "250000000",
      amount_in_max: "250250000",
      amount_out: "1234567890",
      amount_out_min: "1200000000",
      priceImpactPct: "0.0012",
      quickscope_fee_info: {
        user_fee_rate_bps: 25,
        fee_amount_sol: "0.0005",
      },
      routePlan: [{ hop: 1 }, { hop: 2 }],
    });
    const rpcClient = { call } as unknown as RpcClient;

    const result = await requestSwapQuote(rpcClient, {
      walletAddress: "ZwBP123",
      inputMint: "So11111111111111111111111111111111111111112",
      outputMint: "TokenMint123",
      amountUi: 0.25,
      outputTokenDecimals: 6,
    });

    expect(call).toHaveBeenCalledWith("tx/getSwapQuote", [
      "ZwBP123",
      "So11111111111111111111111111111111111111112",
      "TokenMint123",
      250_000_000,
      50,
      {
        priority_fee_lamports: 0,
        tip_amount_lamports: 0,
      },
    ]);
    expect(result.summary).toMatchObject({
      amountInAtomic: 250000000,
      amountInMaxAtomic: 250250000,
      outAmountAtomic: 1234567890,
      minOutAmountAtomic: 1200000000,
      priceImpactPercent: 0.12,
      feeAmountSol: 0.0005,
      feeRateBps: 25,
      routeHopCount: 2,
    });
    expect(result.summary.amountOutUi).toBeCloseTo(1234.56789, 8);
    expect(result.summary.minOutAmountUi).toBeCloseTo(1200, 8);
  });

  it("requires input decimals when mint is unknown", async () => {
    const call = jest.fn().mockResolvedValue({});
    const rpcClient = { call } as unknown as RpcClient;

    await expect(
      requestSwapQuote(rpcClient, {
        walletAddress: "ZwBP123",
        inputMint: "TokenMintIn",
        outputMint: "TokenMintOut",
        amountUi: 10,
      })
    ).rejects.toThrow("Input token decimals are unavailable. Use SOL input or provide token decimals.");
    expect(call).not.toHaveBeenCalled();
  });

  it("supports non-SOL input when decimals are supplied", async () => {
    const call = jest.fn().mockResolvedValue({});
    const rpcClient = { call } as unknown as RpcClient;

    await requestSwapQuote(rpcClient, {
      walletAddress: "ZwBP123",
      inputMint: "TokenMintIn",
      outputMint: "TokenMintOut",
      amountUi: 12.345678,
      inputTokenDecimals: 6,
    });

    expect(call).toHaveBeenCalledWith("tx/getSwapQuote", [
      "ZwBP123",
      "TokenMintIn",
      "TokenMintOut",
      12_345_678,
      50,
      {
        priority_fee_lamports: 0,
        tip_amount_lamports: 0,
      },
    ]);
  });
});
