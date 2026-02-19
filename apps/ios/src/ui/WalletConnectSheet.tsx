import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { qsColors, qsRadius, qsSpacing } from "@/src/theme/tokens";

type WalletConnectSheetProps = {
  visible: boolean;
  isBusy?: boolean;
  errorText?: string | null;
  onClose: () => void;
  onEmbedded: () => void;
  onPhantomApp: () => void;
};

export function WalletConnectSheet({
  visible,
  isBusy,
  errorText,
  onClose,
  onEmbedded,
  onPhantomApp,
}: WalletConnectSheetProps) {
  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropTouch} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Login or Sign Up</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>
          <Text style={styles.subtitle}>
            Connect with embedded Phantom or use the Phantom app on your device.
          </Text>
          {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}
          <Pressable
            style={[styles.actionButton, styles.primaryButton]}
            onPress={onEmbedded}
            disabled={isBusy}
          >
            <Text style={styles.actionText}>Continue with Phantom (Google/Apple)</Text>
          </Pressable>
          <Pressable
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={onPhantomApp}
            disabled={isBusy}
          >
            <Text style={styles.actionText}>Connect Phantom App</Text>
          </Pressable>
          <Text style={styles.footerText}>Powered by Phantom</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(8, 12, 24, 0.6)",
    justifyContent: "flex-end",
  },
  backdropTouch: {
    flex: 1,
  },
  sheet: {
    backgroundColor: qsColors.bgCard,
    borderTopLeftRadius: qsRadius.lg,
    borderTopRightRadius: qsRadius.lg,
    paddingHorizontal: qsSpacing.lg,
    paddingTop: qsSpacing.lg,
    paddingBottom: qsSpacing.xl,
    gap: qsSpacing.sm,
    borderTopWidth: 1,
    borderColor: qsColors.borderDefault,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    color: qsColors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
  subtitle: {
    color: qsColors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  closeText: {
    color: qsColors.textSecondary,
    fontSize: 22,
  },
  actionButton: {
    borderRadius: qsRadius.md,
    paddingVertical: qsSpacing.sm,
    paddingHorizontal: qsSpacing.md,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: qsColors.accent,
  },
  secondaryButton: {
    backgroundColor: qsColors.bgCardSoft,
  },
  actionText: {
    color: qsColors.textPrimary,
    fontSize: 13,
    fontWeight: "600",
  },
  footerText: {
    color: qsColors.textSubtle,
    fontSize: 11,
    textAlign: "center",
    marginTop: qsSpacing.sm,
  },
  errorText: {
    color: qsColors.danger,
    fontSize: 12,
  },
});
