import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { RevenueSparkline } from '@/components/RevenueSparkline';
import { type MetricSnapshot } from '@/db/metrics';
import { type RcOverview } from '@/integrations/revenuecat';
import { formatMetric, metricLabel, type NextMilestone } from '@/logic/verification';
import { colors, fonts } from '@/theme/tokens';

/**
 * Live revenue dashboard on the Today board (SPEC value item #1). Turns the
 * daily open into "did my number move" instead of "did I tap 3 things."
 * Shows a Connect prompt until RevenueCat is linked.
 */
export function RevenueDashboard({
  connected,
  projectName,
  overview,
  loading,
  snapshots,
  next,
  onConnect,
  onVerifyNext,
}: {
  connected: boolean;
  projectName: string | null;
  overview: RcOverview | null;
  loading: boolean;
  snapshots: MetricSnapshot[];
  next: NextMilestone | null;
  onConnect: () => void;
  onVerifyNext: (chapterId: string) => void;
}) {
  if (!connected) {
    return (
      <Pressable onPress={onConnect}>
        <LinearGradient
          colors={['rgba(240,205,121,0.16)', 'rgba(200,148,65,0.06)']}
          style={[styles.card, styles.connectCard]}
        >
          <View style={styles.connectIcon}>
            <Text style={styles.connectIconText}>◆</Text>
          </View>
          <View style={styles.connectBody}>
            <Text style={styles.connectTitle}>Connect RevenueCat</Text>
            <Text style={styles.connectSub}>See your live MRR and verify milestones from real revenue.</Text>
          </View>
          <Text style={styles.connectChevron}>›</Text>
        </LinearGradient>
      </Pressable>
    );
  }

  const mrr = overview?.metrics.mrr ?? 0;
  const revenue = overview?.metrics.revenue ?? 0;
  const subs = overview?.metrics.active_subscriptions ?? 0;
  const series = snapshots.map(s => s.mrr);

  return (
    <LinearGradient colors={[colors.surfaceTop, colors.surfaceBottom]} style={styles.card}>
      <View style={styles.header}>
        <View style={styles.liveDot} />
        <Text style={styles.headerText}>{projectName ?? 'Your app'} · live</Text>
        {loading ? <Text style={styles.refreshing}>refreshing…</Text> : null}
      </View>

      <View style={styles.mrrRow}>
        <View>
          <Text style={styles.mrrValue}>${Math.round(mrr).toLocaleString()}</Text>
          <Text style={styles.mrrLabel}>MRR</Text>
        </View>
        <View style={styles.secondary}>
          <View style={styles.secondaryItem}>
            <Text style={styles.secondaryValue}>${Math.round(revenue).toLocaleString()}</Text>
            <Text style={styles.secondaryLabel}>REV · 28D</Text>
          </View>
          <View style={styles.secondaryItem}>
            <Text style={styles.secondaryValue}>{subs.toLocaleString()}</Text>
            <Text style={styles.secondaryLabel}>SUBS</Text>
          </View>
        </View>
      </View>

      {series.length >= 2 ? (
        <View style={styles.spark}>
          <RevenueSparkline data={series} width={320} height={44} />
        </View>
      ) : (
        <Text style={styles.building}>Your MRR chart builds as you check in each day.</Text>
      )}

      {next?.chapter.verify ? (
        next.pct >= 1 ? (
          // Already met — invite them to claim the gold verified milestone.
          <Pressable onPress={() => onVerifyNext(next.chapter.id)} style={styles.next}>
            <View style={styles.nextHeader}>
              <Text style={styles.readyLabel}>READY TO VERIFY</Text>
              <Text style={styles.nextTitle}>{next.chapter.title}</Text>
            </View>
            <View style={styles.readyRow}>
              <Text style={styles.readyText}>
                You’ve hit {formatMetric(next.chapter.verify.metric, next.current)}{' '}
                {metricLabel(next.chapter.verify.metric)} — claim it in gold
              </Text>
              <Text style={styles.readyChevron}>›</Text>
            </View>
          </Pressable>
        ) : (
          <View style={styles.next}>
            <View style={styles.nextHeader}>
              <Text style={styles.nextLabel}>NEXT MILESTONE</Text>
              <Text style={styles.nextTitle}>{next.chapter.title}</Text>
            </View>
            <View style={styles.nextTrack}>
              <LinearGradient
                colors={[colors.gold, colors.goldMid]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.nextFill, { width: `${Math.max(3, next.pct * 100)}%` }]}
              />
            </View>
            <Text style={styles.nextProgress}>
              {formatMetric(next.chapter.verify.metric, next.current)} /{' '}
              {formatMetric(next.chapter.verify.metric, next.chapter.verify.threshold)}{' '}
              {metricLabel(next.chapter.verify.metric)}
            </Text>
          </View>
        )
      ) : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    padding: 16,
  },
  connectCard: {
    borderColor: 'rgba(223,195,131,0.4)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  connectIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: colors.goldMid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectIconText: { fontFamily: fonts.uiBlack, fontSize: 16, color: '#2A1F0C' },
  connectBody: { flex: 1 },
  connectTitle: { fontFamily: fonts.uiExtraBold, fontSize: 15, color: colors.textPrimary },
  connectSub: { fontFamily: fonts.uiBold, fontSize: 11.5, lineHeight: 16, color: colors.textSecondary, marginTop: 2 },
  connectChevron: { fontFamily: fonts.uiExtraBold, fontSize: 18, color: colors.gold },

  header: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.mintBright },
  headerText: { fontFamily: fonts.uiExtraBold, fontSize: 11, letterSpacing: 0.5, color: colors.textSecondary, textTransform: 'uppercase' },
  refreshing: { fontFamily: fonts.uiBold, fontSize: 10, color: colors.textFaint, marginLeft: 'auto' },

  mrrRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 10 },
  mrrValue: { fontFamily: fonts.uiBlack, fontSize: 34, color: colors.gold },
  mrrLabel: { fontFamily: fonts.uiExtraBold, fontSize: 11, letterSpacing: 1, color: colors.textFaint, marginTop: 2 },
  secondary: { flexDirection: 'row', gap: 18, paddingBottom: 4 },
  secondaryItem: { alignItems: 'flex-end' },
  secondaryValue: { fontFamily: fonts.uiExtraBold, fontSize: 15, color: colors.textPrimary },
  secondaryLabel: { fontFamily: fonts.uiBold, fontSize: 9, letterSpacing: 0.8, color: colors.textFaint, marginTop: 3 },

  spark: { marginTop: 12, marginHorizontal: -2 },
  building: { fontFamily: fonts.uiBold, fontSize: 11.5, color: colors.textFaint, marginTop: 12 },

  next: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.surfaceBorder },
  nextHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  nextLabel: { fontFamily: fonts.uiBold, fontSize: 9, letterSpacing: 1, color: colors.textFaint },
  nextTitle: { fontFamily: fonts.uiExtraBold, fontSize: 12.5, color: colors.textPrimary },
  nextTrack: { height: 7, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.35)', overflow: 'hidden', marginTop: 8 },
  nextFill: { height: '100%', borderRadius: 4 },
  nextProgress: { fontFamily: fonts.uiExtraBold, fontSize: 11, color: colors.gold, marginTop: 7 },
  readyLabel: { fontFamily: fonts.uiBold, fontSize: 9, letterSpacing: 1, color: colors.mintBright },
  readyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  readyText: { flex: 1, fontFamily: fonts.uiExtraBold, fontSize: 11.5, lineHeight: 16, color: colors.gold },
  readyChevron: { fontFamily: fonts.uiExtraBold, fontSize: 18, color: colors.gold },
});
