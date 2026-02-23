# Quickscope Terminal — Data Sources Connection Map

> Visual architecture showing how the frontend connects to all data sources.

---

## High-Level Architecture

```mermaid
graph TB
    subgraph Client["Frontend (React + RTK Query)"]
        direction TB
        UI[UI Components / Screens]
        RTK[RTK Query Cache]
        WS_Client[WebSocket Client]
        Redux[Redux Store]
    end

    subgraph QS_Backend["QS Backend (VITE_API_HOST)"]
        direction TB
        AUTH_MOD["/auth/ module"]
        PUBLIC_MOD["/public/ module"]
        PRIVATE_MOD["/private/ module"]
        TX_MOD["/tx/ module"]
    end

    subgraph External["External Services"]
        JUP["Jupiter API\nlite-api.jup.ag"]
        SOL_RPC["Solana RPC\nVITE_SOLANA_RPC_ENDPOINT"]
    end

    subgraph QS_WS["QS WebSocket (VITE_WS_HOST/public)"]
        WS_SERVER[WebSocket Server]
    end

    UI --> RTK
    RTK -- "POST /{module}/?method=..." --> AUTH_MOD
    RTK -- "POST /{module}/?method=..." --> PUBLIC_MOD
    RTK -- "POST /{module}/?method=..." --> PRIVATE_MOD
    RTK -- "POST /{module}/?method=..." --> TX_MOD
    RTK -- "GET (REST)" --> JUP
    UI --> WS_Client
    WS_Client -- "subscribe/unsubscribe" --> WS_SERVER
    WS_SERVER -- "subscription events" --> WS_Client
    WS_Client --> Redux
    UI --> SOL_RPC

    style Client fill:#1a1a2e,stroke:#7766f7,color:#f8f7fb
    style QS_Backend fill:#16213e,stroke:#7766f7,color:#f8f7fb
    style External fill:#0f3460,stroke:#e94560,color:#f8f7fb
    style QS_WS fill:#16213e,stroke:#53d769,color:#f8f7fb
```

---

## API Slices → Backend Modules

```mermaid
graph LR
    subgraph RTK_Slices["RTK Query API Slices"]
        auth_api["auth-api"]
        account_api["account-api"]
        token_api["token-api"]
        tokens_api["tokens-api"]
        trade_api["trade-api"]
        trade_settings["trade-settings-api"]
        wallet_holdings["wallet-holdings-api"]
        token_watchlist["token-watchlist-api"]
        wallet_watchlist["wallet-watchlist-api"]
        token_alert["token-alert"]
        transactions["transactions-api"]
        candles["candles-api"]
        price_api["price-api"]
        search_api["search-api"]
        trader_api["trader-api"]
        referral["referral-api"]
        schema["schema-api"]
        telegram["telegram-bot-api"]
        jupiter["jupiter-api"]
    end

    subgraph Backend_Modules["QS Backend Modules"]
        AUTH["/auth/"]
        PUBLIC["/public/"]
        PRIVATE["/private/"]
        TX["/tx/"]
    end

    subgraph Ext["External"]
        JUP_EXT["Jupiter\nlite-api.jup.ag"]
    end

    auth_api --> AUTH
    account_api --> TX
    account_api --> PUBLIC
    account_api --> PRIVATE
    token_api --> PUBLIC
    tokens_api --> PUBLIC
    trade_api --> TX
    trade_settings --> PRIVATE
    wallet_holdings --> PUBLIC
    token_watchlist --> PUBLIC
    token_watchlist --> PRIVATE
    wallet_watchlist --> PUBLIC
    wallet_watchlist --> PRIVATE
    token_alert --> PRIVATE
    transactions --> PUBLIC
    candles --> PUBLIC
    price_api --> PUBLIC
    search_api --> PUBLIC
    trader_api --> PUBLIC
    referral --> PRIVATE
    referral --> TX
    schema --> PRIVATE
    telegram --> PUBLIC
    telegram --> PRIVATE
    jupiter --> JUP_EXT

    style AUTH fill:#e94560,color:#fff
    style PUBLIC fill:#53d769,color:#000
    style PRIVATE fill:#f5a623,color:#000
    style TX fill:#7766f7,color:#fff
    style JUP_EXT fill:#0f3460,color:#fff
```

---

## Authentication Flow

