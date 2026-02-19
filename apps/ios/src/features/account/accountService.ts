import type { RpcClient } from "@/src/lib/api/rpcClient";

export type UserWalletInfo = {
  public_key: string;
  name?: string;
};

export async function fetchPrimaryAccountPublicKey(
  rpcClient: RpcClient
): Promise<string | null> {
  const result = await rpcClient.call<UserWalletInfo | null>("tx/getPrimaryWallet", []);
  return result?.public_key ?? null;
}

export async function createAccount(
  rpcClient: RpcClient,
  params?: { name?: string; referralCode?: string | null }
): Promise<string | null> {
  const name = params?.name ?? "Wallet 1";
  const referralCode = params?.referralCode ?? null;
  const result = await rpcClient.call<UserWalletInfo>("tx/createAccount", [
    name,
    referralCode,
  ]);
  return result?.public_key ?? null;
}

export async function ensurePrimaryAccount(rpcClient: RpcClient): Promise<string | null> {
  const primary = await fetchPrimaryAccountPublicKey(rpcClient);
  if (primary) {
    return primary;
  }
  return createAccount(rpcClient);
}
