import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { AppText } from './text';
import { useColors } from '@/theme/theme-provider';

const TILE =
  'M18 0 H82 Q100 0 100 18 V88 L91.7 96 L83.3 88 L75 96 L66.7 88 L58.3 96 L50 88 L41.7 96 L33.3 88 L25 96 L16.7 88 L8.3 96 L0 88 V18 Q0 0 18 0 Z';

/** Lowercase typewriter "n" on the receipt-edged tile. */
export function LogoMark({ size = 32, tile, letter }: { size?: number; tile?: string; letter?: string }) {
  const colors = useColors();
  return (
    <View style={{ width: size, height: size }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={size} height={size} viewBox="0 0 100 100" style={{ position: 'absolute' }}>
        <Path d={TILE} fill={tile ?? colors.brand} />
      </Svg>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: size * 0.1, alignItems: 'center', justifyContent: 'center' }}>
        <AppText display size={size * 0.63} color={letter ?? colors.cream} style={{ lineHeight: size * 0.8 }}>
          n
        </AppText>
      </View>
    </View>
  );
}

export function Wordmark({ size = 20, color }: { size?: number; color?: string }) {
  const colors = useColors();
  return (
    <AppText display size={size} color={color ?? colors.ink} accessibilityLabel="Napayment">
      napayment
    </AppText>
  );
}
