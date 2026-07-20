import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { GoldButton, OnboardingProgress } from '@/components/onboarding/shared';
import { HexSeal } from '@/components/ui/HexSeal';
import { ob } from '@/content/onboarding';
import { fonts } from '@/theme/tokens';

/** Onboarding 3/3 — "Unlock the gold tier" verification pitch (design 5a). */
export default function VerificationStep() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const enterApp = () => router.replace('/(tabs)');

  return (
    <View style={styles.root}>
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="obDark" cx="50%" cy="20%" r="95%">
            <Stop offset="0%" stopColor={ob.darkRadial[0]} />
            <Stop offset="60%" stopColor={ob.darkRadial[1]} />
            <Stop offset="100%" stopColor={ob.darkRadial[2]} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#obDark)" />
      </Svg>

      <View style={[styles.content, { paddingTop: insets.top + 24 }]}>
        <OnboardingProgress step={3} />
        <View style={styles.sealWrap}>
          <HexSeal label="$" size={66} />
        </View>
        <Text style={styles.heading}>Unlock the{'\n'}gold tier</Text>
        <Text style={styles.sub}>
          Money milestones verified from real revenue can&rsquo;t be faked — and they look it.
        </Text>

        <View style={styles.benefits}>
          <View style={styles.benefit}>
            <HexSeal label="✓" size={30} />
            <Text style={styles.benefitText}>Gold-sealed milestones on your founder card</Text>
          </View>
          <View style={styles.benefit}>
            <View style={styles.benefitDot}>
              <Text style={styles.benefitDotGlyph}>◆</Text>
            </View>
            <Text style={styles.benefitText}>Revenue chart on your quest board, auto-updated</Text>
          </View>
          <View style={styles.benefit}>
            <View style={[styles.benefitDot, styles.benefitDotMint]}>
              <Text style={styles.benefitDotGlyph}>✦</Text>
            </View>
            <Text style={styles.benefitText}>Read-only. We never touch your money.</Text>
          </View>
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 28) }]}>
        {/* Stripe Connect OAuth lands in Phase 3 — until then both paths enter the app. */}
        <GoldButton label="Connect Stripe" onPress={enterApp} />
        <Pressable onPress={enterApp} style={styles.laterButton}>
          <Text style={styles.laterText}>Later — start with self-report</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#122730' },
  content: { flex: 1, paddingHorizontal: 26 },
  sealWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(251,250,246,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 6,
    marginBottom: 18,
  },
  heading: {
    fontFamily: fonts.uiExtraBold,
    fontSize: 25,
    lineHeight: 31,
    color: ob.darkText,
    textAlign: 'center',
  },
  sub: {
    fontFamily: fonts.uiBold,
    fontSize: 13,
    lineHeight: 20,
    color: ob.darkTextSoft,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 22,
  },
  benefits: { gap: 10 },
  benefit: {
    backgroundColor: ob.darkCard,
    borderWidth: 1,
    borderColor: ob.darkCardBorder,
    borderRadius: 16,
    paddingHorizontal: 15,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#3D8098',
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitDotMint: {
    borderRadius: 10,
    backgroundColor: '#3E7C52',
  },
  benefitDotGlyph: {
    fontFamily: fonts.uiBlack,
    fontSize: 12,
    color: '#FFFFFF',
  },
  benefitText: {
    flex: 1,
    fontFamily: fonts.uiBold,
    fontSize: 12.5,
    lineHeight: 18,
    color: ob.darkText,
  },
  footer: {
    paddingHorizontal: 26,
    paddingTop: 8,
    gap: 12,
  },
  laterButton: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  laterText: {
    fontFamily: fonts.uiExtraBold,
    fontSize: 13,
    color: ob.darkTextSoft,
  },
});
