import { type BusinessType } from '@/db/character';

/**
 * The authored questline (SPEC §4). One universal spine — every business runs
 * the same Acts → Chapters → Objectives; business type changes flavor text
 * and tips only, never structure.
 *
 * Act I is authored in full to match design 7b (5 chapters, two money gates).
 * Acts II–IV carry titles/taglines/objectives; the deep per-type flavor pass
 * is an open item (SPEC §13).
 */

export interface Objective {
  id: string;
  label: string;
  /** Optional per-type flavor override, keyed by business_type. */
  flavor?: Partial<Record<BusinessType, string>>;
}

export interface Chapter {
  id: string;
  act: number;
  /** 1-based position within the whole spine; drives unlock order. */
  index: number;
  title: string;
  tagline: string;
  /** Money milestone → gold styling; verifiable in Act 2+ (SPEC §4). */
  money?: boolean;
  objectives: Objective[];
}

export interface Act {
  number: number;
  name: string;
  subtitle: string;
}

export const ACTS: Act[] = [
  { number: 1, name: 'Act I', subtitle: 'Proof it works' },
  { number: 2, name: 'Act II', subtitle: 'Build traction' },
  { number: 3, name: 'Act III', subtitle: 'Grow past yourself' },
  { number: 4, name: 'Act IV', subtitle: 'Scale it' },
];

export const CHAPTERS: Chapter[] = [
  // ---- Act I — Proof it works (design 7b) ----
  {
    id: 'act1_ch1',
    act: 1,
    index: 1,
    title: 'First Sale',
    tagline: 'Turn the idea into one real transaction.',
    objectives: [
      { id: 'offer', label: 'Write your offer in one sentence' },
      { id: 'prospects', label: 'Put your offer in front of 10 people' },
      { id: 'close', label: 'Close your first sale' },
    ],
  },
  {
    id: 'act1_ch2',
    act: 1,
    index: 2,
    title: 'First $1,000 month',
    tagline: 'Do the one thing that makes sales — on repeat.',
    money: true,
    objectives: [
      { id: 'best', label: 'Identify the single activity that produces sales' },
      { id: 'repeat', label: 'Run that activity every day for a week' },
      { id: 'thousand', label: 'Cross $1,000 in one calendar month' },
    ],
  },
  {
    id: 'act1_ch3',
    act: 1,
    index: 3,
    title: 'First Repeat Customer',
    tagline: 'Make your offer worth coming back for.',
    objectives: [
      { id: 'followup', label: 'Follow up with every past buyer' },
      { id: 'return', label: 'Fix one reason customers don’t return' },
      { id: 'second', label: 'Land one repeat purchase' },
    ],
  },
  {
    id: 'act1_ch4',
    act: 1,
    index: 4,
    title: 'A Week That Runs Itself',
    tagline: 'Systemize one recurring task so it stops needing you.',
    objectives: [
      { id: 'list', label: 'List every task you repeat each week' },
      { id: 'systemize', label: 'Turn one into a checklist or automation' },
      { id: 'week', label: 'Run a full week without firefighting it' },
    ],
  },
  {
    id: 'act1_ch5',
    act: 1,
    index: 5,
    title: 'First $10,000 month',
    tagline: 'Prove the model holds at 10×.',
    money: true,
    objectives: [
      { id: 'price', label: 'Raise prices or widen the offer' },
      { id: 'channel', label: 'Build one repeatable acquisition channel' },
      { id: 'tenk', label: 'Cross $10,000 in one calendar month' },
    ],
  },

  // ---- Act II — Build traction ----
  {
    id: 'act2_ch1',
    act: 2,
    index: 6,
    title: 'A Channel You Trust',
    tagline: 'One source of demand you can turn up on purpose.',
    objectives: [
      { id: 'pick', label: 'Pick the channel that already works best' },
      { id: 'double', label: 'Double down for two weeks and measure' },
      { id: 'predictable', label: 'Make next month’s leads predictable' },
    ],
  },
  {
    id: 'act2_ch2',
    act: 2,
    index: 7,
    title: 'First $25,000 month',
    tagline: 'Momentum you can feel.',
    money: true,
    objectives: [
      { id: 'ltv', label: 'Raise the value of each customer' },
      { id: 'retention', label: 'Cut one source of churn or refunds' },
      { id: 'twentyfive', label: 'Cross $25,000 in one calendar month' },
    ],
  },
  {
    id: 'act2_ch3',
    act: 2,
    index: 8,
    title: 'Someone Else Helps',
    tagline: 'Take the first thing off your own plate.',
    objectives: [
      { id: 'identify', label: 'Name the task only you do that others could' },
      { id: 'delegate', label: 'Hand it to a person or a tool' },
      { id: 'trust', label: 'Let it run for two weeks without redoing it' },
    ],
  },

  // ---- Act III — Grow past yourself ----
  {
    id: 'act3_ch1',
    act: 3,
    index: 9,
    title: 'The Team of One More',
    tagline: 'Build the seat before you’re desperate for it.',
    objectives: [
      { id: 'role', label: 'Write the role you most need filled' },
      { id: 'hire', label: 'Bring on your first real hire or contractor' },
      { id: 'onboard', label: 'Get them to their first independent win' },
    ],
  },
  {
    id: 'act3_ch2',
    act: 3,
    index: 10,
    title: 'First $100,000 month',
    tagline: 'Six figures in thirty days.',
    money: true,
    objectives: [
      { id: 'scale', label: 'Scale the channel that carries the most revenue' },
      { id: 'ops', label: 'Make delivery hold at higher volume' },
      { id: 'hundredk', label: 'Cross $100,000 in one calendar month' },
    ],
  },

  // ---- Act IV — Scale it ----
  {
    id: 'act4_ch1',
    act: 4,
    index: 11,
    title: 'It Runs Without You',
    tagline: 'The business survives a week of your absence.',
    objectives: [
      { id: 'document', label: 'Document the three processes that matter most' },
      { id: 'owners', label: 'Give each one a clear owner' },
      { id: 'away', label: 'Step away for a week and watch it hold' },
    ],
  },
  {
    id: 'act4_ch2',
    act: 4,
    index: 12,
    title: 'First $1,000,000 year',
    tagline: 'The one that changes the story you tell.',
    money: true,
    objectives: [
      { id: 'trailing', label: 'Get trailing 12-month revenue to seven figures' },
      { id: 'durable', label: 'Prove it’s durable, not a single spike' },
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
