/**
 * Napayment brand tokens for React Native. Values mirror packages/ui-tokens
 * (and apps/web/src/app/globals.css) - that package is the source of truth;
 * this app uses plain StyleSheet rather than NativeWind (see README).
 */
export const colors = {
  ink: '#20264A',
  inkRaised: '#2C3360',
  inkSubtle: '#B7BEDB',
  inkLine: '#5C6699',

  brand: '#4757B8',
  brandSoft: '#D6DAF2',
  brandLine: '#9FA8DE',
  brandSurface: '#EEF0FA',

  cream: '#F4EEDD',
  paper: '#FBF9F2',
  sand: '#E4DCC8',
  line: '#D8CFB4',
  lineSoft: '#EFE8D6',
  tan: '#B3A37D',
  receiptRule: '#A79F80',
  white: '#FFFFFF',

  muted: '#4E4A33',
  subtle: '#6E6648',
  faint: '#8C8468',

  success: '#1A7F4E',
  successInk: '#12573A',
  successSurface: '#E7F6EE',
  warning: '#B4740E',
  warningInk: '#5A3D0C',
  warningSurface: '#FBF0DD',
  warningLine: '#E8CF9E',
  danger: '#C22A2A',
  dangerSurface: '#FBE8E8',
  pending: '#3E5AA8',
  pendingSurface: '#E9EDFA',
} as const;

/** Loaded in the root layout via @expo-google-fonts. */
export const fonts = {
  sans: 'IBMPlexSans_400Regular',
  sansMedium: 'IBMPlexSans_500Medium',
  sansSemibold: 'IBMPlexSans_600SemiBold',
  sansBold: 'IBMPlexSans_700Bold',
  mono: 'IBMPlexMono_400Regular',
  monoMedium: 'IBMPlexMono_500Medium',
  monoSemibold: 'IBMPlexMono_600SemiBold',
  // Wordmark, receipts and campaign lines only - never buttons or form fields.
  display: 'SpecialElite_400Regular',
} as const;

export const radius = { sm: 6, md: 8, lg: 10, xl: 12, card: 14, sheet: 26, pill: 999 } as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 } as const;

/** Status -> [text, surface]. Status colours are for payment state only. */
export const statusTone = {
  PAID: [colors.success, colors.successSurface],
  COMPLETED: [colors.success, colors.successSurface],
  ACTIVE: [colors.success, colors.successSurface],
  PENDING: [colors.pending, colors.pendingSurface],
  PROCESSING: [colors.pending, colors.pendingSurface],
  REDEEMED: [colors.pending, colors.pendingSurface],
  QUEUED: [colors.warning, colors.warningSurface],
  ON_HOLD: [colors.warning, colors.warningSurface],
  FAILED: [colors.danger, colors.dangerSurface],
  REVOKED: [colors.danger, colors.dangerSurface],
  EXPIRED: [colors.faint, colors.lineSoft],
} as const satisfies Record<string, readonly [string, string]>;

export type StatusKey = keyof typeof statusTone;
