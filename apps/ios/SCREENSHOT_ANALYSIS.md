# Screenshot Analysis: Quickscope iOS Reference Apps

**Date:** February 6, 2026
**Purpose:** Detailed visual analysis of 5 reference screenshots to inform Quickscope iOS token detail, portfolio, and trading UX patterns.

---

## 1. Per-Screenshot Breakdown

### Screenshot 1: Copilot Finance - Investments Tab

**Visual Hierarchy:**
```
┌─────────────────────────────┐
│ ← Investments               │ Header (44px height)
├─────────────────────────────┤
│                             │
│   $9,488                    │ Portfolio value (32-36pt, bold)
│   +$3,243.07 (+51.07%)      │ Gain/loss (16-18pt, #00D084 green)
│                             │
│   [Area Chart - Gradient]   │ Chart (240px height)
│                             │
│   1W 1M 3M YTD 1Y          │ Timeframe pills (24px height)
│                             │
├─────────────────────────────┤
│ Your top movers today       │ Section heading (17pt, semibold)
│                             │
│ ┌──┐ ┌──┐ ┌──┐ ┌──┐       │ Horizontal scroll cards
│ │  │ │  │ │  │ │  │       │ (140px width, 96px height each)
│ └──┘ └──┘ └──┘ └──┘       │
│                             │
├─────────────────────────────┤
│ Accounts                    │ Section heading
│ [Account cards...]          │
└─────────────────────────────┘
```

**Measurements:**
- Background: Deep navy #0A0E1A
- Top padding: 16px
- Portfolio value: 32-36pt, -0.5 letter spacing, weight 700
- Gain/loss: 16-18pt, weight 600, color #00D084 (green) or #FF5C5C (red)
- Chart height: ~240px, edge-to-edge width
- Chart gradient: rgba(0, 208, 132, 0.2) to transparent
- Timeframe pills: 24px height, 12px border-radius, 8px horizontal padding
- Active pill: Underline 2px, color matching chart
- Section heading: 17pt, weight 600, color #FFFFFF
- Card spacing: 12px between cards
- Card dimensions: 140px × 96px
- Card corner radius: 12px
- Card background: rgba(255, 255, 255, 0.06)
- Sparkline in card: 60px × 32px
- Card symbol: 13pt, weight 600
- Card value: 15pt, weight 700
- Card percentage: 13pt, weight 500

**Typography System:**
- Primary value: SF Pro Display Bold, 36pt
- Secondary value: SF Pro Text Semibold, 16pt
- Labels: SF Pro Text Medium, 13pt
- Headings: SF Pro Text Semibold, 17pt

**Key Patterns:**
- Horizontal scrolling cards for "top movers"
- Sparklines in list items for quick visual trend
- Timeframe selector as pill group below chart
- Gradient area chart with smooth curves
- Clear visual hierarchy: Value → Chart → Details

---

### Screenshot 2: Prediction Market App (Polymarket-style)

**Visual Hierarchy:**
```
┌─────────────────────────────┐
│ Winter Olympics: Most Gold  │ Title
│         Medals              │
├─────────────────────────────┤
│                             │
│ [Multi-line Chart]          │ Chart with multiple colored lines
│                             │
│ LIVE 1D 1W MAX             │ Timeframe pills
│                             │
├─────────────────────────────┤
│ Contract Options            │
│ ○ USA                       │
│ ○ China                     │
│ ○ Russia                    │
│                             │
│ [Yes]          [No]         │ Trade buttons
└─────────────────────────────┘
```

**Measurements:**
- Chart height: ~280px
- Multi-line chart with 3-5 colored lines
- Line colors: #3B82F6 (blue), #10B981 (green), #F59E0B (amber), #EF4444 (red)
- Pill tabs: LIVE (highlighted), 1D, 1W, MAX
- LIVE indicator: Pulsing dot animation, #10B981
- Contract options: Radio buttons, 48px height each
- Trade buttons: Full width split (50% each), 56px height
- Button border radius: 12px

**Key Patterns:**
- Multi-outcome visualization with color coding
- LIVE data indicator with animation
- Binary action buttons at bottom
- Contract selection before trade

---

### Screenshot 3: Robinhood - PENGU Token Detail (PRIMARY REFERENCE)

**Visual Hierarchy:**
```
┌─────────────────────────────┐
│ ←         ⭐ ↗ ⋮           │ Navigation + actions (44px)
├─────────────────────────────┤
│ PENGU • Pudgy Penguins  [◯] │ Token label + image
│                         64px │ (Label 14pt, Image right-aligned)
│ $0.006662                   │ Price (40pt bold, left)
│ +$0.0₃4549 (+7.33%)         │ Change (16pt, #00D084, left)
│                             │ (24px vertical spacing)
│                             │
│ [Area Chart - Edge-to-Edge] │ Chart (280px height)
│                             │ Green gradient (#00D084)
│                             │
│ 1H 1D 1W 1M 3M 1Y          │ Timeframe pills (28px height)
│                             │ (8px below chart)
├─────────────────────────────┤
│ Why it's moving             │ Section heading (17pt semibold)
│ [Content...]                │
│                             │
├─────────────────────────────┤
│ Market Buy    USDC: 9.7 ⚙  │ Trade panel header (40px)
│                             │
│         [◯]                 │ Token icon (48px)
│        PENGU                │ Symbol (20pt bold)
│     MC: 511.1M              │ Market cap (13pt medium)
│                             │
│   $10    $50    $100        │ Preset buttons (40px height)
│                             │ (12px spacing between)
│                             │ (16px vertical spacing)
└─────────────────────────────┘
```

**Measurements:**

**Header:**
- Height: 44px
- Back arrow: 24×24px icon, 16px left margin
- Action icons: 24×24px each, 16px right margin, 12px spacing between
- Background: Solid #000000 (true black)

**Token Identity Section:**
- Top padding: 16px
- Label text: "PENGU • Pudgy Penguins", 14pt, weight 500, color #8E8E93
- Token image: 64×64px circle, absolute positioned top-right with 16px right margin
- Price: 40pt, weight 700, color #FFFFFF, left-aligned with 16px margin
- Price top margin: 4px below label
- Change: 16pt, weight 600, color #00D084 (green) or #FF3B30 (red)
- Change format: Uses subscript notation for repeating zeros (0₃ = 0.000)
- Change top margin: 4px below price
- Bottom padding: 24px

**Chart Section:**
- Full width (edge-to-edge, 0px horizontal padding)
- Height: 280px
- Chart type: Area chart with gradient fill
- Line color: #00D084 (green for positive) or #FF3B30 (red for negative)
- Gradient: Linear from rgba(0, 208, 132, 0.3) at line to transparent at bottom
- Line width: 2px
- No axis labels, no grid lines (clean minimal aesthetic)
- Interactive: Touch to show crosshair with value tooltip

**Timeframe Selector:**
- Top margin: 8px below chart
- Pills: 1H, 1D, 1W, 1M, 3M, 1Y
- Pill height: 28px
- Pill horizontal padding: 12px
- Pill spacing: 8px between
- Active pill background: rgba(255, 255, 255, 0.12)
- Active pill text: #FFFFFF, weight 600
- Inactive pill text: #8E8E93, weight 500
- Font size: 13pt
- Corner radius: 14px (fully rounded)
- Bottom padding: 20px

**Trade Panel (CRITICAL REFERENCE):**
- Background: #1C1C1E (elevated surface)
- Corner radius: 20px (top corners only)
- Top padding: 12px
- Side padding: 16px
- Bottom padding: 16px + safe area inset

**Panel Header:**
- Height: 40px
- "Market Buy" selector: Pill button, 32px height, 12px horizontal padding
- Tap to show order type sheet (Market, Limit, Stop)
- Text: 14pt, weight 600, color #FFFFFF
- Balance display: Right-aligned, "USDC: 9.7", 14pt, weight 500, color #8E8E93
- Settings gear: 24×24px icon, 8px left of right edge

**Token Display (center):**
- Top margin: 16px below header
- Token icon: 48×48px circle, centered
- Symbol: "PENGU", 20pt, weight 700, color #FFFFFF, centered
- Symbol top margin: 8px below icon
- Market cap: "MC: 511.1M", 13pt, weight 500, color #8E8E93, centered
- Market cap top margin: 4px below symbol
- Bottom margin: 16px

