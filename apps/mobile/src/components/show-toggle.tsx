import { Pressable } from 'react-native';
import { AppText } from './text';
import { useColors } from '@/theme/theme-provider';

/** "Show"/"Hide" text toggle for password fields (design uses text, not an eye icon). */
export function ShowToggle({ visible, onToggle }: { visible: boolean; onToggle: () => void }) {
  const colors = useColors();
  return (
    <Pressable onPress={onToggle} hitSlop={10} accessibilityRole="button" accessibilityLabel={visible ? 'Hide password' : 'Show password'}>
      <AppText size={13} weight="semibold" color={colors.link}>
        {visible ? 'Hide' : 'Show'}
      </AppText>
    </Pressable>
  );
}
