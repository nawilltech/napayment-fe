import { palettes, type Palette } from '@napayment/ui-tokens';

/**
 * Colour values come from @napayment/ui-tokens (the same palettes web and
 * admin use) - read them in components with useColors() / makeStyles() from
 * ./theme-provider so they follow the light/dark theme. This app uses plain
 * StyleSheet rather than NativeWind (see README).
 */
export type Colors = Palette;
export { palettes };

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

/** Status -> [text, surface] palette roles. Status colours are for payment state only. */
export const statusTone = {
  PAID: ['success', 'successSurface'],
  COMPLETED: ['success', 'successSurface'],
  ACTIVE: ['success', 'successSurface'],
  PENDING: ['pending', 'pendingSurface'],
  PROCESSING: ['pending', 'pendingSurface'],
  REDEEMED: ['pending', 'pendingSurface'],
  QUEUED: ['warning', 'warningSurface'],
  ON_HOLD: ['warning', 'warningSurface'],
  FAILED: ['danger', 'dangerSurface'],
  REVOKED: ['danger', 'dangerSurface'],
  EXPIRED: ['faint', 'lineSoft'],
} as const satisfies Record<string, readonly [keyof Colors, keyof Colors]>;

export type StatusKey = keyof typeof statusTone;
