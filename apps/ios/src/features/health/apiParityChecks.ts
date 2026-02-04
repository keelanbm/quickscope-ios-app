import { RpcClient } from "@/src/lib/api/rpcClient";

export type ParityCheckResult = {
  method: string;
  status: "pass" | "fail";
  detail: string;
};

export async function runApiParityChecks(
  rpcClient: RpcClient,
  walletAddress: string
): Promise<ParityCheckResult[]> {
  const checks: ParityCheckResult[] = [];

  const runCheck = async (method: string, params: unknown[]) => {
    try {
      const result = await rpcClient.call<unknown>(method, params);
      checks.push({
        method,
        status: "pass",
        detail: JSON.stringify(result).slice(0, 140),
      });
    } catch (error) {
      checks.push({
        method,
        status: "fail",
        detail: String(error).slice(0, 140),
      });
    }
  };

  await runCheck("public/getLatestSolPrice", []);
  await runCheck("public/getAccountSolBalances", [[walletAddress]]);
  await runCheck("private/getDashboards", []);
  await runCheck("tx/getSwapQuote", [
    walletAddress,
    "So11111111111111111111111111111111111111112",
    "So11111111111111111111111111111111111111112",
    1_000_000,
    50,
    {
      priority_fee_lamports: 0,
      tip_amount_lamports: 0,
    },
  ]);

  return checks;
}

