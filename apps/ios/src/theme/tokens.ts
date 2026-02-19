/**
 * Quickscope Design Tokens — aligned with the web terminal theme.
 *
 * Layer system (darkest -> lightest):
 *   layer0  #0a0810   canvas / root background
 *   layer1  #14121e   cards, sheets, popovers
 *   layer2  #191725   nested cards, inset sections
 *   layer3  #231f33   borders, muted fills, input bg
 *   layer4  #2f2850   hover / active bg on muted
 *   layer5  #312e48   lightest muted bg
 *
 * Brand: purple (#7766f7 / #6639f1)
 */

// ──────────────────────────────────────────────
//  Colour palette
// ──────────────────────────────────────────────
export const qsColors = {
  // Layers (backgrounds)
  layer0: "#0a0810",
  layer1: "#14121e",
  layer2: "#191725",
  layer3: "#231f33",
  layer4: "#2f2850",
  layer5: "#312e48",

  // Legacy aliases so existing code keeps compiling
  bgCanvas: "#0a0810",
  bgCard: "#14121e",
  bgCardSoft: "#191725",

  // Borders
  borderDefault: "#231f33",
  borderSubtle: "#2f2850",

  // Text
  textPrimary: "#f8f7fb",
  textSecondary: "#b7a8d9",
  textTertiary: "#7b6e9a",
  textMuted: "#7b6e9a",
  textSubtle: "#5f596c",
  textDisabled: "#5f596c",

  // Brand – purple
  brand: "#7766f7",
  brandDeep: "#6639f1",
  brandLight: "#9b9bff",
  brandDark: "#1b0e3a",

  // Accent (primary action colour = brand)
  accent: "#7766f7",
  accentDeep: "#6639f1",

  // Status indicators
  success: "#10b981",
  successLight: "#19c990",
  successDark: "#0e3a2e",
  successBg: "rgba(16, 185, 129, 0.15)",

  danger: "#ef4444",
  dangerLight: "#f87171",
  dangerDark: "#3a1215",
  dangerBg: "rgba(239, 68, 68, 0.15)",

  warning: "#ff9800",
  warningLight: "#ffb74d",
  warningDark: "#3a2314",
  warningBg: "rgba(255, 152, 0, 0.15)",

  // Utility
  gold: "#fbbd03",
  blue: "#4a90e2",
  neutralGrey: "#828282",

  // ── Trade actions (v2.1) ──────────────────────
  buyGreen: "#10b981",
  buyGreenHover: "#0ea574",
  buyGreenBg: "rgba(16, 185, 129, 0.12)",

  sellRed: "#ef4444",
  sellRedHover: "#dc2626",
  sellRedBg: "rgba(239, 68, 68, 0.12)",

  // ── Chart colours (v2.1) ──────────────────────
  candleGreen: "#10b981",
  candleRed: "#ef4444",
  sparklineStroke: "#7766f7",
  sparklineFill: "rgba(119, 102, 247, 0.15)",

  // ── Metric badges (v2.1) ──────────────────────
  metricHighlight: "#7766f7",
  metricMuted: "#5f596c",

  // ── Interactive states (v2.1) ──────────────────
  pressedOverlay: "rgba(119, 102, 247, 0.08)",
  hoverOverlay: "rgba(119, 102, 247, 0.04)",

  // ── Elevated surfaces (v2.1) ──────────────────
  elevatedSurface: "#1C1C1E",
} as const;

// ──────────────────────────────────────────────
//  Border radii (tighter to match web)
// ──────────────────────────────────────────────
export const qsRadius = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  pill: 999,
} as const;

// ──────────────────────────────────────────────
//  Spacing scale
// ──────────────────────────────────────────────
export const qsSpacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 40,
  xxxxxl: 48,
} as const;

// ──────────────────────────────────────────────
//  Typography
// ──────────────────────────────────────────────
export const qsTypography = {
  size: {
    xxxs: 10,
    xxs: 12,
    xs: 13,
    sm: 14,
    base: 15,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 28,
    xxxxl: 32,
    hero: 40,
  },
  lineHeight: {
    xxxs: 11,
    xxs: 14,
    xs: 15,
    sm: 16,
    base: 18,
    md: 20,
    lg: 22,
    xl: 24,
    xxl: 28,
    xxxl: 32,
    xxxxl: 36,
    hero: 44,
  },
  weight: {
    regular: "400" as const,
    medium: "500" as const,
    semi: "600" as const,
    bold: "700" as const,
    heavy: "800" as const,
  },
} as const;

// ──────────────────────────────────────────────
//  Shadows (v2.1 – depth on floating elements)
// ──────────────────────────────────────────────
export const qsShadows = {
  none: {
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;
