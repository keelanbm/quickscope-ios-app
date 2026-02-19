import { useMemo, useState } from "react";

import {
  useAccounts,
  useDisconnect,
  useModal,
  useSolana,
} from "@phantom/react-native-sdk";
import { Alert, Button, ScrollView, StyleSheet, Text, View } from "react-native";

import { useAuthSession } from "@/src/features/auth/AuthSessionProvider";
import { useWalletConnect } from "@/src/features/wallet/WalletConnectProvider";
import { requestAuthChallenge } from "@/src/features/auth/authService";
import {
  ParityCheckResult,
  runApiParityChecks,
} from "@/src/features/health/apiParityChecks";
import { useSlotTradeUpdatesSpike } from "@/src/features/health/useSlotTradeUpdatesSpike";
import { RpcClient } from "@/src/lib/api/rpcClient";
import { qsColors, qsSpacing } from "@/src/theme/tokens";
import { SectionCard } from "@/src/ui/SectionCard";

const fallbackAddress = "11111111111111111111111111111111";

type SpikeConsoleScreenProps = {
  rpcClient: RpcClient;
  wsHost: string;
};

function connectionTone(status: string): string {
  if (status === "subscribed") {
    return "#35d28e";
  }

  if (status === "connected" || status === "connecting") {
    return "#4ea3ff";
  }

  if (status === "error") {
    return "#ff6b6b";
  }

  return "#a7afcb";
}

