import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSQLiteContext } from 'expo-sqlite';
import { ArcaneBackground } from '@/components/ui/ArcaneBackground';
import { StatRow } from '@/components/ui/StatRow';
import { devResetAll } from '@/db/dev';
import { colors, fonts, statOrder } from '@/theme/tokens';
import { statXp } from '@/logic/leveling';
import { useStore } from '@/store/useStore';

type SheetTab = 'Stats' | 'Milestones' | 'Journal';

/** Character sheet (design 7a). */
export default function CharacterScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const db = useSQLiteContext();
  const character = useStore(s => s.character);
  const setCharacter = useStore(s => s.setCharacter);
  const [tab, setTab] = useState<SheetTab>('Stats');

  async function onDevReset() {
    await devResetAll(db);
    setCharacter(null);
    router.replace('/onboarding');
  }

  if (!character) return <ArcaneBackground />;

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
          {tab === 'Milestones' && (
            <Text style={styles.placeholder}>
              Chapter milestones appear here as you complete them — verified ones get the
              gold seal.
            </Text>
          )}
          {tab === 'Journal' && (
            <Text style={styles.placeholder}>
              Your recent journal entries will surface here once the journal engine lands.
            </Text>
          )}

          {tab === 'Stats' && (
            <>
              <View style={styles.milestoneHeader}>
                <Text style={styles.milestoneTitle}>Latest milestone</Text>
                <Text style={styles.viewAll}>View all ›</Text>
              </View>
              <View style={styles.milestoneEmpty}>
                <Text style={styles.milestoneEmptyText}>
                  No milestones yet — Chapter 1 is waiting on the questline.
                </Text>
              </View>
            </>
          )}
        </ScrollView>
      </LinearGradient>
    </ArcaneBackground>
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
});
