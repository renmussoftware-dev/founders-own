import { StyleSheet, View, type ViewProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius } from '@/theme/tokens';

/**
 * Arcane surface card (SPEC §11a): vertical #2C2652→#231E42 gradient,
 * 1px light border, inner top highlight, soft drop shadow.
 */
export function SurfaceCard({ children, style, ...rest }: ViewProps) {
  return (
    <View style={[styles.shadow, style]} {...rest}>
      <LinearGradient
        colors={[colors.surfaceTop, colors.surfaceBottom]}
        style={styles.card}
      >
        <View style={styles.topHighlight} />
        {children}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    borderRadius: radius.card,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  card: {
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    overflow: 'hidden',
    padding: 16,
  },
  topHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(237,234,251,0.12)',
  },
});
