import type { RpcClient } from "@/src/lib/api/rpcClient";

import { fetchScopeTokens } from "@/src/features/scope/scopeService";

describe("fetchScopeTokens", () => {
  it.each([
    ["new-pairs", "mint_ts"],
    ["momentum", "one_hour_tx_count"],
    ["scan-surge", "telegram_mentions_1h"],
  ] as const)("uses expected sort config for %s", async (tab, sortColumn) => {
    const call = jest.fn().mockResolvedValue({
      sol_price_usd: 100,
      table: {
        rows: [],
      },
    });

    const rpcClient = { call } as unknown as RpcClient;

    const result = await fetchScopeTokens(rpcClient, tab);

    expect(call).toHaveBeenCalledWith("public/filterTokensTable", [
      {
        filter: {
          sort_column: sortColumn,
          sort_order: false,
          row_limit: 50,
        },
      },
    ]);
    expect(result.tab).toBe(tab);
    expect(result.rows).toEqual([]);
  });

  it("maps rpc rows into ui-friendly scope tokens", async () => {
    const call = jest.fn().mockResolvedValue({
      sol_price_usd: 100,
      table: {
        rows: [
          {
            mint: "So11111111111111111111111111111111111111112",
            symbol: "SOL",
            name: "Solana",
            image_uri: "https://example.com/sol.png",
            platform: "raydium",
            exchange: "raydium",
            mint_ts: 1_770_000_000,
            market_cap_sol: 1234.5,
            one_hour_tx_count: 812,
            one_hour_volume_sol: 45.67,
            one_hour_change: 0.123,
            telegram_mentions_1h: 98,
          },
        ],
      },
    });

    const rpcClient = { call } as unknown as RpcClient;
    const result = await fetchScopeTokens(rpcClient, "momentum");

    expect(result.rows[0]).toEqual({
      mint: "So11111111111111111111111111111111111111112",
      symbol: "SOL",
      name: "Solana",
      imageUri: "https://example.com/sol.png",
      platform: "raydium",
      exchange: "raydium",
      mintedAtSeconds: 1_770_000_000,
      marketCapUsd: 123_450,
      oneHourTxCount: 812,
      oneHourVolumeUsd: 4567,
      oneHourChangePercent: 12.3,
      scanMentionsOneHour: 98,
    });
  });
});
