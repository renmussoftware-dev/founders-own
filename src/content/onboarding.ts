import { type BusinessType } from '@/db/character';
import { type StatKey } from '@/theme/tokens';

/**
 * Onboarding content (SPEC §8, design 4a/4b/5a).
 * The Digital product / app card is our addition to the prototype grid;
 * the design's "+Grit" chip renders as "+Finance" per the locked decision.
 */

export interface BusinessTypeCard {
  type: BusinessType;
  title: string;
  /** "You have ..." — the noun that defines the revenue motion. */
  noun: string;
  initial: string;
  gradient: [string, string, string];
  fullWidth?: boolean;
  subtitle?: string;
}

export const BUSINESS_TYPE_CARDS: BusinessTypeCard[] = [
  {
    type: 'digital_product',
    title: 'Digital product / app',
    noun: 'users',
    initial: 'D',
    gradient: ['#8A76F0', '#5F4CC8', '#3E3390'],
  },
  {
    type: 'ecommerce',
    title: 'E-commerce',
    noun: 'customers',
    initial: 'E',
    gradient: ['#D08A4E', '#B0642E', '#824718'],
  },
  {
    type: 'services',
    title: 'Services & freelance',
    noun: 'clients',
    initial: 'S',
    gradient: ['#4B7FB0', '#2E5E8C', '#1F4266'],
  },
  {
    type: 'local',
    title: 'Local & in-person',
    noun: 'regulars',
    initial: 'L',
    gradient: ['#5F9C71', '#3E7C52', '#2A5A3A'],
  },
  {
    type: 'content',
    title: 'Content & audience',
    noun: 'followers',
    initial: 'C',
    gradient: ['#8F6DAF', '#6E4E8C', '#4E3466'],
  },
  {
    type: 'other',
    title: 'Something else / not sure yet',
    noun: '',
    initial: '?',
    gradient: ['#5D97A9', '#3D8098', '#26616F'],
    fullWidth: true,
    subtitle: 'You can change this anytime',
  },
];

export interface SelfReportItem {
  id: string;
  label: string;
  stat: StatKey;
  xp: number;
}

// App-dev self-report milestones (V1). Business-type cards above are kept for
// V2 but no longer shown in onboarding.
export const SELF_REPORT_ITEMS: SelfReportItem[] = [
  { id: 'shipped', label: 'I’ve shipped my app to the store', stat: 'product', xp: 1000 },
  { id: 'users', label: 'I have real users', stat: 'marketing', xp: 1000 },
  { id: 'monetized', label: 'I’ve set up subscriptions or in-app purchases', stat: 'operations', xp: 500 },
  { id: 'first_sub', label: 'I have my first paying subscriber', stat: 'revenue', xp: 1000 },
  { id: 'recurring', label: 'I’m making recurring revenue', stat: 'finance', xp: 1000 },
];

/** Light/teal onboarding palette (design 4a/4b) + dark-teal step 3 (5a). */
export const ob = {
  bgTop: '#F6F3EB',
  bgBottom: '#FBFAF6',
  ink: '#1E3A44',
  inkSoft: 'rgba(30,58,68,0.5)',
  inkFaint: 'rgba(30,58,68,0.35)',
  cardBorder: 'rgba(30,58,68,0.1)',
  cardSelectedBorder: '#2E6E7E',
  progressActive: ['#3D8098', '#245666'] as const,
  progressInactive: 'rgba(30,58,68,0.12)',
  ctaTop: '#3A7D8E',
  ctaBottom: '#245666',
  ctaEdge: '#16303A',
  accent: '#2E6E7E',
  // step 3 (dark teal + gold)
  darkRadial: ['#2C5563', '#1E3A44', '#122730'] as const,
  darkText: '#FBFAF6',
  darkTextSoft: 'rgba(251,250,246,0.65)',
  darkCard: 'rgba(251,250,246,0.08)',
  darkCardBorder: 'rgba(251,250,246,0.12)',
  goldTop: '#F0CD79',
  goldBottom: '#C89441',
  goldEdge: '#8A6224',
} as const;
