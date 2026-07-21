import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * Small persisted user preferences. Native: expo-secure-store; web (dev
 * preview): localStorage. Kept separate from the RevenueCat credentials store
 * so prefs and secrets don't share a lifecycle.
 */

const KEY_SOUND = 'pref_sound_enabled';
const KEY_REMINDER = 'pref_daily_reminder';
const KEY_REMINDER_HOUR = 'pref_reminder_hour';

async function getItem(k: string): Promise<string | null> {
  if (Platform.OS === 'web') return localStorage.getItem(k);
  return SecureStore.getItemAsync(k);
}
async function setItem(k: string, v: string) {
  if (Platform.OS === 'web') localStorage.setItem(k, v);
  else await SecureStore.setItemAsync(k, v);
}

/** Sound effects default ON; only an explicit "0" disables them. */
export async function loadSoundEnabled(): Promise<boolean> {
  const v = await getItem(KEY_SOUND);
  return v !== '0';
}

export async function saveSoundEnabled(enabled: boolean): Promise<void> {
  await setItem(KEY_SOUND, enabled ? '1' : '0');
}

/** Daily reminder defaults OFF — it needs notification permission to be useful. */
export async function loadReminderEnabled(): Promise<boolean> {
  return (await getItem(KEY_REMINDER)) === '1';
}

export async function saveReminderEnabled(enabled: boolean): Promise<void> {
  await setItem(KEY_REMINDER, enabled ? '1' : '0');
}

/** Hour of day (0–23) for the daily reminder. Defaults to 19 (7 PM). */
export async function loadReminderHour(): Promise<number> {
  const n = parseInt((await getItem(KEY_REMINDER_HOUR)) ?? '', 10);
  return Number.isInteger(n) && n >= 0 && n <= 23 ? n : 19;
}

export async function saveReminderHour(hour: number): Promise<void> {
  await setItem(KEY_REMINDER_HOUR, String(hour));
}
