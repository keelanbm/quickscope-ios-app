# Mobile UI/UX Research: Premium App Patterns

**Research Date:** February 2026
**Purpose:** Extract actionable design patterns from top-tier mobile apps to inform Quickscope's UI/UX implementation

---

## 1. Robinhood (Stock/Crypto Trading)

### Information Hierarchy
- **Portfolio value front and center**: Large, bold typography (32-36pt) at top of home screen
- **Gain/loss secondary but prominent**: Color-coded (green/red), medium weight, 16-18pt
- **List items prioritized by**: Stock symbol (bold, 15-16pt) > Current price (regular, 15pt) > Change % (medium, 14pt, colored)
- **Progressive disclosure**: Tap any stock to see full details; home shows just enough to act

### Card/List Design
- **Minimal card borders**: Uses subtle dividers (1px, opacity 0.1) rather than full card backgrounds
- **Compact height**: Stock list items ~64-72px tall
- **Left-aligned data**: Symbol and name stacked left, price data right-aligned
- **Mini sparkline charts**: 40px tall, 60-80px wide, embedded right in list items
- **No shadows**: Relies on dividers and whitespace for separation

### Bottom Sheets & Modals
- **Buy/Sell sheet slides from bottom**: Smooth spring animation (0.3s, easeInOut)
- **Persistent header**: Draggable handle + symbol/price stays visible while scrolling
- **Sheet has rounded corners**: 12-16px radius at top
- **Backdrop dimming**: 40-50% black overlay with slight blur
- **Dismissible**: Swipe down, tap outside, or explicit close button

### Micro-interactions
- **Price updates**: Subtle fade animation when prices change (0.2s)
- **Haptic feedback**: Light impact on tab switch, medium on order confirmation
- **Button press states**: Scale down to 0.97 on press
- **Slider interactions**: Haptic ticks when dragging order size slider
- **Pull-to-refresh**: Custom animated logo spinner

### Typography System
```
Heading 1 (Portfolio Value): SF Pro Display, Semibold, 32-36pt
Heading 2 (Section Headers): SF Pro Display, Semibold, 20-22pt
Body (Stock Names): SF Pro Text, Regular, 15-16pt
Body Emphasis (Symbols): SF Pro Text, Semibold, 15-16pt
Caption (Metadata): SF Pro Text, Regular, 13-14pt
Caption Small (Timestamps): SF Pro Text, Regular, 11-12pt
```
- **Line height**: 1.2-1.3 for headers, 1.4-1.5 for body text
- **Letter spacing**: Tight (-0.3 to -0.5) for large numbers to feel compact and confident

