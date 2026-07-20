import { type BusinessType } from '@/db/character';
import { type StatKey } from '@/theme/tokens';

export type Effort = 'light' | 'medium' | 'heavy';

/**
 * Journey stage (SPEC §6 — "where they are in their journey"). Derived from the
 * founder's active chapter in logic/dailyQuests. A template with no `stages`
 * applies at every stage; otherwise it only surfaces at a matching stage. This
 * is what keeps "automate a manual task" or "recover an abandoned cart" away
 * from someone who hasn't shipped or sold anything yet.
 */
export type Stage = 'foundation' | 'early' | 'growth' | 'scale';

export interface QuestTemplate {
  id: string;
  /** 'any' templates serve every business type; otherwise type-specific. */
  type: BusinessType | 'any';
  stat: StatKey;
  effort: Effort;
  title: string;
  /** Journey stages this fits; omit for "all stages". */
  stages?: Stage[];
  /** Tag habit-pool templates; the engine's third slot draws only from these. */
  habit?: boolean;
  /** Chapter-pull templates tied to an authored chapter (SPEC §6). */
  chapter?: string;
}

export const XP_BY_EFFORT: Record<Effort, number> = {
  light: 15,
  medium: 20,
  heavy: 25,
};

/**
 * Authored pool (SPEC §6). Two axes of personalization:
 *  - business_type: revenue/marketing motions diverge hard; the engine prefers
 *    a type-specific quest and falls back to a universal ('any') one.
 *  - stage: foundation founders get "get onto the path" actions; operating-
 *    business quests are gated to later stages.
 * Digital product / app is authored in depth (the anonymous-download case);
 * other types get type-specific revenue/marketing/foundation coverage and lean
 * on the stage-tagged 'any' pool for the rest.
 */
