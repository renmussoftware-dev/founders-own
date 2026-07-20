import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OnboardingProgress, TealButton } from '@/components/onboarding/shared';
import { BUSINESS_TYPE_CARDS, ob } from '@/content/onboarding';
import { useOnboarding } from '@/store/onboarding';
import { fonts } from '@/theme/tokens';

/** Onboarding 1/3 — "What are you building?" (design 4a + added Digital card). */
export default function BusinessTypeStep() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const businessType = useOnboarding(s => s.businessType);
  const setBusinessType = useOnboarding(s => s.setBusinessType);

  return (
    <LinearGradient colors={[ob.bgTop, ob.bgBottom]} style={styles.root}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 24 }]}>
        <OnboardingProgress step={1} />
        <Text style={styles.heading}>What are you{'\n'}building?</Text>
        <Text style={styles.sub}>
          This shapes your quests — the work is different for a studio than a shop.
        </Text>

        <View style={styles.grid}>
          {BUSINESS_TYPE_CARDS.map(card => {
            const selected = businessType === card.type;
            return (
              <Pressable
                key={card.type}
                onPress={() => setBusinessType(card.type)}
                style={[
                  styles.card,
                  card.fullWidth ? styles.cardFull : styles.cardHalf,
                  selected && styles.cardSelected,
                ]}
              >
                <View style={card.fullWidth && styles.cardRow}>
                  <LinearGradient colors={card.gradient} style={styles.tile}>
                    <Text style={styles.tileInitial}>{card.initial}</Text>
                  </LinearGradient>
                  <View style={card.fullWidth ? styles.cardRowBody : styles.cardBody}>
                    <Text style={styles.cardTitle}>{card.title}</Text>
                    <Text style={styles.cardNoun}>
                      {card.subtitle ?? (
                        <>
                          You have <Text style={styles.cardNounEm}>{card.noun}</Text>
                        </>
                      )}
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <TealButton
          label="Continue"
          disabled={businessType === null}
          onPress={() => router.push('/onboarding/step2')}
        />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 22, paddingBottom: 16 },
  heading: {
    fontFamily: fonts.uiExtraBold,
    fontSize: 26,
    lineHeight: 32,
    color: ob.ink,
  },
  sub: {
    fontFamily: fonts.uiBold,
    fontSize: 13,
    lineHeight: 19,
    color: ob.inkSoft,
    marginTop: 8,
    marginBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 11,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: ob.cardBorder,
    borderRadius: 18,
    padding: 15,
  },
  cardHalf: { flexBasis: '47%', flexGrow: 1 },
  cardFull: { flexBasis: '100%' },
  cardSelected: {
    borderWidth: 2,
    borderColor: ob.cardSelectedBorder,
    shadowColor: ob.cardSelectedBorder,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardRowBody: { flex: 1 },
  cardBody: { marginTop: 10 },
  tile: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileInitial: {
    fontFamily: fonts.uiBlack,
    fontSize: 17,
    color: '#FFFFFF',
  },
  cardTitle: {
    fontFamily: fonts.uiExtraBold,
    fontSize: 14,
    color: ob.ink,
  },
  cardNoun: {
    fontFamily: fonts.uiBold,
    fontSize: 11,
    color: ob.inkSoft,
    marginTop: 4,
  },
  cardNounEm: { fontStyle: 'italic' },
  footer: { paddingHorizontal: 22, paddingTop: 8 },
});
