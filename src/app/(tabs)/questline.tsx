import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSQLiteContext } from 'expo-sqlite';
import Svg, { Defs, LinearGradient as SvgGrad, Polygon, Stop } from 'react-native-svg';
import { ArcaneBackground } from '@/components/ui/ArcaneBackground';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { ACTS, CHAPTERS_BY_ID, chaptersForAct, type Chapter } from '@/content/questline';
import { getAllProgress, type ChapterProgressRow } from '@/db/chapters';
import { colors, fonts, hexagonPoints } from '@/theme/tokens';

/** Questline map (design 7b). */
export default function QuestlineScreen() {
  const insets = useSafeAreaInsets();
  const db = useSQLiteContext();
  const router = useRouter();
  const [progress, setProgress] = useState<ChapterProgressRow[]>([]);

  useFocusEffect(
    useCallback(() => {
      getAllProgress(db).then(setProgress);
    }, [db])
  );

  const byId = new Map(progress.map(p => [p.chapter_id, p]));
  const activeAct = progress.find(p => p.status === 'active')?.act ?? 1;
  const act = ACTS.find(a => a.number === activeAct) ?? ACTS[0];
  const chapters = chaptersForAct(act.number);

  return (
    <ArcaneBackground>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}>
        <Text style={styles.title}>Questline</Text>
        <Text style={styles.actLabel}>
          {act.name} — {act.subtitle}
        </Text>

        <View style={styles.spine}>
          {chapters.map(ch => {
            const p = byId.get(ch.id);
            return (
              <ChapterNode
                key={ch.id}
                chapter={ch}
                progress={p}
                onPress={() =>
                  p && p.status !== 'locked'
                    ? router.push(`/chapter/${ch.id}`)
                    : undefined
                }
              />
            );
          })}
        </View>

        <Text style={styles.footer}>
          {act.number < ACTS.length
            ? `${ACTS[act.number].name} unlocks when you finish ${act.name} · ${ACTS.length} acts authored`
            : `${ACTS.length} acts authored`}
        </Text>
      </ScrollView>
    </ArcaneBackground>
  );
}

function GoldHex({ size, glyph }: { size: number; glyph: string }) {
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <SvgGrad id="nodeGold" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#F8DD8E" />
            <Stop offset="0.6" stopColor="#C89441" />
            <Stop offset="1" stopColor="#8A6224" />
          </SvgGrad>
        </Defs>
        <Polygon points={hexagonPoints} fill="url(#nodeGold)" />
      </Svg>
      <View style={StyleSheet.absoluteFill}>
        <View style={styles.hexGlyphWrap}>
          <Text style={styles.hexGlyph}>{glyph}</Text>
        </View>
      </View>
    </View>
  );
}

