import { View } from 'react-native';
import { colors, radius } from '@/theme';
import { AppText } from './text';

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <View accessibilityLiveRegion="polite" style={{ backgroundColor: colors.dangerSurface, borderRadius: radius.lg, padding: 12 }}>
      <AppText size={13} color={colors.danger}>
        {message}
      </AppText>
    </View>
  );
}
