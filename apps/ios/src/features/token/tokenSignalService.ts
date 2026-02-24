/**
 * tokenSignalService — fetches and maps trade signals for chart overlays.
 *
 * Historical signals come from the activity table (filterAllTransactionsTable)
 * by checking transaction labels. Real-time signals arrive via WebSocket
 * SlotTradeUpdate where the `labels` field is populated.
 */
import type { RpcClient } from "@/src/lib/api/rpcClient";
import type { ChartSignal, SignalType } from "@/src/ui/chart/chartTypes";

/** Raw transaction row from the activity API. */
type ActivityRow = {
  amount_base: number;
  amount_quote: number;
  maker: string;
  mint: string;
  signature: string;
  ts: number;
  type: string; // "s" | "b"
  labels?: string[];
};

type ActivityResponse = {
  table: {
    rows: ActivityRow[];
  };
};

/** Map API label strings to SignalType. */
function mapLabel(label: string, txType: string): SignalType | null {
  switch (label) {
    case "dev":
      return txType === "b" ? "dev_buy" : "dev_sell";
    case "whale":
      return "whale";
    case "sniper":
      return "sniper";
    case "bot":
      return "bot";
    case "insider":
      return "insider";
    case "team":
    case "watchlist":
      return txType === "b" ? "watchlist_buy" : "watchlist_sell";
    default:
      return null;
  }
}

/**
 * Fetch historical signals for a token from the activity table.
 * Returns only transactions that carry trade-relevant labels.
 */
export async function fetchHistoricalSignals(
  rpcClient: RpcClient,
  mint: string,
  limit = 200,
): Promise<ChartSignal[]> {
  const response = await rpcClient.call<ActivityResponse>(
    "public/filterAllTransactionsTable",
    [
      {
        address_filters: [{ column: "mint", addresses: [mint] }],
        row_limit: limit,
        sort_column: "index",
        sort_order: false,
      },
    ],
  );

  const signals: ChartSignal[] = [];
  const rows = response?.table?.rows ?? [];

  for (const row of rows) {
    if (!row.labels || row.labels.length === 0) continue;

    for (const label of row.labels) {
      const signalType = mapLabel(label, row.type);
      if (signalType) {
        signals.push({
          ts: row.ts,
          type: signalType,
          wallet: row.maker,
          amount: row.amount_base,
          signature: row.signature,
        });
      }
    }
  }

  return signals;
}

/** Map a real-time SlotTradeUpdate into chart signals (if labeled). */
export function mapTradeToSignals(trade: {
  ts: number;
  type: string;
  maker: string;
  amount_base: number;
  signature: string;
  labels?: string[];
}): ChartSignal[] {
  if (!trade.labels || trade.labels.length === 0) return [];

  const signals: ChartSignal[] = [];
  for (const label of trade.labels) {
    const signalType = mapLabel(label, trade.type);
    if (signalType) {
      signals.push({
        ts: trade.ts,
        type: signalType,
        wallet: trade.maker,
        amount: trade.amount_base,
        signature: trade.signature,
      });
    }
  }
  return signals;
}
