/**
 * Multi-wallet trade execution — client-side orchestration.
 *
 * Pattern: loop through selected wallets and call tx/swap (buy) or
 * tx/swapBalancePercentage (sell) individually via Promise.allSettled.
 * Mirrors web's poly-terminal-frontend/src/lib/multi-wallet-trade.ts.
 */

import type { RpcClient } from "@/src/lib/api/rpcClient";
import { SOL_MINT } from "@/src/lib/constants";
import type { AccountTradeSettings, ExecutionPreset } from "@/src/features/account/settingsService";
import type { UserWalletInfo } from "@/src/features/account/walletService";
import { LAMPORTS_PER_SOL, RENT_EXEMPTION_LAMPORTS } from "@/src/features/account/walletService";
import { requestSwapExecution, type SwapExecutionResult } from "./tradeExecutionService";
import { requestSwapByPercentage } from "./tradeExecutionService";

// ── Types ──

export type SelectedWallet = Pick<UserWalletInfo, "public_key" | "name">;

export type SkippedWallet = {
  walletPublicKey: string;
  walletName?: string;
};

export type WalletTradeResult = {
  success: boolean;
  walletPublicKey: string;
  walletName?: string;
  signature?: string;
  error?: string;
  executionResult?: SwapExecutionResult;
};

export type BatchTradeResult = {
  success: WalletTradeResult[];
  failed: WalletTradeResult[];
  skipped: SkippedWallet[];
};

export type StealthSettings = {
  mode: "exact" | "split";
  buyVariance: number;
  sellVariance: number;
  ignore100Sell: boolean;
  buyDelayMs: number;
  sellDelayMs: number;
  instaThreshold: number;
  splitDeviation: number;
};

// ── Utility functions ──

export function getStealthSettings(settings: AccountTradeSettings): StealthSettings {
  return {
    mode: settings.batch_trade_mode,
    buyVariance: settings.stealth_buy_variance,
    sellVariance: settings.stealth_sell_variance,
    ignore100Sell: settings.stealth_ignore_100_sell,
    buyDelayMs: settings.stealth_buy_delay_ms,
    sellDelayMs: settings.stealth_sell_delay_ms,
    instaThreshold: settings.stealth_insta_threshold,
    splitDeviation: settings.split_deviation,
  };
}

