import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import Purchases, {
  LOG_LEVEL,
  type CustomerInfo,
  type PurchasesPackage,
} from 'react-native-purchases';
import { linkFacebookAnonymousIDToRevenueCat } from '@/utils/analytics';
import { useStore } from '@/store/useStore';

// RevenueCat project "Founders Own" (proj5386be70). Products/pricing live in
// App Store Connect (like Fretionary); the paywall reads them from offerings.
// These are public app-specific SDK keys — safe to ship in the binary.
//   iOS     -> appl_...  (App Store app; set)
//   Android -> goog_...  (add a Play Store app when we ship Android)
// Pre-store device testing: RevenueCat Test Store key 'test_XcejGcIKndRuAwEOMXyaBFIURhd'.
const REVENUECAT_API_KEY_IOS = 'appl_gTRoNOfQcLQnytUctFlWiEckNVW';
const REVENUECAT_API_KEY_ANDROID = '';
// Must match the entitlement identifier created in the RevenueCat dashboard.
const ENTITLEMENT_ID = 'Renmus Software LLC Pro';

function apiKey(): string {
  return Platform.OS === 'ios' ? REVENUECAT_API_KEY_IOS : REVENUECAT_API_KEY_ANDROID;
}

// Purchases.configure must run exactly once per app session. Both the launch
// bootstrap and the paywall hook route through here so we never double-configure.
let configured = false;
function configureRevenueCat(): boolean {
  if (configured) return true;
  const key = apiKey();
  if (!key) return false; // keys not provisioned for this platform (e.g. web)
  if (__DEV__) {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  }
  Purchases.configure({ apiKey: key });
  // Link the Facebook anonymous ID so RevenueCat's server-side purchase events
  // match our SDK funnel (esp. for ATT-denied users). Fire-and-forget.
  linkFacebookAnonymousIDToRevenueCat();
  configured = true;
  return true;
}

/**
 * Configure RevenueCat and sync the founder's entitlement into the store on
 * app launch — so `isPro` is correct app-wide before the paywall is ever
 * opened (Pro gating depends on it). No-ops when keys aren't provisioned.
 */
export async function bootstrapRevenueCat(): Promise<void> {
  if (!configureRevenueCat()) return;
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    const isPro = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
    useStore.getState().setIsPro(isPro);
  } catch (e) {
    console.warn('RevenueCat bootstrap error:', e);
  }
}

export interface PurchaseState {
  isLoading: boolean;
  isPro: boolean;
  packages: PurchasesPackage[];
  customerInfo: CustomerInfo | null;
}

export function useRevenueCat() {
  const setIsPro = useStore(s => s.setIsPro);
  const [state, setState] = useState<PurchaseState>({
    isLoading: true,
    isPro: false,
    packages: [],
    customerInfo: null,
  });

  function updatePro(isPro: boolean, customerInfo: CustomerInfo) {
    setIsPro(isPro);
    setState(s => ({ ...s, isPro, customerInfo }));
  }

  useEffect(() => {
    async function init() {
      try {
        if (!configureRevenueCat()) {
          // Keys not provisioned yet — run free-tier only.
          setState(s => ({ ...s, isLoading: false }));
          return;
        }

        const customerInfo = await Purchases.getCustomerInfo();
        const isPro = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
        const offerings = await Purchases.getOfferings();
        const packages = offerings.current?.availablePackages ?? [];

        setIsPro(isPro);
        setState({ isLoading: false, isPro, packages, customerInfo });
      } catch (e) {
        console.warn('RevenueCat init error:', e);
        setState(s => ({ ...s, isLoading: false }));
      }
    }

    init();
  }, []);

  async function purchasePackage(pkg: PurchasesPackage): Promise<boolean> {
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      const isPro = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
      updatePro(isPro, customerInfo);
      return isPro;
    } catch (e: any) {
      if (!e.userCancelled) {
        console.warn('Purchase error:', e);
      }
      return false;
    }
  }

  async function restorePurchases(): Promise<boolean> {
    try {
      const customerInfo = await Purchases.restorePurchases();
      const isPro = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
      updatePro(isPro, customerInfo);
      return isPro;
    } catch (e) {
      console.warn('Restore error:', e);
      return false;
    }
  }

  return { ...state, purchasePackage, restorePurchases };
}
