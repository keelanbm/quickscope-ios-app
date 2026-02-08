import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useAccounts, useSolana } from "@phantom/react-native-sdk";
import bs58 from "bs58";
import { AppState } from "react-native";

import type { AuthTokens } from "@/src/features/auth/authService";
import {
  refreshAuthSession,
  requestAuthChallenge,
  submitAuthSolution,
} from "@/src/features/auth/authService";
import {
  clearStoredAuthSession,
  loadStoredAuthSession,
  persistAuthSession,
} from "@/src/features/auth/sessionStorage";
import {
  getSolanaAddress,
  isFutureTimestamp,
  parseExpirationToUnixMs,
  shouldInvalidateSessionForWalletChange,
} from "@/src/features/auth/authSessionUtils";
import { RpcClient } from "@/src/lib/api/rpcClient";

type AuthSessionStatus =
  | "bootstrapping"
  | "unauthenticated"
  | "authenticating"
  | "authenticated"
  | "refreshing"
  | "error";

type AuthSessionContextValue = {
  status: AuthSessionStatus;
  tokens: AuthTokens | null;
  errorText?: string;
  walletAddress?: string;
  sessionWalletAddress?: string;
  hasValidAccessToken: boolean;
  hasValidRefreshToken: boolean;
  authenticateFromWallet: () => Promise<void>;
  refreshSession: () => Promise<void>;
  clearSession: () => Promise<void>;
};

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

export function AuthSessionProvider({
  rpcClient,
  children,
}: PropsWithChildren<{ rpcClient: RpcClient }>) {
  const { addresses } = useAccounts();
  const { solana, isAvailable } = useSolana();
  const [status, setStatus] = useState<AuthSessionStatus>("bootstrapping");
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [sessionWalletAddress, setSessionWalletAddress] = useState<string | undefined>();
  const [errorText, setErrorText] = useState<string | undefined>();

  const walletAddress = useMemo(() => getSolanaAddress(addresses), [addresses]);

  const accessTokenExpiresAt = parseExpirationToUnixMs(tokens?.access_token_expiration);
  const refreshTokenExpiresAt = parseExpirationToUnixMs(tokens?.refresh_token_expiration);
  const hasValidAccessToken = isFutureTimestamp(accessTokenExpiresAt, { skewMs: 30_000 });
  const hasValidRefreshToken = isFutureTimestamp(refreshTokenExpiresAt, { skewMs: 30_000 });

  const clearSession = useCallback(async () => {
    await clearStoredAuthSession();
    rpcClient.clearCookies();
    setTokens(null);
    setSessionWalletAddress(undefined);
    setErrorText(undefined);
    setStatus("unauthenticated");
  }, [rpcClient]);

  const persistSession = useCallback(async (nextTokens: AuthTokens, nextWalletAddress?: string) => {
    await persistAuthSession({
      tokens: nextTokens,
      walletAddress: nextWalletAddress,
    });
    setTokens(nextTokens);
    setSessionWalletAddress(nextWalletAddress);
    setErrorText(undefined);
    setStatus("authenticated");
  }, []);

  const markWalletMismatch = useCallback(
    async (currentWallet: string, expectedWallet: string) => {
      await clearSession();
      setErrorText(
        `Wallet changed (${expectedWallet.slice(0, 6)}... -> ${currentWallet.slice(0, 6)}...). Re-authenticate.`
      );
    },
    [clearSession]
  );

  const refreshSession = useCallback(async () => {
    setStatus("refreshing");
    setErrorText(undefined);

    try {
      const nextTokens = await refreshAuthSession(rpcClient);
      await persistSession(nextTokens, sessionWalletAddress);
    } catch (error) {
      setErrorText(String(error));
      await clearSession();
    }
  }, [clearSession, persistSession, rpcClient, sessionWalletAddress]);

  const authenticateFromWallet = useCallback(async () => {
    if (!walletAddress) {
      setStatus("error");
      setErrorText("No connected wallet address available.");
      return;
    }

    if (!isAvailable) {
      setStatus("error");
      setErrorText("Solana signing is not available.");
      return;
    }

    setStatus("authenticating");
    setErrorText(undefined);

    try {
      const challenge = await requestAuthChallenge(rpcClient, walletAddress);
      const { signature } = await solana.signMessage(challenge);
      const solution = bs58.encode(signature);
      const nextTokens = await submitAuthSolution(rpcClient, challenge, solution);
      await persistSession(nextTokens, walletAddress);
    } catch (error) {
      setStatus("error");
      setErrorText(String(error));
    }
  }, [isAvailable, persistSession, rpcClient, solana, walletAddress]);

  useEffect(() => {
    const currentWallet = walletAddress;
    const expectedWallet = sessionWalletAddress;

    if (
      status !== "authenticated" ||
      !currentWallet ||
      !expectedWallet ||
      !shouldInvalidateSessionForWalletChange(expectedWallet, currentWallet)
    ) {
      return;
    }

    void markWalletMismatch(currentWallet, expectedWallet);
  }, [markWalletMismatch, sessionWalletAddress, status, walletAddress]);

  useEffect(() => {
    let isCanceled = false;

    const bootstrap = async () => {
      const stored = await loadStoredAuthSession();
      if (isCanceled) {
        return;
      }

      if (!stored) {
        setStatus("unauthenticated");
        return;
      }

      setTokens(stored.tokens);
      setSessionWalletAddress(stored.walletAddress);

      const refreshExpiration = parseExpirationToUnixMs(stored.tokens.refresh_token_expiration);
      if (!isFutureTimestamp(refreshExpiration, { skewMs: 30_000 })) {
        await clearSession();
        return;
      }

      const accessExpiration = parseExpirationToUnixMs(stored.tokens.access_token_expiration);
      if (isFutureTimestamp(accessExpiration, { skewMs: 30_000 })) {
        setStatus("authenticated");
        return;
      }

      setStatus("refreshing");
      setErrorText(undefined);

      try {
        const nextTokens = await refreshAuthSession(rpcClient);
        await persistSession(nextTokens, stored.walletAddress);
      } catch (error) {
        setErrorText(String(error));
        await clearSession();
      }
    };

    void bootstrap();

    return () => {
      isCanceled = true;
    };
  }, [clearSession, persistSession, rpcClient]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active" || status !== "authenticated") {
        return;
      }

      if (!hasValidAccessToken && hasValidRefreshToken) {
        void refreshSession();
      }
    });

    return () => subscription.remove();
  }, [hasValidAccessToken, hasValidRefreshToken, refreshSession, status]);

  const value = useMemo<AuthSessionContextValue>(
    () => ({
      status,
      tokens,
      errorText,
      walletAddress,
      sessionWalletAddress,
      hasValidAccessToken,
      hasValidRefreshToken,
      authenticateFromWallet,
      refreshSession,
      clearSession,
    }),
    [
      authenticateFromWallet,
      clearSession,
      errorText,
      hasValidAccessToken,
      hasValidRefreshToken,
      refreshSession,
      sessionWalletAddress,
      status,
      tokens,
      walletAddress,
    ]
  );

  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
}

export function useAuthSession() {
  const context = useContext(AuthSessionContext);
  if (!context) {
    throw new Error("useAuthSession must be used inside AuthSessionProvider");
  }

  return context;
}
