import { Platform, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { type WrappedData } from '@/logic/wrapped';
import { fonts, stats } from '@/theme/tokens';

const mono = Platform.select({ ios: 'Menlo', default: 'monospace' });

/**
 * "Founder Wrapped" recap card (SPEC #3). Cream, shareable — the whole journey
 * on one card. Pairs the founder-card look with a stat grid.
 */
export function WrappedCard({ data }: { data: WrappedData }) {
  const cells: { value: string; label: string }[] = [
    { value: data.questsDone.toLocaleString(), label: 'Quests done' },
    { value: String(data.perfectDays), label: 'Perfect days' },
    { value: String(data.streak), label: 'Day streak' },
    { value: String(data.milestones), label: 'Milestones' },
    { value: String(data.verifiedMilestones), label: 'Verified' },
    { value: `Lv ${data.level}`, label: data.rankTitle },
  ];
  if (data.mrr !== undefined) {
    cells.push({ value: `$${Math.round(data.mrr).toLocaleString()}`, label: 'MRR' });
    cells.push({ value: data.topStat.label, label: 'Top stat' });
  } else {
    cells.push({ value: data.topStat.label, label: 'Top stat' });
  }

  return (
    <View style={styles.card}>
      <Text style={styles.kicker}>YOUR STORY SO FAR</Text>
      <Text style={styles.name}>{data.businessName}</Text>
      <Text style={styles.days}>Day {data.daysIn} of building</Text>

      <View style={styles.grid}>
        {cells.map((c, i) => (
          <View key={i} style={styles.cell}>
            <Text style={styles.cellValue}>{c.value}</Text>
            <Text style={styles.cellLabel}>{c.label.toUpperCase()}</Text>
          </View>
        ))}
      </View>

      <LinearGradient
        colors={stats[data.topStat.key].tone.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.accent}
      />
      <Text style={styles.wordmark}>FOUNDERS OWN · {data.monthYear}</Text>
    </View>
  );
}

const ink = '#1D1A15';
const inkSoft = 'rgba(29,26,21,0.5)';
const inkFaint = 'rgba(29,26,21,0.4)';

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FAF9F5',
    borderRadius: 22,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 24 },
    elevation: 12,
  },
  kicker: {
    fontFamily: mono,
    fontSize: 10,
    letterSpacing: 2,
    color: '#8A6A2A',
    textAlign: 'center',
  },
  name: {
    fontFamily: fonts.serifItalic,
    fontSize: 30,
    lineHeight: 34,
    color: ink,
    textAlign: 'center',
    marginTop: 8,
  },
  days: {
    fontFamily: fonts.serifItalic,
    fontSize: 14,
    color: inkSoft,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: '33.33%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  cellValue: { fontFamily: fonts.uiBlack, fontSize: 20, color: ink },
  cellLabel: {
    fontFamily: fonts.uiBold,
    fontSize: 8.5,
    letterSpacing: 0.6,
    color: inkFaint,
    marginTop: 5,
    textAlign: 'center',
  },
  accent: {
    height: 4,
    borderRadius: 2,
    marginTop: 16,
    marginHorizontal: 40,
  },
  wordmark: {
    fontFamily: mono,
    fontSize: 9,
    letterSpacing: 1.5,
    color: 'rgba(29,26,21,0.3)',
    textAlign: 'center',
    marginTop: 14,
  },
});
