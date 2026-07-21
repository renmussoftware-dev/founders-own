/**
 * Provider-agnostic revenue model. A "revenue provider" (RevenueCat today,
 * Stripe or others in V2) supplies the founder's live metrics; milestones and
 * quests depend on this interface, not on any one provider. Each provider
 * declares which metrics it can supply via `supports` — a milestone keyed to a
 * metric the connected provider can't measure is simply not offered (e.g.
 * Stripe has no `active_users`).
 */

export type MetricId =
  | 'mrr'
  | 'revenue'
  | 'active_subscriptions'
  | 'active_trials'
  | 'new_customers'
  | 'active_users'; // capability, not universal — not every provider can see usage

export type ProviderId = 'revenuecat' | 'stripe';

/** A selectable account/project under a provider key. */
export interface ProviderAccount {
  id: string;
  name: string;
}

/** A single point-in-time read of a founder's metrics, tagged with its source. */
export interface RevenueOverview {
  provider: ProviderId;
  currency: string;
  /** Sparse — only the metrics this provider supplied for this account. */
  metrics: Partial<Record<MetricId, number>>;
  /** ISO timestamp the app fetched this. */
  fetchedAt: string;
}

/** The contract every revenue source implements. */
export interface RevenueProvider {
  id: ProviderId;
  label: string;
  /** The metrics this provider can supply — the key to graceful degradation. */
  supports: ReadonlySet<MetricId>;
  /** Validate a key; return the accounts it can see (for the account picker). */
  validate(key: string): Promise<ProviderAccount[]>;
  /** Current overview metrics for one account. */
  getOverview(key: string, accountId: string, currency?: string): Promise<RevenueOverview>;
}
