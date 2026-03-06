/**
 * Tab system below chart — Activity, Traders, Holders, Orders.
 *
 * Purple underline style matching PortfolioScreen pattern.
 * Each tab handles its own data fetching internally.
 */
import React, { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { RpcClient } from "@/src/lib/api/rpcClient";
import { qsColors, qsSpacing, qsTypography } from "@/src/theme/tokens";
import { haptics } from "@/src/lib/haptics";

import { ActivityTab } from "./tabs/ActivityTab";
import { TradersTab } from "./tabs/TradersTab";
import { HoldersTab } from "./tabs/HoldersTab";
import { OrdersTab } from "@/src/ui/OrdersTab";

type TokenDetailTab = "activity" | "traders" | "holders" | "orders";

const TOKEN_TABS: { id: TokenDetailTab; label: string }[] = [
  { id: "activity", label: "Activity" },
  { id: "traders", label: "Traders" },
  { id: "holders", label: "Holders" },
  { id: "orders", label: "Orders" },
];

type TokenDetailTabsProps = {
  rpcClient: RpcClient;
  tokenAddress: string;
  /** Token decimals for formatting raw balances */
  tokenDecimals?: number;
  /** Wallet address — required for Orders tab */
  walletAddress?: string;
  /** Resolve token symbol from mint */
  getTokenSymbol?: (mint: string) => string | undefined;
  /** Resolve token image URI from mint */
  getTokenImageUri?: (mint: string) => string | undefined;
};

export function TokenDetailTabs({
  rpcClient,
  tokenAddress,
  tokenDecimals,
  walletAddress,
  getTokenSymbol,
  getTokenImageUri,
}: TokenDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<TokenDetailTab>("activity");

  const handleTabPress = useCallback((tab: TokenDetailTab) => {
    setActiveTab(tab);
    haptics.selection();
  }, []);

  return (
    <View style={styles.wrap}>
      {/* Tab bar */}
      <View style={styles.tabBar}>
        {TOKEN_TABS.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <Pressable
              key={tab.id}
              onPress={() => handleTabPress(tab.id)}
              style={[styles.tab, isActive && styles.tabActive]}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Tab content — keep mounted to preserve scroll position */}
      <View style={activeTab === "activity" ? undefined : styles.hidden}>
        <ActivityTab rpcClient={rpcClient} tokenAddress={tokenAddress} />
      </View>
      <View style={activeTab === "traders" ? undefined : styles.hidden}>
        <TradersTab rpcClient={rpcClient} tokenAddress={tokenAddress} />
      </View>
      <View style={activeTab === "holders" ? undefined : styles.hidden}>
        <HoldersTab rpcClient={rpcClient} tokenAddress={tokenAddress} tokenDecimals={tokenDecimals} />
      </View>
      {activeTab === "orders" && walletAddress && (
        <OrdersTab
          rpcClient={rpcClient}
          walletAddress={walletAddress}
          tokenAddress={tokenAddress}
          getTokenSymbol={getTokenSymbol}
          getTokenImageUri={getTokenImageUri}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: qsSpacing.xs,
  },
  hidden: {
    display: "none",
  },

  tabBar: {
    flexDirection: "row",
    gap: qsSpacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: qsColors.borderDefault,
    paddingBottom: 0,
    paddingHorizontal: qsSpacing.lg,
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