### Color Usage
- **Extremely minimal palette**:
  - Background: Pure white (#FFFFFF) in light, true black (#000000) in dark
  - Primary text: #000000 (light) / #FFFFFF (dark)
  - Secondary text: rgba(0,0,0,0.6) / rgba(255,255,255,0.6)
  - Success/Gain: #00C805 (bright, confident green)
  - Danger/Loss: #FF5000 (energetic red-orange)
  - Primary action: #00C805 (same as success)
- **Color for meaning only**: No decorative colors; green/red only for financial data
- **Subtle backgrounds**: Input fields use rgba(0,0,0,0.03) in light mode

### Touch Targets & Gestures
- **Minimum touch target**: 44pt iOS standard strictly followed
- **Stock list swipe**: No swipe actions; simplicity over feature density
- **Chart scrubbing**: Long-press anywhere on chart to see crosshair + price at point
- **Tab bar**: Large 49pt height with clear icons and labels

### Navigation Patterns
- **Bottom tab bar**: 5 items max, icons + labels, simple and predictable
- **Stack navigation**: Standard iOS push/pop for detail screens
- **No hamburger menus**: Everything accessible from tabs
- **Search**: Dedicated tab, not hidden in navigation

### Data Density vs Whitespace
- **Breathing room prioritized**: 16-20px horizontal padding on main content
- **Vertical spacing**: 12-16px between list items (via divider padding)
- **Chart gets full width**: Bleeds to edges for maximum data visibility
- **Numbers need space**: Never crowd financial figures

### Loading States
- **Skeleton screens**: Gray rectangles (rgba(0,0,0,0.06)) pulse subtly (2s loop)
- **Layout identical to loaded state**: Same heights, positions
- **Price updates**: Instant, no spinner for real-time data
- **Page loads**: Top-loading bar (2px, green) for full refreshes

### Empty States
- **Centered illustration**: Simple line art, 120-160px tall
- **Helpful copy**: "Start building your portfolio" with clear CTA below
- **Suggested actions**: "Browse stocks" button prominently placed
- **Maintains structure**: Empty list still shows headers and section layout

---

## 2. Copilot (Personal Finance)

### Information Hierarchy
- **Current month spending at top**: Large number (28-32pt) with visual spending bar
- **Category breakdown**: Card-based, sorted by amount spent (highest first)
- **Time period selector**: Prominent but secondary (Month/Year toggle at top)
- **Account balances**: Expandable section, not immediately visible (reduces anxiety)

### Card/List Design
- **Thick, rounded cards**: 12-16px radius, 4-8px shadows for depth
- **Card padding**: Generous 16-20px all around
- **Category cards**: 100-120px tall, full-width, 12px margin between
- **Color-coded categories**: Each has subtle background tint + icon
- **Transaction rows**: 64px tall, left icon + description, right amount

### Bottom Sheets & Modals
- **Category drill-down**: Full screen push rather than sheet
- **Date picker**: Custom bottom sheet with month/year scrollers
- **Transaction detail**: Slides up from bottom, 70% screen height
- **Edit modals**: Full screen with "Cancel" and "Save" in header

### Micro-interactions
- **Spending bar animates in**: Fills from 0 to current on screen appearance (0.6s ease-out)
- **Card entrance**: Staggered fade-up (0.1s delay between each, 0.3s duration)
- **Category tap**: Subtle scale (1.0 -> 0.98) then spring to detail view
- **Amount updates**: Count-up animation when values change (0.4s)
- **Haptics**: Medium impact on category selection, heavy on transaction sync

### Typography System
```
Hero Numbers (Monthly Total): SF Pro Rounded, Bold, 28-32pt
Section Headers: SF Pro Text, Semibold, 18-20pt
Category Names: SF Pro Text, Medium, 16-17pt
Transaction Descriptions: SF Pro Text, Regular, 15-16pt
Amounts: SF Pro Mono, Semibold, 15-16pt (for alignment)
Metadata: SF Pro Text, Regular, 13-14pt
```
- **Rounded font for friendliness**: SF Pro Rounded on large numbers makes finance less intimidating
- **Monospace for currency**: Perfect alignment in lists

### Color Usage
- **Warmer, friendlier palette**:
  - Primary brand: #3A6DFF (friendly blue)
  - Success: #00D395 (teal-green, less aggressive than Robinhood)
  - Warning: #FFB800 (amber for approaching limits)
  - Danger: #FF3B30 (iOS red)
  - Background: #F8F9FA (off-white, softer than pure white)
  - Card backgrounds: #FFFFFF with subtle shadow
- **Category colors**: 10-12 pastel colors (15% opacity backgrounds with full-opacity icons)
- **More color overall**: Feels approachable, not sterile

### Touch Targets & Gestures
- **Transaction swipe**: Left swipe reveals categorize/exclude actions (80px buttons)
- **Pull-to-refresh**: Standard iOS pattern with custom animation
- **Long-press transaction**: Shows quick actions menu (categorize, add note, split)
- **Spending bar**: Tappable for monthly overview

### Navigation Patterns
- **Bottom tabs**: 4 main sections (Home, Transactions, Budgets, Accounts)
- **Header navigation**: Back button + screen title centered
- **Floating action button**: "Add transaction" in bottom-right on relevant screens
- **Settings**: Gear icon top-right, consistent position

### Data Density vs Whitespace
- **More whitespace than Robinhood**: Finance is stressful; space reduces cognitive load
- **Card-based layout**: Natural separation and chunking of information
- **Maximum 3-4 cards visible**: Encourages focus on one category at a time
- **Padding ratios**: ~20% of card height is padding (top/bottom combined)

### Loading States
- **Skeleton cards**: Full card shapes with pulsing internal elements
- **Shimmer effect**: Left-to-right shine animation (1.5s loop)
- **Progressive loading**: Shows structure immediately, fills in data as it arrives
- **Sync indicator**: Small circular progress in top-right during background sync

### Empty States
- **Friendly illustrations**: Colorful, hand-drawn style (200-240px tall)
- **Encouraging copy**: "You're all caught up!" or "No transactions this month"
- **Contextual actions**: "Add your first account" or "Connect a bank"
- **Not stark white**: Maintains background color to reduce harshness

---

## 3. X (Twitter) - Feed Design

### Information Hierarchy
- **Content first**: Tweet text is largest, most prominent element (15-17pt)
- **Author secondary**: Name (bold, 15pt) and handle (regular, 15pt, gray) above content
- **Metadata tertiary**: Timestamp, view count, engagement metrics (13pt, gray)
- **Media prioritized**: Images/videos expand to full width, dominate attention

### Card/List Design
- **Minimal dividers**: 1px lines (rgba(0,0,0,0.08)) between tweets
- **No card backgrounds**: Feed is continuous scroll, not discrete cards
- **Tweet height**: Variable based on content, typically 140-200px for text-only
- **Avatar size**: 40-48px, circular, aligned top-left
- **Content offset**: 56-60px left margin (avatar + padding) for text alignment

### Bottom Sheets & Modals
- **Compose tweet**: Slides up from bottom, full screen with "Cancel" and "Post" buttons
- **Quote/Reply**: Sheet shows original tweet at top, compose area below
- **Share sheet**: Native iOS share sheet for most actions
- **Image viewer**: Full-screen modal with black background, swipe-to-dismiss

### Micro-interactions
- **Like animation**: Heart scales and fills with red (0.3s spring, bounces to 1.2 then settles to 1.0)
- **Retweet**: Icon rotates 180deg and turns green (0.25s)
- **Pull-to-refresh**: Custom bird icon spins
- **Haptic**: Light impact on tab switch, medium on like/retweet
- **Scroll-triggered header**: Hides on scroll down, reappears on scroll up (0.2s ease-in-out)

### Typography System
```
Tweet Text: SF Pro Text, Regular, 15-17pt
Tweet Text (Large setting): SF Pro Text, Regular, up to 23pt
User Name: SF Pro Text, Bold, 15pt
User Handle: SF Pro Text, Regular, 15pt
Engagement Counts: SF Pro Text, Regular, 13pt
Timestamp: SF Pro Text, Regular, 13pt
Trending Topic: SF Pro Text, Bold, 15pt
Trending Count: SF Pro Text, Regular, 13pt
```
- **Dynamic Type support**: Respects iOS accessibility text sizing
- **Line height**: 1.5 for readability in feed context

### Color Usage
- **Monochrome with blue accent**:
  - Primary action: #1D9BF0 (Twitter blue)
  - Text primary: #0F1419 (light) / #E7E9EA (dark)
  - Text secondary: #536471 (light) / #71767B (dark)
  - Like red: #F91880
  - Retweet green: #00BA7C
  - Background: #FFFFFF (light) / #000000 (dark)
- **Color only for interaction**: Blue for links/actions, red/green for engagement

### Touch Targets & Gestures
- **Tweet tap**: Entire row (minus buttons) opens detail view
- **Button targets**: 44x44pt minimum, generously spaced (16-20px between)
- **Swipe actions**: Right swipe on tweet for quick reply
- **Long-press**: Context menu for share, bookmark, mute, report
- **Double-tap**: Like (disabled by default, was a test feature)

### Navigation Patterns
- **Bottom tab bar**: 5 tabs (Home, Search, Compose, Notifications, Messages)
- **Top navigation**: Profile avatar (left) and settings (right) on Home
- **Compose button**: Floating action button in bottom-right (persistent)
- **Back navigation**: Standard iOS back button with screen title

### Data Density vs Whitespace
- **Compact but readable**: 12-16px vertical padding per tweet
- **Horizontal padding**: 12-16px on edges
- **Dense information**: Multiple tweets per screen (3-4 typical)
- **Breathing room in detail**: Individual tweet view has more padding (20-24px)

### Loading States
- **Infinite scroll**: Spinner appears at bottom when loading more (24px, blue)
- **Pull-to-refresh**: Stretches logo, releases to refresh
- **Tweet loading**: Skeleton shows avatar + 3 gray bars (text simulation)
- **Image loading**: Gray placeholder with fade-in when loaded (0.2s)

### Empty States
- **Timeline**: "Welcome to X" with follow suggestions
- **Search**: Recent searches or trending topics
- **Notifications**: "Nothing to see here" with illustration
- **Maintains chrome**: Tab bar and header stay visible

---

## 4. Spotify - Music Streaming

### Information Hierarchy
- **Album art dominates**: Large, high-quality images (200-300px on detail screens)
- **Song title primary**: Bold, 16-18pt, above artist name
- **Artist name secondary**: Regular, 14-15pt, muted color
- **Playback controls central**: Large buttons (60-80px) in now-playing view
- **Context tertiary**: Playlist info, release dates, etc. in smaller text

### Card/List Design
- **Rich card designs**: Heavy use of album art as card backgrounds
- **Gradient overlays**: Black gradient (opacity 0-70%) over images for text legibility
- **Card sizes vary**: Small (48px square), medium (140px), large (200px+)
- **Horizontal scrolling**: Cards in rows, multiple rows per screen
- **Playlist cards**: 160x160px square, 12px radius, 8px spacing

### Bottom Sheets & Modals
- **Now Playing expands**: Tap mini-player to expand full-screen (spring animation, 0.4s)
- **Mini-player persistent**: 60px tall bar at bottom, shows art + title + controls
- **Queue sheet**: Slides from bottom, draggable, shows upcoming songs
- **Artist info**: Full-screen modal with parallax header image
- **Playlist edit**: Bottom sheet with search and toggles

### Micro-interactions
- **Play button**: Scales and pulses on tap (0.2s)
- **Heart/like**: Fills with green, subtle bounce (0.3s spring)
- **Shuffle/repeat**: Rotate and color change when toggled
- **Scrubbing timeline**: Large touch area, haptic ticks every 5 seconds
- **Volume slider**: Smooth with haptic feedback at 0% and 100%
- **Crossfade**: Animations between song changes

### Typography System
```
Now Playing Title: SF Pro Display, Bold, 20-22pt
Artist Name (Now Playing): SF Pro Text, Semibold, 16pt
Playlist Headers: SF Pro Display, Bold, 28-32pt
Song Titles: SF Pro Text, Regular, 15-16pt
Section Headers: SF Pro Display, Bold, 22-24pt
Metadata: SF Pro Text, Regular, 13-14pt
Tab Labels: SF Pro Text, Medium, 10pt
```
- **Bold headlines**: Creates excitement and energy
- **Generous line spacing**: 1.4-1.5 for song lists

### Color Usage
- **Dark-first design**: App feels best in dark mode (true black #000000 or #121212)
- **Brand green**: #1DB954 for primary actions, active states
- **Muted palette**: Grays (multiple shades) for hierarchy
- **Adaptive colors**: Extracts colors from album art for backgrounds (blur + darken)
- **White text default**: Maximum contrast on dark backgrounds
- **Status colors**: Green for playing, gray for paused

### Touch Targets & Gestures
- **Mini-player swipe**: Swipe up to expand, swipe down to collapse
- **Song swipe**: Right swipe to like, left swipe to hide (in some contexts)
- **3-dot menu**: Opens bottom sheet with actions (Add to playlist, Share, etc.)
- **Long-press**: Shows quick actions menu
- **Pinch-to-zoom**: On album art in now-playing view

### Navigation Patterns
- **Bottom tab bar**: 3 main tabs (Home, Search, Your Library)
- **Top navigation**: Back button (left), share/more (right)
- **Sticky headers**: Section titles stick to top while scrolling
- **Deep linking**: Artist -> Albums -> Songs, always navigable back

### Data Density vs Whitespace
- **Visual-first**: Large images reduce need for text density
- **Horizontal scrolling reduces vertical cramming**: Each row focused on one content type
- **Generous padding on lists**: 16-20px horizontal, 12-16px vertical
- **Now-playing is sparse**: Focus on playback, minimal distractions

### Loading States
- **Progressive image loading**: Low-res placeholder, fade to high-res (0.3s)
- **Skeleton screens**: Gray shapes for text and images
- **Spinner**: Circular, white on dark background, 32px
- **Content loads in sections**: Home rows appear one at a time

### Empty States
- **Search before typing**: Shows recent searches and browse categories
- **No search results**: "Couldn't find {query}" with suggestions below
- **Empty library**: "Your library is empty" with "Find something you love" CTA
- **Offline mode**: Clear messaging about what's available offline

---

## 5. Eight Sleep - Sleep Tracking

### Information Hierarchy
- **Sleep score hero**: Massive number (48-56pt) at top of morning summary
- **Score interpretation**: "Great sleep" text below score (18-20pt)
- **Time slept/in bed**: Secondary metrics (32-36pt) in cards below hero
- **Sleep stages graph**: Large, interactive chart showing sleep phases
- **Detail metrics**: Heart rate, HRV, temperature in smaller cards at bottom

### Card/List Design
- **Thick, premium cards**: 16-20px radius, 8-12px shadow with colored tint
- **Full-width cards**: 0px horizontal margin, cards touch screen edges
- **Internal padding**: 20-24px all sides (very generous)
- **Card heights**: Vary by content, typically 120-180px
- **Background gradients**: Subtle gradients in cards (dark blue to darker blue)
- **Metric cards**: 2-column grid, square-ish proportions

### Bottom Sheets & Modals
- **Bed controls**: Bottom sheet with temperature sliders and bed side selection
- **Alarm settings**: Full-screen modal with time picker and smart alarm options
- **Stat detail**: Tap any metric to see historical chart in bottom sheet
- **Onboarding**: Full-screen modals with illustrations and progressive steps

### Micro-interactions
- **Score count-up**: Animates from 0 to actual score on screen load (1.0s ease-out)
- **Temperature slider**: Real-time preview of setting, haptic feedback every 0.5 degree
- **Graph scrubbing**: Tap-hold to see exact time and sleep stage
- **Card reveal**: Staggered entrance from bottom (0.15s delay between, 0.4s duration)
- **Haptics**: Rich haptic language (light/medium/heavy used contextually)

### Typography System
```
Sleep Score: SF Pro Display, Bold, 48-56pt
Score Label: SF Pro Text, Medium, 18-20pt
Metric Numbers: SF Pro Display, Semibold, 32-36pt
Metric Labels: SF Pro Text, Medium, 14-15pt
Chart Labels: SF Pro Text, Regular, 11-12pt
Body Text: SF Pro Text, Regular, 15-16pt
Section Headers: SF Pro Display, Bold, 22-24pt
```
- **Display font for numbers**: Makes metrics feel important
- **Clear hierarchy**: 3-4x size difference between hero and support text

### Color Usage
- **Dark, premium palette**:
  - Background: #0A0E27 (deep navy, not pure black)
  - Card backgrounds: #131B3A with gradient to #0F1530
  - Primary brand: #5B8EFF (calm blue)
  - Success: #4CAF50 (green for good sleep)
  - Warning: #FFB74D (amber for ok sleep)
  - Danger: #E57373 (soft red for poor sleep)
  - Text: #FFFFFF with varying opacities (100%, 70%, 50%)
- **Score-based colors**: Score 85+ = green, 70-84 = blue, <70 = amber/red
- **Chart colors**: Each sleep stage has distinct color (REM = purple, Deep = blue, Light = teal)

### Touch Targets & Gestures
- **Temperature control**: Large slider with +/- buttons (60px each)
- **Bed side toggle**: Segmented control, 48px tall
- **Chart interaction**: Entire chart area is touch-sensitive
- **Card tap**: Entire card is tappable to see detail
- **Pull-to-refresh**: Syncs with bed hardware

### Navigation Patterns
- **Bottom tab bar**: 4 tabs (Today, History, Controls, Profile)
- **Today is default**: Opens to morning summary
- **Sticky date selector**: Top of screen, scrollable week view
- **Modal presentations**: Most detail views are modals, not pushed screens

### Data Density vs Whitespace
- **Low density, high impact**: Each screen shows 4-6 key metrics, not overwhelming
- **Generous spacing**: 24-32px between card sections
- **Chart gets space**: Full width, 200-240px tall for sleep graph
- **White space as luxury**: Emptiness conveys premium feel

### Loading States
- **Sync indicator**: Animated ring around app icon (1.5s rotation)
- **Data loads progressively**: Score appears first, then cards fill in
- **Skeleton shimmer**: Blue-tinted shimmer on dark background
- **"Syncing..." state**: Shows when waiting for bed data

### Empty States
- **No data yet**: "Track your first night" with setup instructions
- **Historical view**: "No data for this date" with date selector
- **Offline**: "Connect to your bed" with troubleshooting link
- **Illustrations**: Simple line art of bed, consistent with brand

---

## 6. Ultrahuman - Health/Fitness Tracking

### Information Hierarchy
- **Daily score at top**: Large circular progress ring with number in center (40-48pt)
- **3 pillar scores**: Activity, Sleep, Metabolism in cards below (24-28pt each)
- **Timeline/feed**: Chronological insights and events in list below scores
- **Metric details**: Tap any score to drill into chart and historical data
- **Contextual insights**: AI-generated text explaining what metrics mean

### Card/List Design
- **Rounded rectangle cards**: 12-16px radius, subtle shadows (4-6px blur)
- **Horizontal padding**: 16px from screen edges
- **Vertical spacing**: 12-16px between cards
- **Score cards**: 3-column grid, ~110px tall, equal width
- **Insight cards**: Full width, variable height (80-200px), icon + title + description
- **Gradient backgrounds**: Subtle gradients matching metric type (blue for activity, purple for sleep)

### Bottom Sheets & Modals
- **Metric detail**: Bottom sheet slides up, shows chart + insights
- **Log activity**: Modal form for manual entry (food, workout, etc.)
- **Settings**: Full-screen push, not modal
- **Onboarding**: Stepped modal flow with progress indicator

### Micro-interactions
- **Ring animation**: Progress rings animate from 0 to value on load (0.8s ease-out)
- **Score update**: Number counts up with ring animation
- **Card tap**: Subtle scale down (0.98) then navigate
- **Insight appearance**: Fade-in from bottom when new insight arrives
- **Haptics**: Medium impact when score updates, light on navigation

### Typography System
```
Hero Score: SF Pro Display, Bold, 40-48pt
Pillar Scores: SF Pro Display, Semibold, 24-28pt
Score Labels: SF Pro Text, Medium, 12-13pt
Insight Titles: SF Pro Text, Semibold, 16-17pt
Insight Body: SF Pro Text, Regular, 14-15pt
Chart Labels: SF Pro Text, Regular, 11-12pt
Timestamps: SF Pro Text, Regular, 12-13pt
Section Headers: SF Pro Display, Bold, 20-22pt
```
- **Display font for emphasis**: Numbers and headers use Display variant
- **Text font for readability**: Body content uses Text variant

### Color Usage
- **Light, clean palette**:
  - Background: #F7F8FA (light gray)
  - Card backgrounds: #FFFFFF
  - Primary brand: #6366F1 (indigo)
  - Activity: #3B82F6 (blue)
  - Sleep: #8B5CF6 (purple)
  - Metabolism: #F59E0B (amber)
  - Success: #10B981 (green)
  - Text: #111827 (dark gray) at 100%, 70%, 50% opacities
- **Score-based colors**: Green (good), amber (ok), red (needs attention)
- **Chart variety**: Multiple colors for different data series

### Touch Targets & Gestures
- **Score card tap**: Opens detail view
- **Chart scrubbing**: Press-hold to see value at point
- **Swipe between days**: Horizontal swipe on date header
- **Pull-to-refresh**: Syncs with wearable device
- **Insight actions**: Swipe left to dismiss, tap for more info

### Navigation Patterns
- **Bottom tab bar**: 4-5 tabs (Home, Activity, Nutrition, Sleep, Profile)
- **Top date selector**: Shows current date, tap to change
- **Drill-down navigation**: Home -> Metric -> Detailed history
- **Tab bar icons**: Simple, clear, with labels

### Data Density vs Whitespace
- **Balanced approach**: More dense than Eight Sleep, less than Robinhood
- **Key metrics prominent**: 3-4 main scores visible without scrolling
- **Feed below**: Insights scroll infinitely
- **Padding**: 16-20px horizontal, 12-16px vertical on cards

### Loading States
- **Ring placeholders**: Gray rings pulse while loading
- **Skeleton text**: Gray bars where text will appear
- **Progressive loading**: Scores load first, insights stream in after
- **Sync indicator**: Small icon animates in top-right during sync

### Empty States
- **No device connected**: "Connect your Ultrahuman Ring" with setup flow
- **No data yet**: "Your data will appear here once you wear your ring"
- **No insights**: "Check back later for personalized insights"
- **Helpful illustrations**: Simple, friendly graphics

---

## Cross-App Pattern Synthesis

### 1. The "Robinhood Effect" - Making Financial Data Approachable

**Core Principles:**
- **Extreme minimalism**: Use only essential colors (brand, success/green, danger/red, neutrals)
- **Generous whitespace around numbers**: Financial figures need breathing room (20-24px padding minimum)
- **Bold, confident typography**: Large numbers (32-48pt) with tight letter-spacing (-0.3 to -0.5)
- **Instant feedback**: No loading spinners for price updates; values change immediately
- **Subtle sparklines**: Mini charts (40-60px tall) embedded in list items provide context without clutter
- **Color for meaning only**: Green = gains/positive, red = losses/negative, blue = neutral action
- **Reduce anxiety through clarity**: Show account value prominently but use clean design to reduce stress

**Specific Techniques:**
- Monospace fonts for currency alignment
- Right-aligned numbers in lists
- Percentage changes always paired with absolute values
- 1px dividers (10% opacity) instead of card backgrounds
- No shadows on financial data cards
- Green/red only for gain/loss, never decorative

**Anti-patterns to Avoid:**
- Don't bury critical info (price, balance) in sub-screens
- Avoid complex charts on overview screens
- No busy backgrounds behind numbers
- Don't use red/green for non-financial elements (confusing)

---

### 2. Feed Design (X) - Scrollable Token Lists

**Core Principles:**
- **Continuous scroll, not cards**: Dividers (1px, 8-10% opacity) between items, no individual card backgrounds
- **Consistent item height**: Aim for ~72-88px per list item for rhythm
- **Left-aligned content**: Avatar/icon left, primary content offset 56-60px
- **Right-aligned numbers**: Prices, changes, percentages aligned right
- **Pull-to-refresh**: Custom animation with brand element
- **Infinite scroll**: Load more at bottom, smooth with no jarring transitions

**Layout Specifics:**
```
Item structure:
- Total height: 72-88px
- Left icon/avatar: 40-48px diameter, 12-16px from left edge
- Content offset: 56-60px from left edge
- Right data: 12-16px from right edge
- Vertical padding: 12-16px top/bottom
- Divider: 1px at bottom, full width or inset 56px from left
```

**Interaction Patterns:**
- Tap entire row to open detail (not just specific area)
- Swipe actions optional (can add complexity; use sparingly)
- Long-press for quick actions menu
- Haptic feedback on tap (light impact)

**Performance:**
- Use FlatList/FlashList with proper key extraction
- Virtualize items (only render visible + small buffer)
- Memoize list items to prevent unnecessary re-renders
- Lazy load images/charts as they enter viewport

---

### 3. Audio/Visual Polish (Spotify) - Bottom Sheets & Transitions

**Bottom Sheet Patterns:**
```
Mini-player (persistent):
- Height: 56-64px
- Background: Blur or solid color
- Content: Icon (40px) + Title/Artist + Control buttons (44x44px)
- Position: Above tab bar (8-12px gap)
- Tap to expand to full-screen

Expanded Player:
- Full screen takeover
- Transition: Spring animation (0.4s, damping 0.8)
- Background: Adaptive color from album art (blur + darken)
- Controls: Large (60-80px) for easy touch
- Swipe down to collapse
```

**Transition Principles:**
- Hero element (album art / token icon) scales and moves smoothly
- Background fades from blur to solid (or vice versa) during transition
- Text elements fade out/in rather than scale
- Spring animations feel more premium than linear (iOS native spring curve)
- 0.3-0.4s duration is sweet spot (0.5s+ feels slow)

**Sheet Behaviors:**
- Draggable handle (36px wide, 4-5px tall, rounded, 30% opacity)
- Swipe-to-dismiss: Velocity matters (fast swipe dismisses even if only moved 20%)
- Backdrop dimming: 40-50% black with slight blur (iOS native backdrop)
- Detent support: Half-height and full-height positions
- Bounce at top/bottom when scrolling within sheet

---

### 4. Health Dashboard (Eight Sleep/Ultrahuman) - Metrics & Charts

**Metric Display Patterns:**
```
Hero Metric Card:
- Large number: 40-56pt, bold
- Label below: 14-16pt, medium weight
- Interpretation text: 16-18pt, regular (e.g., "Great sleep")
- Card size: Full width or half width, 140-180px tall
- Background: Gradient or solid with subtle shadow
- Padding: 20-24px all sides

Supporting Metrics (Grid):
- 2 or 3 columns
- Square-ish cards (1:1 or 4:3 aspect ratio)
- Number: 24-32pt, semibold
- Label: 11-13pt, regular
- Icon: 24-28px, top-left or centered
```

**Chart Patterns:**
- **Height**: 180-240px for primary chart, 100-140px for sparklines
- **Colors**: Use theme colors, not random palette
- **Interaction**: Tap-hold to scrub, show tooltip with exact value
- **Axes**: Minimal labels, light grid lines (10-15% opacity), no outer border
- **Animation**: Fade in + draw from left-to-right (0.6-0.8s ease-out)
- **Gradients**: Area charts use gradient fill (opaque at line, transparent at bottom)

**Data Visualization Best Practices:**
- Line charts for trends over time
- Bar charts for comparisons (day-to-day, category-to-category)
- Ring/circular progress for scores and goals
- Sparklines for at-a-glance trends (no axes, just the line)
- Color-coded zones (green = good, amber = ok, red = action needed)

**Progressive Disclosure:**
- Overview shows 3-5 key metrics
- Tap any metric for detailed chart and history
- Historical view shows week/month/year toggle
- Context and insights below charts (not above)

---

### 5. Quick Actions - Common Patterns

**Primary Action Button:**
```
Style:
- Size: 48-56px tall (full-width) or 60-72px diameter (FAB)
- Color: Brand primary or success green
- Text: Bold, 15-17pt, white
- Radius: 12-16px (rounded rect) or 50% (circular)
- Shadow: 4-8px blur, 30-40% opacity
- Position: Bottom of screen or floating bottom-right

States:
- Default: Full opacity, shadow visible
- Pressed: Scale to 0.96-0.98, reduce shadow
- Disabled: 40% opacity, no interaction
```

**Secondary Action Buttons:**
- Outline style (1-2px border, transparent background)
- Same size as primary
- Less prominent color (neutral or secondary brand color)
- 50-60% opacity until pressed

**Swipe Actions (iOS):**
```
Configuration:
- Swipe distance: 80-100px to reveal full action
- Action button width: 80px minimum, 100-120px comfortable
- Icon + label or icon only (both work)
- Color-coded: Blue (info), Green (success), Red (destructive)
- Haptic feedback: Light impact when action revealed, medium on confirm
```

**Long-Press Menus:**
- Context menu (iOS native HapticTouch style)
- Preview content on initial press
- Show menu after 0.4-0.5s hold
- 3-5 actions max (more becomes overwhelming)
- Icons + labels for each action

**Button Placement Hierarchy:**
```
Top-right header: Secondary actions (Share, Info, Settings)
Top-left header: Back, Close
Bottom-right floating: Primary creation action (Compose, Add, etc.)
Bottom-center: Primary submit/confirm in modals
Bottom-left: Cancel/destructive in modals
```

---

## Quickscope-Specific Patterns

### Token List Cards (Discovery/Scope Screens)

**Recommended Layout:**
```
Card height: 80-88px
Horizontal padding: 16px (screen edge to content)
Vertical padding: 12-14px (internal card padding)
Divider: 1px at bottom, rgba(0,0,0,0.08), inset 56px from left

Left section (icon + name):
- Token icon: 44px diameter, 12px from left edge
- Token symbol: 15-16pt, semibold, offset 60px from left
- Token name: 13-14pt, regular, 60% opacity, below symbol
- Stack vertically with 2-4px gap

Right section (price + change):
- Current price: 15-16pt, medium, right-aligned
- Price change: 13-14pt, semibold, right-aligned, color-coded
- % change and $ change on same line or stacked
- 12px from right edge

Middle section (optional sparkline):
- Width: 60-80px
- Height: 32-40px
- Minimal line chart, no axes
- Color: Green (up) or Red (down)
- Position: Between name and price
```

**Interaction:**
- Entire row tappable (44pt minimum touch target height)
- Light haptic on tap
- Transition: Slide in from right, 0.3s ease-in-out
- Active state: Subtle gray background (5% opacity) on press

**Data Density vs Whitespace Balance:**
- Show 4-5 tokens per screen (iPhone 14 Pro) without scrolling
- 16px top/bottom padding on list container
- Consider edge-to-edge cards (0px horizontal margin) with internal padding
- Prioritize readability over cramming more tokens

**Performance Optimization:**
- FlatList with `getItemLayout` for instant scrolling
- Memoize row components
- Lazy load sparkline charts (only render when in viewport)
- Update prices in-place (no re-mount)

---

### Token Detail Screen

**Hero Section:**
```
Layout (Top 300-400px of screen):
- Token icon: 56-64px, centered, 24px from top
- Token symbol: 22-24pt, bold, centered, 12px below icon
- Token name: 15-16pt, regular, 60% opacity, centered, 4px below symbol
- Current price: 36-42pt, bold, centered, 20px below name
- Price change: 16-18pt, semibold, color-coded, centered, 8px below price
- Background: Solid color or subtle gradient

Chart Section:
- Height: 240-280px (generous for interaction)
- Margin: 0px horizontal (edge-to-edge for maximum width)
- Time period selector: 1D, 1W, 1M, 3M, 1Y, ALL (horizontally scrollable)
- Period selector position: Top-right of chart
- Scrubbing: Long-press anywhere, show crosshair + tooltip
- Tooltip: Floating card shows date + price at point
- Animation: Line draws from left-to-right on load (0.6s)
```

**Trade Panel (Bottom):**
```
Style:
- Background: White (light) or #1C1C1E (dark) with top border/shadow
- Height: 100-140px (fixed, not collapsible)
- Padding: 16px horizontal, 16px top, 20px bottom (for safe area)

Content:
- Two buttons side-by-side: Buy (left) and Sell (right)
- Button height: 52-56px
- Button radius: 12px
- Buy button: Green background (#00C805), white text
- Sell button: Red background (#FF3B30), white text
- Equal width (48% each with 4% gap between)
- Haptic: Medium impact on press

Alternative (Single CTA):
- One large "Trade" button (full width)
- Opens bottom sheet with Buy/Sell tabs
- Height: 56px, brand blue background
```

**Chart Interaction (Robinhood-inspired):**
- No need to tap-hold; dragging finger anywhere on chart shows scrubber
- Scrubber line: Vertical, 1px, white, 80% opacity
- Price tooltip: Floating above finger, rounded rect, 8px radius, dark background
- Date tooltip: Below chart, aligned with scrubber line
- Haptic: Light feedback every 5% of chart width
- Release finger: Scrubber fades out (0.2s), price returns to current

**Additional Data (Below chart):**
- Stats cards: Market cap, volume, supply, etc.
- Card layout: 2-column grid, 80-100px tall per card
- Label above value: 12-13pt, 60% opacity
- Value: 16-18pt, semibold
- Spacing: 12px between cards

---

### Trade Flow (Bottom Sheet)

**Sheet Structure:**
```
Initial state (collapsed):
- Triggered by: Tap "Buy" or "Sell" button on token detail
- Animation: Slides up from bottom, spring (0.4s, damping 0.8)
- Initial height: 60-70% of screen
- Draggable handle: 36px wide, 4px tall, rounded, top-center
- Backdrop: 45% black with slight blur

Header:
- Height: 60-70px
- Token icon: 32px, left-aligned
- Token symbol: 16-17pt, semibold, next to icon
- Current price: 14-15pt, regular, below symbol
- Close button: X in top-right corner (44x44px touch target)
```

**Buy/Sell Tab Selector:**
```
Position: Below header (sticky)
Height: 44-48px
Style: Segmented control
- Two segments: "Buy" and "Sell"
- Active segment: Background color (green for buy, red for sell)
- Active text: White, semibold
- Inactive text: 60% opacity, regular
- Transition: Smooth slide animation (0.25s) when switching
```

**Input Section:**
```
Amount input:
- Large text field: 32-40pt, centered
- Placeholder: "$0.00" or "0 ETH"
- Input type: Numeric keyboard with decimal
- Currency toggle: USD <-> Token (tap to switch)
- Quick amount buttons: 25%, 50%, 75%, 100% (for sell) or $10, $50, $100, $500 (for buy)

Balance display:
- "Available balance: $X,XXX.XX" below input
- 13-14pt, regular, 60% opacity
- Tappable to max out input

Calculated value:
- Shows equivalent in opposite currency
- "≈ X.XXXX ETH" if input is USD, or "≈ $X,XXX.XX" if input is token
- 15-16pt, medium, 80% opacity
```

**Confirmation Section:**
```
Price estimate card:
- Rounded rect, subtle background (5% opacity)
- Padding: 16px
- Contains:
  - Estimated price: "Est. price: $XX.XX per token"
  - Slippage tolerance: "Slippage: 0.5%" (tappable to edit)
  - Total cost/proceeds: "Total: $XXX.XX"
- 13-14pt, regular text

Review button:
- Full width, 52-56px tall
- Position: Bottom of sheet (16px from bottom for safe area)
- Text: "Review Order" (not "Buy" yet)
- Color: Brand blue or green (for buy) / red (for sell)
- Haptic: Medium impact on press
- Disabled until valid amount entered (40% opacity)
```

**Confirmation Modal (Next Step):**
```
After "Review Order":
- New sheet slides up (replaces trade entry sheet)
- Shows:
  - Summary of trade (amount, price, total)
  - "Swipe to confirm" slider at bottom
  - Or face ID / Touch ID confirmation
- Slider pattern (inspired by iOS "Slide to Power Off"):
  - Swipe right to confirm
  - Haptic feedback throughout swipe
  - Heavy haptic on confirmation
  - Prevent accidental taps
```

**Success State:**
```
After successful trade:
- Sheet content replaces with success message
- Checkmark animation (scale + fade in)
- "Trade complete" text, large and bold
- Transaction details below
- "View transaction" and "Done" buttons
- Auto-dismiss after 3-4 seconds if no interaction
```

---

### Overall App Feel - Premium vs Generic

**What Makes These Apps Feel Premium:**

1. **Subtle, Purposeful Animation:**
   - Not flashy, but responsive
   - Spring animations (iOS native feel) over linear
   - 0.3-0.4s duration is sweet spot
   - Elements enter/exit with purpose (fade + slide, not just appear)

2. **Generous Touch Targets:**
   - 44pt minimum strictly followed
   - Extra padding around tappable elements
   - Buttons feel big and confident, not cramped

3. **Haptic Feedback Language:**
   - Light: Navigation, selection changes
   - Medium: Confirmations, likes, toggles
   - Heavy: Completions, errors, important actions
   - Success/error haptics: Custom patterns (notification type)

4. **Typography Hierarchy:**
   - 3-4x difference between largest and smallest text
   - Display fonts (SF Pro Display) for numbers and headlines
   - Text fonts (SF Pro Text) for body content
   - Consistent line-height ratios (1.2-1.3 for headers, 1.4-1.5 for body)
   - Tight letter-spacing on large numbers (-0.3 to -0.5)

5. **Whitespace as a Design Element:**
   - Not afraid of empty space
   - 20-24px padding on important cards
   - 24-32px vertical spacing between sections
   - Content doesn't touch screen edges (16-20px minimum)

6. **Color Restraint:**
   - Small palette (3-5 colors max)
   - Color for meaning, not decoration
   - High contrast for accessibility
   - Adaptive colors (dark mode is first-class, not afterthought)

7. **Loading States That Match Content:**
   - Skeleton screens mirror final layout exactly
   - Progressive loading (critical content first)
   - No jarring layout shifts
   - Optimistic updates (show result immediately, sync in background)

8. **Micro-interactions on State Changes:**
   - Like button scales and fills with color
   - Numbers count up/down rather than snap
   - Chart lines draw on, don't just appear
   - Smooth transitions between states (no flashing)

9. **Consistent, Predictable Patterns:**
   - Same gesture means same thing everywhere
   - Button placement follows iOS conventions
   - Navigation is never surprising
   - Back button always works as expected

10. **Performance:**
    - 60fps scrolling (no jank)
    - Instant response to taps (<100ms to visual feedback)
    - Images lazy load but don't cause layout shift
    - Animations can be interrupted mid-flight

**What Makes Apps Feel Generic (Anti-patterns):**
- Linear animations (robotic feel)
- No haptic feedback
- Tiny touch targets (<40pt)
- Cramped spacing (8px or less padding)
- Rainbow of colors with no system
- Inconsistent fonts (mixing too many weights/sizes)
- Loading spinners instead of skeletons
- Layout shifts as content loads
- Sluggish response to interactions
- Non-standard navigation patterns

---

## Typography Scale Recommendation for Quickscope

Based on analysis, here's a recommended type scale for React Native:

```typescript
export const typography = {
  // Display (for large numbers, hero elements)
  display: {
    hero: {
      fontSize: 48,
      lineHeight: 56,
      fontFamily: 'SF Pro Display',
      fontWeight: '700', // Bold
      letterSpacing: -0.5,
    },
    large: {
      fontSize: 36,
      lineHeight: 44,
      fontFamily: 'SF Pro Display',
      fontWeight: '600', // Semibold
      letterSpacing: -0.4,
    },
    medium: {
      fontSize: 28,
      lineHeight: 36,
      fontFamily: 'SF Pro Display',
      fontWeight: '600',
      letterSpacing: -0.3,
    },
  },

  // Headings
  heading: {
    h1: {
      fontSize: 22,
      lineHeight: 28,
      fontFamily: 'SF Pro Display',
      fontWeight: '700',
      letterSpacing: -0.2,
    },
    h2: {
      fontSize: 20,
      lineHeight: 26,
      fontFamily: 'SF Pro Display',
      fontWeight: '600',
      letterSpacing: -0.2,
    },
    h3: {
      fontSize: 18,
      lineHeight: 24,
      fontFamily: 'SF Pro Text',
      fontWeight: '600',
      letterSpacing: -0.1,
    },
  },

  // Body text
  body: {
    large: {
      fontSize: 17,
      lineHeight: 26,
      fontFamily: 'SF Pro Text',
      fontWeight: '400', // Regular
      letterSpacing: 0,
    },
    regular: {
      fontSize: 15,
      lineHeight: 22,
      fontFamily: 'SF Pro Text',
      fontWeight: '400',
      letterSpacing: 0,
    },
    medium: {
      fontSize: 15,
      lineHeight: 22,
      fontFamily: 'SF Pro Text',
      fontWeight: '500', // Medium
      letterSpacing: 0,
    },
    semibold: {
      fontSize: 15,
      lineHeight: 22,
      fontFamily: 'SF Pro Text',
      fontWeight: '600',
      letterSpacing: 0,
    },
  },

  // Caption/Small text
  caption: {
    regular: {
      fontSize: 13,
      lineHeight: 18,
      fontFamily: 'SF Pro Text',
      fontWeight: '400',
      letterSpacing: 0,
    },
    medium: {
      fontSize: 13,
      lineHeight: 18,
      fontFamily: 'SF Pro Text',
      fontWeight: '500',
      letterSpacing: 0,
    },
    small: {
      fontSize: 11,
      lineHeight: 14,
      fontFamily: 'SF Pro Text',
      fontWeight: '400',
      letterSpacing: 0.1,
    },
  },

  // Special: Monospace for prices
  mono: {
    large: {
      fontSize: 17,
      lineHeight: 26,
      fontFamily: 'SF Mono',
      fontWeight: '600',
      letterSpacing: 0,
    },
    regular: {
      fontSize: 15,
      lineHeight: 22,
      fontFamily: 'SF Mono',
      fontWeight: '500',
      letterSpacing: 0,
    },
  },
};
```

**Usage Guidelines:**
- **Token list prices**: `typography.mono.regular` for alignment
- **Token detail price**: `typography.display.large` for impact
- **Section headers**: `typography.heading.h2`
- **Token symbols**: `typography.body.semibold`
- **Token names**: `typography.body.regular` at 60% opacity
- **Timestamps**: `typography.caption.regular` at 60% opacity
- **Trade button text**: `typography.body.medium`

---

## Animation/Transition Recommendations

### Spring Animation Values (iOS Native Feel)
```typescript
// React Native Reanimated config
export const springs = {
  // Gentle spring for large movements (sheet opening, screen transitions)
  gentle: {
    damping: 20,
    stiffness: 300,
    mass: 0.8,
  },

  // Bouncy spring for small interactions (button press, like animation)
  bouncy: {
    damping: 15,
    stiffness: 600,
    mass: 0.5,
  },

  // Smooth spring for scrolling UI elements (hiding headers, etc.)
  smooth: {
    damping: 30,
    stiffness: 400,
    mass: 0.6,
  },
};

// Timing animation durations
export const durations = {
  instant: 100,   // Haptic-paired interactions
  fast: 200,      // State changes, color transitions
  normal: 300,    // Most animations (sweet spot)
  slow: 400,      // Bottom sheets, large movements
  chart: 600,     // Chart draws, number count-ups
  lazy: 800,      // Entrance animations, progressive reveals
};

// Easing curves
export const easings = {
  // Standard iOS ease-in-out
  standard: Easing.bezier(0.42, 0, 0.58, 1),

  // Accelerate (ease-in)
  accelerate: Easing.bezier(0.42, 0, 1, 1),

  // Decelerate (ease-out)
  decelerate: Easing.bezier(0, 0, 0.58, 1),

  // Sharp (for exits)
  sharp: Easing.bezier(0.4, 0, 0.6, 1),
};
```

### Recommended Transitions by Context

**Screen transitions:**
- Push/Pop: Native iOS stack navigator (slide from right)
- Modal present: Slide up from bottom with spring (400ms)
- Modal dismiss: Slide down with faster timing (300ms)

**List items:**
- Enter: Fade + slide up (staggered 50ms delay, 300ms duration)
- Exit: Fade out only (200ms)
- Update (price change): Fade background color (200ms), pulse scale 1.0 -> 1.02 -> 1.0 (400ms)

**Bottom sheets:**
- Open: Slide up with gentle spring
- Close: Slide down with smooth spring (faster than open)
- Backdrop: Fade in/out (300ms) concurrent with slide

**Buttons:**
- Press: Scale 1.0 -> 0.97 (100ms), haptic on touch down
- Release: Scale 0.97 -> 1.0 (200ms), action on touch up
- Active state: Background color transition (200ms)

**Charts:**
- Line draw: Path animation from left to right (600ms, decelerate easing)
- Scrubber appear: Fade in + scale (200ms)
- Tooltip follow: Immediate (no lag), but smooth (use animation with 100ms duration)

**Numbers (price updates):**
- Count animation: Interpolate from old to new value (400ms, decelerate)
- Color flash: Brief background pulse (300ms)
- Too fast updates: Debounce to max 1 animation per 500ms to avoid jank

---

## Haptic Feedback Patterns

### iOS Haptic Types
```typescript
import { impactAsync, notificationAsync, ImpactFeedbackStyle, NotificationFeedbackType } from 'expo-haptics';

export const haptics = {
  // Impact styles (for interactions)
  light: () => impactAsync(ImpactFeedbackStyle.Light),
  medium: () => impactAsync(ImpactFeedbackStyle.Medium),
  heavy: () => impactAsync(ImpactFeedbackStyle.Heavy),

  // Notification styles (for results)
  success: () => notificationAsync(NotificationFeedbackType.Success),
  warning: () => notificationAsync(NotificationFeedbackType.Warning),
  error: () => notificationAsync(NotificationFeedbackType.Error),
};
```

### When to Use Each Haptic

**Light Impact:**
- Tab bar navigation
- Segmented control changes
- Slider increments (every 5-10% of range)
- List item selection (non-committal)
- Tooltip appearance

**Medium Impact:**
- Button taps (primary and secondary)
- Toggle switches
- Like/favorite actions
- Sheet dismissal
- Confirmation actions

**Heavy Impact:**
- Destructive actions confirmed
- Trade executed
- Major state changes
- Errors requiring attention
- Pull-to-refresh release point

**Success Notification:**
- Trade completed successfully
- Order placed
- Saved to watchlist
- Settings saved

**Warning Notification:**
- Approaching limit (balance, slippage)
- Unusual market activity
- Action requires attention

**Error Notification:**
- Trade failed
- Form validation error
- Network error
- Insufficient balance

**Best Practices:**
- Don't overuse (feels gimmicky)
- Pair haptic with visual feedback (never haptic alone)
- Test on device (simulator doesn't convey intensity accurately)
- Make haptics settings-controllable (some users prefer none)
- Match haptic strength to action importance

---

## Performance & Implementation Notes

### React Native Specific Considerations

**FlatList Optimization:**
```typescript
// Token list example
<FlatList
  data={tokens}
  keyExtractor={(item) => item.id}
  getItemLayout={(data, index) => ({
    length: 88, // Fixed item height
    offset: 88 * index,
    index,
  })}
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  updateCellsBatchingPeriod={50}
  windowSize={21}
  renderItem={({ item }) => <TokenCard token={item} />}
/>
```

**Image Loading:**
- Use react-native-fast-image for better caching
- Provide explicit width/height to prevent layout shift
- Use placeholder (gray circle for token icons)
- Fade-in transition when loaded (200ms)

**Chart Libraries:**
- react-native-chart-kit: Good for simple charts
- victory-native: More customizable, heavier
- react-native-svg + d3: Full control, steeper learning curve
- Consider WebView + Recharts for complex interactions

**Animation Performance:**
- Use react-native-reanimated 2+ for native thread animations
- Avoid animating layout properties (use transform instead)
- Use `useNativeDriver: true` wherever possible
- Memoize animated components with React.memo()

**State Management:**
- Real-time price updates: WebSocket with throttled UI updates (max 1/second)
- Optimistic updates: Update UI immediately, rollback on error
- Cache aggressively: Stale-while-revalidate pattern

**Safe Area Handling:**
- Use react-native-safe-area-context
- Bottom sheets must respect bottom safe area (add padding)
- Tab bar adds safe area automatically
- Top navigation needs safe area for notch

---

## Accessibility Considerations

All analyzed apps support:

1. **Dynamic Type**: Text scales with iOS settings (15pt becomes 17-23pt)
2. **VoiceOver**: Every interactive element has accessible label
3. **Minimum Contrast**: 4.5:1 for body text, 3:1 for large text
4. **Touch Target Size**: 44x44pt minimum, no exceptions
5. **Reduce Motion**: Disable animations when system setting enabled
6. **Color Independence**: Don't rely on color alone (use icons + text for gain/loss)

### Quickscope Accessibility Checklist
- [ ] All buttons have `accessibilityLabel` and `accessibilityHint`
- [ ] Price changes announced by screen reader (use `accessibilityLiveRegion`)
- [ ] Charts have text alternative (e.g., "Price up 5% in last 24 hours")
- [ ] Color contrast meets WCAG AA (check with tool)
- [ ] Touch targets verified at 44pt minimum
- [ ] Test with VoiceOver enabled (navigate entire app)
- [ ] Test with large text sizes (200-300% scale)
- [ ] Reduce motion respects system setting (disable spring animations)

---

## Summary: Key Takeaways for Quickscope

### Do This
1. **Minimal color palette**: Brand blue, success green, danger red, neutrals (black/white/grays)
2. **Generous whitespace**: 16-20px horizontal padding, 20-24px on cards
3. **Bold typography for numbers**: 32-48pt for prices, tight letter-spacing
4. **Spring animations**: 300-400ms duration, iOS native feel
5. **Haptic feedback**: Light for navigation, medium for actions, heavy for completions
6. **Bottom sheets for secondary flows**: Trade entry, filters, settings
7. **Skeleton loading states**: Match final layout exactly
8. **Edge-to-edge charts**: Maximum width for data visibility
9. **Monospace fonts for prices**: Perfect alignment in lists
10. **44pt minimum touch targets**: No exceptions

### Don't Do This
1. **Don't use shadows on financial data**: Dividers only
2. **Don't cram too much data**: 4-5 list items per screen is plenty
3. **Don't animate layout changes**: Use transform (translate, scale) instead
4. **Don't make users tap twice**: Direct actions where possible
5. **Don't hide critical info**: Price and balance always visible
6. **Don't use decorative colors**: Every color has a meaning
7. **Don't skip loading states**: Skeleton > spinner
8. **Don't ignore dark mode**: Design for dark first
9. **Don't forget haptics**: Pairing touch with feedback is premium
10. **Don't neglect performance**: 60fps or it feels cheap

---

## Next Steps for Implementation

1. **Create design tokens file**: Colors, typography, spacing, shadows
2. **Build component library**: Button, Card, BottomSheet, TokenListItem
3. **Implement animation utilities**: Reusable spring configs and timing functions
4. **Set up haptic wrapper**: Consistent haptic feedback across app
5. **Create typography components**: Text components with preset styles
6. **Build chart components**: Reusable line chart, area chart, sparkline
7. **Test on device**: Simulator doesn't show haptics or true performance
8. **User test**: Watch real users interact, find friction points
9. **Iterate**: Refine based on feedback and usage data

---

**Document Version**: 1.0
**Last Updated**: February 6, 2026
**Next Review**: After initial component library implementation
