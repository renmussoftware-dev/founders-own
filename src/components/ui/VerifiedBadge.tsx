import { Platform, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '@/theme/tokens';

/**
 * Bordered tracked-caps VERIFIED badge (SPEC §11a). Gold, monospace.
 */
export function VerifiedBadge({ label = 'VERIFIED' }: { label?: string }) {
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    borderColor: colors.goldMid,
    backgroundColor: 'rgba(240,205,121,0.1)',
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
    fontSize: 10,
    letterSpacing: 2,
    color: colors.gold,
  },
});