export function SpikeConsoleScreen({ rpcClient, wsHost }: SpikeConsoleScreenProps) {
  const { open, isOpened } = useModal();
  const { addresses, isConnected } = useAccounts();
  const { disconnect } = useDisconnect();
  const { solana, isAvailable } = useSolana();
  const {
    status: backendAuthStatus,
    tokens,
    errorText: backendAuthError,
    sessionWalletAddress,
    hasValidAccessToken,
    hasValidRefreshToken,
    refreshSession,
    clearSession,
  } = useAuthSession();
  const { ensureAuthenticated } = useWalletConnect();
  const { state: wsState, connect: connectWs, disconnect: disconnectWs } =
    useSlotTradeUpdatesSpike(wsHost);
  const [challengePreview, setChallengePreview] = useState<string>("");
  const [parityChecks, setParityChecks] = useState<ParityCheckResult[]>([]);
  const [isLoadingParity, setIsLoadingParity] = useState(false);

  const walletAddress = useMemo(() => {
    const solanaAddress = addresses.find(
      (address) => String(address.addressType).toLowerCase() === "solana"
    );

    if (solanaAddress?.address) {
      return solanaAddress.address;
    }

    if (addresses.length > 0 && addresses[0].address) {
      return addresses[0].address;
    }

    return fallbackAddress;
  }, [addresses]);

  const handleChallenge = async () => {
    try {
      const challenge = await requestAuthChallenge(rpcClient, walletAddress);
      setChallengePreview(challenge.slice(0, 180));
      Alert.alert("Challenge fetched", "Auth challenge request succeeded.");
    } catch (error) {
      Alert.alert("Challenge failed", String(error));
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      await clearSession();
      Alert.alert("Disconnected", "Wallet session ended.");
    } catch (error) {
      Alert.alert("Disconnect failed", String(error));
    }
  };

  const handleSignMessage = async () => {
    if (!isConnected || !isAvailable) {
      Alert.alert("Wallet unavailable", "Connect a Solana wallet before signing.");
      return;
    }

    try {
      const { signature } = await solana.signMessage("quickscope-ios-mvp");
      const signaturePreview = Array.from(signature)
        .slice(0, 12)
        .map((value) => value.toString(16).padStart(2, "0"))
        .join("");

      Alert.alert("Message signed", `${signaturePreview}...`);
    } catch (error) {
      Alert.alert("Sign failed", String(error));
    }
  };

  const handleParityChecks = async () => {
    setIsLoadingParity(true);
    try {
      const results = await runApiParityChecks(rpcClient, walletAddress);
      setParityChecks(results);
    } finally {
      setIsLoadingParity(false);
    }
  };

  const handleAuthenticateSession = async () => {
    await ensureAuthenticated();
  };

  const handleRefreshSession = async () => {
    await refreshSession();
  };

  const handleClearSession = async () => {
    await clearSession();
    Alert.alert("Session cleared", "Stored backend session removed.");
  };

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Week 1 Spike Console</Text>
      <Text style={styles.subtitle}>
        Use this screen to validate wallet/auth/API behavior while we build the product shell.
      </Text>

      <SectionCard title="Wallet state" subtitle="Phantom-first integration path">
        <Text style={styles.meta}>Connected: {isConnected ? "yes" : "no"}</Text>
        <Text style={styles.meta}>Modal open: {isOpened ? "yes" : "no"}</Text>
        <Text style={styles.meta}>Address: {walletAddress}</Text>
        {!isConnected ? (
          <Button title="Connect wallet" onPress={open} />
        ) : (
          <>
            <Button title="Manage wallet" onPress={open} />
            <View style={styles.spacer} />
            <Button title="Disconnect" onPress={handleDisconnect} />
          </>
        )}
      </SectionCard>

      <SectionCard title="Auth checks" subtitle="Challenge and signing flow">
        <Button title="Run auth/challenge" onPress={handleChallenge} />
        <View style={styles.spacer} />
        <Button title="Sign test message" onPress={handleSignMessage} />
        {challengePreview ? (
          <Text style={styles.result}>Challenge preview: {challengePreview}...</Text>
        ) : null}
      </SectionCard>

      <SectionCard title="API parity checks" subtitle="public/private/tx baseline">
        <Button
          title={isLoadingParity ? "Running checks..." : "Run parity checks"}
          onPress={handleParityChecks}
          disabled={isLoadingParity}
        />
        {parityChecks.map((item) => (
          <Text key={item.method} style={styles.result}>
            [{item.status.toUpperCase()}] {item.method} - {item.detail}
          </Text>
        ))}
      </SectionCard>

      <SectionCard title="Backend session" subtitle="challenge -> solution -> refresh state">
        <Text style={[styles.meta, { color: connectionTone(backendAuthStatus) }]}>
          Status: {backendAuthStatus}
        </Text>
        <Text style={styles.meta}>
          Access valid: {hasValidAccessToken ? "yes" : "no"} | Refresh valid:{" "}
          {hasValidRefreshToken ? "yes" : "no"}
        </Text>
        {sessionWalletAddress ? (
          <Text style={styles.meta}>Session wallet: {sessionWalletAddress}</Text>
        ) : null}
        {tokens?.subject ? <Text style={styles.meta}>Subject: {tokens.subject}</Text> : null}
        {tokens?.access_token_expiration ? (
          <Text style={styles.meta}>Access exp: {tokens.access_token_expiration}</Text>
        ) : null}
        {tokens?.refresh_token_expiration ? (
          <Text style={styles.meta}>Refresh exp: {tokens.refresh_token_expiration}</Text>
        ) : null}
        {backendAuthError ? <Text style={styles.error}>{backendAuthError}</Text> : null}
        <Button title="Authenticate session" onPress={handleAuthenticateSession} />
        <View style={styles.spacer} />
        <Button title="Refresh session" onPress={handleRefreshSession} />
        <View style={styles.spacer} />
        <Button title="Clear stored session" onPress={handleClearSession} />
      </SectionCard>

      <SectionCard title="Realtime checks" subtitle="slotTradeUpdates subscription">
        <Text style={styles.meta}>Host: {wsHost}/public</Text>
        <Text style={[styles.meta, { color: connectionTone(wsState.status) }]}>
          Status: {wsState.status}
        </Text>
        {wsState.subscriptionId ? (
          <Text style={styles.meta}>Subscription: {wsState.subscriptionId}</Text>
        ) : null}
        <Text style={styles.meta}>Events: {wsState.eventCount}</Text>
        <Text style={styles.meta}>
          Latest SOL: {typeof wsState.lastSolPrice === "number" ? wsState.lastSolPrice : "n/a"}
        </Text>
        <Text style={styles.meta}>Last event: {wsState.lastEventAt ?? "n/a"}</Text>
        {wsState.errorText ? <Text style={styles.error}>{wsState.errorText}</Text> : null}
        {wsState.lastPayloadPreview ? (
          <Text style={styles.result}>Payload: {wsState.lastPayloadPreview}</Text>
        ) : null}
        <Button title="Connect stream" onPress={connectWs} />
        <View style={styles.spacer} />
        <Button title="Disconnect stream" onPress={disconnectWs} />
      </SectionCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: qsColors.bgCanvas,
  },
  content: {
    padding: qsSpacing.xl,
    gap: qsSpacing.lg,
  },
  title: {
    color: qsColors.textPrimary,
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    color: qsColors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  meta: {
    color: qsColors.textSecondary,
    fontSize: 13,
  },
  result: {
    color: qsColors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  error: {
    color: qsColors.danger,
    fontSize: 12,
    lineHeight: 17,
  },
  spacer: {
    height: qsSpacing.xs,
  },
});
