import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Appearance, AppState, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SystemUI from 'expo-system-ui';
import {
  DEFAULT_THEME_PREFERENCE,
  isThemePreference,
  msUntilNextSchemeChange,
  resolveColorScheme,
  THEME_STORAGE_KEY,
  type ColorScheme,
  type ThemePreference,
} from '@napayment/ui-tokens';
import { palettes, type Colors } from './index';

interface ThemeContextValue {
  preference: ThemePreference;
  scheme: ColorScheme;
  colors: Colors;
  setPreference: (preference: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Same rule as web/admin (@napayment/ui-tokens): "auto" follows the device
 * clock - light 06:00-18:00 local, dark otherwise - re-checked at the exact
 * switch time and whenever the app returns to the foreground; the user can
 * pin light or dark in Profile -> Preferences. Saved on this device.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(DEFAULT_THEME_PREFERENCE);
  const [scheme, setScheme] = useState<ColorScheme>(() => resolveColorScheme(DEFAULT_THEME_PREFERENCE));

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((stored) => isThemePreference(stored) && setPreferenceState(stored))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const apply = () => setScheme(resolveColorScheme(preference));
    apply();
    if (preference !== 'auto') return;
    let timer = setTimeout(function tick() {
      apply();
      timer = setTimeout(tick, msUntilNextSchemeChange());
    }, msUntilNextSchemeChange());
    const subscription = AppState.addEventListener('change', (state) => state === 'active' && apply());
    return () => {
      clearTimeout(timer);
      subscription.remove();
    };
  }, [preference]);

  useEffect(() => {
    // Native chrome (alerts, keyboard, date pickers) and the root view follow the resolved scheme.
    Appearance.setColorScheme(scheme);
    SystemUI.setBackgroundColorAsync(palettes[scheme].background).catch(() => {});
  }, [scheme]);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    AsyncStorage.setItem(THEME_STORAGE_KEY, next).catch(() => {});
  }, []);

  const value = useMemo(
    () => ({ preference, scheme, colors: palettes[scheme], setPreference }),
    [preference, scheme, setPreference],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside ThemeProvider');
  return context;
}

export function useColors(): Colors {
  return useTheme().colors;
}

/**
 * A StyleSheet that depends on theme colours, built once per scheme:
 *   const useStyles = makeStyles((colors) => ({ card: { backgroundColor: colors.surface } }));
 *   function Card() { const styles = useStyles(); ... }
 */
export function makeStyles<T extends StyleSheet.NamedStyles<T>>(factory: (colors: Colors) => T) {
  const cache = new Map<ColorScheme, T>();
  return function useStyles(): T {
    const { scheme, colors } = useTheme();
    let styles = cache.get(scheme);
    if (!styles) {
      styles = StyleSheet.create(factory(colors));
      cache.set(scheme, styles);
    }
    return styles;
  };
}
