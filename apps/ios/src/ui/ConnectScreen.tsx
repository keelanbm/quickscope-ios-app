import { useCallback, useState } from "react";

import { Ionicons } from "@expo/vector-icons";
import { useConnect } from "@phantom/react-native-sdk";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { qsColors, qsRadius, qsSpacing } from "@/src/theme/tokens";

type ProviderType = "google" | "apple" | "phantom";

function AuthButton({
  label,
  iconName,
  onPress,
  disabled,
  loading,
}: {
  label: string;
  iconName: React.ComponentProps<typeof Ionicons>["name"];
  onPress: () => void;
  disabled: boolean;
  loading: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.authButton,
        pressed && !disabled && styles.authButtonPressed,
        disabled && styles.authButtonDisabled,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={styles.authButtonLeft}>
        <Ionicons name={iconName} size={20} color={qsColors.textPrimary} />
        <Text style={styles.authButtonLabel}>{label}</Text>
      </View>
      {loading ? (
        <ActivityIndicator size="small" color={qsColors.accent} />
      ) : (
        <Ionicons name="chevron-forward" size={16} color={qsColors.textMuted} />
      )}
    </Pressable>
  );
}

export function ConnectScreen() {
  const { connect, isConnecting } = useConnect();
  const [activeProvider, setActiveProvider] = useState<ProviderType | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isLoading = isConnecting || activeProvider !== null;

  const handleConnect = useCallback(
    async (provider: ProviderType) => {
      try {
        setError(null);
        setActiveProvider(provider);
        await connect({ provider });
      } catch (err) {
        if (provider === "phantom") {
          setError(
            "Phantom app login is not yet available. Please use Google or Apple to sign in."
          );
        } else {
          setError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        setActiveProvider(null);
      }
    },
    [connect]
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Quickscope</Text>
        <Text style={styles.subtitle}>Connect to get started</Text>
      </View>

      <View style={styles.buttonGroup}>
        <AuthButton
          label="Continue with Google"
          iconName="logo-google"
          onPress={() => void handleConnect("google")}
          disabled={isLoading}
          loading={activeProvider === "google"}
        />
        <AuthButton
          label="Continue with Apple"
          iconName="logo-apple"
          onPress={() => void handleConnect("apple")}
          disabled={isLoading}
          loading={activeProvider === "apple"}
        />
        <AuthButton
          label="Continue with Phantom"
          iconName="wallet-outline"
          onPress={() => void handleConnect("phantom")}
          disabled={isLoading}
          loading={activeProvider === "phantom"}
        />
      </View>

      {error ? (
        <Text style={styles.errorText} numberOfLines={4}>
          {error}
        </Text>
      ) : null}

      <Text style={styles.footer}>Powered by Phantom</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: qsColors.layer0,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: qsSpacing.xl,
  },
  header: {
    alignItems: "center",
    marginBottom: qsSpacing.xxxl,
  },
  title: {
    color: qsColors.textPrimary,
    fontSize: 28,
    fontWeight: "700",
    marginBottom: qsSpacing.xs,
  },
  subtitle: {
    color: qsColors.textSecondary,
    fontSize: 15,
  },
  buttonGroup: {
    width: "100%",
    gap: qsSpacing.md,
  },
  authButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: qsColors.layer1,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    borderRadius: qsRadius.md,
    height: 56,
    paddingHorizontal: qsSpacing.lg,
  },
  authButtonPressed: {
    backgroundColor: qsColors.layer2,
  },
  authButtonDisabled: {
    opacity: 0.5,
  },
  authButtonLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: qsSpacing.md,
  },
  authButtonLabel: {
    color: qsColors.textPrimary,
    fontSize: 15,
    fontWeight: "600",
  },
  errorText: {
    color: qsColors.danger,
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
    marginTop: qsSpacing.lg,
    paddingHorizontal: qsSpacing.md,
  },
  footer: {
    color: qsColors.textMuted,
    fontSize: 12,
    marginTop: qsSpacing.xxxl,
  },
});
