import { type SQLiteDatabase } from 'expo-sqlite';
import { type StatKey } from '@/theme/tokens';
import { overallLevel, rankTitle, statLevel } from '@/logic/leveling';

export type BusinessType =
  | 'digital_product'
  | 'ecommerce'
  | 'services'
  | 'local'
  | 'content'
  | 'other';

export interface CharacterRow {
  id: number;
  business_name: string;
  business_initial: string;
  business_type: BusinessType;
  overall_level: number;
  rank_title: string;
  gems: number;
  streak: number;
  product_level: number;
  product_xp: number;
  marketing_level: number;
  marketing_xp: number;
  revenue_level: number;
  revenue_xp: number;
  operations_level: number;
  operations_xp: number;
  finance_level: number;
  finance_xp: number;
  streak_freezes: number;
  created_at: string;
}

/** Gem cost of one streak freeze. Tunable — ~3 days of questing at 15 xp/quest. */
export const STREAK_FREEZE_COST = 150;

export async function getCharacter(db: SQLiteDatabase): Promise<CharacterRow | null> {
  return db.getFirstAsync<CharacterRow>('SELECT * FROM character WHERE id = 1');
}

export async function createCharacter(
  db: SQLiteDatabase,
  input: {
    businessName: string;
    businessType: BusinessType;
    startingXp?: Partial<Record<StatKey, number>>;
  }
): Promise<CharacterRow> {
  const initial = (input.businessName.trim()[0] ?? 'F').toUpperCase();
  const xp = input.startingXp ?? {};
  const get = (s: StatKey) => xp[s] ?? 0;
  const total =
    get('product') + get('marketing') + get('revenue') + get('operations') + get('finance');
  const level = overallLevel(total);

  await db.runAsync(
    `INSERT INTO character
      (id, business_name, business_initial, business_type,
       overall_level, rank_title, gems,
       product_xp, product_level, marketing_xp, marketing_level,
       revenue_xp, revenue_level, operations_xp, operations_level,
       finance_xp, finance_level)
     VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    input.businessName.trim(),
    initial,
    input.businessType,
    level,
    rankTitle(level),
    total,
    get('product'),
    statLevel(get('product')),
    get('marketing'),
    statLevel(get('marketing')),
    get('revenue'),
    statLevel(get('revenue')),
    get('operations'),
    statLevel(get('operations')),
    get('finance'),
    statLevel(get('finance'))
  );
  return (await getCharacter(db))!;
}

/**
 * Grant stat XP + matching gems, keeping the derived level columns and
 * overall level/rank in sync. Returns the fresh row.
 */
export async function grantStatXp(
  db: SQLiteDatabase,
  stat: StatKey,
  amount: number
): Promise<CharacterRow> {
  await db.runAsync(
    `UPDATE character SET ${stat}_xp = ${stat}_xp + ?, gems = gems + ? WHERE id = 1`,
    amount,
    amount
  );
  const c = (await getCharacter(db))!;
  const total =
    c.product_xp + c.marketing_xp + c.revenue_xp + c.operations_xp + c.finance_xp;
  const level = overallLevel(total);
  await db.runAsync(
    `UPDATE character SET ${stat}_level = ?, overall_level = ?, rank_title = ? WHERE id = 1`,
    statLevel(c[`${stat}_xp`]),
    level,
    rankTitle(level)
  );
  return (await getCharacter(db))!;
}

/**
 * Spend gems on a streak freeze. Returns { ok, character } — ok is false (no
 * charge) when the founder can't afford one. Atomic: the UPDATE only fires when
 * the balance covers the cost.
 */
export async function buyStreakFreeze(
  db: SQLiteDatabase
): Promise<{ ok: boolean; character: CharacterRow }> {
  const res = await db.runAsync(
    `UPDATE character
       SET gems = gems - ?, streak_freezes = streak_freezes + 1
     WHERE id = 1 AND gems >= ?`,
    STREAK_FREEZE_COST,
    STREAK_FREEZE_COST
  );
  return { ok: res.changes > 0, character: (await getCharacter(db))! };
}
