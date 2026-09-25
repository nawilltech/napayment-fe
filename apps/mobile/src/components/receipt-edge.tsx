import Svg, { Path } from 'react-native-svg';
import { colors } from '@/theme';

const TEETH = 32;
// M0 0 H320, then alternate down/up teeth back to x=0 (same path as the brand file).
const PATH = `M0 0 H320 ${Array.from({ length: TEETH }, (_, i) => `L${310 - i * 10} ${i % 2 === 0 ? 10 : 0}`).join(' ')} Z`;

/** Torn zig-zag bottom edge under a cream receipt block. */
export function ReceiptEdge({ color = colors.cream }: { color?: string }) {
  return (
    <Svg width="100%" height={10} viewBox="0 0 320 10" preserveAspectRatio="none">
      <Path d={PATH} fill={color} />
    </Svg>
  );
}
