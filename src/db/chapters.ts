import { type SQLiteDatabase } from 'expo-sqlite';
import {
  CHAPTERS,
  CHAPTERS_BY_ID,
  FIRST_CHAPTER,
  nextChapter,
  type Chapter,
} from '@/content/questline';

export type ChapterStatus = 'locked' | 'active' | 'done' | 'verified';

export interface ChapterProgressRow {
  chapter_id: string;
  act: number;
  status: ChapterStatus;
  objectives_total: number;
  objectives_done: number;
  objective_flags: string; // JSON map objectiveId -> bool
  completed_at: string | null;
}

/**
 * Ensure every authored chapter has a progress row. The first chapter starts
 * 'active', the rest 'locked'. Idempotent — safe to call on every launch.
 */
export async function seedChapters(db: SQLiteDatabase) {
  await db.withTransactionAsync(async () => {
    for (const ch of CHAPTERS) {
      await db.runAsync(
        `INSERT OR IGNORE INTO chapter_progress
           (chapter_id, act, status, objectives_total, objectives_done, objective_flags)
         VALUES (?, ?, ?, ?, 0, '{}')`,
        ch.id,
        ch.act,
        ch.id === FIRST_CHAPTER.id ? 'active' : 'locked',
        ch.objectives.length
      );
    }
  });
}

export async function getAllProgress(db: SQLiteDatabase): Promise<ChapterProgressRow[]> {
  return db.getAllAsync<ChapterProgressRow>(
    'SELECT * FROM chapter_progress ORDER BY act, chapter_id'
  );
}

export async function getProgress(
  db: SQLiteDatabase,
  chapterId: string
): Promise<ChapterProgressRow | null> {
  return db.getFirstAsync<ChapterProgressRow>(
    'SELECT * FROM chapter_progress WHERE chapter_id = ?',
    chapterId
  );
}

export async function getActiveChapter(db: SQLiteDatabase): Promise<ChapterProgressRow | null> {
  return db.getFirstAsync<ChapterProgressRow>(
    "SELECT * FROM chapter_progress WHERE status = 'active' ORDER BY act, chapter_id LIMIT 1"
  );
}

export function parseFlags(row: ChapterProgressRow): Record<string, boolean> {
  try {
    return JSON.parse(row.objective_flags) as Record<string, boolean>;
  } catch {
    return {};
  }
}

/**
 * Toggle a single objective. Returns { row, justCompleted } — justCompleted is
 * true on the transition where the final objective is checked (caller writes
 * the milestone + unlocks the next chapter).
 */
export async function toggleObjective(
  db: SQLiteDatabase,
  chapterId: string,
  objectiveId: string
): Promise<{ row: ChapterProgressRow; justCompleted: boolean }> {
  const row = await getProgress(db, chapterId);
  const chapter = CHAPTERS_BY_ID[chapterId];
  if (!row || !chapter) throw new Error(`Unknown chapter ${chapterId}`);

  const flags = parseFlags(row);
  flags[objectiveId] = !flags[objectiveId];
  const done = chapter.objectives.filter(o => flags[o.id]).length;
  const wasComplete = row.status === 'done' || row.status === 'verified';
  const nowComplete = done === chapter.objectives.length;

  await db.runAsync(
    `UPDATE chapter_progress
       SET objective_flags = ?, objectives_done = ?, status = ?, completed_at = ?
     WHERE chapter_id = ?`,
    JSON.stringify(flags),
    done,
    nowComplete ? 'done' : 'active',
    nowComplete ? new Date().toISOString() : null,
    chapterId
  );

  const updated = (await getProgress(db, chapterId))!;
  return { row: updated, justCompleted: !wasComplete && nowComplete };
}

/** Unlock the following chapter (if any) after one completes. */
export async function unlockNext(db: SQLiteDatabase, chapterId: string): Promise<Chapter | null> {
  const next = nextChapter(chapterId);
  if (!next) return null;
  await db.runAsync(
    "UPDATE chapter_progress SET status = 'active' WHERE chapter_id = ? AND status = 'locked'",
    next.id
  );
  return next;
}
