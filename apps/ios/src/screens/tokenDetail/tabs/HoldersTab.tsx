/**
 * Holders tab — placeholder for holder data.
 */
import React from "react";
import { StyleSheet, View } from "react-native";

import { qsSpacing } from "@/src/theme/tokens";
import { EmptyState } from "@/src/ui/EmptyState";
import { User } from "@/src/ui/icons";

export function HoldersTab() {
  return (
    <View style={styles.container}>
      <EmptyState
        icon={User}
        title="Token holders"
        subtitle="Holder data for this token will be available soon."
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
