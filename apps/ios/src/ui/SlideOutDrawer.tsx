import { useCallback, useEffect, useRef } from "react";

import { useDisconnect, useModal } from "@phantom/react-native-sdk";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useAuthSession } from "@/src/features/auth/AuthSessionProvider";
import type { RootStack } from "@/src/navigation/types";
import { qsColors, qsRadius, qsSpacing, qsTypography } from "@/src/theme/tokens";
import { LogOut, Gift, X, Wallet, ArrowUpDown, User } from "@/src/ui/icons";

const DRAWER_WIDTH = Dimensions.get("window").width * 0.8;
const ANIMATION_DURATION = 250;

type MenuItem = {
  icon: React.ReactNode;
  label: string;
  subtitle?: string;
  onPress: () => void;
  destructive?: boolean;
};

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function SlideOutDrawer({ visible, onClose }: Props) {
  const { walletAddress, clearSession } = useAuthSession();
  const { disconnect } = useDisconnect();
  const { open: openConnectModal } = useModal();
  const navigation = useNavigation<NativeStackNavigationProp<RootStack>>();
  const translateX = useRef(new Animated.Value(DRAWER_WIDTH)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: DRAWER_WIDTH,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, translateX, backdropOpacity]);

  const handleClose = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: DRAWER_WIDTH,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  }, [onClose, translateX, backdropOpacity]);

  const handleSignOut = useCallback(() => {
    handleClose();
    setTimeout(async () => {
      await clearSession();
      await disconnect();
    }, 300);
  }, [clearSession, disconnect, handleClose]);

  const handleConnect = useCallback(() => {
    handleClose();
    setTimeout(() => {
      openConnectModal();
    }, 300);
  }, [handleClose, openConnectModal]);

  const navigateTo = useCallback(
    (screen: keyof RootStack) => {
      handleClose();
      setTimeout(() => {
        navigation.navigate(screen as any);
      }, 300);
    },
    [handleClose, navigation]
  );

  const menuItems: MenuItem[] = [
    {
      icon: <Gift size={20} color={qsColors.textSecondary} />,
      label: "Rewards",
      subtitle: "Earnings, cashback & referrals",
      onPress: () => navigateTo("Rewards"),
    },
    {
      icon: <Wallet size={20} color={qsColors.textSecondary} />,
      label: "Deposit",
      subtitle: "Receive SOL to your wallet",
      onPress: () => navigateTo("Deposit"),
    },
    {
      icon: <ArrowUpDown size={20} color={qsColors.textSecondary} />,
      label: "Transfer",
      subtitle: "Coming soon",
      onPress: () => {},
    },
    {
      icon: <User size={20} color={qsColors.textSecondary} />,
      label: "Profile",
      subtitle: "Coming soon",
      onPress: () => {},
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {/* Backdrop */}
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>

        {/* Drawer panel */}
        <Animated.View
          style={[styles.drawer, { transform: [{ translateX }] }]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Quickscope</Text>
            <Pressable
              onPress={handleClose}
              hitSlop={12}
              style={styles.closeButton}
            >
              <X size={20} color={qsColors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            bounces={false}
          >
            {/* Wallet card */}
            {walletAddress ? (
              <View style={styles.walletCard}>
                <View style={styles.walletHeader}>
                  <View style={styles.walletStatusRow}>
                    <View style={styles.connectedDot} />
                    <Text style={styles.connectedText}>Connected</Text>
                  </View>
                </View>
                <Text style={styles.walletAddress} numberOfLines={1}>
                  {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
                </Text>
              </View>
            ) : (
              <View style={styles.walletCard}>
                <Text style={styles.disconnectedText}>No wallet connected</Text>
                <Pressable
                  style={({ pressed }) => [
                    styles.connectButton,
                    pressed && styles.connectButtonPressed,
                  ]}
                  onPress={handleConnect}
                >
                  <Wallet size={16} color={qsColors.textPrimary} />
                  <Text style={styles.connectButtonText}>Connect wallet</Text>
                </Pressable>
              </View>
            )}

            {/* Menu items */}
            <View style={styles.menuList}>
              {menuItems.map((item) => (
                <Pressable
                  key={item.label}
                  style={({ pressed }) => [
                    styles.menuRow,
                    pressed && styles.menuRowPressed,
                  ]}
                  onPress={item.onPress}
                >
                  {item.icon}
                  <View style={styles.menuTextCol}>
                    <Text style={styles.menuLabel}>{item.label}</Text>
                    {item.subtitle ? (
                      <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                    ) : null}
                  </View>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          {/* Sign out pinned at bottom */}
          {walletAddress ? (
            <Pressable
              style={({ pressed }) => [
                styles.signOutRow,
                pressed && styles.menuRowPressed,
              ]}
              onPress={handleSignOut}
            >
              <LogOut size={20} color={qsColors.sellRed} />
              <Text style={styles.signOutLabel}>Sign out</Text>
            </Pressable>
          ) : null}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  drawer: {
    width: DRAWER_WIDTH,
    backgroundColor: qsColors.layer0,
    borderLeftWidth: 1,
    borderLeftColor: qsColors.layer2,
    flex: 1,
    paddingTop: 60,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: qsSpacing.lg,
    paddingBottom: qsSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: qsColors.borderDefault,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: qsTypography.weight.bold,
    color: qsColors.textPrimary,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: qsRadius.sm,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: qsSpacing.lg,
    gap: qsSpacing.lg,
  },
  walletCard: {
    backgroundColor: qsColors.layer1,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    borderRadius: qsRadius.lg,
    padding: qsSpacing.md,
    gap: 6,
  },
  walletHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  walletStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  connectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: qsColors.buyGreen,
  },
  connectedText: {
    fontSize: 12,
    color: qsColors.buyGreen,
    fontWeight: qsTypography.weight.semi,
  },
  walletAddress: {
    fontSize: 14,
    color: qsColors.textPrimary,
    fontWeight: qsTypography.weight.bold,
    fontVariant: ["tabular-nums"],
  },
  disconnectedText: {
    fontSize: 14,
    color: qsColors.textMuted,
    fontWeight: qsTypography.weight.medium,
  },
  connectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
    paddingVertical: 10,
    borderRadius: qsRadius.md,
    backgroundColor: qsColors.accent,
  },
  connectButtonPressed: {
    backgroundColor: qsColors.accentDeep,
  },
  connectButtonText: {
    fontSize: 14,
    color: qsColors.textPrimary,
    fontWeight: qsTypography.weight.semi,
  },
  menuList: {
    gap: 2,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: qsSpacing.md,
    paddingVertical: 14,
    paddingHorizontal: qsSpacing.sm,
    borderRadius: qsRadius.md,
  },
  menuRowPressed: {
    backgroundColor: qsColors.pressedOverlay,
  },
  menuTextCol: {
    flex: 1,
    gap: 1,
  },
  menuLabel: {
    fontSize: 16,
    color: qsColors.textPrimary,
    fontWeight: qsTypography.weight.medium,
  },
  menuSubtitle: {
    fontSize: 12,
    color: qsColors.textMuted,
  },
  signOutRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: qsSpacing.md,
    paddingVertical: 16,
    paddingHorizontal: qsSpacing.lg,
    borderTopWidth: 1,
    borderTopColor: qsColors.borderDefault,
    marginBottom: 34,
  },
  signOutLabel: {
    fontSize: 16,
    color: qsColors.sellRed,
    fontWeight: qsTypography.weight.medium,
  },
});
