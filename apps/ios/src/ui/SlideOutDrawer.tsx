import { useCallback, useEffect, useRef, useState } from "react";

import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  ActivityIndicator,
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
import {
  type UserWalletInfo,
  fetchActiveWallets,
  fetchWalletSolBalances,
  selectWallets,
  unselectWallets,
  truncateAddress,
} from "@/src/features/account/walletService";
import { useWalletCompat } from "@/src/features/wallet/useWalletCompat";
import { haptics } from "@/src/lib/haptics";
import type { RpcClient } from "@/src/lib/api/rpcClient";
import type { RootStack } from "@/src/navigation/types";
import { qsColors, qsRadius, qsSpacing, qsTypography } from "@/src/theme/tokens";
import { LogOut, Gift, X, Wallet, ArrowUpDown, User, Settings, ChevronDown, ChevronUp, Check } from "@/src/ui/icons";

const DRAWER_WIDTH = Dimensions.get("window").width * 0.8;
const ANIMATION_DURATION = 250;

type MenuItem = {
  icon: React.ReactNode;
  label: string;
  subtitle?: string;
  onPress: () => void;
  destructive?: boolean;
};

type WalletWithBalance = UserWalletInfo & { solBalance?: number };

type Props = {
  visible: boolean;
  onClose: () => void;
  rpcClient: RpcClient;
};

