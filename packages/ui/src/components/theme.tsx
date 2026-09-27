"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  DEFAULT_THEME_PREFERENCE,
  isThemePreference,
  msUntilNextSchemeChange,
  resolveColorScheme,
  THEME_PREFERENCE_OPTIONS,
  THEME_PREFERENCES,
  THEME_STORAGE_KEY,
  type ColorScheme,
  type ThemePreference,
} from "@napayment/ui-tokens";
import { cn } from "../lib/cn";
import { Icon } from "./icon";

interface ThemeContextValue {
  preference: ThemePreference;
  scheme: ColorScheme;
  setPreference: (preference: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return isThemePreference(stored) ? stored : DEFAULT_THEME_PREFERENCE;
  } catch {
    return DEFAULT_THEME_PREFERENCE;
  }
}

/**
 * Applies the preference to <html data-theme>, re-evaluates "auto" exactly
 * when 06:00/18:00 local passes (and when the tab wakes up), and keeps other
 * tabs in step through the storage event.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(DEFAULT_THEME_PREFERENCE);
  const [scheme, setScheme] = useState<ColorScheme>("light");

  useEffect(() => {
    setPreferenceState(readPreference());
    const onStorage = (event: StorageEvent) => {
      if (event.key === THEME_STORAGE_KEY) setPreferenceState(readPreference());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    const apply = () => {
      const next = resolveColorScheme(preference);
      document.documentElement.setAttribute("data-theme", next);
      setScheme(next);
    };
    apply();
    if (preference !== "auto") return;
    let timer = window.setTimeout(function tick() {
      apply();
      timer = window.setTimeout(tick, msUntilNextSchemeChange());
    }, msUntilNextSchemeChange());
    const onVisible = () => document.visibilityState === "visible" && apply();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [preference]);

  const setPreference = useCallback((next: ThemePreference) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Storage blocked: still applies for this page view.
    }
    setPreferenceState(next);
  }, []);

  const value = useMemo(() => ({ preference, scheme, setPreference }), [preference, scheme, setPreference]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside ThemeProvider");
  return context;
}

/** Settings -> Preferences: Automatic / Light / Dark. */
export function ThemePreferenceControl() {
  const { preference, scheme, setPreference } = useTheme();
  return (
    <div role="radiogroup" aria-label="Appearance" className="grid gap-2.5 sm:grid-cols-3">
      {THEME_PREFERENCES.map((option) => {
        const { label, hint, icon } = THEME_PREFERENCE_OPTIONS[option];
        const selected = preference === option;
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => setPreference(option)}
            className={cn(
              "flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
              selected ? "border-brand bg-brand-surface" : "border-line bg-surface hover:bg-paper",
            )}
          >
            <span className={cn("flex size-9 items-center justify-center rounded-lg", selected ? "bg-brand text-cream" : "bg-paper text-subtle")}>
              <Icon name={icon} className="size-[18px]" />
            </span>
            <span className="text-[14px] font-semibold text-ink">{label}</span>
            <span className="text-[12.5px] leading-snug text-subtle">
              {hint}
              {option === "auto" && selected && ` Now: ${scheme}.`}
            </span>
          </button>
        );
      })}
    </div>
  );
}
