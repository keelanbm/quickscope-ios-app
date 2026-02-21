/**
 * OrderRow — single trigger order list item.
 *
 * Layout:
 * [TokenAvatar 36x36] [Symbol]  [OrderType badge]  [Trigger MC]
 *                      [Status pill]  [Expires in Xd]  [Cancel icon]
 */
import React, { useCallback } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { qsColors, qsRadius, qsSpacing, qsTypography } from "@/src/theme/tokens";
import { X } from "@/src/ui/icons";
import { haptics } from "@/src/lib/haptics";
import {
  type TriggerOrder,
  type OrderStatus,
  orderTypeLabel,
  formatExpiresIn,
} from "@/src/features/trade/triggerOrderService";

type OrderRowProps = {
  order: TriggerOrder;
  /** Token symbol for display */
  tokenSymbol?: string;
  /** Token image URI */
  tokenImageUri?: string;
  onCancel?: (orderId: string) => void;
  isCancelling?: boolean;
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  active: qsColors.accent,
  executing: qsColors.warning,
  filled: qsColors.buyGreen,
  cancelled: qsColors.layer3,
  expired: qsColors.layer3,
  failed: qsColors.sellRed,
};

const STATUS_TEXT_COLORS: Record<OrderStatus, string> = {
  active: qsColors.textPrimary,
  executing: qsColors.layer0,
  filled: qsColors.layer0,
  cancelled: qsColors.textTertiary,
  expired: qsColors.textTertiary,
  failed: qsColors.textPrimary,
};

function formatTriggerMC(priceUSD: number, supply?: number): string {
  // If we have a trigger price, show it as MC estimate
  const mc = priceUSD;
  if (mc >= 1_000_000_000) return `$${(mc / 1_000_000_000).toFixed(2)}B`;
  if (mc >= 1_000_000) return `$${(mc / 1_000_000).toFixed(2)}M`;
  if (mc >= 1_000) return `$${(mc / 1_000).toFixed(1)}K`;
  return `$${mc.toFixed(2)}`;
}

export function OrderRow({
  order,
  tokenSymbol,
  tokenImageUri,
  onCancel,
  isCancelling = false,
}: OrderRowProps) {
  const handleCancel = useCallback(() => {
    haptics.light();
    onCancel?.(order.uuid);
  }, [onCancel, order.uuid]);

  const canCancel = order.status === "active" && !isCancelling;
  const statusLabel = order.status.charAt(0).toUpperCase() + order.status.slice(1);

  return (
    <View style={styles.row}>
      {/* Left: Avatar */}
      <Image
        source={tokenImageUri ? { uri: tokenImageUri } : undefined}
        style={styles.avatar}
      />

      {/* Center: Details */}
      <View style={styles.details}>
        {/* Top line: symbol + order type + trigger */}
        <View style={styles.topLine}>
          <Text style={styles.symbol} numberOfLines={1}>
            {tokenSymbol || order.mint.slice(0, 6)}
          </Text>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>{orderTypeLabel(order.orderType)}</Text>
          </View>
          <Text style={styles.triggerMC}>
            {formatTriggerMC(order.triggerPriceUSD)}
          </Text>
        </View>

        {/* Bottom line: status + expiry + cancel */}
        <View style={styles.bottomLine}>
          <View
            style={[
              styles.statusPill,
              { backgroundColor: STATUS_COLORS[order.status] },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: STATUS_TEXT_COLORS[order.status] },
              ]}
            >
              {statusLabel}
            </Text>
          </View>
          <Text style={styles.expiresText}>
            {order.status === "active" ? formatExpiresIn(order.expiresAt) : "—"}
          </Text>

          {canCancel && (
            <Pressable
              onPress={handleCancel}
              hitSlop={8}
              style={({ pressed }) => [
                styles.cancelBtn,
                { opacity: pressed ? 0.5 : 1 },
              ]}
            >
              <X size={14} color={qsColors.textTertiary} />
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: qsSpacing.sm,
    paddingHorizontal: qsSpacing.lg,
    gap: qsSpacing.md,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: qsColors.layer2,
  },
  details: {
    flex: 1,
    gap: 3,
  },

  /* Top line */
  topLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: qsSpacing.sm,
  },
  symbol: {
    fontSize: 14,
    fontWeight: qsTypography.weight.bold,
    color: qsColors.textPrimary,
  },
  typeBadge: {
    backgroundColor: "rgba(119, 102, 247, 0.15)",
    borderRadius: qsRadius.xs,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: qsTypography.weight.semi,
    color: qsColors.accent,
  },
  triggerMC: {
    marginLeft: "auto",
    fontSize: 14,
    fontWeight: qsTypography.weight.semi,
    color: qsColors.textPrimary,
    fontVariant: ["tabular-nums"],
  },

  /* Bottom line */
  bottomLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: qsSpacing.sm,
  },
  statusPill: {
    borderRadius: qsRadius.xs,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  statusText: {
    fontSize: 10,
    fontWeight: qsTypography.weight.semi,
  },
  expiresText: {
    fontSize: 12,
    color: qsColors.textTertiary,
    fontVariant: ["tabular-nums"],
  },
  cancelBtn: {
    marginLeft: "auto",
    padding: 4,
  },
});
