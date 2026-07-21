import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * Local daily-reminder scheduling. One repeating notification nudges the
 * founder to keep their streak alive. No push server — purely on-device
 * scheduled notifications. Web has a no-op implementation in notifications.web.ts.
 */

const REMINDER_ID = 'founders-own-daily';
const CHANNEL_ID = 'daily-reminder';
const REMINDER_HOUR = 19; // 7:00 PM local — evening wind-down, tunable
const REMINDER_MINUTE = 0;

let handlerSet = false;
function ensureHandler() {
  if (handlerSet) return;
  handlerSet = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

/** Ask for notification permission (no prompt if already decided). */
export async function requestNotificationPermission(): Promise<boolean> {
  ensureHandler();
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (current.canAskAgain === false) return false;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

/** Schedule (or reschedule) the daily reminder. Returns false if not permitted. */
export async function scheduleDailyReminder(): Promise<boolean> {
  ensureHandler();
  const granted = await requestNotificationPermission();
  if (!granted) return false;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Daily reminder',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  // Replace any existing schedule so toggling never stacks duplicates.
  await Notifications.cancelScheduledNotificationAsync(REMINDER_ID).catch(() => {});
  await Notifications.scheduleNotificationAsync({
    identifier: REMINDER_ID,
    content: {
      title: 'Your quests are ready',
      body: 'A few minutes today keeps your streak alive.',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: REMINDER_HOUR,
      minute: REMINDER_MINUTE,
      ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
    },
  });
  return true;
}

export async function cancelDailyReminder(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(REMINDER_ID).catch(() => {});
}
