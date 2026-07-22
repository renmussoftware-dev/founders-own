import { type SQLiteDatabase } from 'expo-sqlite';
import { type CharacterRow } from '@/db/character';
import { getSnapshots } from '@/db/metrics';
import { weakestStat } from '@/logic/leveling';
import { nextUnmetMoneyTarget, formatMetric, metricLabel } from '@/logic/verification';
import { type RcOverview, type InsightBundle } from '@/integrations/revenuecat';
import { CHAPTERS_BY_ID } from '@/content/questline';
import { ADVISOR_CONFIGURED, ADVISOR_ENDPOINT } from '@/config/advisor';
import { type StatKey } from '@/theme/tokens';

/**
 * The AI advisor (SPEC #4). Two layers, both margin-safe:
 *  - localAdvisor(): a rules-based read of the founder's real state. Zero token
 *    cost, always on. This is the genuinely useful "here's your bottleneck".
 *  - the weekly LLM deep-dive (generateAdvisorDeepDive) is the ONLY live-LLM
 *    call, gated to a paid + cooldown action so token cost tracks a paid action
 *    (SPEC §3). Endpoint is pending the Renmus proxy — it throws until then.
 */

export interface AdvisorSnapshot {
  connected: boolean;
  users: number;
  subs: number;
  mrr: number;
  trials: number;
  weakest: StatKey;
  activeChapterTitle?: string;
  next: { title: string; metric: string; gap: number; label: string } | null;
  questsThisWeek: number;
  mrrTrend: 'up' | 'flat' | 'down' | 'unknown';
  // Deeper charts (null when unavailable: free tier, missing scope, or web CORS).
  churnRate: number | null; // monthly %, lower is better
  trialConversion: number | null; // %
  conversionToPaying: number | null; // %
}

export interface AdvisorInsight {
  headline: string;
  detail: string;
  focusStat: StatKey | null;
  focusLabel: string;
}

export async function buildAdvisorSnapshot(
  db: SQLiteDatabase,
  character: CharacterRow,
  overview: RcOverview | null,
  insights: InsightBundle | null = null
): Promise<AdvisorSnapshot> {
  const active = await db.getFirstAsync<{ chapter_id: string }>(
    "SELECT chapter_id FROM chapter_progress WHERE status = 'active' ORDER BY act, chapter_id LIMIT 1"
  );
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekQuests = await db.getFirstAsync<{ n: number }>(
    "SELECT COUNT(*) AS n FROM quest_log WHERE completed_at IS NOT NULL AND completed_at >= ?",
    weekAgo.toISOString()
  );

  const target = nextUnmetMoneyTarget(overview);
  const snaps = await getSnapshots(db, 14);
  let trend: AdvisorSnapshot['mrrTrend'] = 'unknown';
  if (snaps.length >= 2) {
    const first = snaps[0].mrr;
    const last = snaps[snaps.length - 1].mrr;
    trend = last > first * 1.02 ? 'up' : last < first * 0.98 ? 'down' : 'flat';
  }

  return {
    connected: !!overview,
    users: overview?.metrics.active_users ?? 0,
    subs: overview?.metrics.active_subscriptions ?? 0,
    mrr: overview?.metrics.mrr ?? 0,
    trials: overview?.metrics.active_trials ?? 0,
    weakest: weakestStat(character),
    activeChapterTitle: active ? CHAPTERS_BY_ID[active.chapter_id]?.title : undefined,
    next: target?.chapter.verify
      ? {
          title: target.chapter.title,
          metric: target.chapter.verify.metric,
          gap: target.gap,
          label: metricLabel(target.chapter.verify.metric),
        }
      : null,
    questsThisWeek: weekQuests?.n ?? 0,
    mrrTrend: trend,
    churnRate: insights?.churn?.latest ?? null,
    trialConversion: insights?.trialConversion?.latest ?? null,
    conversionToPaying: insights?.conversionToPaying?.latest ?? null,
  };
}

