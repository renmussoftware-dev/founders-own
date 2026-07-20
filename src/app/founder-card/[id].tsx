import { useEffect, useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSQLiteContext } from 'expo-sqlite';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { FounderCard } from '@/components/FounderCard';
import { buildFounderCardData, type FounderCardData } from '@/logic/founderCard';
import { useStore } from '@/store/useStore';
import { colors, fonts } from '@/theme/tokens';

/** Shareable founder card screen (design 1c / §10) with a 9:16 story toggle. */
export default function FounderCardScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const db = useSQLiteContext();
  const character = useStore(s => s.character);
  const [data, setData] = useState<FounderCardData | null>(null);
  const [story, setStory] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const cardRef = useRef<View>(null);

  useEffect(() => {
    if (id && character) buildFounderCardData(db, character, id).then(setData);
  }, [db, id, character]);

  async function onShare() {
    try {
      const uri = await captureRef(cardRef, { format: 'png', quality: 1 });
      if (Platform.OS === 'web') {
        // Web can't hand a file to a native share sheet — surface the capture instead.
        setStatus('Card image captured. Native builds open the share sheet here.');
        return;
      }
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        setStatus('Sharing is not available on this device.');
      }
    } catch {
      setStatus('Could not capture the card. Try again.');
    }
  }

  if (!data) return <View style={styles.root} />;

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}>
        <Text style={styles.kicker}>MILESTONE REACHED</Text>

        <View style={styles.toggle}>
          {(['Post', 'Story'] as const).map((label, i) => {
            const active = (i === 1) === story;
            return (
              <Pressable key={label} onPress={() => setStory(i === 1)} style={styles.toggleBtn}>
                <Text style={[styles.toggleText, active && styles.toggleTextActive]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View ref={cardRef} collapsable={false} style={story ? styles.storyFrame : undefined}>
          <FounderCard data={data} story={story} />
        </View>

        <Text style={styles.tagline}>Un-fakeable. Pulled straight from your revenue.</Text>
        {status ? <Text style={styles.status}>{status}</Text> : null}
      </ScrollView>

      <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, 32) }]}>
        <Pressable onPress={onShare}>
          <LinearGradient colors={['#E0BE72', '#9A7430']} style={styles.shareBtn}>
            <Text style={styles.shareText}>Share founder card</Text>
          </LinearGradient>
        </Pressable>
        <Pressable onPress={() => router.replace('/(tabs)/journal')} style={styles.keepBtn}>
          <Text style={styles.keepText}>Keep it in the journal</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#141210' },
  content: { paddingHorizontal: 24, paddingBottom: 20 },
  kicker: {
    fontFamily: fonts.uiExtraBold,
    fontSize: 11,
    letterSpacing: 3,
    color: 'rgba(250,249,245,0.45)',
    textAlign: 'center',
    marginBottom: 16,
  },
  toggle: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: 'rgba(250,249,245,0.08)',
    borderRadius: 999,
    padding: 4,
    marginBottom: 20,
  },
  toggleBtn: { paddingHorizontal: 18, paddingVertical: 7 },
  toggleText: { fontFamily: fonts.uiExtraBold, fontSize: 12, color: 'rgba(250,249,245,0.5)' },
  toggleTextActive: { color: '#141210' },
  storyFrame: {
    aspectRatio: 9 / 16,
    justifyContent: 'center',
    backgroundColor: '#141210',
  },
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
  shareBtn: {
    height: 52,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
