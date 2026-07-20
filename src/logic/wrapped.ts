import { type SQLiteDatabase } from 'expo-sqlite';
import { type CharacterRow } from '@/db/character';
import { statXp } from '@/logic/leveling';
import { type RcOverview } from '@/integrations/revenuecat';
import { statOrder, stats, type StatKey } from '@/theme/tokens';

/**
 * "Founder Wrapped" recap (SPEC #3): aggregate the whole journey into one
 * shareable artifact. Doubles as a re-engagement moment and a viral surface —
 * and makes the record feel too valuable to abandon.
 */
export interface WrappedData {
  businessName: string;
  daysIn: number;
  level: number;
  rankTitle: string;
  questsDone: number;
  perfectDays: number;
  milestones: number;
  verifiedMilestones: number;
  streak: number;
  topStat: { key: StatKey; label: string; xp: number };
  mrr?: number;
  revenue?: number;
  monthYear: string;
}

function daysSince(iso: string): number {
  const created = new Date(iso.replace(' ', 'T') + 'Z').getTime();
  return Math.max(1, Math.floor((Date.now() - created) / 86_400_000) + 1);
}

export async function buildWrappedData(
  db: SQLiteDatabase,
  character: CharacterRow,
  overview: RcOverview | null
): Promise<WrappedData> {
  const [quests, perfect, milestones, verified] = await Promise.all([
    db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM quest_log WHERE completed_at IS NOT NULL'),
    db.getFirstAsync<{ n: number }>("SELECT COUNT(*) AS n FROM journal WHERE kind='daily' AND perfect_day=1"),
    db.getFirstAsync<{ n: number }>("SELECT COUNT(*) AS n FROM journal WHERE kind='milestone'"),
    db.getFirstAsync<{ n: number }>("SELECT COUNT(*) AS n FROM chapter_progress WHERE status='verified'"),
  ]);

  let topKey: StatKey = statOrder[0];
  for (const s of statOrder) if (statXp(character, s) > statXp(character, topKey)) topKey = s;

  return {
    businessName: character.business_name,
    daysIn: daysSince(character.created_at),
    level: character.overall_level,
    rankTitle: character.rank_title,
    questsDone: quests?.n ?? 0,
    perfectDays: perfect?.n ?? 0,
    milestones: milestones?.n ?? 0,
    verifiedMilestones: verified?.n ?? 0,
    streak: character.streak,
    topStat: { key: topKey, label: stats[topKey].label, xp: statXp(character, topKey) },
    mrr: overview?.metrics.mrr,
    revenue: overview?.metrics.revenue,
    monthYear: new Date().toLocaleString([], { month: 'long', year: 'numeric' }).toUpperCase(),
  };
}
