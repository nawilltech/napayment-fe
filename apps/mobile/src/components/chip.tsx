import { Pressable } from 'react-native';
import { colors } from '@/theme';
import { AppText } from './text';

/** Filter pill: ink when on, white with hairline when off (design 06). */
export function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      style={{
        borderRadius: 18,
        paddingHorizontal: 14,
        paddingVertical: 8,
        backgroundColor: on ? colors.ink : colors.white,
        borderWidth: 1,
        borderColor: on ? colors.ink : colors.line,
      }}
    >
      <AppText size={12.5} weight={on ? 'semibold' : 'regular'} color={on ? colors.cream : colors.ink}>
        {label}
      </AppText>
    </Pressable>
  );
}
