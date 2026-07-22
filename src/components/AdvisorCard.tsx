import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { type AdvisorInsight } from '@/logic/advisor';
import { colors, fonts, stats } from '@/theme/tokens';

/**
 * The AI advisor card on the Today board (SPEC #4). Pro feature under model B:
 * for non-Pro users (when gating is on) it renders a locked teaser that routes
 * to the paywall; for Pro users it shows the rules-based bottleneck read plus
 * the weekly LLM deep-dive.
 */
export function AdvisorCard({
  insight,
  isPro,
  deepDiveStatus = null,
  deepDiveText = null,
  deepDiveLoading = false,
  onDeepDive,
  locked,
  onUnlock,
}: {
  insight?: AdvisorInsight | null;
  isPro?: boolean;
  deepDiveStatus?: string | null;
  deepDiveText?: string | null;
  deepDiveLoading?: boolean;
  onDeepDive?: () => void;
  locked?: boolean;
  onUnlock?: () => void;
}) {
  if (locked) {
    return (
      <LinearGradient colors={[colors.surfaceTop, colors.surfaceBottom]} style={styles.card}>
        <View style={styles.header}>
          <View style={styles.spark}>
            <Text style={styles.sparkText}>✦</Text>
          </View>
          <Text style={styles.label}>YOUR ADVISOR</Text>
          <View style={styles.proBadge}>
            <Text style={styles.proText}>PRO</Text>
          </View>
        </View>
        <Text style={styles.headline}>See the one bottleneck holding your revenue back</Text>
        <Text style={styles.detail}>
          A weekly AI read of your real numbers — the highest-leverage fix for where your
          business is right now.
        </Text>
        <Pressable onPress={onUnlock} style={styles.deepDive}>
          <Text style={styles.deepDiveText}>Unlock with Pro</Text>
          <Text style={styles.deepDiveHint}>→</Text>
        </Pressable>
      </LinearGradient>
    );
  }

  if (!insight) return null;
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

      <Pressable onPress={onDeepDive} disabled={deepDiveLoading} style={styles.deepDive}>
        <Text style={styles.deepDiveText}>
          {deepDiveLoading
            ? 'Reading your week…'
            : deepDiveText
              ? 'Refresh this week’s AI deep-dive'
              : isPro
                ? 'Get this week’s AI deep-dive'
                : 'Weekly AI deep-dive'}
        </Text>
        <Text style={styles.deepDiveHint}>
          {deepDiveLoading ? '···' : isPro || deepDiveText ? '→' : 'PRO'}
        </Text>
      </Pressable>
      {deepDiveText ? (
        <View style={styles.readBox}>
          <Text style={styles.read}>{deepDiveText}</Text>
        </View>
      ) : null}
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
  proBadge: {
    backgroundColor: colors.gold,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  proText: { fontFamily: fonts.uiBlack, fontSize: 9.5, letterSpacing: 0.5, color: '#3A2A0C' },
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
  readBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(164,147,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(164,147,255,0.18)',
  },
  read: {
    fontFamily: fonts.uiBold,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textPrimary,
  },
  status: {
    fontFamily: fonts.uiBold,
    fontSize: 11,
    color: colors.textFaint,
    marginTop: 8,
  },
});
