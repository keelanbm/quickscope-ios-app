import { RpcCall, RpcResponse } from "./types";

type CreateRpcClientConfig = {
  apiHost: string;
};

export function createRpcClient({ apiHost }: CreateRpcClientConfig): { call: RpcCall } {
  const call: RpcCall = async <T>(method: string, params: unknown[]) => {
    const response = await fetch(`${apiHost}/${method}`, {
      method: "POST",
      credentials: "include",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        method,
        params,
      }),
    });

    const json = (await response.json()) as RpcResponse<T>;

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    if (json.error) {
      throw new Error(`RPC ${json.error.code}: ${json.error.message}`);
    }

    if (json.result === undefined) {
      throw new Error("RPC response missing result");
    }

    return json.result;
  };

  return { call };
}
