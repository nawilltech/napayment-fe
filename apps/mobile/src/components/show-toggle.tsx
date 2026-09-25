import { Pressable } from 'react-native';
import { colors } from '@/theme';
import { AppText } from './text';

/** "Show"/"Hide" text toggle for password fields (design uses text, not an eye icon). */
export function ShowToggle({ visible, onToggle }: { visible: boolean; onToggle: () => void }) {
  return (
    <Pressable onPress={onToggle} hitSlop={10} accessibilityRole="button" accessibilityLabel={visible ? 'Hide password' : 'Show password'}>
      <AppText size={13} weight="semibold" color={colors.brand}>
        {visible ? 'Hide' : 'Show'}
      </AppText>
    </Pressable>
  );
}
