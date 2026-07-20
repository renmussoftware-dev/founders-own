import { type SQLiteDatabase } from 'expo-sqlite';
import { CHAPTERS_BY_ID } from '@/content/questline';
import { unlockNext } from '@/db/chapters';
import { writeMilestoneEntry } from '@/logic/journal';

/**
 * Verification write-path (SPEC §7, Phase 3). This is the function that a
 * Stripe Connect webhook or a RevenueCat entitlement event ultimately calls:
 * it records the verification event, promotes the chapter to the gold
 * `verified` tier, writes a verified milestone journal entry, and unlocks the
 * next chapter.
 *
 * The OAuth/webhook plumbing that *triggers* this is pending real Stripe +
 * RevenueCat credentials (see useRevenueCat + docs/SPEC §13). Until then the
 * verify screen calls this directly behind a clearly-labeled dev action.
 */
export async function markChapterVerified(
  db: SQLiteDatabase,
  chapterId: string,
  source: 'stripe' | 'revenuecat' = 'stripe',
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

  await writeMilestoneEntry(db, chapter.title, {
    verified: true,
    founderCardRef: chapterId,
  });
  await unlockNext(db, chapterId);
}

/** Whether a chapter can be revenue-verified (money milestones only, SPEC §4). */
export function isVerifiable(chapterId: string): boolean {
  return !!CHAPTERS_BY_ID[chapterId]?.money;
}
