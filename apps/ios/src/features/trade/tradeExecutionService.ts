import type { RpcClient } from "@/src/lib/api/rpcClient";

type TxExecutionResult = {
  id?: number;
  status?: string;
  signature?: string;
  err?: unknown;
  creation_time?: string;
  execution_time?: string;
};

type TxSwapResponse = {
  execution_result?: TxExecutionResult;
};

export type SwapExecutionRequest = {
  walletAddress: string;
  inputMint: string;
  outputMint: string;
  amountAtomic: number;
  slippageBps: number;
  priorityFeeLamports: number;
  jitoTipLamports: number;
};

export type SwapExecutionResult = {
  requestedAtMs: number;
  status?: string;
  signature?: string;
  executionId?: number;
  creationTime?: string;
  executionTime?: string;
  errorPreview?: string;
  raw: unknown;
};

export async function requestSwapExecution(
  rpcClient: RpcClient,
  input: SwapExecutionRequest
): Promise<SwapExecutionResult> {
  const raw = await rpcClient.call<TxSwapResponse>("tx/swap", [
    input.walletAddress,
    input.inputMint,
    input.outputMint,
    input.amountAtomic,
    input.slippageBps,
    {
      priority_fee_lamports: input.priorityFeeLamports,
      tip_amount_lamports: input.jitoTipLamports,
    },
  ]);

  const execution = raw.execution_result;
  const errorPreview =
    execution?.err === undefined ? undefined : JSON.stringify(execution.err).slice(0, 240);

  return {
    requestedAtMs: Date.now(),
    status: execution?.status,
    signature: execution?.signature,
    executionId: execution?.id,
    creationTime: execution?.creation_time,
    executionTime: execution?.execution_time,
    errorPreview,
    raw,
  };
}
