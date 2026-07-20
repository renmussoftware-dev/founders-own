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
        const apiKey = Platform.OS === 'ios' ? REVENUECAT_API_KEY_IOS : REVENUECAT_API_KEY_ANDROID;
        if (!apiKey) {
          // Keys not provisioned yet — run free-tier only.
          setState(s => ({ ...s, isLoading: false }));
          return;
        }

        if (__DEV__) {
          Purchases.setLogLevel(LOG_LEVEL.DEBUG);
        }
        Purchases.configure({ apiKey });

        // Pass the Facebook anonymous ID through so RevenueCat's server-side
        // purchase events match our SDK funnel events (esp. for ATT-denied
        // users). Fire-and-forget — don't block offering load.
        linkFacebookAnonymousIDToRevenueCat();

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
