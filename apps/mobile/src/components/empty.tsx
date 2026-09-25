import { View } from 'react-native';
import { colors } from '@/theme';
import { AppText } from './text';

export function Empty({ title, body }: { title: string; body?: string }) {
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
