import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSQLiteContext } from 'expo-sqlite';
import Animated from 'react-native-reanimated';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { HexSeal } from '@/components/ui/HexSeal';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { buildFounderCardData, type FounderCardData } from '@/logic/founderCard';
import { usePopIn, useTwinkle } from '@/theme/motion';
import { useStore } from '@/store/useStore';
import { colors, fonts } from '@/theme/tokens';

/** Verified-milestone celebration takeover (design 7e). Fires on chapter completion. */
export default function MilestoneCelebration() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const db = useSQLiteContext();
  const character = useStore(s => s.character);
  const [data, setData] = useState<FounderCardData | null>(null);

  const cardPop = usePopIn(120);
  const t1 = useTwinkle(0);
  const t2 = useTwinkle(700);
  const t3 = useTwinkle(1300);
  const t4 = useTwinkle(400);

  useEffect(() => {
    if (id && character) buildFounderCardData(db, character, id).then(setData);
  }, [db, id, character]);

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

        <Animated.View style={[styles.card, cardPop]}>
          <View style={styles.sealRing}>
            <HexSeal label={data.sealLabel} size={64} />
          </View>
          {data.verified ? (
            <VerifiedBadge label="VERIFIED · STRIPE" />
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
        </Animated.View>
      </View>

      <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, 32) }]}>
        <Pressable onPress={() => router.replace(`/founder-card/${id}`)}>
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
  card: {
    backgroundColor: '#FAF9F5',
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 20,
    alignItems: 'center',
  },
  sealRing: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: '#F5EDD6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  selfReport: {
    fontFamily: fonts.uiExtraBold,
    fontSize: 10,
    letterSpacing: 2,
    color: '#8A6A2A',
    marginVertical: 6,
  },
  milestoneTitle: {
    fontFamily: fonts.serifItalic,
    fontSize: 26,
    color: '#2A2450',
    textAlign: 'center',
    marginTop: 6,
  },
  footerStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(42,36,80,0.1)',
    alignSelf: 'stretch',
  },
  stat: { alignItems: 'center' },
  statValue: { fontFamily: fonts.uiBlack, fontSize: 15, color: '#2A2450' },
  statLabel: {
    fontFamily: fonts.uiExtraBold,
    fontSize: 9,
    letterSpacing: 0.8,
    color: 'rgba(42,36,80,0.45)',
    marginTop: 5,
  },
  divider: { width: 1, backgroundColor: 'rgba(42,36,80,0.1)' },
  wordmark: {
    fontFamily: fonts.uiExtraBold,
    fontSize: 9,
    letterSpacing: 1.4,
    color: 'rgba(42,36,80,0.35)',
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