/** Rules-based diagnosis — no LLM, no token cost. */
export function localAdvisor(s: AdvisorSnapshot): AdvisorInsight {
  if (!s.connected) {
    return {
      headline: 'Connect RevenueCat so I can read your real numbers',
      detail:
        'Right now I’m guessing from your quests. Link your read-only key and I’ll pinpoint the one thing holding your revenue back.',
      focusStat: null,
      focusLabel: 'Connect',
    };
  }

  if (s.users < 50) {
    return {
      headline: 'You need reach before revenue',
      detail: `With ${s.users.toLocaleString()} active users, the fastest lever is more of the right people trying the app. Push your best acquisition channel.`,
      focusStat: 'marketing',
      focusLabel: 'Marketing',
    };
  }

  if (s.subs === 0) {
    return {
      headline: 'Users, but nobody’s paying yet',
      detail:
        'You’ve got reach and no monetization. Put a real paywall in front of your best feature and get your first paying subscriber.',
      focusStat: 'revenue',
      focusLabel: 'Revenue',
    };
  }

  // Real churn beats every proxy: if subscribers are leaking, that's the ceiling.
  if (s.churnRate !== null && s.churnRate >= 10) {
    return {
      headline: `Churn is your ceiling — ${Math.round(s.churnRate)}% cancel each month`,
      detail:
        'At this rate, new subscribers mostly replace lost ones. Find the top cancel reason — a missing feature, a rough renewal, or price — and remove it before chasing installs.',
      focusStat: 'product',
      focusLabel: 'Retention',
    };
  }

  // Trials starting but not converting = a first-run / paywall problem, not reach.
  if (s.trialConversion !== null && s.trialConversion < 25) {
    return {
      headline: `Only ${Math.round(s.trialConversion)}% of trials convert to paid`,
      detail:
        'That’s below the ~25–35% most apps see. The leak is usually first-run value or paywall timing — tighten the moment a trial user first “gets it.”',
      focusStat: 'product',
      focusLabel: 'Conversion',
    };
  }

  const arpu = s.mrr / Math.max(1, s.subs);
  if (arpu < 3) {
    return {
      headline: 'Your revenue per user is thin',
      detail: `About $${arpu.toFixed(2)} MRR per subscriber. Test pricing or one upsell — small ARPU gains flow straight to MRR.`,
      focusStat: 'revenue',
      focusLabel: 'Pricing',
    };
  }

  // Fall back to the MRR trend only when real churn data isn't available.
  if (s.churnRate === null && s.mrrTrend === 'down') {
    return {
      headline: 'MRR is slipping — churn is the ceiling',
      detail:
        'Your recurring revenue trended down this stretch. Find one reason subscribers cancel and remove it before chasing new installs.',
      focusStat: 'product',
      focusLabel: 'Retention',
    };
  }

  if (s.questsThisWeek < 3) {
    return {
      headline: 'Momentum is slipping',
      detail: `Only ${s.questsThisWeek} quest${s.questsThisWeek === 1 ? '' : 's'} done in the last 7 days. Your numbers look okay — the risk now is you, not the app. Protect the streak.`,
      focusStat: 'operations',
      focusLabel: 'Consistency',
    };
  }

  if (s.next) {
    return {
      headline: `You’re ${formatMetric(s.next.metric as never, s.next.gap)} ${s.next.label} from ${s.next.title}`,
      detail:
        s.mrrTrend === 'up'
          ? 'MRR is trending up — keep doing what’s working and lean into your strongest channel to close the gap.'
          : 'Growth is flat. Pick the one lever most likely to move that metric and go deep on it this week.',
      focusStat: 'revenue',
      focusLabel: 'Revenue',
    };
  }

  return {
    headline: 'You’re on track — widen the moat',
    detail: 'Core metrics look healthy. Invest in retention and one repeatable growth channel to make it durable.',
    focusStat: 'product',
    focusLabel: 'Durability',
  };
}

// ---- Premium weekly LLM deep-dive (margin-safe; margin tracks a paid action) ----

const LAST_DEEPDIVE_KEY = 'advisor_deepdive_last';
const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

export async function advisorDeepDiveEligible(
  db: SQLiteDatabase,
  isPro: boolean
): Promise<{ eligible: boolean; reason: 'ok' | 'not_pro' | 'cooldown' }> {
  if (!isPro) return { eligible: false, reason: 'not_pro' };
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM app_meta WHERE key = ?',
    LAST_DEEPDIVE_KEY
  );
  if (row) {
    const next = new Date(row.value).getTime() + COOLDOWN_MS;
    if (Date.now() < next) return { eligible: false, reason: 'cooldown' };
  }
  return { eligible: true, reason: 'ok' };
}

/** Stamp the cooldown so the next deep-dive is a week out. Call on success. */
export async function recordDeepDive(db: SQLiteDatabase): Promise<void> {
  await db.runAsync(
    'INSERT INTO app_meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    LAST_DEEPDIVE_KEY,
    new Date().toISOString()
  );
}

/**
 * The PII-free payload sent to the endpoint — the founder's real *business*
 * numbers only. Deliberately excludes questsThisWeek and other in-app coaching
 * signals: those describe the founder's activity inside Founders Own, not their
 * product, and a business advisor misreads them as product engagement.
 */
export interface DeepDiveRequest {
  connected: boolean;
  users: number;
  subs: number;
  mrr: number;
  trials: number;
  arpu: number;
  mrrTrend: AdvisorSnapshot['mrrTrend'];
  churnRate: number | null;
  trialConversion: number | null;
  conversionToPaying: number | null;
  next: { title: string; label: string; gap: number } | null;
}

function toDeepDiveRequest(s: AdvisorSnapshot): DeepDiveRequest {
  return {
    connected: s.connected,
    users: s.users,
    subs: s.subs,
    mrr: s.mrr,
    trials: s.trials,
    arpu: s.mrr / Math.max(1, s.subs),
    mrrTrend: s.mrrTrend,
    churnRate: s.churnRate,
    trialConversion: s.trialConversion,
    conversionToPaying: s.conversionToPaying,
    next: s.next ? { title: s.next.title, label: s.next.label, gap: s.next.gap } : null,
  };
}

/**
 * The single live-LLM call for the advisor. POSTs a PII-free metrics snapshot
 * to the Renmus serverless endpoint (which holds the Anthropic key and calls
 * Claude), then returns the prose read. Throws when the endpoint isn't
 * configured or the request fails — callers surface "coming to Pro".
 */
export async function generateAdvisorDeepDive(snapshot: AdvisorSnapshot): Promise<string> {
  if (!ADVISOR_CONFIGURED) throw new Error('advisor-endpoint-not-configured');
  let res: Response;
  try {
    res = await fetch(ADVISOR_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toDeepDiveRequest(snapshot)),
    });
  } catch {
    throw new Error('advisor-endpoint-unreachable');
  }
  if (!res.ok) throw new Error(`advisor-endpoint-error-${res.status}`);
  const data = (await res.json()) as { read?: string };
  const read = data.read?.trim();
  if (!read) throw new Error('advisor-endpoint-empty');
  return read;
}
