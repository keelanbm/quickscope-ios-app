/**
 * OrdersTab — trigger orders list with All/This Token toggle.
 *
 * Features:
 * - All Orders / This Token toggle pills
 * - 10-second polling for order updates
 * - Optimistic cancel with refetch
 * - Empty state when no orders
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { qsColors, qsRadius, qsSpacing, qsTypography } from "@/src/theme/tokens";
import { haptics } from "@/src/lib/haptics";
import { EmptyState } from "@/src/ui/EmptyState";
import { OrderRow } from "@/src/ui/OrderRow";
import { Clock } from "@/src/ui/icons";
import type { RpcClient } from "@/src/lib/api/rpcClient";
import {
  getTriggerOrders,
  cancelTriggerOrder,
  type TriggerOrder,
} from "@/src/features/trade/triggerOrderService";

type OrdersFilter = "all" | "token";

type OrdersTabProps = {
  rpcClient: RpcClient;
  walletAddress: string;
  /** Current token mint — used for "This Token" filter */
  tokenAddress: string;
  /** Resolve token symbol from mint (optional) */
  getTokenSymbol?: (mint: string) => string | undefined;
  /** Resolve token image URI from mint (optional) */
  getTokenImageUri?: (mint: string) => string | undefined;
};

const POLL_INTERVAL_MS = 10_000;

export function OrdersTab({
  rpcClient,
  walletAddress,
  tokenAddress,
  getTokenSymbol,
  getTokenImageUri,
}: OrdersTabProps) {
  const [filter, setFilter] = useState<OrdersFilter>("token");
  const [orders, setOrders] = useState<TriggerOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingIds, setCancellingIds] = useState<Set<string>>(new Set());
  const mountedRef = useRef(true);

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    if (!walletAddress) return;

    try {
      const result = await getTriggerOrders(rpcClient, {
        walletAddress,
        ...(filter === "token" ? { mint: tokenAddress } : {}),
      });

      if (mountedRef.current) {
        setOrders(result);
        setError(null);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : "Failed to load orders");
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [rpcClient, walletAddress, tokenAddress, filter]);

  // Initial load + polling
  useEffect(() => {
    mountedRef.current = true;
    setIsLoading(true);
    void fetchOrders();

    const interval = setInterval(() => {
      void fetchOrders();
    }, POLL_INTERVAL_MS);

    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [fetchOrders]);

  // Handle cancel
  const handleCancel = useCallback(
    async (orderId: string) => {
      // Optimistic removal
      setCancellingIds((prev) => new Set(prev).add(orderId));
      setOrders((prev) => prev.filter((o) => o.uuid !== orderId));

      try {
        await cancelTriggerOrder(rpcClient, orderId);
        // Refetch to get updated state
        void fetchOrders();
      } catch {
        // Revert optimistic removal on failure — refetch will restore
        void fetchOrders();
      } finally {
        setCancellingIds((prev) => {
          const next = new Set(prev);
          next.delete(orderId);
          return next;
        });
      }
    },
    [rpcClient, fetchOrders]
  );

  // Handle filter change
  const handleFilterChange = useCallback((newFilter: OrdersFilter) => {
    haptics.selection();
    setFilter(newFilter);
    setIsLoading(true);
  }, []);

  if (isLoading && orders.length === 0) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="small" color={qsColors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      {/* Filter toggle */}
      <View style={styles.filterRow}>
        {(["all", "token"] as const).map((f) => {
          const isActive = filter === f;
          return (
            <Pressable
              key={f}
              onPress={() => handleFilterChange(f)}
              style={[styles.filterPill, isActive && styles.filterPillActive]}
            >
              <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                {f === "all" ? "All Orders" : "This Token"}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Error */}
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      {/* Order list */}
      {orders.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No orders yet"
          subtitle="Create a limit order from the trade panel."
        />
      ) : (
        orders.map((order) => (
          <OrderRow
            key={order.uuid}
            order={order}
            tokenSymbol={getTokenSymbol?.(order.mint)}
            tokenImageUri={getTokenImageUri?.(order.mint)}
            onCancel={handleCancel}
            isCancelling={cancellingIds.has(order.uuid)}
          />
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: qsSpacing.sm,
  },
  loadingWrap: {
    paddingVertical: qsSpacing.xxxl,
    alignItems: "center",
  },
  filterRow: {
    flexDirection: "row",
    gap: qsSpacing.sm,
    paddingHorizontal: qsSpacing.lg,
    marginBottom: qsSpacing.md,
  },
  filterPill: {
    paddingHorizontal: qsSpacing.md,
    paddingVertical: qsSpacing.xs,
    borderRadius: qsRadius.pill,
    borderWidth: 1,
    borderColor: qsColors.borderDefault,
    backgroundColor: qsColors.layer2,
  },
  filterPillActive: {
    borderColor: qsColors.accent,
    backgroundColor: "rgba(119, 102, 247, 0.12)",
  },
  filterText: {
    fontSize: 13,
    fontWeight: qsTypography.weight.semi,
    color: qsColors.textTertiary,
  },
  filterTextActive: {
    color: qsColors.textPrimary,
  },
  errorText: {
    fontSize: 12,
    color: qsColors.sellRed,
    paddingHorizontal: qsSpacing.lg,
    marginBottom: qsSpacing.sm,
  },
});
