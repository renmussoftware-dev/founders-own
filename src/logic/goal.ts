import { type SQLiteDatabase } from 'expo-sqlite';
import { type VerifyMetric } from '@/content/questline';
import { todayKey } from '@/logic/dailyQuests';

/**
 * Forward-looking milestone goal (moat depth): the founder picks a target date
 * for their next revenue milestone, and the dashboard shows pace toward it —
 * the complement to the backward-looking 7-day trend. Persisted in app_meta as
 * a single JSON blob; there is only ever one active goal (the next milestone).
 */

const GOAL_KEY = 'milestone_goal';

export interface MilestoneGoal {
  chapterId: string;
  metric: VerifyMetric;
  target: number;
  /** Metric value when the goal was set — the pace baseline. */
  startValue: number;
  startDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
}

export interface Pace {
  daysLeft: number;
  totalDays: number;
  /** How far along we should be by now (0–1) vs how far we actually are. */
  expectedFrac: number;
  actualFrac: number;
  onPace: boolean;
  met: boolean;
  remaining: number;
  /** Metric units per day needed from here to still hit the target on time. */
  requiredPerDay: number;
}

function dayDiff(fromKey: string, toKey: string): number {
  const from = new Date(fromKey + 'T00:00:00').getTime();
  const to = new Date(toKey + 'T00:00:00').getTime();
  return Math.round((to - from) / 86_400_000);
}

function addDays(key: string, days: number): string {
  const d = new Date(key + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return todayKey(d);
}

export async function getGoal(db: SQLiteDatabase): Promise<MilestoneGoal | null> {
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM app_meta WHERE key = ?',
    GOAL_KEY
  );
  if (!row) return null;
  try {
    return JSON.parse(row.value) as MilestoneGoal;
  } catch {
    return null;
  }
}

export async function setGoal(
  db: SQLiteDatabase,
  input: { chapterId: string; metric: VerifyMetric; target: number; startValue: number; days: number }
): Promise<MilestoneGoal> {
  const start = todayKey();
  const goal: MilestoneGoal = {
    chapterId: input.chapterId,
    metric: input.metric,
    target: input.target,
    startValue: input.startValue,
    startDate: start,
    dueDate: addDays(start, input.days),
  };
  await db.runAsync(
    'INSERT INTO app_meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?',
    GOAL_KEY,
    JSON.stringify(goal),
    JSON.stringify(goal)
  );
  return goal;
}

export async function clearGoal(db: SQLiteDatabase): Promise<void> {
  await db.runAsync('DELETE FROM app_meta WHERE key = ?', GOAL_KEY);
}

/** Pace toward the goal given the metric's current value. */
export function computePace(goal: MilestoneGoal, current: number): Pace {
  const today = todayKey();
  const totalDays = Math.max(1, dayDiff(goal.startDate, goal.dueDate));
  const elapsed = Math.min(totalDays, Math.max(0, dayDiff(goal.startDate, today)));
  const daysLeft = Math.max(0, dayDiff(today, goal.dueDate));
  const span = goal.target - goal.startValue;
  const progressed = current - goal.startValue;
  const met = current >= goal.target;
  const actualFrac = met ? 1 : span > 0 ? Math.max(0, Math.min(1, progressed / span)) : 0;
  const expectedFrac = Math.min(1, elapsed / totalDays);
  const remaining = Math.max(0, goal.target - current);
  return {
    daysLeft,
    totalDays,
    expectedFrac,
    actualFrac,
    met,
    onPace: met || actualFrac >= expectedFrac - 0.0001,
    remaining,
    requiredPerDay: daysLeft > 0 ? remaining / daysLeft : remaining,
  };
}
