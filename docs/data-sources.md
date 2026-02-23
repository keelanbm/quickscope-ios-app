# Quickscope Terminal — Data Sources Reference

> **Purpose:** Complete reference of every data source used by the web terminal frontend.
> Use this to understand where data comes from and what endpoints the iOS app needs to replicate.

---

## Table of Contents

- [Infrastructure Overview](#infrastructure-overview)
- [Environment Configuration](#environment-configuration)
- [API Pattern](#api-pattern)
- [1. Authentication (auth-api)](#1-authentication-auth-api)
- [2. Account & Wallets (account-api)](#2-account--wallets-account-api)
- [3. Token Info (token-api)](#3-token-info-token-api)
- [4. Token Tables & Listings (tokens-api)](#4-token-tables--listings-tokens-api)
- [5. Trading (trade-api)](#5-trading-trade-api)
- [6. Trade Settings (trade-settings-api)](#6-trade-settings-trade-settings-api)
- [7. Wallet Holdings & Positions (wallet-holdings-api)](#7-wallet-holdings--positions-wallet-holdings-api)
- [8. Token Watchlists (token-watchlist-api)](#8-token-watchlists-token-watchlist-api)
- [9. Wallet Watchlists (wallet-watchlist-api)](#9-wallet-watchlists-wallet-watchlist-api)
- [10. Token Alerts (token-alert)](#10-token-alerts-token-alert)
- [11. Transactions (transactions-api)](#11-transactions-transactions-api)
- [12. Candles / Charts (candles-api)](#12-candles--charts-candles-api)
- [13. Price (price-api)](#13-price-price-api)
- [14. Search (search-api)](#14-search-search-api)
- [15. Trader Analytics (trader-api)](#15-trader-analytics-trader-api)
- [16. Referrals (referral-api)](#16-referrals-referral-api)
- [17. Dashboard Layouts (schema-api)](#17-dashboard-layouts-schema-api)
- [18. Telegram Bot (telegram-bot-api)](#18-telegram-bot-telegram-bot-api)
- [19. Jupiter (jupiter-api) — External](#19-jupiter-jupiter-api--external)
- [20. WebSocket Subscriptions](#20-websocket-subscriptions)
- [21. Solana RPC](#21-solana-rpc)
- [Auth Prefix Legend](#auth-prefix-legend)
- [Pagination Patterns](#pagination-patterns)

---

## Infrastructure Overview

| Source | Protocol | Base URL Env Var | Notes |
|--------|----------|------------------|-------|
| QS Backend API | HTTP POST (JSON-RPC style) | `VITE_API_HOST` | All endpoints |
| QS WebSocket | WS pub/sub | `VITE_WS_HOST` | Real-time streams |
| Jupiter | HTTP GET (REST) | Hardcoded `https://lite-api.jup.ag/` | Only external API |
| Solana RPC | JSON-RPC | `VITE_SOLANA_RPC_ENDPOINT` | Direct chain queries |

## Environment Configuration

```
VITE_API_HOST=         # QS backend base URL
VITE_WS_HOST=          # QS WebSocket base URL (connects to /public path)
VITE_SOLANA_RPC_ENDPOINT=  # Solana RPC node
```

## API Pattern

All QS backend endpoints use the same pattern:

```
POST /{module}/?method={method}&params={JSON_encoded_params}
```

- **Credentials:** `include` (cookie-based auth)
- **Content-Type:** Implied JSON body
- **Response shape:** `{ result: T }` wrapped in `ApiResponse<T>`

Method prefixes determine auth requirements:
| Prefix | Auth Required | Description |
|--------|--------------|-------------|
| `public/` | No | Read-only public data |
| `private/` | Yes (cookie) | Authenticated reads/writes |
| `tx/` | Yes (cookie) | Transaction/mutation endpoints |
| `auth/` | Varies | Authentication flow |

---

## 1. Authentication (auth-api)

**File:** `src/lib/network/auth-api.ts`
**RTK Slice:** `auth`
**Auth:** Public base query (no `createDefaultBaseQuery`)

| Method | Endpoint | Params | Returns | Description |
|--------|----------|--------|---------|-------------|
| mutation | `auth/challenge` | `{ uri, account, scopes[] }` | `string` | Initiate wallet auth challenge |
| mutation | `auth/solution` | `{ challenge, solution }` | `AuthTokens` | Submit signed challenge |
| mutation | `auth/refresh` | — | `AuthTokens` | Refresh access token |
| mutation | `auth/revoke` | `{ reason }` | `boolean` | End session |
| mutation | `auth/createAccessCode` | — | `{ code, expires_at }` | Generate access code for cross-device auth |
| mutation | `auth/redeemAccessCode` | `{ code }` | `AuthTokens` | Redeem access code |

**`AuthTokens` shape:**
```ts
{
  subject: string;
  refresh_token_expiration: string;
  access_token_expiration: string;
}
```

---

## 2. Account & Wallets (account-api)

**File:** `src/lib/network/account-api.ts`
**RTK Slice:** `account`
**Auth:** Uses `createDefaultBaseQuery()` (authenticated)

### Wallet Queries

| Method | Endpoint | Params | Returns | Tags |
|--------|----------|--------|---------|------|
| query | `tx/getActiveWallets` | — | `UserWalletInfo[]` | `accountWallets` |
| query | `tx/getArchivedWallets` | — | `UserWalletInfo[]` | `accountWallets` |
| query | `tx/getPrimaryWallet` | — | `string \| undefined` | `accountPrimaryWallet` |

> **Note:** `getActiveWallets` transforms empty names to "Unnamed" via i18n.

### Wallet CRUD

| Method | Endpoint | Params | Returns | Notes |
|--------|----------|--------|---------|-------|
| mutation | `tx/createAccount` | `{ referralCode? }` | `UserWalletInfo` | Also sets primary wallet |
| mutation | `tx/generateWallet` | `{ name }` | `UserWalletInfo` | |
| mutation | `tx/importWallet` | `{ name, privateKey }` | `void` | |
| mutation | `tx/renameWallet` | `{ wallet, name }` | `void` | |
| mutation | `tx/setPrimaryWallet` | `{ wallet }` | `void` | Optimistic update to primary wallet state |
| mutation | `tx/archiveWallet` | `{ wallet }` | `void` | |
| mutation | `tx/unarchiveWallet` | `{ wallet }` | `void` | |
| mutation | `tx/deleteWallet` | `{ wallet }` | `void` | |
| mutation | `tx/selectWallets` | `{ wallets[] }` | `void` | Optimistic update |
| mutation | `tx/unselectWallets` | `{ wallets[] }` | `void` | Optimistic update |

### Wallet Operations

| Method | Endpoint | Params | Returns | Notes |
|--------|----------|--------|---------|-------|
| mutation | `tx/exportWallet` | `{ userAccountKey }` | `string` | Private key export |
| mutation | `tx/transferSol` | `{ userAccountKey, receiver, amount }` | `string` | Invalidates holdings |
| mutation | `tx/transferSpl` | `{ userAccountKey, receiver, splAddress, amount }` | `string` | Invalidates holdings |
| mutation | `tx/reclaimRent` | `{ userAccount }` | `ReclaimResult` | Closes empty token accounts |

### Reclaimable Accounts (public)

| Method | Endpoint | Params | Returns |
|--------|----------|--------|---------|
| query | `public/getReclaimableTokenAccountInfoByOwner` | `{ owner }` | `ReclaimableTokenAccountInfo` |
| query | `public/getMultiWalletReclaimableTokenAccountInfo` | `{ wallets[] }` | `MultiWalletReclaimableTokenAccountInfo` |

### Cashback

| Method | Endpoint | Params | Returns |
|--------|----------|--------|---------|
| query | `public/getClaimableCashback` | `{ wallets[] }` | `ClaimableCashback` |
| mutation | `tx/claimCashback` | `{ userAccount }` | `CashbackClaimResult` |

### Hidden Token Management

| Method | Endpoint | Params | Returns | Notes |
|--------|----------|--------|---------|-------|
| query | `private/getHiddenTokens` | `{ limit?, offset? }` | `HiddenTokenRow[]` | Default limit=500 |
| mutation | `private/hideToken` | `{ mint }` | `boolean` | Optimistic update |
| mutation | `private/unhideToken` | `{ mint }` | `boolean` | Optimistic update |

### Account Settings

| Method | Endpoint | Params | Returns |
|--------|----------|--------|---------|
| query | `private/getAccountSettings` | — | `AccountSettings` |
| mutation | `private/setAccountSettings` | `{ accountSettings }` | `AccountSettings` |

---

## 3. Token Info (token-api)

**File:** `src/lib/network/token-api.ts`
**RTK Slice:** `token`
**Auth:** Public (no auth required)

| Method | Endpoint | Params | Returns | Notes |
|--------|----------|--------|---------|-------|
| query | `public/getLiveTokenInfo` | `{ mint }` | `MaybeLiveTokenInfo` | Single token |
| query | `public/getLiveTokenInfos` | `{ mints[] }` | `Record<string, LiveTokenInfo>` | Batch; filters incomplete entries |
| query | `public/getTokenHolders` | `{ mint, filter: TokenHoldersFilter }` | `TokenHolders` | |
| query | `public/getTokenHolderDistribution` | `{ mint }` | `HolderDistribution` | |
| query | `public/getTokenTraders` | `{ mint, filter: TokenTradersFilter }` | `TokenTraders` | |
| query | `public/getFeeClaimsByMint` | `{ mint, filter?: FeeClaimsFilter }` | `FeeClaimsResponse` | |
| query | `getTokenLogoBase64` | `logoUrl: string` | `string` (base64) | Custom queryFn, not QS backend |

---

## 4. Token Tables & Listings (tokens-api)

**File:** `src/lib/network/tokens-api.ts`
**RTK Slice:** `tokens`
**Auth:** Public

| Method | Endpoint | Params | Returns | Notes |
|--------|----------|--------|---------|-------|
| infiniteQuery | `public/filterTokensTable` | `{ filter: TokenTableFilter }` | `TokenTableRow[]` | Paginated via limit/offset |
| infiniteQuery | `public/filterTokensTableMemescope` | `{ filter: MemescopeFilter }` | `TokenTableRow[]` | Paginated |
| infiniteQuery | `public/getExchangeListings` | `{ limit?, offset? }` | `ExchangeListing[]` | Paginated |
| query | `public/getExchangeListingsByToken` | `{ mint }` | `ExchangeListing[]` | |

> **Also exports** `useGetTokenInfoFromTokensTable` — a custom hook that subscribes to `TokenTableFilterUpdates` WebSocket for real-time token data.

---

## 5. Trading (trade-api)

**File:** `src/lib/network/trade-api.ts`
**RTK Slice:** `trade`
**Auth:** Authenticated (`createDefaultBaseQuery`)

| Method | Endpoint | Params | Returns | Notes |
|--------|----------|--------|---------|-------|
| mutation | `tx/getSwapQuote` | `{ splAddress, amount, slippage, isBuy, userAccountKey }` | `QuoteResponse` | |
| mutation | `tx/swap` | `{ splAddress, amount, slippage, isBuy, userAccountKey }` | `ExecutionResult` | Invalidates wallet holdings |
| mutation | `tx/swapBalancePercentage` | `{ splAddress, percentage, slippage, isBuy, userAccountKey }` | `ExecutionResult` | |
| mutation | `tx/jupiterSwapWithQuote` | `{ quote, userAccountKey }` | `ExecutionResult` | Uses Jupiter quote |
| mutation | `tx/createTriggerOrder` | `{ userAccountKey, mint, ... }` | `TriggerOrder` | |
| mutation | `tx/cancelTriggerOrder` | `{ userAccountKey, orderId }` | `boolean` | |
| infiniteQuery | `tx/getTriggerOrders` | `{ userAccountKey, mint?, status?, limit, offset }` | `TriggerOrder[]` | Paginated |

---

## 6. Trade Settings (trade-settings-api)

**File:** `src/lib/network/trade-settings-api.ts`
**RTK Slice:** `tradeSettings`
**Auth:** Authenticated

| Method | Endpoint | Params | Returns | Notes |
|--------|----------|--------|---------|-------|
| query | `private/getAccountTradeSettings` | — | `AccountTradeSettings` | |
| mutation | `private/updateAccountTradeSettings` | `{ tradeSettings, nonce }` | `AccountTradeSettings` | Optimistic update with nonce concurrency |
| mutation | `private/resetAccountTradeSettings` | — | `AccountTradeSettings` | |

---

## 7. Wallet Holdings & Positions (wallet-holdings-api)

**File:** `src/lib/network/wallet-holdings-api.ts`
**RTK Slice:** `walletHoldings`
**Auth:** Public

| Method | Endpoint | Params | Returns | Notes |
|--------|----------|--------|---------|-------|
| query | `public/getAccountSolBalances` | `{ accounts[] }` | `AccountSolBalances` | Transforms lamports → SOL |
| query | `public/getAccountTokenHoldings` | `{ account, filterOpts? }` | `AccountTokenHoldingsInfo` | Transforms raw balances to UI amounts |
| query | `public/getTraderPositions` | `{ account, filter }` | `Positions` | |
| query | `public/getTraderOverview` | `{ account }` | `TraderOverview` | Single wallet |
| query | `public/getTraderOverviews` | `{ accounts[] }` | `TraderOverview[]` | Multi-wallet |
| query | `public/getPositionPnl` | `{ account, mint }` | `TraderTokenPosition` | |
| query | `public/getMultiWalletPositions` | `{ mint, wallets[] }` | `MultiWalletPositions` | |
| query | `public/getWalletsPositions` | `{ wallets[], filter? }` | `WalletsPositions` | |

**`filterOpts` for getAccountTokenHoldings:**
```ts
{
  only_supported_tokens?: boolean;
  include_zero_balances?: boolean;
  min_balance_threshold?: number;
  include_frozen?: boolean;
}
```

---

## 8. Token Watchlists (token-watchlist-api)

**File:** `src/lib/network/token-watchlist-api.ts`
**RTK Slice:** `tokenWatchlist`
**Auth:** Authenticated (except `getPublishedTokenWatchlist`)

### CRUD

| Method | Endpoint | Params | Returns |
|--------|----------|--------|---------|
| mutation | `private/createTokenWatchlist` | `{ name, description }` | `number` (id) |
| query | `private/getTokenWatchlist` | `{ watchlistId }` | `TokenWatchlistRow` |
| query | `private/getAllTokenWatchlists` | — | `TokenWatchlistRow[]` |
| mutation | `private/updateTokenWatchlistName` | `{ watchlistId, name }` | `boolean` |
| mutation | `private/updateTokenWatchlistDescription` | `{ watchlistId, description }` | `boolean` |
| mutation | `private/addToTokenWatchlist` | `{ watchlistId, token }` | `boolean` |
| mutation | `private/removeTokenFromWatchlist` | `{ watchlistId, token }` | `boolean` |
| mutation | `private/deleteTokenWatchlist` | `{ watchlistId }` | `boolean` |

> **Note:** `getAllTokenWatchlists` sorts by ID ascending and adds `isFavorites: true` when name === "favorites".

### Publishing

| Method | Endpoint | Params | Returns |
|--------|----------|--------|---------|
| mutation | `private/publishTokenWatchlist` | `{ watchlistId }` | `number` |
| mutation | `private/deletePublishedTokenWatchlist` | `{ watchlistId }` | `boolean` |
| mutation | `private/subscribeToPublishedTokenWatchlist` | `{ watchlistId }` | `boolean` |
| mutation | `private/unsubscribeFromPublishedTokenWatchlist` | `{ watchlistId }` | `boolean` |
| query | `public/getPublishedTokenWatchlist` | `watchlistId: number` | `TokenWatchlistRow` |

---

## 9. Wallet Watchlists (wallet-watchlist-api)

**File:** `src/lib/network/wallet-watchlist-api.ts`
**RTK Slice:** `walletWatchlist`
**Auth:** Authenticated (except `getPublishedWalletWatchlist`)

### CRUD

| Method | Endpoint | Params | Returns |
|--------|----------|--------|---------|
| query | `private/getAllWalletWatchlists` | — | `WalletWatchlistRow[]` |
| mutation | `private/createWalletWatchlist` | `{ name, description }` | `number` (id) |
| mutation | `private/updateWalletWatchlistName` | `{ watchlistId, name }` | `boolean` |
| mutation | `private/updateWalletWatchlistDescription` | `{ watchlistId, description }` | `boolean` |
| mutation | `private/deleteWalletWatchlist` | `{ watchlistId }` | `boolean` |

### Wallet Tracking

| Method | Endpoint | Params | Returns |
|--------|----------|--------|---------|
| mutation | `private/addToWalletWatchlist` | `{ watchlistId, wallet, name?, description?, emoji? }` | `boolean` |
| mutation | `private/multiAddToWalletWatchlist` | `{ watchlistId, wallets[] }` | `boolean` |
| mutation | `private/removeWalletFromWatchlist` | `{ watchlistId, wallet }` | `boolean` |
| query | `private/getWalletWatchlistByName` | `{ name }` | `WalletWatchlistRow` |
| query | `private/getWalletWatchlist` | `{ watchlistId }` | `WalletWatchlistRow` |
| query | `private/getAllTrackedWallets` | — | `TrackedWallet[]` |

### Wallet Metadata

| Method | Endpoint | Params | Returns |
|--------|----------|--------|---------|
| mutation | `private/updateTrackedWallet` | `{ wallet, name?, description?, emoji? }` | `boolean` |
| mutation | `private/updateTrackedWalletName` | `{ wallet, name }` | `boolean` |
| mutation | `private/updateTrackedWalletDescription` | `{ wallet, description }` | `boolean` |
| mutation | `private/updateTrackedWalletEmoji` | `{ wallet, emoji }` | `boolean` |

### Publishing

| Method | Endpoint | Params | Returns |
|--------|----------|--------|---------|
| mutation | `private/publishWalletWatchlist` | `{ watchlistId }` | `number` |
| mutation | `private/deletePublishedWalletWatchlist` | `{ watchlistId }` | `boolean` |
| mutation | `private/subscribeToPublishedWalletWatchlist` | `{ watchlistId }` | `boolean` |
| mutation | `private/unsubscribeFromPublishedWalletWatchlist` | `{ watchlistId }` | `boolean` |
| query | `public/getPublishedWalletWatchlist` | `watchlistId: number` | `WalletWatchlistRow` |

---

## 10. Token Alerts (token-alert)

**File:** `src/lib/network/token-alert.ts`
**RTK Slice:** `tokenAlert`
**Auth:** Authenticated

| Method | Endpoint | Params | Returns |
|--------|----------|--------|---------|
| mutation | `private/createTokenAlert` | `{ mint, condition }` | `TokenAlert` |
| mutation | `private/deleteTokenAlert` | `{ alertId }` | `boolean` |
| query | `private/getTokenAlerts` | — | `TokenAlert[]` |

---

## 11. Transactions (transactions-api)

**File:** `src/lib/network/transactions-api.ts`
**RTK Slice:** `transactions`
**Auth:** Public

| Method | Endpoint | Params | Returns | Notes |
|--------|----------|--------|---------|-------|
| query | `public/filterTransactionsTable` | `{ mint, filter, makerAddress? }` | `TransactionTableRow[]` | By token |
| infiniteQuery | `public/filterAllTransactionsTable` | `{ walletAddress, filter }` | `AllTransactionsTableRow[]` | By wallet, paginated |

---

## 12. Candles / Charts (candles-api)

**File:** `src/lib/network/candles-api.ts`
**Auth:** Public
**Pattern:** Direct `fetch()` — NOT RTK Query (used for TradingView integration)

| Function | Endpoint | Params | Returns |
|----------|----------|--------|---------|
| `getTokenCandles` | `public/getTokenCandles` | `{ tokenAddress, from, to, resolutionSeconds }` | Candle data |
| `getTokenCandlesReverse` | `public/getTokenCandlesReverse` | `{ tokenAddress, before, resolutionSeconds, limit }` | Candle data (reverse) |

> Uses `JSONbig.stringify` for request body serialization to handle large numbers.

---

## 13. Price (price-api)

**File:** `src/lib/network/price-api.ts`
**RTK Slice:** `price`
**Auth:** Public

| Method | Endpoint | Params | Returns |
|--------|----------|--------|---------|
| query | `public/getLatestSolPrice` | — | `number` |
| query | `public/getSolPriceAtTime` | `{ timestamp }` | `number` |

---

## 14. Search (search-api)

**File:** `src/lib/network/search-api.ts`
**RTK Slice:** `search`
**Auth:** Public

| Method | Endpoint | Params | Returns |
|--------|----------|--------|---------|
| query | `public/search` | `{ searchTerm, opts?: { limit } }` | `SearchResults` |

> Returns token matches + optional wallet overview if the search term is a valid wallet address.

---

## 15. Trader Analytics (trader-api)

**File:** `src/lib/network/trader-api.ts`
**RTK Slice:** `trader`
**Auth:** Public

| Method | Endpoint | Params | Returns |
|--------|----------|--------|---------|
| query | `public/getTraderHeatmap` | `{ account }` | `TraderHeatmap` |

> Returns daily trade activity data with buy/sell volumes over time.

---

## 16. Referrals (referral-api)

**File:** `src/lib/network/referral-api.ts`
**RTK Slice:** `referral`
**Auth:** Authenticated

| Method | Endpoint | Params | Returns |
|--------|----------|--------|---------|
| mutation | `private/setReferralCode` | `{ code }` | `boolean` |
| query | `private/getReferralCode` | — | `ReferralCode` |
| mutation | `private/recordTokenReferral` | `{ mint, referralCode }` | `boolean` |
| query | `private/getReferralRates` | — | `ReferralRates` |
| query | `private/getCumulativeEarnings` | — | `CumulativeEarnings` |
| query | `private/getEarningsByMint` | `{ filter }` | `EarningsByMint` |
| query | `private/getUserClaimInfo` | — | `UserClaimInfo` |
| mutation | `tx/requestClaim` | `{ wallet }` | `ClaimResult` |
| query | `private/getClaimHistory` | `{ filter }` | `ClaimHistory` |
| query | `private/getHistoricEarnings` | `{ filter }` | `HistoricEarnings` |

---

## 17. Dashboard Layouts (schema-api)

**File:** `src/lib/network/schema-api.ts`
**RTK Slice:** `schema`
**Auth:** Authenticated

| Method | Endpoint | Params | Returns | Notes |
|--------|----------|--------|---------|-------|
| query | `private/getDashboards` | — | `DashboardV2[]` | |
| mutation | `private/setDashboard` | `{ dashboard }` | `DashboardV2` | Optimistic update with slot/nonce concurrency |
| query | `private/getDashboardAtSlots` | `{ slots[] }` | `DashboardV2[]` | |
| mutation | `private/deleteDashboard` | `{ slot }` | `boolean` | |

> **iOS Note:** Dashboard layouts are web-specific (desktop widget grid system). The iOS app likely needs its own layout system but should understand the data shape for any shared dashboard concepts.

---

## 18. Telegram Bot (telegram-bot-api)

**File:** `src/lib/network/telegram-bot-api.ts`
**RTK Slice:** `telegramBot`
**Auth:** Mixed

### Settings & Linking

| Method | Endpoint | Params | Returns |
|--------|----------|--------|---------|
| mutation | `private/updateTelegramSettingsForUser` | `{ settings }` | `TelegramSettings` |
| query | `private/getTelegramSettingsForUser` | — | `TelegramSettings` |
| mutation | `private/unlinkTelegram` | — | `boolean` |
| query | `private/getTelegramUserId` | — | `string` |

### Chats & Sharing

| Method | Endpoint | Params | Returns |
|--------|----------|--------|---------|
| query | `private/getTelegramChats` | — | `TelegramChat[]` |
| mutation | `private/shareToken` | `{ chatId, mint }` | `boolean` |

### Feeds

| Method | Endpoint | Params | Returns | Notes |
|--------|----------|--------|---------|-------|
| infiniteQuery | `private/getTelegramTokenEventsFeed` | `{ filter }` | Events | Paginated |
| infiniteQuery | `private/getAllMessages` | `{ filter }` | Messages | Paginated |
| query | `public/getTrendingTweets` | — | Tweets | Public, no auth |

---

## 19. Jupiter (jupiter-api) — External

**File:** `src/lib/network/jupiter-api.ts`
**RTK Slice:** `jupiter`
**Auth:** None
**Base URL:** `https://lite-api.jup.ag/`
**HTTP Method:** GET (unlike all QS APIs which use POST)

| Method | Endpoint | Returns | Notes |
|--------|----------|---------|-------|
| query | `tokens/v2/toporganicscore/1h` | `JupiterToken[]` | Top tokens by organic score |
| query | `tokens/v2/search?query={term}` | `JupiterToken[]` | Token search |
| query | `swap/v1/quote?inputMint=&outputMint=&amount=&slippageBps=` | `JupiterQuoteResponse` | Swap quote |

> **Important:** This is the ONLY external (non-QS) API. Everything else hits the QS backend.

---

## 20. WebSocket Subscriptions

**File:** `src/lib/websocket-client.ts`, `src/types/websockets.ts`
**Connection:** `${VITE_WS_HOST}/public`

### Protocol

```
Subscribe:   { method: "{channel}_subscribe",   params: [...] }
Unsubscribe: { method: "{channel}_unsubscribe", params: [...] }
Incoming:    { method: "{channel}_subscription", result: ... }
```

### Available Channels

| Channel | Method | Params | Data Shape | Used By |
|---------|--------|--------|------------|---------|
| Memescope Filter Updates | `public/memescopeFilterUpdates` | filter config | Token updates | Discovery/Memescope screen |
| Slot Trade Updates | `public/slotTradeUpdates` | slot/token config | Trade events | Live trade feed |
| Token Table Filter Updates | `public/tokenTableFilterUpdates` | table filter | Token row updates | Token tables, token info hooks |

### Client Features

- Auto-reconnect with exponential backoff (max 30s, 10 attempts)
- Subscription caching — last received data served to new subscribers
- Automatic resubscribe on reconnection
- Singleton pattern (one connection shared across app)

---

## 21. Solana RPC

**Connection:** `VITE_SOLANA_RPC_ENDPOINT`

Used for direct on-chain queries (balance checks, transaction confirmation, etc.). The web app uses `@solana/web3.js` for RPC interactions.

---

## Auth Prefix Legend

| Prefix | Cookie Auth | Description |
|--------|------------|-------------|
| `public/` | No | Anyone can call |
| `private/` | Yes | Read/write user data |
| `tx/` | Yes | Executes transactions or mutates server state |
| `auth/` | Varies | Authentication handshake |

---

## Pagination Patterns

### Infinite Queries (RTK Query `builder.infiniteQuery`)

Used by:
- `public/filterTokensTable`
- `public/filterTokensTableMemescope`
- `public/getExchangeListings`
- `public/filterAllTransactionsTable`
- `tx/getTriggerOrders`
- `private/getTelegramTokenEventsFeed`
- `private/getAllMessages`

Pattern:
```ts
{
  infiniteQueryOptions: {
    initialPageParam: { limit: N, offset: 0 },
    getNextPageParam: (lastPage, allPages, lastPageParam) => ({
      ...lastPageParam,
      offset: lastPageParam.offset + lastPageParam.limit,
    }),
  }
}
```

### Standard Queries with Manual Pagination

Used by:
- `private/getHiddenTokens` (limit/offset params)

---

## Endpoint Count Summary

| Category | Public | Private | Tx | Auth | Total |
|----------|--------|---------|-----|------|-------|
| Authentication | — | — | — | 6 | 6 |
| Account & Wallets | 3 | 5 | 15 | — | 23 |
| Token Info | 6 | — | — | — | 6 |
| Token Tables | 4 | — | — | — | 4 |
| Trading | — | — | 6 | — | 6 |
| Trade Settings | — | 3 | — | — | 3 |
| Wallet Holdings | 8 | — | — | — | 8 |
| Token Watchlists | 1 | 12 | — | — | 13 |
| Wallet Watchlists | 1 | 18 | — | — | 19 |
| Token Alerts | — | 3 | — | — | 3 |
| Transactions | 2 | — | — | — | 2 |
| Candles | 2 | — | — | — | 2 |
| Price | 2 | — | — | — | 2 |
| Search | 1 | — | — | — | 1 |
| Trader Analytics | 1 | — | — | — | 1 |
| Referrals | — | 7 | 1 | — | 8 |
| Dashboard Layouts | — | 4 | — | — | 4 |
| Telegram Bot | 1 | 8 | — | — | 9 |
| **Totals** | **32** | **60** | **22** | **6** | **120** |

Plus: 3 Jupiter (external) endpoints, 6 WebSocket channels (5 public + 1 authenticated), Solana RPC.

---

## Appendix A — Backend Architecture (from Go API)

> Source: `terminal-api` Go codebase — authoritative response schemas, enum values, and architecture details not visible from frontend code alone.

### Backend Microservices

The QS backend is a Go monorepo with **13 microservices**:

| Service | Role |
|---------|------|
| `public_api` | Unauthenticated read endpoints (`public/`) |
| `private_api` | Authenticated read/write endpoints (`private/`) |
| `tx_api` | Transaction execution endpoints (`tx/`) |
| `auth_api` | Authentication flows (`auth/`) |
| `indexer` | Indexes on-chain data via Geyser gRPC streaming |
| `streamer` | WebSocket server for real-time subscriptions |
| `executor` | Transaction builder and submitter |
| `filterer` | Token table/memescope filtering engine |
| `keeper` | Background maintenance jobs |
| `cron` | Scheduled tasks |
| `accountant` | Fee tracking and cashback calculations |
| `account_cache` | Valkey (Redis-fork) cache layer |
| `proxy` | API gateway / routing |

### External Service Integrations

| Service | Purpose | Data Provided |
|---------|---------|---------------|
| **Jupiter** (`lite-api.jup.ag`) | DEX aggregator | Swap quotes, token search, organic scores |
| **Dexscreener** | Token verification | `dexscreener_verified` flag on metadata |
| **Helius RPC** | Solana RPC provider | On-chain data, transaction sending |
| **Toto** | Social analytics | Twitter/social mention counts across timeframes |
| **Fomo.family** | Trading platform data | Fomo trader classification |
| **Telegram Bot API** | Notifications & sharing | Token alerts, chat sharing, event feeds |
| **Image Processor** | Token logo handling | Base64 image conversion, proxied logos |
| **Launchpad APIs** | Platform metadata | Pump.fun, Raydium, Meteora launch data |

### Cache Architecture

```
Geyser gRPC → Indexer → Valkey (Redis-fork) Cache → API Services → Frontend
```

Valkey serves as the primary data store for live token data, prices, and trade info. The indexer continuously processes blockchain events and updates the cache.

---

## Appendix B — Exact Response Schemas (Go Types)

### LiveTokenInfo (core token response)

```jsonc
// Returned by: public/getLiveTokenInfo, public/getLiveTokenInfos
{
  "sol_price_usd": 150.25,            // float64 — current SOL/USD price
  "mint_transaction": {                // TokenMintTransaction — token creation details
    "index": 123456,                   // uint64
    "signature": "5xY3...",            // solana.Signature (base58)
    "slot": 280000000,                 // uint64
    "transaction_index": 2,            // uint16
    "instruction_index": 0,            // uint8
    "ts": 1708000000,                  // uint32 (unix timestamp)
    "deployer": "Abc1...",             // solana.PublicKey (base58)
    "bonding_curve": "Def2...",        // solana.PublicKey
    "quote_asset": "sol",              // QuoteAsset enum
    "platform": "pumpfun",            // Platform enum
    "token_version": "spl"             // TokenProgramVersion enum
  },
  "mint_info": {                       // TokenMintInfo — on-chain mint account
    "freeze_authority": "...",         // solana.PublicKey
    "decimals": 6,                     // uint8
    "supply": 1000000000000000,        // uint64
    "is_initialized": true,            // bool
    "mint_authority": "..."            // solana.PublicKey
  },
  "token_price_info": {                // TokenPriceInfo — live pricing
    "mint": "Abc1...",                 // solana.PublicKey
    "holders": 1500,                   // int64
    "live_trading_pair": {             // LiveTradingPair
      "mint": "Abc1...",
      "pair": "Xyz9...",               // LP pair address
      "pair_create_index": 789,        // uint64
      "pair_create_signature": "...",  // solana.Signature
      "pair_create_ts": 1708000100,    // uint32
      "platform": "raydium_v4"        // Platform enum (current exchange)
    },
    "daily_trade_info": {              // DailyTokenTradeInfo — 24h OHLCV
      "last_ts": 1708001000,           // uint32
      "daily_change_proportion": 0.15, // float64 (0.15 = +15%)
      "daily_amplitude": 0.45,         // float64
      "daily_open_price": 0.00001,     // float64 (USD)
      "daily_open_price_sol": 0.0000001,
      "daily_high_price": 0.000015,
      "daily_high_price_sol": 0.00000015,
      "daily_low_price": 0.000008,
      "daily_low_price_sol": 0.00000008,
      "daily_volume_quote": 50000.0,   // float64 (in quote asset)
      "daily_volume_sol": 500.0,
      "daily_tx_count": 12000,         // int64
      "last_price_quote": 0.000012,
      "last_price_sol": 0.00000012,
      "last_sol_price_usd": 150.25
    },
    "ath_price_usd": 0.00002           // float64 — all-time high in USD
  },
  "token_metadata": {                  // Metadata — on-chain + off-chain
    "mint": "Abc1...",
    "name": "Example Token",
    "symbol": "EXMPL",
    "metadata_uri": "https://...",
    "description": "A test token",     // may be empty
    "twitter": "https://x.com/...",    // may be empty
    "website": "https://...",          // may be empty
    "telegram": "https://t.me/...",    // may be empty
    "image_uri": "https://...",        // may be empty
    "dexscreener_verified": false,     // bool — from Dexscreener API
    "platform": "pumpfun",            // Platform where minted
    "exchange": "raydium_v4"           // Platform where trading
  },
  "quote_asset_info": {                // QuotePriceInfo
    "last_quote_price_usd": 150.25     // float64 — SOL price at time of last trade
  }
}
```

### MinimalTokenInfo (compact variant)

```jsonc
// Used in table rows, search results, watchlists
{
  "mint": "Abc1...",
  "pair": "Xyz9...",
  "deployer": "Def2...",
  "create_ts": 1708000100,
  "decimals": 6,
  "supply": 1000000000000000,
  "name": "Example Token",
  "symbol": "EXMPL",
  "image_uri": "https://...",
  "price_usd": 0.0018,
  "quote_asset_info": { "last_quote_price_usd": 150.25 },
  "launchpad": "pumpfun",
  "exchange": "raydium_v4",
  "token_version": "spl"
}
```

### SwapQuote

```jsonc
// Returned by: tx/getSwapQuote
{
  "input_mint": "So11...",
  "output_mint": "Abc1...",
  "swap_protocol": "raydium_v4",       // SwapProtocol enum (10 values)
  "compute_unit_limit_est": 200000,    // uint64
  "quickscope_fee_info": {
    "fee_mint": "So11...",
    "user_fee_rate_bps": 100,          // uint64 — fee in basis points
    "fee_amount_sol": 10000            // uint64 — fee in lamports
  },
  "amount_in": 100000000,             // uint64 — lamports
  "amount_in_max": 105000000,         // uint64 — with slippage
  "amount_out": 5000000000,           // uint64 — token smallest units
  "amount_out_min": 4750000000        // uint64 — with slippage
}
```

### Pnl (Profit & Loss per position)

```jsonc
// Returned inside: TraderPositions, WalletsPositions
{
  "bought_base": 1000000000,          // uint64 — total tokens bought
  "bought_quote": 0.5,                // float64 — total quote spent
  "bought_usd": 75.0,                 // float64 — total USD spent
  "sold_base": 500000000,
  "sold_quote": 0.4,
  "sold_usd": 60.0,
  "balance": 500000000,               // uint64 — remaining token balance
  "position_value_quote": 0.45,       // float64 — current value in quote
  "average_entry_price_quote": 0.0000005,
  "average_exit_price_quote": 0.0000008,
  "realized_pnl_quote": -0.1,
  "realized_pnl_change_proportion": -0.2,
  "unrealized_pnl_quote": 0.15,
  "unrealized_pnl_change_proportion": 0.5,
  "total_pnl_change_proportion": 0.1,
  "total_pnl_quote": 0.05,
  "first_trade_ts": 1708000200,       // uint32
  "last_trade_ts": 1708001000         // uint32
}
```

### Candle

```jsonc
// Returned by: public/getTokenCandles, public/getTokenCandlesReverse
{
  "ts": 1708000000,                   // uint32 — candle open timestamp
  "open": 0.00001,                    // float64
  "high": 0.000015,
  "low": 0.000008,
  "close": 0.000012,
  "volume": 50000.0,                  // float64 — in quote asset
  "buy_volume": 30000.0,
  "sell_volume": 20000.0,
  "num_trades": 500,                  // uint32
  "num_buys": 300,
  "num_sells": 200
}
```

### AccountTradeSettings (exact defaults)

```jsonc
// Returned by: private/getAccountTradeSettings
// Reset values from: private/resetAccountTradeSettings
{
  "buy_presets": [
    { "priority_fee_lamports": 1000000, "jito_tip_lamports": 1000000, "slippage_bps": 500 },
    { "priority_fee_lamports": 10000000, "jito_tip_lamports": 10000000, "slippage_bps": 2000 },
    { "priority_fee_lamports": 0, "jito_tip_lamports": 0, "slippage_bps": 300 }
  ],
  "sell_presets": [
    { "priority_fee_lamports": 1000000, "jito_tip_lamports": 1000000, "slippage_bps": 500 },
    { "priority_fee_lamports": 10000000, "jito_tip_lamports": 10000000, "slippage_bps": 2000 },
    { "priority_fee_lamports": 0, "jito_tip_lamports": 0, "slippage_bps": 300 }
  ],
  "quick_buy_options_lamports": [100000000, 250000000, 500000000, 1000000000, 2500000000, 5000000000],
  "quick_sell_options_bps": [100, 500, 1000, 2500, 5000, 10000],
  "quick_buy_amount_lamports": 100000000,
  "quick_sell_bps": 10000,
  "batch_trade_mode": "exact",
  "stealth_buy_variance": 0,
  "stealth_sell_variance": 0,
  "stealth_ignore_100_sell": true,
  "stealth_buy_delay_ms": 0,
  "stealth_sell_delay_ms": 0,
  "stealth_insta_threshold": 0,
  "split_deviation": 0
}
```

### AccountSettings

```jsonc
// Returned by: private/getAccountSettings
{
  "price_display_mode": "price",       // "price" | "market_cap"
  "language": "en",                    // "en"|"cs"|"de"|"fr"|"pt"|"ru"|"zh"
  "timezone": "local",                 // "local" | "utc"
  "default_telegram_share_chat_ids": [], // int64[] (max 10)
  "token_image_display_mode": "circle", // "circle" | "square"
  "theme": "dark",                     // "dark"|"axiom"|"photon"|"terminal"
  "notification_settings": {}          // json.RawMessage (opaque JSON)
}
```

---

## Appendix C — Enum Reference

### Platform (Launchpad/Exchange)

Used in `mint_transaction.platform`, `live_trading_pair.platform`, `token_metadata.platform`:

| Value | Description |
|-------|-------------|
| `pumpfun` | Pump.fun launchpad |
| `pumpswap` | Pump.fun AMM (post-bond) |
| `raydium` | Raydium DEX |
| `moonshot` | Moonshot launchpad |
| `launchlab` | Raydium LaunchLab |
| `believe` | Believe launchpad |
| `meteora` | Meteora DEX |
| `virtuals` | Virtuals Protocol |
| `boop` | Boop launchpad |
| `letsbonk` | LetsBonk platform |
| `bonkbot` | BonkBot platform |

### SwapProtocol (10 values)

Used in `SwapQuote.swap_protocol`:

`quickscope`, `jupiter`, `pumpfun`, `pumpswap`, `launchlab`, `raydium_v4`, `raydium_cpmm`, `meteora_dbc`, `damm_v1`, `damm_v2`

### CandleGranularity (14 values)

Used in `public/getTokenCandles` `resolutionSeconds` param:

| Label | Seconds |
|-------|---------|
| 1s | 1 |
| 5s | 5 |
| 15s | 15 |
| 30s | 30 |
| 1m | 60 |
| 5m | 300 |
| 15m | 900 |
| 30m | 1800 |
| 1h | 3600 |
| 4h | 14400 |
| 6h | 21600 |
| 12h | 43200 |
| 1d | 86400 |
| 1w | 604800 |

### TransactionType

| Code | Meaning |
|------|---------|
| `"b"` | Buy |
| `"s"` | Sell |
| `"d"` | Deposit |
| `"w"` | Withdraw |

### QuoteAsset

| Value | Description |
|-------|-------------|
| `sol` | SOL (default) |
| `usdc` | USDC |
| `usdt` | USDT |

### TokenProgramVersion

| Value | Description |
|-------|-------------|
| `spl` | SPL Token (standard) |
| `token_2022` | Token-2022 (extensions) |

### TransactionStatus

| Value | Description |
|-------|-------------|
| `processed` | Transaction processed |
| `confirmed` | Transaction confirmed |
| `finalized` | Transaction finalized (irreversible) |
| `expired` | Transaction expired |

---

## Appendix D — WebSocket Channels (Complete)

The backend `streamer` service exposes **6 WebSocket channels** (5 public + 1 authenticated):

| Channel | Method Prefix | Auth | Params | Data | Used For |
|---------|--------------|------|--------|------|----------|
| Memescope Filter Updates | `public/memescopeFilterUpdates` | No | Filter config | Token updates matching filter | Discovery/Memescope |
| Slot Trade Updates | `public/slotTradeUpdates` | No | Slot/token config | Individual trade events | Live trade feed |
| Token Table Filter Updates | `public/tokenTableFilterUpdates` | No | Table filter | Token row updates | Token tables, token info |
| Token Trade | `public/tokenTrade` | No | Token mint | All trades for a specific token | Token detail page |
| Exchange Listings | `public/exchangeListings` | No | — | New DEX listings | Listings feed |
| Order Status Changes | `tx/orderStatusChanges` | Yes | — | Trigger order status updates | Order management |

> **iOS Note:** The frontend currently uses 3 of these channels. `tokenTrade` and `exchangeListings` are available but not subscribed in the web app. `orderStatusChanges` requires authentication.

---

## Appendix E — Authentication Details

### Token Lifetimes

| Token | Duration |
|-------|----------|
| Challenge | 5 minutes |
| Access Token | 15 minutes |
| Refresh Token | 30 days |
| Access Code (cross-device) | 30 seconds |

### Auth Flow

1. Client requests challenge via `auth/challenge` with wallet public key
2. Wallet signs the challenge message (Solana signature)
3. Client submits signed solution via `auth/solution`
4. Backend returns JWT (RS256) set as HTTP-only cookies
5. Access token auto-refreshes via `auth/refresh` before expiry
6. Cross-device auth uses short-lived access codes (30s TTL)

---

## Appendix F — Validation Constraints

| Constraint | Value | Applies To |
|-----------|-------|------------|
| Max holders per query | 250 | `public/getTokenHolders` |
| Default trader filter limit | 50 | `public/getTokenTraders` |
| Default trader sort | `pnl_sol` | `public/getTokenTraders` |
| Max telegram share chats | 10 | `AccountSettings.default_telegram_share_chat_ids` |
| Slippage range | 50–5000 bps | `ExecutionPreset.slippage_bps` |
| Quick buy options | 0–6 items | `AccountTradeSettings.quick_buy_options_lamports` |
| Quick sell options | 0–6 items | `AccountTradeSettings.quick_sell_options_bps` |
| Stealth variance range | 0–50% | `stealth_buy_variance`, `stealth_sell_variance` |
| Stealth delay range | 0–30000 ms | `stealth_buy_delay_ms`, `stealth_sell_delay_ms` |
| Stealth insta threshold | 0–25 wallets | `stealth_insta_threshold` |
| Split deviation | 0–100% | `split_deviation` |
| Batch trade modes | `"exact"` or `"split"` | `batch_trade_mode` |