```mermaid
sequenceDiagram
    participant W as Wallet (Phantom/Solflare)
    participant App as Frontend
    participant BE as QS Backend

    App->>BE: auth/challenge { uri, account, scopes }
    BE-->>App: challenge string
    App->>W: Sign challenge
    W-->>App: Signed solution
    App->>BE: auth/solution { challenge, solution }
    BE-->>App: AuthTokens (cookies set)

    Note over App,BE: Subsequent requests use cookie auth

    App->>BE: auth/refresh
    BE-->>App: New AuthTokens

    App->>BE: auth/revoke { reason }
    BE-->>App: Session ended

    Note over App,BE: Cross-device flow
    App->>BE: auth/createAccessCode
    BE-->>App: { code, expires_at }
    App->>BE: auth/redeemAccessCode { code }
    BE-->>App: AuthTokens
```

---

## WebSocket Real-Time Data Flow

```mermaid
graph TB
    subgraph WS_Connection["WebSocket Connection (VITE_WS_HOST/public)"]
        direction LR
        SUB1["memescopeFilterUpdates"]
        SUB2["slotTradeUpdates"]
        SUB3["tokenTableFilterUpdates"]
    end

    subgraph Screens["Frontend Screens"]
        DISCO["Discovery / Memescope"]
        TRADE_FEED["Live Trade Feed"]
        TOKEN_TABLES["Token Tables"]
        TOKEN_INFO["Token Info Hooks"]
    end

    SUB1 -- "Token updates\n(new tokens, price changes)" --> DISCO
    SUB2 -- "Trade events\n(buys/sells in real-time)" --> TRADE_FEED
    SUB3 -- "Row updates\n(table data refresh)" --> TOKEN_TABLES
    SUB3 -- "Single token data\n(via useGetTokenInfoFromTokensTable)" --> TOKEN_INFO

    style WS_Connection fill:#16213e,stroke:#53d769,color:#f8f7fb
    style Screens fill:#1a1a2e,stroke:#7766f7,color:#f8f7fb
```

---

## Screen → Data Source Mapping

```mermaid
graph TB
    subgraph Screens["App Screens"]
        DISCOVERY["Discovery Screen"]
        TOKEN_DETAIL["Token Detail"]
        TRADING["Trading Screen"]
        PORTFOLIO["Portfolio / Holdings"]
        TRACKING["Tracking Screen"]
        SEARCH["Search"]
        SETTINGS["Settings"]
    end

    subgraph Data["Data Sources"]
        TI["token-api\ngetLiveTokenInfo"]
        TT["tokens-api\nfilterTokensTable"]
        WH["wallet-holdings-api\ngetAccountTokenHoldings"]
        TP["wallet-holdings-api\ngetTraderPositions"]
        TR["trade-api\nswap / getSwapQuote"]
        TW["token-watchlist-api\ngetAllTokenWatchlists"]
        WW["wallet-watchlist-api\ngetAllWalletWatchlists"]
        TX["transactions-api\nfilterTransactionsTable"]
        CH["candles-api\ngetTokenCandles"]
        PR["price-api\ngetLatestSolPrice"]
        SR["search-api\nsearch"]
        AC["account-api\ngetActiveWallets"]
        TS["trade-settings-api\ngetAccountTradeSettings"]
        JQ["jupiter-api\nswap quote"]
        WS_M["WS: memescopeFilterUpdates"]
        WS_T["WS: slotTradeUpdates"]
        WS_TT["WS: tokenTableFilterUpdates"]
    end

    DISCOVERY --> TT
    DISCOVERY --> WS_M
    DISCOVERY --> WS_TT
    DISCOVERY --> PR

    TOKEN_DETAIL --> TI
    TOKEN_DETAIL --> CH
    TOKEN_DETAIL --> TX
    TOKEN_DETAIL --> WS_T
    TOKEN_DETAIL --> PR

    TRADING --> TR
    TRADING --> JQ
    TRADING --> TS
    TRADING --> WH
    TRADING --> PR

    PORTFOLIO --> WH
    PORTFOLIO --> TP
    PORTFOLIO --> AC
    PORTFOLIO --> PR

    TRACKING --> TW
    TRACKING --> WW
    TRACKING --> WH
    TRACKING --> TP

    SEARCH --> SR
    SEARCH --> TI

    SETTINGS --> AC
    SETTINGS --> TS

    style Screens fill:#1a1a2e,stroke:#7766f7,color:#f8f7fb
    style Data fill:#16213e,stroke:#53d769,color:#f8f7fb
```

---

## Cache Invalidation Map

Shows which mutations invalidate which query caches:

