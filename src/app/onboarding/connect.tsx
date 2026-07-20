import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { ConnectRevenueCat } from '@/components/ConnectRevenueCat';
import { OnboardingProgress } from '@/components/onboarding/shared';
import { ob } from '@/content/onboarding';
import { logOnboardingComplete } from '@/utils/analytics';

/** Onboarding 2/2 — connect RevenueCat (or skip to self-report). */
export default function ConnectStep() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const finish = (dest: '/unlock' | '/(tabs)') => {
    logOnboardingComplete();
    router.replace(dest);
  };

  return (
    <View style={styles.root}>
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="obConnect" cx="50%" cy="20%" r="95%">
            <Stop offset="0%" stopColor={ob.darkRadial[0]} />
            <Stop offset="60%" stopColor={ob.darkRadial[1]} />
            <Stop offset="100%" stopColor={ob.darkRadial[2]} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#obConnect)" />
      </Svg>

      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 24, paddingBottom: Math.max(insets.bottom, 28) }]}>
        <OnboardingProgress step={2} />
        {/* Connected → celebrate + pitch Pro; skipped → straight into the app. */}
        <ConnectRevenueCat onConnected={() => finish('/unlock')} onSkip={() => finish('/(tabs)')} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#122730' },
  content: { paddingHorizontal: 26, flexGrow: 1 },
});
