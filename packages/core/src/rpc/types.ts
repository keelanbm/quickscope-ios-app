export type RpcErrorShape = {
  code: number;
  message: string;
};

export type RpcResponse<T> = {
  result?: T;
  error?: RpcErrorShape;
};

export type RpcCall = <T>(method: string, params: unknown[]) => Promise<T>;
