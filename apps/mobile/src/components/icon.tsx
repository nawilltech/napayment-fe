import type { LucideProps } from 'lucide-react-native';
import type { IconName } from '@napayment/ui-tokens';
import { ICONS } from '@/lib/icons';
import { useColors } from '@/theme/theme-provider';

/** A shared-vocabulary icon, e.g. <Icon name="settings" />. Hidden from screen readers - pair it with a label. */
export function Icon({ name, size = 20, color, ...props }: { name: IconName } & LucideProps) {
  const colors = useColors();
  const Glyph = ICONS[name];
  return <Glyph size={size} color={color ?? colors.ink} accessibilityElementsHidden importantForAccessibility="no" {...props} />;
}
