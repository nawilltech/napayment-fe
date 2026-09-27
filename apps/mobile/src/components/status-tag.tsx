import { View } from 'react-native';
import { statusTone, type StatusKey } from '@/theme';
import { AppText } from './text';
import { useColors } from '@/theme/theme-provider';

/** Mono stamp for payment state. `plain` drops the surface (list meta line in the design). */
export function StatusTag({ status, plain }: { status: string; plain?: boolean }) {
  const colors = useColors();
  const [fgRole, bgRole] = statusTone[status as StatusKey] ?? (['subtle', 'lineSoft'] as const);
  const fg = colors[fgRole];
  const bg = colors[bgRole];
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
