import { type SQLiteDatabase } from 'expo-sqlite';
import { todayKey } from '@/logic/dailyQuests';
import { type RcOverview } from '@/integrations/revenuecat';

export interface MetricSnapshot {
  snapshot_date: string;
  mrr: number;
  revenue: number;
  active_subscriptions: number;
  active_users: number;
}

/**
 * Upsert today's metric snapshot from a RevenueCat overview. Snapshots
 * accumulate day by day so the dashboard sparkline builds a real trend from
 * the founder's own usage (no historical-chart API needed).
 */
export async function recordSnapshot(db: SQLiteDatabase, overview: RcOverview) {
  const m = overview.metrics;
  await db.runAsync(
    `INSERT INTO metric_snapshots
       (snapshot_date, mrr, revenue, active_subscriptions, active_users, captured_at)
     VALUES (?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(snapshot_date) DO UPDATE SET
       mrr = excluded.mrr,
       revenue = excluded.revenue,
       active_subscriptions = excluded.active_subscriptions,
       active_users = excluded.active_users,
       captured_at = excluded.captured_at`,
    todayKey(),
    m.mrr ?? 0,
    m.revenue ?? 0,
    m.active_subscriptions ?? 0,
    m.active_users ?? 0
  );
}

export async function getSnapshots(db: SQLiteDatabase, days = 30): Promise<MetricSnapshot[]> {
  const rows = await db.getAllAsync<MetricSnapshot>(
    'SELECT * FROM metric_snapshots ORDER BY snapshot_date DESC LIMIT ?',
    days
  );
  return rows.reverse(); // chronological
}
