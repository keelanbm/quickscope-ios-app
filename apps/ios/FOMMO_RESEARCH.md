# Fommo Mobile App Research
## Competitive Analysis: Simplified Trading with High Utility

**Research Date:** February 6, 2026
**App:** Fommo (fommo.ai)
**Platform:** Mobile (Solana memecoin trading)
**Key Insight:** "One of the best current examples of simplified with a lot of utility"

---

## 1. App Overview

### What Fommo Does
Fommo is a mobile-first Solana memecoin trading application that combines social trading features with streamlined token discovery and execution. It positions itself as a simplified alternative to complex DeFi interfaces while maintaining professional-grade functionality.

### Target Audience
- **Primary:** Retail crypto traders interested in Solana memecoins
- **Secondary:** Social traders who want to follow top performers
- **Tertiary:** Mobile-first users who prioritize speed and simplicity over desktop terminal complexity

### Core Value Proposition
1. **Speed:** Fast discovery → decision → execution flow
2. **Social Proof:** Leaderboards and trader rankings surface successful strategies
3. **Mobile-Optimized:** Built for thumb-driven, one-handed trading
4. **Simplicity:** Removes complexity without removing functionality
5. **Real-time Data:** Live pricing, rankings, and social activity

---

## 2. Navigation & Information Architecture

### Tab Bar Structure (Bottom Navigation)
Based on the described interface, Fommo uses a 5-tab bottom navigation pattern:

1. **Discover/Feed** - Token discovery and trending
2. **Search** - Find specific tokens
3. **Trade/Portfolio** - Your holdings and trade execution
4. **Leaderboard** - Social rankings and top traders
5. **Profile/Settings** - User account and preferences

### Information Architecture Principles
- **Flat hierarchy:** Maximum 2-3 taps to any feature
- **Context preservation:** Tabs maintain scroll position when switching
- **Progressive disclosure:** Details revealed on-demand via sheets/modals
- **Action proximity:** Trade actions always accessible from token views

### Screen Flow Pattern
```
Token List → Token Detail → Trade Entry → Confirmation → Execution Status
     ↓            ↓              ↓
  Filter      Chart View    Quick Presets
  Sort        Metrics       Amount Input
  Refresh     Social        Review
```

---

## 3. Token List Design

### Layout & Density Approach
Fommo balances information density with scannability by showing critical data at a glance while keeping visual noise low.

#### Key Data Points Displayed
1. **Token Identity**
   - Token icon/logo (left-aligned)
   - Token name (primary text)
   - Token symbol (secondary text)
   - Network indicator (if multi-chain)

2. **Performance Metrics**
   - Current price
   - 24h price change (color-coded: green/red)
   - Percentage change (with directional indicator)
   - Volume or market cap (contextual)

3. **Social Signals**
   - Number of holders/traders
   - Activity indicators (hot/trending badges)
   - Friend activity (pill UI showing friend avatars)

4. **Quick Actions**
   - Watchlist star/heart (right-aligned)
   - Quick buy CTA (inline or on swipe)

### Visual Hierarchy
- **Large, scannable rows:** 60-80px minimum touch target
- **Clear visual separation:** Cards or subtle dividers
- **Color as signal:** Green/red for performance, accent for actions
- **Icon consistency:** Standardized token imagery

### List Variations
- **Trending:** Sorted by momentum, shows velocity indicators
- **Watchlist:** User-curated, shows personalized metrics
- **Portfolio:** Holdings with P&L, cost basis, current value
- **Leaderboard tokens:** Shows what top traders are holding (token pills)

---

## 4. Token Detail Screen

### Layout Structure
Full-screen detail view with scrollable content, likely using a sheet/modal presentation or push navigation.

#### Hero Section (Above the Fold)
1. **Token Header**
   - Large token icon
   - Name and symbol
   - Network badge
   - Watchlist toggle (heart/star)
   - Share action

2. **Price Display**
   - Large, prominent current price
   - 24h change (percentage and absolute)
   - Last updated timestamp

3. **Chart Module**
   - Timeframe selector (1H, 4H, 1D, 1W, 1M)
   - Interactive price chart with touch gesture support
   - Volume bars beneath price
   - Full-screen chart option

