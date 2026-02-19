import { PropsWithChildren, useEffect, useRef } from "react";

import { useAccounts, useModal } from "@phantom/react-native-sdk";
import { ActivityIndicator, Button, StyleSheet, Text, View } from "react-native";

import { useAuthSession } from "@/src/features/auth/AuthSessionProvider";
import { qsColors, qsSpacing } from "@/src/theme/tokens";
import { SectionCard } from "@/src/ui/SectionCard";

type AuthRouteGateProps = PropsWithChildren<{
  featureName: string;
  subtitle: string;
}>;

/**
 * Two-layer gate:
 *  1. Phantom wallet must be connected (isConnected)
 *  2. Backend auth session must be established (status === "authenticated")
 *
 * When the wallet is connected but the backend session isn't ready yet,
 * this gate auto-triggers `authenticateFromWallet()` and shows a spinner.
 */
export function AuthRouteGate({
  featureName,
  subtitle,
  children,
}: AuthRouteGateProps) {
  const { isConnected } = useAccounts();
  const { open } = useModal();
  const {
    status,
    authenticateFromWallet,
    errorText,
  } = useAuthSession();

  const authAttemptedRef = useRef(false);

  // Auto-trigger backend auth when wallet is connected but session is not established
  useEffect(() => {
    if (!isConnected) {
      authAttemptedRef.current = false;
      return;
    }

    if (
      status === "authenticated" ||
      status === "authenticating" ||
      status === "refreshing" ||
      status === "bootstrapping"
    ) {
      return;
    }

    // status is "unauthenticated" or "error" — trigger auth if we haven't tried yet
    if (!authAttemptedRef.current) {
      authAttemptedRef.current = true;
      void authenticateFromWallet();
    }
  }, [isConnected, status, authenticateFromWallet]);

  // Reset the attempt flag when status changes to allow retries after errors
  useEffect(() => {
    if (status === "unauthenticated") {
      authAttemptedRef.current = false;
    }
  }, [status]);

  // Layer 1: Wallet must be connected
  if (!isConnected) {
    return (
      <View style={styles.container}>
        <SectionCard title={`${featureName} is locked`} subtitle={subtitle}>
          <Text style={styles.copy}>
            Connect your wallet to access this area. This matches the mobile web signed-in flow.
          </Text>
          <Button title="Connect wallet" onPress={open} />
        </SectionCard>
      </View>
    );
  }

  // Layer 2: Backend session must be ready
  if (status === "authenticated") {
    return <>{children}</>;
  }

  // Auth is in progress (bootstrapping, authenticating, refreshing)
  if (status === "bootstrapping" || status === "authenticating" || status === "refreshing") {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={qsColors.accent} />
        <Text style={styles.statusText}>
          {status === "bootstrapping"
            ? "Restoring session…"
            : status === "refreshing"
              ? "Refreshing session…"
              : "Signing in…"}
        </Text>
      </View>
    );
  }

  // Error state — let the user retry
  return (
    <View style={styles.container}>
      <SectionCard
        title="Session error"
        subtitle="Could not establish a backend session."
      >
        {errorText ? (
          <Text style={styles.errorText} numberOfLines={3}>
            {errorText}
          </Text>
        ) : null}
        <View style={styles.retryRow}>
          <Button title="Retry sign-in" onPress={() => {
            authAttemptedRef.current = false;
            void authenticateFromWallet();
          }} />
        </View>
      </SectionCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: qsSpacing.xl,
    backgroundColor: qsColors.layer0,
    justifyContent: "center",
    alignItems: "center",
  },
  copy: {
    color: qsColors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  statusText: {
    color: qsColors.textSecondary,
    fontSize: 14,
    marginTop: qsSpacing.md,
    textAlign: "center",
  },
  errorText: {
    color: qsColors.sellRed,
    fontSize: 12,
    lineHeight: 16,
    marginBottom: qsSpacing.sm,
  },
  retryRow: {
    marginTop: qsSpacing.sm,
  },
});
