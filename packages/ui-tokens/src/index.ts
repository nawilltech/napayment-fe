/**
 * Shared design tokens for the Business Console (web) and Consumer Wallet App
 * (mobile). Source of truth for both Tailwind's @theme (web) and NativeWind's
 * tailwind.config (mobile, once it's built out - see docs/nawill-pay-frontend.md
 * doc F8 "Design tokens").
 *
 * Values come from the Napayment identity in docs/Nawill Technology branding
 * ("Napayment Brand" palette + "Napayment Web" screens). Nawill core colours
 * (blue, ink, cream) carry over unchanged; status colours are for payment
 * states only.
 */

export { palettes, type Palette, type PaletteColor } from "./palettes";

export const fonts = {
  sans: "IBM Plex Sans",
  mono: "IBM Plex Mono",
  display: "Special Elite",
} as const;

export const radius = {
  sm: "6px",
  md: "8px",
  lg: "10px",
  xl: "14px",
  full: "9999px",
} as const;

export const spacing = {
  xs: "4px",
  sm: "8px",
  md: "16px",
  lg: "24px",
  xl: "32px",
  "2xl": "48px",
} as const;

export * from "./icons";
export * from "./theme";
