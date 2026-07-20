import { useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import { HexSeal } from '@/components/ui/HexSeal';
import { recordConnectedAppCount } from '@/integrations/appAnalytics';
import { saveRcCredentials } from '@/integrations/rcCredentials';
import { getOverview, validateKey, RcError, type RcProject } from '@/integrations/revenuecat';
import { useStore } from '@/store/useStore';
import { colors, fonts } from '@/theme/tokens';

const DASHBOARD_URL = 'https://app.revenuecat.com/';

const STEPS = [
  'Open RevenueCat and pick the project you want to track.',
  'In the left sidebar (near the bottom), open API keys → New secret API key.',
  'Choose API version V2 and give it any name.',
  'Set permissions — Charts metrics: Read only · Customer information: No access · Project configuration: Read only.',
  'Generate, then copy the key and paste it here.',
];

/**
 * Connect-RevenueCat panel: paste a read-only API key → validate (projects +
 * metrics scope) → pick the project → store it. Reduces onboarding friction
 * with a deep link to the dashboard, step-by-step scope guidance, a paste
 * button, and a metrics-scope check so under-scoped keys fail loudly here
 * instead of silently later.
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
  const setRcOverview = useStore(s => s.setRcOverview);
  const [apiKey, setApiKey] = useState('');
  const [phase, setPhase] = useState<'input' | 'pick'>('input');
  const [projects, setProjects] = useState<RcProject[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'success'>('idle');

  async function onPaste() {
    const text = await Clipboard.getStringAsync();
    if (text) {
      setApiKey(text.trim());
      setError(null);
    }
  }

  async function onValidate() {
    if (!apiKey.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const found = await validateKey(apiKey);
      // Portfolio-size signal (see appAnalytics) — recorded once the key resolves,
      // regardless of which project they then pick.
      if (found.length > 0) void recordConnectedAppCount(found.length);
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
    setStatus('connecting');
    setError(null);
    // Fetch the overview once here: it both confirms the key can read metrics
    // AND primes the dashboard, so the founder lands on live numbers instantly
    // (no second round-trip).
    let overview;
    try {
      overview = await getOverview(apiKey.trim(), project.id);
    } catch (e) {
      setStatus('idle');
      setBusy(false);
      if (e instanceof RcError && (e.status === 401 || e.status === 403)) {
        setError(
          `“${project.name}” connected, but this key can’t read its metrics. In RevenueCat, set Charts metrics to Read only, then reconnect.`
        );
        return;
      }
      setError(e instanceof Error ? e.message : 'Could not read metrics for that project.');
      return;
    }
    await saveRcCredentials({ apiKey: apiKey.trim(), projectId: project.id, projectName: project.name });
    setRcConnection({ connected: true, projectName: project.name });
    setRcOverview(overview);
    setBusy(false);
    setStatus('success');
    // Hold the confirmation briefly so the success reads before we navigate.
    setTimeout(onConnected, 1100);
  }

  if (status !== 'idle') {
    return (
      <View style={styles.root}>
        <View style={styles.sealWrap}>
          {status === 'connecting' ? (
            <ActivityIndicator size="large" color={colors.gold} />
          ) : (
            <View style={styles.successCheck}>
              <Text style={styles.successCheckText}>✓</Text>
            </View>
          )}
        </View>
        <Text style={styles.hed}>{status === 'connecting' ? 'Connecting…' : 'Connected!'}</Text>
        <Text style={styles.sub}>
          {status === 'connecting'
            ? 'Reading your live revenue from RevenueCat.'
            : 'Loading your dashboard…'}
        </Text>
      </View>
    );
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
            Paste a read-only API key. We only read your revenue metrics to verify your
            milestones — never your customers, never your money. The key is stored in your
            device keychain.
          </Text>

          <View style={styles.inputRow}>
            <TextInput
              value={apiKey}
              onChangeText={setApiKey}
              placeholder="Read-only v2 API key"
              placeholderTextColor="rgba(251,250,246,0.4)"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />
            <Pressable onPress={onPaste} style={styles.pasteBtn}>
              <Text style={styles.pasteText}>Paste</Text>
            </Pressable>
          </View>

          <View style={styles.linkRow}>
            <Pressable onPress={() => Linking.openURL(DASHBOARD_URL)}>
              <Text style={styles.link}>Open RevenueCat ↗</Text>
            </Pressable>
            <Pressable onPress={() => setShowHelp(h => !h)}>
              <Text style={styles.link}>How to get a key {showHelp ? '▴' : '▾'}</Text>
            </Pressable>
          </View>

          {showHelp ? (
            <View style={styles.steps}>
              {STEPS.map((s, i) => (
                <View key={i} style={styles.step}>
                  <Text style={styles.stepNum}>{i + 1}</Text>
                  <Text style={styles.stepText}>{s}</Text>
                </View>
              ))}
            </View>
          ) : null}

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
  successCheck: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successCheckText: { fontFamily: fonts.uiBlack, fontSize: 30, color: '#0E2418' },
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
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: {
    flex: 1,
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
  pasteBtn: {
    borderWidth: 1,
    borderColor: 'rgba(251,250,246,0.25)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  pasteText: { fontFamily: fonts.uiExtraBold, fontSize: 13, color: light },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  link: { fontFamily: fonts.uiExtraBold, fontSize: 12, color: colors.gold },
  steps: {
    marginTop: 12,
    backgroundColor: 'rgba(251,250,246,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(251,250,246,0.12)',
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  step: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  stepNum: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.goldMid,
    color: '#2A1F0C',
    fontFamily: fonts.uiExtraBold,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 18,
    overflow: 'hidden',
  },
  stepText: { flex: 1, fontFamily: fonts.uiBold, fontSize: 12, lineHeight: 17, color: light },
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
    lineHeight: 17,
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
