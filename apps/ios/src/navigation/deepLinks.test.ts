import { parseQuickscopeDeepLink } from "@/src/navigation/deepLinks";

describe("parseQuickscopeDeepLink", () => {
  it("maps token links to Discovery with token context", () => {
    const target = parseQuickscopeDeepLink(
      "quickscope://token/So11111111111111111111111111111111111111112"
    );

    expect(target).toEqual({
      screen: "Discovery",
      params: {
        source: "deep-link",
        tokenAddress: "So11111111111111111111111111111111111111112",
      },
    });
  });

  it("maps token-detail links to Token Detail route", () => {
    const target = parseQuickscopeDeepLink(
      "quickscope://token-detail/So11111111111111111111111111111111111111112"
    );

    expect(target).toEqual({
      screen: "TokenDetail",
      params: {
        source: "deep-link",
        tokenAddress: "So11111111111111111111111111111111111111112",
      },
    });
  });

  it("maps trade links with query params to Trade context", () => {
    const target = parseQuickscopeDeepLink(
      "quickscope://trade?in=So11111111111111111111111111111111111111112&out=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&amount=5&inDecimals=9&outDecimals=6"
    );

    expect(target).toEqual({
      screen: "Trade",
      params: {
        source: "deep-link",
        inputMint: "So11111111111111111111111111111111111111112",
        inputMintDecimals: 9,
        outputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        outputMintDecimals: 6,
        amount: "5",
      },
    });
  });

  it("maps web trade links to Trade token context", () => {
    const target = parseQuickscopeDeepLink(
      "https://app.quickscope.gg/trade/So11111111111111111111111111111111111111112"
    );

    expect(target).toEqual({
      screen: "Trade",
      params: {
        source: "deep-link",
        tokenAddress: "So11111111111111111111111111111111111111112",
      },
    });
  });

  it("keeps path trade token semantics when amount query is provided", () => {
    const target = parseQuickscopeDeepLink(
      "quickscope://trade/So11111111111111111111111111111111111111112?amount=0.5"
    );

    expect(target).toEqual({
      screen: "Trade",
      params: {
        source: "deep-link",
        tokenAddress: "So11111111111111111111111111111111111111112",
        amount: "0.5",
      },
    });
  });

  it("maps portfolio links with wallet address", () => {
    const target = parseQuickscopeDeepLink(
      "quickscope://portfolio/Z8wPMesZqDZv4URMfBFH6kwFwM4fxjpdRG33tMjNFeP"
    );

    expect(target).toEqual({
      screen: "Portfolio",
      params: {
        source: "deep-link",
        walletAddress: "Z8wPMesZqDZv4URMfBFH6kwFwM4fxjpdRG33tMjNFeP",
      },
    });
  });

  it("maps telegram share links", () => {
    const target = parseQuickscopeDeepLink(
      "quickscope://telegram/share/So11111111111111111111111111111111111111112?chatId=123"
    );

    expect(target).toEqual({
      screen: "Telegram",
      params: {
        source: "deep-link",
        action: "share",
        tokenAddress: "So11111111111111111111111111111111111111112",
        chatId: "123",
      },
    });
  });

  it("ignores Phantom auth callback links", () => {
    const target = parseQuickscopeDeepLink("quickscope://phantom-auth-callback?code=abc");

    expect(target).toEqual({ screen: null });
  });

  it("routes dev links to the hidden dev console route", () => {
    const target = parseQuickscopeDeepLink("quickscope://dev");

    expect(target).toEqual({ screen: "Dev" });
  });

  it("falls back to Discovery for unknown links", () => {
    const target = parseQuickscopeDeepLink("quickscope://unknown/route");

    expect(target).toEqual({
      screen: "Discovery",
      params: { source: "deep-link" },
    });
  });

  it("falls back to Discovery for unsupported web hosts", () => {
    const target = parseQuickscopeDeepLink(
      "https://example.com/trade/So11111111111111111111111111111111111111112"
    );

    expect(target).toEqual({
      screen: "Discovery",
      params: { source: "deep-link" },
    });
  });
});
