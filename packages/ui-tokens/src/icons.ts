/**
 * The app's icon vocabulary: one semantic name per concept, shared by every
 * app. Each platform maps these names to the same Lucide icon exactly once -
 * @napayment/ui's `icons.ts` (lucide-react, web + admin) and the mobile app's
 * `lib/icons.ts` (lucide-react-native) - and both are type-checked against
 * this list, so a concept always shows the same glyph everywhere. Screens
 * refer to icons by these names, never by importing Lucide directly.
 */
export const ICON_NAMES = [
  // Navigation
  "home",
  "overview",
  "transactions",
  "activity",
  "collect",
  "send",
  "withdraw",
  "activation",
  "settings",
  // Admin
  "kycReview",
  "businesses",
  "processors",
  "paymentMethods",
  "bank",
  "auditLogs",
  // Account & settings
  "profile",
  "contact",
  "team",
  "apiKeys",
  "security",
  "password",
  "pin",
  "queue",
  "signOut",
  "preferences",
  "themeAuto",
  "themeLight",
  "themeDark",
  // Row actions & chrome
  "add",
  "edit",
  "activate",
  "deactivate",
  "archive",
  "restore",
  "menu",
  "close",
] as const;

export type IconName = (typeof ICON_NAMES)[number];
