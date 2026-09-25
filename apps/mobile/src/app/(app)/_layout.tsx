import { Stack } from 'expo-router';
import { colors } from '@/theme';

export const unstable_settings = { initialRouteName: '(tabs)' };

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.cream } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="transaction/[id]" options={{ contentStyle: { backgroundColor: colors.brand } }} />
      <Stack.Screen name="collect/account/[id]" options={{ contentStyle: { backgroundColor: colors.brand }, gestureEnabled: true }} />
    </Stack>
  );
}
