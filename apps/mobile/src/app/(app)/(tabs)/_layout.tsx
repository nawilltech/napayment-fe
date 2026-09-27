import { Tabs } from 'expo-router';
import { Icon } from '@/components/icon';
import { TabBar } from '@/components/tab-bar';

export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: (p) => <Icon name="home" {...p} /> }} />
      <Tabs.Screen name="collect" options={{ title: 'Collect', tabBarIcon: (p) => <Icon name="collect" {...p} /> }} />
      <Tabs.Screen name="activity" options={{ title: 'Activity', tabBarIcon: (p) => <Icon name="activity" {...p} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: (p) => <Icon name="profile" {...p} /> }} />
    </Tabs>
  );
}
