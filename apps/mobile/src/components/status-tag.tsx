import { View } from 'react-native';
import { colors, statusTone, type StatusKey } from '@/theme';
import { AppText } from './text';

/** Mono stamp for payment state. `plain` drops the surface (list meta line in the design). */
export function StatusTag({ status, plain }: { status: string; plain?: boolean }) {
  const [fg, bg] = statusTone[status as StatusKey] ?? [colors.subtle, colors.lineSoft];
  const label = status.replaceAll('_', ' ');
  if (plain) {
    return (
      <AppText mono size={10.5} color={fg}>
        {label}
      </AppText>
    );
  }
  return (
    <View style={{ alignSelf: 'flex-end', backgroundColor: bg, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1 }}>
      <AppText mono size={10} color={fg}>
        {label}
      </AppText>
    </View>
  );
}
