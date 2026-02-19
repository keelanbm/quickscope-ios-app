import { useCallback, useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";

/**
 * Reusable hook for automatic background data refresh.
 *
 * Features:
 * - Configurable interval (ms)
 * - `enabled` flag — tie to `useIsFocused()` so only the active tab polls
 * - In-flight guard — skips tick if previous fetch hasn't returned
 * - AppState listener — pauses when backgrounded, resumes with instant fetch
 * - `resetTimer()` — call after pull-to-refresh to avoid double-fetch
 * - Stable fetchFn ref — avoids re-creating interval on every render
 */
export function useAutoRefresh(
  fetchFn: () => Promise<void>,
  intervalMs: number,
  enabled: boolean,
): { resetTimer: () => void } {
  const fetchFnRef = useRef(fetchFn);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inFlightRef = useRef(false);
  const enabledRef = useRef(enabled);

  // Keep refs current without restarting interval
  fetchFnRef.current = fetchFn;
  enabledRef.current = enabled;

  const tick = useCallback(async () => {
    if (inFlightRef.current || !enabledRef.current) return;
    inFlightRef.current = true;
    try {
      await fetchFnRef.current();
    } catch {
      // Silent — keep existing data on error
    } finally {
      inFlightRef.current = false;
    }
  }, []);

  const startInterval = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => void tick(), intervalMs);
  }, [intervalMs, tick]);

  const stopInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Start / stop based on `enabled`
  useEffect(() => {
    if (enabled) {
      startInterval();
    } else {
      stopInterval();
    }
    return stopInterval;
  }, [enabled, startInterval, stopInterval]);

  // Pause when app backgrounds, resume with instant fetch on foreground
  useEffect(() => {
    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === "active" && enabledRef.current) {
        void tick(); // instant refresh on foreground
        startInterval();
      } else if (nextState.match(/inactive|background/)) {
        stopInterval();
      }
    };

    const subscription = AppState.addEventListener("change", handleAppState);
    return () => subscription.remove();
  }, [startInterval, stopInterval, tick]);

  // Exposed to pull-to-refresh handlers
  const resetTimer = useCallback(() => {
    if (enabledRef.current) {
      startInterval(); // clears old interval + starts fresh
    }
  }, [startInterval]);

  return { resetTimer };
}
