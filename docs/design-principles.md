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
- **Tabs:** pill style, keep labels short.
- **Chips:** filter/selector; avoid overflow lines >2 rows.
- **Cards:** only when grouping is necessary; lists should be flat when possible.
- **Empty states:** single sentence + one CTA.

## 8) Motion
- Animations should be functional: drawer, refresh, list loading.
- Keep duration short (150–250ms). No gratuitous motion.

## 9) Data handling
- Always show last updated time when it’s meaningful.
- Prefer placeholder “—” over “0” when data is missing.
- Avoid showing errors inline in every row; show a single banner or card.

## 10) Consistency checks
Before shipping a screen, confirm:
- Is the primary action obvious?
- Can the user scan 5 rows in under 3 seconds?
- Are we using the correct color semantics?
- Are we consistent with row height and spacing?

