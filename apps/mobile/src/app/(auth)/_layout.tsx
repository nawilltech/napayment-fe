import { Stack } from 'expo-router';
import { colors } from '@/theme';

// Signed-out redirects land here - sign-in first, not the alphabetical first file.
export const unstable_settings = { initialRouteName: 'sign-in' };

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.brand } }}>
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="sign-up" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}
