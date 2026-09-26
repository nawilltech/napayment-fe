import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, radius } from '@/theme';
import { AppText } from './text';

// Torn bottom edge: M0 0 H320, then alternate teeth back to x=0 (same path as the brand file).
const TEETH = 32;
const EDGE = `M0 0 H320 ${Array.from({ length: TEETH }, (_, i) => `L${310 - i * 10} ${i % 2 === 0 ? 10 : 0}`).join(' ')} Z`;

/** Cream receipt block with the brand's torn edge - sits on the blue screens (designs 04, 07). */
export function Receipt({ children, gap = 14 }: { children: ReactNode; gap?: number }) {
  return (
    <View style={styles.wrap}>
      <View style={[styles.paper, { gap }]}>{children}</View>
      <Svg width="100%" height={10} viewBox="0 0 320 10" preserveAspectRatio="none">
        <Path d={EDGE} fill={colors.cream} />
      </Svg>
    </View>
  );
}

/** Dashed tear line between receipt sections. */
export function ReceiptRule() {
  return <View style={styles.rule} />;
}

/**
 * Label / value row. `typewriter` sets it in Special Elite like a printed
 * receipt; `total` is the large AMOUNT line.
 */
export function ReceiptLine({
  label,
  value,
  typewriter,
  total,
}: {
  label: string;
  value: string;
  typewriter?: boolean;
  total?: boolean;
}) {
  const size = total ? 14 : 13.5;
  return (
    <View style={[styles.line, total && { alignItems: 'baseline' }]}>
      <AppText display={typewriter} size={size} color={typewriter ? colors.ink : colors.subtle} numberOfLines={1} style={styles.label}>
        {total ? label.toUpperCase() : label}
      </AppText>
      <AppText
        display={typewriter}
        weight={typewriter ? 'regular' : 'semibold'}
        size={total ? 24 : size}
        numberOfLines={typewriter ? undefined : 1}
        style={styles.value}
      >
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginHorizontal: 18, marginTop: 22 },
  paper: {
    backgroundColor: colors.cream,
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 22,
  },
  rule: { borderTopWidth: 1, borderStyle: 'dashed', borderColor: colors.receiptRule, marginVertical: 2 },
  line: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  label: { flexShrink: 0 },
  value: { flexShrink: 1, textAlign: 'right' },
});
