import { useEffect, useRef } from "react";

import { Animated, Dimensions, Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { qsColors, qsRadius, qsSpacing } from "@/src/theme/tokens";

const MENU_ITEMS = [
  { id: "rewards", label: "Rewards" },
  { id: "deposit", label: "Deposit" },
  { id: "transfer", label: "Transfer" },
];

type OverflowMenuProps = {
  visible: boolean;
  onClose: () => void;
  onSignOut: () => void;
  onAuthenticate: () => void;
  onOpenWalletModal: () => void;
  isAuthenticated: boolean;
  isWalletConnected: boolean;
  walletAddress?: string;
};

function formatAddress(address?: string): string {
  if (!address) {
    return "--";
  }
  if (address.length <= 10) {
    return address;
  }
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export function OverflowMenu({
  visible,
  onClose,
  onSignOut,
  onAuthenticate,
  onOpenWalletModal,
  isAuthenticated,
  isWalletConnected,
  walletAddress,
}: OverflowMenuProps) {
  const screenWidth = Dimensions.get("window").width;
  const drawerWidth = Math.min(screenWidth * 0.82, 360);
  const translateX = useRef(new Animated.Value(drawerWidth)).current;
  const isClosingRef = useRef(false);
  const pendingActionRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!visible) {
      return;
    }

    translateX.setValue(drawerWidth);
    Animated.timing(translateX, {
      toValue: 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [drawerWidth, translateX, visible]);

  const handleClose = () => {
    if (isClosingRef.current) {
      return;
    }
    isClosingRef.current = true;
    Animated.timing(translateX, {
      toValue: drawerWidth,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      isClosingRef.current = false;
      onClose();
      if (pendingActionRef.current) {
        const action = pendingActionRef.current;
        pendingActionRef.current = null;
        action();
      }
    });
  };

  if (!visible) {
    return null;
  }

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropTouch} onPress={handleClose} />
        <Animated.View
          style={[
            styles.drawer,
            {
              width: drawerWidth,
              transform: [{ translateX }],
            },
          ]}
        >
          <Text style={styles.title}>Quickscope</Text>
          <View style={styles.sessionCard}>
            <View>
              <Text style={styles.sessionLabel}>Wallet session</Text>
              <Text style={styles.sessionValue}>
                {isAuthenticated ? `Connected • ${formatAddress(walletAddress)}` : "Not connected"}
              </Text>
            </View>
            <Pressable
              style={[styles.sessionButton, isAuthenticated && styles.sessionButtonOutline]}
              onPress={() => {
                pendingActionRef.current = isWalletConnected
                  ? onAuthenticate
                  : onOpenWalletModal;
                handleClose();
              }}
            >
              <Text style={styles.sessionButtonText}>
                {isAuthenticated ? "Re-auth" : "Connect wallet"}
              </Text>
            </Pressable>
          </View>
          <View style={styles.section}>
            {MENU_ITEMS.map((item) => (
              <Pressable key={item.id} style={styles.menuItem} onPress={handleClose}>
                <Text style={styles.menuText}>{item.label}</Text>
                <Text style={styles.menuMeta}>Coming soon</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.divider} />
          <Pressable style={styles.signOutButton} onPress={onSignOut}>
            <Text style={styles.signOutText}>Sign out</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(5, 9, 20, 0.55)",
    flexDirection: "row",
  },
  backdropTouch: {
    flex: 1,
  },
  drawer: {
    width: "82%",
    maxWidth: 360,
    minWidth: 280,
    height: "100%",
    backgroundColor: qsColors.bgCard,
    borderLeftWidth: 1,
    borderLeftColor: qsColors.borderDefault,
    paddingTop: 56,
    paddingHorizontal: qsSpacing.md,
    paddingBottom: qsSpacing.lg,
    gap: qsSpacing.md,
  },
  title: {
    color: qsColors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
  section: {
    gap: qsSpacing.sm,
  },
  sessionCard: {
    backgroundColor: qsColors.bgCardSoft,
    borderRadius: qsRadius.md,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    padding: qsSpacing.sm,
    gap: qsSpacing.sm,
  },
  sessionLabel: {
    color: qsColors.textSubtle,
    fontSize: 11,
  },
  sessionValue: {
    color: qsColors.textPrimary,
    fontSize: 13,
    fontWeight: "600",
  },
  sessionButton: {
    borderRadius: qsRadius.md,
    backgroundColor: qsColors.accent,
    paddingVertical: qsSpacing.xs,
    paddingHorizontal: qsSpacing.sm,
    alignSelf: "flex-start",
  },
  sessionButtonOutline: {
    backgroundColor: qsColors.bgCard,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
  },
  sessionButtonText: {
    color: qsColors.textPrimary,
    fontSize: 12,
    fontWeight: "700",
  },
  menuItem: {
    backgroundColor: qsColors.bgCardSoft,
    borderRadius: qsRadius.md,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    padding: qsSpacing.sm,
    gap: 4,
  },
  menuText: {
    color: qsColors.textPrimary,
    fontSize: 13,
    fontWeight: "600",
  },
  menuMeta: {
    color: qsColors.textSubtle,
    fontSize: 11,
  },
  divider: {
    height: 1,
    backgroundColor: qsColors.borderDefault,
  },
  signOutButton: {
    borderRadius: qsRadius.md,
    borderWidth: 1,
    borderColor: qsColors.danger,
    padding: qsSpacing.sm,
    alignItems: "center",
    marginTop: "auto",
  },
  signOutText: {
    color: qsColors.danger,
    fontSize: 13,
    fontWeight: "700",
  },
});
