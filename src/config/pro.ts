/**
 * Master switch for Pro gating (monetization model B).
 *
 * OFF during the testing phase, so everything is usable while we test. Flip to
 * true at launch — once the app's own RevenueCat SDK keys are in and `isPro`
 * syncs at launch (see useRevenueCat).
 *
 * Model B: the RevenueCat connection + live revenue dashboard stay FREE (the
 * hook — seeing your real MRR inside the app). The payoff is Pro:
 *   - gold-verified milestones
 *   - daily quests tuned to your real numbers
 *   - the AI advisor + weekly deep-dive
 *   - Acts II–IV
 */
export const PRO_GATING_ENABLED = false;

/** True when a Pro feature should be blocked for this user. */
export function proLocked(isPro: boolean): boolean {
  return PRO_GATING_ENABLED && !isPro;
}
