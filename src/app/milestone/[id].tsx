import { useEffect, useRef, useState } from 'react';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSQLiteContext } from 'expo-sqlite';
import Animated from 'react-native-reanimated';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { HexSeal } from '@/components/ui/HexSeal';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { buildFounderCardData, type FounderCardData } from '@/logic/founderCard';
import { useEnsureCharacter } from '@/hooks/useEnsureCharacter';
import { usePopIn, useTwinkle } from '@/theme/motion';
import { feedback } from '@/utils/feedback';
import { colors, fonts } from '@/theme/tokens';

/** Verified-milestone celebration takeover (design 7e). Fires on chapter completion. */
export default function MilestoneCelebration() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const db = useSQLiteContext();
  const { character, loaded } = useEnsureCharacter();
  const [data, setData] = useState<FounderCardData | null>(null);
  const celebrated = useRef(false);

  const cardPop = usePopIn(120);
  const t1 = useTwinkle(0);
  const t2 = useTwinkle(700);
  const t3 = useTwinkle(1300);
  const t4 = useTwinkle(400);

  useEffect(() => {
    if (id && character) buildFounderCardData(db, character, id).then(setData);
  }, [db, id, character]);

  // Sound the triumphant cue once, when the celebration first appears.
  useEffect(() => {
    if (data && !celebrated.current) {
      celebrated.current = true;
      feedback('milestone');
    }
  }, [data]);

  // Reached without a character (deep link before onboarding) → send them there.
  if (loaded && !character) return <Redirect href="/onboarding" />;
  if (!data) return <View style={styles.root} />;

  return (
    <View style={styles.root}>
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="mGlow" cx="50%" cy="32%" r="60%">
            <Stop offset="0%" stopColor="rgba(240,205,121,0.3)" />
            <Stop offset="65%" stopColor="rgba(240,205,121,0)" />
            <Stop offset="100%" stopColor="rgba(240,205,121,0)" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#mGlow)" />
      </Svg>

      <Animated.Text style={[styles.spark, { top: 120, left: 44, fontSize: 16, color: 'rgba(237,234,251,0.55)' }, t1]}>✦</Animated.Text>
      <Animated.Text style={[styles.spark, { top: 200, right: 38, fontSize: 11, color: 'rgba(201,189,255,0.6)' }, t2]}>✦</Animated.Text>
      <Animated.Text style={[styles.spark, { bottom: 240, left: 30, fontSize: 12, color: 'rgba(237,234,251,0.35)' }, t3]}>✦</Animated.Text>
      <Animated.Text style={[styles.spark, { top: 340, right: 52, fontSize: 13, color: 'rgba(240,205,121,0.7)' }, t4]}>✦</Animated.Text>

      <View style={[styles.body, { paddingTop: insets.top + 40 }]}>
        <Text style={styles.hed}>
          You just hit{'\n'}
          {data.verified ? 'a verified milestone!' : 'a milestone!'}
        </Text>

        <Animated.View style={[styles.cardShadow, cardPop]}>
          <LinearGradient
            colors={['#2E2758', '#1A1436', '#120E28']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.card}
          >
            <View style={styles.cardHairline} />
            <View style={styles.sealRing}>
              <HexSeal label={data.sealLabel} size={64} />
            </View>
            {data.verified ? (
              <VerifiedBadge label="VERIFIED · REVENUECAT" />
            ) : (
              <Text style={styles.selfReport}>SELF-REPORTED</Text>
            )}
            <Text style={styles.milestoneTitle}>{data.milestoneTitle}</Text>
            <View style={styles.footerStats}>
              <Stat value={`Lv ${data.level}`} label="Founder" />
              <View style={styles.divider} />
              <Stat value={String(data.streak)} label="Day streak" />
              <View style={styles.divider} />
              <Stat value={String(data.questsDone)} label="Quests" />
            </View>
            <Text style={styles.wordmark}>
              {data.businessName.toUpperCase()} · {data.monthYear}
            </Text>
          </LinearGradient>
        </Animated.View>
      </View>

      <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, 32) }]}>
        <Pressable
          onPress={() => {
            feedback('tap');
            router.replace(`/founder-card/${id}`);
          }}
        >
          <LinearGradient colors={[colors.gold, colors.goldMid]} style={styles.shareBtn}>
            <Text style={styles.shareText}>Share founder card</Text>
          </LinearGradient>
        </Pressable>
        <Pressable onPress={() => router.replace('/(tabs)/questline')} style={styles.keepBtn}>
          <Text style={styles.keepText}>Keep it in the journal</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1C1838' },
  spark: { position: 'absolute', fontFamily: fonts.uiExtraBold },
  body: { flex: 1, justifyContent: 'center', paddingHorizontal: 26 },
  hed: {
    fontFamily: fonts.uiExtraBold,
    fontSize: 21,
    lineHeight: 29,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 20,
  },
  cardShadow: {
    borderRadius: 24,
    shadowColor: colors.gold,
    shadowOpacity: 0.24,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 16 },
    elevation: 14,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(240,205,121,0.3)',
    paddingHorizontal: 24,
    paddingTop: 26,
    paddingBottom: 22,
    alignItems: 'center',
    overflow: 'hidden',
  },
  // Thin gold sheen along the very top edge — a "foil" catch-light.
  cardHairline: {
    position: 'absolute',
    top: 0,
    left: 28,
    right: 28,
    height: 1,
    backgroundColor: 'rgba(240,205,121,0.55)',
  },
  sealRing: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: 'rgba(240,205,121,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(240,205,121,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  selfReport: {
    fontFamily: fonts.uiExtraBold,
    fontSize: 10,
    letterSpacing: 2,
    color: 'rgba(240,205,121,0.72)',
    marginVertical: 6,
  },
  milestoneTitle: {
    fontFamily: fonts.serifItalic,
    fontSize: 27,
    color: '#F5EFE0',
    textAlign: 'center',
    marginTop: 8,
  },
  footerStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(240,205,121,0.16)',
    alignSelf: 'stretch',
  },
  stat: { alignItems: 'center' },
  statValue: { fontFamily: fonts.uiBlack, fontSize: 15, color: colors.textPrimary },
  statLabel: {
    fontFamily: fonts.uiExtraBold,
    fontSize: 9,
    letterSpacing: 0.8,
    color: 'rgba(240,205,121,0.55)',
    marginTop: 5,
  },
  divider: { width: 1, backgroundColor: 'rgba(240,205,121,0.16)' },
  wordmark: {
    fontFamily: fonts.uiExtraBold,
    fontSize: 9,
    letterSpacing: 1.4,
    color: 'rgba(240,205,121,0.42)',
    marginTop: 14,
  },
  actions: { paddingHorizontal: 26, gap: 12 },
  shareBtn: {
    height: 52,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 4,
    borderBottomColor: colors.goldDeep,
  },
  shareText: { fontFamily: fonts.uiExtraBold, fontSize: 15, color: '#3A2A0C' },
  keepBtn: { height: 48, alignItems: 'center', justifyContent: 'center' },
  keepText: { fontFamily: fonts.uiExtraBold, fontSize: 13, color: colors.textSecondary },
});
