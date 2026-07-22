import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { type BenchmarkSet } from '@/integrations/revenuecat';
import { colors, fonts } from '@/theme/tokens';

/**
 * "How you compare" — RevenueCat peer benchmarks (SPEC V2, the "am I normal?"
 * card). Each metric's percentile already accounts for direction (a high
 * percentile is good even for churn), so we render one 0–100 bar per metric.
 * Pro feature; rendered only when benchmark data is present.
 */

function tier(p: number): { label: string; color: string } {
  if (p >= 70) return { label: 'Ahead of peers', color: colors.mintBright };
  if (p >= 40) return { label: 'Around average', color: colors.gold };
  return { label: 'Behind peers', color: '#E8836B' };
}

export function BenchmarksCard({ set }: { set: BenchmarkSet }) {
  const rows = set.benchmarks
    .filter(b => b.eligible && b.percentile !== null)
    .slice(0, 5);
  if (rows.length === 0) return null;

  const category = set.benchmarks.find(b => b.category)?.category;

  return (
    <LinearGradient colors={[colors.surfaceTop, colors.surfaceBottom]} style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.label}>HOW YOU COMPARE</Text>
        {category ? <Text style={styles.category}>vs {category} apps</Text> : null}
      </View>
      {rows.map(b => {
        const p = b.percentile as number;
        const t = tier(p);
        return (
          <View key={b.metric} style={styles.row}>
            <View style={styles.rowTop}>
              <Text style={styles.metric}>{b.label}</Text>
              <Text style={[styles.tier, { color: t.color }]}>{t.label}</Text>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${Math.max(3, Math.min(100, p))}%`, backgroundColor: t.color }]} />
            </View>
            <Text style={styles.pct}>{Math.round(p)}th percentile</Text>
          </View>
        );
      })}
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
  header: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  label: {
    fontFamily: fonts.uiExtraBold,
    fontSize: 11,
    letterSpacing: 0.5,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  category: { fontFamily: fonts.uiBold, fontSize: 10.5, color: colors.textFaint },
  row: { marginTop: 14 },
  rowTop: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  metric: { fontFamily: fonts.uiExtraBold, fontSize: 13, color: colors.textPrimary },
  tier: { fontFamily: fonts.uiExtraBold, fontSize: 11 },
  track: {
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.35)',
    overflow: 'hidden',
    marginTop: 7,
  },
  fill: { height: '100%', borderRadius: 4 },
  pct: { fontFamily: fonts.uiBold, fontSize: 10, color: colors.textFaint, marginTop: 5 },
});