```mermaid
graph LR
    subgraph Mutations["Mutations"]
        SWAP["tx/swap"]
        CREATE_WL["createTokenWatchlist"]
        ADD_TOKEN["addToTokenWatchlist"]
        TRANSFER["tx/transferSol/Spl"]
        HIDE["hideToken/unhideToken"]
        RENAME["renameWallet"]
        TRADE_SET["updateAccountTradeSettings"]
    end

    subgraph Caches["Invalidated Caches"]
        WH_CACHE["walletHoldings"]
        SOL_CACHE["accountSolBalances"]
        TW_CACHE["tokenWatchlist"]
        WALLET_CACHE["accountWallets"]
        HIDDEN_CACHE["hiddenTokens"]
        TS_CACHE["tradeSettings"]
    end

    SWAP --> WH_CACHE
    SWAP --> SOL_CACHE
    CREATE_WL --> TW_CACHE
    ADD_TOKEN --> TW_CACHE
    TRANSFER --> WH_CACHE
    TRANSFER --> SOL_CACHE
    HIDE --> HIDDEN_CACHE
    RENAME --> WALLET_CACHE
    TRADE_SET --> TS_CACHE
```

---

## Data Source Summary by Auth Level

```mermaid
pie title Endpoints by Auth Level (120 total)
    "Public (32)" : 32
    "Private (60)" : 60
    "Tx (22)" : 22
    "Auth (6)" : 6
```

Plus: 3 Jupiter external endpoints, 6 WebSocket channels (5 public + 1 authenticated), Solana RPC, 7 external service integrations.

---

## Backend Microservices Architecture

```mermaid
graph TB
    subgraph Blockchain["Solana Blockchain"]
        GEYSER["Geyser gRPC\n(streaming)"]
        RPC["Helius RPC\n(queries/tx submission)"]
    end

    subgraph Backend["QS Backend (Go Monorepo)"]
        direction TB
        subgraph Ingestion["Data Ingestion"]
            INDEXER["indexer\n(processes chain events)"]
            CRON["cron\n(scheduled tasks)"]
        end

        subgraph Cache["Cache Layer"]
            VALKEY["Valkey (Redis-fork)\n(primary data store)"]
        end

        subgraph API_Layer["API Services"]
            PUBLIC["public_api\n(32 endpoints)"]
            PRIVATE["private_api\n(60 endpoints)"]
            TX["tx_api\n(22 endpoints)"]
            AUTH["auth_api\n(6 endpoints)"]
        end

        subgraph Support["Support Services"]
            STREAMER["streamer\n(6 WS channels)"]
            EXECUTOR["executor\n(tx builder)"]
            FILTERER["filterer\n(table/scope engine)"]
            KEEPER["keeper\n(maintenance)"]
            ACCOUNTANT["accountant\n(fees/cashback)"]
            ACCOUNT_CACHE["account_cache"]
            PROXY["proxy\n(API gateway)"]
        end
    end

    subgraph External["External Services"]
        JUP_EXT["Jupiter API"]
        DEX["Dexscreener"]
        TOTO["Toto\n(social analytics)"]
        FOMO["Fomo.family"]
        TG["Telegram Bot API"]
        IMG["Image Processor"]
    end

    GEYSER --> INDEXER
    INDEXER --> VALKEY
    CRON --> VALKEY
    VALKEY --> PUBLIC
    VALKEY --> PRIVATE
    VALKEY --> TX
    VALKEY --> STREAMER
    VALKEY --> FILTERER
    TX --> EXECUTOR
    EXECUTOR --> RPC

    PUBLIC -.-> JUP_EXT
    PUBLIC -.-> DEX
    PUBLIC -.-> TOTO
    PUBLIC -.-> FOMO
    PRIVATE -.-> TG
    PUBLIC -.-> IMG

    style Blockchain fill:#0f3460,stroke:#e94560,color:#f8f7fb
    style Backend fill:#1a1a2e,stroke:#7766f7,color:#f8f7fb
    style External fill:#16213e,stroke:#f5a623,color:#f8f7fb
    style Cache fill:#2d1b69,stroke:#53d769,color:#f8f7fb
```

---

## External Service Connections

```mermaid
graph LR
    subgraph QS["QS Backend"]
        PUB["public_api"]
        PRIV["private_api"]
        IDX["indexer"]
    end

    JUP["Jupiter\nlite-api.jup.ag"]
    DEX["Dexscreener\nAPI"]
    TOTO["Toto\nSocial Analytics"]
    FOMO["Fomo.family\nTrader Data"]
    HELIUS["Helius RPC\nSolana Node"]
    TG["Telegram\nBot API"]
    IMG["Image\nProcessor"]
    LAUNCH["Launchpad APIs\nPump/Raydium/Meteora"]

    PUB -- "swap quotes\ntoken search" --> JUP
    PUB -- "verification\nstatus" --> DEX
    PUB -- "social mentions\n6 timeframes" --> TOTO
    PUB -- "fomo trader\nclassification" --> FOMO
    IDX -- "chain data\ntx submission" --> HELIUS
    PRIV -- "alerts\nchat sharing" --> TG
    PUB -- "logo proxying\nbase64 convert" --> IMG
    IDX -- "token metadata\nlaunch data" --> LAUNCH

    style QS fill:#1a1a2e,stroke:#7766f7,color:#f8f7fb
    style JUP fill:#0f3460,color:#f8f7fb
    style DEX fill:#0f3460,color:#f8f7fb
    style TOTO fill:#0f3460,color:#f8f7fb
    style FOMO fill:#0f3460,color:#f8f7fb
    style HELIUS fill:#0f3460,color:#f8f7fb
    style TG fill:#0f3460,color:#f8f7fb
    style IMG fill:#0f3460,color:#f8f7fb
    style LAUNCH fill:#0f3460,color:#f8f7fb
```

