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

export const colors = {
  ink: {
    DEFAULT: "#20264A", // text, amounts, console sidebar
    raised: "#2C3360",
    line: "#3A4270",
    fg: "#C9CEE8",
    muted: "#8E9BD8",
    subtle: "#B7BEDB",
  },
  brand: {
    DEFAULT: "#4757B8", // Nawill Blue - primary, actions
    hover: "#3B4AA3",
    soft: "#D6DAF2",
    line: "#9FA8DE",
    surface: "#EEF0FA",
  },
  cream: {
    DEFAULT: "#F4EEDD", // surfaces, receipts
    paper: "#FBF9F2",
    sand: "#E4DCC8",
    line: "#D8CFB4",
    lineSoft: "#EFE8D6",
    tan: "#B3A37D",
  },
  text: {
    muted: "#4E4A33",
    subtle: "#6E6648",
    faint: "#8C8468",
  },
  status: {
    success: "#1A7F4E",
    successSurface: "#E7F6EE",
    successLine: "#BFE3CF",
    warning: "#B4740E",
    warningSurface: "#FBF0DD",
    warningLine: "#E8CF9E",
    warningInk: "#5A3D0C",
    danger: "#C22A2A",
    dangerSurface: "#FBE8E8",
    pending: "#3E5AA8",
    pendingSurface: "#E9EDFA",
    // Mobile-only offline states (brand palette "Received" / "Queued")
    received: "#2E7D5B",
    queued: "#B7791F",
  },
} as const;

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

export type ColorScale = typeof colors;
