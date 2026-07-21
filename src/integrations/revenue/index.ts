import { revenueCatProvider } from './revenuecat';
import { type MetricId, type ProviderId, type RevenueOverview, type RevenueProvider } from './types';

export * from './types';

/**
 * Registry of revenue providers. V2 adds `stripe` here and everything downstream
 * (verification, dashboard, quests) keeps working via the RevenueProvider
 * contract — no changes to the questline or UI beyond a connect-screen picker.
 */
export const PROVIDERS: Partial<Record<ProviderId, RevenueProvider>> = {
  revenuecat: revenueCatProvider,
  // stripe: stripeProvider,  // V2
};

/** Does the overview's provider supply this metric? Distinguishes "0" from "N/A". */
export function providerSupportsMetric(
  overview: RevenueOverview | null,
  metric: MetricId
): boolean {
  if (!overview) return false;
  return PROVIDERS[overview.provider]?.supports.has(metric) ?? false;
}
