import { type BusinessType } from '@/db/character';

/**
 * The authored questline (SPEC §4), reframed for the V1 audience: app
 * developers monetizing through RevenueCat. Money milestones carry a `verify`
 * spec checked against live RevenueCat metrics (logic/verification).
 *
 * The universal-spine structure is preserved so V2 can re-expand to other
 * business types; only the flavor is app-dev-specific here.
 */

/** RevenueCat overview metric a milestone can be verified against. */
export type VerifyMetric =
  | 'mrr'
  | 'revenue'
  | 'active_subscriptions'
  | 'active_users'
  | 'new_customers';

export interface VerifySpec {
  metric: VerifyMetric;
  /** Milestone is met when the live metric is >= threshold. */
  threshold: number;
  /** Short label for the seal, e.g. "$1K", "1st". */
  seal: string;
}

export interface Objective {
  id: string;
  label: string;
  /** Optional per-type flavor override (dormant until V2). */
  flavor?: Partial<Record<BusinessType, string>>;
}

export interface Chapter {
  id: string;
  act: number;
  index: number;
  title: string;
  tagline: string;
  /** Money milestone → gold styling. */
  money?: boolean;
  /** RevenueCat-verifiable milestone (SPEC §4). */
  verify?: VerifySpec;
  objectives: Objective[];
}

export interface Act {
  number: number;
  name: string;
  subtitle: string;
}

export const ACTS: Act[] = [
  { number: 1, name: 'Act I', subtitle: 'Ship it and get paid' },
  { number: 2, name: 'Act II', subtitle: 'Build traction' },
  { number: 3, name: 'Act III', subtitle: 'Grow the machine' },
  { number: 4, name: 'Act IV', subtitle: 'Scale it' },
];

