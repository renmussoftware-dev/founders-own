import { type SQLiteDatabase } from 'expo-sqlite';
import { type CharacterRow } from '@/db/character';
import { CHAPTERS_BY_ID, type Chapter } from '@/content/questline';

export interface FounderCardData {
  milestoneTitle: string;
  businessName: string;
  daysIn: number;
  level: number;
  streak: number;
  questsDone: number;
  verified: boolean;
  sealLabel: string;
  monthYear: string;
}

/** Short seal label for a chapter (money chapters → "$1K"/"$10K"/"$1M", else "✓"). */
export function sealLabel(chapter: Chapter): string {
  if (!chapter.money) return '✓';
  const m = chapter.title.match(/\$([\d,]+)/);
  if (!m) return '$';
  const n = Number(m[1].replace(/,/g, ''));
  if (n >= 1_000_000) return `$${n / 1_000_000}M`;
  if (n >= 1_000) return `$${n / 1_000}K`;
  return `$${n}`;
}

function daysSince(iso: string): number {
  const created = new Date(iso.replace(' ', 'T') + 'Z').getTime();
  return Math.max(1, Math.floor((Date.now() - created) / 86_400_000) + 1);
}

export async function buildFounderCardData(
  db: SQLiteDatabase,
  character: CharacterRow,
  chapterId: string
): Promise<FounderCardData> {
  const chapter = CHAPTERS_BY_ID[chapterId];
  const questsRow = await db.getFirstAsync<{ n: number }>(
    'SELECT COUNT(*) AS n FROM quest_log WHERE completed_at IS NOT NULL'
  );
  const progress = await db.getFirstAsync<{ status: string }>(
    'SELECT status FROM chapter_progress WHERE chapter_id = ?',
    chapterId
  );

  return {
    milestoneTitle: chapter?.title ?? 'Milestone',
    businessName: character.business_name,
    daysIn: daysSince(character.created_at),
    level: character.overall_level,
    streak: character.streak,
    questsDone: questsRow?.n ?? 0,
    verified: progress?.status === 'verified',
    sealLabel: chapter ? sealLabel(chapter) : '✓',
    monthYear: new Date()
      .toLocaleString([], { month: 'long', year: 'numeric' })
      .toUpperCase(),
  };
}
