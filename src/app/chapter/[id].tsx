import { useCallback, useState } from 'react';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSQLiteContext } from 'expo-sqlite';
import { ArcaneBackground } from '@/components/ui/ArcaneBackground';
import { CHAPTERS_BY_ID } from '@/content/questline';
import { isPaywallBoundary } from '@/content/questline';
import {
  getProgress,
  parseFlags,
  toggleObjective,
  unlockNext,
  type ChapterProgressRow,
} from '@/db/chapters';
import { writeMilestoneEntry } from '@/logic/journal';
import { useStore } from '@/store/useStore';
import { colors, fonts } from '@/theme/tokens';

/** Chapter detail — self-report objective completion (SPEC §4, Act 1 flow). */
export default function ChapterDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const db = useSQLiteContext();
  const isPro = useStore(s => s.isPro);
  const chapter = id ? CHAPTERS_BY_ID[id] : undefined;
  const [progress, setProgress] = useState<ChapterProgressRow | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (id) getProgress(db, id).then(setProgress);
    }, [db, id])
  );

  if (!chapter) {
    return (
      <ArcaneBackground>
        <View style={styles.center}>
          <Text style={styles.missing}>Chapter not found.</Text>
        </View>
      </ArcaneBackground>
    );
  }

  const flags = progress ? parseFlags(progress) : {};
  const complete = progress?.status === 'done' || progress?.status === 'verified';

  async function onToggle(objectiveId: string) {
    if (!id) return;
    const { justCompleted } = await toggleObjective(db, id, objectiveId);
    setProgress(await getProgress(db, id));

    if (justCompleted && chapter) {
      await writeMilestoneEntry(db, chapter.title);
      // Paywall lands at the Act 1→2 boundary (SPEC §9) for non-pro founders.
      if (isPaywallBoundary(chapter.id) && !isPro) {
        router.replace('/paywall');
        return;
      }
      await unlockNext(db, id);
      router.replace(`/milestone/${id}`);
    }
  }

  return (
    <ArcaneBackground>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 18 }]}>
        <Pressable onPress={() => router.back()} style={styles.closeRow}>
          <Text style={styles.close}>✕ Close</Text>
        </Pressable>

        {chapter.money ? <Text style={styles.gateLabel}>GOLD MILESTONE</Text> : null}
        <Text style={styles.title}>{chapter.title}</Text>
        <Text style={styles.tagline}>&ldquo;{chapter.tagline}&rdquo;</Text>

        <View style={styles.list}>
          {chapter.objectives.map((obj, i) => {
            const checked = !!flags[obj.id];
            return (
              <Pressable key={obj.id} onPress={() => onToggle(obj.id)} style={styles.item}>
                {checked ? (
                  <LinearGradient colors={[colors.mintBright, colors.mint]} style={styles.checkbox}>
                    <Text style={styles.checkMark}>✓</Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.checkboxEmpty}>
                    <Text style={styles.stepNum}>{i + 1}</Text>
                  </View>
                )}
                <Text style={[styles.itemLabel, checked && styles.itemLabelDone]}>{obj.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {chapter.money && progress?.status !== 'verified' ? (
          <Pressable onPress={() => router.push(`/verify/${chapter.id}`)} style={styles.verifyBanner}>
            <View style={styles.verifyIcon}>
              <Text style={styles.verifyIconText}>$</Text>
            </View>
            <View style={styles.verifyBody}>
              <Text style={styles.verifyTitle}>Verify this from real revenue</Text>
              <Text style={styles.verifySub}>Gold tier · read-only RevenueCat</Text>
            </View>
            <Text style={styles.verifyChevron}>›</Text>
          </Pressable>
        ) : null}

        {complete ? (
          <Text style={styles.completeNote}>Chapter complete — nicely done.</Text>
        ) : (
          <Text style={styles.hint}>
            Check each step as you finish it. The last one completes the chapter.
          </Text>
        )}
      </ScrollView>
    </ArcaneBackground>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 22, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  missing: { fontFamily: fonts.uiBold, color: colors.textSecondary },
  closeRow: { alignSelf: 'flex-end', paddingVertical: 6 },
  close: { fontFamily: fonts.uiExtraBold, fontSize: 13, color: colors.textSecondary },
  gateLabel: {
    fontFamily: fonts.uiExtraBold,
    fontSize: 10,
    letterSpacing: 2,
    color: colors.gold,
    marginTop: 8,
  },
  title: {
    fontFamily: fonts.uiExtraBold,
    fontSize: 26,
    color: colors.textPrimary,
    marginTop: 6,
  },
  tagline: {
    fontFamily: fonts.uiBold,
    fontSize: 13,
    fontStyle: 'italic',
    color: colors.textSecondary,
    marginTop: 8,
    marginBottom: 22,
  },
  list: { gap: 11 },
  item: {
    backgroundColor: colors.surfaceBottom,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 16,
    paddingHorizontal: 15,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  checkbox: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: { fontFamily: fonts.uiBlack, fontSize: 15, color: '#0E2418' },
  checkboxEmpty: {
    width: 30,
    height: 30,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(237,234,251,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNum: { fontFamily: fonts.uiExtraBold, fontSize: 13, color: colors.textFaint },
  itemLabel: {
    flex: 1,
    fontFamily: fonts.uiExtraBold,
    fontSize: 14,
    lineHeight: 19,
    color: colors.textPrimary,
  },
  itemLabelDone: {
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
    textDecorationColor: 'rgba(237,234,251,0.3)',
  },
  hint: {
    fontFamily: fonts.uiBold,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textFaint,
    marginTop: 18,
    textAlign: 'center',
  },
  completeNote: {
    fontFamily: fonts.uiExtraBold,
    fontSize: 13,
    color: colors.mintBright,
    marginTop: 18,
    textAlign: 'center',
  },
  verifyBanner: {
    marginTop: 20,
    backgroundColor: 'rgba(240,205,121,0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(223,195,131,0.5)',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  verifyIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.goldMid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyIconText: { fontFamily: fonts.uiBlack, fontSize: 16, color: '#FFFDF5' },
  verifyBody: { flex: 1 },
  verifyTitle: { fontFamily: fonts.uiExtraBold, fontSize: 13.5, color: colors.textPrimary },
  verifySub: { fontFamily: fonts.uiBold, fontSize: 11, color: colors.gold, marginTop: 2 },
  verifyChevron: { fontFamily: fonts.uiExtraBold, fontSize: 18, color: colors.gold },
});
