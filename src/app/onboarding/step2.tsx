import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSQLiteContext } from 'expo-sqlite';
import { OnboardingProgress, TealButton } from '@/components/onboarding/shared';
import { ob, SELF_REPORT_ITEMS } from '@/content/onboarding';
import { createCharacter } from '@/db/character';
import { seedChapters } from '@/db/chapters';
import { overallLevel, statLevel } from '@/logic/leveling';
import { useOnboarding } from '@/store/onboarding';
import { useStore } from '@/store/useStore';
import { fonts, stats as statMeta, statOrder, type StatKey } from '@/theme/tokens';

/**
 * Onboarding 2/3 — "Mark how far you've come" (design 4b; "+Grit" renders as
 * "+Finance"). The name field is an addition the design omits — the character
 * row needs a business name/initial.
 */
export default function SelfReportStep() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const db = useSQLiteContext();
  const setCharacter = useStore(s => s.setCharacter);
  const { businessType, businessName, checked, toggleItem, setBusinessName } = useOnboarding();

  const startingXp = useMemo(() => {
    const xp: Partial<Record<StatKey, number>> = {};
    for (const item of SELF_REPORT_ITEMS) {
      if (checked[item.id]) xp[item.stat] = (xp[item.stat] ?? 0) + item.xp;
    }
    return xp;
  }, [checked]);

  const summary = useMemo(() => {
    const total = Object.values(startingXp).reduce((a, b) => a + b, 0);
    const level = overallLevel(total);
    const parts = statOrder
      .filter(s => (startingXp[s] ?? 0) > 0)
      .map(s => `${statMeta[s].label} ${statLevel(startingXp[s]!)}`);
    return { level, parts };
  }, [startingXp]);

  async function onCreate() {
    const character = await createCharacter(db, {
      businessName: businessName.trim() || 'My Business',
      businessType: businessType ?? 'other',
      startingXp,
    });
    // Seed every chapter (first one active) so the daily engine has a chapter to pull toward.
    await seedChapters(db);
    setCharacter(character);
    router.push('/onboarding/step3');
  }

  return (
    <LinearGradient colors={[ob.bgTop, ob.bgBottom]} style={styles.root}>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 24 }]}>
          <OnboardingProgress step={2} />
          <Text style={styles.heading}>Mark how far{'\n'}you&rsquo;ve come</Text>
          <Text style={styles.sub}>
            We take your word for the early stuff. Money milestones get verified later —
            that&rsquo;s where the gold is.
          </Text>

          <TextInput
            value={businessName}
            onChangeText={setBusinessName}
            placeholder="Your business name"
            placeholderTextColor={ob.inkFaint}
            style={styles.nameInput}
          />

          <View style={styles.list}>
            {SELF_REPORT_ITEMS.map(item => {
              const isChecked = !!checked[item.id];
              return (
                <Pressable
                  key={item.id}
                  onPress={() => toggleItem(item.id)}
                  style={[styles.item, !isChecked && styles.itemUnchecked]}
                >
                  {isChecked ? (
                    <LinearGradient colors={[ob.ctaTop, ob.ctaBottom]} style={styles.checkbox}>
                      <Text style={styles.checkboxMark}>✓</Text>
                    </LinearGradient>
                  ) : (
                    <View style={[styles.checkbox, styles.checkboxEmpty]} />
                  )}
                  <Text style={[styles.itemLabel, !isChecked && styles.itemLabelUnchecked]}>
                    {item.label}
                  </Text>
                  <Text style={[styles.itemStat, !isChecked && styles.itemStatUnchecked]}>
                    +{statMeta[item.stat].label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.summary}>
            <View style={styles.summaryGem} />
            <Text style={styles.summaryText}>
              Your character starts at <Text style={styles.summaryStrong}>Level {summary.level}</Text>
              {summary.parts.length > 0 ? ` — ${summary.parts.join(' · ')}` : ''}
            </Text>
          </View>
        </ScrollView>
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
          <TealButton label="Create my character" onPress={onCreate} />
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 22, paddingBottom: 16 },
  heading: {
    fontFamily: fonts.uiExtraBold,
    fontSize: 26,
    lineHeight: 32,
    color: ob.ink,
  },
  sub: {
    fontFamily: fonts.uiBold,
    fontSize: 13,
    lineHeight: 19,
    color: ob.inkSoft,
    marginTop: 8,
    marginBottom: 16,
  },
  nameInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: ob.cardBorder,
    borderRadius: 16,
    paddingHorizontal: 15,
    paddingVertical: 13,
    fontFamily: fonts.uiExtraBold,
    fontSize: 14,
    color: ob.ink,
    marginBottom: 12,
  },
  list: { gap: 10 },
  item: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: ob.cardBorder,
    borderRadius: 16,
    paddingHorizontal: 15,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemUnchecked: {
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(30,58,68,0.22)',
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxEmpty: {
    borderWidth: 2,
    borderColor: 'rgba(30,58,68,0.2)',
  },
  checkboxMark: {
    fontFamily: fonts.uiExtraBold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  itemLabel: {
    flex: 1,
    fontFamily: fonts.uiExtraBold,
    fontSize: 14,
    color: ob.ink,
  },
  itemLabelUnchecked: { color: 'rgba(30,58,68,0.55)' },
  itemStat: {
    fontFamily: fonts.uiExtraBold,
    fontSize: 10.5,
    color: ob.accent,
  },
  itemStatUnchecked: { color: ob.inkFaint },
  summary: {
    marginTop: 16,
    backgroundColor: '#E3EFF4',
    borderRadius: 14,
    paddingHorizontal: 15,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  summaryGem: {
    width: 10,
    height: 10,
    borderRadius: 3,
    backgroundColor: '#3D8FA8',
    transform: [{ rotate: '45deg' }],
  },
  summaryText: {
    flex: 1,
    fontFamily: fonts.uiBold,
    fontSize: 11.5,
    lineHeight: 16,
    color: ob.accent,
  },
  summaryStrong: { fontFamily: fonts.uiBlack },
  footer: { paddingHorizontal: 22, paddingTop: 8 },
});
