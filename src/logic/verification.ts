import { type SQLiteDatabase } from 'expo-sqlite';
import { CHAPTERS, CHAPTERS_BY_ID, type Chapter, type VerifyMetric } from '@/content/questline';
import { unlockNext } from '@/db/chapters';
import { writeMilestoneEntry } from '@/logic/journal';
import { type RcOverview } from '@/integrations/revenuecat';
import { providerSupportsMetric } from '@/integrations/revenue';

/**
 * Verification write-path (SPEC §7). Records the event, promotes the chapter to
 * the gold `verified` tier, writes a verified milestone entry, and unlocks the
 * next chapter. In V1 this is driven by real RevenueCat metrics read on-device
 * (no simulation) — the founder's own sales verify the milestone.
 */
export async function markChapterVerified(
  db: SQLiteDatabase,
  chapterId: string,
  source: 'stripe' | 'revenuecat' = 'revenuecat',
  payload: Record<string, unknown> = {}
) {
  const chapter = CHAPTERS_BY_ID[chapterId];
  if (!chapter) throw new Error(`Unknown chapter ${chapterId}`);

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO verification_events (source, event_type, chapter_id, payload)
       VALUES (?, 'milestone_verified', ?, ?)`,
      source,
      chapterId,
      JSON.stringify(payload)
    );
    await db.runAsync(
      `UPDATE chapter_progress
         SET status = 'verified',
             objectives_done = objectives_total,
             completed_at = COALESCE(completed_at, ?)
       WHERE chapter_id = ?`,
      new Date().toISOString(),
      chapterId
    );
  });

  await writeMilestoneEntry(db, chapter.title, { verified: true, founderCardRef: chapterId });
  await unlockNext(db, chapterId);
}

/** A chapter carries a verify spec (verifiable by *some* provider). */
export function isVerifiable(chapterId: string): boolean {
  return !!CHAPTERS_BY_ID[chapterId]?.verify;
}

/**
 * Can this chapter be gold-verified with the *currently connected* provider?
 * A verify spec whose metric the provider can't supply (e.g. `active_users` on
 * Stripe) is not offered — the chapter stays self-report instead.
 */
export function chapterVerifiableNow(overview: RcOverview | null, chapter: Chapter): boolean {
  return !!chapter.verify && providerSupportsMetric(overview, chapter.verify.metric);
}

export function metricValue(overview: RcOverview | null, metric: VerifyMetric): number {
  return overview?.metrics[metric] ?? 0;
}

/** Is a chapter's verified threshold met by the live metrics? */
export function chapterMet(overview: RcOverview | null, chapter: Chapter): boolean {
  if (!chapter.verify) return false;
  return metricValue(overview, chapter.verify.metric) >= chapter.verify.threshold;
}

export function metricLabel(metric: VerifyMetric): string {
  switch (metric) {
    case 'mrr':
      return 'MRR';
    case 'revenue':
      return 'revenue (28d)';
    case 'active_subscriptions':
      return 'active subscribers';
    case 'active_users':
      return 'active users';
    case 'new_customers':
      return 'new customers (28d)';
  }
}

const MONEY_METRICS: VerifyMetric[] = ['mrr', 'revenue'];

export function formatMetric(metric: VerifyMetric, value: number): string {
  if (MONEY_METRICS.includes(metric)) {
    return `$${Math.round(value).toLocaleString()}`;
  }
  return value.toLocaleString();
}

export interface NextMilestone {
  chapter: Chapter;
  current: number;
  pct: number;
}

/**
 * The nearest revenue target the founder hasn't hit yet — the first verifiable
 * chapter whose live metric is below threshold. Used for the motivational "gap"
 * line on revenue quests (SPEC #2), independent of verification order.
 */
export function nextUnmetMoneyTarget(
  overview: RcOverview | null
): { chapter: Chapter; current: number; gap: number } | null {
  if (!overview) return null;
  for (const c of CHAPTERS) {
    // Only monetization milestones the provider can measure drive the revenue-gap
    // copy — a pure reach milestone (active_users) shouldn't caption a revenue quest.
    if (!c.verify || c.verify.metric === 'active_users') continue;
    if (!providerSupportsMetric(overview, c.verify.metric)) continue;
    const current = metricValue(overview, c.verify.metric);
    if (current < c.verify.threshold) return { chapter: c, current, gap: c.verify.threshold - current };
  }
  return null;
}

/**
 * The next revenue milestone the founder is working toward — the lowest-index
 * verifiable chapter not yet verified — with progress against the live metric.
 * Powers the "next milestone" block on the revenue dashboard.
 */
export function nextMoneyMilestone(
  overview: RcOverview | null,
  verifiedIds: Set<string>
): NextMilestone | null {
  const pending = CHAPTERS.filter(
    c => c.verify && !verifiedIds.has(c.id) && providerSupportsMetric(overview, c.verify.metric)
  ).sort((a, b) => a.index - b.index);
  const chapter = pending[0];
  if (!chapter?.verify) return null;
  const current = metricValue(overview, chapter.verify.metric);
  return { chapter, current, pct: Math.min(1, current / chapter.verify.threshold) };
}
