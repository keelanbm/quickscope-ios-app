# Quickscope iOS — Design Principles

This document sets lightweight guardrails for UI decisions so we can move fast without losing coherence.

## 1) Purpose & tone
- **Purpose:** help traders make fast, high‑confidence decisions on a small screen.
- **Tone:** technical, direct, no fluff. Density is a feature, but clarity wins.
- **Mental model:** lists are “signals,” detail screens are “verify + act.”

## 2) Information hierarchy (per screen)
- **Primary:** what changes decisions (price/MC, % change, time).
- **Secondary:** context (age, volume, chain, source).
- **Tertiary:** metadata (links, tags, IDs, deep‑link notes).
- If something isn’t in the first two tiers, it should not be loud.

## 3) Density rules
- Default to **compact rows** with one optional secondary line.
- Avoid tall headers; tabs + chips should define the page.
- Prefer **one primary action per row**. Secondary actions go into chips/overflow.

## 4) Navigation & structure
- Use **two‑tier nav** on data‑heavy pages: primary tabs + secondary chips.
- Keep **bottom tabs stable**; in‑page tabs should not fight them.
- Drawer is the home for “long tail” actions (rewards, deposit, transfer, sign out).

## 5) Color & emphasis
- **Green/Red** reserved for deltas and performance.
- **Blue** for primary actions.
- **Muted text** for metadata. Avoid multiple accent colors in one row.
- Use outlines/borders for structure, not shadows.

## 6) Typography scale
- Title: 18–20, used sparingly.
- Primary row text: 14–16.
- Secondary/meta: 11–12.
- Don’t use more than 3 text sizes in a single screen.

## 7) Components & patterns
- **Row:** avatar + symbol/name + right‑side metrics.
- **Tabs:** underline style (2px bottom border), keep labels short.
- **Chips:** filter/selector; avoid overflow lines >2 rows.
- **Cards:** only when grouping is necessary; lists should be flat when possible.
- **Empty states:** single sentence + one CTA.
- **Progressive disclosure:** hide complexity behind taps. Show the minimum needed, reveal more on interaction (e.g. floating FAB nav, expandable chart controls).

## 8) Motion & feel
- Animations should be functional: drawer, refresh, list loading.
- Keep duration short (150–250ms). No gratuitous motion.
- **Physics-based where appropriate:** rubber‑band bounce on scroll overscroll, spring‑back on sheet dismiss, momentum on swipe. These make the app feel like a real object with weight.
- **Haptics are mandatory** on user-initiated state changes: `haptics.selection()` on tab switches, `haptics.light()` on pull‑to‑refresh. Silent touches feel broken.
- **Press states:** every `Pressable` should have visual feedback. Use `pressedOverlay` token or opacity reduction on press.

## 9) Data handling
- Always show last updated time when it's meaningful.
- Prefer placeholder "—" over "0" when data is missing.
- Avoid showing errors inline in every row; show a single banner or card.

## 10) Win moments & peak experiences
People judge experiences by their **peak moment** and the **ending** (Peak‑End Rule), not the average.
- **Identify wins:** catching a token early, profitable trade, portfolio milestone, new holder count ATH.
- **Amplify wins:** make the moment feel special — accent color flash, subtle animation, clear celebratory copy.
- **Ask at the peak:** only prompt for ratings, upgrades, or shares immediately after a meaningful win when the user is most receptive. Never interrupt neutral or negative moments.

## 11) Shareability (Viral UX)
Every screen with a "win moment" should have a share path. Sharing is how traders flex and how the app grows organically.
- **Token Detail:** share button → generates a branded card image (token name, price, chart thumbnail, QS branding).
- **Portfolio:** share PnL snapshot → branded card with gains/losses, time period, QS watermark.
- **Tracking:** share wallet activity highlights or token watchlist.
- **Format:** shareable images should be designed for dark social (Twitter/X, Telegram, Discord). Branded but not obnoxious — the user's achievement is the hero, QS branding is subtle.
- **Implementation:** `expo-sharing` + `ViewShot` (or `react-native-view-shot`) to capture styled components as images. Share2 icon from Lucide already available.
- **Planned ticket:** IOS‑502 (Telegram share‑to‑chat flow).

## 12) Consistency as a moat
Consistent design creates switching costs. When user behaviors become automatic through predictable patterns, switching to a competitor is painful.
- Row structures, tab patterns, and metric layouts must be **identical** across screens. A token row in Discovery should look the same in Scope, Tracking, and Search.
- New screens should reuse existing patterns before inventing new ones. Check the Component Patterns section in `CLAUDE.md`.
- **Three‑second trust test:** would a new user trust this screen within 3 seconds? Clean hierarchy, balanced spacing, and professional consistency all contribute.

## 13) Consistency checks
Before shipping a screen, confirm:
- Is the primary action obvious?
- Can the user scan 5 rows in under 3 seconds?
- Are we using the correct color semantics?
- Are we consistent with row height and spacing?
- Does every pressable element have visual + haptic feedback?
- Would a new user trust this screen in 3 seconds?
- Is there a share path for any "win moment" on this screen?

