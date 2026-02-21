# Limit Orders — iOS Design

## Context

The web terminal supports limit buy, limit sell, and stop-loss orders via `tx/createTriggerOrder`. The iOS app only supports market orders. This design adds limit order creation, viewing, and cancellation to reach parity.

## Scope

- Market/Limit toggle in TradeBottomSheet
- Trigger MC input + expiration picker in limit mode
- Auto-detection of order type (limit_buy, limit_sell, stop_loss)
- Orders tab on Token Detail with All/This Token toggle
- Order cancellation
- No chart-draggable order lines (follow-up)

## API Layer

New file: `features/trade/triggerOrderService.ts`

### Endpoints

**`createTriggerOrder(rpcClient, params)`** — `tx/createTriggerOrder`
```typescript
type CreateTriggerOrderParams = {
  walletAddress: string;
  mint: string;
  orderType: 'limit_buy' | 'limit_sell' | 'stop_loss';
  inputAmount: number;        // SOL for buy, token amount for sell
  tokenDecimals: number;
  triggerPriceUSD: number;    // Calculated: triggerMC / tokenSupply
  expiresIn: number;          // Seconds (86400 = 1d, 604800 = 7d)
  slippageBps: number;
  priorityFeeLamports: number;
  jitoTipLamports: number;    // Default 0 for now
};
```

**`getTriggerOrders(rpcClient, params)`** — `tx/getTriggerOrders`
```typescript
type GetTriggerOrdersParams = {
  walletAddress: string;
  mint?: string;              // Optional: filter to specific token
  status?: OrderStatus[];     // Optional: filter by status
};
```

**`cancelTriggerOrder(rpcClient, orderId)`** — `tx/cancelTriggerOrder`

### Types

```typescript
type OrderType = 'limit_buy' | 'limit_sell' | 'stop_loss';

type OrderStatus = 'active' | 'executing' | 'filled' | 'cancelled' | 'expired' | 'failed';

type TriggerOrder = {
  uuid: string;
  userAccount: string;
  orderType: OrderType;
  mint: string;
  inputAmount: string;
  initialPriceUSD: number;
  triggerPriceUSD: number;
  expiresAt: number;          // Unix timestamp
  createdAt: number;
  updatedAt: number;
  status: OrderStatus;
  priorityFeeLamports: string;
  jitoTipLamports: string;
  slippageBps: number;
  signature: string | null;   // Set when filled
};
```

## UI Changes

### TradeBottomSheet — Limit Mode

Add segmented control at top: `Market | Limit`

When Limit selected, sheet shows:
1. Amount input (same as market — SOL for buy, % for sell)
2. Trigger MC input — numeric field, `$` prefix, "Target Market Cap" label
3. Expiration pills: `1d | 3d | 7d` (default 7d)
4. Dynamic button label:
   - `"Limit Buy at $X MC"` (buy side)
   - `"Limit Sell at $X MC"` (sell, trigger > current MC)
   - `"Stop Loss at $X MC"` (sell, trigger < current MC)

Tapping the button shows inline confirmation:
- Order type, amount, trigger MC, trigger price USD, expiration, slippage
- Confirm / Cancel buttons
- On confirm: calls `createTriggerOrder()`, shows success/error toast

### Token Detail — Orders Tab

New tab alongside Activity / Traders / Holders.

**Header:** Toggle pills `All Orders | This Token`
- All Orders: `getTriggerOrders({ walletAddress })`
- This Token: `getTriggerOrders({ walletAddress, mint })`

**Order row layout:**
```
[TokenAvatar 36x36] [Symbol]  [OrderType badge]  [Trigger MC]
                     [Status pill]  [Expires in Xd]  [Cancel icon]
```

**Status pills** (using design tokens):
- Active → `qsColors.accent` bg
- Executing → `qsColors.warning` bg
- Filled → `qsColors.buyGreen` bg
- Cancelled → `qsColors.layer3` bg
- Expired → `qsColors.layer3` bg
- Failed → `qsColors.sellRed` bg

**Cancel:** Inline icon button on active orders. Calls `cancelTriggerOrder(orderId)`. Optimistic removal + refetch.

**Empty state:** "No orders yet" with EmptyState component.

**Polling:** 10-second interval via `useEffect` + `setInterval`.

## Order Type Auto-Detection

```
Buy side → limit_buy
Sell side + triggerMC > currentMC → limit_sell
Sell side + triggerMC < currentMC → stop_loss
```

## Trigger Price Calculation

```
triggerPriceUSD = triggerMC / tokenSupply
```

Token supply from existing `liveTokenInfo.supply` already fetched on Token Detail.

## Validation

- `triggerMC > 0`
- Sufficient balance (SOL for buy, token for sell)
- `expiresIn` must be one of the preset values
- Wallet must be connected and authenticated

## Settings Integration

- Slippage + priority fee from active trade profile (P1/P2/P3)
- Jito tip defaults to 0
- Expiration default (7d) stored alongside trade settings in AsyncStorage

## Files to Create/Modify

| File | Action |
|------|--------|
| `features/trade/triggerOrderService.ts` | Create — API calls + types |
| `ui/TradeBottomSheet.tsx` | Modify — add Market/Limit toggle, limit mode UI |
| `screens/TokenDetailScreen.tsx` | Modify — add Orders tab |
| `ui/OrderRow.tsx` | Create — order list item component |
| `ui/OrdersTab.tsx` | Create — orders list with All/This Token toggle |
| `features/trade/tradeSettings.ts` | Modify — add default expiration setting |

## Verification

1. Create a limit buy order — verify it appears in Orders tab as Active
2. Create a limit sell order — verify order type auto-detects correctly
3. Create a stop loss — verify sell below current MC → stop_loss type
4. Cancel an active order — verify optimistic removal + status update
5. Toggle All/This Token — verify filtering works
6. Check expiration display — countdown should be accurate
7. TypeScript: `node apps/ios/node_modules/typescript/bin/tsc --noEmit --project apps/ios/tsconfig.json`
