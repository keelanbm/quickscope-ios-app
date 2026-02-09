/**
 * Metric badges row for Token Detail screen.
 *
 * Shows: Vol 1h, TX 1h, Scans 1h
 * (MC and Change are shown in the header, so they're removed here)
 */
import React from "react";
import { StyleSheet, View } from "react-native";

import { qsSpacing } from "@/src/theme/tokens";
import { MetricBadge } from "@/src/ui/MetricBadge";
import { formatCompactUsd } from "./styles";

type TokenDetailMetricsProps = {
  oneHourVolumeUsd: number | undefined;
  oneHourTxCount: number | undefined;
  scanMentionsOneHour?: number;
};

export function TokenDetailMetrics({
  oneHourVolumeUsd,
  oneHourTxCount,
  scanMentionsOneHour,
}: TokenDetailMetricsProps) {
  return (
    <View style={styles.row}>
      <MetricBadge label="Vol 1h" value={formatCompactUsd(oneHourVolumeUsd)} />
      <MetricBadge
        label="TX 1h"
        value={oneHourTxCount?.toLocaleString() || "n/a"}
      />
      {typeof scanMentionsOneHour === "number" && (
        <MetricBadge
          label="Scans 1h"
          value={scanMentionsOneHour.toLocaleString()}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: qsSpacing.sm,
    paddingHorizontal: qsSpacing.lg,
    marginBottom: qsSpacing.lg,
  },
});
