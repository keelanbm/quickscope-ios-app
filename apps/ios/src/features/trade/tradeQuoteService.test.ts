import type { RpcClient } from "@/src/lib/api/rpcClient";
import { requestSwapQuote } from "@/src/features/trade/tradeQuoteService";

describe("requestSwapQuote", () => {
  it("calls tx/getSwapQuote with SOL lamports and defaults", async () => {
    const call = jest.fn().mockResolvedValue({
      outAmount: "123456",
      otherAmountThreshold: "120000",
      priceImpactPct: "0.0012",
      routePlan: [{ hop: 1 }, { hop: 2 }],
    });
    const rpcClient = { call } as unknown as RpcClient;

    const result = await requestSwapQuote(rpcClient, {
      walletAddress: "ZwBP123",
      inputMint: "So11111111111111111111111111111111111111112",
      outputMint: "TokenMint123",
      amountUi: 0.25,
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
    expect(result.summary).toEqual({
      outAmountAtomic: 123456,
      minOutAmountAtomic: 120000,
      priceImpactPercent: 0.12,
      routeHopCount: 2,
    });
  });

  it("rejects non-SOL input mints in this phase", async () => {
    const call = jest.fn();
    const rpcClient = { call } as unknown as RpcClient;

    await expect(
      requestSwapQuote(rpcClient, {
        walletAddress: "ZwBP123",
        inputMint: "TokenMintIn",
        outputMint: "TokenMintOut",
        amountUi: 10,
      })
    ).rejects.toThrow("Only SOL-input quote requests are enabled in this build.");
    expect(call).not.toHaveBeenCalled();
  });
});
