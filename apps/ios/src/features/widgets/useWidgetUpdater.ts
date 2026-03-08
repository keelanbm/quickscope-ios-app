import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";
import type { RpcClient } from "@/src/lib/api/rpcClient";
import { useAuthSession } from "@/src/features/auth/AuthSessionProvider";
import { updateAllWidgets } from "./widgetDataService";

const MIN_UPDATE_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes between updates

/**
 * Hook that updates home screen widgets when:
 * - App comes to foreground
 * - User authenticates (first load with valid session)
 *
 * Throttled to avoid excessive API calls.
 */
export function useWidgetUpdater(rpcClient: RpcClient) {
  const { status, primaryAccountAddress } = useAuthSession();
  const lastUpdateRef = useRef(0);

  const triggerUpdate = () => {
    const now = Date.now();
    if (now - lastUpdateRef.current < MIN_UPDATE_INTERVAL_MS) return;
    if (status !== "authenticated" || !primaryAccountAddress) return;

    lastUpdateRef.current = now;
    updateAllWidgets(rpcClient, primaryAccountAddress);
  };

  // Update on auth ready
  useEffect(() => {
    if (status === "authenticated" && primaryAccountAddress) {
      triggerUpdate();
    }
  }, [status, primaryAccountAddress]);

  // Update on app foreground
  useEffect(() => {
    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === "active") {
        triggerUpdate();
      }
    };

    const subscription = AppState.addEventListener("change", handleAppState);
    return () => subscription.remove();
  }, [status, primaryAccountAddress]);
}
