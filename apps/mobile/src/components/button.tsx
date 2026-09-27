import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { radius, type Colors } from '@/theme';
import { useColors } from '@/theme/theme-provider';
import { AppText } from './text';

type Variant = 'primary' | 'dark' | 'cream' | 'outline' | 'onBrand' | 'ghost';

type Role = keyof Colors | 'transparent';

/** Palette roles per variant, resolved against the active theme in Button. */
const VARIANTS: Record<Variant, { bg: Role; fg: Role; border?: Role }> = {
  primary: { bg: 'brand', fg: 'cream' },
  dark: { bg: 'chrome', fg: 'cream' },
  cream: { bg: 'cream', fg: 'chrome' },
  outline: { bg: 'surface', fg: 'ink', border: 'line' },
  // Outline button sitting on a blue surface (receipt / account screens).
  onBrand: { bg: 'transparent', fg: 'cream', border: 'brandLine' },
  ghost: { bg: 'transparent', fg: 'link' },
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'lg',
  loading,
  disabled,
  style,
  accessibilityLabel,
}: {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  size?: 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  const colors = useColors();
  const role = (key: Role | undefined) => (key === undefined || key === 'transparent' ? key : colors[key]);
  const roles = VARIANTS[variant];
  const v = { bg: role(roles.bg), fg: role(roles.fg), border: role(roles.border) };
  const inactive = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        { height: size === 'lg' ? 52 : 44, backgroundColor: v.bg, borderColor: v.border ?? 'transparent' },
        v.border && styles.bordered,
        pressed && !inactive && styles.pressed,
        disabled && !loading && styles.disabled,
        style,
      ]}
    >
      <View style={styles.row}>
        {loading && <ActivityIndicator size="small" color={v.fg} />}
        <AppText weight="semibold" size={size === 'lg' ? 15 : 13.5} color={v.fg}>
          {title}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: radius.xl, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  bordered: { borderWidth: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.5 },
});
