import { View } from 'react-native';
import { Link, type Href } from 'expo-router';
import { colors } from '@/theme';
import { AppText } from './text';

/** Mono eyebrow over a list, with an optional right-hand link ("See all"). */
export function SectionHeader({ title, action, href }: { title: string; action?: string; href?: Href }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 18, paddingBottom: 8 }}>
      <AppText eyebrow>{title}</AppText>
      {action && href && (
        <Link href={href} accessibilityRole="link">
          <AppText size={12.5} weight="semibold" color={colors.brand}>
            {action}
          </AppText>
        </Link>
      )}
    </View>
  );
}
