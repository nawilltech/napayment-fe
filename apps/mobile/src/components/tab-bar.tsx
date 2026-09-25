import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { colors } from '@/theme';
import { AppText } from './text';

/** Text-only tab bar with a short blue bar over the active tab (design 02/05/06/10). */
export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 12) + 6 }]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const label = descriptors[route.key].options.title ?? route.name;
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
            <AppText size={11.5} weight={focused ? 'bold' : 'regular'} color={focused ? colors.brand : colors.subtle}>
              {label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 10 },
  tab: { flex: 1, alignItems: 'center', gap: 5, minHeight: 44 },
  indicator: { width: 22, height: 3, borderRadius: 2 },
  indicatorOn: { backgroundColor: colors.brand },
});
