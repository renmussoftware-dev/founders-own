import { StyleSheet, View, type ViewProps } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { colors } from '@/theme/tokens';

/**
 * Full-screen Arcane radial background: #2A2450 → #1C1838 (55%) → #120F26.
 * Wrap every dark-theme screen in this.
 */
export function ArcaneBackground({ children, style, ...rest }: ViewProps) {
  return (
    <View style={[styles.root, style]} {...rest}>
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="arcane" cx="50%" cy="30%" r="90%">
            <Stop offset="0%" stopColor={colors.bgRadial[0]} />
            <Stop offset="55%" stopColor={colors.bgRadial[1]} />
            <Stop offset="100%" stopColor={colors.bgRadial[2]} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#arcane)" />
      </Svg>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgDeep,
  },
});
