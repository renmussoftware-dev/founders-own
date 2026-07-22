/**
 * RevenueCat REST API v2 client (SPEC V1 — app-dev focus). The app reads the
 * founder's OWN sales using a read-only API key they paste in; there is no
 * consumer OAuth for RevenueCat. Calls go direct to the API from the device
 * (fine for a technical-user POC; V2 can proxy through a backend so the key
 * never lives on-device).
 */

import { type MetricId, type ProviderAccount, type RevenueOverview } from '@/integrations/revenue/types';

const BASE = 'https://api.revenuecat.com/v2';

// Canonical revenue types now live in integrations/revenue/types. These aliases
// keep existing imports (`RcOverview`, `RcMetricId`, `RcProject`) working; new
// code should import the provider-agnostic names directly.
/** @deprecated use MetricId from '@/integrations/revenue' */
export type RcMetricId = MetricId;
/** @deprecated use ProviderAccount from '@/integrations/revenue' */
export type RcProject = ProviderAccount;
/** @deprecated use RevenueOverview from '@/integrations/revenue' */
export type RcOverview = RevenueOverview;

export class RcError extends Error {
  constructor(
    message: string,
    public status?: number
  ) {
    super(message);
    this.name = 'RcError';
  }
}

async function rcGet<T>(path: string, key: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    });
  } catch {
    // Native has no CORS; the web dev preview can be blocked by it.
    throw new RcError('Could not reach RevenueCat. Check your connection.');
  }
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new RcError('That key was rejected. Use a read-only RevenueCat API key.', res.status);
    }
    throw new RcError(`RevenueCat returned an error (${res.status}).`, res.status);
  }
  return (await res.json()) as T;
}

/** List the projects the key can see — used to let the founder pick their app. */
export async function listProjects(key: string): Promise<RcProject[]> {
  const data = await rcGet<{ items: { id: string; name: string }[] }>('/projects', key);
  return (data.items ?? []).map(p => ({ id: p.id, name: p.name }));
}

/** Current overview metrics for a project (MRR, revenue, subs, users…). */
export async function getOverview(
  key: string,
  projectId: string,
  currency = 'USD'
): Promise<RcOverview> {
  const data = await rcGet<{ currency: string; metrics: { id: string; value: number }[] }>(
    `/projects/${projectId}/metrics/overview?currency=${currency}`,
    key
  );
  const metrics: Partial<Record<MetricId, number>> = {};
  for (const m of data.metrics ?? []) metrics[m.id as MetricId] = m.value;
  return {
    provider: 'revenuecat',
    currency: data.currency,
    metrics,
    fetchedAt: new Date().toISOString(),
  };
}

/** Validate a key by listing projects; returns them or throws RcError. */
export async function validateKey(key: string): Promise<RcProject[]> {
  return listProjects(key.trim());
}

// ---------------------------------------------------------------------------
// Charts API — the deeper metrics that power a real growth advisor. Reachable
// on-device via `GET /projects/{id}/charts/{name}` with the read-only key's
// `charts_metrics:charts:read` scope (confirmed in the data-path spike). Each
// chart returns time-series `measures`; we surface the headline rate + trend.
// ---------------------------------------------------------------------------

export type ChartName =
  | 'churn'
  | 'trial_conversion_rate'
  | 'conversion_to_paying'
  | 'initial_conversion'
  | 'subscription_retention'
  | 'ltv_per_customer';

export interface ChartPoint {
  /** Period start, unix seconds. */
  t: number;
  value: number;
  /** RevenueCat flags the most recent period as still filling in. */
  incomplete: boolean;
}

export interface ChartResult {
  chart: ChartName;
  displayName: string;
  /** Headline measure name, e.g. "Churn Rate", "Conversion Rate". */
  measure: string;
  unit: string; // '%', '#', or a currency code
  /** Lower is better (churn) — an advisor shouldn't push these up. */
  reverse: boolean;
  series: ChartPoint[];
  /** Latest complete-period value of the headline measure. */
  latest: number | null;
  /** Average of the headline measure across the range. */
  average: number | null;
}

const REVERSE_CHARTS = new Set<ChartName>(['churn']);

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

interface RawChart {
  display_name?: string;
  measures?: { display_name: string; unit: string; chartable?: boolean }[];
  values?: { cohort: number; measure: number; value: number; incomplete?: boolean }[];
  summary?: { average?: Record<string, number> };
}

/** Normalize a raw chart to its headline rate + trend. Exported for tests. */
export function parseChart(chart: ChartName, data: RawChart): ChartResult {
  const measures = data.measures ?? [];
  // Headline = the chartable measure (the rate), else the first %-unit, else last.
  let hi = measures.findIndex(m => m.chartable);
  if (hi < 0) hi = measures.findIndex(m => m.unit === '%');
  if (hi < 0) hi = Math.max(0, measures.length - 1);
  const head = measures[hi];
  const series: ChartPoint[] = (data.values ?? [])
    .filter(v => v.measure === hi)
    .map(v => ({ t: v.cohort, value: v.value, incomplete: !!v.incomplete }));
  const complete = series.filter(p => !p.incomplete);
  const latest = complete.length
    ? complete[complete.length - 1].value
    : series.length
      ? series[series.length - 1].value
      : null;
  const average = (head && data.summary?.average?.[head.display_name]) ?? null;
  return {
    chart,
    displayName: data.display_name ?? chart,
    measure: head?.display_name ?? '',
    unit: head?.unit ?? '',
    reverse: REVERSE_CHARTS.has(chart),
    series,
    latest,
    average,
  };
}

/**
 * Fetch + normalize one chart. Returns null when the key can't read charts
 * (403 — lacks `charts_metrics:charts:read`), the chart is unavailable, or the
 * web dev preview is CORS-blocked — so callers degrade instead of erroring.
 */
export async function getChart(
  key: string,
  projectId: string,
  chart: ChartName,
  opts: { days?: number; currency?: string } = {}
): Promise<ChartResult | null> {
  const start = new Date();
  start.setDate(start.getDate() - (opts.days ?? 180));
  const q = `start_date=${ymd(start)}&currency=${opts.currency ?? 'USD'}`;
  try {
    const data = await rcGet<RawChart>(`/projects/${projectId}/charts/${chart}?${q}`, key);
    return parseChart(chart, data);
  } catch {
    return null;
  }
}

export interface InsightBundle {
  churn: ChartResult | null;
  trialConversion: ChartResult | null;
  conversionToPaying: ChartResult | null;
  /** True once at least one chart came back — i.e. the key has charts scope. */
  available: boolean;
  fetchedAt: string;
}

/**
 * The advisor's core read: churn, trial→paid conversion, and new-customer→paid.
 * Charts fetch in parallel and fail independently, so one missing chart (or a
 * scope gap) never blocks the others.
 */
export async function getInsights(key: string, projectId: string): Promise<InsightBundle> {
  const [churn, trialConversion, conversionToPaying] = await Promise.all([
    getChart(key, projectId, 'churn'),
    getChart(key, projectId, 'trial_conversion_rate'),
    getChart(key, projectId, 'conversion_to_paying'),
  ]);
  return {
    churn,
    trialConversion,
    conversionToPaying,
    available: !!(churn || trialConversion || conversionToPaying),
    fetchedAt: new Date().toISOString(),
  };
}
