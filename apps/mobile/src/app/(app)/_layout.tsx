import { Stack } from 'expo-router';
import { useColors } from '@/theme/theme-provider';

export const unstable_settings = { initialRouteName: '(tabs)' };

export default function AppLayout() {
  const colors = useColors();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="transaction/[id]" options={{ contentStyle: { backgroundColor: colors.brand } }} />
      <Stack.Screen name="collect/account/[id]" options={{ contentStyle: { backgroundColor: colors.brand }, gestureEnabled: true }} />
    </Stack>
  );
}
