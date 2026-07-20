import { type SQLiteDatabase } from 'expo-sqlite';
import { type StatKey } from '@/theme/tokens';

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
  created_at: string;
}

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
) {
  const initial = (input.businessName.trim()[0] ?? 'F').toUpperCase();
  const xp = input.startingXp ?? {};
  await db.runAsync(
    `INSERT INTO character
      (id, business_name, business_initial, business_type,
       product_xp, marketing_xp, revenue_xp, operations_xp, finance_xp)
     VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)`,
    input.businessName.trim(),
    initial,
    input.businessType,
    xp.product ?? 0,
    xp.marketing ?? 0,
    xp.revenue ?? 0,
    xp.operations ?? 0,
    xp.finance ?? 0
  );
}

export async function grantStatXp(db: SQLiteDatabase, stat: StatKey, amount: number) {
  await db.runAsync(
    `UPDATE character SET ${stat}_xp = ${stat}_xp + ?, gems = gems + ? WHERE id = 1`,
    amount,
    amount
  );
}
