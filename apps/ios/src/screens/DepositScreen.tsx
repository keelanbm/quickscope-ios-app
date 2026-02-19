import { useCallback } from "react";

import * as Clipboard from "expo-clipboard";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useAuthSession } from "@/src/features/auth/AuthSessionProvider";
import { haptics } from "@/src/lib/haptics";
import { toast } from "@/src/lib/toast";
import { qsColors, qsRadius, qsSpacing, qsTypography } from "@/src/theme/tokens";
import { Copy, SolanaIcon } from "@/src/ui/icons";

/**
 * Simple "Receive SOL" screen.
 *
 * Shows the connected wallet address prominently with a copy button.
 * QR code generation would require an extra dependency (react-native-qrcode-svg)
 * which isn't installed yet — we render a styled address block instead and
 * can bolt on a QR graphic later without layout changes.
 */
export function DepositScreen() {
  const { walletAddress } = useAuthSession();

  const handleCopyAddress = useCallback(async () => {
    if (!walletAddress) return;
    await Clipboard.setStringAsync(walletAddress);
    haptics.success();
    toast.success("Copied", "Wallet address copied to clipboard.");
  }, [walletAddress]);

  if (!walletAddress) {
    return (
      <View style={styles.page}>
        <View style={styles.centeredWrap}>
          <Text style={styles.emptyTitle}>No wallet connected</Text>
          <Text style={styles.emptyBody}>Connect your wallet to view your deposit address.</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content} bounces={false}>
      {/* ── Header ── */}
      <View style={styles.headerSection}>
        <View style={styles.iconCircle}>
          <SolanaIcon size={32} />
        </View>
        <Text style={styles.title}>Receive SOL</Text>
        <Text style={styles.subtitle}>
          Send SOL to this address from any Solana wallet or exchange.
        </Text>
      </View>

      {/* ── Address card (QR placeholder + address) ── */}
      <View style={styles.addressCard}>
        {/* QR placeholder area */}
        <View style={styles.qrPlaceholder}>
          <View style={styles.qrInner}>
            <SolanaIcon size={40} />
          </View>
          <Text style={styles.qrHint}>QR code coming soon</Text>
        </View>

        {/* Full address */}
        <View style={styles.addressBox}>
          <Text selectable style={styles.addressText}>
            {walletAddress}
          </Text>
        </View>

        {/* Copy button */}
        <Pressable
          onPress={handleCopyAddress}
          style={({ pressed }) => [
            styles.copyButton,
            pressed && styles.copyButtonPressed,
          ]}
        >
          <Copy size={18} color={qsColors.textPrimary} />
          <Text style={styles.copyButtonText}>Copy Address</Text>
        </Pressable>
      </View>

      {/* ── Info section ── */}
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <View style={styles.infoDot} />
          <Text style={styles.infoText}>Only send SOL or SPL tokens to this address.</Text>
        </View>
        <View style={styles.infoRow}>
          <View style={styles.infoDot} />
          <Text style={styles.infoText}>
            Sending other cryptocurrencies may result in permanent loss.
          </Text>
        </View>
        <View style={styles.infoRow}>
          <View style={styles.infoDot} />
          <Text style={styles.infoText}>
            Deposits typically confirm in under 1 minute.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: qsColors.layer0,
  },
  content: {
    paddingTop: qsSpacing.xl,
    paddingBottom: 140,
    gap: qsSpacing.xl,
    paddingHorizontal: qsSpacing.lg,
  },

  // ── Centered empty state ──
  centeredWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: qsSpacing.xl,
    gap: 6,
  },
  emptyTitle: {
    color: qsColors.textPrimary,
    fontSize: 17,
    fontWeight: qsTypography.weight.semi,
  },
  emptyBody: {
    color: qsColors.textMuted,
    fontSize: 14,
    textAlign: "center",
  },

  // ── Header section ──
  headerSection: {
    alignItems: "center",
    gap: qsSpacing.sm,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: qsColors.layer1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: qsSpacing.xs,
  },
  title: {
    color: qsColors.textPrimary,
    fontSize: 24,
    fontWeight: qsTypography.weight.bold,
  },
  subtitle: {
    color: qsColors.textTertiary,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 280,
  },

  // ── Address card ──
  addressCard: {
    borderRadius: qsRadius.lg,
    backgroundColor: qsColors.layer1,
    padding: qsSpacing.xl,
    gap: qsSpacing.lg,
    alignItems: "center",
  },

  // QR placeholder
  qrPlaceholder: {
    alignItems: "center",
    gap: qsSpacing.sm,
  },
  qrInner: {
    width: 160,
    height: 160,
    borderRadius: qsRadius.lg,
    backgroundColor: qsColors.layer2,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    alignItems: "center",
    justifyContent: "center",
  },
  qrHint: {
    color: qsColors.textSubtle,
    fontSize: 11,
    fontWeight: qsTypography.weight.medium,
  },

  // Address
  addressBox: {
    backgroundColor: qsColors.layer2,
    borderRadius: qsRadius.md,
    padding: qsSpacing.md,
    width: "100%",
  },
  addressText: {
    color: qsColors.textPrimary,
    fontSize: 13,
    fontWeight: qsTypography.weight.medium,
    fontVariant: ["tabular-nums"],
    textAlign: "center",
    lineHeight: 20,
  },

  // Copy button
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: qsColors.accent,
    borderRadius: qsRadius.md,
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: "100%",
  },
  copyButtonPressed: {
    backgroundColor: qsColors.accentDeep,
  },
  copyButtonText: {
    color: qsColors.textPrimary,
    fontSize: 15,
    fontWeight: qsTypography.weight.bold,
  },

  // ── Info card ──
  infoCard: {
    borderRadius: qsRadius.lg,
    backgroundColor: qsColors.layer1,
    padding: qsSpacing.lg,
    gap: qsSpacing.md,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: qsSpacing.sm,
  },
  infoDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: qsColors.accent,
    marginTop: 5,
  },
  infoText: {
    color: qsColors.textTertiary,
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
});
