/**
 * BloodlinePH brand tokens — keep in sync with apps/web/src/app/globals.css
 */

export const colors = {
  // Brand
  primary: "#dc2626",
  primaryDark: "#991b1b",
  gold: "#fbbf24",
  goldLight: "#fde047",
  goldDark: "#d97706",
  orange: "#fb923c",

  // Surface
  ink: "#0a0a0a",
  inkSoft: "#18181b",
  background: "#ffffff",
  card: "#ffffff",
  cardDark: "rgba(255, 255, 255, 0.04)",

  // Text
  foreground: "#0f172a",
  muted: "#64748b",
  mutedBg: "#f1f5f9",

  // Borders
  border: "#e2e8f0",
  borderDark: "rgba(255, 255, 255, 0.08)",

  // Semantic
  emerald: "#10b981",
  emeraldLight: "#34d399",
  destructive: "#ef4444",
  warning: "#f59e0b",
  info: "#3b82f6",

  // Utility
  white: "#ffffff",
  black: "#000000",
  transparent: "transparent",
} as const;

export const gradients = {
  flame: [colors.gold, colors.primary, colors.orange] as [
    string,
    string,
    string,
  ],
  gold: [colors.goldLight, colors.gold, colors.goldDark] as [
    string,
    string,
    string,
  ],
  dark: [colors.ink, colors.inkSoft] as [string, string],
} as const;

export const radii = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  "2xl": 20,
  "3xl": 24,
  full: 9999,
} as const;

export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

export const fontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 16,
  lg: 18,
  xl: 22,
  "2xl": 28,
  "3xl": 34,
  "4xl": 42,
  "5xl": 52,
} as const;

export const fontWeight = {
  normal: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
  black: "900",
} as const;
