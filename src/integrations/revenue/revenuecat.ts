import { getOverview, listProjects } from '@/integrations/revenuecat';
import { type RevenueProvider } from './types';

/**
 * RevenueCat as a RevenueProvider. Thin adapter over the existing REST client
 * ([integrations/revenuecat.ts]) — the low-level fns already return the
 * provider-tagged overview shape, so this just declares capabilities and maps
 * the account (project) picker.
 */
export const revenueCatProvider: RevenueProvider = {
  id: 'revenuecat',
  label: 'RevenueCat',
  supports: new Set([
    'mrr',
    'revenue',
    'active_subscriptions',
    'active_trials',
    'new_customers',
    'active_users', // RevenueCat's SDK sees app usage, so it has this
  ]),
  validate: (key) => listProjects(key),
  getOverview: (key, accountId, currency) => getOverview(key, accountId, currency),
};
