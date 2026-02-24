import React, { useEffect, useRef } from "react";

import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

import { qsColors, qsRadius, qsShadows, qsSpacing, qsTypography } from "@/src/theme/tokens";
import { MessageCircle, Star, Wallet } from "@/src/ui/icons";
import { haptics } from "@/src/lib/haptics";

export type TrackingTabId = "wallets" | "tokens" | "chats";

type TabDef = {
  id: TrackingTabId;
  label: string;
  icon: React.ComponentType<{ size: number; color: string }>;
};

const TABS: TabDef[] = [
  { id: "wallets", label: "Wallets", icon: Wallet },
  { id: "tokens", label: "Tokens", icon: Star },
  { id: "chats", label: "Chats", icon: MessageCircle },
];

type TrackingFloatingNavProps = {
  activeTab: TrackingTabId;
  onTabChange: (tab: TrackingTabId) => void;
  expanded: boolean;
  onToggle: () => void;
};

export function TrackingFloatingNav({
  activeTab,
  onTabChange,
  expanded,
  onToggle,
}: TrackingFloatingNavProps) {
  const expandAnim = useRef(new Animated.Value(expanded ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(expandAnim, {
      toValue: expanded ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [expanded, expandAnim]);

  const activeTabDef = TABS.find((t) => t.id === activeTab) ?? TABS[0];

  const handleTabPress = (tab: TrackingTabId) => {
    if (tab === activeTab) {
      // Tapping active tab collapses
      onToggle();
      return;
    }
    haptics.selection();
    onTabChange(tab);
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      {expanded ? (
        /* ── Expanded: all 3 tabs in a popout ── */
        <View style={styles.expandedRow}>
          {TABS.map((tab) => {
            const active = tab.id === activeTab;
            const Icon = tab.icon;
            return (
              <Pressable
                key={tab.id}
                style={[styles.expandedTab, active && styles.expandedTabActive]}
                onPress={() => handleTabPress(tab.id)}
              >
                <Icon size={14} color={active ? qsColors.textPrimary : qsColors.textTertiary} />
                <Text style={[styles.expandedTabText, active && styles.expandedTabTextActive]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : (
        /* ── Collapsed: icon-only circle ── */
        <Pressable style={styles.collapsedCircle} onPress={onToggle}>
          <activeTabDef.icon size={18} color={qsColors.textPrimary} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 80,
    right: 20,
    alignItems: "flex-end",
  },

  // ── Collapsed: icon-only FAB ──
  collapsedCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(30, 28, 40, 0.85)",
    alignItems: "center",
    justifyContent: "center",
    ...qsShadows.lg,
  },

  // ── Expanded: popout row ──
  expandedRow: {
    flexDirection: "row",
    backgroundColor: "rgba(30, 28, 40, 0.95)",
    borderRadius: qsRadius.pill,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    padding: qsSpacing.xs,
    gap: qsSpacing.xs,
    ...qsShadows.lg,
  },
  expandedTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: qsRadius.pill,
  },
  expandedTabActive: {
    backgroundColor: qsColors.accent,
  },
  expandedTabText: {
    color: qsColors.textTertiary,
    fontSize: 12,
    fontWeight: qsTypography.weight.semi,
  },
  expandedTabTextActive: {
    color: qsColors.textPrimary,
  },
});