export function SlideOutDrawer({ visible, onClose, rpcClient }: Props) {
  const { walletAddress, clearSession, hasValidAccessToken } = useAuthSession();
  const { disconnect, login, connectPhantom } = useWalletCompat();
  const navigation = useNavigation<NativeStackNavigationProp<RootStack>>();
  const translateX = useRef(new Animated.Value(DRAWER_WIDTH)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  // ── Wallet selection state ──
  const [walletsExpanded, setWalletsExpanded] = useState(false);
  const [wallets, setWallets] = useState<WalletWithBalance[]>([]);
  const [walletsLoading, setWalletsLoading] = useState(false);
  const [togglingKeys, setTogglingKeys] = useState<Set<string>>(new Set());

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

  // Fetch wallets when drawer opens and user is authenticated
  useEffect(() => {
    if (!visible || !hasValidAccessToken) {
      return;
    }

    let cancelled = false;
    setWalletsLoading(true);

    (async () => {
      try {
        const { wallets: active } = await fetchActiveWallets(rpcClient);
        if (cancelled) return;

        const keys = active.map((w) => w.public_key);
        const balances = await fetchWalletSolBalances(rpcClient, keys);
        if (cancelled) return;

        setWallets(
          active.map((w) => ({ ...w, solBalance: balances[w.public_key] ?? 0 }))
        );
      } catch {
        // Silently fail — wallet card still shows primary address
      } finally {
        if (!cancelled) setWalletsLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [visible, hasValidAccessToken, rpcClient]);

  const handleToggleWallet = useCallback(
    async (wallet: WalletWithBalance) => {
      const key = wallet.public_key;
      if (togglingKeys.has(key)) return;

      haptics.selection();
      setTogglingKeys((prev) => new Set(prev).add(key));

      try {
        if (wallet.selected) {
          await unselectWallets(rpcClient, [key]);
        } else {
          await selectWallets(rpcClient, [key]);
        }

        setWallets((prev) =>
          prev.map((w) =>
            w.public_key === key ? { ...w, selected: !w.selected } : w
          )
        );
      } catch {
        // Toggle failed — state stays as-is
      } finally {
        setTogglingKeys((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }
    },
    [rpcClient, togglingKeys]
  );

  const handleToggleExpand = useCallback(() => {
    haptics.selection();
    setWalletsExpanded((prev) => !prev);
  }, []);

  const selectedCount = wallets.filter((w) => w.selected).length;

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
      login();
    }, 300);
  }, [handleClose, login]);

  const handleConnectPhantom = useCallback(() => {
    handleClose();
    setTimeout(() => {
      connectPhantom();
    }, 300);
  }, [handleClose, connectPhantom]);

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
      subtitle: "Send SOL between wallets",
      onPress: () => navigateTo("Transfer"),
    },
    {
      icon: <Settings size={20} color={qsColors.textSecondary} />,
      label: "Settings",
      subtitle: "Trade presets, display & more",
      onPress: () => navigateTo("Settings"),
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
                {/* Collapsible header */}
                <Pressable
                  style={styles.walletHeader}
                  onPress={wallets.length > 1 ? handleToggleExpand : undefined}
                >
                  <View style={styles.walletHeaderLeft}>
                    <View style={styles.walletStatusRow}>
                      <View style={styles.connectedDot} />
                      <Text style={styles.connectedText}>Connected</Text>
                    </View>
                    <Text style={styles.walletAddress} numberOfLines={1}>
                      {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
                    </Text>
                  </View>
                  {wallets.length > 1 && (
                    <View style={styles.walletExpandHint}>
                      <Text style={styles.walletCountBadge}>
                        {selectedCount}/{wallets.length}
                      </Text>
                      {walletsExpanded ? (
                        <ChevronUp size={16} color={qsColors.textTertiary} />
                      ) : (
                        <ChevronDown size={16} color={qsColors.textTertiary} />
                      )}
                    </View>
                  )}
                </Pressable>

                {/* Expanded wallet list */}
                {walletsExpanded && (
                  <View style={styles.walletList}>
                    {walletsLoading ? (
                      <ActivityIndicator
                        size="small"
                        color={qsColors.accent}
                        style={{ paddingVertical: 12 }}
                      />
                    ) : (
                      wallets.map((w) => {
                        const isToggling = togglingKeys.has(w.public_key);
                        return (
                          <Pressable
                            key={w.public_key}
                            style={({ pressed }) => [
                              styles.walletListRow,
                              pressed && styles.walletListRowPressed,
                            ]}
                            onPress={() => handleToggleWallet(w)}
                            disabled={isToggling}
                          >
                            <View
                              style={[
                                styles.walletCheckbox,
                                w.selected && styles.walletCheckboxActive,
                              ]}
                            >
                              {w.selected && (
                                <Check size={12} color={qsColors.textPrimary} />
                              )}
                            </View>
                            <View style={styles.walletListInfo}>
                              <Text style={styles.walletListName} numberOfLines={1}>
                                {w.name}
                                {w.is_primary ? " (primary)" : ""}
                              </Text>
                              <Text style={styles.walletListKey}>
                                {truncateAddress(w.public_key)}
                              </Text>
                            </View>
                            <Text style={styles.walletListBalance}>
                              {(w.solBalance ?? 0).toFixed(4)} SOL
                            </Text>
                          </Pressable>
                        );
                      })
                    )}
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.walletCard}>
                <Text style={styles.disconnectedText}>No wallet connected</Text>
                <Pressable
                  style={({ pressed }) => [
                    styles.connectButton,
                    pressed && styles.connectButtonPressed,
                  ]}
                  onPress={handleConnectPhantom}
                >
                  <Wallet size={16} color={qsColors.textPrimary} />
                  <Text style={styles.connectButtonText}>Continue with Phantom</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.otherLoginButton,
                    pressed && styles.otherLoginButtonPressed,
                  ]}
                  onPress={handleConnect}
                >
                  <Text style={styles.otherLoginButtonText}>Other Login Options</Text>
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
  walletHeaderLeft: {
    flex: 1,
    gap: 4,
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
  walletExpandHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  walletCountBadge: {
    fontSize: 11,
    color: qsColors.textTertiary,
    fontWeight: qsTypography.weight.semi,
    fontVariant: ["tabular-nums"],
  },
  walletList: {
    marginTop: qsSpacing.sm,
    borderTopWidth: 1,
    borderTopColor: qsColors.borderDefault,
    paddingTop: qsSpacing.sm,
    gap: 2,
  },
  walletListRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: qsSpacing.sm,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: qsRadius.sm,
  },
  walletListRowPressed: {
    backgroundColor: qsColors.pressedOverlay,
  },
  walletCheckbox: {
    width: 20,
    height: 20,
    borderRadius: qsRadius.xs,
    borderWidth: 1.5,
    borderColor: qsColors.layer3,
    alignItems: "center",
    justifyContent: "center",
  },
  walletCheckboxActive: {
    backgroundColor: qsColors.accent,
    borderColor: qsColors.accent,
  },
  walletListInfo: {
    flex: 1,
    gap: 1,
  },
  walletListName: {
    fontSize: 13,
    color: qsColors.textPrimary,
    fontWeight: qsTypography.weight.medium,
  },
  walletListKey: {
    fontSize: 11,
    color: qsColors.textTertiary,
    fontVariant: ["tabular-nums"],
  },
  walletListBalance: {
    fontSize: 12,
    color: qsColors.textSecondary,
    fontWeight: qsTypography.weight.medium,
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
  otherLoginButton: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
    paddingVertical: 10,
    borderRadius: qsRadius.md,
    backgroundColor: qsColors.layer3,
  },
  otherLoginButtonPressed: {
    backgroundColor: qsColors.layer4,
  },
  otherLoginButtonText: {
    fontSize: 14,
    color: qsColors.textSecondary,
    fontWeight: qsTypography.weight.medium,
  },
});
