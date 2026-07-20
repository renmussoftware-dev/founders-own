import { type SQLiteDatabase } from 'expo-sqlite';

/**
 * Dev-only: wipe all app data so onboarding runs fresh. Gated behind __DEV__
 * at call sites; never reachable in a production build.
 */
export async function devResetAll(db: SQLiteDatabase) {
  await db.withTransactionAsync(async () => {
    await db.execAsync(`
      DELETE FROM character;
      DELETE FROM chapter_progress;
      DELETE FROM quest_log;
      DELETE FROM journal;
      DELETE FROM verification_events;
      DELETE FROM app_meta;
    `);
  });
}
