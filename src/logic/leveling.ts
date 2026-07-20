import { type CharacterRow } from '@/db/character';
import { statOrder, type StatKey } from '@/theme/tokens';

/** XP needed per stat level; placeholder curve until the leveling pass (SPEC §13). */
export const XP_PER_LEVEL = 1000;

/** Overall level rises every 1,500 total XP across all stats. */
export const XP_PER_OVERALL_LEVEL = 1500;

export function statLevel(xp: number): number {
  return 1 + Math.floor(xp / XP_PER_LEVEL);
}

export function statProgress(xp: number): number {
  return (xp % XP_PER_LEVEL) / XP_PER_LEVEL;
}

export function totalXp(c: CharacterRow): number {
  return c.product_xp + c.marketing_xp + c.revenue_xp + c.operations_xp + c.finance_xp;
}

export function overallLevel(total: number): number {
  return 1 + Math.floor(total / XP_PER_OVERALL_LEVEL);
}

/**
 * Placeholder rank ladder (SPEC §13 open question — design shows
 * "Journeyman Merchant" at level 7).
 */
const RANKS: [minLevel: number, title: string][] = [
  [1, 'Apprentice Founder'],
  [3, 'Novice Trader'],
  [5, 'Journeyman Merchant'],
  [9, 'Adept Merchant'],
  [13, 'Master Merchant'],
  [18, 'Guild Magnate'],
  [25, 'Legendary Founder'],
];

export function rankTitle(level: number): string {
  let title = RANKS[0][1];
  for (const [min, t] of RANKS) {
    if (level >= min) title = t;
  }
  return title;
}

export function statXp(c: CharacterRow, stat: StatKey): number {
  return c[`${stat}_xp`];
}

/** The stat with the least XP — the daily engine's "weakest stat" slot. */
export function weakestStat(c: CharacterRow): StatKey {
  let weakest: StatKey = statOrder[0];
  for (const s of statOrder) {
    if (statXp(c, s) < statXp(c, weakest)) weakest = s;
  }
  return weakest;
}

export function formatXp(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : String(n);
}
