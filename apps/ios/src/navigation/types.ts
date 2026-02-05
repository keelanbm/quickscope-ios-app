import type { NavigatorScreenParams } from "@react-navigation/native";

type DeepLinkMeta = {
  source?: "deep-link";
};

export type DiscoveryRouteParams = {
  source?: DeepLinkMeta["source"];
  tokenAddress?: string;
};

export type TradeRouteParams = {
  source?: DeepLinkMeta["source"];
  tokenAddress?: string;
  inputMint?: string;
  outputMint?: string;
  amount?: string;
};

export type ScopeRouteParams = DeepLinkMeta;

export type PortfolioRouteParams = {
  source?: DeepLinkMeta["source"];
  walletAddress?: string;
};

export type TrackingRouteParams = {
  source?: DeepLinkMeta["source"];
  walletAddress?: string;
};

export type TelegramRouteParams = {
  source?: DeepLinkMeta["source"];
  action?: "share";
  tokenAddress?: string;
  chatId?: string;
};

export type TokenDetailRouteParams = {
  source?: DeepLinkMeta["source"] | "discovery-row" | "scope-row";
  tokenAddress: string;
  symbol?: string;
  name?: string;
  imageUri?: string;
  platform?: string;
  exchange?: string;
  marketCapUsd?: number;
  oneHourVolumeUsd?: number;
  oneHourTxCount?: number;
  oneHourChangePercent?: number;
  mintedAtSeconds?: number;
  scanMentionsOneHour?: number;
};

export type RootTabs = {
  Discovery: DiscoveryRouteParams | undefined;
  Scope: ScopeRouteParams | undefined;
  Trade: TradeRouteParams | undefined;
  Portfolio: PortfolioRouteParams | undefined;
  Tracking: TrackingRouteParams | undefined;
  Telegram: TelegramRouteParams | undefined;
  Dev: undefined;
};

export type RootStack = {
  MainTabs: NavigatorScreenParams<RootTabs>;
  TokenDetail: TokenDetailRouteParams;
};
