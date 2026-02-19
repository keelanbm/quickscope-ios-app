import { RpcClient } from "@/src/lib/api/rpcClient";

export type AuthTokens = {
  subject: string;
  refresh_token_expiration: string;
  access_token_expiration: string;
};

const quickscopeScopes = [
  "account.create",
  "account.list",
  "accounts.*.transaction.create",
  "accounts.*.transaction.list",
  "accounts.*.transaction.cancel",
] as const;

export function requestAuthChallenge(rpcClient: RpcClient, account: string) {
  return rpcClient.call<string>("auth/challenge", [
    "https://quickscope.gg",
    account,
    [...quickscopeScopes],
  ]);
}

export function submitAuthSolution(
  rpcClient: RpcClient,
  challenge: string,
  solution: string
) {
  return rpcClient.call<AuthTokens>("auth/solution", [challenge, solution]);
}

export function refreshAuthSession(rpcClient: RpcClient) {
  return rpcClient.call<AuthTokens>("auth/refresh", []);
}

export function revokeAuthSession(rpcClient: RpcClient, reason = "logout") {
  return rpcClient.call<boolean>("auth/revoke", [reason]);
}
