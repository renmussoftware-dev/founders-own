import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { PurchasesPackage } from 'react-native-purchases';
import { ArcaneBackground } from '@/components/ui/ArcaneBackground';
import { HexSeal } from '@/components/ui/HexSeal';
import { useRevenueCat } from '@/hooks/useRevenueCat';
import { colors, fonts } from '@/theme/tokens';

// Fallback copy shown before the RevenueCat offering loads (or in dev/web).
// Real prices come from the store products at runtime.
const ANNUAL_PRICE = '$49.99';
const MONTHLY_PRICE = '$8.99';
const ANNUAL_PER_MONTH = '$4.17';
const ANNUAL_SAVINGS = '53%';
const TRIAL_DAYS = 7;

// Apple requires functional Terms + Privacy links on a subscription paywall.
const TERMS_URL = 'https://foundersown.com/terms';
const PRIVACY_URL = 'https://foundersown.com/privacy';

const PERKS = [
  'Live revenue dashboard — your real MRR, every day',
  'Gold-verified milestones, pulled from RevenueCat',
  'Every act — the whole road to $1M',
  'AI advisor: your weekly bottleneck, diagnosed',
  'Full journal history + founder-card exports',
];

type Plan = 'annual' | 'monthly';

/**
 * Subscription paywall (annual-first). Triggers at the Act 1→2 boundary and
 * from the "connect / verify / AI deep-dive" gates. Annual leads with the
 * 7-day trial; monthly is the anchor. Prices render from the live RevenueCat
 * offering when present, else fall back to the configured copy.
 */
