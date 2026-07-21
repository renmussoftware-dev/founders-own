/** Web has no local-notification scheduling in the dev preview — all no-ops. */
export async function requestNotificationPermission(): Promise<boolean> {
  return false;
}
export async function scheduleDailyReminder(): Promise<boolean> {
  return false;
}
export async function cancelDailyReminder(): Promise<void> {}
