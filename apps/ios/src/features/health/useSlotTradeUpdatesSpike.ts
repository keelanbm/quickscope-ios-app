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

function nowAsClockText(): string {
  const now = new Date();
  return now.toLocaleTimeString();
}

function parsePayloadPreview(value: unknown): string | undefined {
  try {
    return JSON.stringify(value).slice(0, 220);
  } catch {
    return undefined;
  }
}

export function useSlotTradeUpdatesSpike(wsHost: string) {
  const socketRef = useRef<WebSocket | null>(null);
  const manualCloseRef = useRef(false);
  const [state, setState] = useState<WsSpikeState>({
    status: "idle",
    eventCount: 0,
  });

  const disconnect = useCallback(() => {
    manualCloseRef.current = true;
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
  }, []);

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

      if (parsed.id === subscriptionRequestId && parsed.result) {
        setState((prev) => ({
          ...prev,
          status: "subscribed",
          subscriptionId: parsed.result,
        }));
        return;
      }

      if (parsed.method !== `${subscriptionMethod}_subscription`) {
        return;
      }

      const update = parsed.params?.result;
      const nextSolPrice = update?.sol_price_usd ? Number(update.sol_price_usd) : undefined;

      setState((prev) => ({
        ...prev,
        status: "subscribed",
        eventCount: prev.eventCount + 1,
        lastSolPrice:
          typeof nextSolPrice === "number" && Number.isFinite(nextSolPrice)
            ? nextSolPrice
            : prev.lastSolPrice,
        lastEventAt: nowAsClockText(),
        lastPayloadPreview: parsePayloadPreview(update),
      }));
    });

    socket.addEventListener("close", () => {
      if (!manualCloseRef.current) {
        setState((prev) => ({
          ...prev,
          status: "closed",
          subscriptionId: undefined,
        }));
      }
    });

    socket.addEventListener("error", () => {
      setState((prev) => ({
        ...prev,
        status: "error",
        errorText: "WebSocket transport error",
      }));
    });
  }, [wsHost]);

  useEffect(() => {
    return () => {
      manualCloseRef.current = true;
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  return {
    state,
    connect,
    disconnect,
  };
}
