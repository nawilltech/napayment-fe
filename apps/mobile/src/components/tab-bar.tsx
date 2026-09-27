import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { AppText } from './text';
import { makeStyles, useColors } from '@/theme/theme-provider';

/** Icon + label tab bar with a short blue bar over the active tab (design 02/05/06/10). */
export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const colors = useColors();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 12) + 6 }]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const { title, tabBarIcon } = descriptors[route.key].options;
        const label = title ?? route.name;
        const color = focused ? colors.brand : colors.subtle;
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            onPress={() => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
            }}
            style={styles.tab}
          >
            <View style={[styles.indicator, focused && styles.indicatorOn]} />
            {tabBarIcon?.({ focused, color, size: TAB_ICON_SIZE })}
            <AppText size={11.5} weight={focused ? 'bold' : 'regular'} color={color}>
              {label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const TAB_ICON_SIZE = 22;

const useStyles = makeStyles((colors) => ({
  bar: { flexDirection: 'row', backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 10 },
  tab: { flex: 1, alignItems: 'center', gap: 4, minHeight: 44 },
  indicator: { width: 22, height: 3, borderRadius: 2 },
  indicatorOn: { backgroundColor: colors.brand },
}));
