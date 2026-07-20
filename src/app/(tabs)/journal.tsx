import { ScrollView, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArcaneBackground } from '@/components/ui/ArcaneBackground';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { colors, fonts } from '@/theme/tokens';

/**
 * Journal (SPEC §11b #4).
 * Phase 0 shell — streak calendar + auto-written entries land in Phase 2.
 */
export default function JournalScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ArcaneBackground>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.heading}>Journal</Text>
        <SurfaceCard>
          <Text style={styles.prose}>
            Every day of your business gets written down here — auto-assembled from the
            quests you complete, in this serif voice.
          </Text>
        </SurfaceCard>
        <Text style={styles.footer}>Day 1. Every day is written down.</Text>
      </ScrollView>
    </ArcaneBackground>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 14, paddingBottom: 40 },
  heading: {
    fontFamily: fonts.uiBlack,
    fontSize: 24,
    color: colors.textPrimary,
  },
  prose: {
    fontFamily: fonts.serifItalic,
    fontSize: 16,
    lineHeight: 24,
    color: colors.textPrimary,
  },
  footer: {
    fontFamily: fonts.uiBold,
    fontSize: 12,
    color: colors.textFaint,
    textAlign: 'center',
    marginTop: 8,
  },
});
