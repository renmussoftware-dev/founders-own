import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated from 'react-native-reanimated';
import { HexSeal } from '@/components/ui/HexSeal';
import { type QuestLogRow } from '@/logic/dailyQuests';
import { useFloatUp, usePopIn, useRingPulse, useTwinkle } from '@/theme/motion';
import { celebration, colors, fonts, questCardTints, stats } from '@/theme/tokens';

interface Props {
  quest: QuestLogRow;
  /** True right after completion — fires the mint celebration state (design 7d). */
  celebrating?: boolean;
  /** Shown on the last pending card: "One left — finish for a perfect day". */
  subtitle?: string;
  /** Data-aware "why this quest" line (SPEC #2). */
  context?: string;
  onComplete?: (quest: QuestLogRow) => void;
}

export function QuestCard({ quest, celebrating, subtitle, context, onComplete }: Props) {
  const done = quest.completed_at !== null;
  const isChain = quest.slot === 'chain';

  if (celebrating) return <CelebratingCard quest={quest} />;

  if (done) {
    return (
      <View style={styles.wrap}>
        <LinearGradient
          colors={questCardTints[quest.stat].gradient}
          style={[styles.card, { borderColor: questCardTints[quest.stat].border }, styles.doneCard]}
        >
          <HexSeal label="✓" size={44} />
          <View style={styles.body}>
            <Text style={[styles.title, styles.titleDone]}>{quest.title}</Text>
            <Text style={styles.meta}>
              Done ·{' '}
              {new Date(quest.completed_at!.replace(' ', 'T') + 'Z').toLocaleTimeString([], {
                hour: 'numeric',
                minute: '2-digit',
              })}
            </Text>
          </View>
          <Text style={styles.doneXp}>+{quest.xp} ✓</Text>
        </LinearGradient>
      </View>
    );
  }

  const tint = questCardTints[quest.stat];
  return (
    <Pressable onPress={() => onComplete?.(quest)} style={styles.wrap}>
      <LinearGradient
        colors={tint.gradient}
        style={[styles.card, { borderColor: isChain ? colors.violetBright : tint.border }]}
      >
        <LinearGradient colors={stats[quest.stat].tone.gradient} style={styles.statTile}>
          <Text style={styles.statTileGlyph}>{isChain ? '⛓' : '◆'}</Text>
        </LinearGradient>
        <View style={styles.body}>
          <Text style={styles.title}>{quest.title}</Text>
          {subtitle || context ? (
            <Text style={[styles.meta, isChain && styles.metaChain]}>{subtitle ?? context}</Text>
          ) : null}
        </View>
        <View style={[styles.xpChip, { backgroundColor: tint.chipBg }]}>
          <Text style={[styles.xpChipText, { color: tint.chipText }]}>+{quest.xp}</Text>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

function CelebratingCard({ quest }: { quest: QuestLogRow }) {
  const ringStyle = useRingPulse();
  const popStyle = usePopIn();
  const floatStyle = useFloatUp(true);
  const twinkle1 = useTwinkle(0);
  const twinkle2 = useTwinkle(600);
  const twinkle3 = useTwinkle(1100);

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.pulseHalo, ringStyle]} pointerEvents="none" />
      <LinearGradient
        colors={celebration.gradient}
        style={[styles.card, styles.celebrateCard]}
      >
        <Animated.View style={popStyle}>
          <View style={styles.mintCheck}>
            <Text style={styles.mintCheckMark}>✓</Text>
          </View>
        </Animated.View>
        <View style={styles.body}>
          <Text style={styles.title}>{quest.title}</Text>
          <Text style={styles.celebrateMeta}>Quest complete!</Text>
        </View>
      </LinearGradient>
      <Animated.View style={[styles.floatChip, floatStyle]} pointerEvents="none">
        <LinearGradient colors={celebration.chipGradient} style={styles.floatChipInner}>
          <Text style={styles.floatChipText}>
            +{quest.xp} {stats[quest.stat].label} XP
          </Text>
        </LinearGradient>
      </Animated.View>
      <Animated.Text style={[styles.sparkle, { top: -6, left: 38, color: colors.gold }, twinkle1]}>
        ✦
      </Animated.Text>
      <Animated.Text style={[styles.sparkle, { bottom: -4, right: 70, color: '#7FD0A0', fontSize: 10 }, twinkle2]}>
        ✦
      </Animated.Text>
      <Animated.Text style={[styles.sparkle, { top: 12, right: -6, color: '#C9BDFF', fontSize: 9 }, twinkle3]}>
        ✦
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'relative' },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  doneCard: { opacity: 0.55 },
  celebrateCard: {
    borderWidth: 2,
    borderColor: celebration.border,
  },
  pulseHalo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: celebration.border,
  },
  body: { flex: 1, minWidth: 0 },
  title: {
    fontFamily: fonts.uiExtraBold,
    fontSize: 13.5,
    lineHeight: 18,
    color: colors.textPrimary,
  },
  titleDone: {
    textDecorationLine: 'line-through',
    textDecorationColor: 'rgba(237,234,251,0.4)',
  },
  meta: {
    fontFamily: fonts.uiBold,
    fontSize: 11,
    color: 'rgba(237,234,251,0.5)',
    marginTop: 2,
  },
  metaChain: { color: colors.violetBright },
  celebrateMeta: {
    fontFamily: fonts.uiBold,
    fontSize: 11,
    color: '#7FD0A0',
    marginTop: 2,
  },
  doneXp: {
    fontFamily: fonts.uiExtraBold,
    fontSize: 11,
    color: 'rgba(237,234,251,0.4)',
  },
  statTile: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statTileGlyph: {
    fontFamily: fonts.uiBlack,
    fontSize: 18,
    color: '#14102E',
  },
  mintCheck: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: celebration.check[1],
    borderWidth: 3,
    borderColor: 'rgba(237,234,251,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mintCheckMark: {
    fontFamily: fonts.uiBlack,
    fontSize: 19,
    color: celebration.chipText,
  },
  xpChip: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  xpChipText: {
    fontFamily: fonts.uiExtraBold,
    fontSize: 11,
  },
  floatChip: {
    position: 'absolute',
    top: -14,
    right: 14,
  },
  floatChipInner: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  floatChipText: {
    fontFamily: fonts.uiExtraBold,
    fontSize: 12,
    color: celebration.chipText,
  },
  sparkle: {
    position: 'absolute',
    fontFamily: fonts.uiExtraBold,
    fontSize: 13,
  },
});
