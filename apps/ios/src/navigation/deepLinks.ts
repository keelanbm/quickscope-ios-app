import {
  DiscoveryRouteParams,
  PortfolioRouteParams,
  ScopeRouteParams,
  TelegramRouteParams,
  TokenDetailRouteParams,
  TrackingRouteParams,
  TradeRouteParams,
} from "@/src/navigation/types";

export type ParsedDeepLinkTarget =
  | {
      screen: "Discovery";
      params?: DiscoveryRouteParams;
    }
  | {
      screen: "Scope";
      params?: ScopeRouteParams;
    }
  | {
      screen: "Trade";
      params?: TradeRouteParams;
    }
  | {
      screen: "Portfolio";
      params?: PortfolioRouteParams;
    }
  | {
      screen: "Tracking";
      params?: TrackingRouteParams;
    }
  | {
      screen: "Telegram";
      params?: TelegramRouteParams;
    }
  | {
      screen: "TokenDetail";
      params: TokenDetailRouteParams;
    }
  | {
      screen: "Dev";
    }
  | {
      screen: null;
    };

const solanaAddressPattern = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const allowedWebHosts = new Set(["app.quickscope.gg", "quickscope.gg", "www.quickscope.gg"]);

function toAddressIfValid(value: string | null | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  return solanaAddressPattern.test(trimmed) ? trimmed : undefined;
}

function toPositiveNumberString(value: string | null): string | undefined {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  const parsed = Number(trimmed);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return undefined;
  }

  return trimmed;
}

