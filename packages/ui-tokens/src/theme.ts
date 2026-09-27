import type { IconName } from "./icons";

/**
 * Light/dark behaviour shared by every app. "auto" follows the clock in the
 * viewer's own time zone - light for the 12 daytime hours, dark for the 12
 * night hours - and the viewer can pin light or dark instead (Settings ->
 * Preferences). Each platform only persists the preference and applies the
 * resolved scheme; the rule itself lives here.
 */
export const THEME_PREFERENCES = ["auto", "light", "dark"] as const;
export type ThemePreference = (typeof THEME_PREFERENCES)[number];
export type ColorScheme = "light" | "dark";

export const DEFAULT_THEME_PREFERENCE: ThemePreference = "auto";
/** Local hour (0-23) the light half of the day starts; the dark half starts 12 hours later. */
export const DAY_STARTS_AT_HOUR = 6;
export const NIGHT_STARTS_AT_HOUR = DAY_STARTS_AT_HOUR + 12;
export const THEME_STORAGE_KEY = "napayment_theme";

export const THEME_PREFERENCE_OPTIONS: Record<ThemePreference, { label: string; hint: string; icon: IconName }> = {
  auto: {
    label: "Automatic",
    hint: `Light from ${formatHour(DAY_STARTS_AT_HOUR)} to ${formatHour(NIGHT_STARTS_AT_HOUR)}, dark overnight - in your time zone.`,
    icon: "themeAuto",
  },
  light: { label: "Light", hint: "Always light.", icon: "themeLight" },
  dark: { label: "Dark", hint: "Always dark.", icon: "themeDark" },
};

export function isThemePreference(value: unknown): value is ThemePreference {
  return typeof value === "string" && (THEME_PREFERENCES as readonly string[]).includes(value);
}

/** Uses the device clock, i.e. the viewer's local time zone. */
export function schemeForTime(now: Date = new Date()): ColorScheme {
  const hour = now.getHours();
  return hour >= DAY_STARTS_AT_HOUR && hour < NIGHT_STARTS_AT_HOUR ? "light" : "dark";
}

export function resolveColorScheme(preference: ThemePreference, now: Date = new Date()): ColorScheme {
  return preference === "auto" ? schemeForTime(now) : preference;
}

/** Milliseconds until "auto" next flips (the next 06:00 or 18:00 local). */
export function msUntilNextSchemeChange(now: Date = new Date()): number {
  const next = new Date(now);
  const hour = now.getHours();
  const target = hour < DAY_STARTS_AT_HOUR ? DAY_STARTS_AT_HOUR : hour < NIGHT_STARTS_AT_HOUR ? NIGHT_STARTS_AT_HOUR : DAY_STARTS_AT_HOUR + 24;
  next.setHours(target, 0, 0, 0);
  return next.getTime() - now.getTime();
}

function formatHour(hour: number): string {
  const suffix = hour < 12 ? "am" : "pm";
  return `${hour % 12 === 0 ? 12 : hour % 12}${suffix}`;
}
