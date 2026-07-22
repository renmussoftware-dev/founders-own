import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSQLiteContext } from 'expo-sqlite';
import { ArcaneBackground } from '@/components/ui/ArcaneBackground';
import { QuestCard } from '@/components/QuestCard';
import { RevenueDashboard } from '@/components/RevenueDashboard';
import { AdvisorCard } from '@/components/AdvisorCard';
import {
  advisorDeepDiveEligible,
  buildAdvisorSnapshot,
  generateAdvisorDeepDive,
  localAdvisor,
  type AdvisorInsight,
} from '@/logic/advisor';
import { devSeedSampleMetrics } from '@/db/dev';
import { getSnapshots, recordSnapshot, type MetricSnapshot } from '@/db/metrics';
import {
  completeQuest,
  ensureTodayQuests,
  todayKey,
  type QuestLogRow,
} from '@/logic/dailyQuests';
import { statLevel, statProgress, statXp, XP_PER_LEVEL } from '@/logic/leveling';
import { upsertDailyEntry } from '@/logic/journal';
import { questContext } from '@/logic/questContext';
import { nextMoneyMilestone, type NextMilestone } from '@/logic/verification';
import { clearGoal, getGoal, setGoal, type MilestoneGoal } from '@/logic/goal';
import { getPlaybookDone } from '@/logic/playbook';
import { PLAYBOOK_TOTAL } from '@/content/playbook';
import { proLocked } from '@/config/pro';
import { feedback } from '@/utils/feedback';
import { getInsights } from '@/integrations/revenuecat';
import { getRcCredentials } from '@/integrations/rcCredentials';
import { CHAPTERS_BY_ID } from '@/content/questline';
import { useRevenueData } from '@/hooks/useRevenueData';
import { useStore } from '@/store/useStore';
import { colors, fonts, stats } from '@/theme/tokens';

