import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useSQLiteContext } from 'expo-sqlite';
import { ConnectRevenueCat } from '@/components/ConnectRevenueCat';
import { HexSeal } from '@/components/ui/HexSeal';
import { CHAPTERS_BY_ID } from '@/content/questline';
import { ob } from '@/content/onboarding';
import { useRevenueData } from '@/hooks/useRevenueData';
import {
  chapterMet,
  formatMetric,
  markChapterVerified,
  metricLabel,
  metricValue,
} from '@/logic/verification';
import { proLocked } from '@/config/pro';
import { useStore } from '@/store/useStore';
import { colors, fonts } from '@/theme/tokens';

/**
 * Verify a money chapter against live RevenueCat metrics (SPEC §4, V1). If the
 * founder hasn't connected, show the connect panel; once connected, compare the
 * live metric to the threshold and gold-verify when it's met — real data, no
 * simulation.
 */
export default function VerifyChapter() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const db = useSQLiteContext();
  const chapter = id ? CHAPTERS_BY_ID[id] : undefined;
  const { connected, overview, loading, error, refresh } = useRevenueData();
  const isPro = useStore(s => s.isPro);
  const [busy, setBusy] = useState(false);
  const [shortfall, setShortfall] = useState(false);

  const verify = chapter?.verify;

  async function onVerify() {
    if (!chapter || !verify || !id) return;
    // Gold verification is the Pro payoff (model B) — gate when enabled.
    if (proLocked(isPro)) {
      router.replace('/paywall');
      return;
    }
    setBusy(true);
    setShortfall(false);
    const fresh = (await refresh()) ?? overview; // fresh fetch, else cached
    if (chapterMet(fresh, chapter)) {
      await markChapterVerified(db, id, 'revenuecat', {
        metric: verify.metric,
        value: metricValue(fresh, verify.metric),
      });
      router.replace(`/milestone/${id}`);
    } else {
      setShortfall(true);
    }
    setBusy(false);
  }

  return (
    <View style={styles.root}>
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="vDark" cx="50%" cy="20%" r="95%">
            <Stop offset="0%" stopColor={ob.darkRadial[0]} />
            <Stop offset="60%" stopColor={ob.darkRadial[1]} />
            <Stop offset="100%" stopColor={ob.darkRadial[2]} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#vDark)" />
      </Svg>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 24, paddingBottom: Math.max(insets.bottom, 28) },
        ]}
      >
        <Pressable onPress={() => router.back()} style={styles.closeRow}>
          <Text style={styles.close}>✕</Text>
        </Pressable>

        {!connected ? (
          // Not connected yet — reuse the connect panel; after connecting we
          // stay here so they can verify.
          <ConnectRevenueCat onConnected={refresh} onSkip={() => router.back()} />
        ) : !chapter || !verify ? (
          <Text style={styles.info}>This milestone isn’t revenue-verifiable.</Text>
        ) : (
          <View>
            <View style={styles.sealWrap}>
              <HexSeal label={verify.seal} size={66} />
            </View>
            <Text style={styles.hed}>Verify {chapter.title}</Text>
            <Text style={styles.sub}>
              Pulled from your RevenueCat {metricLabel(verify.metric)} — un-fakeable.
            </Text>

            <View style={styles.gauge}>
              <View style={styles.gaugeRow}>
                <Text style={styles.gaugeNow}>
                  {formatMetric(verify.metric, metricValue(overview, verify.metric))}
                </Text>
                <Text style={styles.gaugeTarget}>
                  / {formatMetric(verify.metric, verify.threshold)}
                </Text>
              </View>
              <View style={styles.track}>
                <LinearGradient
                  colors={[colors.gold, colors.goldMid]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    styles.fill,
                    {
                      width: `${Math.min(
                        100,
                        Math.max(
                          3,
                          (metricValue(overview, verify.metric) / verify.threshold) * 100
                        )
                      )}%`,
                    },
                  ]}
                />
              </View>
              <Text style={styles.gaugeLabel}>{metricLabel(verify.metric)}</Text>
            </View>

            {shortfall ? (
              <Text style={styles.shortfall}>
                Not there yet — keep going and check back. This verifies the moment your
                {' '}{metricLabel(verify.metric)} crosses {formatMetric(verify.metric, verify.threshold)}.
              </Text>
            ) : null}
            {error ? <Text style={styles.shortfall}>{error}</Text> : null}

            <Pressable onPress={onVerify} disabled={busy || loading}>
              <LinearGradient
                colors={[colors.gold, colors.goldMid]}
                style={[styles.cta, (busy || loading) && styles.ctaDisabled]}
              >
                <Text style={styles.ctaText}>{busy || loading ? 'Checking RevenueCat…' : 'Verify from RevenueCat'}</Text>
              </LinearGradient>
            </Pressable>
            <Pressable onPress={() => router.back()} style={styles.later}>
              <Text style={styles.laterText}>Later — keep it self-reported</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const light = '#FBFAF6';

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#122730' },
  content: { paddingHorizontal: 26, flexGrow: 1 },
  closeRow: { alignSelf: 'flex-end', padding: 6 },
  close: { fontFamily: fonts.uiExtraBold, fontSize: 18, color: 'rgba(251,250,246,0.6)' },
  info: { fontFamily: fonts.uiBold, fontSize: 14, color: light, textAlign: 'center', marginTop: 40 },
  sealWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(251,250,246,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  hed: { fontFamily: fonts.uiExtraBold, fontSize: 23, lineHeight: 29, color: light, textAlign: 'center' },
  sub: {
    fontFamily: fonts.uiBold,
    fontSize: 13,
    lineHeight: 20,
    color: 'rgba(251,250,246,0.65)',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 22,
  },
  gauge: {
    backgroundColor: 'rgba(251,250,246,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(251,250,246,0.12)',
    borderRadius: 16,
    padding: 16,
  },
  gaugeRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 6 },
  gaugeNow: { fontFamily: fonts.uiBlack, fontSize: 28, color: colors.gold },
  gaugeTarget: { fontFamily: fonts.uiExtraBold, fontSize: 16, color: 'rgba(251,250,246,0.5)' },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.35)',
    overflow: 'hidden',
    marginTop: 12,
  },
  fill: { height: '100%', borderRadius: 4 },
  gaugeLabel: {
    fontFamily: fonts.uiBold,
    fontSize: 11,
    color: 'rgba(251,250,246,0.5)',
    textAlign: 'center',
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  shortfall: {
    fontFamily: fonts.uiBold,
    fontSize: 12,
    lineHeight: 17,
    color: 'rgba(251,250,246,0.7)',
    textAlign: 'center',
    marginTop: 16,
  },
  cta: {
    height: 54,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    borderBottomWidth: 4,
    borderBottomColor: colors.goldDeep,
  },
  ctaDisabled: { opacity: 0.5 },
  ctaText: { fontFamily: fonts.uiExtraBold, fontSize: 15, color: '#3A2A0C' },
  later: { height: 48, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  laterText: { fontFamily: fonts.uiExtraBold, fontSize: 13, color: 'rgba(251,250,246,0.65)' },
});
