import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { Platform, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSQLiteContext } from 'expo-sqlite';
import { ArcaneBackground } from '@/components/ui/ArcaneBackground';
import { HexSeal } from '@/components/ui/HexSeal';
import {
  exportJournalText,
  getJournalEntries,
  getStreakStrip,
  parseXpSummary,
  type DayCell,
  type JournalRow,
} from '@/logic/journal';
import { useStore } from '@/store/useStore';
import { colors, fonts, stats } from '@/theme/tokens';

// Indexed by Date.getDay() (0 = Sunday). The streak strip is a rolling 7-day
// window ending today, so each column's label must come from that cell's real
// date — a fixed Mon–Sun row would misalign today onto the wrong weekday.
const DOW_LETTER = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function weekdayLetter(dateKey: string): string {
  return DOW_LETTER[new Date(dateKey + 'T00:00:00').getDay()];
}

/** Journal (design 7c) + Founder Wrapped + export (SPEC #3). */
export default function JournalScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const db = useSQLiteContext();
  const character = useStore(s => s.character);
  const [entries, setEntries] = useState<JournalRow[]>([]);
  const [strip, setStrip] = useState<DayCell[]>([]);

  useFocusEffect(
    useCallback(() => {
      getJournalEntries(db).then(setEntries);
      getStreakStrip(db).then(setStrip);
    }, [db])
  );

  async function onExport() {
    if (!character) return;
    const text = await exportJournalText(db, character.business_name);
    if (Platform.OS === 'web') {
      const blob = new Blob([text], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${character.business_name}-journal.md`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      await Share.share({ message: text });
    }
  }

  const dayCount = character
    ? Math.max(
        1,
        Math.floor(
          (Date.now() - new Date(character.created_at.replace(' ', 'T') + 'Z').getTime()) /
            86_400_000
        ) + 1
      )
    : 1;

  return (
    <ArcaneBackground>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Journal</Text>
          <Pressable onPress={onExport} style={styles.exportBtn}>
            <Text style={styles.exportText}>Export</Text>
          </Pressable>
        </View>

        <Pressable onPress={() => router.push('/wrapped')}>
          <LinearGradient
            colors={['rgba(240,205,121,0.16)', 'rgba(200,148,65,0.06)']}
            style={styles.wrappedCta}
          >
            <View style={styles.wrappedIcon}>
              <Text style={styles.wrappedIconText}>✦</Text>
            </View>
            <View style={styles.wrappedBody}>
              <Text style={styles.wrappedTitle}>Your story so far</Text>
              <Text style={styles.wrappedSub}>A shareable recap of your whole journey.</Text>
            </View>
            <Text style={styles.wrappedChevron}>›</Text>
          </LinearGradient>
        </Pressable>

        <View style={styles.calendar}>
          <View style={styles.calHeader}>
            <Text style={styles.calMonth}>
              {new Date().toLocaleString([], { month: 'long' })}
            </Text>
            <Text style={styles.calStreak}>{character?.streak ?? 0}-day streak</Text>
          </View>
          <View style={styles.calRow}>
            {strip.map((cell, i) => (
              <DayDot key={i} cell={cell} />
            ))}
          </View>
          <View style={styles.calRow}>
            {strip.map((cell, i) => (
              <Text key={i} style={styles.weekday}>
                {weekdayLetter(cell.date)}
              </Text>
            ))}
          </View>
        </View>

        {entries.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              Complete a quest and your first entry gets written here — assembled from the
              day&rsquo;s work, in this voice.
            </Text>
          </View>
        ) : (
          <View style={styles.entries}>
            {entries.map(entry =>
              entry.kind === 'milestone' ? (
                <MilestoneEntry key={entry.id} entry={entry} />
              ) : (
                <DailyEntry key={entry.id} entry={entry} />
              )
            )}
          </View>
        )}

        <Text style={styles.footer}>
          Day {dayCount} of {character?.business_name ?? 'your business'}. Every day is written
          down.
        </Text>
      </ScrollView>
    </ArcaneBackground>
  );
}

function DayDot({ cell }: { cell: DayCell }) {
  if (cell.state === 'perfect') {
    return <LinearGradient colors={['#F8DD8E', '#C89441']} style={styles.dot} />;
  }
  if (cell.state === 'quest') {
    return <LinearGradient colors={['#8A76F0', '#5F4CC8']} style={styles.dot} />;
  }
  if (cell.state === 'today') {
    return <View style={[styles.dot, styles.dotToday]} />;
  }
  return <View style={[styles.dot, styles.dotEmpty]} />;
}

function formatEntryDate(dateKey: string): string {
  const d = new Date(dateKey + 'T00:00:00');
  return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

function DailyEntry({ entry }: { entry: JournalRow }) {
  const chips = parseXpSummary(entry);
  return (
    <LinearGradient colors={[colors.surfaceTop, colors.surfaceBottom]} style={styles.entryCard}>
      <View style={styles.entryHeader}>
        <Text style={styles.entryDate}>{formatEntryDate(entry.entry_date)}</Text>
        {entry.perfect_day ? (
          <View style={styles.perfectBadge}>
            <Text style={styles.perfectText}>PERFECT DAY</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.prose}>{entry.body}</Text>
      {chips.length > 0 ? (
        <View style={styles.chips}>
          {chips.map(([stat, xp]) => (
            <View key={stat} style={[styles.chip, { backgroundColor: `${stats[stat].tone.tint}22` }]}>
              <Text style={[styles.chipText, { color: stats[stat].tone.tint }]}>
                +{xp} {stats[stat].label}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </LinearGradient>
  );
}

function MilestoneEntry({ entry }: { entry: JournalRow }) {
  return (
    <LinearGradient
      colors={['rgba(240,205,121,0.16)', 'rgba(200,148,65,0.08)']}
      style={styles.milestoneCard}
    >
      <HexSeal label="✓" size={40} />
      <View style={styles.milestoneBody}>
        <Text style={styles.milestoneTitle}>{entry.body}</Text>
        <Text style={styles.milestoneSub}>
          {entry.founder_card_ref ? 'Verified · founder card saved to journal' : 'Saved to your journal'}
        </Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  title: {
    fontFamily: fonts.uiExtraBold,
    fontSize: 24,
    color: colors.textPrimary,
  },
  exportBtn: {
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  exportText: { fontFamily: fonts.uiExtraBold, fontSize: 11, color: colors.textSecondary },
  wrappedCta: {
    borderWidth: 1.5,
    borderColor: 'rgba(223,195,131,0.4)',
    borderRadius: 18,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  wrappedIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.goldMid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wrappedIconText: { fontFamily: fonts.uiBlack, fontSize: 16, color: '#2A1F0C' },
  wrappedBody: { flex: 1 },
  wrappedTitle: { fontFamily: fonts.uiExtraBold, fontSize: 15, color: colors.textPrimary },
  wrappedSub: { fontFamily: fonts.uiBold, fontSize: 11.5, color: colors.textSecondary, marginTop: 2 },
  wrappedChevron: { fontFamily: fonts.uiExtraBold, fontSize: 18, color: colors.gold },
  calendar: {
    backgroundColor: colors.surfaceBottom,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 18,
    padding: 15,
    marginBottom: 16,
  },
  calHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  calMonth: { fontFamily: fonts.uiExtraBold, fontSize: 13, color: colors.textPrimary },
  calStreak: { fontFamily: fonts.uiExtraBold, fontSize: 11, color: '#C9BDFF' },
  calRow: { flexDirection: 'row', gap: 5, marginTop: 6 },
  dot: { flex: 1, aspectRatio: 1, borderRadius: 7 },
  dotEmpty: { backgroundColor: 'rgba(237,234,251,0.1)' },
  dotToday: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(237,234,251,0.25)',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.uiBold,
    fontSize: 9.5,
    color: colors.textFaint,
  },
  empty: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(237,234,251,0.16)',
    borderRadius: 18,
    padding: 16,
  },
  emptyText: {
    fontFamily: fonts.uiBold,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  entries: { gap: 12 },
  entryCard: {
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 18,
    padding: 16,
  },
  entryHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  entryDate: {
    flex: 1,
    fontFamily: fonts.uiExtraBold,
    fontSize: 12,
    color: 'rgba(237,234,251,0.45)',
  },
  perfectBadge: {
    backgroundColor: 'rgba(240,205,121,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(223,195,131,0.45)',
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  perfectText: {
    fontFamily: fonts.uiExtraBold,
    fontSize: 9.5,
    letterSpacing: 0.8,
    color: colors.gold,
  },
  prose: {
    fontFamily: fonts.serifItalic,
    fontSize: 15,
    lineHeight: 23,
    color: 'rgba(237,234,251,0.85)',
    marginTop: 9,
    marginBottom: 10,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5 },
  chipText: { fontFamily: fonts.uiExtraBold, fontSize: 10 },
  milestoneCard: {
    borderWidth: 1.5,
    borderColor: 'rgba(223,195,131,0.55)',
    borderRadius: 18,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  milestoneBody: { flex: 1 },
  milestoneTitle: { fontFamily: fonts.uiExtraBold, fontSize: 13.5, color: colors.textPrimary },
  milestoneSub: { fontFamily: fonts.uiBold, fontSize: 11, color: colors.gold, marginTop: 2 },
  chevron: { fontFamily: fonts.uiExtraBold, fontSize: 16, color: colors.gold },
  footer: {
    fontFamily: fonts.serifItalic,
    fontSize: 13,
    color: colors.textFaint,
    textAlign: 'center',
    marginTop: 18,
  },
});
