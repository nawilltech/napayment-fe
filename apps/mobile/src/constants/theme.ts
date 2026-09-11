/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

// Brand tokens - kept in sync by hand with packages/ui-tokens (the shared
// source of truth) until NativeWind is wired up here, per docs/nawill-pay-frontend.md
// doc F8. navy-700 / cream-200 are sampled from the logo; see that package
// for the full scale and rationale.
export const Colors = {
  light: {
    text: '#121425', // navy-900
    background: '#FBFAF6', // cream-50
    backgroundElement: '#EEF0F5', // navy-50
    backgroundSelected: '#D7DBE6', // navy-100
    textSecondary: '#454E77', // navy-500
  },
  dark: {
    text: '#ECE6D9', // cream-200
    background: '#121425', // navy-900
    backgroundElement: '#1B1F36', // navy-800
    backgroundSelected: '#262B49', // navy-700
    textSecondary: '#AFB7CC', // navy-200
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
