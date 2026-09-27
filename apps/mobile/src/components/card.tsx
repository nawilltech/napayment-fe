import { Pressable, View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';
import { radius } from '@/theme';
import { makeStyles, useColors } from '@/theme/theme-provider';

export function Card({ style, ...props }: ViewProps) {
  const styles = useStyles();
  return <View style={[styles.card, style]} {...props} />;
}

/** A row inside a Card: hairline divider, optional press. */
export function Row({
  children,
  onPress,
  last,
  style,
  accessibilityLabel,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  last?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  const colors = useColors();
  const styles = useStyles();
  const rowStyle = [styles.row, !last && styles.divider, style];
  if (!onPress) return <View style={rowStyle}>{children}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [rowStyle, pressed && { backgroundColor: colors.paper }]}
    >
      {children}
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingHorizontal: 14, paddingVertical: 11 },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.lineSoft },
}));
