import { forwardRef, useState, type ReactNode } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { colors, fonts, radius } from '@/theme';
import { AppText } from './text';

export interface FieldProps extends TextInputProps {
  label?: string;
  hint?: string;
  error?: string;
  mono?: boolean;
  /** Rendered inside the box on the left (e.g. "₦"). */
  prefix?: ReactNode;
  /** Rendered inside the box on the right (e.g. a Show toggle). */
  suffix?: ReactNode;
  large?: boolean;
}

/** Labelled input: white box, sand hairline, 2px blue border when focused (design spec). */
export const Field = forwardRef<TextInput, FieldProps>(function Field(
  { label, hint, error, mono, prefix, suffix, large, style, onFocus, onBlur, ...props },
  ref,
) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.wrap}>
      {label && (
        <AppText weight="semibold" size={13}>
          {label}
        </AppText>
      )}
      <View
        style={[
          styles.box,
          { height: large ? 60 : 50 },
          focused && styles.focused,
          !!error && styles.errored,
        ]}
      >
        {prefix}
        <TextInput
          ref={ref}
          placeholderTextColor={colors.faint}
          {...props}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[
            styles.input,
            { fontFamily: mono ? fonts.mono : fonts.sans, fontSize: large ? 26 : 15 },
            large && { fontFamily: fonts.monoSemibold },
            style,
          ]}
        />
        {suffix}
      </View>
      {error ? (
        <AppText size={12} color={colors.danger}>
          {error}
        </AppText>
      ) : hint ? (
        <AppText size={12} color={colors.subtle}>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
  },
  focused: { borderWidth: 2, borderColor: colors.brand, paddingHorizontal: 13 },
  errored: { borderColor: colors.danger },
  input: { flex: 1, height: '100%', color: colors.ink, paddingVertical: 0 },
});