**Preset Buttons:**
- Container: Horizontal flex row, space-between distribution
- Button dimensions: Flexible width (33% minus spacing), 40px height
- Button spacing: 12px between
- Button background: rgba(255, 255, 255, 0.1)
- Button background (active/pressed): rgba(0, 208, 132, 0.2)
- Button border: 1px solid rgba(255, 255, 255, 0.15)
- Button border radius: 12px
- Button text: "$10", "$50", "$100" (14pt, weight 600, #FFFFFF)
- Values: USD-denominated (NOT SOL or token amounts)

**Typography:**
- System: SF Pro (iOS native)
- Price: SF Pro Display Bold, 40pt, -0.5 letter spacing
- Label: SF Pro Text Medium, 14pt
- Change: SF Pro Text Semibold, 16pt
- Market cap: SF Pro Text Medium, 13pt
- Button text: SF Pro Text Semibold, 14pt

**Color Palette:**
- Background: #000000
- Surface: #1C1C1E
- Surface elevated: #2C2C2E
- Text primary: #FFFFFF
- Text secondary: #8E8E93
- Positive: #00D084
- Negative: #FF3B30
- Border: rgba(255, 255, 255, 0.15)

**Key Patterns:**
- **Price LEFT, token image RIGHT** (opposite of typical token list items)
- Edge-to-edge chart for maximum data visibility
- Timeframe pills immediately below chart (tight coupling)
- Persistent bottom panel with collapsed state
- USD preset amounts ($10, $50, $100) for retail accessibility
- Balance display in panel header (context without clutter)
- Market cap displayed centrally with token identity
- Order type selector as tappable pill (progressive disclosure)

---

### Screenshot 4: Fommo/Moonshot - Leaderboard

**Visual Hierarchy:**
```
┌─────────────────────────────┐
│   Friends  |  Leaderboard   │ Segmented control (44px)
├─────────────────────────────┤
│ Your rank                   │ Personal card (80px height)
│ #42  Your Name  +$1,234     │
│                             │
├─────────────────────────────┤
│ 1  [👤] @handle   +$5,678   │ List item (64px height)
│                     [◯][◯]  │ Token pills
│                             │
│ 2  [👤] @handle   +$4,321   │
│                     [◯][◯]  │
│                             │
│ 3  [👤] @handle   +$3,210   │
│                     [◯]     │
│                             │
└─────────────────────────────┘
```

**Measurements:**

**Segmented Control:**
- Height: 44px
- Container padding: 16px horizontal, 12px vertical
- Segment background (inactive): rgba(255, 255, 255, 0.06)
- Segment background (active): #FFFFFF
- Segment text (inactive): #8E8E93, 15pt, weight 500
- Segment text (active): #000000, 15pt, weight 600
- Border radius: 10px
- Animation: 0.25s ease-in-out on segment change

**Your Rank Card:**
- Height: 80px
- Background: Linear gradient from #6366F1 to #8B5CF6
- Corner radius: 16px
- Padding: 16px
- Rank number: 32pt, weight 800, color #FFFFFF
- Name: 17pt, weight 600, color #FFFFFF
- PnL: 20pt, weight 700, color #FFFFFF
- Bottom margin: 16px

**Leaderboard List Item:**
- Height: 64px
- Background: rgba(255, 255, 255, 0.04)
- Background (top 3): Subtle gradient (gold #FFD700, silver #C0C0C0, bronze #CD7F32)
- Padding: 12px horizontal
- Corner radius: 12px
- Vertical spacing: 8px between items

**Rank Badge (left):**
- Width: 32px
- Rank number: 17pt, weight 700
- Top 3 styling: Circle background with gradient, 28×28px
- Color: #FFD700 (gold), #C0C0C0 (silver), #CD7F32 (bronze)

**Avatar:**
- Size: 40×40px circle
- Position: 8px left of rank badge
- Border: 2px solid rgba(255, 255, 255, 0.1)

**User Info:**
- Display name: 15pt, weight 600, color #FFFFFF
- Handle: 13pt, weight 400, color #8E8E93
- Vertical stack, 2px spacing

**PnL (right side):**
- Text: 17pt, weight 700
- Color: #00D084 (positive) or #FF3B30 (negative)
- Right-aligned, 12px from right edge

**Token Pills (far right):**
- Size: 24×24px circles
- Position: Horizontal stack, -4px overlap (creating connected chain)
- Border: 2px solid background color (creates separation illusion)
- Max visible: 3 pills, then "+N" text if more
- Top margin: Auto-aligned with PnL

**Typography:**
- Rank: SF Pro Display Bold, 17pt
- Name: SF Pro Text Semibold, 15pt
- Handle: SF Pro Text Regular, 13pt
- PnL: SF Pro Display Bold, 17pt

**Key Patterns:**
- Segmented control for view switching
- Personalized "Your Rank" card at top with gradient treatment
- Top 3 ranks get special visual treatment (medal colors)
- Token pills show trading activity at a glance
- PnL as primary metric (right-aligned for scannability)
- Avatar for social connection
- Dense information without feeling cramped (64px row height)

---

### Screenshot 5: GMGN - 9bit Token Detail

**Visual Hierarchy:**
```
┌─────────────────────────────┐
│ ← [◯] 9bit  📋 ⭐ ↗        │ Navigation (44px)
│                             │
│ $0.00603          MC: $60.3M│ Price (left) + MC (right)
│ -$0.0000816 (1.34%)         │ Change (16pt, #FF3B30, left)
│                             │
│ [Candlestick Chart]         │ Chart (300px height)
│                             │ Orange/green candles
│                             │
│ 1H 4H 1D 7D 1M ALL  [📊]   │ Timeframe + chart type toggle
│                             │
├─────────────────────────────┤
│  Holders(5)  |  About       │ Tab bar (40px)
├─────────────────────────────┤
│ Address       Avg Hold  %   │ Table header
│ 0x123...abc   2.3d    12.4% │ Table rows
│ 0x456...def   1.8d     8.7% │
│                             │
├─────────────────────────────┤
│ ⚠ Unverified token          │ Warning banner (48px)
├─────────────────────────────┤
│          [Buy]              │ CTA button (56px)
└─────────────────────────────┘
```

**Measurements:**

**Navigation Bar:**
- Height: 44px
- Background: #0F0F0F
- Back arrow: 24×24px, 12px left margin
- Token icon: 32×32px circle, 8px left of back arrow
- Token name: "9bit", 17pt, weight 600, color #FFFFFF, 8px left of icon
- Copy icon: 20×20px, 8px left of name
- Star icon: 24×24px, positioned with 12px spacing from right action
- Share icon: 24×24px, 12px right margin

**Price Section:**
- Top padding: 16px
- Side padding: 16px
- Price: "$0.00603", 32pt, weight 700, color #FFFFFF, left-aligned
- Market cap: "MC: $60.3M", 15pt, weight 600, color #8E8E93, right-aligned
- Both on same baseline (flexbox row with space-between)
- Change: "-$0.0000816 (1.34%)", 16pt, weight 600, color #FF3B30
- Change position: 4px below price, left-aligned
- Bottom padding: 16px

**Chart Section:**
- Full width (edge-to-edge)
- Height: 300px
- Chart type: Candlestick (default), toggleable to line
- Candle colors: #00D084 (bullish), #FF3B30 (bearish)
- Wick color: Same as candle, 1px width
- Body width: Dynamic based on timeframe
- No padding, no background grid (clean)
- Y-axis labels: Right-aligned, 11pt, #8E8E93
- X-axis labels: Bottom-aligned, 11pt, #8E8E93, sparse (every 4-6 candles)

**Chart Controls:**
- Top margin: 8px below chart
- Side padding: 16px
- Timeframe pills: 1H, 4H, 1D, 7D, 1M, ALL
- Pill height: 28px
- Pill padding: 10px horizontal
- Pill spacing: 6px between
- Active pill background: rgba(255, 255, 255, 0.15)
- Active pill text: #FFFFFF, 13pt, weight 600
- Inactive pill text: #8E8E93, 13pt, weight 500
- Chart type toggle: 28×28px icon button, right-aligned
- Toggle icon: Candlestick or line chart icon, #8E8E93
- Toggle active color: #FFFFFF
- Bottom padding: 16px

**Tab Bar:**
- Height: 40px
- Background: rgba(255, 255, 255, 0.04)
- Tab text: 15pt, weight 600
- Tab text (active): #FFFFFF
- Tab text (inactive): #8E8E93
- Active indicator: 2px underline, #FFFFFF, full tab width
- Transition: 0.2s ease

**Holders Table:**
- Header row: 36px height, sticky
- Header background: rgba(255, 255, 255, 0.06)
- Header text: 13pt, weight 600, color #8E8E93, uppercase
- Data row: 48px height
- Data text: 14pt, weight 500, color #FFFFFF
- Address: Monospace font (SF Mono), truncated with ellipsis
- Row separator: 1px, rgba(255, 255, 255, 0.08)
- Side padding: 16px
- Column spacing: 12px

**Warning Banner:**
- Height: 48px
- Background: rgba(245, 158, 11, 0.15)
- Border: 1px solid rgba(245, 158, 11, 0.4)
- Icon: ⚠ 20×20px, #F59E0B
- Text: "Unverified token", 14pt, weight 600, color #F59E0B
- Padding: 12px horizontal
- Position: Above CTA button, 12px margin

**Buy Button:**
- Height: 56px
- Width: Full width minus 32px side margins (16px each)
- Background: #3B82F6 (primary blue)
- Background (pressed): #2563EB (darker blue)
- Text: "Buy", 17pt, weight 700, color #FFFFFF
- Corner radius: 16px
- Bottom margin: 16px + safe area inset
- Position: Sticky/fixed to bottom

**Typography:**
- Price: SF Pro Display Bold, 32pt
- Market cap: SF Pro Text Semibold, 15pt
- Change: SF Pro Text Semibold, 16pt
- Tab: SF Pro Text Semibold, 15pt
- Table data: SF Pro Text Medium, 14pt
- Button: SF Pro Text Bold, 17pt

**Color Palette:**
- Background: #0F0F0F (slightly lighter than true black)
- Surface: rgba(255, 255, 255, 0.04)
- Surface elevated: rgba(255, 255, 255, 0.08)
- Text primary: #FFFFFF
- Text secondary: #8E8E93
- Positive: #00D084
- Negative: #FF3B30
- Warning: #F59E0B
- Primary action: #3B82F6
- Border: rgba(255, 255, 255, 0.08)

**Key Patterns:**
- Candlestick chart as default (more data density than area chart)
- Chart type toggle for user preference (candle vs line)
- Market cap displayed in header (right-aligned with price)
- Tabbed content below chart (Holders, About)
- Data table for holder distribution
- Warning banner for unverified/risky tokens
- Single full-width CTA button at bottom (simpler than Robinhood's panel)
- Icon in nav bar for token identity (not just in hero)

---

## 2. Token Detail Screen Pattern Synthesis

### Definitive Specification for Quickscope Token Detail

After analyzing Robinhood PENGU (Screenshot 3) and GMGN 9bit (Screenshot 5), here is the synthesized pattern for Quickscope iOS token detail screen.

### Layout Decision Matrix

| Element | Robinhood PENGU | GMGN 9bit | Quickscope Decision | Rationale |
|---------|-----------------|-----------|---------------------|-----------|
| Price alignment | Left | Left | **Left** | Consistent with both references, better for LTR reading |
| Token image | Right (64px) | Nav bar (32px) | **Right (56px)** | Robinhood's hero placement is stronger |
| Chart type | Area | Candlestick (toggleable) | **Area (default), candlestick (toggle)** | Area for simplicity, candle for power users |
| Chart width | Edge-to-edge | Edge-to-edge | **Edge-to-edge** | Maximum data visibility |
| Market cap | Trade panel | Header (right) | **Header (right)** | GMGN's placement saves trade panel space |
| Trade panel | Collapsed persistent | Full-width button | **Hybrid: Collapsed with expand** | Robinhood's richness with GMGN's simplicity |
| Preset values | USD ($10, $50, $100) | N/A | **USD ($10, $50, $100)** | Retail-friendly, lowers cognitive load |

### Component Specifications

#### 1. Navigation Bar

```typescript
interface TokenDetailNavBar {
  height: 44;
  backgroundColor: 'transparent'; // Blends with screen background
  leftAction: {
    type: 'back';
    icon: 'chevron-left';
    size: 24;
    color: tokens.text.primary;
    onPress: () => void;
  };
  rightActions: [
    {
      type: 'star';
      icon: 'star' | 'star-filled';
      size: 24;
      color: tokens.text.primary | tokens.accent.warning;
      onPress: () => void;
      state: 'watchlist' | 'unwatchlist';
    },
    {
      type: 'share';
      icon: 'share';
      size: 24;
      color: tokens.text.primary;
      onPress: () => void;
    },
    {
      type: 'more';
      icon: 'ellipsis-vertical';
      size: 24;
      color: tokens.text.primary;
      onPress: () => void;
    }
  ];
  spacing: 12; // Between right action icons
}
```

#### 2. Token Hero Section

```typescript
interface TokenHeroSection {
  padding: {
    top: 16;
    horizontal: 16;
    bottom: 24;
  };
  layout: 'flex-row' | 'flex-column'; // Row on smaller screens, column on larger

  tokenLabel: {
    text: string; // "SYMBOL • Full Name"
    fontSize: 14;
    fontWeight: 500;
    color: tokens.text.secondary;
    lineHeight: 20;
    position: 'left';
    maxWidth: '70%'; // Prevent overlap with token image
  };

  tokenImage: {
    size: 56; // Compromise between Robinhood (64) and GMGN (32)
    borderRadius: 28; // Fully circular
    position: 'absolute';
    top: 16;
    right: 16;
    border: {
      width: 2;
      color: 'rgba(255, 255, 255, 0.1)';
    };
    fallback: {
      backgroundColor: tokens.surface.elevated;
      text: string; // First letter of symbol
      fontSize: 24;
      fontWeight: 700;
      color: tokens.text.secondary;
    };
  };

  priceDisplay: {
    fontSize: 40;
    fontWeight: 700;
    color: tokens.text.primary;
    letterSpacing: -0.5;
    lineHeight: 48;
    marginTop: 4; // Below token label
    alignment: 'left';
    marginLeft: 0; // No left padding beyond section padding
  };

  changeDisplay: {
    layout: 'horizontal'; // Amount and percentage side-by-side
    marginTop: 4; // Below price
    alignment: 'left';

    amount: {
      fontSize: 16;
      fontWeight: 600;
      color: tokens.accent.success | tokens.accent.error; // Dynamic based on positive/negative
      prefix: '+' | '-';
      subscriptNotation: true; // Use subscript for repeating zeros (e.g., 0₃)
    };

    percentage: {
      fontSize: 16;
      fontWeight: 600;
      color: tokens.accent.success | tokens.accent.error; // Match amount color
      format: '(+X.XX%)' | '(-X.XX%)';
      marginLeft: 6;
    };
  };

  marketCapDisplay: {
    fontSize: 15;
    fontWeight: 600;
    color: tokens.text.secondary;
    position: 'absolute';
    top: 16;
    right: 16 + 56 + 12; // Right of token image with 12px spacing
    text: 'MC: $XXX.XM'; // Abbreviated format
    alignment: 'right';
  };
}
```

**Layout Logic:**
```
┌──────────────────────────────────────────────┐
│ SYMBOL • Full Name              MC: $511M [◯]│ (Label left, MC + image right)
│                                              │
│ $0.006662                                    │ (Price left-aligned, 40pt bold)
│ +$0.0₃4549 (+7.33%)                          │ (Change left-aligned, 16pt, green)
│                                              │
└──────────────────────────────────────────────┘
```

#### 3. Chart Section

```typescript
interface TokenChartSection {
  width: '100%'; // Edge-to-edge
  height: 280;
  padding: {
    horizontal: 0; // No horizontal padding for edge-to-edge
    top: 0;
    bottom: 0;
  };

  chartType: 'area' | 'candlestick';
  defaultType: 'area';

  areaChartConfig: {
    lineWidth: 2;
    lineColor: tokens.accent.success | tokens.accent.error; // Dynamic based on 24h change
    gradientStart: 'rgba(0, 208, 132, 0.3)' | 'rgba(255, 60, 48, 0.3)';
    gradientEnd: 'rgba(0, 208, 132, 0)' | 'rgba(255, 60, 48, 0)';
    curveType: 'natural'; // Smooth bezier curves
    fillArea: true;
    showGrid: false;
    showAxisLabels: false; // Clean minimal look
    interactive: true;
    crosshair: {
      enabled: true;
      lineColor: 'rgba(255, 255, 255, 0.3)';
      lineWidth: 1;
      tooltip: {
        backgroundColor: tokens.surface.elevated;
        textColor: tokens.text.primary;
        fontSize: 13;
        fontWeight: 600;
        padding: 8;
        borderRadius: 8;
        format: '$X.XXXXXX @ HH:MM';
      };
    };
  };

  candlestickChartConfig: {
    bullishColor: tokens.accent.success; // #00D084
    bearishColor: tokens.accent.error; // #FF3B30
    wickWidth: 1;
    bodyMinWidth: 2; // Minimum candle body width
    showGrid: false;
    showAxisLabels: {
      y: true; // Right side price labels
      x: true; // Bottom time labels (sparse)
    };
    axisLabelStyle: {
      fontSize: 11;
      fontWeight: 500;
      color: tokens.text.secondary;
    };
    interactive: true;
    crosshair: {
      enabled: true;
      lineColor: 'rgba(255, 255, 255, 0.3)';
      tooltip: {
        backgroundColor: tokens.surface.elevated;
        textColor: tokens.text.primary;
        fontSize: 11;
        fontWeight: 600;
        padding: 8;
        borderRadius: 6;
        format: 'O: $X.XX | H: $X.XX | L: $X.XX | C: $X.XX';
      };
    };
  };

  chartControls: {
    marginTop: 8; // Tight coupling with chart
    paddingHorizontal: 16;
    height: 28;

    timeframePills: {
      options: ['1H', '1D', '1W', '1M', '3M', '1Y'];
      defaultActive: '1D';
      pillStyle: {
        height: 28;
        paddingHorizontal: 12;
        borderRadius: 14; // Fully rounded
        spacing: 8; // Between pills
        backgroundColor: {
          active: 'rgba(255, 255, 255, 0.12)';
          inactive: 'transparent';
        };
        textStyle: {
          active: {
            fontSize: 13;
            fontWeight: 600;
            color: tokens.text.primary;
          };
          inactive: {
            fontSize: 13;
            fontWeight: 500;
            color: tokens.text.secondary;
          };
        };
      };
    };

    chartTypeToggle: {
      position: 'absolute';
      right: 16;
      size: 28;
      icon: 'chart-candlestick' | 'chart-line';
      iconSize: 18;
      color: tokens.text.secondary;
      activeColor: tokens.text.primary;
      backgroundColor: 'transparent';
      onPress: () => void; // Toggle between area and candlestick
    };
  };
}
```

#### 4. Content Tabs Section

```typescript
interface TokenContentTabs {
  marginTop: 20;
  height: 40;
  backgroundColor: 'rgba(255, 255, 255, 0.04)';

  tabs: [
    {
      id: 'about';
      label: 'About';
      icon?: string; // Optional icon
    },
    {
      id: 'holders';
      label: 'Holders';
      count?: number; // Optional count badge
    },
    {
      id: 'activity';
      label: 'Activity';
      icon?: string;
    },
    {
      id: 'news';
      label: "Why it's moving";
      icon: 'newspaper';
    }
  ];

  tabStyle: {
    height: 40;
    paddingHorizontal: 16;
    fontSize: 15;
    fontWeight: 600;
    activeColor: tokens.text.primary;
    inactiveColor: tokens.text.secondary;
    activeIndicator: {
      height: 2;
      color: tokens.text.primary;
      width: '100%'; // Full tab width
      position: 'bottom';
    };
    transition: '0.2s ease';
  };

  countBadge: {
    fontSize: 13;
    fontWeight: 600;
    color: tokens.text.secondary;
    marginLeft: 4;
    format: '(N)'; // Parenthetical
  };
}
```

#### 5. Trade Panel (CRITICAL - Hybrid Approach)

The trade panel uses Robinhood's collapsed persistent panel as the primary interaction, with expansion for more controls.

```typescript
interface TradePanelCollapsed {
  position: 'sticky'; // Fixed to bottom of screen
  bottom: 0;
  left: 0;
  right: 0;
  backgroundColor: tokens.surface.elevated; // #1C1C1E
  borderTopLeftRadius: 20;
  borderTopRightRadius: 20;
  paddingTop: 12;
  paddingHorizontal: 16;
  paddingBottom: 16; // + safe area inset
  shadowColor: '#000000';
  shadowOpacity: 0.3;
  shadowRadius: 20;
  shadowOffset: { width: 0; height: -4 };

  header: {
    height: 40;
    marginBottom: 16;

    orderTypeSelector: {
      position: 'left';
      height: 32;
      paddingHorizontal: 12;
      backgroundColor: 'rgba(255, 255, 255, 0.1)';
      borderRadius: 16;
      text: 'Market Buy' | 'Limit' | 'Stop';
      fontSize: 14;
      fontWeight: 600;
      color: tokens.text.primary;
      icon: 'chevron-down'; // Indicates tappable
      iconSize: 16;
      iconColor: tokens.text.secondary;
      onPress: () => void; // Show order type sheet
    };

    balanceDisplay: {
      position: 'right';
      text: 'USDC: X.XX'; // Dynamic based on connected wallet
      fontSize: 14;
      fontWeight: 500;
      color: tokens.text.secondary;
      marginRight: 32; // Space for settings icon
    };

    settingsButton: {
      position: 'absolute';
      right: 0;
      size: 24;
      icon: 'gear';
      iconSize: 20;
      color: tokens.text.secondary;
      onPress: () => void; // Show slippage/settings sheet
    };
  };

  tokenDisplay: {
    alignItems: 'center';
    marginBottom: 16;

    tokenIcon: {
      size: 48;
      borderRadius: 24;
      border: {
        width: 2;
        color: 'rgba(255, 255, 255, 0.1)';
      };
      marginBottom: 8;
    };

    symbol: {
      fontSize: 20;
      fontWeight: 700;
      color: tokens.text.primary;
      letterSpacing: 0.5;
      marginBottom: 4;
    };

    marketCap: {
      fontSize: 13;
      fontWeight: 500;
      color: tokens.text.secondary;
      text: 'MC: $XXX.XM';
    };
  };

  presetButtons: {
    flexDirection: 'row';
    justifyContent: 'space-between';
    gap: 12;
    marginBottom: 12;

    button: {
      flex: 1; // Equal width distribution
      height: 40;
      backgroundColor: 'rgba(255, 255, 255, 0.1)';
      border: {
        width: 1;
        color: 'rgba(255, 255, 255, 0.15)';
      };
      borderRadius: 12;
      text: '$10' | '$50' | '$100'; // USD AMOUNTS (not SOL)
      fontSize: 14;
      fontWeight: 600;
      color: tokens.text.primary;

      activeState: {
        backgroundColor: 'rgba(0, 208, 132, 0.2)';
        borderColor: tokens.accent.success;
        textColor: tokens.accent.success;
      };

      pressedState: {
        backgroundColor: 'rgba(255, 255, 255, 0.15)';
        scale: 0.97;
      };
    };
  };

  customAmountInput: {
    height: 48;
    backgroundColor: 'rgba(255, 255, 255, 0.06)';
    borderRadius: 12;
    paddingHorizontal: 16;
    fontSize: 20;
    fontWeight: 600;
    color: tokens.text.primary;
    placeholder: '$0.00';
    placeholderColor: tokens.text.tertiary;
    keyboardType: 'decimal-pad';
    marginBottom: 12;

    prefix: {
      text: '$';
      fontSize: 20;
      fontWeight: 600;
      color: tokens.text.secondary;
      position: 'left';
    };

    conversionDisplay: {
      position: 'right';
      text: '≈ X.XXX SOL'; // Dynamic conversion
      fontSize: 13;
      fontWeight: 500;
      color: tokens.text.secondary;
    };
  };

  executeButton: {
    height: 56;
    backgroundColor: tokens.accent.success; // #00D084 for buy
    borderRadius: 16;
    text: 'Buy SYMBOL';
    fontSize: 17;
    fontWeight: 700;
    color: '#FFFFFF';

    pressedState: {
      backgroundColor: '#00B873'; // Darker green
      scale: 0.98;
    };

    disabledState: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)';
      textColor: tokens.text.tertiary;
    };

    loadingState: {
      showSpinner: true;
      text: 'Processing...';
    };
  };

  expandButton: {
    position: 'absolute';
    top: -32; // Above panel
    alignSelf: 'center';
    height: 24;
    width: 48;
    backgroundColor: tokens.surface.elevated;
    borderTopLeftRadius: 12;
    borderTopRightRadius: 12;
    justifyContent: 'center';
    alignItems: 'center';

    icon: 'chevron-up' | 'chevron-down';
    iconSize: 16;
    iconColor: tokens.text.secondary;
    onPress: () => void; // Toggle expanded state
  };
}

interface TradePanelExpanded extends TradePanelCollapsed {
  height: 'auto'; // Dynamic based on content
  maxHeight: '80%'; // Screen height

  additionalControls: {
    slippageSelector: {
      label: 'Slippage Tolerance';
      options: ['0.5%', '1%', '2%', 'Custom'];
      defaultActive: '1%';
      style: 'segmented-control';
      height: 36;
      marginBottom: 12;
    };

    priorityFeeToggle: {
      label: 'Priority Fee';
      description: 'Increase transaction speed';
      toggleState: boolean;
      feeAmount: 'Auto' | 'Custom';
      height: 48;
      marginBottom: 12;
    };

    orderTypeSpecific: {
      // If order type is "Limit"
      limitPrice: {
        label: 'Limit Price';
        input: {
          height: 48;
          placeholder: '$0.00';
          keyboardType: 'decimal-pad';
        };
        marginBottom: 12;
      };

      // If order type is "Stop"
      stopPrice: {
        label: 'Stop Price';
        input: {
          height: 48;
          placeholder: '$0.00';
          keyboardType: 'decimal-pad';
        };
        marginBottom: 12;
      };
    };

    estimatedOutput: {
      label: 'You will receive';
      value: 'X,XXX SYMBOL';
      subtext: '± X.XX% slippage';
      height: 56;
      backgroundColor: 'rgba(255, 255, 255, 0.04)';
      borderRadius: 12;
      padding: 12;
      marginBottom: 12;
    };
  };
}
```

**Panel Interaction States:**

```typescript
enum TradePanelState {
  COLLAPSED = 'collapsed', // Default: Presets + Execute button visible
  EXPANDED = 'expanded',   // All controls visible
  REVIEWING = 'reviewing', // Post-execute, showing transaction details
  EXECUTING = 'executing'  // Transaction in progress
}

interface TradePanelBehavior {
  defaultState: TradePanelState.COLLAPSED;

  transitions: {
    // Tap expand button
    COLLAPSED_TO_EXPANDED: {
      animation: 'spring';
      duration: 300;
      dampingRatio: 0.8;
    };

    // Tap collapse button or drag down
    EXPANDED_TO_COLLAPSED: {
      animation: 'spring';
      duration: 250;
    };

    // Tap execute button
    COLLAPSED_TO_EXECUTING: {
      disableInputs: true;
      showLoadingState: true;
    };

    // Transaction submitted
    EXECUTING_TO_REVIEWING: {
      showSuccessAnimation: true;
      updateButtonText: 'View Transaction';
    };
  };

  gestures: {
    dragToExpand: {
      enabled: true;
      threshold: 20; // px
      direction: 'up';
    };

    dragToCollapse: {
      enabled: true;
      threshold: 20;
      direction: 'down';
    };
  };
}
```

**Warning Banner (Conditional):**

```typescript
interface WarningBanner {
  position: 'above-trade-panel'; // 12px margin above panel
  height: 48;
  backgroundColor: 'rgba(245, 158, 11, 0.15)'; // Amber with transparency
  border: {
    width: 1;
    color: 'rgba(245, 158, 11, 0.4)';
  };
  borderRadius: 12;
  paddingHorizontal: 12;
  marginHorizontal: 16;

  icon: {
    name: 'exclamation-triangle';
    size: 20;
    color: tokens.accent.warning; // #F59E0B
  };

  text: {
    fontSize: 14;
    fontWeight: 600;
    color: tokens.accent.warning;
    marginLeft: 8;
    content: 'Unverified token' | 'Low liquidity' | 'High volatility';
  };

  dismissButton: {
    size: 20;
    icon: 'x';
    color: tokens.accent.warning;
    position: 'absolute';
    right: 12;
    onPress: () => void;
  };

  conditions: {
    showWhen: {
      tokenNotVerified: boolean;
      liquidityBelow: number; // e.g., $10,000
      volatility24hAbove: number; // e.g., 50%
    };
  };
}
```

---

## 3. List/Feed Pattern Synthesis

### Copilot "Top Movers" + Fommo Leaderboard = Quickscope Discovery/Tracking

#### Pattern 1: Horizontal Scrolling Cards (for Discovery "Top Movers" section)

```typescript
interface TopMoversSection {
  heading: {
    text: 'Top Movers' | 'Trending Now' | 'Your Watchlist';
    fontSize: 17;
    fontWeight: 600;
    color: tokens.text.primary;
    paddingHorizontal: 16;
    paddingTop: 20;
    paddingBottom: 12;
  };

  cardContainer: {
    flexDirection: 'row';
    paddingHorizontal: 16;
    gap: 12; // Between cards
    scrollEnabled: true;
    showsHorizontalScrollIndicator: false;
    snapToInterval: 140 + 12; // Card width + gap for snap scrolling
    decelerationRate: 'fast';
  };

  card: {
    width: 140;
    height: 96;
    backgroundColor: 'rgba(255, 255, 255, 0.06)';
    borderRadius: 12;
    padding: 12;

    tokenIcon: {
      size: 32;
      borderRadius: 16;
      position: 'top-left';
      marginBottom: 8;
    };

    symbol: {
      fontSize: 13;
      fontWeight: 600;
      color: tokens.text.primary;
      marginBottom: 2;
    };

    price: {
      fontSize: 15;
      fontWeight: 700;
      color: tokens.text.primary;
      marginBottom: 8;
    };

    sparkline: {
      width: '100%';
      height: 32;
      position: 'absolute';
      bottom: 12;
      left: 12;
      right: 12;
      lineWidth: 1.5;
      lineColor: tokens.accent.success | tokens.accent.error;
      fillGradient: {
        start: 'rgba(0, 208, 132, 0.2)' | 'rgba(255, 60, 48, 0.2)';
        end: 'transparent';
      };
      showPoints: false;
      smoothCurve: true;
    };

    changePercentage: {
      position: 'absolute';
      top: 12;
      right: 12;
      fontSize: 13;
      fontWeight: 500;
      color: tokens.accent.success | tokens.accent.error;
      format: '+X.XX%' | '-X.XX%';
    };

    pressState: {
      scale: 0.95;
      backgroundColor: 'rgba(255, 255, 255, 0.08)';
    };
  };
}
```

**Layout Example:**
```
┌────────────────────────────────────────────┐
│ Top Movers                                 │
│                                            │
│ ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  │
│ │ [◯]  │  │ [◯]  │  │ [◯]  │  │ [◯]  │  │
│ │ SOL  │  │ BONK │  │ JUP  │  │ WIF  │  │
│ │$125.3│  │$0.000│  │$0.85 │  │$2.14 │  │
│ │      │  │      │  │      │  │      │  │
│ │ ┌──┐ │  │ ┌──┐ │  │ ┌──┐ │  │ ┌──┐ │  │
│ │ └──┘ │  │ └──┘ │  │ └──┘ │  │ └──┘ │  │
│ │+5.2% │  │+12.8%│  │-3.1% │  │+8.4% │  │
│ └──────┘  └──────┘  └──────┘  └──────┘  │
│                                            │
└────────────────────────────────────────────┘
```

#### Pattern 2: Ranked List (for Tracking "Leaderboard" section)

```typescript
interface LeaderboardSection {
  header: {
    height: 44;
    backgroundColor: tokens.background.primary;

    segmentedControl: {
      width: '90%';
      height: 32;
      marginHorizontal: 16;
      marginVertical: 6;
      backgroundColor: 'rgba(255, 255, 255, 0.06)';
      borderRadius: 10;

      segments: ['Friends', 'Global', 'My Trades'];

      segmentStyle: {
        active: {
          backgroundColor: tokens.text.primary; // White
          textColor: tokens.background.primary; // Black (inverted)
          fontWeight: 600;
        };
        inactive: {
          backgroundColor: 'transparent';
          textColor: tokens.text.secondary;
          fontWeight: 500;
        };
        fontSize: 15;
        transition: '0.25s ease-in-out';
      };
    };
  };

  yourRankCard: {
    height: 80;
    marginHorizontal: 16;
    marginTop: 16;
    marginBottom: 16;
    backgroundColor: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)';
    borderRadius: 16;
    padding: 16;

    rank: {
      fontSize: 32;
      fontWeight: 800;
      color: '#FFFFFF';
      position: 'left';
    };

    label: {
      fontSize: 13;
      fontWeight: 500;
      color: 'rgba(255, 255, 255, 0.8)';
      position: 'below-rank';
      text: 'Your Rank';
    };

    pnl: {
      fontSize: 20;
      fontWeight: 700;
      color: '#FFFFFF';
      position: 'right';
      format: '+$X,XXX.XX' | '-$X,XXX.XX';
    };

    pnlLabel: {
      fontSize: 13;
      fontWeight: 500;
      color: 'rgba(255, 255, 255, 0.8)';
      position: 'below-pnl';
      text: '24h PnL';
    };
  };

  listItem: {
    height: 64;
    marginHorizontal: 16;
    marginBottom: 8;
    backgroundColor: 'rgba(255, 255, 255, 0.04)';
    borderRadius: 12;
    paddingHorizontal: 12;

    rankBadge: {
      width: 32;
      position: 'left';

      // For top 3 ranks
      specialStyling: {
        condition: 'rank <= 3';
        size: 28;
        borderRadius: 14;
        background: {
          1: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)'; // Gold
          2: 'linear-gradient(135deg, #C0C0C0 0%, #A8A8A8 100%)'; // Silver
          3: 'linear-gradient(135deg, #CD7F32 0%, #B8732D 100%)'; // Bronze
        };
        textColor: '#000000';
        fontWeight: 800;
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)';
      };

      // For ranks 4+
      defaultStyling: {
        fontSize: 17;
        fontWeight: 700;
        color: tokens.text.secondary;
        textAlign: 'center';
      };
    };

    avatar: {
      size: 40;
      borderRadius: 20;
      position: 'left';
      marginLeft: 44; // After rank badge
      border: {
        width: 2;
        color: 'rgba(255, 255, 255, 0.1)';
      };
      fallback: {
        backgroundColor: tokens.surface.elevated;
        text: string; // First letter of username
        fontSize: 18;
        fontWeight: 700;
        color: tokens.text.secondary;
      };
    };

    userInfo: {
      position: 'left';
      marginLeft: 96; // After avatar
      justifyContent: 'center';

      displayName: {
        fontSize: 15;
        fontWeight: 600;
        color: tokens.text.primary;
        marginBottom: 2;
      };

      handle: {
        fontSize: 13;
        fontWeight: 400;
        color: tokens.text.secondary;
        prefix: '@';
      };
    };

    pnl: {
      position: 'absolute';
      right: 80; // Space for token pills
      fontSize: 17;
      fontWeight: 700;
      color: tokens.accent.success | tokens.accent.error;
      format: '+$X,XXX' | '-$X,XXX';
      textAlign: 'right';
    };

    tokenPills: {
      position: 'absolute';
      right: 12;
      flexDirection: 'row';

      pill: {
        size: 24;
        borderRadius: 12;
        border: {
          width: 2;
          color: tokens.background.primary; // Creates separation effect
        };
        marginLeft: -4; // Overlap pills
        zIndex: 'decreasing'; // Stack from right to left
      };

      maxVisible: 3;
      overflow: {
        text: '+N';
        fontSize: 11;
        fontWeight: 600;
        color: tokens.text.secondary;
        backgroundColor: 'rgba(255, 255, 255, 0.1)';
        size: 24;
        borderRadius: 12;
        marginLeft: -4;
      };
    };

    pressState: {
      backgroundColor: 'rgba(255, 255, 255, 0.06)';
      scale: 0.98;
    };
  };
}
```

**Layout Example:**
```
┌──────────────────────────────────────────┐
│   Friends  |  Global  |  My Trades       │
├──────────────────────────────────────────┤
│                                          │
│  ┌────────────────────────────────────┐ │
│  │  #42          +$1,234.56           │ │ Your Rank (gradient)
│  │  Your Rank    24h PnL              │ │
│  └────────────────────────────────────┘ │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │ 🥇 [◯] @user1    +$5,678  [◯][◯]  │ │ Rank 1
│  └────────────────────────────────────┘ │
│  ┌────────────────────────────────────┐ │
│  │ 🥈 [◯] @user2    +$4,321  [◯][◯]  │ │ Rank 2
│  └────────────────────────────────────┘ │
│  ┌────────────────────────────────────┐ │
│  │ 🥉 [◯] @user3    +$3,210  [◯]     │ │ Rank 3
│  └────────────────────────────────────┘ │
│  ┌────────────────────────────────────┐ │
│  │  4  [◯] @user4   +$2,100  [◯][◯]  │ │ Rank 4+
│  └────────────────────────────────────┘ │
└──────────────────────────────────────────┘
```

#### Pattern 3: Standard List Item (for Portfolio/Discovery default view)

```typescript
interface TokenListItem {
  height: 72;
  paddingHorizontal: 16;
  paddingVertical: 12;
  backgroundColor: tokens.background.primary;
  borderBottom: {
    width: 1;
    color: 'rgba(255, 255, 255, 0.08)';
  };

  tokenIcon: {
    size: 48;
    borderRadius: 24;
    position: 'left';
    border: {
      width: 2;
      color: 'rgba(255, 255, 255, 0.1)';
    };
  };

  tokenInfo: {
    position: 'left';
    marginLeft: 64; // After icon
    justifyContent: 'center';

    symbol: {
      fontSize: 17;
      fontWeight: 600;
      color: tokens.text.primary;
      marginBottom: 4;
    };

    name: {
      fontSize: 13;
      fontWeight: 400;
      color: tokens.text.secondary;
      maxWidth: 150; // Truncate long names
      numberOfLines: 1;
    };
  };

  priceInfo: {
    position: 'right';
    alignItems: 'flex-end';
    justifyContent: 'center';

    price: {
      fontSize: 17;
      fontWeight: 700;
      color: tokens.text.primary;
      marginBottom: 4;
    };

    change: {
      fontSize: 13;
      fontWeight: 600;
      color: tokens.accent.success | tokens.accent.error;
      format: '+X.XX%' | '-X.XX%';
    };
  };

  pressState: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)';
  };

  swipeActions: {
    enabled: true;
    leftActions: [
      {
        type: 'watchlist';
        icon: 'star';
        backgroundColor: tokens.accent.warning;
        width: 80;
        onPress: () => void;
      }
    ];
    rightActions: [
      {
        type: 'trade';
        icon: 'arrow-up-right';
        backgroundColor: tokens.accent.success;
        width: 80;
        onPress: () => void;
      }
    ];
  };
}
```

---

## 4. Chart Pattern Synthesis

### Chart Type Decision Tree

```
User View Context
│
├─ List/Feed View
│  └─ Use: Sparkline (simplified area chart)
│     • Height: 32-40px
│     • No axes, no labels
│     • Single color line + gradient fill
│     • Non-interactive (tap opens detail)
│
├─ Token Detail View (Default)
│  └─ Use: Area Chart
│     • Height: 280px
│     • Edge-to-edge width
│     • Interactive crosshair
│     • Smooth curves
│     • Single color (dynamic based on 24h change)
│
└─ Token Detail View (Toggled)
   └─ Use: Candlestick Chart
      • Height: 280px
      • Edge-to-edge width
      • Bullish/bearish color coding
      • Y-axis labels (right side)
      • X-axis labels (bottom, sparse)
      • Interactive crosshair with OHLC tooltip
```

### Sparkline Specification

```typescript
interface SparklineChart {
  usage: 'list-item' | 'card-widget';
  width: '100%'; // Container width
  height: 32 | 40;

  data: {
    points: number[]; // Price values
    timeframe: '1H' | '24H' | '7D'; // Determines point density
    minPoints: 20; // Minimum for smooth curve
    maxPoints: 100; // Maximum to prevent performance issues
  };

  lineStyle: {
    width: 1.5;
    color: tokens.accent.success | tokens.accent.error; // Based on first vs last point
    curveType: 'natural'; // Smooth bezier
    cap: 'round';
    join: 'round';
  };

  fillStyle: {
    enabled: true;
    gradient: {
      start: 'rgba(0, 208, 132, 0.2)' | 'rgba(255, 60, 48, 0.2)';
      end: 'rgba(0, 208, 132, 0)' | 'rgba(255, 60, 48, 0)';
      direction: 'vertical';
    };
  };

  axesDisplay: {
    x: false;
    y: false;
    grid: false;
  };

  interactive: false; // No tooltip, tap opens detail view

  animateOnMount: {
    enabled: true;
    type: 'draw-line'; // Line draws from left to right
    duration: 400;
    delay: 0;
    easing: 'ease-out';
  };
}
```

### Area Chart Specification (Token Detail Default)

```typescript
interface AreaChart {
  usage: 'token-detail';
  width: '100%'; // Edge-to-edge
  height: 280;
  padding: {
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
  };

  data: {
    points: Array<{ timestamp: number; price: number }>;
    timeframe: '1H' | '1D' | '1W' | '1M' | '3M' | '1Y';
    updateInterval: {
      '1H': 60000; // 1 minute
      '1D': 300000; // 5 minutes
      '1W': 3600000; // 1 hour
      '1M': 14400000; // 4 hours
      '3M': 86400000; // 1 day
      '1Y': 604800000; // 1 week
    };
  };

  lineStyle: {
    width: 2;
    color: tokens.accent.success | tokens.accent.error; // Dynamic based on 24h change
    curveType: 'monotoneX'; // Smooth but monotonic (prevents overshoot)
    cap: 'round';
    join: 'round';
  };

  fillStyle: {
    enabled: true;
    gradient: {
      start: {
        positive: 'rgba(0, 208, 132, 0.3)';
        negative: 'rgba(255, 60, 48, 0.3)';
      };
      end: {
        positive: 'rgba(0, 208, 132, 0)';
        negative: 'rgba(255, 60, 48, 0)';
      };
      direction: 'vertical';
    };
  };

  axesDisplay: {
    x: false; // Clean look, no bottom axis
    y: false; // Clean look, no left axis
    grid: false;
  };

  interactive: {
    enabled: true;

    crosshair: {
      enabled: true;
      lineColor: 'rgba(255, 255, 255, 0.3)';
      lineWidth: 1;
      lineDash: [4, 4]; // Dashed line

      horizontalLine: true; // Shows price level
      verticalLine: true; // Shows time
    };

    tooltip: {
      type: 'floating'; // Follows touch point
      backgroundColor: tokens.surface.elevated;
      padding: 8;
      borderRadius: 8;
      shadowColor: '#000000';
      shadowOpacity: 0.2;
      shadowRadius: 8;

      priceDisplay: {
        fontSize: 15;
        fontWeight: 700;
        color: tokens.text.primary;
        format: '$X.XXXXXX';
      };

      timestampDisplay: {
        fontSize: 11;
        fontWeight: 500;
        color: tokens.text.secondary;
        format: {
          '1H': 'HH:mm';
          '1D': 'HH:mm';
          '1W': 'MMM DD, HH:mm';
          '1M': 'MMM DD';
          '3M': 'MMM DD';
          '1Y': 'MMM YYYY';
        };
        marginTop: 2;
      };

      changeDisplay: {
        fontSize: 13;
        fontWeight: 600;
        color: tokens.accent.success | tokens.accent.error;
        format: '+X.XX% from start' | '-X.XX% from start';
        marginTop: 4;
      };
    };

    gestures: {
      pan: {
        enabled: true;
        showTooltip: true;
        updateCrosshair: true;
      };

      pinch: {
        enabled: false; // Keep simple, use timeframe selector instead
      };

      doubleTap: {
        enabled: true;
        action: 'reset-zoom'; // Future feature
      };
    };
  };

  animateOnMount: {
    enabled: true;
    type: 'fade-in-with-draw';
    duration: 500;
    easing: 'ease-out';
  };

  animateOnDataChange: {
    enabled: true;
    type: 'morph'; // Morph from old path to new path
    duration: 300;
    easing: 'ease-in-out';
  };
}
```

### Candlestick Chart Specification (Token Detail Toggle)

```typescript
interface CandlestickChart {
  usage: 'token-detail-advanced';
  width: '100%'; // Edge-to-edge
  height: 280;
  padding: {
    top: 8;
    right: 48; // Space for Y-axis labels
    bottom: 24; // Space for X-axis labels
    left: 0;
  };

  data: {
    candles: Array<{
      timestamp: number;
      open: number;
      high: number;
      low: number;
      close: number;
      volume?: number; // Optional for future volume indicator
    }>;
    timeframe: '1H' | '4H' | '1D' | '7D' | '1M';
    updateInterval: {
      '1H': 60000; // 1-minute candles
      '4H': 240000; // 4-minute candles
      '1D': 900000; // 15-minute candles
      '7D': 3600000; // 1-hour candles
      '1M': 14400000; // 4-hour candles
    };
  };

  candleStyle: {
    bullish: {
      bodyColor: tokens.accent.success; // #00D084
      wickColor: tokens.accent.success;
      borderColor: tokens.accent.success;
      borderWidth: 0; // Filled candle
    };

    bearish: {
      bodyColor: tokens.accent.error; // #FF3B30
      wickColor: tokens.accent.error;
      borderColor: tokens.accent.error;
      borderWidth: 0; // Filled candle
    };

    doji: {
      // When open ≈ close (< 0.1% difference)
      bodyColor: tokens.text.secondary;
      wickColor: tokens.text.secondary;
      borderWidth: 1;
    };

    wickWidth: 1;
    bodyMinWidth: 2; // Minimum candle width (for dense data)
    bodyMaxWidth: 20; // Maximum candle width (for sparse data)
    spacing: 2; // Space between candles
  };

  axesDisplay: {
    y: {
      enabled: true;
      position: 'right';
      width: 48;
      labelCount: 5; // Number of price labels
      labelStyle: {
        fontSize: 11;
        fontWeight: 500;
        color: tokens.text.secondary;
        alignment: 'right';
        paddingRight: 4;
        format: '$X.XX' | '$X.XXXX'; // Dynamic based on price magnitude
      };
      gridLines: false; // Keep clean
    };

    x: {
      enabled: true;
      position: 'bottom';
      height: 24;
      labelCount: 5; // Sparse labels (every N candles)
      labelStyle: {
        fontSize: 11;
        fontWeight: 500;
        color: tokens.text.secondary;
        alignment: 'center';
        paddingTop: 4;
        format: {
          '1H': 'HH:mm';
          '4H': 'HH:mm';
          '1D': 'MMM DD';
          '7D': 'MMM DD';
          '1M': 'MMM DD';
        };
      };
      gridLines: false;
    };

    grid: false; // No background grid for clean aesthetic
  };

  interactive: {
    enabled: true;

    crosshair: {
      enabled: true;
      lineColor: 'rgba(255, 255, 255, 0.3)';
      lineWidth: 1;
      lineDash: [4, 4];

      horizontalLine: true;
      verticalLine: true;
    };

    tooltip: {
      type: 'floating';
      backgroundColor: tokens.surface.elevated;
      padding: 10;
      borderRadius: 8;
      shadowColor: '#000000';
      shadowOpacity: 0.2;
      shadowRadius: 8;

      layout: 'OHLC-grid'; // 2x2 grid

      openDisplay: {
        label: 'O';
        fontSize: 11;
        fontWeight: 500;
        color: tokens.text.secondary;
        value: {
          fontSize: 13;
          fontWeight: 600;
          color: tokens.text.primary;
          format: '$X.XXXX';
        };
      };

      highDisplay: {
        label: 'H';
        fontSize: 11;
        fontWeight: 500;
        color: tokens.text.secondary;
        value: {
          fontSize: 13;
          fontWeight: 600;
          color: tokens.text.primary;
          format: '$X.XXXX';
        };
      };

      lowDisplay: {
        label: 'L';
        fontSize: 11;
        fontWeight: 500;
        color: tokens.text.secondary;
        value: {
          fontSize: 13;
          fontWeight: 600;
          color: tokens.text.primary;
          format: '$X.XXXX';
        };
      };

      closeDisplay: {
        label: 'C';
        fontSize: 11;
        fontWeight: 500;
        color: tokens.text.secondary;
        value: {
          fontSize: 13;
          fontWeight: 600;
          color: tokens.accent.success | tokens.accent.error; // Highlight close
          format: '$X.XXXX';
        };
      };

      timestampDisplay: {
        fontSize: 11;
        fontWeight: 500;
        color: tokens.text.secondary;
        format: 'MMM DD, HH:mm';
        marginTop: 6;
        borderTop: {
          width: 1;
          color: 'rgba(255, 255, 255, 0.1)';
        };
        paddingTop: 6;
      };
    };

    gestures: {
      pan: {
        enabled: true;
        showTooltip: true;
        updateCrosshair: true;
        snapToCandle: true; // Snap crosshair to nearest candle
      };

      pinch: {
        enabled: false; // Use timeframe selector
      };
    };
  };

  animateOnMount: {
    enabled: true;
    type: 'stagger-fade-in'; // Candles fade in sequentially
    duration: 600;
    staggerDelay: 10; // 10ms between each candle
    easing: 'ease-out';
  };

  animateOnDataChange: {
    enabled: true;
    type: 'update-last-candle'; // Only animate the most recent candle
    duration: 200;
    easing: 'ease-in-out';
  };
}
```

### Chart Type Toggle Component

```typescript
interface ChartTypeToggle {
  position: 'absolute';
  top: 8; // Aligned with timeframe pills
  right: 16;
  size: 28;

  button: {
    width: 28;
    height: 28;
    backgroundColor: 'transparent';
    borderRadius: 6;

    activeState: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)';
    };

    pressedState: {
      backgroundColor: 'rgba(255, 255, 255, 0.15)';
      scale: 0.95;
    };
  };

  icon: {
    size: 18;
    color: {
      default: tokens.text.secondary;
      active: tokens.text.primary;
    };

    areaIcon: 'chart-line'; // When area chart is active
    candleIcon: 'chart-candlestick'; // When candlestick is active
  };

  hapticFeedback: {
    enabled: true;
    type: 'light'; // Light haptic on toggle
  };

  persistPreference: {
    enabled: true;
    storageKey: 'chart-type-preference';
    defaultValue: 'area';
  };
}
```

---

## 5. Trade Panel Pattern Synthesis (CRITICAL)

### Key Insight: USD Presets vs SOL Presets

**Critical Change from Original Plan:**

The Robinhood PENGU screenshot (Screenshot 3) reveals that preset buttons use **USD values ($10, $50, $100)** rather than crypto amounts. This is a significant UX pattern that reduces cognitive load for retail users.

**Rationale for USD Presets:**
1. **Familiar mental model**: Users think in fiat terms ("I want to buy $50 worth")
2. **Reduces calculation burden**: No need to mentally convert SOL → USD
3. **Consistent across tokens**: Same presets work for any token
4. **Lower barrier to entry**: Retail users don't need to understand SOL pricing
5. **Mobile-first**: Quick taps for common amounts

**Implementation Change:**

```typescript
// ORIGINAL PLAN (SOL presets)
interface OriginalPresets {
  presets: [0.1, 0.5, 1.0]; // SOL amounts
  userMentalModel: 'How much SOL should I spend?';
  complexity: 'HIGH'; // Must know SOL/USD rate
}

// NEW PLAN (USD presets - Robinhood pattern)
interface RobinhoodPresets {
  presets: [10, 50, 100]; // USD amounts
  userMentalModel: 'How much money should I spend?';
  complexity: 'LOW'; // Universal fiat understanding
}
```

### Trade Panel Component Hierarchy

```
TradePanelRoot
│
├─ TradePanelHeader
│  ├─ OrderTypeSelector (pill button)
│  ├─ BalanceDisplay (right-aligned)
│  └─ SettingsButton (gear icon)
│
├─ TokenDisplay (center)
│  ├─ TokenIcon (48px)
│  ├─ Symbol (20pt bold)
│  └─ MarketCap (13pt secondary)
│
├─ PresetButtons (row of 3)
│  ├─ PresetButton ($10)
│  ├─ PresetButton ($50)
│  └─ PresetButton ($100)
│
├─ CustomAmountInput
│  ├─ DollarPrefix ($)
│  ├─ AmountInput (decimal keyboard)
│  └─ ConversionDisplay (≈ X.XX SOL)
│
├─ EstimatedOutput (when amount selected)
│  ├─ OutputLabel ('You will receive')
│  ├─ OutputAmount ('X,XXX SYMBOL')
│  └─ SlippageNote ('± 1% slippage')
│
├─ ExecuteButton
│  └─ ButtonText ('Buy SYMBOL')
│
└─ ExpandToggle (chevron up/down)
```

### Preset Button Behavior

```typescript
interface PresetButtonBehavior {
  buttons: [
    { value: 10, label: '$10' },
    { value: 50, label: '$50' },
    { value: 100, label: '$100' }
  ];

  interaction: {
    // Single tap: Select preset and populate input
    onTap: (value: number) => {
      setCustomAmount(value);
      setActivePreset(value);
      calculateExpectedOutput(value);
      hapticFeedback('light');
    };

    // Active state: Show selection with color change
    activeState: {
      backgroundColor: 'rgba(0, 208, 132, 0.2)';
      borderColor: tokens.accent.success;
      textColor: tokens.accent.success;
    };

    // Deselect when custom input changes
    onCustomInputChange: () => {
      setActivePreset(null);
    };
  };

  customization: {
    // Future: Allow users to set custom preset values
    enabled: false;
    longPressToEdit: true;
    storageKey: 'user-preset-values';
  };
}
```

### Amount Input with Real-Time Conversion

```typescript
interface CustomAmountInput {
  type: 'currency-input';
  currency: 'USD';

  inputField: {
    height: 48;
    backgroundColor: 'rgba(255, 255, 255, 0.06)';
    borderRadius: 12;
    paddingHorizontal: 16;
    fontSize: 20;
    fontWeight: 600;
    color: tokens.text.primary;
    keyboardType: 'decimal-pad';
    placeholder: '$0.00';
    placeholderColor: tokens.text.tertiary;

    prefix: {
      text: '$';
      fontSize: 20;
      fontWeight: 600;
      color: tokens.text.secondary;
      position: 'left';
      paddingRight: 4;
    };

    validation: {
      minValue: 1; // Minimum $1
      maxValue: 10000; // Maximum $10,000
      decimalPlaces: 2;

      errorStates: {
        belowMinimum: {
          message: 'Minimum buy is $1';
          borderColor: tokens.accent.error;
        };
        aboveMaximum: {
          message: 'Maximum buy is $10,000';
          borderColor: tokens.accent.error;
        };
        insufficientBalance: {
          message: 'Insufficient USDC balance';
          borderColor: tokens.accent.error;
          disableExecuteButton: true;
        };
      };
    };
  };

  conversionDisplay: {
    position: 'absolute';
    right: 16;
    top: '50%';
    transform: 'translateY(-50%)';

    text: {
      fontSize: 13;
      fontWeight: 500;
      color: tokens.text.secondary;
      format: '≈ X.XXX SOL'; // Dynamic conversion
    };

    calculation: {
      // USD amount ÷ SOL/USD rate = SOL amount
      formula: 'usdAmount / solPrice';
      updateFrequency: 'real-time'; // Update as user types
      precision: 3; // Show 3 decimal places for SOL
    };

    tapToSwap: {
      enabled: false; // Keep simple: USD-only input
      futureFeature: true; // Could allow SOL input mode
    };
  };

  expectedOutputDisplay: {
    position: 'below-input';
    marginTop: 12;
    height: 56;
    backgroundColor: 'rgba(255, 255, 255, 0.04)';
    borderRadius: 12;
    padding: 12;

    visibility: {
      condition: 'amountEntered && amountValid';
      animation: 'fade-in';
      duration: 200;
    };

    layout: {
      flexDirection: 'row';
      justifyContent: 'space-between';
      alignItems: 'center';
    };

    label: {
      fontSize: 13;
      fontWeight: 500;
      color: tokens.text.secondary;
      text: 'You will receive';
    };

    value: {
      fontSize: 17;
      fontWeight: 700;
      color: tokens.text.primary;
      format: 'X,XXX.XX SYMBOL'; // e.g., "1,234.56 PENGU"
    };

    slippageNote: {
      fontSize: 11;
      fontWeight: 500;
      color: tokens.text.tertiary;
      marginTop: 4;
      text: '± 1.0% slippage';
    };

    calculation: {
      // (USD amount ÷ token price) × (1 - slippage tolerance)
      formula: '(usdAmount / tokenPrice) * (1 - slippage)';
      updateFrequency: 'real-time';
      includesFees: true;
      slippageTolerance: 0.01; // 1% default
    };
  };
}
```

### Order Type Selector Sheet

```typescript
interface OrderTypeSheet {
  presentation: 'bottom-sheet';
  height: 'auto';
  maxHeight: 400;
  backgroundColor: tokens.surface.elevated;
  borderTopLeftRadius: 20;
  borderTopRightRadius: 20;

  header: {
    height: 56;
    paddingHorizontal: 16;

    title: {
      text: 'Order Type';
      fontSize: 17;
      fontWeight: 600;
      color: tokens.text.primary;
      textAlign: 'center';
    };

    closeButton: {
      position: 'absolute';
      right: 16;
      icon: 'x';
      size: 24;
      color: tokens.text.secondary;
    };
  };

  options: [
    {
      id: 'market';
      label: 'Market Buy';
      description: 'Execute immediately at current market price';
      icon: 'bolt';
      recommended: true; // Show "Recommended" badge

      style: {
        height: 72;
        paddingHorizontal: 16;
        paddingVertical: 12;
        backgroundColor: 'rgba(255, 255, 255, 0.04)';
        borderRadius: 12;
        marginBottom: 8;

        activeState: {
          backgroundColor: 'rgba(0, 208, 132, 0.15)';
          borderWidth: 2;
          borderColor: tokens.accent.success;
        };
      };
    },
    {
      id: 'limit';
      label: 'Limit Order';
      description: 'Set a specific price to buy at';
      icon: 'target';
      badge: 'Advanced';

      additionalControls: {
        limitPriceInput: {
          label: 'Limit Price';
          placeholder: '$0.00';
          height: 48;
          marginTop: 12;
        };

        expirationSelector: {
          label: 'Expires';
          options: ['1 Hour', '24 Hours', '7 Days', 'Never'];
          defaultActive: '24 Hours';
        };
      };
    },
    {
      id: 'stop';
      label: 'Stop Order';
      description: 'Trigger a buy when price reaches a level';
      icon: 'flag';
      badge: 'Advanced';

      additionalControls: {
        stopPriceInput: {
          label: 'Stop Price';
          placeholder: '$0.00';
          height: 48;
          marginTop: 12;
        };
      };
    }
  ];

  submitButton: {
    height: 56;
    backgroundColor: tokens.accent.success;
    borderRadius: 16;
    text: 'Select';
    fontSize: 17;
    fontWeight: 700;
    color: '#FFFFFF';
    marginTop: 16;
    marginHorizontal: 16;
    marginBottom: 16;
  };
}
```

### Settings Sheet (Slippage & Priority Fee)

```typescript
interface SettingsSheet {
  presentation: 'bottom-sheet';
  height: 'auto';
  backgroundColor: tokens.surface.elevated;
  borderTopLeftRadius: 20;
  borderTopRightRadius: 20;

  header: {
    height: 56;
    paddingHorizontal: 16;

    title: {
      text: 'Trade Settings';
      fontSize: 17;
      fontWeight: 600;
      color: tokens.text.primary;
      textAlign: 'center';
    };
  };

  slippageSection: {
    marginTop: 20;
    paddingHorizontal: 16;

    label: {
      text: 'Slippage Tolerance';
      fontSize: 15;
      fontWeight: 600;
      color: tokens.text.primary;
      marginBottom: 12;
    };

    description: {
      text: 'Your transaction will revert if the price changes unfavorably by more than this percentage.';
      fontSize: 13;
      fontWeight: 400;
      color: tokens.text.secondary;
      lineHeight: 18;
      marginBottom: 16;
    };

    presetOptions: {
      layout: 'horizontal-pills';
      options: [
        { value: 0.005, label: '0.5%' },
        { value: 0.01, label: '1%', recommended: true },
        { value: 0.02, label: '2%' },
        { value: 'custom', label: 'Custom' }
      ];

      pillStyle: {
        height: 40;
        paddingHorizontal: 20;
        borderRadius: 20;
        spacing: 8;

        backgroundColor: {
          default: 'rgba(255, 255, 255, 0.06)';
          active: tokens.accent.success;
        };

        textColor: {
          default: tokens.text.primary;
          active: '#FFFFFF';
        };
      };
    };

    customInput: {
      visibility: {
        condition: 'customSelected';
        animation: 'fade-in';
      };

      height: 48;
      backgroundColor: 'rgba(255, 255, 255, 0.06)';
      borderRadius: 12;
      paddingHorizontal: 16;
      marginTop: 12;

      placeholder: '0.00';
      suffix: '%';
      keyboardType: 'decimal-pad';
      maxValue: 50; // Maximum 50% slippage

      validation: {
        warningThreshold: 5; // Warn if > 5%
        warningMessage: 'High slippage may result in significant price impact';
        warningColor: tokens.accent.warning;
      };
    };
  };

  priorityFeeSection: {
    marginTop: 32;
    paddingHorizontal: 16;

    header: {
      flexDirection: 'row';
      justifyContent: 'space-between';
      alignItems: 'center';
      marginBottom: 12;

      label: {
        text: 'Priority Fee';
        fontSize: 15;
        fontWeight: 600;
        color: tokens.text.primary;
      };

      toggle: {
        size: { width: 51, height: 31 };
        trackColor: {
          false: 'rgba(255, 255, 255, 0.1)';
          true: tokens.accent.success;
        };
        thumbColor: '#FFFFFF';
        onValueChange: (value: boolean) => void;
      };
    };

    description: {
      text: 'Boost transaction speed by paying a higher network fee. Recommended during high congestion.';
      fontSize: 13;
      fontWeight: 400;
      color: tokens.text.secondary;
      lineHeight: 18;
      marginBottom: 16;
    };

    feeOptions: {
      visibility: {
        condition: 'priorityFeeEnabled';
        animation: 'slide-down';
      };

      options: [
        {
          id: 'auto';
          label: 'Auto';
          description: 'Dynamically adjusted based on network conditions';
          fee: 'Variable';
          recommended: true;
        },
        {
          id: 'fast';
          label: 'Fast';
          description: '~5-10 second confirmation';
          fee: '0.001 SOL';
        },
        {
          id: 'instant';
          label: 'Instant';
          description: '~1-3 second confirmation';
          fee: '0.005 SOL';
        },
        {
          id: 'custom';
          label: 'Custom';
          description: 'Set your own priority fee';
          fee: 'Custom';
        }
      ];

      optionStyle: {
        height: 64;
        backgroundColor: 'rgba(255, 255, 255, 0.04)';
        borderRadius: 12;
        padding: 12;
        marginBottom: 8;

        activeState: {
          backgroundColor: 'rgba(0, 208, 132, 0.15)';
          borderWidth: 2;
          borderColor: tokens.accent.success;
        };
      };
    };
  };

  saveButton: {
    height: 56;
    backgroundColor: tokens.accent.success;
    borderRadius: 16;
    text: 'Save Settings';
    fontSize: 17;
    fontWeight: 700;
    color: '#FFFFFF';
    marginTop: 24;
    marginHorizontal: 16;
    marginBottom: 16;
  };
}
```

### Trade Execution Flow

```typescript
interface TradeExecutionFlow {
  states: [
    'IDLE',           // No amount entered
    'READY',          // Valid amount entered, button enabled
    'CONFIRMING',     // User tapped execute, showing confirmation sheet
    'EXECUTING',      // Transaction being submitted
    'PENDING',        // Transaction submitted, waiting for confirmation
    'CONFIRMED',      // Transaction confirmed
    'FAILED'          // Transaction failed
  ];

  idleState: {
    executeButton: {
      disabled: true;
      backgroundColor: 'rgba(255, 255, 255, 0.1)';
      textColor: tokens.text.tertiary;
      text: 'Enter amount';
    };
  };

  readyState: {
    executeButton: {
      disabled: false;
      backgroundColor: tokens.accent.success;
      textColor: '#FFFFFF';
      text: 'Buy SYMBOL';
      hapticOnPress: 'medium';
    };
  };

  confirmingState: {
    // Show confirmation sheet before executing
    confirmationSheet: {
      presentation: 'bottom-sheet';
      height: 'auto';
      backgroundColor: tokens.surface.elevated;
      borderTopLeftRadius: 20;
      borderTopRightRadius: 20;

      content: {
        tokenIcon: { size: 64, borderRadius: 32 };

        summary: {
          label: 'You are buying';
          value: 'X,XXX SYMBOL';
          fontSize: 24;
          fontWeight: 700;
          color: tokens.text.primary;
          marginBottom: 24;
        };

        details: [
          {
            label: 'You pay';
            value: '$XX.XX USD';
            subvalue: '≈ X.XXX SOL';
          },
          {
            label: 'Estimated price';
            value: '$X.XXXX per SYMBOL';
          },
          {
            label: 'Slippage tolerance';
            value: '1.0%';
          },
          {
            label: 'Network fee';
            value: '~$0.01';
            subvalue: '0.0001 SOL';
          },
          {
            label: 'Total cost';
            value: '$XX.XX';
            emphasized: true; // Bold, larger text
          }
        ];

        detailRowStyle: {
          height: 44;
          flexDirection: 'row';
          justifyContent: 'space-between';
          borderBottom: {
            width: 1;
            color: 'rgba(255, 255, 255, 0.08)';
          };
        };
      };

      actions: {
        cancelButton: {
          height: 56;
          backgroundColor: 'rgba(255, 255, 255, 0.1)';
          text: 'Cancel';
          textColor: tokens.text.primary;
          borderRadius: 16;
        };

        confirmButton: {
          height: 56;
          backgroundColor: tokens.accent.success;
          text: 'Confirm Buy';
          textColor: '#FFFFFF';
          borderRadius: 16;
          marginTop: 12;
          hapticOnPress: 'heavy';
        };
      };
    };
  };

  executingState: {
    executeButton: {
      disabled: true;
      backgroundColor: tokens.accent.success;
      textColor: '#FFFFFF';
      text: 'Processing...';
      showSpinner: true;
      spinnerColor: '#FFFFFF';
    };

    tradePanel: {
      disableAllInputs: true;
      showLoadingOverlay: true;
      overlayOpacity: 0.6;
    };
  };

  pendingState: {
    // Transaction submitted, show pending UI
    tradePanel: {
      transform: 'slide-up-and-replace';

      pendingContent: {
        icon: {
          name: 'clock';
          size: 64;
          color: tokens.accent.warning;
          animated: true; // Pulsing animation
        };

        title: {
          text: 'Transaction Pending';
          fontSize: 20;
          fontWeight: 700;
          color: tokens.text.primary;
          marginTop: 16;
        };

        message: {
          text: 'Your buy order is being processed on the Solana blockchain.';
          fontSize: 15;
          fontWeight: 400;
          color: tokens.text.secondary;
          textAlign: 'center';
          marginTop: 8;
        };

        transactionLink: {
          text: 'View on Solscan';
          fontSize: 15;
          fontWeight: 600;
          color: tokens.accent.info;
          marginTop: 16;
          icon: 'external-link';
          iconSize: 16;
          onPress: () => void; // Open Solscan in browser
        };

        estimatedTime: {
          text: 'Estimated time: ~30 seconds';
          fontSize: 13;
          fontWeight: 500;
          color: tokens.text.tertiary;
          marginTop: 24;
        };
      };
    };
  };

  confirmedState: {
    // Transaction confirmed
    tradePanel: {
      transform: 'slide-up-and-replace';

      successContent: {
        icon: {
          name: 'check-circle';
          size: 64;
          color: tokens.accent.success;
          animated: true; // Scale bounce animation
        };

        title: {
          text: 'Purchase Complete!';
          fontSize: 20;
          fontWeight: 700;
          color: tokens.text.primary;
          marginTop: 16;
        };

        summary: {
          text: 'You bought X,XXX SYMBOL';
          fontSize: 17;
          fontWeight: 600;
          color: tokens.text.secondary;
          marginTop: 8;
        };

        transactionDetails: {
          marginTop: 24;

          details: [
            { label: 'Paid', value: '$XX.XX USD' },
            { label: 'Received', value: 'X,XXX SYMBOL' },
            { label: 'Avg. Price', value: '$X.XXXX' },
            { label: 'Transaction', value: 'abc123...def456', copyable: true }
          ];
        };

        actions: {
          viewPortfolioButton: {
            height: 56;
            backgroundColor: tokens.accent.success;
            text: 'View in Portfolio';
            textColor: '#FFFFFF';
            borderRadius: 16;
            marginTop: 24;
            onPress: () => void; // Navigate to Portfolio screen
          };

          buyMoreButton: {
            height: 56;
            backgroundColor: 'rgba(255, 255, 255, 0.1)';
            text: 'Buy More';
            textColor: tokens.text.primary;
            borderRadius: 16;
            marginTop: 12;
            onPress: () => void; // Reset to IDLE state
          };
        };
      };
    };
  };

  failedState: {
    // Transaction failed
    tradePanel: {
      transform: 'slide-up-and-replace';

      errorContent: {
        icon: {
          name: 'x-circle';
          size: 64;
          color: tokens.accent.error;
          animated: true; // Shake animation
        };

        title: {
          text: 'Transaction Failed';
          fontSize: 20;
          fontWeight: 700;
          color: tokens.text.primary;
          marginTop: 16;
        };

        errorMessage: {
          text: 'Your transaction could not be completed.';
          fontSize: 15;
          fontWeight: 400;
          color: tokens.text.secondary;
          textAlign: 'center';
          marginTop: 8;
        };

        errorReason: {
          // Dynamic based on error type
          text: 'Insufficient balance' | 'Slippage exceeded' | 'Network error';
          fontSize: 15;
          fontWeight: 600;
          color: tokens.accent.error;
          marginTop: 16;
          backgroundColor: 'rgba(255, 60, 48, 0.15)';
          padding: 12;
          borderRadius: 8;
        };

        actions: {
          tryAgainButton: {
            height: 56;
            backgroundColor: tokens.accent.success;
            text: 'Try Again';
            textColor: '#FFFFFF';
            borderRadius: 16;
            marginTop: 24;
            onPress: () => void; // Reset to READY state
          };

          cancelButton: {
            height: 56;
            backgroundColor: 'rgba(255, 255, 255, 0.1)';
            text: 'Cancel';
            textColor: tokens.text.primary;
            borderRadius: 16;
            marginTop: 12;
            onPress: () => void; // Reset to IDLE state
          };
        };
      };
    };
  };
}
```

---

## 6. Revised Specifications

### Updated TypeScript Interfaces

#### Token Detail Screen

```typescript
// apps/ios/src/types/tokenDetail.ts

export interface TokenDetailLayoutConfig {
  hero: {
    padding: { top: 16; horizontal: 16; bottom: 24 };
    priceAlignment: 'left'; // CHANGED FROM CENTERED
    tokenImagePosition: 'right'; // CHANGED FROM LEFT
    tokenImageSize: 56; // CHANGED FROM 48
    marketCapPosition: 'header-right'; // NEW
  };

  chart: {
    width: '100%'; // Edge-to-edge
    height: 280;
    defaultType: 'area'; // NEW
    allowToggle: true; // NEW
    timeframePills: {
      options: ['1H', '1D', '1W', '1M', '3M', '1Y'];
      defaultActive: '1D';
    };
  };

  tradePanel: {
    style: 'collapsed-persistent'; // NEW - Robinhood pattern
    presetCurrency: 'USD'; // CHANGED FROM SOL
    presetValues: [10, 50, 100]; // CHANGED FROM [0.1, 0.5, 1.0]
    showBalanceInHeader: true; // NEW
    showOrderTypeSelector: true; // NEW
    showMarketCapInBody: true; // NEW
  };
}

export interface TokenHeroProps {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  changeAmount24h: number;
  marketCap: number;
  tokenImageUrl: string;
  onWatchlistToggle: () => void;
  isInWatchlist: boolean;
}

export interface TokenHeroLayout {
  // Top row: Label (left) + MC + Image (right)
  topRow: {
    left: { text: 'SYMBOL • Full Name'; fontSize: 14; color: 'secondary' };
    right: [
      { text: 'MC: $XXX.XM'; fontSize: 15; color: 'secondary'; marginRight: 68 };
      { image: { size: 56; borderRadius: 28; position: 'absolute-right' } }
    ];
  };

  // Second row: Price (left-aligned, large)
  priceRow: {
    price: { fontSize: 40; fontWeight: 700; color: 'primary'; alignment: 'left' };
  };

  // Third row: Change amount + percentage (left-aligned)
  changeRow: {
    amount: { fontSize: 16; fontWeight: 600; color: 'dynamic'; prefix: '+' | '-' };
    percentage: { fontSize: 16; fontWeight: 600; color: 'dynamic'; format: '(±X.XX%)' };
  };
}

export interface ChartConfig {
  type: 'area' | 'candlestick';

  areaChart: {
    lineWidth: 2;
    lineColor: 'dynamic'; // Based on 24h change
    gradient: { start: 'rgba(0, 208, 132, 0.3)'; end: 'transparent' };
    curveType: 'monotoneX';
    showAxes: false;
    interactive: true;
    crosshair: { enabled: true; lineColor: 'rgba(255, 255, 255, 0.3)' };
    tooltip: {
      backgroundColor: 'surface.elevated';
      format: '$X.XXXXXX @ HH:MM';
    };
  };

  candlestickChart: {
    bullishColor: '#00D084';
    bearishColor: '#FF3B30';
    wickWidth: 1;
    showAxes: { x: true; y: true };
    axisLabelStyle: { fontSize: 11; color: 'secondary' };
    interactive: true;
    tooltip: {
      format: 'OHLC-grid';
      layout: '2x2';
    };
  };

  controls: {
    timeframePills: {
      height: 28;
      pills: ['1H', '1D', '1W', '1M', '3M', '1Y'];
      spacing: 8;
    };

    chartTypeToggle: {
      position: 'absolute-right';
      size: 28;
      icon: 'chart-candlestick' | 'chart-line';
    };
  };
}

export interface TradePanelConfig {
  position: 'sticky-bottom';
  backgroundColor: 'surface.elevated';
  borderTopRadius: 20;
  padding: { top: 12; horizontal: 16; bottom: 16 };

  header: {
    height: 40;

    orderTypeSelector: {
      text: 'Market Buy' | 'Limit' | 'Stop';
      style: 'pill';
      height: 32;
      onPress: 'show-order-type-sheet';
    };

    balanceDisplay: {
      text: 'USDC: X.XX';
      position: 'right';
      fontSize: 14;
      color: 'secondary';
    };

    settingsButton: {
      icon: 'gear';
      size: 24;
      position: 'absolute-right';
      onPress: 'show-settings-sheet';
    };
  };

  body: {
    tokenDisplay: {
      icon: { size: 48; borderRadius: 24; centered: true };
      symbol: { fontSize: 20; fontWeight: 700; centered: true };
      marketCap: { text: 'MC: $XXX.XM'; fontSize: 13; centered: true };
    };

    presetButtons: {
      values: [10, 50, 100]; // USD amounts
      labels: ['$10', '$50', '$100'];
      layout: 'horizontal-row';
      spacing: 12;
      height: 40;
      activeState: {
        backgroundColor: 'rgba(0, 208, 132, 0.2)';
        borderColor: '#00D084';
      };
    };

    customAmountInput: {
      height: 48;
      prefix: '$';
      placeholder: '$0.00';
      keyboardType: 'decimal-pad';
      conversionDisplay: {
        text: '≈ X.XXX SOL';
        position: 'right';
        fontSize: 13;
      };
    };

    executeButton: {
      height: 56;
      backgroundColor: '#00D084';
      text: 'Buy SYMBOL';
      fontSize: 17;
      fontWeight: 700;
    };
  };

  expandButton: {
    position: 'above-panel';
    icon: 'chevron-up' | 'chevron-down';
    size: 24;
  };
}
```

#### Discovery/Tracking Screens

```typescript
// apps/ios/src/types/discovery.ts

export interface DiscoveryLayoutConfig {
  sections: [
    {
      type: 'horizontal-scroll';
      title: 'Top Movers';
      component: 'TopMoversCards';
      cardWidth: 140;
      cardHeight: 96;
      spacing: 12;
    },
    {
      type: 'vertical-list';
      title: 'Trending Tokens';
      component: 'TokenListItem';
      itemHeight: 72;
    },
    {
      type: 'horizontal-scroll';
      title: 'Your Watchlist';
      component: 'WatchlistCards';
      cardWidth: 140;
      cardHeight: 96;
    }
  ];
}

export interface TopMoversCardProps {
  symbol: string;
  price: number;
  change24h: number;
  sparklineData: number[];
  tokenImageUrl: string;
  onPress: () => void;
}

export interface TopMoversCardLayout {
  width: 140;
  height: 96;
  backgroundColor: 'rgba(255, 255, 255, 0.06)';
  borderRadius: 12;
  padding: 12;

  tokenIcon: { size: 32; position: 'top-left' };
  symbol: { fontSize: 13; fontWeight: 600; marginTop: 8 };
  price: { fontSize: 15; fontWeight: 700; marginTop: 2 };
  sparkline: { width: '100%'; height: 32; position: 'bottom' };
  changePercentage: { fontSize: 13; position: 'top-right'; color: 'dynamic' };
}

export interface TrackingLayoutConfig {
  header: {
    segmentedControl: {
      segments: ['Friends', 'Global', 'My Trades'];
      height: 32;
      activeStyle: { backgroundColor: 'white'; textColor: 'black' };
    };
  };

  yourRankCard: {
    height: 80;
    backgroundColor: 'linear-gradient(135deg, #6366F1, #8B5CF6)';
    borderRadius: 16;
    padding: 16;
    marginBottom: 16;
  };

  leaderboardList: {
    itemHeight: 64;
    itemSpacing: 8;
    component: 'LeaderboardListItem';
  };
}

export interface LeaderboardListItemProps {
  rank: number;
  userId: string;
  displayName: string;
  handle: string;
  avatarUrl: string;
  pnl24h: number;
  tradedTokens: string[]; // Array of token image URLs
}

export interface LeaderboardListItemLayout {
  height: 64;
  backgroundColor: 'rgba(255, 255, 255, 0.04)';
  borderRadius: 12;
  padding: 12;

  rankBadge: {
    width: 32;
    position: 'left';
    specialStyling: {
      top3: {
        size: 28;
        borderRadius: 14;
        gradients: {
          1: 'linear-gradient(135deg, #FFD700, #FFA500)';
          2: 'linear-gradient(135deg, #C0C0C0, #A8A8A8)';
          3: 'linear-gradient(135deg, #CD7F32, #B8732D)';
        };
      };
    };
  };

  avatar: { size: 40; borderRadius: 20; marginLeft: 44 };

  userInfo: {
    displayName: { fontSize: 15; fontWeight: 600 };
    handle: { fontSize: 13; fontWeight: 400; color: 'secondary' };
  };

  pnl: {
    position: 'right';
    fontSize: 17;
    fontWeight: 700;
    color: 'dynamic';
    format: '+$X,XXX' | '-$X,XXX';
  };

  tokenPills: {
    position: 'far-right';
    size: 24;
    overlap: -4;
    maxVisible: 3;
  };
}
```

---

## 7. Key Plan Revisions Summary

### Critical Changes from UX_OVERHAUL_PLAN.md

#### 1. Token Detail Hero Layout
**BEFORE:**
- Token image: Left side, 48px
- Price: Centered
- Token label: Above price, centered
- Market cap: Below chart

**AFTER (Robinhood pattern):**
- Token image: Right side, 56px
- Price: Left-aligned, 40pt
- Token label: Top left, 14pt
- Market cap: Top right (next to token image)

**Rationale:** Robinhood's layout is more scannable for LTR languages. Large left-aligned price is the primary focus, while token image on right provides visual anchor without competing for attention.

#### 2. Preset Button Currency
**BEFORE:**
- Preset values: 0.1 SOL, 0.5 SOL, 1.0 SOL
- User must understand SOL/USD conversion
- Different mental model per token

**AFTER (Robinhood pattern):**
- Preset values: $10, $50, $100 USD
- Universal fiat understanding
- Consistent across all tokens

**Rationale:** Retail users think in dollars, not crypto amounts. This lowers cognitive load and increases accessibility. Backend handles conversion to token amounts.

#### 3. Trade Panel Structure
**BEFORE:**
- Simple sticky bar with amount input + execute button
- Settings accessed via separate screen
- Order type always "Market Buy"

**AFTER (Robinhood pattern):**
- Collapsed persistent panel with rich controls
- Header: Order type selector + balance display + settings
- Body: Token identity + MC + presets + input
- Expandable for advanced controls
- Settings sheet accessible from gear icon

**Rationale:** Robinhood's panel provides essential context (balance, order type, market cap) without leaving the screen. Collapsed state keeps it compact; expansion reveals power user features.

#### 4. Chart Enhancements
**BEFORE:**
- Single area chart
- Fixed timeframe (24H)
- No chart type options

**AFTER (Hybrid Robinhood + GMGN):**
- Default: Area chart (Robinhood style)
- Toggle: Candlestick chart (GMGN style)
- Timeframe selector: 1H, 1D, 1W, 1M, 3M, 1Y
- Edge-to-edge width for maximum data visibility
- Chart type toggle button (top-right)

**Rationale:** Area charts are simpler for casual users; candlesticks provide depth for traders. Toggle gives users choice without cluttering default view.

#### 5. Discovery Screen Additions
**BEFORE:**
- Vertical list of tokens only
- No visual hierarchy for "top movers"
- Watchlist separate tab

**AFTER (Copilot pattern):**
- Horizontal scrolling "Top Movers" cards at top
- Cards include sparklines for quick trend visualization
- Watchlist section with same card treatment
- Vertical list for "All Tokens" below

**Rationale:** Copilot's horizontal cards create visual hierarchy and make important tokens (movers, watchlist) more prominent. Sparklines add at-a-glance context.

#### 6. Tracking Screen (Leaderboard)
**BEFORE:**
- Simple list of user trades
- No social/competitive features
- Focus on personal history only

**AFTER (Fommo pattern):**
- Segmented control: Friends | Global | My Trades
- "Your Rank" card at top (gradient background)
- Ranked list with medal styling for top 3
- Token pills showing which tokens user traded
- PnL as primary metric

**Rationale:** Social features increase engagement. Leaderboard creates gamification. Showing traded tokens adds context to performance.

#### 7. Warning Banners
**BEFORE:**
- No token risk indicators
- User must research token safety independently

**AFTER (GMGN pattern):**
- Conditional warning banner above trade panel
- Triggers: Unverified token, low liquidity, high volatility
- Amber color (#F59E0B) with icon
- Dismissible but persistent per session

**Rationale:** Protect users from risky trades. Amber warnings (not red errors) inform without blocking action.

#### 8. Trade Execution Flow
**BEFORE:**
- Immediate execution on button press
- No confirmation step
- Minimal feedback during processing

**AFTER (Enhanced flow):**
- Confirmation sheet with transaction summary
- Shows: Amount, price, slippage, fees, total cost
- Pending state with transaction link
- Success/failure states with detailed feedback
- Option to view in Portfolio or buy more

**Rationale:** Confirmation prevents mistakes. Rich feedback builds trust and helps users track transactions.

#### 9. Order Types
**BEFORE:**
- Market orders only

**AFTER:**
- Market Buy (default, recommended)
- Limit Order (advanced)
- Stop Order (advanced)
- Selector in trade panel header
- Bottom sheet for order type selection

**Rationale:** Advanced traders need limit/stop orders. Keeping "Market" as default with "Recommended" badge guides casual users while serving power users.

#### 10. Settings & Customization
**BEFORE:**
- Fixed slippage (1%)
- No priority fee options
- No user preferences

**AFTER:**
- Slippage: Preset (0.5%, 1%, 2%) or custom
- Priority fee: Toggle with Auto/Fast/Instant/Custom options
- Settings accessible via gear icon in trade panel
- Preferences persisted per user

**Rationale:** Solana's variable network conditions require flexibility. Auto settings serve most users; custom options empower advanced traders.

---

### Implementation Priority

**Phase 1 (Critical):**
1. Token detail hero layout (price left, image right, MC in header)
2. USD preset buttons in trade panel
3. Edge-to-edge area chart
4. Basic trade panel (collapsed state only)
5. Confirmation sheet before execution

**Phase 2 (Important):**
6. Chart type toggle (area ↔ candlestick)
7. Expanded trade panel state
8. Order type selector (Market/Limit/Stop)
9. Settings sheet (slippage, priority fee)
10. Warning banners

**Phase 3 (Enhancement):**
11. Horizontal "Top Movers" cards on Discovery
12. Leaderboard on Tracking screen
13. Sparklines in list items
14. Token pills in leaderboard
15. Your Rank card

**Phase 4 (Polish):**
16. Animations (chart draw-in, panel expand/collapse)
17. Haptic feedback throughout
18. Empty states for all screens
19. Error handling refinement
20. Accessibility improvements

---

### Accessibility Annotations

**Screen Reader Support:**
- Token price: "Price: [value] dollars, [change] percent [up/down] in 24 hours"
- Chart: "Price chart, [timeframe], current price [value], swipe to explore data points"
- Preset buttons: "Quick buy [amount] dollars button"
- Trade panel: "Trade panel, [order type], balance [amount], [number] of controls"

**Color Contrast:**
- All text meets WCAG AA (4.5:1 minimum)
- Success green #00D084 on dark background: 3.2:1 (large text only)
- Error red #FF3B30 on dark background: 3.5:1 (large text only)
- Secondary text #8E8E93 on #000000: 4.6:1 ✓

**Touch Targets:**
- Minimum 44×44 pt for all interactive elements
- Pill buttons: 28px height × 40px+ width (meets minimum)
- Icon buttons: 24×24 icon in 44×44 touch target
- List items: 64-72px height (exceeds minimum)

**Dynamic Type:**
- Support iOS Dynamic Type scaling
- Layout adapts to larger text sizes
- Minimum font: 11pt (13pt preferred for body text)

**VoiceOver Navigation:**
- Logical reading order: Top → Bottom, Left → Right
- Group related elements (trade panel as single container)
- Announce state changes ("Loading...", "Transaction confirmed")

**Reduce Motion:**
- Respect iOS Reduce Motion setting
- Disable chart draw-in animation
- Replace slide animations with fade
- Keep crosshair interactions (essential for chart exploration)

---

### Performance Considerations

**Chart Rendering:**
- Use Skia for canvas rendering (60fps target)
- Debounce crosshair updates (16ms throttle)
- Lazy load historical data (fetch on timeframe change)
- Cache chart paths (regenerate only on data change)
- Limit max data points: 100 for sparklines, 500 for detail charts

**Trade Panel:**
- Memoize preset buttons (prevent re-render on input change)
- Debounce custom amount input (300ms)
- Throttle conversion calculation (100ms)
- Cache token icon images (AsyncStorage or disk cache)

**List Virtualization:**
- Use FlashList for Discovery/Tracking lists
- Estimated item size: 72px
- Overscan: 2 screens worth of items
- Recycle item views (no re-mount on scroll)

**Image Loading:**
- Use fast-image for token icons
- Placeholder: Gray circle with first letter
- Cache policy: Memory + disk
- Resize images to display size (48px, 56px, 64px variants)

**Network Optimization:**
- WebSocket for real-time price updates
- Polling fallback (5s interval)
- Aggregate updates (batch multiple tokens)
- Cancel in-flight requests on unmount

---

## Conclusion

This analysis synthesizes patterns from 5 reference apps into a cohesive design system for Quickscope iOS. The most significant insights are:

1. **Robinhood's token detail layout** (price left, image right) is superior for scannability
2. **USD presets** ($10, $50, $100) dramatically reduce cognitive load vs SOL amounts
3. **Edge-to-edge charts** maximize data visibility on mobile screens
4. **Collapsed trade panels** provide context (balance, order type, MC) without clutter
5. **Horizontal scrolling cards** (Copilot) create visual hierarchy for important tokens
6. **Leaderboards** (Fommo) add social/competitive engagement to tracking

The specifications above provide pixel-perfect measurements, TypeScript interfaces, and implementation notes for all critical components. This document should be used in conjunction with `UX_OVERHAUL_PLAN.md` to guide development of the new Quickscope iOS interface.

**Next Steps:**
1. Review this analysis with design team
2. Create high-fidelity mockups based on specifications
3. Update component library with new patterns
4. Implement Phase 1 (critical) changes
5. Conduct usability testing with target users
6. Iterate based on feedback

**Files to Update:**
- `/apps/ios/src/screens/TokenDetailScreen.tsx` (hero layout, chart, trade panel)
- `/apps/ios/src/screens/DiscoveryScreen.tsx` (horizontal cards)
- `/apps/ios/src/screens/TrackingScreen.tsx` (leaderboard)
- `/apps/ios/src/ui/TokenChart.tsx` (add candlestick support)
- `/apps/ios/src/theme/tokens.ts` (add new color tokens if needed)
- `/apps/ios/UX_OVERHAUL_PLAN.md` (update with revisions from Section 7)
