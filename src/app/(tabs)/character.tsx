import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArcaneBackground } from '@/components/ui/ArcaneBackground';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { StatRow } from '@/components/ui/StatRow';
import { HexSeal } from '@/components/ui/HexSeal';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { colors, fonts, statOrder } from '@/theme/tokens';

/**
 * Character sheet (SPEC §11b #2).
 * Phase 0 shell — real character data + Stats/Milestones/Journal tabs land in Phase 1.
 */
export default function CharacterScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ArcaneBackground>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}>
        <View style={styles.hero}>
          <View style={styles.avatar}>
            <Text style={styles.avatarInitial}>F</Text>
          </View>
          <Text style={styles.name}>Your Business</Text>
          <Text style={styles.rank}>Level 1 · Apprentice Founder</Text>
        </View>

        <SurfaceCard>
          {statOrder.map(stat => (
            <StatRow key={stat} stat={stat} level={1} xp={0} />
          ))}
        </SurfaceCard>

        <SurfaceCard style={styles.milestoneCard}>
          <View style={styles.milestoneRow}>
            <HexSeal label="$1K" size={56} />
            <View style={styles.milestoneBody}>
              <VerifiedBadge label="VERIFIED · STRIPE" />
              <Text style={styles.milestoneTitle}>Latest milestone appears here</Text>
            </View>
          </View>
        </SurfaceCard>
      </ScrollView>
    </ArcaneBackground>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 14, paddingBottom: 40 },
  hero: { alignItems: 'center', gap: 6, marginBottom: 6 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: colors.violet,
    backgroundColor: colors.surfaceBottom,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: fonts.uiBlack,
    fontSize: 28,
    color: colors.textPrimary,
  },
  name: {
    fontFamily: fonts.uiBlack,
    fontSize: 20,
    color: colors.textPrimary,
  },
  rank: {
    fontFamily: fonts.uiBold,
    fontSize: 13,
    color: colors.textSecondary,
  },
  milestoneCard: { marginTop: 2 },
  milestoneRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  milestoneBody: { flex: 1, gap: 8 },
  milestoneTitle: {
    fontFamily: fonts.serifItalic,
    fontSize: 15,
    color: colors.textPrimary,
  },
});
