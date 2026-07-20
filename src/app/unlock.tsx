import { useEffect, useState } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStore } from '@/store/useStore';
import { colors, fonts } from '@/theme/tokens';

// Show this once per install, right after the first successful connection.
const SEEN_KEY = 'pro_pitch_seen_v1';

const BENEFITS = [
  {
    icon: '✓',
    tint: colors.gold,
    title: 'Verify milestones in gold',
    body: 'Every revenue milestone becomes un-fakeable, shareable proof — the credibility that wins customers and compounds over time.',
  },
  {
    icon: '◆',
    tint: colors.violetBright,
    title: 'Quests tuned to your numbers',
    body: 'Each day, the single highest-leverage move for exactly where your revenue is — not generic advice you’ve read a hundred times.',
  },
  {
    icon: '✦',
    tint: colors.mintBright,
    title: 'Your weekly AI advisor',
    body: 'A read of your real metrics that names the one bottleneck holding growth back this week — and the concrete fix to attack it.',
  },
  {
    icon: '↑',
    tint: '#E89CD4',
    title: 'The full road to $1M',
    body: 'Every act of the journey unlocks, so the game keeps pace as your business grows — from first subscriber to seven figures.',
  },
];

/**
 * Post-connection Pro pitch (monetization model B). Fires once, right after the
 * founder connects RevenueCat — celebrates that it works, shows what Pro turns
 * their revenue into, and offers the trial. Non-pushy: benefit-framed, with a
 * clear "keep exploring free" out.
 */
export default function UnlockScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isPro = useStore(s => s.isPro);
  const projectName = useStore(s => s.rcProjectName);
  const [state, setState] = useState<'checking' | 'show' | 'skip'>('checking');

  useEffect(() => {
    (async () => {
      const seen = await AsyncStorage.getItem(SEEN_KEY);
      if (seen || isPro) {
        setState('skip');
        return;
      }
      await AsyncStorage.setItem(SEEN_KEY, '1');
      setState('show');
    })();
  }, [isPro]);

  if (state === 'skip') return <Redirect href="/(tabs)" />;
  if (state !== 'show') return <View style={styles.root} />;

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 24 }]}>
        <View style={styles.check}>
          <Text style={styles.checkMark}>✓</Text>
        </View>
        <Text style={styles.hed}>You&rsquo;re connected</Text>
        <Text style={styles.sub}>
          {projectName ?? 'Your app'} is live in Founders Own. Your real revenue is flowing in —
          here&rsquo;s what Pro does with it.
        </Text>

        <View style={styles.benefits}>
          {BENEFITS.map(b => (
            <LinearGradient
              key={b.title}
              colors={[colors.surfaceTop, colors.surfaceBottom]}
              style={styles.card}
            >
              <View style={[styles.icon, { backgroundColor: b.tint }]}>
                <Text style={styles.iconGlyph}>{b.icon}</Text>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{b.title}</Text>
                <Text style={styles.cardText}>{b.body}</Text>
              </View>
            </LinearGradient>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, 28) }]}>
        <Pressable onPress={() => router.replace('/paywall')}>
          <LinearGradient colors={[colors.gold, colors.goldMid]} style={styles.cta}>
            <Text style={styles.ctaLabel}>Start your 7-day free trial</Text>
          </LinearGradient>
        </Pressable>
        <Text style={styles.ctaNote}>Free for 7 days · cancel anytime</Text>
        <Pressable onPress={() => router.replace('/(tabs)')} style={styles.later}>
          <Text style={styles.laterText}>Keep exploring free</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgDeep },
  content: { paddingHorizontal: 26, paddingBottom: 24 },
  check: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  checkMark: { fontFamily: fonts.uiBlack, fontSize: 30, color: '#0E2418' },
  hed: {
    fontFamily: fonts.uiExtraBold,
    fontSize: 26,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  sub: {
    fontFamily: fonts.uiBold,
    fontSize: 13.5,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 22,
  },
  benefits: { gap: 12 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    padding: 16,
    flexDirection: 'row',
    gap: 13,
    alignItems: 'flex-start',
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGlyph: { fontFamily: fonts.uiBlack, fontSize: 17, color: '#14102E' },
  cardBody: { flex: 1 },
  cardTitle: { fontFamily: fonts.uiExtraBold, fontSize: 15, color: colors.textPrimary },
  cardText: {
    fontFamily: fonts.uiBold,
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.textSecondary,
    marginTop: 5,
  },
  actions: { paddingHorizontal: 26, paddingTop: 8 },
  cta: {
    height: 54,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 4,
    borderBottomColor: colors.goldDeep,
  },
  ctaLabel: { fontFamily: fonts.uiExtraBold, fontSize: 15, color: '#3A2A0C' },
  ctaNote: {
    fontFamily: fonts.uiBold,
    fontSize: 11.5,
    color: colors.textFaint,
    textAlign: 'center',
    marginTop: 10,
  },
  later: { height: 46, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  laterText: { fontFamily: fonts.uiExtraBold, fontSize: 13, color: colors.textSecondary },
});
