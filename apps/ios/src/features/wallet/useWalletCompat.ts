import { useCallback, useMemo } from "react";

import { usePrivy, useEmbeddedSolanaWallet } from "@privy-io/expo";
import { useLogin } from "@privy-io/expo/ui";

/**
 * Compatibility hook that wraps Privy's wallet API to expose a unified interface
 * for wallet state and actions across the app.
 *
 * For now, uses the embedded Solana wallet exclusively.
 * External wallet support (Phantom deeplink) can be added via
 * @privy-io/expo/connectors when needed.
 */
export function useWalletCompat() {
  const { user, isReady, logout: privyLogout } = usePrivy();
  const { login: privyLogin } = useLogin();
  const embeddedWallet = useEmbeddedSolanaWallet();
  const wallets = embeddedWallet.wallets ?? [];

  const solanaWallet = wallets[0] ?? null;
  const walletAddress = solanaWallet?.address ?? null;
  const isAuthenticated = Boolean(user);
  const connected = isAuthenticated && Boolean(solanaWallet);

  const login = useCallback(async () => {
    try {
      const session = await privyLogin({ loginMethods: ["email", "google", "discord", "telegram"] });
      console.log("[useWalletCompat] Login success:", session.user.id);
    } catch (error) {
      console.error("[useWalletCompat] Login failed:", error);
    }
  }, [privyLogin]);

  return useMemo(
    () => ({
      walletAddress,
      connected,
      connecting: !isReady,
      wallet: solanaWallet,
      disconnect: privyLogout,
      login,
      isPrivyAuthenticated: isAuthenticated,
    }),
    [walletAddress, connected, isReady, solanaWallet, privyLogout, login, isAuthenticated]
  );
}
