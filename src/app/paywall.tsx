import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { PurchasesPackage } from 'react-native-purchases';
import { ArcaneBackground } from '@/components/ui/ArcaneBackground';
import { HexSeal } from '@/components/ui/HexSeal';
import { useRevenueCat } from '@/hooks/useRevenueCat';
import { colors, fonts } from '@/theme/tokens';

const PERKS = [
  'Verified milestones — gold-sealed, un-fakeable',
  'Acts II–IV: every chapter to $1M',
  'Full journal history + founder-card exports',
  'Weekly AI-tailored custom questlines',
];

/**
 * Hard paywall at the Act 1→2 boundary (SPEC §9). Lifetime "Founder's Edition"
 * $44.99 hero with the monthly as price anchor.
 */
export default function Paywall() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { packages, isLoading, purchasePackage, restorePurchases } = useRevenueCat();

  const lifetime = packages.find(p => p.packageType === 'LIFETIME');
  const monthly = packages.find(p => p.packageType === 'MONTHLY');

  const enterApp = () => router.replace('/(tabs)/questline');

  async function buy(pkg?: PurchasesPackage) {
    if (!pkg) return;
    const ok = await purchasePackage(pkg);
    if (ok) enterApp();
  }

  return (
    <ArcaneBackground>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 24 }]}>
        <Pressable onPress={enterApp} style={styles.closeRow}>
          <Text style={styles.close}>✕</Text>
        </Pressable>

        <View style={styles.sealWrap}>
          <HexSeal label="★" size={64} />
        </View>
        <Text style={styles.hed}>You finished Act I.{'\n'}Unlock the rest.</Text>
        <Text style={styles.sub}>
          Founder&rsquo;s Edition opens every act, the gold verified tier, and your full
          record — once, forever.
        </Text>

        <View style={styles.perks}>
          {PERKS.map(perk => (
            <View key={perk} style={styles.perk}>
              <Text style={styles.perkCheck}>✓</Text>
              <Text style={styles.perkText}>{perk}</Text>
            </View>
          ))}
        </View>

        {monthly ? (
          <Text style={styles.anchor}>
            {monthly.product.priceString}/mo if you rented it. You won&rsquo;t.
          </Text>
        ) : null}

        <Pressable onPress={() => buy(lifetime)} disabled={isLoading}>
          <LinearGradient colors={[colors.gold, colors.goldMid]} style={styles.heroBtn}>
            <Text style={styles.heroLabel}>
              {lifetime
                ? `Founder’s Edition — ${lifetime.product.priceString} once`
                : 'Founder’s Edition — $44.99 once'}
            </Text>
            <Text style={styles.heroSub}>Lifetime access · one payment</Text>
          </LinearGradient>
        </Pressable>

        {!lifetime && !isLoading ? (
          <Text style={styles.note}>
            Store products load once the RevenueCat project is connected. Pricing shown is the
            configured hero tier.
          </Text>
        ) : null}

        <Pressable onPress={restorePurchases} style={styles.restore}>
          <Text style={styles.restoreText}>Restore purchase</Text>
        </Pressable>
        <Pressable onPress={enterApp} style={styles.restore}>
          <Text style={styles.laterText}>Keep exploring Act I</Text>
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
    marginBottom: 22,
  },
  perks: { gap: 11, marginBottom: 20 },
  perk: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  perkCheck: {
    fontFamily: fonts.uiBlack,
    fontSize: 13,
    color: colors.gold,
    width: 20,
    textAlign: 'center',
  },
  perkText: { flex: 1, fontFamily: fonts.uiBold, fontSize: 13.5, color: colors.textPrimary },
  anchor: {
    fontFamily: fonts.uiBold,
    fontSize: 12,
    color: colors.textFaint,
    textAlign: 'center',
    marginBottom: 12,
  },
  heroBtn: {
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 4,
    borderBottomColor: colors.goldDeep,
  },
  heroLabel: { fontFamily: fonts.uiExtraBold, fontSize: 16, color: '#3A2A0C' },
  heroSub: { fontFamily: fonts.uiBold, fontSize: 11.5, color: 'rgba(58,42,12,0.7)', marginTop: 4 },
  note: {
    fontFamily: fonts.uiBold,
    fontSize: 11,
    lineHeight: 16,
    color: colors.textFaint,
    textAlign: 'center',
    marginTop: 12,
  },
  restore: { alignItems: 'center', paddingVertical: 10, marginTop: 4 },
  restoreText: { fontFamily: fonts.uiExtraBold, fontSize: 13, color: colors.textSecondary },
  laterText: { fontFamily: fonts.uiExtraBold, fontSize: 13, color: colors.textFaint },
});
