import Purchases from 'react-native-purchases';

/**
 * Records how many apps (RevenueCat projects) the connecting founder has, as a
 * subscriber attribute on OUR RevenueCat customer (the Founders Own project, not
 * the user's read key). Segment/export it in the RevenueCat dashboard to answer
 * "what fraction of my users are 3+-app portfolio devs?" — the signal that gates
 * whether a multi-app "Studio" tier is worth building.
 *
 * No-ops until the app's own RevenueCat SDK keys are set (see useRevenueCat) and
 * on web, where the SDK isn't configured.
 */
export async function recordConnectedAppCount(count: number): Promise<void> {
  const bucket = count >= 3 ? '3plus' : count === 2 ? '2' : '1';
  if (__DEV__) {
    console.log(`[analytics] connected_app_count=${count} (bucket ${bucket})`);
  }
  try {
    await Purchases.setAttributes({
      connected_app_count: String(count),
      app_portfolio: bucket,
    });
  } catch {
    // SDK not configured yet (keys pending) or unsupported platform — no-op.
  }
}
