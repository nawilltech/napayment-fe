import { Text, type TextProps, type TextStyle } from 'react-native';
import { colors, fonts } from '@/theme';

type Weight = 'regular' | 'medium' | 'semibold' | 'bold';

const SANS: Record<Weight, string> = {
  regular: fonts.sans,
  medium: fonts.sansMedium,
  semibold: fonts.sansSemibold,
  bold: fonts.sansBold,
};
const MONO: Record<Weight, string> = {
  regular: fonts.mono,
  medium: fonts.monoMedium,
  semibold: fonts.monoSemibold,
  bold: fonts.monoSemibold,
};

export interface AppTextProps extends TextProps {
  /** IBM Plex Mono - amounts, references, dates. */
  mono?: boolean;
  /** Special Elite - wordmark, receipts, campaign lines only. */
  display?: boolean;
  weight?: Weight;
  size?: number;
  color?: string;
  /** Mono eyebrow label: uppercase, tracked out. */
  eyebrow?: boolean;
  align?: TextStyle['textAlign'];
}

/**
 * Custom fonts ship one file per weight, so weight picks the family rather
 * than fontWeight (which Android would ignore or fake-bold).
 */
export function AppText({
  mono,
  display,
  weight = 'regular',
  size,
  color,
  eyebrow,
  align,
  style,
  ...props
}: AppTextProps) {
  const fontFamily = display ? fonts.display : mono || eyebrow ? MONO[weight] : SANS[weight];
  const fontSize = size ?? (eyebrow ? 11 : 14);
  return (
    <Text
      {...props}
      style={[
        {
          fontFamily,
          fontSize,
          color: color ?? (eyebrow ? colors.subtle : colors.ink),
          textAlign: align,
          lineHeight: Math.round(fontSize * 1.4),
        },
        mono && { fontVariant: ['tabular-nums'] },
        eyebrow && { letterSpacing: fontSize * 0.1, textTransform: 'uppercase' },
        style,
      ]}
    />
  );
}