function ChapterNode({
  chapter,
  progress,
  onPress,
}: {
  chapter: Chapter;
  progress?: ChapterProgressRow;
  onPress?: () => void;
}) {
  const status = progress?.status ?? 'locked';
  const done = progress?.objectives_done ?? 0;
  const total = chapter.objectives.length;

  // ---- node marker + card style by state ----
  let marker: React.ReactNode;
  let card: React.ReactNode;

  if (status === 'verified') {
    marker = <GoldHex size={28} glyph="✓" />;
    card = (
      <LinearGradient
        colors={['rgba(240,205,121,0.16)', 'rgba(200,148,65,0.08)']}
        style={[styles.card, styles.goldCard]}
      >
        <View style={styles.cardMain}>
          <Text style={styles.cardTitle}>Ch. {chapter.index} · {chapter.title}</Text>
          <Text style={styles.verifiedSub}>Verified via Stripe</Text>
        </View>
        <VerifiedBadge />
      </LinearGradient>
    );
  } else if (status === 'done') {
    marker = (
      <View style={styles.mintNode}>
        <Text style={styles.mintCheck}>✓</Text>
      </View>
    );
    card = (
      <View style={[styles.card, styles.doneCard]}>
        <Text style={styles.cardTitleMuted}>Ch. {chapter.index} · {chapter.title}</Text>
        <Text style={styles.doneTag}>DONE</Text>
      </View>
    );
  } else if (status === 'active') {
    marker = (
      <View style={styles.activeNode}>
        <Text style={styles.activeNodeText}>{chapter.index}</Text>
      </View>
    );
    card = (
      <LinearGradient colors={[colors.surfaceTop, colors.surfaceBottom]} style={[styles.card, styles.activeCard]}>
        <View style={styles.activeHeader}>
          <Text style={styles.activeTitle}>Ch. {chapter.index} · {chapter.title}</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{done}/{total}</Text>
          </View>
        </View>
        <Text style={styles.tagline}>&ldquo;{chapter.tagline}&rdquo;</Text>
        <View style={styles.track}>
          <LinearGradient
            colors={[colors.violet, colors.violetBright]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.fill, { width: `${Math.max(3, (done / total) * 100)}%` }]}
          />
        </View>
        <View style={styles.chapterQuestRow}>
          <View style={styles.diamond} />
          <Text style={styles.chapterQuestText}>Tap to work the objectives</Text>
        </View>
      </LinearGradient>
    );
  } else if (chapter.money) {
    // locked money milestone → gold gate
    marker = (
      <View style={styles.gateHex}>
        <Text style={styles.gateGlyph}>$</Text>
      </View>
    );
    card = (
      <View style={[styles.card, styles.gateCard]}>
        <View style={styles.cardMain}>
          <Text style={styles.cardTitleMuted}>Ch. {chapter.index} · {chapter.title}</Text>
          <Text style={styles.gateSub}>Revenue-verified · gold tier</Text>
        </View>
        <Text style={styles.gateTag}>GATE</Text>
      </View>
    );
  } else {
    marker = (
      <View style={styles.lockedNode}>
        <Text style={styles.lockedNodeText}>{chapter.index}</Text>
      </View>
    );
    card = (
      <View style={[styles.card, styles.lockedCard]}>
        <View style={styles.cardMain}>
          <Text style={styles.cardTitleMuted}>Ch. {chapter.index} · {chapter.title}</Text>
          <Text style={styles.lockedSub}>{chapter.tagline}</Text>
        </View>
        <Text style={styles.lockedTag}>LOCKED</Text>
      </View>
    );
  }

  return (
    <Pressable onPress={onPress} disabled={!onPress} style={styles.nodeRow}>
      <View style={styles.markerCol}>{marker}</View>
      <View style={styles.cardCol}>{card}</View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  title: {
    fontFamily: fonts.uiExtraBold,
    fontSize: 24,
    color: colors.textPrimary,
  },
  actLabel: {
    fontFamily: fonts.uiBold,
    fontSize: 12.5,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: 18,
  },
  spine: { gap: 14 },
  nodeRow: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  markerCol: { width: 32, alignItems: 'center', paddingTop: 8 },
  cardCol: { flex: 1 },

  // markers
  mintNode: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.mint,
    borderWidth: 3,
    borderColor: colors.bgRadial[1],
    alignItems: 'center',
    justifyContent: 'center',
  },
  mintCheck: { fontFamily: fonts.uiBlack, fontSize: 10, color: '#0E2418' },
  activeNode: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.violet,
    borderWidth: 3,
    borderColor: colors.bgRadial[1],
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeNodeText: { fontFamily: fonts.uiBlack, fontSize: 12, color: '#14102E' },
  lockedNode: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(237,234,251,0.1)',
    borderWidth: 3,
    borderColor: colors.bgRadial[1],
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedNodeText: { fontFamily: fonts.uiBlack, fontSize: 10, color: colors.textFaint },
  gateHex: {
    width: 28,
    height: 28,
    backgroundColor: 'rgba(200,148,65,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gateGlyph: { fontFamily: fonts.uiBlack, fontSize: 11, color: colors.gold },
  hexGlyphWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hexGlyph: { fontFamily: fonts.uiBlack, fontSize: 11, color: '#2A1F0C' },

  // cards
  card: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  cardMain: { flex: 1 },
  cardTitle: { fontFamily: fonts.uiExtraBold, fontSize: 13, color: colors.textPrimary },
  cardTitleMuted: { fontFamily: fonts.uiExtraBold, fontSize: 13, color: 'rgba(237,234,251,0.55)' },

  doneCard: {
    backgroundColor: 'rgba(237,234,251,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(237,234,251,0.09)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  doneTag: { fontFamily: fonts.uiExtraBold, fontSize: 10, color: colors.mintBright },

  goldCard: {
    borderWidth: 1.5,
    borderColor: 'rgba(223,195,131,0.55)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  verifiedSub: { fontFamily: fonts.uiBold, fontSize: 10.5, color: colors.gold, marginTop: 2 },

  activeCard: {
    borderWidth: 2,
    borderColor: colors.violet,
    paddingVertical: 15,
  },
  activeHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  activeTitle: { flex: 1, fontFamily: fonts.uiExtraBold, fontSize: 15, color: colors.textPrimary },
  countBadge: {
    backgroundColor: 'rgba(164,147,255,0.15)',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  countText: { fontFamily: fonts.uiExtraBold, fontSize: 10.5, color: '#C9BDFF' },
  tagline: {
    fontFamily: fonts.uiBold,
    fontSize: 12,
    fontStyle: 'italic',
    color: 'rgba(237,234,251,0.55)',
    marginTop: 6,
    marginBottom: 10,
  },
  track: { height: 8, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.35)', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
  chapterQuestRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  diamond: { width: 6, height: 6, backgroundColor: colors.violetBright, transform: [{ rotate: '45deg' }] },
  chapterQuestText: { fontFamily: fonts.uiBold, fontSize: 11.5, color: 'rgba(237,234,251,0.6)' },

  lockedCard: {
    backgroundColor: 'rgba(237,234,251,0.04)',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(237,234,251,0.16)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  lockedSub: { fontFamily: fonts.uiBold, fontSize: 10.5, color: 'rgba(237,234,251,0.3)', marginTop: 2 },
  lockedTag: { fontFamily: fonts.uiExtraBold, fontSize: 8.5, letterSpacing: 1.5, color: 'rgba(237,234,251,0.35)' },

  gateCard: {
    backgroundColor: 'rgba(240,205,121,0.06)',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(223,195,131,0.4)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  gateSub: { fontFamily: fonts.uiBold, fontSize: 10.5, color: 'rgba(240,205,121,0.7)', marginTop: 2 },
  gateTag: { fontFamily: fonts.uiExtraBold, fontSize: 9, letterSpacing: 1.5, color: colors.gold },

  footer: {
    fontFamily: fonts.uiBold,
    fontSize: 11.5,
    color: colors.textFaint,
    textAlign: 'center',
    marginTop: 18,
  },
});
