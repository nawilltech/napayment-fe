/**
 * Shared design tokens for the Business Console (web) and Consumer Wallet App
 * (mobile). Source of truth for both Tailwind's @theme (web) and NativeWind's
 * tailwind.config (mobile, once it's built out - see docs/nawill-pay-frontend.md
 * doc F8 "Design tokens").
 *
 * `navy` and `cream` are sampled directly from the provided logo mark; the
 * rest of each scale is generated around those two anchors and should be
 * reviewed by design before ship - see the doc F8 note.
 */

export const colors = {
  navy: {
    50: "#EEF0F5",
    100: "#D7DBE6",
    200: "#AFB7CC",
    300: "#8790B3",
    400: "#5F6B99",
    500: "#454E77",
    600: "#333A5C",
    700: "#262B49", // brand anchor - sampled from logo background
    800: "#1B1F36",
    900: "#121425",
  },
  cream: {
    50: "#FBFAF6",
    100: "#F7F4EC",
    200: "#ECE6D9", // brand anchor - sampled from logo letterform
    300: "#DED5BF",
    400: "#C9BC9C",
    500: "#B3A37D",
  },
  status: {
    success: "#1A7F4E",
    successSurface: "#E7F6EE",
    warning: "#B4740E",
    warningSurface: "#FBF0DD",
    danger: "#C22A2A",
    dangerSurface: "#FBE8E8",
    pending: "#3E5AA8",
    pendingSurface: "#E9EDFA",
  },
} as const;

export const radius = {
  sm: "6px",
  md: "10px",
  lg: "14px",
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

export type ColorScale = typeof colors;
