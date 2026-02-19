import { useCallback } from "react";

import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { toast } from "@/src/lib/toast";
import { qsColors, qsRadius, qsSpacing, qsTypography } from "@/src/theme/tokens";
import { LogOut, Gift, Settings, HelpCircle, User } from "@/src/ui/icons";
import { useAuthSession } from "@/src/features/auth/AuthSessionProvider";

type MenuItem = {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  destructive?: boolean;
};

export function MoreMenuScreen() {
  const { walletAddress, clearSession } = useAuthSession();

  const handleLogout = useCallback(() => {
    Alert.alert("Sign Out", "Are you sure you want to disconnect your wallet?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () => {
          void clearSession();
        },
      },
    ]);
  }, [clearSession]);

  const menuItems: MenuItem[] = [
    {
      icon: <User size={20} color={qsColors.textSecondary} />,
      label: "Profile",
      onPress: () => toast.info("Profile", "Coming soon"),
    },
    {
      icon: <Gift size={20} color={qsColors.textSecondary} />,
      label: "Rewards",
      onPress: () => toast.info("Rewards", "Coming soon"),
    },
    {
      icon: <Settings size={20} color={qsColors.textSecondary} />,
      label: "Settings",
      onPress: () => toast.info("Settings", "Coming soon"),
    },
    {
      icon: <HelpCircle size={20} color={qsColors.textSecondary} />,
      label: "Help & Support",
      onPress: () => toast.info("Help", "Coming soon"),
    },
    {
      icon: <LogOut size={20} color={qsColors.sellRed} />,
      label: "Sign Out",
      onPress: handleLogout,
      destructive: true,
    },
  ];

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      {walletAddress ? (
        <View style={styles.walletCard}>
          <Text style={styles.walletLabel}>Connected Wallet</Text>
          <Text style={styles.walletAddress} numberOfLines={1}>
            {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
          </Text>
        </View>
      ) : null}

      <View style={styles.menuList}>
        {menuItems.map((item) => (
          <Pressable
            key={item.label}
            style={({ pressed }) => [styles.menuRow, pressed && styles.menuRowPressed]}
            onPress={item.onPress}
          >
            {item.icon}
            <Text style={[styles.menuLabel, item.destructive && styles.menuLabelDestructive]}>
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.versionText}>Quickscope v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: qsColors.layer0,
  },
  content: {
    padding: qsSpacing.xl,
    gap: qsSpacing.xl,
  },
  walletCard: {
    backgroundColor: qsColors.layer1,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    borderRadius: qsRadius.lg,
    padding: qsSpacing.lg,
    gap: 4,
  },
  walletLabel: {
    fontSize: 12,
    color: qsColors.textMuted,
    fontWeight: qsTypography.weight.semi,
  },
  walletAddress: {
    fontSize: 15,
    color: qsColors.textPrimary,
    fontWeight: qsTypography.weight.bold,
    fontVariant: ["tabular-nums"],
  },
  menuList: {
    backgroundColor: qsColors.layer1,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    borderRadius: qsRadius.lg,
    overflow: "hidden",
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: qsSpacing.md,
    paddingVertical: 14,
    paddingHorizontal: qsSpacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: qsColors.borderDefault,
  },
  menuRowPressed: {
    backgroundColor: qsColors.pressedOverlay,
  },
  menuLabel: {
    fontSize: 16,
    color: qsColors.textPrimary,
    fontWeight: qsTypography.weight.medium,
  },
  menuLabelDestructive: {
    color: qsColors.sellRed,
  },
  versionText: {
    fontSize: 12,
    color: qsColors.textSubtle,
    textAlign: "center",
  },
});
