import { Platform, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { type FounderCardData } from '@/logic/founderCard';
import { fonts } from '@/theme/tokens';

const mono = Platform.select({ ios: 'Menlo', default: 'monospace' });

/**
 * The cream shareable founder card (design 1c / §10). Deliberately breaks the
 * dark theme — a light artifact that pops in a feed. Newsreader serif title,
 * gold seal, monospace stat footer, wordmark, tagline.
 *
 * `story` renders the 9:16 export variant (taller padding, larger type).
 */
export function FounderCard({ data, story }: { data: FounderCardData; story?: boolean }) {
  return (
    <View style={[styles.card, story && styles.cardStory]}>
      <LinearGradient colors={['#E0BE72', '#9A7430']} style={styles.seal}>
        <Text style={styles.sealText}>{data.sealLabel}</Text>
      </LinearGradient>
      <Text style={styles.verified}>
        {data.verified ? 'Verified · RevenueCat' : 'Self-reported'}
      </Text>
      <Text style={[styles.title, story && styles.titleStory]}>{data.milestoneTitle}</Text>
      <Text style={styles.subtitle}>
        {data.businessName} · {data.daysIn} days in
      </Text>

      <View style={styles.statRow}>
        <Stat value={`Lv ${data.level}`} label="Founder" />
        <View style={styles.statDivider} />
        <Stat value={String(data.streak)} label="Day streak" />
        <View style={styles.statDivider} />
        <Stat value={String(data.questsDone)} label="Quests done" />
      </View>

      <Text style={styles.wordmark}>FOUNDERS OWN · {data.monthYear}</Text>
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
  card: {
    backgroundColor: '#FAF9F5',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 26,
    paddingBottom: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 24 },
    elevation: 12,
  },
  cardStory: {
    paddingVertical: 54,
    borderRadius: 24,
  },
  seal: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  sealText: {
    fontFamily: fonts.uiExtraBold,
    fontSize: 17,
    color: '#FFFDF5',
  },
  verified: {
    fontFamily: mono,
    fontSize: 10,
    letterSpacing: 2,
    color: '#8A6A2A',
    marginBottom: 10,
  },
  title: {
    fontFamily: fonts.serifItalic,
    fontSize: 28,
    lineHeight: 33,
    color: '#1D1A15',
    textAlign: 'center',
  },
  titleStory: { fontSize: 36, lineHeight: 42 },
  subtitle: {
    fontFamily: fonts.serifItalic,
    fontSize: 14,
    color: 'rgba(29,26,21,0.5)',
    marginTop: 8,
    textAlign: 'center',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
    marginTop: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(29,26,21,0.08)',
    alignSelf: 'stretch',
  },
  stat: { alignItems: 'center' },
  statValue: { fontFamily: mono, fontSize: 15, color: '#1D1A15' },
  statLabel: {
    fontFamily: fonts.uiBold,
    fontSize: 9,
    letterSpacing: 1,
    color: 'rgba(29,26,21,0.4)',
    marginTop: 5,
  },
  statDivider: { width: 1, backgroundColor: 'rgba(29,26,21,0.08)' },
  wordmark: {
    fontFamily: mono,
    fontSize: 9,
    letterSpacing: 1.5,
    color: 'rgba(29,26,21,0.3)',
    marginTop: 16,
  },
});
