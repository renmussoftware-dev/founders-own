import { useId } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Polygon, Stop } from 'react-native-svg';
import { colors, fonts, hexagonPoints } from '@/theme/tokens';

/**
 * Gold hexagon seal for verified milestones (SPEC §11a).
 * Renders the SPEC clip-path polygon in gold gradient with a label
 * (e.g. "$1K") centered inside.
 */
export function HexSeal({ label, size = 64 }: { label: string; size?: number }) {
  // Unique gradient id per instance. A shared static id collides when several
  // seals are in the DOM at once (web react-native-svg resolves url(#id) to the
  // wrong/empty def, leaving the hexagon unfilled so the dark label disappears).
  const gradId = `sealGold-${useId().replace(/:/g, '')}`;
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.gold} />
            <Stop offset="0.55" stopColor={colors.goldMid} />
            <Stop offset="1" stopColor={colors.goldDeep} />
          </LinearGradient>
        </Defs>
        <Polygon points={hexagonPoints} fill={`url(#${gradId})`} />
        <Polygon
          points={hexagonPoints}
          fill="none"
          stroke="rgba(255,255,255,0.35)"
          strokeWidth={2}
        />
      </Svg>
      <View style={StyleSheet.absoluteFill}>
        <View style={styles.center}>
          <Text style={[styles.label, { fontSize: size * 0.28 }]}>{label}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: fonts.uiBlack,
    color: '#3A2A0E',
  },
});
