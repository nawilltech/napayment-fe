import { Pressable, View } from 'react-native';
import { radius } from '@/theme';
import { AppText } from './text';
import { makeStyles, useColors } from '@/theme/theme-provider';

export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  const colors = useColors();
  const styles = useStyles();
  return (
    <View style={styles.track} accessibilityRole="radiogroup">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            style={[styles.item, on && styles.on]}
          >
            <AppText size={13.5} weight={on ? 'semibold' : 'regular'} color={on ? colors.ink : colors.muted}>
              {o.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  track: { flexDirection: 'row', backgroundColor: colors.lineSoft, borderRadius: radius.md, padding: 4 },
  item: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: radius.sm },
  on: { backgroundColor: colors.surface, boxShadow: '0 1px 2px rgba(32,38,74,0.1)' },
}));
