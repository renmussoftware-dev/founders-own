import { type SQLiteDatabase } from 'expo-sqlite';
import { todayKey } from '@/logic/dailyQuests';
import { type RcOverview } from '@/integrations/revenuecat';

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
      DELETE FROM metric_snapshots;
    `);
  });
}

/**
 * Dev-only: seed ~14 days of rising metric snapshots and return a fixture
 * overview (Fretionary-shaped) so the revenue dashboard is previewable without
 * a live RevenueCat key (the REST call is native-only; web dev is CORS-blocked).
 */
export async function devSeedSampleMetrics(db: SQLiteDatabase): Promise<RcOverview> {
  const DAYS = 14;
  const endMrr = 526;
  const startMrr = 300;
  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const t = (DAYS - 1 - i) / (DAYS - 1);
    const mrr = Math.round(startMrr + (endMrr - startMrr) * t);
    const revenue = Math.round(2600 + (4564 - 2600) * t);
    const subs = Math.round(60 + (89 - 60) * t);
    const users = Math.round(2100 + (3231 - 2100) * t);
    await db.runAsync(
      `INSERT INTO metric_snapshots
         (snapshot_date, mrr, revenue, active_subscriptions, active_users, captured_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))
       ON CONFLICT(snapshot_date) DO UPDATE SET
         mrr = excluded.mrr, revenue = excluded.revenue,
         active_subscriptions = excluded.active_subscriptions,
         active_users = excluded.active_users`,
      todayKey(d),
      mrr,
      revenue,
      subs,
      users
    );
  }
  return {
    provider: 'revenuecat',
    currency: 'USD',
    metrics: {
      mrr: endMrr,
      revenue: 4564,
      active_subscriptions: 89,
      active_users: 3231,
      new_customers: 2522,
      active_trials: 0,
    },
    fetchedAt: new Date().toISOString(),
  };
}
