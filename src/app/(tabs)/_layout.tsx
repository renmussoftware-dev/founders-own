import { Tabs } from 'expo-router/js-tabs';
import { ArcaneTabBar } from '@/components/ArcaneTabBar';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={props => <ArcaneTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: 'Today' }} />
      <Tabs.Screen name="questline" options={{ title: 'Questline' }} />
      <Tabs.Screen name="character" options={{ title: 'Character' }} />
      <Tabs.Screen name="journal" options={{ title: 'Journal' }} />
    </Tabs>
  );
}
