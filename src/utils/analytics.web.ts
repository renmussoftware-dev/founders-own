/**
 * Web no-op implementation of the analytics wrapper. Metro resolves this on
 * web (via the .web.ts platform extension), so the native-only Facebook SDK is
 * never pulled into the web bundle. Native uses analytics.ts.
 */

export async function initAnalytics(): Promise<void> {}
export async function maybePromptATT(): Promise<void> {}
export async function linkFacebookAnonymousIDToRevenueCat(): Promise<void> {}
export function logOnboardingComplete(): void {}
export function logPaywallView(): void {}
export function logInitiateCheckout(_params: {
  productId: string;
  price: number;
  currency: string;
  packageType: string;
}): void {}
