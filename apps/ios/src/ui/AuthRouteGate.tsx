import { PropsWithChildren } from "react";

import { Button, StyleSheet, Text, View } from "react-native";

import { useAuthSession } from "@/src/features/auth/AuthSessionProvider";
import { useWalletConnect } from "@/src/features/wallet/WalletConnectProvider";
import { qsColors, qsSpacing } from "@/src/theme/tokens";
import { SectionCard } from "@/src/ui/SectionCard";

type AuthRouteGateProps = PropsWithChildren<{
  featureName: string;
  subtitle: string;
}>;

export function AuthRouteGate({
  featureName,
  subtitle,
  children,
}: AuthRouteGateProps) {
  const { hasValidAccessToken } = useAuthSession();
  const { open } = useWalletConnect();

  if (hasValidAccessToken) {
    return <>{children}</>;
  }

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: qsSpacing.xl,
    backgroundColor: qsColors.bgCanvas,
    justifyContent: "center",
  },
  copy: {
    color: qsColors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
});
