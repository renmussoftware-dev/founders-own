import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ob } from '@/content/onboarding';
import { fonts } from '@/theme/tokens';

/** Progress bar across onboarding steps (V1: 2 steps). */
export function OnboardingProgress({ step, total = 2 }: { step: number; total?: number }) {
  return (
    <View style={progressStyles.row}>
      {Array.from({ length: total }, (_, i) => i + 1).map(n =>
        n <= step ? (
          <LinearGradient
            key={n}
            colors={[...ob.progressActive]}
            style={progressStyles.segment}
          />
        ) : (
          <View key={n} style={[progressStyles.segment, progressStyles.inactive]} />
        )
      )}
    </View>
  );
}

const progressStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 5, marginBottom: 22 },
  segment: { flex: 1, height: 5, borderRadius: 3 },
  inactive: { backgroundColor: ob.progressInactive },
});

/** Raised teal CTA button (design 4a/4b). */
export function TealButton({
  label,
  onPress,
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={[{ opacity: disabled ? 0.45 : 1 }, style]}>
      <LinearGradient colors={[ob.ctaTop, ob.ctaBottom]} style={ctaStyles.button}>
        <Text style={ctaStyles.label}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

/** Raised gold CTA (design 5a "Connect Stripe"). */
export function GoldButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress}>
      <LinearGradient colors={[ob.goldTop, ob.goldBottom]} style={[ctaStyles.button, ctaStyles.gold]}>
        <Text style={ctaStyles.label}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

const ctaStyles = StyleSheet.create({
  button: {
    height: 54,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 4,
    borderBottomColor: ob.ctaEdge,
  },
  gold: {
    borderBottomColor: ob.goldEdge,
  },
  label: {
    fontFamily: fonts.uiExtraBold,
    fontSize: 15,
    color: '#FFFFFF',
    textShadowColor: 'rgba(18,39,48,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
