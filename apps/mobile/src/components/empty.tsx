import { View } from 'react-native';
import { AppText } from './text';
import { useColors } from '@/theme/theme-provider';

export function Empty({ title, body }: { title: string; body?: string }) {
  const colors = useColors();
  return (
    <View style={{ paddingVertical: 28, paddingHorizontal: 20, alignItems: 'center', gap: 4 }}>
      <AppText weight="semibold" align="center">
        {title}
      </AppText>
      {body && (
        <AppText size={12.5} color={colors.subtle} align="center">
          {body}
        </AppText>
      )}
    </View>
  );
}
