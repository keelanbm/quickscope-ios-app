import { useCallback, useMemo } from "react";

import { usePrivy, useEmbeddedSolanaWallet } from "@privy-io/expo";
import { usePhantomDeeplinkWalletConnector } from "@privy-io/expo/connectors";
import { useLogin } from "@privy-io/expo/ui";

/**
 * Compatibility hook that wraps Privy's wallet API to expose a unified interface
 * for wallet state and actions across the app.
 *
 * Supports two wallet modes:
 * 1. Privy login (email/Google/Discord) → embedded Solana wallet
 * 2. Phantom deep link → external wallet connection
 */
export function useWalletCompat() {
  const { user, isReady, logout: privyLogout } = usePrivy();
  const { login: privyLogin } = useLogin();
  const embeddedWallet = useEmbeddedSolanaWallet();
  const wallets = embeddedWallet.wallets ?? [];

  const {
    address: phantomAddress,
    connect: phantomConnect,
    disconnect: phantomDisconnect,
    isConnected: isPhantomConnected,
    signMessage: phantomSignMessage,
  } = usePhantomDeeplinkWalletConnector({
    appUrl: "https://quickscope.gg",
    redirectUri: "/",
  });

  const solanaWallet = wallets[0] ?? null;
  const embeddedAddress = solanaWallet?.address ?? null;
  const isAuthenticated = Boolean(user);

  // Prefer Phantom address if connected, otherwise use embedded wallet
  const walletAddress = isPhantomConnected ? (phantomAddress ?? null) : embeddedAddress;
  const connected = isPhantomConnected || (isAuthenticated && Boolean(solanaWallet));

  const login = useCallback(async () => {
    try {
      const session = await privyLogin({ loginMethods: ["email", "google", "discord"] });
      console.log("[useWalletCompat] Login success:", session.user.id);
    } catch (error) {
      console.error("[useWalletCompat] Login failed:", error);
    }
  }, [privyLogin]);

  const connectPhantom = useCallback(async () => {
    try {
      await phantomConnect();
    } catch (error) {
      console.error("[useWalletCompat] Phantom connection failed:", error);
    }
  }, [phantomConnect]);

  const disconnect = useCallback(async () => {
    if (isPhantomConnected) {
      await phantomDisconnect();
    }
    await privyLogout();
  }, [isPhantomConnected, phantomDisconnect, privyLogout]);

  return useMemo(
    () => ({
      walletAddress,
      connected,
      connecting: !isReady,
      wallet: solanaWallet,
      disconnect,
      login,
      connectPhantom,
      phantomSignMessage,
      isPhantomConnected,
      isPrivyAuthenticated: isAuthenticated,
    }),
    [
      walletAddress,
      connected,
      isReady,
      solanaWallet,
      disconnect,
      login,
      connectPhantom,
      phantomSignMessage,
      isPhantomConnected,
      isAuthenticated,
    ]
  );
}