export const CHAPTERS: Chapter[] = [
  // ---- Act I — Ship it and get paid ----
  {
    id: 'act1_ch1',
    act: 1,
    index: 1,
    title: 'First Real Users',
    tagline: 'Get it in front of people who have the problem.',
    // Verifiable from RevenueCat's active-users count — "real users" is a metric,
    // not just self-report. Threshold matches the "10 people" objective; tunable.
    verify: { metric: 'active_users', threshold: 10, seal: '10' },
    objectives: [
      { id: 'who', label: 'Write who your app is for and the one problem it solves' },
      { id: 'ship', label: 'Get a build live that a stranger could install' },
      { id: 'reach', label: 'Put it in front of 10 people who have that problem' },
    ],
  },
  {
    id: 'act1_ch2',
    act: 1,
    index: 2,
    title: 'First Paying Subscriber',
    tagline: 'Turn a user into someone who pays.',
    money: true,
    verify: { metric: 'active_subscriptions', threshold: 1, seal: '1st' },
    objectives: [
      { id: 'paywall', label: 'Put a real paywall in front of your best feature' },
      { id: 'price', label: 'Pick a price and set up the product in the store' },
      { id: 'convert', label: 'Get your first paying subscriber' },
    ],
  },
  {
    id: 'act1_ch3',
    act: 1,
    index: 3,
    title: 'First $100 MRR',
    tagline: 'Prove people keep paying, not just once.',
    money: true,
    verify: { metric: 'mrr', threshold: 100, seal: '$100' },
    objectives: [
      { id: 'onboarding', label: 'Fix the biggest drop-off in your first-run experience' },
      { id: 'retain', label: 'Give users a reason to still be here next week' },
      { id: 'hundred', label: 'Cross $100 in monthly recurring revenue' },
    ],
  },
  {
    id: 'act1_ch4',
    act: 1,
    index: 4,
    title: 'First $1,000 Month',
    tagline: 'A month that actually moves the needle.',
    money: true,
    verify: { metric: 'revenue', threshold: 1000, seal: '$1K' },
    objectives: [
      { id: 'channel', label: 'Find the one channel that brings the most installs' },
      { id: 'double', label: 'Double down on it for two weeks and measure' },
      { id: 'thousand', label: 'Cross $1,000 in revenue over 28 days' },
    ],
  },
  {
    id: 'act1_ch5',
    act: 1,
    index: 5,
    title: 'First $1,000 MRR',
    tagline: 'Recurring revenue you can build on.',
    money: true,
    verify: { metric: 'mrr', threshold: 1000, seal: '$1K' },
    objectives: [
      { id: 'trial', label: 'Raise your trial → paid conversion by one concrete step' },
      { id: 'annual', label: 'Add an annual plan or one upsell' },
      { id: 'mrr', label: 'Cross $1,000 in monthly recurring revenue' },
    ],
  },

  // ---- Act II — Build traction ----
  {
    id: 'act2_ch1',
    act: 2,
    index: 6,
    title: 'A Channel That Converts',
    tagline: 'One source of installs you can turn up on purpose.',
    objectives: [
      { id: 'pick', label: 'Pick the channel with the best install → paid rate' },
      { id: 'system', label: 'Make posting to it a repeatable weekly habit' },
      { id: 'predict', label: 'Make next month’s installs predictable' },
    ],
  },
  {
    id: 'act2_ch2',
    act: 2,
    index: 7,
    title: 'First $5,000 Month',
    tagline: 'Momentum you can feel.',
    money: true,
    verify: { metric: 'revenue', threshold: 5000, seal: '$5K' },
    objectives: [
      { id: 'ltv', label: 'Raise revenue per user by one concrete change' },
      { id: 'churn', label: 'Cut one source of churn or refunds' },
      { id: 'fivek', label: 'Cross $5,000 in revenue over 28 days' },
    ],
  },
  {
    id: 'act2_ch3',
    act: 2,
    index: 8,
    title: 'First $5,000 MRR',
    tagline: 'A real business, not a spike.',
    money: true,
    verify: { metric: 'mrr', threshold: 5000, seal: '$5K' },
    objectives: [
      { id: 'paywalltest', label: 'A/B test one element of your paywall' },
      { id: 'reactivate', label: 'Win back one cohort of lapsed subscribers' },
      { id: 'fivekmrr', label: 'Cross $5,000 in monthly recurring revenue' },
    ],
  },

  // ---- Act III — Grow the machine ----
  {
    id: 'act3_ch1',
    act: 3,
    index: 9,
    title: 'The Team of One More',
    tagline: 'Take the first thing off your own plate.',
    objectives: [
      { id: 'role', label: 'Name the work only you do that someone else could' },
      { id: 'hand', label: 'Hand it to a person or a tool' },
      { id: 'trust', label: 'Let it run two weeks without redoing it' },
    ],
  },
  {
    id: 'act3_ch2',
    act: 3,
    index: 10,
    title: 'First $10,000 MRR',
    tagline: 'Five figures a month, on repeat.',
    money: true,
    verify: { metric: 'mrr', threshold: 10000, seal: '$10K' },
    objectives: [
      { id: 'scale', label: 'Scale the channel that carries the most revenue' },
      { id: 'infra', label: 'Make delivery and support hold at higher volume' },
      { id: 'tenkmrr', label: 'Cross $10,000 in monthly recurring revenue' },
    ],
  },

  // ---- Act IV — Scale it ----
  {
    id: 'act4_ch1',
    act: 4,
    index: 11,
    title: 'It Runs Without You',
    tagline: 'The app survives a week of your absence.',
    objectives: [
      { id: 'document', label: 'Document the three processes that matter most' },
      { id: 'owners', label: 'Give each one a clear owner or automation' },
      { id: 'away', label: 'Step away for a week and watch it hold' },
    ],
  },
  {
    id: 'act4_ch2',
    act: 4,
    index: 12,
    title: 'First $1,000,000 Year',
    tagline: 'The one that changes the story you tell.',
    money: true,
    verify: { metric: 'mrr', threshold: 83000, seal: '$1M' },
    objectives: [
      { id: 'durable', label: 'Prove the growth is durable, not a single spike' },
      { id: 'runrate', label: 'Reach a $1M annual run-rate (about $83k MRR)' },
      { id: 'million', label: 'Cross $1,000,000 in a trailing year' },
    ],
  },
];

export const CHAPTERS_BY_ID: Record<string, Chapter> = Object.fromEntries(
  CHAPTERS.map(c => [c.id, c])
);

export function chaptersForAct(act: number): Chapter[] {
  return CHAPTERS.filter(c => c.act === act).sort((a, b) => a.index - b.index);
}

/** The first chapter of the whole spine (opened at onboarding). */
export const FIRST_CHAPTER = CHAPTERS[0];

export function nextChapter(chapterId: string): Chapter | null {
  const current = CHAPTERS_BY_ID[chapterId];
  if (!current) return null;
  return CHAPTERS.find(c => c.index === current.index + 1) ?? null;
}

/** Paywall boundary: completing the last Act I chapter unlocks Act II (SPEC §9). */
export const ACT1_LAST_CHAPTER_ID = 'act1_ch5';
export function isPaywallBoundary(completedChapterId: string): boolean {
  return completedChapterId === ACT1_LAST_CHAPTER_ID;
}
