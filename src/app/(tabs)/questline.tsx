import { ScrollView, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArcaneBackground } from '@/components/ui/ArcaneBackground';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { colors, fonts } from '@/theme/tokens';

/**
 * Questline map (SPEC §11b #3).
 * Phase 0 shell — the vertical spine with node states lands in Phase 2.
 */
export default function QuestlineScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ArcaneBackground>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.actHeader}>Act I — Proof it works</Text>
        <SurfaceCard>
          <Text style={styles.body}>
            The questline map arrives in Phase 2: a vertical spine of chapters with
            done, verified (gold hexagon), active, locked, and gold-gate node states.
          </Text>
        </SurfaceCard>
        <Text style={styles.footer}>Act II unlocks at Chapter 5 · 3 acts authored</Text>
      </ScrollView>
    </ArcaneBackground>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 14, paddingBottom: 40 },
  actHeader: {
    fontFamily: fonts.uiBlack,
    fontSize: 22,
    color: colors.textPrimary,
  },
  body: {
    fontFamily: fonts.uiSemiBold,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  footer: {
    fontFamily: fonts.uiBold,
    fontSize: 12,
    color: colors.textFaint,
    textAlign: 'center',
    marginTop: 8,
  },
});
