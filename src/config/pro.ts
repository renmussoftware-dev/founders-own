/**
 * Master switch for Pro gating (monetization model B).
 *
 * ON: `isPro` syncs at launch (bootstrapRevenueCat) and the iOS SDK key is in,
 * so the payoff features gate to the paywall until the founder subscribes.
 *
 * Model B: the RevenueCat connection + live revenue dashboard stay FREE (the
 * hook — seeing your real MRR inside the app). The payoff is Pro:
 *   - gold-verified milestones
 *   - daily quests tuned to your real numbers
 *   - the AI advisor + weekly deep-dive
 *   - Acts II–IV
 */
export const PRO_GATING_ENABLED = true;

/** True when a Pro feature should be blocked for this user. */
export function proLocked(isPro: boolean): boolean {
  return PRO_GATING_ENABLED && !isPro;
}
