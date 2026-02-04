import { AppEnv } from "@/src/config/env";

type RpcResponse<T> = {
  result?: T;
  error?: {
    code: number;
    message: string;
  };
};

export class RpcClient {
  private readonly apiHost: string;

  constructor(env: AppEnv) {
    this.apiHost = env.apiHost;
  }

  async call<T>(method: string, params: unknown[]): Promise<T> {
    const response = await fetch(`${this.apiHost}/${method}`, {
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
  }
}