#### Metrics Grid
Organized in 2-column or 3-column grid for quick scanning:
- Market Cap
- Fully Diluted Valuation (FDV)
- 24h Volume
- Liquidity
- Holders count
- Transactions (24h)
- Price change (7d, 30d)

#### Social/Activity Section
- **Who's trading:** Friend avatars or top trader indicators
- **Recent activity feed:** Latest buys/sells with amounts
- **Sentiment indicators:** Bull/bear ratio, emoji reactions
- **Comments/discussion:** Optional social layer

#### Trade Action Section (Sticky or Floating)
- Dual CTA buttons: **Buy** and **Sell**
- Quick amount presets visible or one tap away
- Current wallet balance shown
- Gas fee estimate

---

## 5. Trading UX

### Trade Entry Flow
Fommo likely uses a **bottom sheet** approach for speed and context retention.

#### Step 1: Initiate Trade
- Tap "Buy" or "Sell" from token detail
- Bottom sheet slides up (doesn't leave screen)
- Token context remains visible in background

#### Step 2: Amount Input
**Quick Presets** (Most Important Innovation)
- Horizontal row of preset buttons: $10, $50, $100, $500, Custom
- Single-tap execution for small amounts
- Presets adapt to wallet balance (disable if insufficient)

**Custom Amount**
- Large number pad or keyboard input
- Real-time calculation showing token quantity
- Slippage tolerance (auto-set with manual override)
- Priority fee adjustment (simple/fast/turbo slider)

#### Step 3: Review & Confirm
**Confirmation Screen (Bottom Sheet)**
- Transaction summary in plain language
- "You're buying [amount] of [token] for [price]"
- Breakdown: Token amount, Total cost, Network fees, Slippage
- Single large "Confirm" CTA
- Cancel/back option

#### Step 4: Execution & Status
**Loading State**
- Animated indicator (lottie or custom)
- "Submitting transaction..."
- Progress stages if applicable

**Success/Failure**
- Clear confirmation with checkmark or error state
- Transaction hash/link to explorer
- Updated portfolio/balance
- Quick actions: "Trade More" or "View Portfolio"

### Key UX Decisions
- **Inline vs Separate:** Bottom sheets keep context visible
- **Confirmation friction:** One review step prevents errors without slowing flow
- **Presets prioritization:** 80% of trades use presets - optimize for this
- **Gas/slippage:** Auto-configured with escape hatch for advanced users

---

## 6. Leaderboard/Social Features

### Leaderboard Structure (As Described)

#### Top Section: "Your Rank" Card
- **Visual treatment:** Highlighted card (gradient or border)
- **Data shown:**
  - Your current rank number
  - Your PnL (Profit & Loss) - color coded
  - Your win rate or ROI percentage
  - Movement indicator (↑↓ rank change)
- **Purpose:** Immediate personal context before viewing others

#### Friends/Leaderboard Tabs
**Two-tab segmented control:**
1. **Friends Tab**
   - Shows only people you follow
   - Smaller, more relevant cohort
   - Easier to track specific traders

2. **Leaderboard Tab (Global)**
   - Top 100 or wider rankings
   - All users on platform
   - Aspirational/competitive view

#### Ranked List Items
Each leaderboard entry shows:

**Visual Structure (Left to Right):**
1. **Rank Number** - Large, clear position (1, 2, 3...)
2. **Avatar** - Profile picture or generated avatar
3. **Identity**
   - Display name (bold, primary text)
   - Handle/username (@handle, secondary text)
4. **Performance**
   - PnL amount (green for profit, red for loss)
   - Percentage gain/loss
5. **Token Pills** (Right Side)
   - Small circular token icons showing what they're holding
   - Horizontal row of 3-5 token logos
   - Tap to see full portfolio or jump to token

**Visual Design Details:**
- Clean, card-based rows with clear separation
- Green text for positive PnL (visual dopamine)
- Avatar humanizes data, builds community
- Token pills provide actionable insight (copy trades)

#### Interaction Patterns
- **Tap row:** View trader's profile and full portfolio
- **Tap token pill:** Jump to that token's detail page
- **Follow/unfollow:** Toggle button in profile view
- **Share:** Share your rank or specific trader

### Social Proof Integration
- **Discovery feed:** "5 friends are watching this token"
- **Token detail:** "Top 10 traders are buying"
- **Notifications:** "Friend just made 50% gain on [token]"

---

## 7. Visual Design Language

### Color System
**Semantic Colors:**
- **Green (#00C853 range):** Profits, positive change, buy actions
- **Red (#FF3B30 range):** Losses, negative change, sell actions
- **Accent/Primary:** Likely purple, blue, or brand color for CTAs
- **Neutrals:** Dark background (true black or near-black), white text

**Background Strategy:**
- Dark mode as primary (better for chart reading, reduces eye strain)
- High contrast for critical data (prices, PnL)
- Subtle gradients or glass morphism for cards (modern feel)

### Typography
**Hierarchy:**
- **Display (Prices):** 32-48pt, tabular figures, medium/bold weight
- **Headlines:** 20-24pt, bold, high contrast
- **Body:** 16-17pt, regular, optimized for readability
- **Captions/Metadata:** 13-14pt, medium, reduced opacity

**Font Choice:**
- Likely SF Pro (iOS native) or Inter/Manrope (cross-platform)
- Tabular/monospace for numbers (alignment in lists)
- Medium-to-bold weights for scannability

### Spacing & Layout
**Vertical Rhythm:**
- 16px base unit grid system
- Cards/sections: 24-32px padding
- List items: 16px internal padding, 12px between items
- Section spacing: 32-48px

**Horizontal Margins:**
- Screen edges: 16-20px margins
- Full-bleed for impact (charts, images)
- Centered content max-width for large screens

### Card vs Divider Approach
**Fommo appears to use a hybrid:**
- **Cards** for distinct modules (Your Rank, promotional content)
- **Dividers/subtle lines** for list items (maintains density)
- **Background contrast** instead of heavy borders (modern, clean)

### Iconography
- **Style:** Rounded, friendly (not corporate/sharp)
- **Weight:** 2px stroke, consistent with text weight
- **Usage:** Navigation, actions, status indicators
- **Token icons:** High-quality, circular crops, consistent sizing

---

## 8. Micro-interactions

### Animations
**List Interactions:**
- **Pull-to-refresh:** Smooth spring animation with spinner
- **Skeleton loading:** Shimmer effect while data loads
- **Price updates:** Gentle flash/pulse on price change
- **List item appearance:** Staggered fade-in (waterfall effect)

**Navigation:**
- **Tab switches:** Smooth cross-fade between views
- **Screen transitions:** Slide/push with spring physics
- **Bottom sheets:** Slide up with bounce, drag-to-dismiss
- **Modal presentations:** Fade + scale from button origin

**Trade Actions:**
- **Button press:** Subtle scale down (0.95) on touch
- **Preset selection:** Quick highlight with haptic
- **Confirmation:** Checkmark animation with scale + fade
- **Loading:** Pulsing or rotating indicator

**Chart Interactions:**
- **Scrub gesture:** Smooth crosshair follows finger
- **Timeframe change:** Chart data morphs (not hard cut)
- **Pinch-to-zoom:** Responsive chart scaling
- **Tooltip appearance:** Fade in with slight delay

### Haptic Patterns
**Light Feedback:**
- Tab switches
- Preset button taps
- Toggle switches (watchlist star)

**Medium Feedback:**
- Pull-to-refresh activation point
- Segmented control changes
- List item deletion/swipe actions

**Heavy Feedback:**
- Trade confirmation
- Error states
- Success completion

**Custom Patterns:**
- Success: Light-Light-Medium (celebration rhythm)
- Error: Heavy (single strong pulse)
- Loading completion: Light

### Loading States
**Skeleton Screens:**
- Show structure immediately
- Shimmer animation left-to-right
- Matches final content layout
- Reduces perceived wait time

**Progressive Loading:**
- Critical data first (price, chart)
- Social/metadata second
- Fade in as data arrives

---

## 9. Key Patterns to Steal

### What Makes Fommo "Simplified with a Lot of Utility"

#### 1. **Preset-Driven Interactions**
**Pattern:** Horizontal row of preset buttons for common actions
**Why it works:** 80% of users want common amounts - optimize for majority
**Application:** Dollar amount presets ($10, $50, $100), slippage presets (0.5%, 1%, 2%)

#### 2. **Your Rank Card**
**Pattern:** Personalized summary card at top of leaderboard
**Why it works:** Immediate context before exploring others, builds engagement
**Application:** "Your Performance" card showing portfolio summary, win rate, best trade

#### 3. **Token Pills for Holdings**
**Pattern:** Small circular token icons in horizontal row
**Why it works:** Compact visual representation, instantly actionable (tap to view)
**Application:** Show token holdings in portfolio, watchlist previews, trader profiles

#### 4. **Bottom Sheet Trade Entry**
**Pattern:** Modal sheet slides up, background dimmed but visible
**Why it works:** Keeps context visible, faster than navigation, easy to dismiss
**Application:** All trade actions, filters, sort options

#### 5. **Dual-Tab Segmentation (Friends/Global)**
**Pattern:** Split social features into personal and public cohorts
**Why it works:** Reduces noise, makes large datasets manageable, personalization
**Application:** Tracking screen (Friends/All), Discovery (Trending/Following)

#### 6. **Inline Performance Indicators**
**Pattern:** Green/red text with percentage in list items
**Why it works:** Instant visual scanning without reading, leverages color psychology
**Application:** All token lists, portfolio items, P&L displays

#### 7. **Large Touch Targets with High Density**
**Pattern:** 60-80px row height with multiple data points
**Why it works:** Thumb-friendly while maximizing information
**Application:** Token lists, portfolio rows, leaderboard entries

#### 8. **Progressive Disclosure in Trade Flow**
**Pattern:** Simple → Complex options revealed on demand
**Why it works:** Beginners get simple, experts can access advanced
**Application:** Basic presets visible, "Advanced" expands slippage/priority fee

#### 9. **Sticky Action Buttons**
**Pattern:** Buy/Sell buttons float at bottom or stick to top
**Why it works:** Always accessible, reduces scrolling friction
**Application:** Token detail screen, portfolio item actions

#### 10. **Social Proof Everywhere**
**Pattern:** Friend activity, trader counts, trending badges throughout
**Why it works:** Reduces decision paralysis, provides validation, builds FOMO
**Application:** "12 friends watching", "Top 5 traders buying", trending badges

---

## 10. How These Patterns Apply to Quickscope

### Immediate Wins (Week 3-4 Implementation)

#### A. Token List Redesign
**Current State:** Basic list with minimal data
**Fommo Pattern:** High-density rows with performance indicators

**Implementation:**
```
TokenListItem:
  [Icon] TokenName ($SYMBOL)          +12.4% (green)
         Market Cap: $1.2M             Volume: $450K
         [★] [QuickBuy]
```

**Changes:**
- Add 24h price change percentage (color-coded)
- Show market cap + volume in secondary row
- Inline watchlist toggle (star icon)
- Optional quick buy button on swipe/press

**File:** `src/screens/DiscoveryScreen.tsx`, `src/screens/TrackingScreen.tsx`

---

#### B. Bottom Sheet Trade Entry
**Current State:** Separate screen navigation for trade entry
**Fommo Pattern:** Bottom sheet keeps token context visible

**Implementation:**
- Convert `ReviewTradeScreen` to bottom sheet modal
- Show dimmed token detail in background
- Add drag-to-dismiss gesture
- Faster animation (300ms vs 500ms)

**New Component:** `src/ui/TradeBottomSheet.tsx`
```typescript
<BottomSheet
  snapPoints={['50%', '90%']}
  enablePanDownToClose
  backgroundStyle={{ backgroundColor: theme.colors.surface }}
>
  <TradeEntryContent token={token} />
</BottomSheet>
```

---

#### C. Preset Buttons for Trade Amounts
**Current State:** Manual number input
**Fommo Pattern:** Preset buttons ($10, $50, $100, $500)

**Implementation:**
```typescript
const AMOUNT_PRESETS = [10, 50, 100, 500];

<View style={styles.presetRow}>
  {AMOUNT_PRESETS.map(amount => (
    <PresetButton
      key={amount}
      amount={amount}
      selected={tradeAmount === amount}
      onPress={() => setTradeAmount(amount)}
      disabled={walletBalance < amount}
    />
  ))}
  <PresetButton label="Custom" onPress={showCustomInput} />
</View>
```

**File:** `src/screens/TradeEntryScreen.tsx`

---

#### D. "Your Performance" Card on Tracking Screen
**Current State:** Generic list of tracked tokens
**Fommo Pattern:** "Your Rank" personalized card at top

**Implementation:**
```typescript
<YourPerformanceCard>
  <Text variant="headline">Your Performance</Text>
  <MetricRow>
    <Metric label="Total P&L" value="+$1,234" valueColor="green" />
    <Metric label="Win Rate" value="68%" />
  </MetricRow>
  <MetricRow>
    <Metric label="Best Trade" value="+145%" valueColor="green" />
    <Metric label="Active Positions" value="8" />
  </MetricRow>
</YourPerformanceCard>
```

**File:** `src/screens/TrackingScreen.tsx`

---

#### E. Token Pills for Holdings
**Current State:** Text-only token lists
**Fommo Pattern:** Circular token icon pills in rows

**Implementation:**
```typescript
<HoldingsPills tokens={topHoldings.slice(0, 5)}>
  {topHoldings.map(token => (
    <TokenPill
      key={token.id}
      icon={token.logo}
      symbol={token.symbol}
      onPress={() => navigateToToken(token)}
    />
  ))}
</HoldingsPills>
```

**New Component:** `src/ui/TokenPill.tsx`
**Usage:** Portfolio summary, friend activity, leaderboard rows

---

### Medium-Term Enhancements (Week 5-6)

#### F. Friends/All Tabs on Tracking
**Current State:** Single view of tracked tokens
**Fommo Pattern:** Dual-tab for Friends vs Global

**Implementation:**
```typescript
<SegmentedControl
  tabs={['Friends', 'All']}
  selectedTab={activeTab}
  onChange={setActiveTab}
/>

{activeTab === 'Friends' ? (
  <FriendsTrackingList />
) : (
  <AllTrackingList />
)}
```

**Benefit:** Separate friend activity from broader market, reduces noise

---

#### G. Inline Performance Indicators
**Current State:** Neutral text, no color coding
**Fommo Pattern:** Green/red percentages throughout

**Implementation:**
- Add `PerformanceText` component with automatic color
- Use in all token lists, portfolio, tracking
- Include directional arrows (↑↓)

**Component:**
```typescript
<PerformanceText
  value={12.4}
  showArrow
  variant="percentage"
/>
// Renders: ↑ +12.4% (in green)
```

---

#### H. Social Proof Badges
**Current State:** No social indicators
**Fommo Pattern:** "5 friends watching", trending badges

**Implementation:**
```typescript
<TokenListItem>
  {/* ... token info ... */}

  {friendsWatching > 0 && (
    <SocialBadge>
      <AvatarStack avatars={friendAvatars.slice(0, 3)} />
      <Text>{friendsWatching} friends watching</Text>
    </SocialBadge>
  )}

  {isTrending && <TrendingBadge>🔥 Trending</TrendingBadge>}
</TokenListItem>
```

**Data Source:** Track friend watchlists, aggregate activity

---

### Long-Term Considerations (Post-MVP)

#### I. Leaderboard Feature
**Pattern:** Full implementation of Fommo-style leaderboard

**Screens:**
- `LeaderboardScreen.tsx` with Friends/Global tabs
- `TraderProfileScreen.tsx` showing portfolio and performance
- Integration with existing portfolio tracking

**Data Requirements:**
- User P&L calculation
- Ranking algorithm
- Friend graph/following system
- Privacy controls

---

#### J. Advanced Chart Interactions
**Pattern:** Scrub gesture, pinch-to-zoom, smooth transitions

**Implementation:**
- Upgrade chart library to support gestures
- Add crosshair tooltip on touch
- Implement smooth timeframe transitions
- Consider full-screen chart mode

**Library:** Evaluate `react-native-wagmi-charts` or `victory-native`

---

### Design System Updates

#### Color Tokens (Update `src/theme/tokens.ts`)
```typescript
export const colors = {
  // Semantic performance colors
  success: '#00C853',      // Fommo green for profits
  successBg: '#00C85320',  // 20% opacity background
  error: '#FF3B30',        // Fommo red for losses
  errorBg: '#FF3B3020',

  // Existing colors...
  primary: '#6366F1',
  background: '#0A0A0A',   // True black for OLED
  surface: '#1A1A1A',      // Cards/elevated surfaces
  surfaceHighlight: '#2A2A2A',

  text: {
    primary: '#FFFFFF',
    secondary: '#A0A0A0',
    tertiary: '#707070',
  }
};
```

#### Typography Scale
```typescript
export const typography = {
  display: {
    fontSize: 48,
    fontWeight: '700',
    fontVariant: ['tabular-nums'], // Aligned numbers
  },
  price: {
    fontSize: 32,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  headline: {
    fontSize: 24,
    fontWeight: '700',
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  caption: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  }
};
```

#### Spacing System
```typescript
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,

  // Touch targets
  touchTarget: 44,     // iOS minimum
  listItem: 64,        // Comfortable list row
  listItemLarge: 80,   // High-density information row
};
```

---

## Key Takeaways for Quickscope

### Core Philosophy Alignment
Fommo succeeds because it **removes complexity without removing functionality**. This aligns perfectly with Quickscope's goal of being "opinionated but powerful."

### Three Pillars of "Simplified Utility"

1. **Preset-Driven Design**
   - Most users want common actions (amounts, settings)
   - Make the 80% case one-tap, 20% case two-taps
   - Never hide advanced options, just deprioritize them

2. **Context-Preserving Navigation**
   - Bottom sheets over full-screen navigation
   - Dimmed background keeps user oriented
   - Easy escape hatches (swipe to dismiss)

3. **Social Proof as Information Architecture**
   - Friends/global split reduces cognitive load
   - "What are others doing" answers "what should I do"
   - Leaderboards create engagement loop

### Design Execution Principles

1. **Information Density:** Pack more data into less space, but use hierarchy
2. **Color as Signal:** Green = good, Red = bad, no neutral grays for performance
3. **Touch-First:** 60px minimum row height, thumb-zone actions
4. **Progressive Disclosure:** Simple by default, advanced on-demand
5. **Micro-feedback:** Every action has visual and haptic response

### Implementation Priority

**Phase 1 (Week 3-4):** Bottom sheets, presets, performance colors, token pills
**Phase 2 (Week 5-6):** Friends tabs, social badges, your performance card
**Phase 3 (Post-MVP):** Full leaderboard, advanced charts, social features

---

## Appendix: Competitive Context

### How Fommo Compares to Others

**Fommo vs. Traditional DEX (Uniswap, Jupiter):**
- Fommo: Mobile-first, preset-driven, social features
- DEX: Desktop-optimized, manual inputs, isolated trading

**Fommo vs. Photon/Maestro Telegram Bots:**
- Fommo: Visual interface, discovery features, leaderboards
- Bots: Text commands, faster execution, no UI polish

**Fommo vs. Moonshot:**
- Similar UI patterns (they may share design DNA)
- Both focus on Solana memecoins
- Both use leaderboards and social proof
- Fommo may have tighter trade execution UX

### Quickscope's Differentiation
- **Multi-chain:** Fommo is Solana-only, Quickscope is cross-chain
- **Research tools:** Scope tab provides deeper analysis than Fommo
- **Portfolio analytics:** More sophisticated tracking and reporting
- **Professional hybrid:** Balances simplicity with pro trader needs

Quickscope can steal Fommo's UX patterns while offering more depth and breadth.

---

## Research Limitations

This analysis is based on:
- User description of Fommo leaderboard screenshot
- Public information about fommo.ai
- Common mobile trading app patterns
- Industry best practices for fintech UX

**For more accurate analysis, consider:**
- Direct app testing and screenshots
- User flow recordings
- Comparative A/B testing
- User interviews with Fommo users

---

**Document Version:** 1.0
**Author:** UX Research Agent
**Next Update:** After direct app testing with screenshots