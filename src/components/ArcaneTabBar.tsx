import { type BottomTabBarProps } from 'expo-router/js-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '@/theme/tokens';

const GLYPHS: Record<string, string> = {
  index: '⌂',
  questline: '◆',
  character: '✦',
  journal: '✎',
};

/**
 * 4-tab Arcane bottom bar (SPEC §11a): active tab is a raised violet
 * gradient circle; inactive tabs are low-opacity glyphs.
 */
export function ArcaneTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = (options.title ?? route.name) as string;
        const focused = state.index === index;
        const glyph = GLYPHS[route.name] ?? '•';

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <Pressable key={route.key} onPress={onPress} style={styles.tab}>
            {focused ? (
              <LinearGradient
                colors={[colors.violetBright, colors.violet, '#4F3EAE']}
                style={styles.activeCircle}
              >
                <Text style={styles.activeGlyph}>{glyph}</Text>
              </LinearGradient>
            ) : (
              <Text style={styles.inactiveGlyph}>{glyph}</Text>
            )}
            <Text style={[styles.label, focused && styles.labelActive]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: '#1A1633',
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
    paddingTop: 10,
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  activeCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -18,
    shadowColor: colors.violet,
    shadowOpacity: 0.6,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  activeGlyph: {
    fontSize: 20,
    color: colors.textPrimary,
  },
  inactiveGlyph: {
    fontSize: 20,
    lineHeight: 26,
    color: colors.textFaint,
  },
  label: {
    fontFamily: fonts.uiBold,
    fontSize: 10,
    color: colors.textFaint,
  },
  labelActive: {
    color: colors.textPrimary,
  },
});
