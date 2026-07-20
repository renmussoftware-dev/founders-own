import { type SQLiteDatabase } from 'expo-sqlite';
import { QUEST_TEMPLATES, XP_BY_EFFORT, type QuestTemplate } from '@/content/questTemplates';
import { grantStatXp, type CharacterRow } from '@/db/character';
import { weakestStat } from '@/logic/leveling';
import { type StatKey } from '@/theme/tokens';

export type QuestSlot = 'weakest_stat' | 'chapter' | 'habit';

export interface QuestLogRow {
  id: number;
  quest_date: string;
  template_id: string;
  slot: QuestSlot;
  title: string;
  stat: StatKey;
  effort: 'light' | 'medium' | 'heavy';
  xp: number;
  completed_at: string | null;
}

export function todayKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Deterministic small hash so a given day always deals the same quests. */
function seededIndex(seed: string, mod: number): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h) % Math.max(1, mod);
}

function forType(c: CharacterRow) {
  return QUEST_TEMPLATES.filter(t => t.type === 'any' || t.type === c.business_type);
}

function pick(
  candidates: QuestTemplate[],
  dateKey: string,
  slot: QuestSlot,
  exclude: Set<string>
): QuestTemplate | null {
  const pool = candidates.filter(t => !exclude.has(t.id));
  if (pool.length === 0) return null;
  return pool[seededIndex(`${dateKey}:${slot}`, pool.length)];
}

/**
 * The on-device daily engine (SPEC §6): filter by business_type first, then
 * one quest for the weakest stat, one pulling toward the active chapter,
 * one habit. Effort guard: never three heavies (habits are light by
 * construction; if both picks land heavy, the weakest-stat pick downgrades).
 */
function selectDaily(c: CharacterRow, dateKey: string, activeChapter: string): QuestTemplate[] {
  const typed = forType(c);
  const chosen: QuestTemplate[] = [];
  const used = new Set<string>();

  const weakest = weakestStat(c);
  let weakestPick = pick(
    typed.filter(t => !t.habit && !t.chapter && t.stat === weakest),
    dateKey,
    'weakest_stat',
    used
  );

  const chapterPick = pick(
    typed.filter(t => t.chapter === activeChapter),
    dateKey,
    'chapter',
    used
  );

  if (weakestPick && chapterPick && weakestPick.effort === 'heavy' && chapterPick.effort === 'heavy') {
    const lighter = pick(
      typed.filter(t => !t.habit && !t.chapter && t.stat === weakest && t.effort !== 'heavy'),
      dateKey,
      'weakest_stat',
      used
    );
    if (lighter) weakestPick = lighter;
  }

  if (weakestPick) {
    chosen.push(weakestPick);
    used.add(weakestPick.id);
  }
  if (chapterPick) {
    chosen.push(chapterPick);
    used.add(chapterPick.id);
  }

  const habitPick = pick(
    typed.filter(t => t.habit),
    dateKey,
    'habit',
    used
  );
  if (habitPick) chosen.push(habitPick);

  return chosen;
}

const SLOT_ORDER: QuestSlot[] = ['weakest_stat', 'chapter', 'habit'];

/** Issue today's quests if not already issued; return today's board. */
export async function ensureTodayQuests(
  db: SQLiteDatabase,
  c: CharacterRow
): Promise<QuestLogRow[]> {
  const dateKey = todayKey();
  const existing = await db.getAllAsync<QuestLogRow>(
    'SELECT * FROM quest_log WHERE quest_date = ? ORDER BY id',
    dateKey
  );
  if (existing.length > 0) return existing;

  const active = await db.getFirstAsync<{ chapter_id: string }>(
    "SELECT chapter_id FROM chapter_progress WHERE status = 'active' LIMIT 1"
  );
  const picks = selectDaily(c, dateKey, active?.chapter_id ?? 'act1_ch1');

  await db.withTransactionAsync(async () => {
    for (let i = 0; i < picks.length; i++) {
      const t = picks[i];
      await db.runAsync(
        `INSERT INTO quest_log (quest_date, template_id, slot, title, stat, effort, xp)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        dateKey,
        t.id,
        t.chapter ? 'chapter' : t.habit ? 'habit' : SLOT_ORDER[Math.min(i, 2)],
        t.title,
        t.stat,
        t.effort,
        XP_BY_EFFORT[t.effort]
      );
    }
  });

  return db.getAllAsync<QuestLogRow>(
    'SELECT * FROM quest_log WHERE quest_date = ? ORDER BY id',
    dateKey
  );
}

/**
 * Complete a quest: stamp quest_log, grant stat XP + gems, and update the
 * streak (first completion of the day extends or restarts it). Returns the
 * refreshed character row.
 */
export async function completeQuest(
  db: SQLiteDatabase,
  quest: QuestLogRow
): Promise<CharacterRow> {
  const dateKey = todayKey();
  const doneTodayBefore = await db.getFirstAsync<{ n: number }>(
    'SELECT COUNT(*) AS n FROM quest_log WHERE quest_date = ? AND completed_at IS NOT NULL',
    dateKey
  );

  await db.runAsync(
    "UPDATE quest_log SET completed_at = datetime('now') WHERE id = ? AND completed_at IS NULL",
    quest.id
  );

  if ((doneTodayBefore?.n ?? 0) === 0) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const hadYesterday = await db.getFirstAsync<{ n: number }>(
      'SELECT COUNT(*) AS n FROM quest_log WHERE quest_date = ? AND completed_at IS NOT NULL',
      todayKey(yesterday)
    );
    if ((hadYesterday?.n ?? 0) > 0) {
      await db.runAsync('UPDATE character SET streak = streak + 1 WHERE id = 1');
    } else {
      await db.runAsync('UPDATE character SET streak = 1 WHERE id = 1');
    }
  }

  return grantStatXp(db, quest.stat, quest.xp);
}
