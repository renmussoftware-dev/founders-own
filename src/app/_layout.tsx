import {
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
} from '@expo-google-fonts/nunito';
import { Newsreader_400Regular_Italic } from '@expo-google-fonts/newsreader';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider } from 'expo-sqlite';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { colors } from '@/theme/tokens';
import { migrateDbIfNeeded } from '@/db/migrations';
import { initAnalytics } from '@/utils/analytics';
import { bootstrapRevenueCat } from '@/hooks/useRevenueCat';
import { initFeedback, setSoundOn } from '@/utils/feedback';
import { loadReminderEnabled, loadReminderHour, loadSoundEnabled } from '@/integrations/settings';
import { scheduleDailyReminder } from '@/integrations/notifications';
import { useStore } from '@/store/useStore';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
    Newsreader_400Regular_Italic,
  });

  // Initialize Meta advertiser-tracking on launch (SDK auto-inits natively).
  // Configure RevenueCat and sync the Pro entitlement before any screen reads
  // `isPro` — gating must be correct app-wide, not just after the paywall opens.
  // Preload UI sound effects and apply the saved mute preference.
  useEffect(() => {
    initAnalytics();
    bootstrapRevenueCat();
    initFeedback();
    loadSoundEnabled().then(enabled => {
      setSoundOn(enabled);
      useStore.setState({ soundEnabled: enabled });
    });
    // Restore the daily reminder preference + time and re-arm the schedule.
    Promise.all([loadReminderEnabled(), loadReminderHour()]).then(([enabled, hour]) => {
      useStore.setState({ reminderEnabled: enabled, reminderHour: hour });
      if (enabled) scheduleDailyReminder(hour);
    });
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SQLiteProvider databaseName="founder-rpg.db" onInit={migrateDbIfNeeded}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bgDeep },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="chapter/[id]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="milestone/[id]" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
        <Stack.Screen name="founder-card/[id]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="verify/[id]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="connect" options={{ presentation: 'modal' }} />
        <Stack.Screen name="wrapped" options={{ presentation: 'modal' }} />
        <Stack.Screen name="unlock" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="paywall" options={{ presentation: 'fullScreenModal' }} />
      </Stack>
    </SQLiteProvider>
  );
}
