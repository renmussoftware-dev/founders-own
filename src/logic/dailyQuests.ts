import { type SQLiteDatabase } from 'expo-sqlite';
import {
  QUEST_TEMPLATES,
  QUEST_TEMPLATES_BY_ID,
  XP_BY_EFFORT,
  type QuestTemplate,
  type Stage,
} from '@/content/questTemplates';
import { CHAPTERS_BY_ID } from '@/content/questline';
import { grantStatXp, type CharacterRow } from '@/db/character';
import { weakestStat } from '@/logic/leveling';
import { type RcOverview } from '@/integrations/revenuecat';
import { type StatKey } from '@/theme/tokens';

export type QuestSlot = 'weakest_stat' | 'chapter' | 'habit' | 'chain';

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

/**
 * The founder's journey stage (SPEC §6), derived from the active chapter.
 * Foundation = the very first chapter (hasn't proven it works yet) → quests are
 * "get onto the path" actions, not "run an existing business" ones.
 */
export function founderStage(activeChapter?: string): Stage {
  const ch = activeChapter ? CHAPTERS_BY_ID[activeChapter] : undefined;
  if (!ch) return 'foundation';
  if (ch.id === 'act1_ch1') return 'foundation';
  if (ch.act === 1) return 'early';
  if (ch.act === 2 || ch.act === 3) return 'growth';
  return 'scale';
}

function stageMatches(t: QuestTemplate, stage: Stage): boolean {
  return !t.stages || t.stages.includes(stage);
}

/**
 * The stat to prioritize for today's weakest-stat slot. When RevenueCat is
 * connected, real metrics override the XP-based signal — a founder with users
 * but no revenue should be pushed on Revenue regardless of stat XP (SPEC #2:
 * smart quests from real data). Falls back to the weakest XP stat.
 */
export function priorityStat(c: CharacterRow, overview: RcOverview | null): StatKey {
  if (overview) {
    const users = overview.metrics.active_users ?? 0;
    const subs = overview.metrics.active_subscriptions ?? 0;
    const mrr = overview.metrics.mrr ?? 0;
    if (users < 50) return 'marketing'; // not enough reach yet
    if (subs === 0) return 'revenue'; // users but no monetization
    if (mrr / Math.max(1, subs) < 3) return 'revenue'; // weak revenue per subscriber
  }
  return weakestStat(c);
}

/** Pick one template from the first non-empty tier (tiers ordered by preference). */
function pickTiered(
  tiers: QuestTemplate[][],
  dateKey: string,
  slot: QuestSlot,
  exclude: Set<string>
): QuestTemplate | null {
  for (const tier of tiers) {
    const pool = tier.filter(t => !exclude.has(t.id));
    if (pool.length > 0) return pool[seededIndex(`${dateKey}:${slot}`, pool.length)];
  }
  return null;
}

/**
 * The on-device daily engine (SPEC §6). For each slot, prefer a quest that is
 * both business-type-specific AND stage-appropriate, then relax: type-specific
 * any-stage, universal at-stage, universal any-stage. This gives personalized,
 * journey-appropriate quests while guaranteeing every slot fills.
 *
 * Effort guard: habits are light by construction; if the weakest-stat and
 * chapter picks both land heavy, the weakest-stat pick downgrades.
 */
function selectDaily(
  c: CharacterRow,
  dateKey: string,
  activeChapter: string,
  overview: RcOverview | null
): QuestTemplate[] {
  const bt = c.business_type;
  const stage = founderStage(activeChapter);
  const chosen: QuestTemplate[] = [];
  const used = new Set<string>();

  // --- weakest-stat slot (metric-priority when connected, else weakest XP) ---
  const priority = priorityStat(c, overview);
  const statBase = QUEST_TEMPLATES.filter(
    t => !t.habit && !t.chapter && !t.chainOnly && t.stat === priority
  );
  const statTiers = (efforts?: (t: QuestTemplate) => boolean) => {
    const f = efforts ?? (() => true);
    return [
      statBase.filter(t => t.type === bt && stageMatches(t, stage) && f(t)),
      statBase.filter(t => t.type === 'any' && stageMatches(t, stage) && f(t)),
      statBase.filter(t => t.type === bt && f(t)),
      statBase.filter(t => t.type === 'any' && f(t)),
    ];
  };
  let weakestPick = pickTiered(statTiers(), dateKey, 'weakest_stat', used);

  // --- chapter-pull slot (type-specific chapter quest preferred) ---
  const chapBase = QUEST_TEMPLATES.filter(t => t.chapter === activeChapter);
  const chapterPick = pickTiered(
    [chapBase.filter(t => t.type === bt), chapBase.filter(t => t.type === 'any')],
    dateKey,
    'chapter',
    used
  );

  // Never serve two heavy quests in one day.
  if (
    weakestPick &&
    chapterPick &&
    weakestPick.effort === 'heavy' &&
    chapterPick.effort === 'heavy'
  ) {
    const lighter = pickTiered(statTiers(t => t.effort !== 'heavy'), dateKey, 'weakest_stat', used);
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

  // --- habit slot (type-specific habit preferred; habits are stage-agnostic) ---
  const habBase = QUEST_TEMPLATES.filter(t => t.habit && !t.chainOnly);
  const habitPick = pickTiered(
    [habBase.filter(t => t.type === bt), habBase.filter(t => t.type === 'any')],
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
  c: CharacterRow,
  overview: RcOverview | null = null
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
  const picks = selectDaily(c, dateKey, active?.chapter_id ?? 'act1_ch1', overview);

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

  // Quest chain: completing a starter unlocks its follow-up on today's board.
  const template = QUEST_TEMPLATES_BY_ID[quest.template_id];
  if (template?.chain) {
    const follow = QUEST_TEMPLATES_BY_ID[template.chain];
    if (follow) {
      const already = await db.getFirstAsync<{ n: number }>(
        'SELECT COUNT(*) AS n FROM quest_log WHERE quest_date = ? AND template_id = ?',
        dateKey,
        follow.id
      );
      if ((already?.n ?? 0) === 0) {
        await db.runAsync(
          `INSERT INTO quest_log (quest_date, template_id, slot, title, stat, effort, xp)
           VALUES (?, ?, 'chain', ?, ?, ?, ?)`,
          dateKey,
          follow.id,
          follow.title,
          follow.stat,
          follow.effort,
          XP_BY_EFFORT[follow.effort]
        );
      }
    }
  }

  return grantStatXp(db, quest.stat, quest.xp);
}
