/**
 * Tab bar for wallet detail — Positions, History, Top Trades.
 * Purple underline style matching TokenDetailTabs.
 */
import React, { useCallback } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { qsColors, qsSpacing, qsTypography } from "@/src/theme/tokens";
import { haptics } from "@/src/lib/haptics";

export type WalletDetailTab = "positions" | "history" | "topTrades";

const TABS: { id: WalletDetailTab; label: string }[] = [
  { id: "positions", label: "Positions" },
  { id: "history", label: "History" },
  { id: "topTrades", label: "Top Trades" },
];

type WalletDetailTabsProps = {
  activeTab: WalletDetailTab;
  onTabChange: (tab: WalletDetailTab) => void;
};

export function WalletDetailTabBar({ activeTab, onTabChange }: WalletDetailTabsProps) {
  const handlePress = useCallback(
    (tab: WalletDetailTab) => {
      onTabChange(tab);
      haptics.selection();
    },
    [onTabChange],
  );

  return (
    <View style={styles.tabBar}>
      {TABS.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <Pressable
            key={tab.id}
            onPress={() => handlePress(tab.id)}
            style={[styles.tab, isActive && styles.tabActive]}
          >
            <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    gap: qsSpacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: qsColors.borderDefault,
    paddingBottom: 0,
    paddingHorizontal: qsSpacing.lg,
    marginTop: qsSpacing.md,
  },
  tab: {
    paddingVertical: qsSpacing.sm,
    paddingHorizontal: qsSpacing.xs,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: qsColors.accent,
  },
  tabText: {
    color: qsColors.textTertiary,
    fontSize: 13,
    fontWeight: qsTypography.weight.semi,
  },
  tabTextActive: {
    color: qsColors.textPrimary,
  },
});
