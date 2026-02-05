import type { RpcClient } from "@/src/lib/api/rpcClient";
import { requestSwapExecution } from "@/src/features/trade/tradeExecutionService";

describe("requestSwapExecution", () => {
  it("calls tx/swap with expected payload", async () => {
    const call = jest.fn().mockResolvedValue({
      execution_result: {
        id: 42,
        status: "pending",
        signature: "3iKL...abc",
        creation_time: "2026-02-05T20:29:58Z",
        execution_time: "2026-02-05T20:30:00Z",
      },
    });
    const rpcClient = { call } as unknown as RpcClient;

    const result = await requestSwapExecution(rpcClient, {
      walletAddress: "ZwBP123",
      inputMint: "So11111111111111111111111111111111111111112",
      outputMint: "TokenMint123",
      amountAtomic: 250_000_000,
      slippageBps: 50,
    });

    expect(call).toHaveBeenCalledWith("tx/swap", [
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
    expect(result.status).toBe("pending");
    expect(result.signature).toBe("3iKL...abc");
    expect(result.executionId).toBe(42);
    expect(result.creationTime).toBe("2026-02-05T20:29:58Z");
  });

  it("captures execution error preview", async () => {
    const call = jest.fn().mockResolvedValue({
      execution_result: {
        status: "failed",
        err: { code: "slippage_exceeded" },
      },
    });
    const rpcClient = { call } as unknown as RpcClient;

    const result = await requestSwapExecution(rpcClient, {
      walletAddress: "ZwBP123",
      inputMint: "So11111111111111111111111111111111111111112",
      outputMint: "TokenMint123",
      amountAtomic: 250_000_000,
      slippageBps: 50,
    });

    expect(result.status).toBe("failed");
    expect(result.errorPreview).toContain("slippage_exceeded");
  });
});
