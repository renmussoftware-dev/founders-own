import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSQLiteContext } from 'expo-sqlite';
import { ArcaneBackground } from '@/components/ui/ArcaneBackground';
import { HexSeal } from '@/components/ui/HexSeal';
import { StatRow } from '@/components/ui/StatRow';
import { getMilestoneTimeline, type MilestoneItem } from '@/db/chapters';
import { buyStreakFreeze, STREAK_FREEZE_COST } from '@/db/character';
import { devResetAll } from '@/db/dev';
import { CHAPTERS_BY_ID } from '@/content/questline';
import { cancelDailyReminder, scheduleDailyReminder } from '@/integrations/notifications';
import { colors, fonts, statOrder } from '@/theme/tokens';
import { statXp } from '@/logic/leveling';
import { useStore } from '@/store/useStore';
import { feedback } from '@/utils/feedback';

type SheetTab = 'Stats' | 'Milestones' | 'Journal';

/** Character sheet (design 7a) + milestone timeline (SPEC #3). */
export default function CharacterScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const db = useSQLiteContext();
  const character = useStore(s => s.character);
  const setCharacter = useStore(s => s.setCharacter);
  const soundEnabled = useStore(s => s.soundEnabled);
  const setSoundEnabled = useStore(s => s.setSoundEnabled);
  const reminderEnabled = useStore(s => s.reminderEnabled);
  const setReminderEnabled = useStore(s => s.setReminderEnabled);
  const [tab, setTab] = useState<SheetTab>('Stats');
  const [milestones, setMilestones] = useState<MilestoneItem[]>([]);
  const [reminderBusy, setReminderBusy] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getMilestoneTimeline(db).then(setMilestones);
    }, [db])
  );

  async function onDevReset() {
    await devResetAll(db);
    setCharacter(null);
    router.replace('/onboarding');
  }

  async function onToggleReminder() {
    if (reminderBusy) return;
    setReminderBusy(true);
    if (reminderEnabled) {
      await cancelDailyReminder();
      setReminderEnabled(false);
    } else {
      const ok = await scheduleDailyReminder(); // prompts for permission
      setReminderEnabled(ok);
      if (ok) feedback('tap');
    }
    setReminderBusy(false);
  }

  async function onBuyFreeze() {
    if (!character || character.gems < STREAK_FREEZE_COST) return;
    const { ok, character: fresh } = await buyStreakFreeze(db);
    if (ok) {
      setCharacter(fresh);
      feedback('tap');
    }
  }

  if (!character) return <ArcaneBackground />;

  const canAffordFreeze = character.gems >= STREAK_FREEZE_COST;

  return (
    <ArcaneBackground>
      <View style={[styles.hero, { paddingTop: insets.top + 20 }]}>
        <LinearGradient
          colors={['#B4A6FF', '#7C68E8', '#4F3EAE']}
          style={styles.avatar}
        >
          <Text style={styles.avatarInitial}>{character.business_initial}</Text>
        </LinearGradient>
        <Text style={styles.name}>{character.business_name}</Text>
        <Text style={styles.rank}>
          Level {character.overall_level} · {character.rank_title}
        </Text>
        {__DEV__ ? (
          <Pressable onPress={onDevReset} style={styles.devReset}>
            <Text style={styles.devResetText}>reset (dev)</Text>
          </Pressable>
        ) : null}
        <View style={styles.tabPill}>
          {(['Stats', 'Milestones', 'Journal'] as SheetTab[]).map(t => (
            <Pressable key={t} onPress={() => setTab(t)}>
              {tab === t ? (
                <LinearGradient colors={['#EDEAFB', '#D6D0F0']} style={styles.tabActive}>
                  <Text style={styles.tabActiveText}>{t}</Text>
                </LinearGradient>
              ) : (
                <View style={styles.tabInactive}>
                  <Text style={styles.tabInactiveText}>{t}</Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>
      </View>

      <LinearGradient colors={['#28224C', '#1E1A3C']} style={styles.sheet}>
        <ScrollView contentContainerStyle={styles.sheetContent}>
          {tab === 'Stats' && (
            <View style={styles.statList}>
              {statOrder.map(stat => (
                <View key={stat} style={styles.statCard}>
                  <StatRow
                    stat={stat}
                    level={character[`${stat}_level`]}
                    xp={statXp(character, stat)}
                  />
                </View>
              ))}
            </View>
          )}
          {tab === 'Milestones' &&
            (milestones.length === 0 ? (
              <Text style={styles.placeholder}>
                Chapter milestones appear here as you complete them — verified ones get the
                gold seal.
              </Text>
            ) : (
              <View style={styles.timeline}>
                {milestones.map(m => (
                  <MilestoneRow key={m.chapter_id} item={m} />
                ))}
              </View>
            ))}
          {tab === 'Journal' && (
            <Pressable onPress={() => router.push('/(tabs)/journal')}>
              <Text style={styles.placeholder}>
                Your full journal lives in the Journal tab — open it ›
              </Text>
            </Pressable>
          )}

          {tab === 'Stats' && (
            <>
              <View style={styles.milestoneHeader}>
                <Text style={styles.milestoneTitle}>Latest milestone</Text>
                {milestones.length > 0 ? (
                  <Pressable onPress={() => setTab('Milestones')}>
                    <Text style={styles.viewAll}>View all ›</Text>
                  </Pressable>
                ) : null}
              </View>
              {milestones.length > 0 ? (
                <MilestoneRow item={milestones[0]} />
              ) : (
                <View style={styles.milestoneEmpty}>
                  <Text style={styles.milestoneEmptyText}>
                    No milestones yet — Chapter 1 is waiting on the questline.
                  </Text>
                </View>
              )}

              <Text style={[styles.milestoneTitle, styles.settingsHeading]}>Streak protection</Text>
              <View style={styles.freezeCard}>
                <View style={styles.freezeIcon}>
                  <Text style={styles.freezeGlyph}>❄</Text>
                </View>
                <View style={styles.freezeBody}>
                  <Text style={styles.freezeTitle}>
                    Streak freeze{character.streak_freezes > 0 ? ` · ${character.streak_freezes}` : ''}
                  </Text>
                  <Text style={styles.settingSub}>Covers one missed day so your streak survives</Text>
                </View>
                <Pressable
                  onPress={onBuyFreeze}
                  disabled={!canAffordFreeze}
                  style={[styles.freezeBuy, !canAffordFreeze && styles.freezeBuyOff]}
                >
                  <View style={styles.gemMini} />
                  <Text style={styles.freezeBuyText}>{STREAK_FREEZE_COST}</Text>
                </Pressable>
              </View>
              {!canAffordFreeze ? (
                <Text style={styles.freezeHint}>
                  Earn gems by completing quests — {STREAK_FREEZE_COST - character.gems} more for a freeze.
                </Text>
              ) : null}

              <Text style={[styles.milestoneTitle, styles.settingsHeading]}>Settings</Text>
              <Pressable
                onPress={() => {
                  const next = !soundEnabled;
                  setSoundEnabled(next);
                  if (next) feedback('tap'); // let them hear it come on
                }}
                style={styles.settingRow}
              >
                <View style={styles.settingBody}>
                  <Text style={styles.settingLabel}>Sound effects</Text>
                  <Text style={styles.settingSub}>Chimes for quests, level-ups & milestones</Text>
                </View>
                <View style={[styles.switch, soundEnabled && styles.switchOn]}>
                  <View style={[styles.knob, soundEnabled && styles.knobOn]} />
                </View>
              </Pressable>
              <Pressable
                onPress={onToggleReminder}
                disabled={reminderBusy}
                style={[styles.settingRow, styles.settingRowStacked]}
              >
                <View style={styles.settingBody}>
                  <Text style={styles.settingLabel}>Daily reminder</Text>
                  <Text style={styles.settingSub}>An evening nudge to keep your streak alive</Text>
                </View>
                <View style={[styles.switch, reminderEnabled && styles.switchOn]}>
                  <View style={[styles.knob, reminderEnabled && styles.knobOn]} />
                </View>
              </Pressable>
            </>
          )}
        </ScrollView>
      </LinearGradient>
    </ArcaneBackground>
  );
}

function MilestoneRow({ item }: { item: MilestoneItem }) {
  const chapter = CHAPTERS_BY_ID[item.chapter_id];
  const verified = item.status === 'verified';
  const date = item.completed_at
    ? new Date(item.completed_at).toLocaleDateString([], { month: 'short', year: 'numeric' })
    : '';
  return (
    <LinearGradient
      colors={
        verified
          ? ['rgba(240,205,121,0.16)', 'rgba(200,148,65,0.08)']
          : [colors.surfaceBottom, colors.surfaceBottom]
      }
      style={[styles.mRow, verified && styles.mRowVerified]}
    >
      {verified ? (
        <HexSeal label="✓" size={40} />
      ) : (
        <View style={styles.mCheck}>
          <Text style={styles.mCheckText}>✓</Text>
        </View>
      )}
      <View style={styles.mBody}>
        <Text style={styles.mTitle}>{chapter?.title ?? item.chapter_id}</Text>
        <Text style={[styles.mSub, verified && styles.mSubGold]}>
          {verified ? `Verified via RevenueCat${date ? ` · ${date}` : ''}` : `Done${date ? ` · ${date}` : ''}`}
        </Text>
      </View>
      {verified ? <Text style={styles.mBadge}>VERIFIED</Text> : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    paddingBottom: 18,
  },
  avatar: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 3,
    borderColor: 'rgba(237,234,251,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  avatarInitial: {
    fontFamily: fonts.uiBlack,
    fontSize: 30,
    color: '#14102E',
  },
  name: {
    fontFamily: fonts.uiExtraBold,
    fontSize: 19,
    color: colors.textPrimary,
  },
  rank: {
    fontFamily: fonts.uiExtraBold,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 5,
  },
  devReset: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(237,234,251,0.2)',
  },
  devResetText: {
    fontFamily: fonts.uiBold,
    fontSize: 10,
    color: colors.textFaint,
  },
  tabPill: {
    flexDirection: 'row',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderRadius: 999,
    padding: 4,
    marginTop: 14,
  },
  tabActive: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  tabActiveText: {
    fontFamily: fonts.uiExtraBold,
    fontSize: 11.5,
    color: '#1C1838',
  },
  tabInactive: {
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  tabInactiveText: {
    fontFamily: fonts.uiExtraBold,
    fontSize: 11.5,
    color: 'rgba(237,234,251,0.65)',
  },
  sheet: {
    flex: 1,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  sheetContent: {
    padding: 18,
    paddingBottom: 32,
  },
  statList: { gap: 9 },
  statCard: {
    backgroundColor: colors.surfaceBottom,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 3,
  },
  milestoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    marginBottom: 10,
  },
  milestoneTitle: {
    fontFamily: fonts.uiExtraBold,
    fontSize: 15,
    color: colors.textPrimary,
  },
  viewAll: {
    fontFamily: fonts.uiExtraBold,
    fontSize: 12,
    color: 'rgba(237,234,251,0.4)',
  },
  milestoneEmpty: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(237,234,251,0.16)',
    borderRadius: 18,
    padding: 15,
  },
  settingsHeading: { marginTop: 22, marginBottom: 10 },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceBottom,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 12,
  },
  settingBody: { flex: 1 },
  settingLabel: { fontFamily: fonts.uiExtraBold, fontSize: 14, color: colors.textPrimary },
  settingSub: {
    fontFamily: fonts.uiBold,
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  switch: {
    width: 46,
    height: 28,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.35)',
    padding: 3,
    justifyContent: 'center',
  },
  switchOn: { backgroundColor: colors.violetBright },
  knob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#EDEAFB',
    alignSelf: 'flex-start',
  },
  knobOn: { alignSelf: 'flex-end' },
  settingRowStacked: { marginTop: 8 },
  freezeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surfaceBottom,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  freezeIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(124,104,232,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  freezeGlyph: { fontSize: 16, color: '#C9BDFF' },
  freezeBody: { flex: 1 },
  freezeTitle: { fontFamily: fonts.uiExtraBold, fontSize: 14, color: colors.textPrimary },
  freezeBuy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.violet,
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  freezeBuyOff: { backgroundColor: 'rgba(237,234,251,0.08)' },
  freezeBuyText: { fontFamily: fonts.uiExtraBold, fontSize: 12.5, color: colors.textPrimary },
  gemMini: {
    width: 9,
    height: 9,
    borderRadius: 2,
    backgroundColor: colors.gold,
    transform: [{ rotate: '45deg' }],
  },
  freezeHint: {
    fontFamily: fonts.uiBold,
    fontSize: 11,
    color: colors.textFaint,
    marginTop: 8,
  },
  milestoneEmptyText: {
    fontFamily: fonts.uiBold,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  placeholder: {
    fontFamily: fonts.uiBold,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
    paddingVertical: 8,
  },
  timeline: { gap: 10 },
  mRow: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mRowVerified: { borderColor: 'rgba(223,195,131,0.55)' },
  mCheck: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mCheckText: { fontFamily: fonts.uiBlack, fontSize: 15, color: '#0E2418' },
  mBody: { flex: 1 },
  mTitle: { fontFamily: fonts.uiExtraBold, fontSize: 14, color: colors.textPrimary },
  mSub: { fontFamily: fonts.uiBold, fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  mSubGold: { color: colors.gold },
  mBadge: {
    fontFamily: fonts.uiExtraBold,
    fontSize: 8.5,
    letterSpacing: 1.5,
    color: colors.gold,
  },
});
