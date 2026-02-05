import { useMemo, useState } from "react";

import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import type { RootStack, TradeEntryRouteParams } from "@/src/navigation/types";
import { qsColors, qsRadius, qsSpacing } from "@/src/theme/tokens";

type TradeEntryScreenProps = {
  params?: TradeEntryRouteParams;
};

export function TradeEntryScreen({ params }: TradeEntryScreenProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStack>>();
  const [amount, setAmount] = useState(params?.amount ?? "");

  const summaryLines = useMemo(() => {
    const lines: string[] = [];
    if (params?.tokenAddress) {
      lines.push(`Token: ${params.tokenAddress}`);
    }
    if (params?.inputMint) {
      lines.push(`Input mint: ${params.inputMint}`);
    }
    if (params?.outputMint) {
      lines.push(`Output mint: ${params.outputMint}`);
    }
    if (!lines.length) {
      lines.push("No token selected yet.");
    }
    return lines;
  }, [params?.inputMint, params?.outputMint, params?.tokenAddress]);

  return (
    <View style={styles.page}>
      <Text style={styles.title}>Trade</Text>
      <Text style={styles.subtitle}>
        Trade execution flow is being finalized. Token context and amount capture are ready.
      </Text>

      <View style={styles.contextCard}>
        {summaryLines.map((line) => (
          <Text key={line} style={styles.contextText}>
            {line}
          </Text>
        ))}
      </View>

      <View style={styles.amountBlock}>
        <Text style={styles.label}>Amount</Text>
        <TextInput
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholder="0.0"
          placeholderTextColor={qsColors.textSubtle}
          style={styles.amountInput}
        />
      </View>

      <View style={styles.actions}>
        <Pressable
          style={styles.primaryButton}
          onPress={() =>
            Alert.alert(
              "Quote coming next",
              "Quote preview is the next step. This screen now owns trade intent and context."
            )
          }
        >
          <Text style={styles.primaryButtonText}>Get Quote (Next)</Text>
        </Pressable>
        <Pressable
          style={styles.secondaryButton}
          onPress={() => navigation.navigate("MainTabs", { screen: "Trade" })}
        >
          <Text style={styles.secondaryButtonText}>Open Search</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: qsColors.bgCanvas,
    padding: qsSpacing.xl,
    gap: qsSpacing.md,
  },
  title: {
    color: qsColors.textPrimary,
    fontSize: 28,
    fontWeight: "700",
  },
  subtitle: {
    color: qsColors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  contextCard: {
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    borderRadius: qsRadius.md,
    backgroundColor: qsColors.bgCardSoft,
    padding: qsSpacing.md,
    gap: 6,
  },
  contextText: {
    color: qsColors.textSecondary,
    fontSize: 12,
  },
  amountBlock: {
    gap: 6,
  },
  label: {
    color: qsColors.textSubtle,
    fontSize: 12,
  },
  amountInput: {
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    borderRadius: qsRadius.md,
    backgroundColor: qsColors.bgCard,
    color: qsColors.textPrimary,
    fontSize: 16,
    paddingHorizontal: qsSpacing.md,
    paddingVertical: 10,
  },
  actions: {
    marginTop: "auto",
    gap: qsSpacing.sm,
  },
  primaryButton: {
    borderRadius: qsRadius.md,
    backgroundColor: qsColors.accent,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#061326",
    fontSize: 14,
    fontWeight: "700",
  },
  secondaryButton: {
    borderRadius: qsRadius.md,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    backgroundColor: qsColors.bgCard,
    paddingVertical: 10,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: qsColors.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
});
