import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radius } from '@/theme';
import { AppText } from './text';

/** Radio card (design 03): 2px blue border + filled ring when selected. */
export function ChoiceCard({
  title,
  body,
  selected,
  onPress,
}: {
  title: string;
  body: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      style={[styles.card, selected ? styles.on : styles.off]}
    >
      <View style={[styles.ring, selected ? styles.ringOn : styles.ringOff]} />
      <View style={{ flex: 1 }}>
        <AppText weight="semibold" size={15}>
          {title}
        </AppText>
        <AppText size={12.5} color={colors.muted} style={{ marginTop: 4, lineHeight: 19 }}>
          {body}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.white, borderRadius: radius.card, padding: 16, flexDirection: 'row', gap: 14 },
  on: { borderWidth: 2, borderColor: colors.brand, padding: 15 },
  off: { borderWidth: 1, borderColor: colors.line },
  ring: { width: 22, height: 22, borderRadius: 11, marginTop: 2 },
  ringOn: { borderWidth: 6, borderColor: colors.brand },
  ringOff: { borderWidth: 2, borderColor: colors.tan },
});
