import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';

/**
 * Minimal scaffold layout only (per docs/nawill-pay-frontend.md doc F10 -
 * the Consumer Wallet App is scaffold-only for now, real screens land in FE
 * v0.3). Swap this Stack for the real navigation shape (likely tabs: Home /
 * Collect / Activity / Settings, matching doc F7's mobile screen inventory)
 * once that surface is actually built.
 */
export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
