/**
 * Traders tab — placeholder for top traders data.
 */
import React from "react";
import { StyleSheet, View } from "react-native";

import { qsSpacing } from "@/src/theme/tokens";
import { EmptyState } from "@/src/ui/EmptyState";
import { TrendingUp } from "@/src/ui/icons";

export function TradersTab() {
  return (
    <View style={styles.container}>
      <EmptyState
        icon={TrendingUp}
        title="Top traders"
        subtitle="Top trader data for this token will be available soon."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: qsSpacing.lg,
    paddingTop: qsSpacing.xl,
  },
});