/** Today / quest board (design 7d) + live revenue dashboard (value item #1). */
export default function TodayScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const db = useSQLiteContext();
  const character = useStore(s => s.character);
  const setCharacter = useStore(s => s.setCharacter);
  const setRcConnection = useStore(s => s.setRcConnection);
  const setRcOverview = useStore(s => s.setRcOverview);

  const [quests, setQuests] = useState<QuestLogRow[]>([]);
  const [celebratingId, setCelebratingId] = useState<number | null>(null);
  const celebrationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [streakSaved, setStreakSaved] = useState<number | null>(null);
  const streakSavedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { connected, projectName, overview, loading, ready } = useRevenueData();
  const isPro = useStore(s => s.isPro);
  const [snapshots, setSnapshots] = useState<MetricSnapshot[]>([]);
  const [next, setNext] = useState<NextMilestone | null>(null);
  const [goal, setGoalState] = useState<MilestoneGoal | null>(null);
  const [activeChapterTitle, setActiveChapterTitle] = useState<string | undefined>();
  const [activeAct, setActiveAct] = useState<number | null>(null);
  const [playbookDone, setPlaybookDone] = useState(0);
  const [advice, setAdvice] = useState<AdvisorInsight | null>(null);
  const [deepDiveStatus, setDeepDiveStatus] = useState<string | null>(null);

  // Model B: metric-driven personalization (quest selection, the "why this
  // quest" data line) and the advisor are Pro. Free users get pre-scripted
  // quests (business-type + stage only) — so we withhold the live metrics from
  // the quest engine when locked. The live dashboard itself stays free.
  const advisorLocked = proLocked(isPro);
  const questOverview = advisorLocked ? null : overview;

  // The active chapter drives stage + the playbook gate; load it on mount.
  useEffect(() => {
    db.getFirstAsync<{ chapter_id: string }>(
      "SELECT chapter_id FROM chapter_progress WHERE status = 'active' ORDER BY act, chapter_id LIMIT 1"
    ).then(r => {
      const ch = r ? CHAPTERS_BY_ID[r.chapter_id] : undefined;
      setActiveChapterTitle(ch?.title);
      setActiveAct(ch?.act ?? null);
    });
  }, [db]);

  // Issue today's quests only once the connection has settled, so an established
  // app's real metrics inform the stage instead of a not-yet-loaded overview.
  // Idempotent per day: re-runs return the existing board.
  useEffect(() => {
    if (!character || !ready) return;
    ensureTodayQuests(db, character, questOverview).then(setQuests);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, character, ready]);

  // Snapshot live metrics daily + recompute the next milestone whenever metrics load.
  useEffect(() => {
    if (!overview) return;
    (async () => {
      await recordSnapshot(db, overview);
      setSnapshots(await getSnapshots(db));
      const verified = await db.getAllAsync<{ chapter_id: string }>(
        "SELECT chapter_id FROM chapter_progress WHERE status = 'verified'"
      );
      setNext(nextMoneyMilestone(overview, new Set(verified.map(v => v.chapter_id))));
    })();
  }, [db, overview]);

  // Refresh Launch Playbook progress whenever Today regains focus (e.g. after
  // returning from the playbook screen).
  useFocusEffect(
    useCallback(() => {
      getPlaybookDone(db).then(d => setPlaybookDone(d.size));
    }, [db])
  );

  // Load any saved milestone goal, and drop it once its milestone is verified
  // (the goal always tracks the current next milestone).
  useEffect(() => {
    getGoal(db).then(setGoalState);
  }, [db]);
  useEffect(() => {
    if (goal && next && goal.chapterId !== next.chapter.id) {
      clearGoal(db).then(() => setGoalState(null));
    }
  }, [db, goal, next]);

  // Recompute the advisor's read whenever the character or metrics change.
  // Skipped entirely when locked — free users see the teaser, not real advice.
  // For Pro founders, pull the deeper charts (churn, trial conversion) so the
  // advice is grounded in real rates, not proxies; charts degrade to null.
  useEffect(() => {
    if (!character || advisorLocked) {
      setAdvice(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const cred = connected ? await getRcCredentials() : null;
      const insights = cred ? await getInsights(cred.apiKey, cred.projectId) : null;
      const snap = await buildAdvisorSnapshot(db, character, overview, insights);
      if (!cancelled) setAdvice(localAdvisor(snap));
    })();
    return () => {
      cancelled = true;
    };
  }, [db, character, overview, advisorLocked, connected]);

  async function onSetGoal(days: number) {
    if (!next?.chapter.verify) return;
    const g = await setGoal(db, {
      chapterId: next.chapter.id,
      metric: next.chapter.verify.metric,
      target: next.chapter.verify.threshold,
      startValue: next.current,
      days,
    });
    setGoalState(g);
    feedback('tap');
  }
  async function onClearGoal() {
    await clearGoal(db);
    setGoalState(null);
  }

  async function onDevSample() {
    const fixture = await devSeedSampleMetrics(db);
    setRcConnection({ connected: true, projectName: 'Fretionary (sample)' });
    setRcOverview(fixture);
  }

  async function onDeepDive() {
    if (!character) return;
    const gate = await advisorDeepDiveEligible(db, isPro);
    if (gate.reason === 'not_pro') {
      router.push('/paywall');
      return;
    }
    if (gate.reason === 'cooldown') {
      setDeepDiveStatus('Your next weekly deep-dive isn’t ready yet — check back soon.');
      return;
    }
    try {
      const snapshot = await buildAdvisorSnapshot(db, character, overview);
      await generateAdvisorDeepDive(snapshot);
    } catch {
      setDeepDiveStatus('Weekly AI deep-dive is coming to Pro shortly.');
    }
  }

  const onComplete = useCallback(
    async (quest: QuestLogRow) => {
      const { character: fresh, streakSaved } = await completeQuest(db, quest);
      await upsertDailyEntry(db);
      // Level-up when this quest's XP pushed its stat across a level boundary.
      const afterXp = statXp(fresh, quest.stat);
      const leveled = statLevel(afterXp - quest.xp) < statLevel(afterXp);
      feedback(leveled ? 'levelUp' : 'questComplete');
      setCharacter(fresh);
      const updated = await db.getAllAsync<QuestLogRow>(
        'SELECT * FROM quest_log WHERE quest_date = ? ORDER BY id',
        todayKey()
      );
      setQuests(updated);
      setCelebratingId(quest.id);
      if (celebrationTimer.current) clearTimeout(celebrationTimer.current);
      celebrationTimer.current = setTimeout(() => setCelebratingId(null), 2600);
      // A freeze just rescued the streak — surface it so it doesn't feel silent.
      if (streakSaved) {
        setStreakSaved(fresh.streak);
        if (streakSavedTimer.current) clearTimeout(streakSavedTimer.current);
        streakSavedTimer.current = setTimeout(() => setStreakSaved(null), 4500);
      }
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

  // An app with real sales has already shipped, priced, and found users — the
  // pre-revenue Launch Playbook no longer applies.
  const established =
    connected &&
    !!overview &&
    ((overview.metrics.active_subscriptions ?? 0) > 0 || (overview.metrics.mrr ?? 0) > 0);

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
              <View>
                <Text style={styles.counterGold}>{character.gems.toLocaleString()}</Text>
                <Text style={styles.counterLabel}>GEMS</Text>
              </View>
            </View>
            <View style={styles.counterDivider} />
            <View style={styles.counterItem}>
              <View style={styles.streakCoin} />
              <View>
                <Text style={styles.counterText}>{character.streak}</Text>
                <Text style={styles.counterLabel}>STREAK</Text>
              </View>
            </View>
          </View>
        </View>

        {streakSaved !== null ? (
          <View style={styles.streakSavedBanner}>
            <Text style={styles.streakSavedGlyph}>❄</Text>
            <Text style={styles.streakSavedText}>
              Streak freeze used — your {streakSaved}-day streak is safe.
            </Text>
          </View>
        ) : null}

        <View style={styles.dashboard}>
          <RevenueDashboard
            connected={connected}
            projectName={projectName}
            overview={overview}
            loading={loading}
            snapshots={snapshots}
            next={next}
            goal={goal}
            onConnect={() => router.push('/connect')}
            onVerifyNext={id => router.push(proLocked(isPro) ? '/paywall' : `/verify/${id}`)}
            onSetGoal={onSetGoal}
            onClearGoal={onClearGoal}
          />
          {__DEV__ && !connected ? (
            <Pressable onPress={onDevSample} style={styles.devSample}>
              <Text style={styles.devSampleText}>load sample metrics (dev)</Text>
            </Pressable>
          ) : null}
        </View>

        {/* Act I blind spot: before there's revenue to read, give concrete steps.
            Hidden once the app is established (real sales already prove it shipped). */}
        {activeAct === 1 && playbookDone < PLAYBOOK_TOTAL && !established ? (
          <Pressable onPress={() => router.push('/playbook')}>
            <LinearGradient
              colors={['rgba(124,104,232,0.2)', 'rgba(124,104,232,0.06)']}
              style={styles.playbookCard}
            >
              <View style={styles.playbookIcon}>
                <Text style={styles.playbookIconText}>⚑</Text>
              </View>
              <View style={styles.playbookBody}>
                <Text style={styles.playbookTitle}>Launch Playbook</Text>
                <Text style={styles.playbookSub}>
                  The path to your first paying customer · {playbookDone}/{PLAYBOOK_TOTAL}
                </Text>
              </View>
              <Text style={styles.playbookChevron}>›</Text>
            </LinearGradient>
          </Pressable>
        ) : null}

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
              context={questContext(quest, { activeChapterTitle, overview: questOverview })}
              onComplete={onComplete}
            />
          ))}
        </View>

        {advisorLocked ? (
          <View style={styles.advisor}>
            <AdvisorCard locked onUnlock={() => router.push('/paywall')} />
          </View>
        ) : advice ? (
          <View style={styles.advisor}>
            <AdvisorCard
              insight={advice}
              isPro={isPro}
              deepDiveStatus={deepDiveStatus}
              onDeepDive={onDeepDive}
            />
          </View>
        ) : null}

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
    lineHeight: 15,
    color: colors.gold,
  },
  counterText: {
    fontFamily: fonts.uiExtraBold,
    fontSize: 13,
    lineHeight: 15,
    color: colors.textPrimary,
  },
  counterLabel: {
    fontFamily: fonts.uiExtraBold,
    fontSize: 7.5,
    letterSpacing: 0.6,
    color: colors.textFaint,
  },
  counterDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: 'rgba(237,234,251,0.14)',
  },
  dashboard: { marginTop: 16 },
  playbookCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 14,
    borderWidth: 1,
    borderColor: 'rgba(164,147,255,0.35)',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  playbookIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: colors.violet,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playbookIconText: { fontFamily: fonts.uiBlack, fontSize: 17, color: '#EDEAFB' },
  playbookBody: { flex: 1 },
  playbookTitle: { fontFamily: fonts.uiExtraBold, fontSize: 15, color: colors.textPrimary },
  playbookSub: {
    fontFamily: fonts.uiBold,
    fontSize: 11.5,
    color: colors.textSecondary,
    marginTop: 2,
  },
  playbookChevron: { fontFamily: fonts.uiExtraBold, fontSize: 18, color: colors.violetBright },
  streakSavedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    backgroundColor: 'rgba(124,104,232,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(164,147,255,0.4)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  streakSavedGlyph: { fontSize: 15, color: '#C9BDFF' },
  streakSavedText: {
    flex: 1,
    fontFamily: fonts.uiExtraBold,
    fontSize: 12.5,
    color: colors.textPrimary,
  },
  advisor: { marginTop: 16 },
  devSample: { alignSelf: 'center', paddingVertical: 8 },
  devSampleText: { fontFamily: fonts.uiBold, fontSize: 10, color: colors.textFaint },
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
