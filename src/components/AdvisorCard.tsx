import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { type AdvisorInsight } from '@/logic/advisor';
import { colors, fonts, stats } from '@/theme/tokens';

/**
 * The AI advisor card on the Today board (SPEC #4). Shows the free, rules-based
 * read of the founder's bottleneck; the weekly LLM deep-dive is the Pro upsell.
 */
export function AdvisorCard({
  insight,
  isPro,
  deepDiveStatus,
  onDeepDive,
}: {
  insight: AdvisorInsight;
  isPro: boolean;
  deepDiveStatus: string | null;
  onDeepDive: () => void;
}) {
  const focusTone = insight.focusStat ? stats[insight.focusStat].tone.tint : colors.violetBright;

  return (
    <LinearGradient colors={[colors.surfaceTop, colors.surfaceBottom]} style={styles.card}>
      <View style={styles.header}>
        <View style={styles.spark}>
          <Text style={styles.sparkText}>✦</Text>
        </View>
        <Text style={styles.label}>YOUR ADVISOR</Text>
        <View style={[styles.focusChip, { borderColor: focusTone }]}>
          <Text style={[styles.focusText, { color: focusTone }]}>{insight.focusLabel}</Text>
        </View>
      </View>

      <Text style={styles.headline}>{insight.headline}</Text>
      <Text style={styles.detail}>{insight.detail}</Text>

      <Pressable onPress={onDeepDive} style={styles.deepDive}>
        <Text style={styles.deepDiveText}>
          {isPro ? 'Get this week’s AI deep-dive' : 'Weekly AI deep-dive'}
        </Text>
        <Text style={styles.deepDiveHint}>{isPro ? '→' : 'PRO'}</Text>
      </Pressable>
      {deepDiveStatus ? <Text style={styles.status}>{deepDiveStatus}</Text> : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    padding: 16,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  spark: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(164,147,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkText: { fontFamily: fonts.uiBlack, fontSize: 11, color: colors.violetBright },
  label: {
    flex: 1,
    fontFamily: fonts.uiExtraBold,
    fontSize: 11,
    letterSpacing: 1,
    color: colors.textSecondary,
  },
  focusChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  focusText: { fontFamily: fonts.uiExtraBold, fontSize: 10 },
  headline: {
    fontFamily: fonts.uiExtraBold,
    fontSize: 16,
    lineHeight: 21,
    color: colors.textPrimary,
    marginTop: 11,
  },
  detail: {
    fontFamily: fonts.uiBold,
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.textSecondary,
    marginTop: 7,
  },
  deepDive: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deepDiveText: { fontFamily: fonts.uiExtraBold, fontSize: 12.5, color: colors.violetBright },
  deepDiveHint: {
    fontFamily: fonts.uiExtraBold,
    fontSize: 10,
    letterSpacing: 1,
    color: colors.gold,
  },
  status: {
    fontFamily: fonts.uiBold,
    fontSize: 11,
    color: colors.textFaint,
    marginTop: 8,
  },
});
