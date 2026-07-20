import { useEffect, useRef, useState } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSQLiteContext } from 'expo-sqlite';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { WrappedCard } from '@/components/WrappedCard';
import { useEnsureCharacter } from '@/hooks/useEnsureCharacter';
import { buildWrappedData, type WrappedData } from '@/logic/wrapped';
import { useStore } from '@/store/useStore';
import { colors, fonts } from '@/theme/tokens';

/** Founder Wrapped — shareable journey recap (SPEC #3). */
export default function WrappedScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const db = useSQLiteContext();
  const { character, loaded } = useEnsureCharacter();
  const overview = useStore(s => s.rcOverview);
  const [data, setData] = useState<WrappedData | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const cardRef = useRef<View>(null);

  useEffect(() => {
    if (character) buildWrappedData(db, character, overview).then(setData);
  }, [db, character, overview]);

  async function onShare() {
    try {
      const uri = await captureRef(cardRef, { format: 'png', quality: 1 });
      if (Platform.OS === 'web') {
        setStatus('Card image captured. Native builds open the share sheet here.');
        return;
      }
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri);
      else setStatus('Sharing is not available on this device.');
    } catch {
      setStatus('Could not capture the card. Try again.');
    }
  }

  if (loaded && !character) return <Redirect href="/onboarding" />;
  if (!data) return <View style={styles.root} />;

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}>
        <Pressable onPress={() => router.back()} style={styles.closeRow}>
          <Text style={styles.close}>✕</Text>
        </Pressable>
        <View ref={cardRef} collapsable={false}>
          <WrappedCard data={data} />
        </View>
        <Text style={styles.tagline}>Every day, written down. This is the record.</Text>
        {status ? <Text style={styles.status}>{status}</Text> : null}
      </ScrollView>
      <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, 32) }]}>
        <Pressable onPress={onShare}>
          <LinearGradient colors={[colors.gold, colors.goldMid]} style={styles.shareBtn}>
            <Text style={styles.shareText}>Share your story</Text>
          </LinearGradient>
        </Pressable>
        <Pressable onPress={() => router.back()} style={styles.keepBtn}>
          <Text style={styles.keepText}>Back to journal</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#141210' },
  content: { paddingHorizontal: 24, paddingBottom: 20 },
  closeRow: { alignSelf: 'flex-end', padding: 6, marginBottom: 6 },
  close: { fontFamily: fonts.uiExtraBold, fontSize: 18, color: 'rgba(250,249,245,0.6)' },
  tagline: {
    fontFamily: fonts.serifItalic,
    fontSize: 13,
    color: 'rgba(250,249,245,0.5)',
    textAlign: 'center',
    marginTop: 18,
  },
  status: {
    fontFamily: fonts.uiBold,
    fontSize: 12,
    color: 'rgba(250,249,245,0.7)',
    textAlign: 'center',
    marginTop: 12,
  },
  actions: { paddingHorizontal: 24, gap: 10 },
  shareBtn: { height: 52, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  shareText: { fontFamily: fonts.uiExtraBold, fontSize: 16, color: '#FFFDF5' },
  keepBtn: {
    height: 52,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(250,249,245,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keepText: { fontFamily: fonts.uiExtraBold, fontSize: 15, color: 'rgba(250,249,245,0.75)' },
});
