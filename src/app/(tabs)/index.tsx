import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSQLiteContext } from 'expo-sqlite';
import { ArcaneBackground } from '@/components/ui/ArcaneBackground';
import { QuestCard } from '@/components/QuestCard';
import {
  completeQuest,
  ensureTodayQuests,
  todayKey,
  type QuestLogRow,
} from '@/logic/dailyQuests';
import { statLevel, statProgress, statXp, XP_PER_LEVEL } from '@/logic/leveling';
import { useStore } from '@/store/useStore';
import { colors, fonts, stats } from '@/theme/tokens';

/** Today / quest board (design 7d). */
export default function TodayScreen() {
  const insets = useSafeAreaInsets();
  const db = useSQLiteContext();
  const character = useStore(s => s.character);
  const setCharacter = useStore(s => s.setCharacter);

  const [quests, setQuests] = useState<QuestLogRow[]>([]);
  const [celebratingId, setCelebratingId] = useState<number | null>(null);
  const celebrationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (character) {
      ensureTodayQuests(db, character).then(setQuests);
    }
    // Issue once per mount; quest rows for today are stable afterwards.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db]);

  const onComplete = useCallback(
    async (quest: QuestLogRow) => {
      const fresh = await completeQuest(db, quest);
      setCharacter(fresh);
      const updated = await db.getAllAsync<QuestLogRow>(
        'SELECT * FROM quest_log WHERE quest_date = ? ORDER BY id',
        todayKey()
      );
      setQuests(updated);
      setCelebratingId(quest.id);
      if (celebrationTimer.current) clearTimeout(celebrationTimer.current);
      celebrationTimer.current = setTimeout(() => setCelebratingId(null), 2600);
    },
    [db, setCharacter]
  );

  if (!character) return <ArcaneBackground />;

  const doneCount = quests.filter(q => q.completed_at !== null).length;
  const pct = quests.length > 0 ? Math.round((doneCount / quests.length) * 100) : 0;
  const pendingIds = quests.filter(q => q.completed_at === null).map(q => q.id);

  // Bottom bar: the stat of the most recent completion, else the first pending quest's stat.
  const lastDone = [...quests].reverse().find(q => q.completed_at !== null);
  const focusStat = (lastDone ?? quests[0])?.stat ?? 'revenue';
  const focusXp = statXp(character, focusStat);
  const tone = stats[focusStat].tone;

  return (
    <ArcaneBackground>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}>
        <View style={styles.topBar}>
          <View style={styles.avatar}>
            <Text style={styles.avatarInitial}>{character.business_initial}</Text>
          </View>
          <View style={styles.counterPill}>
            <View style={styles.counterItem}>
              <View style={styles.gem} />
              <Text style={styles.counterGold}>{character.gems.toLocaleString()}</Text>
            </View>
            <View style={styles.counterDivider} />
            <View style={styles.counterItem}>
              <View style={styles.streakCoin} />
              <Text style={styles.counterText}>{character.streak}</Text>
            </View>
          </View>
        </View>

        <View style={styles.headingRow}>
          <Text style={styles.heading}>Complete{'\n'}today&rsquo;s quests</Text>
          <View style={styles.progressBlock}>
            <Text style={styles.pct}>
              {pct}
              <Text style={styles.pctSign}>%</Text>
            </Text>
            <Text style={styles.doneCount}>▲ {doneCount} of {quests.length || 3} done</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Quests</Text>
        <View style={styles.questList}>
          {quests.map(quest => (
            <QuestCard
              key={quest.id}
              quest={quest}
              celebrating={quest.id === celebratingId}
              subtitle={
                quest.completed_at === null && pendingIds.length === 1
                  ? 'One left — finish for a perfect day'
                  : undefined
              }
              onComplete={onComplete}
            />
          ))}
        </View>

        <View style={styles.statBar}>
          <View style={styles.statBarBody}>
            <Text style={[styles.statBarLabel, { color: tone.tint }]}>
              {stats[focusStat].label} stat
            </Text>
            <View style={styles.track}>
              <LinearGradient
                colors={tone.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.fill, { width: `${Math.max(2, statProgress(focusXp) * 100)}%` }]}
              />
            </View>
          </View>
          <Text style={[styles.statBarXp, { color: tone.tint }]}>
            {(focusXp % XP_PER_LEVEL).toLocaleString()} / {XP_PER_LEVEL.toLocaleString()} → LV.
            {statLevel(focusXp) + 1}
          </Text>
        </View>
      </ScrollView>
    </ArcaneBackground>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 40 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.violet,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: fonts.uiExtraBold,
    fontSize: 19,
    color: '#14102E',
  },
  counterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surfaceBottom,
    borderWidth: 1,
    borderColor: 'rgba(237,234,251,0.12)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  counterItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  gem: {
    width: 12,
    height: 12,
    borderRadius: 3,
    backgroundColor: colors.violet,
    transform: [{ rotate: '45deg' }],
  },
  streakCoin: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#F2C94C',
  },
  counterGold: {
    fontFamily: fonts.uiExtraBold,
    fontSize: 13,
    color: colors.gold,
  },
  counterText: {
    fontFamily: fonts.uiExtraBold,
    fontSize: 13,
    color: colors.textPrimary,
  },
  counterDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: 'rgba(237,234,251,0.14)',
  },
  headingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 18,
  },
  heading: {
    fontFamily: fonts.uiExtraBold,
    fontSize: 24,
    lineHeight: 29,
    color: colors.textPrimary,
  },
  progressBlock: { alignItems: 'flex-end' },
  pct: {
    fontFamily: fonts.uiBlack,
    fontSize: 30,
    color: colors.violetBright,
  },
  pctSign: { fontSize: 18 },
  doneCount: {
    fontFamily: fonts.uiExtraBold,
    fontSize: 11,
    color: colors.violetBright,
    marginTop: 4,
  },
  sectionTitle: {
    fontFamily: fonts.uiExtraBold,
    fontSize: 17,
    color: colors.textPrimary,
    marginTop: 22,
    marginBottom: 12,
  },
  questList: { gap: 11 },
  statBar: {
    marginTop: 18,
    backgroundColor: colors.surfaceBottom,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statBarBody: { flex: 1 },
  statBarLabel: {
    fontFamily: fonts.uiExtraBold,
    fontSize: 12,
  },
  track: {
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.35)',
    overflow: 'hidden',
    marginTop: 7,
  },
  fill: { height: '100%', borderRadius: 4 },
  statBarXp: {
    fontFamily: fonts.uiExtraBold,
    fontSize: 11,
  },
});
