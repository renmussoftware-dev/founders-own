import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts, radius, stats, type StatKey } from '@/theme/tokens';

/** XP needed per level; placeholder curve until the leveling pass (SPEC §13). */
export const XP_PER_LEVEL = 1000;

function formatXp(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : String(n);
}

/**
 * Character-sheet stat row (SPEC §5): jewel-tone initial tile, name,
 * LV.n badge, gradient progress bar, XP fraction.
 */
export function StatRow({ stat, level, xp }: { stat: StatKey; level: number; xp: number }) {
  const { label, initial, tone } = stats[stat];
  const progress = Math.min(1, (xp % XP_PER_LEVEL) / XP_PER_LEVEL);

  return (
    <View style={styles.row}>
      <LinearGradient colors={tone.gradient} style={styles.tile}>
        <Text style={styles.tileInitial}>{initial}</Text>
      </LinearGradient>
      <View style={styles.body}>
        <View style={styles.header}>
          <Text style={styles.name}>{label}</Text>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>LV.{level}</Text>
          </View>
          <Text style={[styles.xpText, { color: tone.tint }]}>
            {formatXp(xp % XP_PER_LEVEL)}/{formatXp(XP_PER_LEVEL)}
          </Text>
        </View>
        <View style={styles.track}>
          <LinearGradient
            colors={tone.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.fill, { width: `${Math.max(2, progress * 100)}%` }]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  tile: {
    width: 40,
    height: 40,
    borderRadius: radius.cardSmall - 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileInitial: {
    fontFamily: fonts.uiBlack,
    fontSize: 18,
    color: colors.textPrimary,
  },
  body: { flex: 1, gap: 6 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontFamily: fonts.uiExtraBold,
    fontSize: 14,
    color: colors.textPrimary,
    flex: 1,
  },
  levelBadge: {
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 1,
  },
  levelText: {
    fontFamily: fonts.uiBold,
    fontSize: 10,
    color: colors.textSecondary,
  },
  xpText: {
    fontFamily: fonts.uiBold,
    fontSize: 11,
  },
  track: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0,0,0,0.35)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
  },
});
