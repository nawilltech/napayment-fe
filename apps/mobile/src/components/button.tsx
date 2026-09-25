import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius } from '@/theme';
import { AppText } from './text';

type Variant = 'primary' | 'dark' | 'cream' | 'outline' | 'onBrand' | 'ghost';

const VARIANTS: Record<Variant, { bg: string; fg: string; border?: string }> = {
  primary: { bg: colors.brand, fg: colors.cream },
  dark: { bg: colors.ink, fg: colors.cream },
  cream: { bg: colors.cream, fg: colors.ink },
  outline: { bg: colors.white, fg: colors.ink, border: colors.line },
  // Outline button sitting on a blue surface (receipt / account screens).
  onBrand: { bg: 'transparent', fg: colors.cream, border: colors.brandLine },
  ghost: { bg: 'transparent', fg: colors.brand },
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
  const v = VARIANTS[variant];
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
