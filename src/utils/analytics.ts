/**
 * Meta (Facebook) SDK wrapper for ad-campaign attribution — mirrors the
 * Fretionary/Renmus pattern.
 *
 *  - Initializes advertiser-tracking to the ATT result (auto-init is on in
 *    app.json; this just syncs the flag before events send).
 *  - Single-flight ATT prompt, once per install (persisted in AsyncStorage).
 *  - Hands the FB anonymous ID to RevenueCat so server-side purchase events
 *    match SDK-side funnel events for the ~half of users who deny ATT.
 *  - Wraps the funnel events so callers never import the SDK directly.
 *
 * Event source-of-truth split: purchase events (Subscribe/Renewal/Purchase)
 * flow to Meta from RevenueCat server-side — do NOT also fire them here.
 * Funnel events (onboarding complete, paywall view, initiate checkout) are
 * client-only and live here.
 *
 * react-native-fbsdk-next is native-only; it's required lazily so the web
 * bundle (used for dev preview) never loads a native module. Every SDK call is
 * a no-op on web.
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Purchases from 'react-native-purchases';
import {
  getTrackingPermissionsAsync,
  requestTrackingPermissionsAsync,
} from 'expo-tracking-transparency';

type Fbsdk = typeof import('react-native-fbsdk-next');
let fb: Fbsdk | null = null;
if (Platform.OS !== 'web') {
  try {
    fb = require('react-native-fbsdk-next') as Fbsdk;
  } catch {
    fb = null;
  }
}

const ATT_PROMPTED_KEY = 'founders_own_att_prompted_v1';
const PAYWALL_CONTENT_ID = 'founders_own_pro_paywall';

let initialized = false;
let attRequestInFlight: Promise<void> | null = null;

/** Sync advertiser-tracking with the current ATT status. Runs once. */
export async function initAnalytics(): Promise<void> {
  if (initialized || !fb) return;
  initialized = true;
  try {
    if (Platform.OS === 'ios') {
      const { status } = await getTrackingPermissionsAsync();
      await fb.Settings.setAdvertiserTrackingEnabled(status === 'granted');
    } else {
      await fb.Settings.setAdvertiserTrackingEnabled(true);
    }
  } catch (e) {
    if (__DEV__) console.warn('[analytics] init error:', e);
  }
}

/**
 * Prompt for App Tracking Transparency once per install (iOS 14.5+), at a
 * "value experienced" moment. Persists a flag so we never prompt twice, and
 * syncs the result back to the SDK.
 */
export async function maybePromptATT(): Promise<void> {
  if (!fb) return;
  if (attRequestInFlight) return attRequestInFlight;

  attRequestInFlight = (async () => {
    try {
      const prompted = await AsyncStorage.getItem(ATT_PROMPTED_KEY);
      if (prompted) return;

      const { status, canAskAgain } = await getTrackingPermissionsAsync();
      if (status === 'undetermined' && canAskAgain) {
        const result = await requestTrackingPermissionsAsync();
        if (Platform.OS === 'ios') {
          await fb!.Settings.setAdvertiserTrackingEnabled(result.status === 'granted');
        }
      } else if (Platform.OS === 'ios') {
        await fb!.Settings.setAdvertiserTrackingEnabled(status === 'granted');
      }

      await AsyncStorage.setItem(ATT_PROMPTED_KEY, '1');
    } catch (e) {
      if (__DEV__) console.warn('[analytics] ATT prompt error:', e);
    } finally {
      attRequestInFlight = null;
    }
  })();

  return attRequestInFlight;
}

/**
 * Hand the FB anonymous ID to RevenueCat so the purchase events RevenueCat
 * forwards to Meta attribute to the same install as SDK funnel events. Boosts
 * match rate for ATT-denied users. Call after RevenueCat is configured.
 */
export async function linkFacebookAnonymousIDToRevenueCat(): Promise<void> {
  if (!fb) return;
  try {
    const anonId = await fb.AppEventsLogger.getAnonymousID();
    if (anonId) await Purchases.setFBAnonymousID(anonId);
  } catch (e) {
    if (__DEV__) console.warn('[analytics] FB anon ID link error:', e);
  }
}

// ── Funnel events ────────────────────────────────────────────────────────────

export function logOnboardingComplete(): void {
  if (!fb) return;
  try {
    fb.AppEventsLogger.logEvent(fb.AppEventsLogger.AppEvents.CompletedTutorial);
  } catch (e) {
    if (__DEV__) console.warn('[analytics] logOnboardingComplete error:', e);
  }
}

/** Fires when the paywall mounts — Meta uses this for retargeting. */
export function logPaywallView(): void {
  if (!fb) return;
  try {
    fb.AppEventsLogger.logEvent(fb.AppEventsLogger.AppEvents.ViewedContent, {
      [fb.AppEventsLogger.AppEventParams.ContentType]: 'paywall',
      [fb.AppEventsLogger.AppEventParams.ContentID]: PAYWALL_CONTENT_ID,
    });
  } catch (e) {
    if (__DEV__) console.warn('[analytics] logPaywallView error:', e);
  }
}

/**
 * Fires when the user taps the paywall CTA — before the store sheet appears.
 * Pairs with RevenueCat's server-side Subscribe/Purchase events to give Meta
 * the full funnel (paywall view → checkout intent → conversion).
 */
export function logInitiateCheckout(params: {
  productId: string;
  price: number;
  currency: string;
  packageType: string;
}): void {
  if (!fb) return;
  try {
    fb.AppEventsLogger.logEvent(fb.AppEventsLogger.AppEvents.InitiatedCheckout, params.price, {
      [fb.AppEventsLogger.AppEventParams.ContentID]: params.productId,
      [fb.AppEventsLogger.AppEventParams.ContentType]: params.packageType,
      [fb.AppEventsLogger.AppEventParams.Currency]: params.currency,
    });
  } catch (e) {
    if (__DEV__) console.warn('[analytics] logInitiateCheckout error:', e);
  }
}