export function applyVariance(amount: number, variancePercent: number): number {
  if (variancePercent <= 0) return amount;
  const minMultiplier = 1 - variancePercent / 100;
  const maxMultiplier = 1 + variancePercent / 100;
  const randomMultiplier = minMultiplier + Math.random() * (maxMultiplier - minMultiplier);
  return amount * randomMultiplier;
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Buy execution ──

export async function executeMultiWalletBuy({
  rpcClient,
  selectedWallets,
  totalSolAmount,
  tokenAddress,
  executionPreset,
  walletSolBalances,
  stealthSettings,
}: {
  rpcClient: RpcClient;
  selectedWallets: SelectedWallet[];
  totalSolAmount: number;
  tokenAddress: string;
  executionPreset: ExecutionPreset;
  walletSolBalances?: Record<string, number>;
  stealthSettings?: StealthSettings;
}): Promise<BatchTradeResult> {
  if (selectedWallets.length === 0) {
    throw new Error("No wallets selected for trading.");
  }

  const feeSol =
    (executionPreset.priority_fee_lamports + executionPreset.jito_tip_lamports) / LAMPORTS_PER_SOL;
  const rentBuffer = RENT_EXEMPTION_LAMPORTS / LAMPORTS_PER_SOL;
  const requiredSol = totalSolAmount + feeSol + rentBuffer;

  // Filter wallets with insufficient balance
  const skipped: SkippedWallet[] = [];
  const walletsToTrade = selectedWallets.filter((wallet) => {
    if (!walletSolBalances) return true;
    const balance = walletSolBalances[wallet.public_key] ?? 0;
    if (balance < requiredSol) {
      skipped.push({ walletPublicKey: wallet.public_key, walletName: wallet.name });
      return false;
    }
    return true;
  });

  // Apply stealth settings
  const usesStealth = stealthSettings && walletsToTrade.length > 1;
  const hasVariance =
    usesStealth && stealthSettings.buyVariance > 0 && stealthSettings.mode === "exact";
  const hasDelays = usesStealth && stealthSettings.buyDelayMs > 0;
  const orderedWallets = hasDelays ? shuffleArray(walletsToTrade) : walletsToTrade;

  const amountAtomic = Math.max(1, Math.floor(totalSolAmount * LAMPORTS_PER_SOL));
  const success: WalletTradeResult[] = [];
  const failed: WalletTradeResult[] = [];

  await Promise.allSettled(
    orderedWallets.map(async (wallet, index) => {
      // Staggered delay
      if (hasDelays && index >= (stealthSettings.instaThreshold ?? 0)) {
        await delay(Math.random() * stealthSettings.buyDelayMs);
      }

      // Apply variance
      let walletAmountAtomic = amountAtomic;
      if (hasVariance) {
        walletAmountAtomic = Math.max(
          1,
          Math.floor(applyVariance(totalSolAmount, stealthSettings.buyVariance) * LAMPORTS_PER_SOL)
        );
      }

      try {
        const result = await requestSwapExecution(rpcClient, {
          walletAddress: wallet.public_key,
          inputMint: SOL_MINT,
          outputMint: tokenAddress,
          amountAtomic: walletAmountAtomic,
          slippageBps: executionPreset.slippage_bps,
          priorityFeeLamports: executionPreset.priority_fee_lamports,
          jitoTipLamports: executionPreset.jito_tip_lamports,
        });

        const walletResult: WalletTradeResult = {
          success: !result.errorPreview,
          walletPublicKey: wallet.public_key,
          walletName: wallet.name,
          signature: result.signature,
          error: result.errorPreview,
          executionResult: result,
        };

        if (walletResult.success) {
          success.push(walletResult);
        } else {
          failed.push(walletResult);
        }
      } catch (err) {
        failed.push({
          success: false,
          walletPublicKey: wallet.public_key,
          walletName: wallet.name,
          error: err instanceof Error ? err.message : "Trade failed",
        });
      }
    })
  );

  return { success, failed, skipped };
}

// ── Sell execution ──

export async function executeMultiWalletSell({
  rpcClient,
  selectedWallets,
  percentageBps,
  tokenAddress,
  executionPreset,
  stealthSettings,
}: {
  rpcClient: RpcClient;
  selectedWallets: SelectedWallet[];
  percentageBps: number;
  tokenAddress: string;
  executionPreset: ExecutionPreset;
  stealthSettings?: StealthSettings;
}): Promise<BatchTradeResult> {
  if (selectedWallets.length === 0) {
    throw new Error("No wallets selected for trading.");
  }

  if (percentageBps <= 0 || percentageBps > 10000) {
    throw new Error("Invalid sell percentage.");
  }

  const usesStealth = stealthSettings && selectedWallets.length > 1;
  const is100Sell = percentageBps === 10000;
  const hasVariance =
    usesStealth &&
    stealthSettings.sellVariance > 0 &&
    stealthSettings.mode === "exact" &&
    !(is100Sell && stealthSettings.ignore100Sell);
  const hasDelays = usesStealth && stealthSettings.sellDelayMs > 0;
  const orderedWallets = hasDelays ? shuffleArray(selectedWallets) : selectedWallets;

  const success: WalletTradeResult[] = [];
  const failed: WalletTradeResult[] = [];

  await Promise.allSettled(
    orderedWallets.map(async (wallet, index) => {
      if (hasDelays && index >= (stealthSettings.instaThreshold ?? 0)) {
        await delay(Math.random() * stealthSettings.sellDelayMs);
      }

      // Apply variance to percentage
      let walletPercentageBps = percentageBps;
      if (hasVariance) {
        const percentUi = percentageBps / 100; // bps → percent (e.g. 5000 → 50)
        const varied = applyVariance(percentUi, stealthSettings.sellVariance);
        walletPercentageBps = Math.min(10000, Math.max(1, Math.round(varied * 100)));
      }

      try {
        const result = await requestSwapByPercentage(rpcClient, {
          walletAddress: wallet.public_key,
          inputMint: tokenAddress,
          outputMint: SOL_MINT,
          percentageBps: walletPercentageBps,
          slippageBps: executionPreset.slippage_bps,
          priorityFeeLamports: executionPreset.priority_fee_lamports,
          jitoTipLamports: executionPreset.jito_tip_lamports,
        });

        const walletResult: WalletTradeResult = {
          success: !result.errorPreview,
          walletPublicKey: wallet.public_key,
          walletName: wallet.name,
          signature: result.signature,
          error: result.errorPreview,
          executionResult: result,
        };

        if (walletResult.success) {
          success.push(walletResult);
        } else {
          failed.push(walletResult);
        }
      } catch (err) {
        failed.push({
          success: false,
          walletPublicKey: wallet.public_key,
          walletName: wallet.name,
          error: err instanceof Error ? err.message : "Trade failed",
        });
      }
    })
  );

  return { success, failed, skipped: [] };
}

// ── Batch result toast helper ──

export function batchResultMessage(result: BatchTradeResult): {
  title: string;
  message: string;
  type: "success" | "warning" | "error";
} {
  const total = result.success.length + result.failed.length + result.skipped.length;

  if (result.success.length === total) {
    return {
      title: "Trade executed",
      message: `${result.success.length} wallet${result.success.length > 1 ? "s" : ""} traded successfully.`,
      type: "success",
    };
  }

  if (result.success.length === 0) {
    return {
      title: "Trade failed",
      message: `All ${total} wallet${total > 1 ? "s" : ""} failed.`,
      type: "error",
    };
  }

  const parts: string[] = [`${result.success.length} succeeded`];
  if (result.failed.length > 0) parts.push(`${result.failed.length} failed`);
  if (result.skipped.length > 0) parts.push(`${result.skipped.length} skipped`);

  return {
    title: "Partial success",
    message: `${parts.join(", ")} (${total} wallets).`,
    type: "warning",
  };
}
