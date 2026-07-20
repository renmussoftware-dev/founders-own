import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { useEffect } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { ArcaneTabBar } from '@/components/ArcaneTabBar';
import { getCharacter } from '@/db/character';
import { selectNeedsOnboarding, useStore } from '@/store/useStore';

export default function TabsLayout() {
  const db = useSQLiteContext();
  const characterLoaded = useStore(s => s.characterLoaded);
  const needsOnboarding = useStore(selectNeedsOnboarding);
  const setCharacter = useStore(s => s.setCharacter);

  useEffect(() => {
    if (!characterLoaded) {
      getCharacter(db).then(setCharacter);
    }
  }, [characterLoaded, db, setCharacter]);

  if (!characterLoaded) return null;
  if (needsOnboarding) return <Redirect href="/onboarding/index" />;

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