export default function Paywall() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { packages, isLoading, purchasePackage, restorePurchases } = useRevenueCat();
  const [plan, setPlan] = useState<Plan>('annual');

  const annual = packages.find(p => p.packageType === 'ANNUAL');
  const monthly = packages.find(p => p.packageType === 'MONTHLY');

  const annualPrice = annual?.product.priceString ?? ANNUAL_PRICE;
  const monthlyPrice = monthly?.product.priceString ?? MONTHLY_PRICE;
  const perMonth =
    annual?.product.price != null ? `$${(annual.product.price / 12).toFixed(2)}` : ANNUAL_PER_MONTH;
  const savings =
    annual?.product.price != null && monthly?.product.price != null
      ? `${Math.round((1 - annual.product.price / (monthly.product.price * 12)) * 100)}%`
      : ANNUAL_SAVINGS;

  const enterApp = () => router.replace('/(tabs)/questline');

  async function buy(pkg?: PurchasesPackage) {
    if (!pkg) return;
    const ok = await purchasePackage(pkg);
    if (ok) enterApp();
  }

  const ctaLabel =
    plan === 'annual' ? `Start your ${TRIAL_DAYS}-day free trial` : 'Subscribe';
  const disclosure =
    plan === 'annual'
      ? `Free for ${TRIAL_DAYS} days, then ${annualPrice}/year. Auto-renews until canceled — manage or cancel anytime in your App Store settings.`
      : `${monthlyPrice}/month. Auto-renews until canceled — manage or cancel anytime in your App Store settings.`;

  return (
    <ArcaneBackground>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 24 }]}>
        <Pressable onPress={enterApp} style={styles.closeRow}>
          <Text style={styles.close}>✕</Text>
        </Pressable>

        <View style={styles.sealWrap}>
          <HexSeal label="★" size={64} />
        </View>
        <Text style={styles.hed}>Unlock the full{'\n'}founder journey</Text>
        <Text style={styles.sub}>
          Connect your revenue, verify milestones in gold, and get the AI advisor — for the
          long haul.
        </Text>

        <View style={styles.perks}>
          {PERKS.map(perk => (
            <View key={perk} style={styles.perk}>
              <Text style={styles.perkCheck}>✓</Text>
              <Text style={styles.perkText}>{perk}</Text>
            </View>
          ))}
        </View>

        {/* Annual — hero */}
        <Pressable onPress={() => setPlan('annual')}>
          <LinearGradient
            colors={
              plan === 'annual'
                ? ['rgba(240,205,121,0.22)', 'rgba(200,148,65,0.1)']
                : [colors.surfaceTop, colors.surfaceBottom]
            }
            style={[styles.planCard, plan === 'annual' && styles.planActive]}
          >
            <View style={styles.planTop}>
              <View style={styles.planLeft}>
                <View style={styles.radio}>
                  {plan === 'annual' ? <View style={styles.radioDot} /> : null}
                </View>
                <Text style={styles.planName}>Annual</Text>
              </View>
              <View style={styles.bestBadge}>
                <Text style={styles.bestText}>SAVE {savings}</Text>
              </View>
            </View>
            <Text style={styles.planPrice}>
              {annualPrice}
              <Text style={styles.planPer}> / year</Text>
            </Text>
            <Text style={styles.planSub}>
              {perMonth}/mo · {TRIAL_DAYS}-day free trial
            </Text>
          </LinearGradient>
        </Pressable>

        {/* Monthly — anchor */}
        <Pressable onPress={() => setPlan('monthly')}>
          <LinearGradient
            colors={
              plan === 'monthly'
                ? ['rgba(164,147,255,0.16)', 'rgba(124,104,232,0.08)']
                : [colors.surfaceTop, colors.surfaceBottom]
            }
            style={[styles.planCard, plan === 'monthly' && styles.planActiveViolet]}
          >
            <View style={styles.planTop}>
              <View style={styles.planLeft}>
                <View style={styles.radio}>
                  {plan === 'monthly' ? <View style={styles.radioDot} /> : null}
                </View>
                <Text style={styles.planName}>Monthly</Text>
              </View>
            </View>
            <Text style={styles.planPrice}>
              {monthlyPrice}
              <Text style={styles.planPer}> / month</Text>
            </Text>
          </LinearGradient>
        </Pressable>

        <Pressable onPress={() => buy(plan === 'annual' ? annual : monthly)} disabled={isLoading}>
          <LinearGradient colors={[colors.gold, colors.goldMid]} style={styles.cta}>
            <Text style={styles.ctaLabel}>{ctaLabel}</Text>
          </LinearGradient>
        </Pressable>

        <Text style={styles.disclosure}>{disclosure}</Text>

        {!annual && !monthly && !isLoading ? (
          <Text style={styles.note}>
            Store products load once the RevenueCat offering is connected. Pricing shown is the
            configured tier.
          </Text>
        ) : null}

        <View style={styles.footerLinks}>
          <Pressable onPress={restorePurchases}>
            <Text style={styles.footerLink}>Restore</Text>
          </Pressable>
          <Text style={styles.footerDot}>·</Text>
          <Pressable onPress={() => Linking.openURL(TERMS_URL)}>
            <Text style={styles.footerLink}>Terms</Text>
          </Pressable>
          <Text style={styles.footerDot}>·</Text>
          <Pressable onPress={() => Linking.openURL(PRIVACY_URL)}>
            <Text style={styles.footerLink}>Privacy</Text>
          </Pressable>
        </View>
        <Pressable onPress={enterApp} style={styles.later}>
          <Text style={styles.laterText}>Keep exploring free</Text>
        </Pressable>
      </ScrollView>
    </ArcaneBackground>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 26, paddingBottom: 40 },
  closeRow: { alignSelf: 'flex-end', padding: 6 },
  close: { fontFamily: fonts.uiExtraBold, fontSize: 18, color: colors.textSecondary },
  sealWrap: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: 'rgba(240,205,121,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 4,
    marginBottom: 18,
  },
  hed: {
    fontFamily: fonts.uiExtraBold,
    fontSize: 25,
    lineHeight: 31,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  sub: {
    fontFamily: fonts.uiBold,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  perks: { gap: 10, marginBottom: 20 },
  perk: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  perkCheck: {
    fontFamily: fonts.uiBlack,
    fontSize: 13,
    color: colors.gold,
    width: 20,
    textAlign: 'center',
  },
  perkText: { flex: 1, fontFamily: fonts.uiBold, fontSize: 13, color: colors.textPrimary },

  planCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.surfaceBorder,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
  },
  planActive: { borderColor: colors.gold },
  planActiveViolet: { borderColor: colors.violet },
  planTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(237,234,251,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.gold },
  planName: { fontFamily: fonts.uiExtraBold, fontSize: 15, color: colors.textPrimary },
  bestBadge: {
    backgroundColor: colors.gold,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  bestText: { fontFamily: fonts.uiBlack, fontSize: 10, letterSpacing: 0.5, color: '#3A2A0C' },
  planPrice: { fontFamily: fonts.uiBlack, fontSize: 22, color: colors.textPrimary, marginTop: 10 },
  planPer: { fontFamily: fonts.uiBold, fontSize: 13, color: colors.textSecondary },
  planSub: { fontFamily: fonts.uiBold, fontSize: 12, color: colors.gold, marginTop: 4 },

  cta: {
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    borderBottomWidth: 4,
    borderBottomColor: colors.goldDeep,
  },
  ctaLabel: { fontFamily: fonts.uiExtraBold, fontSize: 16, color: '#3A2A0C' },
  disclosure: {
    fontFamily: fonts.uiBold,
    fontSize: 10.5,
    lineHeight: 15,
    color: colors.textFaint,
    textAlign: 'center',
    marginTop: 12,
  },
  note: {
    fontFamily: fonts.uiBold,
    fontSize: 11,
    lineHeight: 16,
    color: colors.textFaint,
    textAlign: 'center',
    marginTop: 10,
  },
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
  },
  footerLink: { fontFamily: fonts.uiExtraBold, fontSize: 12, color: colors.textSecondary },
  footerDot: { color: colors.textFaint },
  later: { alignItems: 'center', paddingVertical: 12, marginTop: 2 },
  laterText: { fontFamily: fonts.uiExtraBold, fontSize: 13, color: colors.textFaint },
});
