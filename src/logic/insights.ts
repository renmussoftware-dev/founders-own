import { type MetricSnapshot } from '@/db/metrics';
import { type RcOverview } from '@/integrations/revenuecat';

/**
 * Turns the raw dashboard numbers into a momentum read (SPEC #2, moat depth):
 * a real 7-day MRR trend from the founder's own snapshot history, plus the
 * trial pipeline and recent-growth metrics that the headline row doesn't show.
 * Everything is derived from data we already fetch/store — no extra API calls.
 */

export interface Insights {
  /** 7-day MRR change; null until there's a snapshot ~a week old to compare. */
  mrrTrend: { pct: number; dir: 'up' | 'down' | 'flat' } | null;
  /** Active free trials in flight — the conversion pipeline. */
  activeTrials: number | null;
  /** New customers over the trailing 28 days — recent reach. */
  newCustomers: number | null;
}

/** The latest snapshot on or before `days` ago, or null if history is too short. */
function snapshotNearDaysAgo(snaps: MetricSnapshot[], days: number): MetricSnapshot | null {
  if (snaps.length < 2) return null;
  const latest = snaps[snaps.length - 1];
  const target = new Date(latest.snapshot_date + 'T00:00:00');
  target.setDate(target.getDate() - days);
  let best: MetricSnapshot | null = null;
  for (const s of snaps) {
    const d = new Date(s.snapshot_date + 'T00:00:00');
    if (d.getTime() <= target.getTime()) best = s;
    else break; // snaps are chronological; nothing past the target helps
  }
  return best;
}

export function buildInsights(
  snapshots: MetricSnapshot[],
  overview: RcOverview | null
): Insights {
  const mrr = overview?.metrics.mrr ?? null;

  let mrrTrend: Insights['mrrTrend'] = null;
  if (mrr !== null) {
    const prior = snapshotNearDaysAgo(snapshots, 7);
    if (prior && prior.mrr > 0) {
      const pct = ((mrr - prior.mrr) / prior.mrr) * 100;
      mrrTrend = { pct, dir: pct > 0.5 ? 'up' : pct < -0.5 ? 'down' : 'flat' };
    }
  }

  return {
    mrrTrend,
    activeTrials: overview?.metrics.active_trials ?? null,
    newCustomers: overview?.metrics.new_customers ?? null,
  };
}