export const QUEST_TEMPLATES: QuestTemplate[] = [
  // =========================================================================
  // UNIVERSAL ('any') — stage-tagged so every type has a sane fallback per stat
  // =========================================================================

  // ---- Product ----
  { id: 'any_prod_f1', type: 'any', stat: 'product', effort: 'light', stages: ['foundation'], title: 'Write the single most important thing your product must do well' },
  { id: 'any_prod_f2', type: 'any', stat: 'product', effort: 'heavy', stages: ['foundation'], title: 'Ship the smallest version a real person could use today' },
  { id: 'any_prod_e1', type: 'any', stat: 'product', effort: 'medium', stages: ['early'], title: 'Fix the one thing customers complain about most' },
  { id: 'any_prod_e2', type: 'any', stat: 'product', effort: 'medium', stages: ['early', 'growth'], title: 'Cut or simplify one thing nobody uses' },
  { id: 'any_prod_g1', type: 'any', stat: 'product', effort: 'heavy', stages: ['growth', 'scale'], title: 'Spend 45 focused minutes making the core experience better' },
  { id: 'any_prod_g2', type: 'any', stat: 'product', effort: 'medium', stages: ['growth', 'scale'], title: 'Ask one recent customer what almost stopped them from buying' },

  // ---- Marketing ----
  { id: 'any_mkt_f1', type: 'any', stat: 'marketing', effort: 'light', stages: ['foundation'], title: 'Write your one-sentence pitch: who it’s for and the problem you solve' },
  { id: 'any_mkt_f2', type: 'any', stat: 'marketing', effort: 'medium', stages: ['foundation'], title: 'Tell 5 people who have this problem what you’re building' },
  { id: 'any_mkt_e1', type: 'any', stat: 'marketing', effort: 'medium', stages: ['early', 'growth'], title: 'Do the one marketing activity that’s worked best — again' },
  { id: 'any_mkt_e2', type: 'any', stat: 'marketing', effort: 'light', stages: ['early', 'growth'], title: 'Write 3 hooks for the same message; keep the best' },
  { id: 'any_mkt_g1', type: 'any', stat: 'marketing', effort: 'medium', stages: ['growth', 'scale'], title: 'Show up once where your buyers already gather' },

  // ---- Revenue ----
  { id: 'any_rev_f1', type: 'any', stat: 'revenue', effort: 'medium', stages: ['foundation'], title: 'Decide exactly what you’ll charge for, and how much' },
  { id: 'any_rev_f2', type: 'any', stat: 'revenue', effort: 'medium', stages: ['foundation'], title: 'Make your first direct ask for money or a signup' },
  { id: 'any_rev_e1', type: 'any', stat: 'revenue', effort: 'medium', stages: ['early', 'growth'], title: 'Follow up with everyone who showed interest but didn’t buy' },
  { id: 'any_rev_e2', type: 'any', stat: 'revenue', effort: 'medium', stages: ['early', 'growth'], title: 'Write down the #1 thing blocking your next sale — and one fix' },
  { id: 'any_rev_g1', type: 'any', stat: 'revenue', effort: 'medium', stages: ['growth', 'scale'], title: 'Raise the value of each customer by one concrete step' },

  // ---- Operations ----
  { id: 'any_ops_f1', type: 'any', stat: 'operations', effort: 'medium', stages: ['foundation'], title: 'Set up the one tool you need to see whether it’s working' },
  { id: 'any_ops_f2', type: 'any', stat: 'operations', effort: 'light', stages: ['foundation', 'early'], title: 'Write today’s single most important task and do it first' },
  { id: 'any_ops_e1', type: 'any', stat: 'operations', effort: 'medium', stages: ['early', 'growth'], title: 'Turn one repeating task into a checklist' },
  { id: 'any_ops_g1', type: 'any', stat: 'operations', effort: 'heavy', stages: ['growth', 'scale'], title: 'Automate or delegate one thing you did manually this week' },
  { id: 'any_ops_g2', type: 'any', stat: 'operations', effort: 'medium', stages: ['growth', 'scale'], title: 'Name this week’s bottleneck and one way around it' },

  // ---- Finance ----
  { id: 'any_fin_f1', type: 'any', stat: 'finance', effort: 'light', stages: ['foundation'], title: 'List your monthly costs so you know your burn' },
  { id: 'any_fin_f2', type: 'any', stat: 'finance', effort: 'light', stages: ['foundation'], title: 'Set a specific goal for your first paying month' },
  { id: 'any_fin_e1', type: 'any', stat: 'finance', effort: 'light', stages: ['early', 'growth'], title: 'Compare this week’s money in against money out' },
  { id: 'any_fin_e2', type: 'any', stat: 'finance', effort: 'light', stages: ['early', 'growth'], title: 'Find one expense to cut or renegotiate' },
  { id: 'any_fin_g1', type: 'any', stat: 'finance', effort: 'medium', stages: ['growth', 'scale'], title: 'Update your runway — how many months at current burn?' },

  // =========================================================================
  // DIGITAL PRODUCT / APP (users, downloads, subscriptions)
  // =========================================================================

  // ---- Product ----
  { id: 'app_prod_f1', type: 'digital_product', stat: 'product', effort: 'light', stages: ['foundation'], title: 'Write your app’s one-line pitch: who it’s for and the problem it solves' },
  { id: 'app_prod_f2', type: 'digital_product', stat: 'product', effort: 'light', stages: ['foundation'], title: 'Pick the single core action your app has to nail' },
  { id: 'app_prod_f3', type: 'digital_product', stat: 'product', effort: 'heavy', stages: ['foundation'], title: 'Ship the smallest build a real user could try today' },
  { id: 'app_prod_e1', type: 'digital_product', stat: 'product', effort: 'medium', stages: ['early', 'growth'], title: 'Fix the top crash or bug from this week' },
  { id: 'app_prod_e2', type: 'digital_product', stat: 'product', effort: 'medium', stages: ['early', 'growth'], title: 'Improve your first-run onboarding by one step' },
  { id: 'app_prod_g1', type: 'digital_product', stat: 'product', effort: 'medium', stages: ['growth', 'scale'], title: 'Watch a real person use the app; note one friction point' },
  { id: 'app_prod_g2', type: 'digital_product', stat: 'product', effort: 'heavy', stages: ['growth', 'scale'], title: 'Ship one improvement to your worst drop-off screen' },

  // ---- Marketing ----
  { id: 'app_mkt_f1', type: 'digital_product', stat: 'marketing', effort: 'medium', stages: ['foundation'], title: 'Write your store title + subtitle around one target keyword' },
  { id: 'app_mkt_f2', type: 'digital_product', stat: 'marketing', effort: 'medium', stages: ['foundation', 'early'], title: 'Record a 15-second clip of the app solving the problem' },
  { id: 'app_mkt_f3', type: 'digital_product', stat: 'marketing', effort: 'light', stages: ['foundation', 'early'], title: 'Post one build-in-public update' },
  { id: 'app_mkt_e1', type: 'digital_product', stat: 'marketing', effort: 'light', stages: ['early', 'growth'], title: 'Write one new ad hook to test' },
  { id: 'app_mkt_e2', type: 'digital_product', stat: 'marketing', effort: 'light', stages: ['early', 'growth'], title: 'Reply to 3 App Store or Play Store reviews' },
  { id: 'app_mkt_e3', type: 'digital_product', stat: 'marketing', effort: 'medium', stages: ['early', 'growth'], title: 'Post one short video of the app in action' },
  { id: 'app_mkt_g1', type: 'digital_product', stat: 'marketing', effort: 'light', stages: ['growth', 'scale'], title: 'Study a competitor’s top-performing creative; note why it works' },
  { id: 'app_mkt_g2', type: 'digital_product', stat: 'marketing', effort: 'medium', stages: ['growth', 'scale'], title: 'Pitch one newsletter or creator in your niche' },

  // ---- Revenue ----
  { id: 'app_rev_f1', type: 'digital_product', stat: 'revenue', effort: 'medium', stages: ['foundation'], title: 'Decide what’s free vs paid in your app' },
  { id: 'app_rev_f2', type: 'digital_product', stat: 'revenue', effort: 'heavy', stages: ['foundation'], title: 'Set up your subscription or one-time purchase in the store' },
  { id: 'app_rev_f3', type: 'digital_product', stat: 'revenue', effort: 'light', stages: ['foundation', 'early'], title: 'Compare your price against 3 competing apps' },
  { id: 'app_rev_e1', type: 'digital_product', stat: 'revenue', effort: 'medium', stages: ['early', 'growth'], title: 'Check yesterday’s install → trial conversion; note one drop-off point' },
  { id: 'app_rev_e2', type: 'digital_product', stat: 'revenue', effort: 'medium', stages: ['early', 'growth'], title: 'Change one thing on your paywall and note the before/after' },
  { id: 'app_rev_g1', type: 'digital_product', stat: 'revenue', effort: 'heavy', stages: ['growth', 'scale'], title: 'A/B test one element of your paywall' },
  { id: 'app_rev_g2', type: 'digital_product', stat: 'revenue', effort: 'medium', stages: ['growth', 'scale'], title: 'Add an annual option or one upsell' },

  // ---- Operations ----
  { id: 'app_ops_f1', type: 'digital_product', stat: 'operations', effort: 'medium', stages: ['foundation'], title: 'Set up analytics so you can see installs and key events' },
  { id: 'app_ops_f2', type: 'digital_product', stat: 'operations', effort: 'light', stages: ['foundation'], title: 'Turn on crash reporting' },
  { id: 'app_ops_f3', type: 'digital_product', stat: 'operations', effort: 'medium', stages: ['foundation', 'early'], title: 'Draft your store listing (screenshots, description)' },
  { id: 'app_ops_e1', type: 'digital_product', stat: 'operations', effort: 'medium', stages: ['early', 'growth'], title: 'Automate one step of your build or release' },
  { id: 'app_ops_e2', type: 'digital_product', stat: 'operations', effort: 'medium', stages: ['early', 'growth'], title: 'Set up a simple way to collect user feedback in-app' },
  { id: 'app_ops_g1', type: 'digital_product', stat: 'operations', effort: 'heavy', stages: ['growth', 'scale'], title: 'Automate or delegate one recurring release task' },

  // ---- Finance ----
  { id: 'app_fin_f1', type: 'digital_product', stat: 'finance', effort: 'light', stages: ['foundation'], title: 'Add up your monthly costs (dev accounts, hosting, tools)' },
  { id: 'app_fin_f2', type: 'digital_product', stat: 'finance', effort: 'light', stages: ['foundation', 'early'], title: 'Set a target for your first paying month' },
  { id: 'app_fin_e1', type: 'digital_product', stat: 'finance', effort: 'light', stages: ['early', 'growth'], title: 'Compare yesterday’s revenue against your costs' },
  { id: 'app_fin_g1', type: 'digital_product', stat: 'finance', effort: 'medium', stages: ['growth', 'scale'], title: 'Update your runway — months left at current burn' },

  // ---- Habits ----
  { id: 'app_hab_metrics', type: 'digital_product', stat: 'revenue', effort: 'light', habit: true, title: 'Check installs and trials — 2 minutes, no rabbit holes' },
  { id: 'app_hab_review', type: 'digital_product', stat: 'marketing', effort: 'light', habit: true, title: 'Read one new user review' },
  { id: 'app_hab_dogfood', type: 'digital_product', stat: 'product', effort: 'light', habit: true, title: 'Use your own app for 2 minutes; note one rough edge' },

  // =========================================================================
  // E-COMMERCE (physical products, customers)
  // =========================================================================
  { id: 'ecom_prod_f1', type: 'ecommerce', stat: 'product', effort: 'heavy', stages: ['foundation'], title: 'Get one product ready to sell — photo, price, description' },
  { id: 'ecom_rev_f1', type: 'ecommerce', stat: 'revenue', effort: 'heavy', stages: ['foundation'], title: 'Stand up a way to take payment (a simple store or checkout link)' },
  { id: 'ecom_mkt_f1', type: 'ecommerce', stat: 'marketing', effort: 'medium', stages: ['foundation'], title: 'Show your product to 5 people who’d actually buy it' },
  { id: 'ecom_rev_e1', type: 'ecommerce', stat: 'revenue', effort: 'medium', stages: ['early', 'growth'], title: 'Recover one abandoned cart' },
  { id: 'ecom_rev_e2', type: 'ecommerce', stat: 'revenue', effort: 'medium', stages: ['early', 'growth'], title: 'Email your list one restock or offer' },
  { id: 'ecom_prod_e1', type: 'ecommerce', stat: 'product', effort: 'heavy', stages: ['early', 'growth'], title: 'Improve one product page' },
  { id: 'ecom_mkt_e1', type: 'ecommerce', stat: 'marketing', effort: 'light', stages: ['early', 'growth'], title: 'Repost one customer photo or review' },
  { id: 'ecom_rev_g1', type: 'ecommerce', stat: 'revenue', effort: 'medium', stages: ['growth', 'scale'], title: 'Sketch one bundle or upsell you could offer this week' },
  { id: 'ecom_hab', type: 'ecommerce', stat: 'operations', effort: 'light', habit: true, title: 'Check orders and messages; clear anything waiting' },

  // =========================================================================
  // SERVICES & FREELANCE (few named clients)
  // =========================================================================
  { id: 'svc_rev_f1', type: 'services', stat: 'revenue', effort: 'medium', stages: ['foundation'], title: 'Write your offer in one sentence a stranger would understand' },
  { id: 'svc_mkt_f1', type: 'services', stat: 'marketing', effort: 'medium', stages: ['foundation'], title: 'Reach out to 5 people who might need what you do' },
  { id: 'svc_rev_f2', type: 'services', stat: 'revenue', effort: 'medium', stages: ['foundation', 'early'], title: 'Send one real proposal or price to a prospect' },
  { id: 'svc_rev_e1', type: 'services', stat: 'revenue', effort: 'medium', stages: ['early', 'growth'], title: 'Reach out to 3 past clients for a referral or repeat order' },
  { id: 'svc_rev_e2', type: 'services', stat: 'revenue', effort: 'light', stages: ['early', 'growth'], title: 'Follow up on one open proposal' },
  { id: 'svc_mkt_e1', type: 'services', stat: 'marketing', effort: 'medium', stages: ['early', 'growth'], title: 'Turn one past project into a before/after post' },
  { id: 'svc_rev_g1', type: 'services', stat: 'revenue', effort: 'medium', stages: ['growth', 'scale'], title: 'Price your next project 10% higher and write the justification' },
  { id: 'svc_hab', type: 'services', stat: 'marketing', effort: 'light', habit: true, title: 'Send one thoughtful message to a past or potential client' },

  // =========================================================================
  // LOCAL & IN-PERSON (physical, local demand)
  // =========================================================================
  { id: 'loc_rev_f1', type: 'local', stat: 'revenue', effort: 'medium', stages: ['foundation'], title: 'Offer your service to 5 people or businesses nearby' },
  { id: 'loc_ops_f1', type: 'local', stat: 'operations', effort: 'medium', stages: ['foundation'], title: 'Set up your Google Business Profile' },
  { id: 'loc_rev_e1', type: 'local', stat: 'revenue', effort: 'light', stages: ['early', 'growth'], title: 'Ask one completed customer for a Google review' },
  { id: 'loc_mkt_e1', type: 'local', stat: 'marketing', effort: 'light', stages: ['early', 'growth'], title: 'Check your Google Business ranking for one keyword' },
  { id: 'loc_rev_e2', type: 'local', stat: 'revenue', effort: 'medium', stages: ['early', 'growth'], title: 'Text one past customer a seasonal offer' },
  { id: 'loc_rev_g1', type: 'local', stat: 'revenue', effort: 'heavy', stages: ['growth', 'scale'], title: 'Pitch one nearby business on referring each other' },
  { id: 'loc_hab', type: 'local', stat: 'marketing', effort: 'light', habit: true, title: 'Take one job-site photo for your content bank' },

  // =========================================================================
  // CONTENT & AUDIENCE (monetize attention)
  // =========================================================================
  { id: 'con_prod_f1', type: 'content', stat: 'product', effort: 'medium', stages: ['foundation'], title: 'Define your niche and who you’re for in one line' },
  { id: 'con_mkt_f1', type: 'content', stat: 'marketing', effort: 'medium', stages: ['foundation', 'early'], title: 'Post one piece of content in your niche' },
  { id: 'con_rev_f1', type: 'content', stat: 'revenue', effort: 'medium', stages: ['foundation', 'early'], title: 'List 3 things your audience asks for that they’d pay for' },
  { id: 'con_mkt_e1', type: 'content', stat: 'marketing', effort: 'light', stages: ['early', 'growth'], title: 'Study one competitor’s top-performing post; note why it worked' },
  { id: 'con_rev_e1', type: 'content', stat: 'revenue', effort: 'medium', stages: ['early', 'growth'], title: 'Mention your paid thing in today’s content — once, naturally' },
  { id: 'con_rev_g1', type: 'content', stat: 'revenue', effort: 'heavy', stages: ['growth', 'scale'], title: 'Draft one sponsor or affiliate pitch' },
  { id: 'con_hab', type: 'content', stat: 'marketing', effort: 'light', habit: true, title: 'Reply to every comment on your latest post' },

  // =========================================================================
  // UNIVERSAL HABITS (all stages, all types — third-slot fallback)
  // =========================================================================
  { id: 'any_hab_numbers', type: 'any', stat: 'finance', effort: 'light', habit: true, title: 'Review your numbers before noon' },
  { id: 'any_hab_task', type: 'any', stat: 'operations', effort: 'light', habit: true, title: 'Write tomorrow’s top task before you close the day' },
  { id: 'any_hab_talk', type: 'any', stat: 'marketing', effort: 'light', habit: true, title: 'Talk to one customer or prospect today' },

  // =========================================================================
  // CHAPTER-PULL — tied to authored chapters (Act I). Type-specific first,
  // 'any' as fallback. Chapters are inherently stage-appropriate.
  // =========================================================================

  // Ch.1 First Sale
  { id: 'ch1_any_offer', type: 'any', stat: 'revenue', effort: 'light', chapter: 'act1_ch1', title: 'Write your offer in one sentence' },
  { id: 'ch1_any_reach', type: 'any', stat: 'marketing', effort: 'heavy', chapter: 'act1_ch1', title: 'Get your offer in front of 10 people who have the problem' },
  { id: 'ch1_any_close', type: 'any', stat: 'revenue', effort: 'heavy', chapter: 'act1_ch1', title: 'Ask one interested person to buy or sign up — today' },
  { id: 'ch1_app_who', type: 'digital_product', stat: 'product', effort: 'light', chapter: 'act1_ch1', title: 'Write who your app is for and the one problem it solves' },
  { id: 'ch1_app_reach', type: 'digital_product', stat: 'marketing', effort: 'heavy', chapter: 'act1_ch1', title: 'Get your app in front of 10 people who have that problem' },
  { id: 'ch1_app_watch', type: 'digital_product', stat: 'product', effort: 'medium', chapter: 'act1_ch1', title: 'Get 5 target users to try it and watch what they do' },

  // Ch.2 First $1,000 month
  { id: 'ch2_any_volume', type: 'any', stat: 'revenue', effort: 'heavy', chapter: 'act1_ch2', title: 'Do the single most sale-producing activity, twice' },
  { id: 'ch2_any_pipeline', type: 'any', stat: 'operations', effort: 'medium', chapter: 'act1_ch2', title: 'List every open lead and its next step' },
  { id: 'ch2_app_channel', type: 'digital_product', stat: 'marketing', effort: 'medium', chapter: 'act1_ch2', title: 'Double down on the channel bringing the most installs' },
  { id: 'ch2_app_conv', type: 'digital_product', stat: 'revenue', effort: 'heavy', chapter: 'act1_ch2', title: 'Find and fix your biggest trial → paid drop-off' },

  // Ch.3 First Repeat Customer
  { id: 'ch3_any_return', type: 'any', stat: 'product', effort: 'medium', chapter: 'act1_ch3', title: 'Fix one reason customers don’t return' },
  { id: 'ch3_any_followup', type: 'any', stat: 'marketing', effort: 'medium', chapter: 'act1_ch3', title: 'Follow up with every past buyer you haven’t talked to in 30 days' },
  { id: 'ch3_app_retain', type: 'digital_product', stat: 'product', effort: 'medium', chapter: 'act1_ch3', title: 'Add one reason for users to come back tomorrow' },
  { id: 'ch3_app_winback', type: 'digital_product', stat: 'marketing', effort: 'medium', chapter: 'act1_ch3', title: 'Message lapsed users about one improvement you shipped' },

  // Ch.4 First $1,000 Month
  { id: 'ch4_app_channel', type: 'digital_product', stat: 'marketing', effort: 'heavy', chapter: 'act1_ch4', title: 'Push your best install channel hard for a week' },
  { id: 'ch4_app_convert', type: 'digital_product', stat: 'revenue', effort: 'heavy', chapter: 'act1_ch4', title: 'Fix the biggest leak between install and purchase' },
  { id: 'ch4_any_revenue', type: 'any', stat: 'revenue', effort: 'heavy', chapter: 'act1_ch4', title: 'Do the one thing most likely to drive paid installs, twice' },

  // Ch.5 First $1,000 MRR
  { id: 'ch5_app_annual', type: 'digital_product', stat: 'revenue', effort: 'medium', chapter: 'act1_ch5', title: 'Add an annual plan and surface it in your paywall' },
  { id: 'ch5_app_trial', type: 'digital_product', stat: 'revenue', effort: 'heavy', chapter: 'act1_ch5', title: 'Raise trial → paid conversion by one concrete change' },
  { id: 'ch5_any_retain', type: 'any', stat: 'product', effort: 'medium', chapter: 'act1_ch5', title: 'Remove one reason subscribers cancel' },
];
