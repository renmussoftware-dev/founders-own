import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { ConnectRevenueCat } from '@/components/ConnectRevenueCat';
import { ob } from '@/content/onboarding';
import { fonts } from '@/theme/tokens';

/** Standalone Connect-RevenueCat modal (re-connect / from the dashboard). */
export default function ConnectModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const done = () => router.back();

  return (
    <View style={styles.root}>
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="connectModal" cx="50%" cy="20%" r="95%">
            <Stop offset="0%" stopColor={ob.darkRadial[0]} />
            <Stop offset="60%" stopColor={ob.darkRadial[1]} />
            <Stop offset="100%" stopColor={ob.darkRadial[2]} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#connectModal)" />
      </Svg>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 20, paddingBottom: Math.max(insets.bottom, 28) },
        ]}
      >
        <Pressable onPress={done} style={styles.closeRow}>
          <Text style={styles.close}>✕</Text>
        </Pressable>
        <ConnectRevenueCat onConnected={done} onSkip={done} skipLabel="Not now" />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#122730' },
  content: { paddingHorizontal: 26, flexGrow: 1 },
  closeRow: { alignSelf: 'flex-end', padding: 6 },
  close: { fontFamily: fonts.uiExtraBold, fontSize: 18, color: 'rgba(251,250,246,0.6)' },
});
