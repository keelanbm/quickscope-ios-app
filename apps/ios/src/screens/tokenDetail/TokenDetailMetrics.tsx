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
  holdersCount?: number;
};

export function TokenDetailMetrics({
  oneHourVolumeUsd,
  oneHourTxCount,
  scanMentionsOneHour,
  holdersCount,
}: TokenDetailMetricsProps) {
  return (
    <View style={styles.row}>
      <MetricBadge label="Vol 1h" value={formatCompactUsd(oneHourVolumeUsd)} size="sm" />
      <MetricBadge
        label="TX 1h"
        value={oneHourTxCount?.toLocaleString() || "n/a"}
        size="sm"
      />
      <MetricBadge
        label="Scans 1h"
        value={typeof scanMentionsOneHour === "number" ? scanMentionsOneHour.toLocaleString() : "n/a"}
        size="sm"
      />
      <MetricBadge
        label="Holders"
        value={typeof holdersCount === "number" ? holdersCount.toLocaleString() : "n/a"}
        size="sm"
      />
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
