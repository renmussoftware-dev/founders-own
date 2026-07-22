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

// ---------------------------------------------------------------------------
// Benchmarks — "am I normal?" Percentile vs. store + category peers over ~12mo.
// Needs the read-only key's `charts_metrics:benchmarks:read` scope (confirmed
// grantable via "Charts metrics: Read only"). The endpoint is not in the public
// v2 reference (newer, surfaced via the RevenueCat MCP); the path here is
// inferred from the /metrics/* pattern — validate on device and adjust if 404.
// ---------------------------------------------------------------------------

export interface Benchmark {
  metric: string; // raw id, e.g. "trial_conversion"
  label: string;
  /** The app's own value for this metric. */
  value: number | null;
  /** Peer percentile bucket, e.g. "60-70". */
  bucket: string | null;
  /** Midpoint of the bucket (65 for "60-70") for sorting/coloring. */
  percentile: number | null;
  /** Lower is better (churn, refund rate) — bucket already accounts for this. */
  reverse: boolean;
  /** Low sample size → treat as low-confidence. */
  eligible: boolean;
  category: string | null;
}

export interface BenchmarkSet {
  appId: string | null;
  appName: string | null;
  benchmarks: Benchmark[];
}

const BENCHMARK_LABELS: Record<string, string> = {
  trial_conversion: 'Trial conversion',
  monthly_churn: 'Monthly churn',
  churn: 'Monthly churn',
  initial_conversion: 'Initial conversion',
  conversion_to_paying: 'Conversion to paying',
  refund_rate: 'Refund rate',
  realized_ltv_per_customer: 'LTV / customer',
  realized_ltv_per_paying_customer: 'LTV / paying customer',
};

function benchmarkLabel(metric: string): string {
  return (
    BENCHMARK_LABELS[metric] ??
    metric.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  );
}

function bucketMidpoint(bucket: string | null | undefined): number | null {
  if (!bucket) return null;
  const m = String(bucket).match(/(\d+)\s*[-–]\s*(\d+)/);
  if (m) return (parseInt(m[1], 10) + parseInt(m[2], 10)) / 2;
  const n = parseInt(String(bucket), 10);
  return Number.isFinite(n) ? n : null;
}

/** Tolerant parse — the exact envelope varies, so we probe common shapes. */
export function parseBenchmarks(data: unknown): BenchmarkSet[] {
  const d = data as Record<string, unknown>;
  const appsRaw = Array.isArray(d?.apps)
    ? d.apps
    : Array.isArray(d?.items)
      ? d.items
      : Array.isArray(data)
        ? (data as unknown[])
        : d
          ? [d]
          : [];
  return (appsRaw as Record<string, unknown>[]).map(a => {
    const list = (Array.isArray(a.benchmarks)
      ? a.benchmarks
      : Array.isArray(a.metrics)
        ? a.metrics
        : []) as Record<string, unknown>[];
    return {
      appId: (a.app_id ?? a.id ?? null) as string | null,
      appName: (a.app_name ?? a.name ?? null) as string | null,
      benchmarks: list.map(b => {
        const metric = String(b.metric ?? b.metric_name ?? b.name ?? '');
        const bucket = (b.percentile_bucket ?? null) as string | null;
        return {
          metric,
          label: benchmarkLabel(metric),
          value: (b.metric_value ?? b.value ?? null) as number | null,
          bucket,
          percentile: bucketMidpoint(bucket),
          reverse: b.is_reverse_metric === true,
          eligible: b.is_eligible_for_benchmarking !== false,
          category: (b.comparison_category ?? null) as string | null,
        };
      }),
    };
  });
}

/**
 * Fetch peer benchmarks for the project (or a single app). Returns null on any
 * error (missing scope, 404, or web CORS) so callers degrade gracefully.
 */
export async function getBenchmarks(
  key: string,
  projectId: string,
  opts: { appId?: string } = {}
): Promise<BenchmarkSet[] | null> {
  const q = opts.appId ? `?app_id=${encodeURIComponent(opts.appId)}` : '';
  try {
    const data = await rcGet<unknown>(`/projects/${projectId}/metrics/benchmarks${q}`, key);
    return parseBenchmarks(data);
  } catch {
    return null;
  }
}
