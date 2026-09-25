import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors } from '@/theme';

type Kind = 'success' | 'failed' | 'held' | 'pending';

const TONE: Record<Kind, string> = {
  success: colors.success,
  failed: colors.danger,
  held: colors.warning,
  pending: colors.pending,
};

// Drawn rather than typed: font glyphs for ✓/× vary by platform and face.
const PATHS: Record<Kind, string> = {
  success: 'M7 12.5l3.5 3.5L17 9',
  failed: 'M8 8l8 8M16 8l-8 8',
  held: 'M12 7v6M12 16.5v.5',
  pending: 'M7.5 12h.01M12 12h.01M16.5 12h.01',
};

/** 56px round status mark for receipts and confirmations. */
export function StatusBadge({ kind }: { kind: Kind }) {
  return (
    <View
      style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: TONE[kind], alignItems: 'center', justifyContent: 'center' }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Svg width={30} height={30} viewBox="0 0 24 24">
        <Path d={PATHS[kind]} stroke={colors.white} strokeWidth={kind === 'pending' ? 3 : 2.4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </Svg>
    </View>
  );
}
