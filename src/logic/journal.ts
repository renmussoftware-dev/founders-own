import { type SQLiteDatabase } from 'expo-sqlite';
import { todayKey, type QuestLogRow } from '@/logic/dailyQuests';
import { stats, type StatKey } from '@/theme/tokens';

export interface JournalRow {
  id: number;
  entry_date: string;
  kind: 'daily' | 'milestone';
  body: string;
  xp_summary: string; // JSON map stat -> xp
  perfect_day: number; // 0 | 1
  founder_card_ref: string | null;
  created_at: string;
}

/** Lowercase the first character so quest titles read as clauses in a sentence. */
function clause(title: string): string {
  const t = title.replace(/\.$/, '');
  return t.charAt(0).toLowerCase() + t.slice(1);
}

function joinClauses(parts: string[]): string {
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts.slice(0, -1).join(', ')}, and ${parts[parts.length - 1]}`;
}

/**
 * Templated daily-entry assembly (SPEC §10 margin note): built from the day's
 * completed-quest data, NOT a live LLM call on the free tier. Reads like the
 * design's reflective voice without per-user token cost.
 */
export function assembleDailyBody(completed: QuestLogRow[], perfectDay: boolean): string {
  if (completed.length === 0) {
    return 'Quiet day — nothing checked off, but the streak is still yours to keep.';
  }
  const body = joinClauses(completed.map(q => clause(q.title)));
  const lead = perfectDay
    ? 'A perfect day — '
    : completed.length === 1
      ? 'One quest between everything else — '
      : 'Chipped away at it — ';
  const tail = perfectDay
    ? '. Every quest done, and the streak grows.'
    : completed.length === 1
      ? '. Small, but the streak lives another day.'
      : '.';
  return `${lead}${body}${tail}`;
}

function xpSummary(completed: QuestLogRow[]): Record<StatKey, number> {
  const sum = {} as Record<StatKey, number>;
  for (const q of completed) sum[q.stat] = (sum[q.stat] ?? 0) + q.xp;
  return sum;
}

/**
 * Upsert today's daily journal entry from the current quest board. Called
 * after each quest completion so the entry stays current through the day.
 */
export async function upsertDailyEntry(db: SQLiteDatabase, dateKey = todayKey()) {
  const quests = await db.getAllAsync<QuestLogRow>(
    'SELECT * FROM quest_log WHERE quest_date = ? ORDER BY id',
    dateKey
  );
  const completed = quests.filter(q => q.completed_at !== null);
  if (completed.length === 0) return; // nothing to write yet

  const perfectDay = quests.length > 0 && completed.length === quests.length;
  const body = assembleDailyBody(completed, perfectDay);
  const summary = JSON.stringify(xpSummary(completed));

  const existing = await db.getFirstAsync<{ id: number }>(
    "SELECT id FROM journal WHERE entry_date = ? AND kind = 'daily'",
    dateKey
  );
  if (existing) {
    await db.runAsync(
      'UPDATE journal SET body = ?, xp_summary = ?, perfect_day = ? WHERE id = ?',
      body,
      summary,
      perfectDay ? 1 : 0,
      existing.id
    );
  } else {
    await db.runAsync(
      `INSERT INTO journal (entry_date, kind, body, xp_summary, perfect_day)
       VALUES (?, 'daily', ?, ?, ?)`,
      dateKey,
      body,
      summary,
      perfectDay ? 1 : 0
    );
  }
}

/** Write a milestone journal entry when a chapter completes. */
export async function writeMilestoneEntry(
  db: SQLiteDatabase,
  chapterTitle: string,
  opts: { verified?: boolean; founderCardRef?: string } = {}
) {
  const body = `Milestone: ${chapterTitle}`;
  await db.runAsync(
    `INSERT INTO journal (entry_date, kind, body, xp_summary, perfect_day, founder_card_ref)
     VALUES (?, 'milestone', ?, '{}', 0, ?)`,
    todayKey(),
    body,
    opts.founderCardRef ?? null
  );
}

export async function getJournalEntries(db: SQLiteDatabase): Promise<JournalRow[]> {
  return db.getAllAsync<JournalRow>(
    'SELECT * FROM journal ORDER BY entry_date DESC, id DESC'
  );
}

/** Assemble the whole journal into portable Markdown (SPEC #3 export). */
export async function exportJournalText(
  db: SQLiteDatabase,
  businessName: string
): Promise<string> {
  const entries = await getJournalEntries(db);
  const lines: string[] = [`# ${businessName} — the Founders Own record`, ''];
  for (const e of [...entries].reverse()) {
    if (e.kind === 'milestone') {
      lines.push(`## ${e.entry_date} · ${e.body}`, '');
      continue;
    }
    lines.push(`### ${e.entry_date}${e.perfect_day ? ' · Perfect day' : ''}`);
    lines.push(e.body);
    const chips = parseXpSummary(e)
      .map(([s, xp]) => `+${xp} ${stats[s].label}`)
      .join(' · ');
    if (chips) lines.push(`_${chips}_`);
    lines.push('');
  }
  return lines.join('\n');
}

export function parseXpSummary(row: JournalRow): [StatKey, number][] {
  try {
    const obj = JSON.parse(row.xp_summary) as Record<string, number>;
    return Object.entries(obj)
      .filter(([k]) => k in stats)
      .map(([k, v]) => [k as StatKey, v]);
  } catch {
    return [];
  }
}

export interface DayCell {
  date: string;
  state: 'perfect' | 'quest' | 'empty' | 'today';
}

/**
 * The trailing 7-day streak strip for the Journal header (design 7c):
 * gold = perfect day, violet = quest day, empty = nothing, dashed = today.
 */
export async function getStreakStrip(db: SQLiteDatabase): Promise<DayCell[]> {
  const rows = await db.getAllAsync<{ entry_date: string; perfect_day: number; n: number }>(
    `SELECT entry_date, MAX(perfect_day) AS perfect_day, COUNT(*) AS n
       FROM journal WHERE kind = 'daily' GROUP BY entry_date`
  );
  const byDate = new Map(rows.map(r => [r.entry_date, r]));
  const today = todayKey();
  const cells: DayCell[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = todayKey(d);
    const rec = byDate.get(key);
    let state: DayCell['state'];
    if (key === today) state = 'today';
    else if (rec?.perfect_day) state = 'perfect';
    else if (rec) state = 'quest';
    else state = 'empty';
    cells.push({ date: key, state });
  }
  return cells;
}