function toChatId(value: string | null): string | undefined {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function parseSegmentsFromUrl(url: URL): string[] {
  const pathnameSegments = url.pathname.split("/").filter(Boolean);

  if (url.protocol === "quickscope:") {
    return url.host ? [url.host, ...pathnameSegments] : pathnameSegments;
  }

  if (url.protocol === "https:" || url.protocol === "http:") {
    return pathnameSegments;
  }

  return [];
}

function isSupportedUrl(url: URL): boolean {
  if (url.protocol === "quickscope:") {
    return true;
  }

  if (url.protocol === "https:" || url.protocol === "http:") {
    return allowedWebHosts.has(url.host.toLowerCase());
  }

  return false;
}

function fallbackToDiscovery(): ParsedDeepLinkTarget {
  return {
    screen: "Discovery",
    params: { source: "deep-link" },
  };
}

function parseTokenLink(url: URL, tokenCandidate?: string): ParsedDeepLinkTarget {
  const tokenAddress = toAddressIfValid(
    tokenCandidate ?? url.searchParams.get("tokenAddress") ?? url.searchParams.get("token")
  );

  if (!tokenAddress) {
    return fallbackToDiscovery();
  }

  return {
    screen: "Discovery",
    params: {
      source: "deep-link",
      tokenAddress,
    },
  };
}

function parseTokenDetailLink(url: URL, tokenCandidate?: string): ParsedDeepLinkTarget {
  const tokenAddress = toAddressIfValid(
    tokenCandidate ?? url.searchParams.get("tokenAddress") ?? url.searchParams.get("token")
  );

  if (!tokenAddress) {
    return fallbackToDiscovery();
  }

  return {
    screen: "TokenDetail",
    params: {
      source: "deep-link",
      tokenAddress,
    },
  };
}

function parseTradeLink(url: URL, inPath?: string, outPath?: string): ParsedDeepLinkTarget {
  const inputMintFromQuery = toAddressIfValid(url.searchParams.get("in"));
  const outputMintFromQuery = toAddressIfValid(url.searchParams.get("out"));
  const amount = toPositiveNumberString(url.searchParams.get("amount"));

  const pathInputMint = toAddressIfValid(inPath);
  const pathOutputMint = toAddressIfValid(outPath);
  const tokenAddress = toAddressIfValid(
    url.searchParams.get("tokenAddress") ?? url.searchParams.get("token")
  );
  const inputMint = inputMintFromQuery ?? pathInputMint;
  const outputMint = outputMintFromQuery ?? pathOutputMint;

  if (tokenAddress) {
    return {
      screen: "Trade",
      params: {
        source: "deep-link",
        tokenAddress,
        amount,
      },
    };
  }

  if (!inputMintFromQuery && !outputMintFromQuery && pathInputMint && !pathOutputMint) {
    return {
      screen: "Trade",
      params: {
        source: "deep-link",
        tokenAddress: pathInputMint,
        amount,
      },
    };
  }

  if (inputMint || outputMint || amount) {
    return {
      screen: "Trade",
      params: {
        source: "deep-link",
        inputMint,
        outputMint,
        amount,
      },
    };
  }

  return {
    screen: "Trade",
    params: {
      source: "deep-link",
    },
  };
}

function parsePortfolioLink(url: URL, walletPath?: string): ParsedDeepLinkTarget {
  const walletAddress = toAddressIfValid(
    walletPath ??
      url.searchParams.get("walletAddress") ??
      url.searchParams.get("wallet") ??
      url.searchParams.get("publicKey")
  );

  return {
    screen: "Portfolio",
    params: {
      source: "deep-link",
      walletAddress,
    },
  };
}

function parseTrackingLink(url: URL, walletPath?: string): ParsedDeepLinkTarget {
  const walletAddress = toAddressIfValid(
    walletPath ??
      url.searchParams.get("walletAddress") ??
      url.searchParams.get("wallet") ??
      url.searchParams.get("publicKey")
  );

  return {
    screen: "Tracking",
    params: {
      source: "deep-link",
      walletAddress,
    },
  };
}

function parseTelegramLink(url: URL, actionPath?: string, tokenPath?: string): ParsedDeepLinkTarget {
  const action = actionPath?.toLowerCase() === "share" ? "share" : undefined;
  const tokenAddress = toAddressIfValid(
    tokenPath ?? url.searchParams.get("tokenAddress") ?? url.searchParams.get("token")
  );
  const chatId = toChatId(url.searchParams.get("chatId"));

  return {
    screen: "Telegram",
    params: {
      source: "deep-link",
      action,
      tokenAddress,
      chatId,
    },
  };
}

function parseScopeLink(): ParsedDeepLinkTarget {
  return {
    screen: "Scope",
    params: {
      source: "deep-link",
    },
  };
}

export function parseQuickscopeDeepLink(rawUrl: string): ParsedDeepLinkTarget {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    return fallbackToDiscovery();
  }

  if (!isSupportedUrl(parsedUrl)) {
    return fallbackToDiscovery();
  }

  const segments = parseSegmentsFromUrl(parsedUrl);
  if (segments.length === 0) {
    return fallbackToDiscovery();
  }

  const [first, second, third] = segments;
  const firstSegment = first.toLowerCase();

  if (firstSegment === "phantom-auth-callback") {
    return { screen: null };
  }

  if (firstSegment === "token") {
    return parseTokenLink(parsedUrl, second);
  }

  if (firstSegment === "token-detail" || firstSegment === "tokendetail") {
    return parseTokenDetailLink(parsedUrl, second);
  }

  if (firstSegment === "trade") {
    return parseTradeLink(parsedUrl, second, third);
  }

  if (firstSegment === "portfolio") {
    return parsePortfolioLink(parsedUrl, second);
  }

  if (firstSegment === "tracking" || firstSegment === "wallettracking" || firstSegment === "watchlist") {
    return parseTrackingLink(parsedUrl, second);
  }

  if (firstSegment === "scope" || firstSegment === "feeds") {
    return parseScopeLink();
  }

  if (firstSegment === "telegram" || firstSegment === "social") {
    return parseTelegramLink(parsedUrl, second, third);
  }

  if (firstSegment === "discovery" || firstSegment === "home") {
    return {
      screen: "Discovery",
      params: { source: "deep-link" },
    };
  }

  if (firstSegment === "dev" || firstSegment === "console") {
    return {
      screen: "Dev",
    };
  }

  return fallbackToDiscovery();
}
