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

export type ReferralRates = {
  cashback_rate_bps: number;
  signup_rate_bps: number;
  l1_rate_bps: number;
  l2_rate_bps: number;
  l3_rate_bps: number;
  tg_group_rate_bps: number;
};

export type ClaimInfo = {
  last_update_ts: number;
  signature: string;
  owner_public_key: string;
  claim_amount: number;
  gas_reserve: number;
  status: string;
};

export type ClaimHistoryFilter = {
  limit?: number;
  offset?: number;
  sort_column?: string;
  sort_order?: boolean;
};

/* ── Constants ── */

export const MIN_CLAIMABLE_REWARDS = 0.01;

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

export async function fetchReferralRates(
  rpcClient: RpcClient
): Promise<ReferralRates> {
  return rpcClient.call<ReferralRates>("private/getReferralRates", []);
}

export async function fetchClaimHistory(
  rpcClient: RpcClient,
  filter?: ClaimHistoryFilter
): Promise<ClaimInfo[]> {
  return rpcClient.call<ClaimInfo[]>("private/getClaimHistory", [filter ?? {}]);
}
