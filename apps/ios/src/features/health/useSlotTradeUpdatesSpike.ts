import { useCallback, useEffect, useRef, useState } from "react";

type WsConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "subscribed"
  | "closed"
  | "error";

type SlotTradeUpdatePayload = {
  sol_price_usd?: string | number;
};

type WsMessage = {
  id?: string | number;
  result?: string;
  method?: string;
  params?: {
    result?: SlotTradeUpdatePayload;
    subscription?: string;
  };
  error?: {
    code?: number;
    message?: string;
  };
};

type WsSpikeState = {
  status: WsConnectionStatus;
  subscriptionId?: string;
  eventCount: number;
  lastSolPrice?: number;
  lastEventAt?: string;
  lastPayloadPreview?: string;
  errorText?: string;
};

const subscriptionMethod = "public/slotTradeUpdates";
const subscriptionRequestId = "ios-slot-trade-updates";

/** Throttle interval — flush buffered WS updates at 5hz (200ms) */
const FLUSH_INTERVAL_MS = 200;

export function useSlotTradeUpdatesSpike(wsHost: string) {
  const socketRef = useRef<WebSocket | null>(null);
  const manualCloseRef = useRef(false);
  const [state, setState] = useState<WsSpikeState>({
    status: "idle",
    eventCount: 0,
  });

  // ── Throttle buffer refs ──
  // Accumulate incoming data in refs; flush to state on a 200ms interval.
  const bufferRef = useRef<{
    count: number;
    lastSolPrice?: number;
    lastPayload?: unknown;
  }>({ count: 0 });
  const flushTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startFlushTimer = useCallback(() => {
    if (flushTimerRef.current) return;
    flushTimerRef.current = setInterval(() => {
      const buf = bufferRef.current;
      if (buf.count === 0) return;

      const flushedCount = buf.count;
      const flushedPrice = buf.lastSolPrice;
      const flushedPayload = buf.lastPayload;
      buf.count = 0;

      setState((prev) => ({
        ...prev,
        status: "subscribed",
        eventCount: prev.eventCount + flushedCount,
        lastSolPrice:
          typeof flushedPrice === "number" && Number.isFinite(flushedPrice)
            ? flushedPrice
            : prev.lastSolPrice,
        lastEventAt: new Date().toLocaleTimeString(),
        lastPayloadPreview: flushedPayload
          ? (() => {
              try {
                return JSON.stringify(flushedPayload).slice(0, 220);
              } catch {
                return undefined;
              }
            })()
          : prev.lastPayloadPreview,
      }));
    }, FLUSH_INTERVAL_MS);
  }, []);

  const stopFlushTimer = useCallback(() => {
    if (flushTimerRef.current) {
      clearInterval(flushTimerRef.current);
      flushTimerRef.current = null;
    }
  }, []);

  const disconnect = useCallback(() => {
    manualCloseRef.current = true;
    stopFlushTimer();
    bufferRef.current = { count: 0 };
    const socket = socketRef.current;
    socketRef.current = null;
    if (socket) {
      socket.close();
    }

    setState((prev) => ({
      ...prev,
      status: "idle",
      subscriptionId: undefined,
    }));
  }, [stopFlushTimer]);

  const connect = useCallback(() => {
    const existingSocket = socketRef.current;

    if (
      existingSocket &&
      (existingSocket.readyState === WebSocket.CONNECTING ||
        existingSocket.readyState === WebSocket.OPEN)
    ) {
      return;
    }

    manualCloseRef.current = false;
    bufferRef.current = { count: 0 };
    setState((prev) => ({
      ...prev,
      status: "connecting",
      errorText: undefined,
    }));

    const socket = new WebSocket(`${wsHost}/public`);
    socketRef.current = socket;

    socket.addEventListener("open", () => {
      setState((prev) => ({
        ...prev,
        status: "connected",
        errorText: undefined,
      }));

      socket.send(
        JSON.stringify({
          id: subscriptionRequestId,
          method: `${subscriptionMethod}_subscribe`,
          params: [],
        })
      );
    });

    socket.addEventListener("message", (event) => {
      let parsed: WsMessage;

      try {
        parsed = JSON.parse(String(event.data)) as WsMessage;
      } catch {
        setState((prev) => ({
          ...prev,
          status: "error",
          errorText: "WS payload parse failed",
        }));
        return;
      }

      const wsError = parsed.error;
      if (wsError) {
        setState((prev) => ({
          ...prev,
          status: "error",
          errorText: `WS ${wsError.code ?? "?"}: ${wsError.message ?? "unknown error"}`,
        }));
        return;
      }

      // Subscription confirmation — apply immediately (not throttled)
      if (parsed.id === subscriptionRequestId && parsed.result) {
        setState((prev) => ({
          ...prev,
          status: "subscribed",
          subscriptionId: parsed.result,
        }));
        startFlushTimer();
        return;
      }

      if (parsed.method !== `${subscriptionMethod}_subscription`) {
        return;
      }

      // ── Buffer the update instead of calling setState per message ──
      const update = parsed.params?.result;
      const nextSolPrice = update?.sol_price_usd
        ? Number(update.sol_price_usd)
        : undefined;

      const buf = bufferRef.current;
      buf.count += 1;
      if (typeof nextSolPrice === "number" && Number.isFinite(nextSolPrice)) {
        buf.lastSolPrice = nextSolPrice;
      }
      buf.lastPayload = update;
    });

    socket.addEventListener("close", () => {
      stopFlushTimer();
      if (!manualCloseRef.current) {
        setState((prev) => ({
          ...prev,
          status: "closed",
          subscriptionId: undefined,
        }));
      }
    });

    socket.addEventListener("error", () => {
      stopFlushTimer();
      setState((prev) => ({
        ...prev,
        status: "error",
        errorText: "WebSocket transport error",
      }));
    });
  }, [wsHost, startFlushTimer, stopFlushTimer]);

  useEffect(() => {
    return () => {
      manualCloseRef.current = true;
      stopFlushTimer();
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [stopFlushTimer]);

  return {
    state,
    connect,
    disconnect,
  };
}
