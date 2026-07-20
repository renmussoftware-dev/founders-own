import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArcaneBackground } from '@/components/ui/ArcaneBackground';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { StatRow } from '@/components/ui/StatRow';
import { colors, fonts } from '@/theme/tokens';

/**
 * Today / quest board (SPEC §11b #1).
 * Phase 0 shell — quest cards, completion ring, and celebration state land in Phase 1.
 */
export default function TodayScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ArcaneBackground>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}>
        <View style={styles.topBar}>
          <View style={styles.avatar}>
            <Text style={styles.avatarInitial}>F</Text>
          </View>
          <View style={styles.counters}>
            <Text style={styles.counter}>◆ 0</Text>
            <Text style={styles.counter}>🔥 0</Text>
          </View>
        </View>

        <Text style={styles.heading}>Complete today&apos;s quests</Text>
        <Text style={styles.subheading}>0 of 3 done</Text>

        <SurfaceCard style={styles.card}>
          <Text style={styles.cardTitle}>Daily quests arrive in Phase 1</Text>
          <Text style={styles.cardBody}>
            The quest engine picks three quests a day — one for your weakest stat, one
            pulling toward the current chapter, one habit.
          </Text>
        </SurfaceCard>

        <SurfaceCard style={styles.card}>
          <StatRow stat="revenue" level={1} xp={0} />
        </SurfaceCard>
      </ScrollView>
    </ArcaneBackground>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 14, paddingBottom: 40 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surfaceBottom,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: fonts.uiBlack,
    fontSize: 16,
    color: colors.textPrimary,
  },
  counters: { flexDirection: 'row', gap: 14 },
  counter: {
    fontFamily: fonts.uiExtraBold,
    fontSize: 14,
    color: colors.textPrimary,
  },
  heading: {
    fontFamily: fonts.uiBlack,
    fontSize: 24,
    color: colors.textPrimary,
    marginTop: 10,
  },
  subheading: {
    fontFamily: fonts.uiBold,
    fontSize: 13,
    color: colors.textSecondary,
  },
  card: { marginTop: 4 },
  cardTitle: {
    fontFamily: fonts.uiExtraBold,
    fontSize: 15,
    color: colors.textPrimary,
    marginBottom: 6,
  },
  cardBody: {
    fontFamily: fonts.uiSemiBold,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },
});
