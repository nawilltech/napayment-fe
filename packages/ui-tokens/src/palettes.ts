/**
 * The light and dark palettes - the one place colour values live. Web and
 * admin turn these into CSS variables (@napayment/ui lib/theme-css.ts); the
 * mobile app reads them through its ThemeProvider. Both themes share every
 * key, so a component names a role once and gets the right shade in either.
 *
 * Constant across themes (brand identity, text on blue/dark panels):
 * ink-fg/-muted/-subtle, brand, brand-hover, brand-soft, cream and white. `chrome`
 * is the always-dark sidebar/panel surface; `ink` is body text and flips.
 * `brand` stays Nawill Blue as a fill (cream text on it passes AA in both
 * themes); blue text and icons on page surfaces use `link`, which lightens
 * in dark mode so it stays readable there.
 */
const light = {
  chrome: "#20264A",
  ink: "#20264A",
  inkRaised: "#2C3360",
  inkLine: "#3A4270",
  inkFg: "#C9CEE8",
  inkMuted: "#8E9BD8",
  inkSubtle: "#B7BEDB",

  brand: "#4757B8",
  brandHover: "#3B4AA3",
  /** Blue as text/icons on page surfaces (links, text buttons). Fills use `brand`. */
  link: "#4757B8",
  brandSoft: "#D6DAF2",
  brandLine: "#9FA8DE",
  brandSurface: "#EEF0FA",

  cream: "#F4EEDD",
  white: "#FFFFFF",
  background: "#F4EEDD",
  surface: "#FFFFFF",
  paper: "#FBF9F2",
  sand: "#E4DCC8",
  line: "#D8CFB4",
  lineSoft: "#EFE8D6",
  tan: "#B3A37D",
  receiptRule: "#A79F80",

  muted: "#4E4A33",
  subtle: "#6E6648",
  faint: "#8C8468",

  success: "#1A7F4E",
  successInk: "#12573A",
  successSurface: "#E7F6EE",
  successLine: "#BFE3CF",
  warning: "#B4740E",
  warningInk: "#5A3D0C",
  warningSurface: "#FBF0DD",
  warningLine: "#E8CF9E",
  danger: "#C22A2A",
  dangerSurface: "#FBE8E8",
  pending: "#3E5AA8",
  pendingSurface: "#E9EDFA",
} as const;

export type PaletteColor = keyof typeof light;
export type Palette = Record<PaletteColor, string>;

/** Night-navy variant of the same identity: blue-black surfaces, cream-white text, lifted brand/status hues for contrast. */
const dark: Palette = {
  chrome: "#0B0E21",
  ink: "#E8EAF6",
  inkRaised: "#1C2144",
  inkLine: "#2A3060",
  inkFg: light.inkFg,
  inkMuted: light.inkMuted,
  inkSubtle: light.inkSubtle,

  brand: light.brand,
  brandHover: light.brandHover,
  link: "#97A3F2",
  brandSoft: light.brandSoft,
  brandLine: "#4A55A6",
  brandSurface: "#1B2150",

  cream: light.cream,
  white: light.white,
  background: "#10132A",
  surface: "#191D3A",
  paper: "#151934",
  sand: "#262B4D",
  line: "#2F355C",
  lineSoft: "#232846",
  tan: "#5A6190",
  receiptRule: "#4A5080",

  muted: "#CDD1EA",
  subtle: "#A3A9CC",
  faint: "#7C83AA",

  success: "#4CC38A",
  successInk: "#8FE0B6",
  successSurface: "#11301F",
  successLine: "#1E5A3B",
  warning: "#E0A643",
  warningInk: "#F3D9A4",
  warningSurface: "#33260C",
  warningLine: "#5C4516",
  danger: "#F07070",
  dangerSurface: "#3A1414",
  pending: "#8EA2F0",
  pendingSurface: "#1D2552",
};

export const palettes: Record<"light" | "dark", Palette> = { light, dark };
