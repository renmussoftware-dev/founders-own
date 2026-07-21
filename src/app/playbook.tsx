import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useSQLiteContext } from 'expo-sqlite';
import { PLAYBOOK, PLAYBOOK_TOTAL, type PlaybookGroup } from '@/content/playbook';
import { getPlaybookDone, togglePlaybookItem } from '@/logic/playbook';
import { ob } from '@/content/onboarding';
import { feedback } from '@/utils/feedback';
import { colors, fonts } from '@/theme/tokens';

/** Launch Playbook (Act I utility): concrete steps to a shipped, paid, seen app. */
export default function PlaybookScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const db = useSQLiteContext();
  const [done, setDone] = useState<Set<string>>(new Set());

  useFocusEffect(
    useCallback(() => {
      getPlaybookDone(db).then(setDone);
    }, [db])
  );

  async function toggle(id: string) {
    const wasDone = done.has(id);
    const next = await togglePlaybookItem(db, id);
    setDone(new Set(next));
    if (!wasDone) feedback('tap'); // checking off a step is a small win
  }

  const doneCount = done.size;

  return (
    <View style={styles.root}>
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="playbookBg" cx="50%" cy="18%" r="95%">
            <Stop offset="0%" stopColor={ob.darkRadial[0]} />
            <Stop offset="60%" stopColor={ob.darkRadial[1]} />
            <Stop offset="100%" stopColor={ob.darkRadial[2]} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#playbookBg)" />
      </Svg>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 20, paddingBottom: Math.max(insets.bottom, 28) },
        ]}
      >
        <Pressable onPress={() => router.back()} style={styles.closeRow}>
          <Text style={styles.close}>✕</Text>
        </Pressable>

        <Text style={styles.title}>Launch Playbook</Text>
        <Text style={styles.subtitle}>
          The concrete path from zero to your first paying customer. Check things off as you go.
        </Text>
        <Text style={styles.overall}>
          {doneCount} of {PLAYBOOK_TOTAL} done
        </Text>

        {PLAYBOOK.map(group => (
          <Group key={group.id} group={group} done={done} onToggle={toggle} />
        ))}
      </ScrollView>
    </View>
  );
}

function Group({
  group,
  done,
  onToggle,
}: {
  group: PlaybookGroup;
  done: Set<string>;
  onToggle: (id: string) => void;
}) {
  const groupDone = group.items.filter(i => done.has(i.id)).length;
  const complete = groupDone === group.items.length;
  return (
    <View style={styles.group}>
      <View style={styles.groupHeader}>
        <Text style={styles.groupTitle}>{group.title}</Text>
        <Text style={[styles.groupCount, complete && styles.groupCountDone]}>
          {groupDone}/{group.items.length}
        </Text>
      </View>
      <Text style={styles.groupBlurb}>{group.blurb}</Text>
      <View style={styles.items}>
        {group.items.map(item => {
          const checked = done.has(item.id);
          return (
            <Pressable key={item.id} onPress={() => onToggle(item.id)} style={styles.item}>
              <View style={[styles.box, checked && styles.boxChecked]}>
                {checked ? <Text style={styles.check}>✓</Text> : null}
              </View>
              <Text style={[styles.itemLabel, checked && styles.itemLabelDone]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const light = '#EDEAFB';

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#141026' },
  content: { paddingHorizontal: 22 },
  closeRow: { alignSelf: 'flex-end', padding: 6 },
  close: { fontFamily: fonts.uiExtraBold, fontSize: 18, color: 'rgba(237,234,251,0.6)' },
  title: { fontFamily: fonts.uiExtraBold, fontSize: 24, color: light, marginTop: 4 },
  subtitle: {
    fontFamily: fonts.uiBold,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
    marginTop: 8,
  },
  overall: {
    fontFamily: fonts.uiExtraBold,
    fontSize: 11,
    letterSpacing: 0.5,
    color: colors.gold,
    marginTop: 12,
    textTransform: 'uppercase',
  },
  group: {
    backgroundColor: colors.surfaceBottom,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 18,
    padding: 16,
    marginTop: 16,
  },
  groupHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  groupTitle: { fontFamily: fonts.uiExtraBold, fontSize: 16, color: light },
  groupCount: { fontFamily: fonts.uiExtraBold, fontSize: 12, color: colors.textFaint },
  groupCountDone: { color: colors.mintBright },
  groupBlurb: {
    fontFamily: fonts.uiBold,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: 6,
  },
  items: { marginTop: 6 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 9 },
  box: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: 'rgba(237,234,251,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxChecked: { backgroundColor: colors.mint, borderColor: colors.mint },
  check: { fontFamily: fonts.uiBlack, fontSize: 12, color: '#0E2418' },
  itemLabel: { flex: 1, fontFamily: fonts.uiBold, fontSize: 13.5, lineHeight: 19, color: light },
  itemLabelDone: {
    color: colors.textFaint,
    textDecorationLine: 'line-through',
  },
});
