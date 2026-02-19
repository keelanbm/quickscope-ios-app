import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useAccounts, useDisconnect, useSolana } from "@phantom/react-native-sdk";
import bs58 from "bs58";
import { AppState } from "react-native";

import type { AuthTokens } from "@/src/features/auth/authService";
import {
  refreshAuthSession,
  requestAuthChallenge,
  submitAuthSolution,
  revokeAuthSession,
} from "@/src/features/auth/authService";
import { ensurePrimaryAccount } from "@/src/features/account/accountService";
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
  authenticateWithExternalSigner: (
    walletAddress: string,
    signMessage: (challenge: string) => Promise<string>
  ) => Promise<void>;
  refreshSession: () => Promise<void>;
  clearSession: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

export function AuthSessionProvider({
  rpcClient,
  children,
}: PropsWithChildren<{ rpcClient: RpcClient }>) {
  const { addresses } = useAccounts();
  const { disconnect } = useDisconnect();
  const { solana, isAvailable } = useSolana();
  const [status, setStatus] = useState<AuthSessionStatus>("bootstrapping");
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [sessionWalletAddress, setSessionWalletAddress] = useState<string | undefined>();
  const [errorText, setErrorText] = useState<string | undefined>();
  const hasEnsuredAccountRef = useRef(false);

  const embeddedWalletAddress = useMemo(() => getSolanaAddress(addresses), [addresses]);
  const walletAddress = embeddedWalletAddress ?? sessionWalletAddress;

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

  const logout = useCallback(async () => {
    try {
      await revokeAuthSession(rpcClient);
    } catch {}

    try {
      await disconnect();
    } catch {}

    await clearSession();
  }, [clearSession, disconnect, rpcClient]);

  const persistSession = useCallback(async (nextTokens: AuthTokens, nextWalletAddress?: string) => {
    await persistAuthSession({
      tokens: nextTokens,
      walletAddress: nextWalletAddress,
    });
    setTokens(nextTokens);
    setSessionWalletAddress(nextWalletAddress);
    setErrorText(undefined);
    setStatus("authenticated");

    if (!hasEnsuredAccountRef.current) {
      hasEnsuredAccountRef.current = true;
      try {
        await ensurePrimaryAccount(rpcClient);
      } catch (error) {
        hasEnsuredAccountRef.current = false;
        setErrorText(
          error instanceof Error ? error.message : "Failed to initialize account."
        );
      }
    }
  }, [rpcClient]);

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

  const authenticateWithExternalSigner = useCallback(
    async (walletToAuth: string, signMessage: (challenge: string) => Promise<string>) => {
      setStatus("authenticating");
      setErrorText(undefined);

      try {
        const challenge = await requestAuthChallenge(rpcClient, walletToAuth);
        const solution = await signMessage(challenge);
        const nextTokens = await submitAuthSolution(rpcClient, challenge, solution);
        await persistSession(nextTokens, walletToAuth);
      } catch (error) {
        setStatus("error");
        setErrorText(String(error));
      }
    },
    [persistSession, rpcClient]
  );

  const authenticateFromWallet = useCallback(async () => {
    if (!embeddedWalletAddress) {
      setStatus("error");
      setErrorText("No connected wallet address available.");
      return;
    }

    if (!isAvailable) {
      setStatus("error");
      setErrorText("Solana signing is not available.");
      return;
    }

    await authenticateWithExternalSigner(embeddedWalletAddress, async (challenge) => {
      const { signature } = await solana.signMessage(challenge);
      return bs58.encode(signature);
    });
  }, [authenticateWithExternalSigner, embeddedWalletAddress, isAvailable, solana]);

  useEffect(() => {
    const currentWallet = embeddedWalletAddress;
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

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    if (!hasValidAccessToken && hasValidRefreshToken) {
      void refreshSession();
    }
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
      authenticateWithExternalSigner,
      refreshSession,
      clearSession,
      logout,
    }),
    [
      authenticateFromWallet,
      authenticateWithExternalSigner,
      clearSession,
      errorText,
      hasValidAccessToken,
      hasValidRefreshToken,
      logout,
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
