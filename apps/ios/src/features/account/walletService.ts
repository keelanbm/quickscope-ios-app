import type { RpcClient } from "@/src/lib/api/rpcClient";

// ── Types ──

export type UserWalletInfo = {
  public_key: string;
  name: string;
  source: string;
  is_primary: boolean;
  selected: boolean;
  archived_at?: number;
  created_at: number;
  group_ids: number[];
};

export type WalletWithBalance = UserWalletInfo & {
  solBalance?: number;
};

export type WalletGroup = {
  id: number;
  name: string;
  color: string;
  created_at: number;
};

type ActiveWalletsResponse = {
  wallets: UserWalletInfo[];
  groups: WalletGroup[];
};

type SolBalanceEntry = {
  account: string;
  balance: number;
  solBalanceUiAmountString: string;
};

type AccountSolBalancesResponse = {
  balances: SolBalanceEntry[];
};

// ── Constants ──

export const LAMPORTS_PER_SOL = 1_000_000_000;
export const RENT_EXEMPTION_LAMPORTS = 1_000_000; // 0.001 SOL

// ── Wallet queries ──

export async function fetchActiveWallets(
  rpcClient: RpcClient
): Promise<ActiveWalletsResponse> {
  const result = await rpcClient.call<ActiveWalletsResponse | UserWalletInfo[]>(
    "tx/getActiveWalletsV2",
    []
  );

  if (__DEV__) {
    console.log("[walletService] getActiveWalletsV2 raw:", JSON.stringify(result).slice(0, 500));
  }

  // API may return { wallets, groups } or just an array of wallets
  if (Array.isArray(result)) {
    return { wallets: result, groups: [] };
  }
  if (result && "wallets" in result) {
    return result as ActiveWalletsResponse;
  }
  return { wallets: [], groups: [] };
}

export async function fetchWalletSolBalances(
  rpcClient: RpcClient,
  walletKeys: string[]
): Promise<Record<string, number>> {
  if (walletKeys.length === 0) return {};

  const result = await rpcClient.call<AccountSolBalancesResponse>(
    "public/getAccountSolBalances",
    [walletKeys]
  );

  if (__DEV__) {
    console.log("[walletService] getAccountSolBalances raw:", JSON.stringify(result).slice(0, 500));
  }

  const balances: Record<string, number> = {};
  for (const entry of result?.balances ?? []) {
    balances[entry.account] = entry.balance / LAMPORTS_PER_SOL;
  }
  return balances;
}

// ── Wallet mutations ──

export async function selectWallets(
  rpcClient: RpcClient,
  walletKeys: string[]
): Promise<void> {
  await rpcClient.call("tx/selectWallets", [walletKeys]);
}

export async function unselectWallets(
  rpcClient: RpcClient,
  walletKeys: string[]
): Promise<void> {
  await rpcClient.call("tx/unselectWallets", [walletKeys]);
}

// ── Transfer ──

export async function transferSol(
  rpcClient: RpcClient,
  params: { userAccountKey: string; receiver: string; amount: number }
): Promise<string> {
  const signature = await rpcClient.call<string>("tx/transferSol", [
    params.userAccountKey,
    params.receiver,
    params.amount,
  ]);
  return signature ?? "";
}

export async function transferSpl(
  rpcClient: RpcClient,
  params: {
    userAccountKey: string;
    receiver: string;
    splAddress: string;
    amount: number;
  }
): Promise<string> {
  const signature = await rpcClient.call<string>("tx/transferSpl", [
    params.userAccountKey,
    params.receiver,
    params.splAddress,
    params.amount,
  ]);
  return signature ?? "";
}

// ── Helpers ──

export function truncateAddress(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export function isValidSolanaAddress(address: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
}

export function solToLamports(sol: number): number {
  return Math.floor(sol * LAMPORTS_PER_SOL);
}
