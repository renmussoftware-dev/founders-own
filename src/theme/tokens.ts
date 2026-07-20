/**
 * Arcane design system tokens — SPEC §11a.
 * Dark indigo-violet app theme; onboarding uses the lighter teal/cream lead-in.
 */

export type StatKey = 'product' | 'marketing' | 'revenue' | 'operations' | 'finance';

export interface JewelTone {
  /** 3-stop gradient for tiles and progress bars */
  gradient: [string, string, string];
  /** flat tint for XP text and accents */
  tint: string;
}

export const stats: Record<StatKey, { label: string; initial: string; tone: JewelTone }> = {
  product: {
    label: 'Product',
    initial: 'P',
    tone: { gradient: ['#9D8CF2', '#7C68E8', '#4F3EAE'], tint: '#A493FF' },
  },
  marketing: {
    label: 'Marketing',
    initial: 'M',
    tone: { gradient: ['#E89CD4', '#B45C9E', '#7E3A6E'], tint: '#E89CD4' },
  },
  revenue: {
    label: 'Revenue',
    initial: 'R',
    tone: { gradient: ['#F0B865', '#D68A3E', '#9A5F1E'], tint: '#F0B865' },
  },
  operations: {
    label: 'Operations',
    initial: 'O',
    tone: { gradient: ['#8ED2E8', '#4A9CBE', '#2E6A86'], tint: '#8ED2E8' },
  },
  finance: {
    label: 'Finance',
    initial: 'F',
    tone: { gradient: ['#7FD0A0', '#3FA46C', '#276A44'], tint: '#7FD0A0' },
  },
};

export const statOrder: StatKey[] = ['product', 'marketing', 'revenue', 'operations', 'finance'];

export const colors = {
  // App background radial: #2A2450 → #1C1838 (55%) → #120F26
  bgRadial: ['#2A2450', '#1C1838', '#120F26'] as const,
  bgDeep: '#120F26',

  // Surface cards
  surfaceTop: '#2C2652',
  surfaceBottom: '#231E42',
  surfaceBorder: 'rgba(237,234,251,0.1)',

  textPrimary: '#EDEAFB',
  textSecondary: 'rgba(237,234,251,0.55)',
  textFaint: 'rgba(237,234,251,0.35)',

  // Success = mint family
  mint: '#3FA46C',
  mintBright: '#7FD0A0',

  // Gold = verified, everywhere
  gold: '#F0CD79',
  goldMid: '#C89441',
  goldDeep: '#8A6224',

  // Violet accents (active tab, active quest ring)
  violet: '#7C68E8',
  violetBright: '#A493FF',

  // Founder card breaks the dark theme
  cream: '#FAF9F5',

  // Onboarding light/teal lead-in
  onboardingBg: '#F2F7F6',
  onboardingTeal: '#4A9CBE',
} as const;

export const radius = {
  card: 16,
  cardLarge: 18,
  cardSmall: 14,
  pill: 999,
} as const;

/**
 * Font family names as registered by useFonts in app/_layout.tsx.
 * Nunito (600–900) for all UI; Newsreader italic for journal prose and
 * founder-card milestone titles; monospace for card stat numbers.
 */
export const fonts = {
  uiSemiBold: 'Nunito_600SemiBold',
  uiBold: 'Nunito_700Bold',
  uiExtraBold: 'Nunito_800ExtraBold',
  uiBlack: 'Nunito_900Black',
  serifItalic: 'Newsreader_400Regular_Italic',
  mono: 'Menlo', // ui-monospace; falls back to platform mono on Android via Platform.select at call sites
} as const;

/** Hexagon seal points for react-native-svg Polygon, in a 100×100 viewBox (SPEC §11a clip-path). */
export const hexagonPoints = '50,0 93,25 93,75 50,100 7,75 7,25';
