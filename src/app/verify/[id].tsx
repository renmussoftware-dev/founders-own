import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useSQLiteContext } from 'expo-sqlite';
import { GoldButton } from '@/components/onboarding/shared';
import { HexSeal } from '@/components/ui/HexSeal';
import { CHAPTERS_BY_ID } from '@/content/questline';
import { ob } from '@/content/onboarding';
import { markChapterVerified } from '@/logic/verification';
import { fonts } from '@/theme/tokens';

/**
 * Contextual verification prompt at a money chapter (SPEC §8 step 3 reused,
 * Phase 3). Real Stripe Connect OAuth is pending credentials — "Connect
 * Stripe" is wired to the stub, and a dev-only action exercises the verified
 * trophy path end-to-end.
 */
export default function VerifyChapter() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const db = useSQLiteContext();
  const chapter = id ? CHAPTERS_BY_ID[id] : undefined;

  async function connectStripe() {
    // TODO: launch Stripe Connect OAuth (read-only) once credentials exist.
    // The webhook it returns through calls markChapterVerified server-side.
    if (__DEV__ && id) {
      await markChapterVerified(db, id, 'stripe', { simulated: true });
      router.replace(`/milestone/${id}`);
    }
  }

  return (
    <View style={styles.root}>
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="vDark" cx="50%" cy="20%" r="95%">
            <Stop offset="0%" stopColor={ob.darkRadial[0]} />
            <Stop offset="60%" stopColor={ob.darkRadial[1]} />
            <Stop offset="100%" stopColor={ob.darkRadial[2]} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#vDark)" />
      </Svg>

      <View style={[styles.content, { paddingTop: insets.top + 24 }]}>
        <Pressable onPress={() => router.back()} style={styles.closeRow}>
          <Text style={styles.close}>✕</Text>
        </Pressable>
        <View style={styles.sealWrap}>
          <HexSeal label="$" size={66} />
        </View>
        <Text style={styles.hed}>Verify {chapter?.title ?? 'this milestone'}</Text>
        <Text style={styles.sub}>
          Connect Stripe read-only and we&rsquo;ll confirm this from your real revenue — then
          it&rsquo;s gold, and un-fakeable.
        </Text>

        <View style={styles.benefits}>
          <Benefit glyph="✓" text="Gold hexagon seal on your founder card" gold />
          <Benefit glyph="◆" text="Revenue chart on your quest board, auto-updated" />
          <Benefit glyph="✦" text="Read-only. We never touch your money." mint />
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 28) }]}>
        <GoldButton
          label={__DEV__ ? 'Connect Stripe (dev: simulate)' : 'Connect Stripe'}
          onPress={connectStripe}
        />
        <Pressable onPress={() => router.back()} style={styles.later}>
          <Text style={styles.laterText}>Later — keep it self-reported</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Benefit({
  glyph,
  text,
  gold,
  mint,
}: {
  glyph: string;
  text: string;
  gold?: boolean;
  mint?: boolean;
}) {
  return (
    <View style={styles.benefit}>
      <View
        style={[
          styles.benefitDot,
          gold && styles.dotGold,
          mint && styles.dotMint,
        ]}
      >
        <Text style={styles.benefitGlyph}>{glyph}</Text>
      </View>
      <Text style={styles.benefitText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#122730' },
  content: { flex: 1, paddingHorizontal: 26 },
  closeRow: { alignSelf: 'flex-end', padding: 6 },
  close: { fontFamily: fonts.uiExtraBold, fontSize: 18, color: 'rgba(251,250,246,0.6)' },
  sealWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(251,250,246,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 4,
    marginBottom: 18,
  },
  hed: {
    fontFamily: fonts.uiExtraBold,
    fontSize: 23,
    lineHeight: 29,
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
  dotGold: { backgroundColor: '#C89441' },
  dotMint: { borderRadius: 10, backgroundColor: '#3E7C52' },
  benefitGlyph: { fontFamily: fonts.uiBlack, fontSize: 12, color: '#FFFFFF' },
  benefitText: { flex: 1, fontFamily: fonts.uiBold, fontSize: 12.5, lineHeight: 18, color: ob.darkText },
  footer: { paddingHorizontal: 26, gap: 12 },
  later: { height: 48, alignItems: 'center', justifyContent: 'center' },
  laterText: { fontFamily: fonts.uiExtraBold, fontSize: 13, color: ob.darkTextSoft },
});
