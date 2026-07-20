import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { HexSeal } from '@/components/ui/HexSeal';
import { saveRcCredentials } from '@/integrations/rcCredentials';
import { validateKey, type RcProject } from '@/integrations/revenuecat';
import { useStore } from '@/store/useStore';
import { colors, fonts } from '@/theme/tokens';

/**
 * Connect-RevenueCat panel: paste a read-only API key → validate → pick the
 * project that is "this founder's app" → store it. Used in onboarding and as a
 * standalone re-connect / contextual-verify entry point. Renders on a dark
 * background supplied by the wrapper.
 */
export function ConnectRevenueCat({
  onConnected,
  onSkip,
  skipLabel = 'Later — self-report for now',
}: {
  onConnected: () => void;
  onSkip?: () => void;
  skipLabel?: string;
}) {
  const setRcConnection = useStore(s => s.setRcConnection);
  const [apiKey, setApiKey] = useState('');
  const [phase, setPhase] = useState<'input' | 'pick'>('input');
  const [projects, setProjects] = useState<RcProject[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onValidate() {
    if (!apiKey.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const found = await validateKey(apiKey);
      if (found.length === 0) {
        setError('That key can’t see any projects. Use a read-only key with metrics access.');
      } else if (found.length === 1) {
        await connect(found[0]);
      } else {
        setProjects(found);
        setPhase('pick');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not validate that key.');
    } finally {
      setBusy(false);
    }
  }

  async function connect(project: RcProject) {
    setBusy(true);
    await saveRcCredentials({ apiKey: apiKey.trim(), projectId: project.id, projectName: project.name });
    setRcConnection({ connected: true, projectName: project.name });
    setBusy(false);
    onConnected();
  }

  return (
    <View style={styles.root}>
      <View style={styles.sealWrap}>
        <HexSeal label="$" size={64} />
      </View>

      {phase === 'input' ? (
        <>
          <Text style={styles.hed}>Connect RevenueCat</Text>
          <Text style={styles.sub}>
            Paste a read-only API key. We read your revenue metrics to verify your
            milestones — never your customers, never your money.
          </Text>

          <TextInput
            value={apiKey}
            onChangeText={setApiKey}
            placeholder="sk_… (read-only v2 key)"
            placeholderTextColor="rgba(251,250,246,0.4)"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
          />
          <Text style={styles.help}>
            RevenueCat → Project settings → API keys → new <Text style={styles.helpEm}>read-only</Text> v2 key.
          </Text>

          <View style={styles.benefits}>
            <Benefit glyph="✓" text="Gold-verified milestones, pulled from real revenue" gold />
            <Benefit glyph="◆" text="Live MRR + revenue on your quest board" />
            <Benefit glyph="✦" text="Read-only. We never touch your money." mint />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable onPress={onValidate} disabled={busy || !apiKey.trim()}>
            <LinearGradient
              colors={[colors.gold, colors.goldMid]}
              style={[styles.cta, (busy || !apiKey.trim()) && styles.ctaDisabled]}
            >
              <Text style={styles.ctaText}>{busy ? 'Checking…' : 'Connect RevenueCat'}</Text>
            </LinearGradient>
          </Pressable>
        </>
      ) : (
        <>
          <Text style={styles.hed}>Which app?</Text>
          <Text style={styles.sub}>Pick the project you’re growing — this drives your milestones.</Text>
          <View style={styles.projectList}>
            {projects.map(p => (
              <Pressable key={p.id} onPress={() => connect(p)} disabled={busy} style={styles.project}>
                <Text style={styles.projectName}>{p.name}</Text>
                <Text style={styles.projectChevron}>›</Text>
              </Pressable>
            ))}
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </>
      )}

      {onSkip ? (
        <Pressable onPress={onSkip} style={styles.skip}>
          <Text style={styles.skipText}>{skipLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function Benefit({ glyph, text, gold, mint }: { glyph: string; text: string; gold?: boolean; mint?: boolean }) {
  return (
    <View style={styles.benefit}>
      <View style={[styles.benefitDot, gold && styles.dotGold, mint && styles.dotMint]}>
        <Text style={styles.benefitGlyph}>{glyph}</Text>
      </View>
      <Text style={styles.benefitText}>{text}</Text>
    </View>
  );
}

const light = '#FBFAF6';
const softLight = 'rgba(251,250,246,0.65)';

const styles = StyleSheet.create({
  root: { gap: 0 },
  sealWrap: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: 'rgba(251,250,246,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  hed: { fontFamily: fonts.uiExtraBold, fontSize: 24, color: light, textAlign: 'center' },
  sub: {
    fontFamily: fonts.uiBold,
    fontSize: 13,
    lineHeight: 20,
    color: softLight,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 18,
  },
  input: {
    backgroundColor: 'rgba(251,250,246,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(251,250,246,0.18)',
    borderRadius: 14,
    paddingHorizontal: 15,
    paddingVertical: 14,
    fontFamily: fonts.uiBold,
    fontSize: 14,
    color: light,
  },
  help: { fontFamily: fonts.uiBold, fontSize: 11, color: 'rgba(251,250,246,0.5)', marginTop: 8 },
  helpEm: { color: colors.gold },
  benefits: { gap: 10, marginTop: 18 },
  benefit: {
    backgroundColor: 'rgba(251,250,246,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(251,250,246,0.12)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3D8098',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotGold: { backgroundColor: colors.goldMid },
  dotMint: { borderRadius: 9, backgroundColor: '#3E7C52' },
  benefitGlyph: { fontFamily: fonts.uiBlack, fontSize: 11, color: '#FFFFFF' },
  benefitText: { flex: 1, fontFamily: fonts.uiBold, fontSize: 12.5, lineHeight: 17, color: light },
  error: {
    fontFamily: fonts.uiBold,
    fontSize: 12,
    color: '#FF9C9C',
    textAlign: 'center',
    marginTop: 14,
  },
  cta: {
    height: 54,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    borderBottomWidth: 4,
    borderBottomColor: colors.goldDeep,
  },
  ctaDisabled: { opacity: 0.5 },
  ctaText: { fontFamily: fonts.uiExtraBold, fontSize: 15, color: '#3A2A0C' },
  projectList: { gap: 10 },
  project: {
    backgroundColor: 'rgba(251,250,246,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(251,250,246,0.14)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  projectName: { flex: 1, fontFamily: fonts.uiExtraBold, fontSize: 15, color: light },
  projectChevron: { fontFamily: fonts.uiExtraBold, fontSize: 18, color: colors.gold },
  skip: { height: 48, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  skipText: { fontFamily: fonts.uiExtraBold, fontSize: 13, color: softLight },
});
