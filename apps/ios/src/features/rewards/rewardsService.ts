import type { RpcClient } from "@/src/lib/api/rpcClient";

/* ── Types ── */

export type CumulativeEarnings = {
  cashback_earnings: number;
  signup_earnings: number;
  l1_earnings: number;
  l2_earnings: number;
  l3_earnings: number;
  tg_group_earnings: number;
  cumulative_earnings: number;
  total_earnings_including_cashback: number;
};

export type UserClaimInfo = {
  unclaimed: number;
  pending: number;
  claimed: number;
  allocated: number;
  last_update_ts: number;
};

export type EarningsByMint = {
  token_mint: string;
  cashback_earnings: number;
  signup_earnings: number;
  l1_earnings: number;
  l2_earnings: number;
  l3_earnings: number;
  tg_group_earnings: number;
  cumulative_earnings: number;
  total_earnings_including_cashback: number;
};

export type EarningsByMintFilter = {
  limit?: number;
  offset?: number;
  sort_column?: string;
  sort_order?: boolean;
};

/* ── API calls ── */

export async function fetchCumulativeEarnings(
  rpcClient: RpcClient
): Promise<CumulativeEarnings> {
  return rpcClient.call<CumulativeEarnings>("private/getCumulativeEarnings", []);
}

export async function fetchUserClaimInfo(
  rpcClient: RpcClient
): Promise<UserClaimInfo> {
  return rpcClient.call<UserClaimInfo>("private/getUserClaimInfo", []);
}

export async function requestClaim(
  rpcClient: RpcClient
): Promise<boolean> {
  return rpcClient.call<boolean>("tx/requestClaim", []);
}

export async function fetchReferralCode(
  rpcClient: RpcClient
): Promise<string> {
  return rpcClient.call<string>("private/getReferralCode", []);
}

export async function setReferralCode(
  rpcClient: RpcClient,
  referralCode: string
): Promise<boolean> {
  return rpcClient.call<boolean>("private/setReferralCode", [{ referralCode }]);
}

export async function fetchEarningsByMint(
  rpcClient: RpcClient,
  filter?: EarningsByMintFilter
): Promise<EarningsByMint[]> {
  return rpcClient.call<EarningsByMint[]>("private/getEarningsByMint", [filter ?? {}]);
}
