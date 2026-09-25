import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { colors } from '@/theme';
import { AppText } from './text';

/** Title block for pushed screens: back chevron, 22px bold title, optional subtitle. */
export function BackHeader({ title, subtitle, onBrand }: { title?: string; subtitle?: string; onBrand?: boolean }) {
  const fg = onBrand ? colors.cream : colors.ink;
  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 }}>
      <Pressable
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        accessibilityRole="button"
        accessibilityLabel="Back"
        hitSlop={12}
        style={{ alignSelf: 'flex-start', paddingVertical: 6, marginLeft: -2 }}
      >
        <AppText size={20} color={fg}>
          ←
        </AppText>
      </Pressable>
      {title && (
        <AppText weight="bold" size={22} color={fg} style={{ marginTop: 6 }}>
          {title}
        </AppText>
      )}
      {subtitle && (
        <AppText size={13.5} color={onBrand ? colors.brandSoft : colors.muted} style={{ marginTop: 4 }}>
          {subtitle}
        </AppText>
      )}
    </View>
  );
}
