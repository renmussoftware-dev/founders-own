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