---

## WebSocket Channels (Complete — 6 total)

```mermaid
graph TB
    subgraph WS_Connection["WebSocket (VITE_WS_HOST)"]
        direction LR
        subgraph Public_WS["Public Channels (5)"]
            SUB1["memescopeFilterUpdates"]
            SUB2["slotTradeUpdates"]
            SUB3["tokenTableFilterUpdates"]
            SUB4["tokenTrade"]
            SUB5["exchangeListings"]
        end
        subgraph Auth_WS["Authenticated (1)"]
            SUB6["tx/orderStatusChanges"]
        end
    end

    subgraph Screens["Frontend Screens"]
        DISCO["Discovery / Memescope"]
        TRADE_FEED["Live Trade Feed"]
        TOKEN_TABLES["Token Tables"]
        TOKEN_INFO["Token Info Hooks"]
        TOKEN_DETAIL["Token Detail Page"]
        LISTINGS["Exchange Listings"]
        ORDERS["Order Management"]
    end

    SUB1 --> DISCO
    SUB2 --> TRADE_FEED
    SUB3 --> TOKEN_TABLES
    SUB3 --> TOKEN_INFO
    SUB4 -.-> TOKEN_DETAIL
    SUB5 -.-> LISTINGS
    SUB6 -.-> ORDERS

    style WS_Connection fill:#16213e,stroke:#53d769,color:#f8f7fb
    style Public_WS fill:#1a3a2e,stroke:#53d769,color:#f8f7fb
    style Auth_WS fill:#3a1a2e,stroke:#e94560,color:#f8f7fb
    style Screens fill:#1a1a2e,stroke:#7766f7,color:#f8f7fb
```

> **Dotted lines** = available but not currently used by the web frontend. iOS app can leverage these directly.

---

## Data Flow: Token Price Update

```mermaid
sequenceDiagram
    participant Chain as Solana (Geyser gRPC)
    participant Idx as Indexer
    participant Cache as Valkey Cache
    participant Stream as Streamer (WS)
    participant API as public_api
    participant App as Frontend/iOS App

    Chain->>Idx: New trade event (streaming)
    Idx->>Cache: Update token price/volume/OHLCV
    Idx->>Stream: Notify price change

    par WebSocket Push
        Stream->>App: tokenTableFilterUpdates subscription
    and HTTP Poll
        App->>API: public/getLiveTokenInfo
        API->>Cache: Read cached data
        Cache-->>API: LiveTokenInfo
        API-->>App: Response
    end
```

---

## iOS App Priority Mapping

Suggested priority for iOS implementation based on core trading functionality:

### P0 — Must Have (Core Trading Loop)

| Source | Why |
|--------|-----|
| `auth-api` | Login/session management |
| `account-api` (wallets) | Wallet management |
| `token-api` (getLiveTokenInfo) | Token data |
| `trade-api` (swap, quote) | Executing trades |
| `wallet-holdings-api` | Portfolio view |
| `price-api` | SOL price reference |
| `search-api` | Token discovery |
| WebSocket (tokenTableFilterUpdates) | Real-time prices |

### P1 — High Priority (Trading Experience)

| Source | Why |
|--------|-----|
| `candles-api` | Charts |
| `tokens-api` (filterTokensTable) | Token discovery tables |
| `trade-settings-api` | User trade preferences |
| `transactions-api` | Trade history |
| `token-watchlist-api` | Favorites/watchlists |
| `jupiter-api` | Alternative swap routing |
| WebSocket (slotTradeUpdates) | Live trade feed |

### P2 — Medium Priority (Full Feature Set)

| Source | Why |
|--------|-----|
| `wallet-watchlist-api` | Wallet tracking |
| `token-alert` | Price alerts |
| `referral-api` | Referral system |
| `trader-api` | Trader analytics |
| `telegram-bot-api` | Notifications |
| WebSocket (memescopeFilterUpdates) | Memescope |

### P3 — Low Priority / Web-Only

| Source | Why |
|--------|-----|
| `schema-api` | Desktop dashboard layouts |
