import { StyleSheet, View } from "react-native";

import { EmptyState } from "@/src/ui/EmptyState";
import { Clock } from "@/src/ui/icons";
import { qsColors } from "@/src/theme/tokens";

export function PortfolioOrdersTab() {
  return (
    <View style={styles.container}>
      <EmptyState
        icon={Clock}
        title="No orders"
        subtitle="Your open orders will appear here."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: qsColors.layer0,
    justifyContent: "center",
  },
});
