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

import { useAccounts, useModal } from "@phantom/react-native-sdk";

import { useAuthSession } from "@/src/features/auth/AuthSessionProvider";
import {
  PhantomAppConnection,
  connectPhantomApp,
  resetPhantomAppSession,
  signMessageWithPhantomApp,
} from "@/src/features/wallet/phantomApp";
import { WalletConnectSheet } from "@/src/ui/WalletConnectSheet";

type WalletConnectContextValue = {
  open: () => void;
  ensureAuthenticated: () => Promise<void>;
  reset: () => void;
  hasPhantomAppSession: boolean;
};

const WalletConnectContext = createContext<WalletConnectContextValue | null>(null);

export function WalletConnectProvider({ children }: PropsWithChildren) {
  const { open: openEmbeddedModal } = useModal();
  const { isConnected } = useAccounts();
  const {
    hasValidAccessToken,
    authenticateFromWallet,
    authenticateWithExternalSigner,
  } = useAuthSession();
  const [visible, setVisible] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [hasPhantomAppSession, setHasPhantomAppSession] = useState(false);
  const phantomAppSessionRef = useRef<PhantomAppConnection | null>(null);
  const pendingEmbeddedAuthRef = useRef(false);

  const open = useCallback(() => {
    setErrorText(null);
    setVisible(true);
  }, []);

  const close = useCallback(() => {
    setVisible(false);
  }, []);

  const reset = useCallback(() => {
    phantomAppSessionRef.current = null;
    setHasPhantomAppSession(false);
    resetPhantomAppSession();
  }, []);

  const handleEmbedded = useCallback(() => {
    setVisible(false);
    setErrorText(null);
    pendingEmbeddedAuthRef.current = true;
    setTimeout(() => {
      openEmbeddedModal();
    }, 50);
  }, [openEmbeddedModal]);

  const handlePhantomApp = useCallback(async () => {
    setIsBusy(true);
    setErrorText(null);

    try {
      let connection = phantomAppSessionRef.current;
      if (!connection) {
        connection = await connectPhantomApp({
          appUrl: "https://quickscope.gg",
          redirectLink: "quickscope://phantom-connect-callback",
        });
        phantomAppSessionRef.current = connection;
        setHasPhantomAppSession(true);
      }

      await authenticateWithExternalSigner(connection.publicKey, async (challenge) =>
        signMessageWithPhantomApp(connection, challenge, {
          redirectLink: "quickscope://phantom-sign-callback",
        })
      );

      setVisible(false);
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : String(error));
    } finally {
      setIsBusy(false);
    }
  }, [authenticateWithExternalSigner]);

  const ensureAuthenticated = useCallback(async () => {
    if (hasValidAccessToken) {
      return;
    }

    if (phantomAppSessionRef.current) {
      await handlePhantomApp();
      return;
    }

    if (isConnected) {
      await authenticateFromWallet();
      return;
    }

    open();
  }, [authenticateFromWallet, handlePhantomApp, hasValidAccessToken, isConnected, open]);

  const hasEmbeddedWallet = isConnected && !hasPhantomAppSession;

  useEffect(() => {
    if (
      pendingEmbeddedAuthRef.current &&
      hasEmbeddedWallet &&
      !hasValidAccessToken &&
      !isBusy
    ) {
      pendingEmbeddedAuthRef.current = false;
      void authenticateFromWallet();
    }
  }, [authenticateFromWallet, hasEmbeddedWallet, hasValidAccessToken, isBusy]);

  const value = useMemo<WalletConnectContextValue>(
    () => ({
      open,
      ensureAuthenticated,
      reset,
      hasPhantomAppSession,
    }),
    [ensureAuthenticated, hasPhantomAppSession, open, reset]
  );

  return (
    <WalletConnectContext.Provider value={value}>
      {children}
      <WalletConnectSheet
        visible={visible}
        isBusy={isBusy}
        errorText={errorText}
        onClose={close}
        onEmbedded={handleEmbedded}
        onPhantomApp={handlePhantomApp}
      />
    </WalletConnectContext.Provider>
  );
}

export function useWalletConnect() {
  const context = useContext(WalletConnectContext);
  if (!context) {
    throw new Error("useWalletConnect must be used inside WalletConnectProvider");
  }

  return context;
}
