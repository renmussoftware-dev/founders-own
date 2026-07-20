import { type BusinessType } from '@/db/character';
import { type StatKey } from '@/theme/tokens';

export type Effort = 'light' | 'medium' | 'heavy';

export interface QuestTemplate {
  id: string;
  /** 'any' templates serve every business type. */
  type: BusinessType | 'any';
  stat: StatKey;
  effort: Effort;
  title: string;
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
 * v1 authored pool (SPEC §6). Revenue/Marketing diverge per business type;
 * Product/Operations/Finance are near-universal. Habit quests are light.
 * The full per-chapter/per-type authoring pass is an open item (SPEC §13).
 */
export const QUEST_TEMPLATES: QuestTemplate[] = [
  // ---- Revenue — Digital product / app ----
  { id: 'rev_app_funnel', type: 'digital_product', stat: 'revenue', effort: 'medium', title: 'Check yesterday’s install → trial conversion, note one drop-off point' },
  { id: 'rev_app_adhook', type: 'digital_product', stat: 'revenue', effort: 'medium', title: 'Write one new ad hook to test' },
  { id: 'rev_app_reviews', type: 'digital_product', stat: 'revenue', effort: 'light', title: 'Reply to 3 App Store reviews' },
  { id: 'rev_app_paywall', type: 'digital_product', stat: 'revenue', effort: 'heavy', title: 'Change one thing on your paywall and note the before/after' },
  { id: 'rev_app_price', type: 'digital_product', stat: 'revenue', effort: 'medium', title: 'Compare your price against 3 competing apps' },

  // ---- Revenue — E-commerce ----
  { id: 'rev_ecom_cart', type: 'ecommerce', stat: 'revenue', effort: 'medium', title: 'Recover one abandoned cart' },
  { id: 'rev_ecom_list', type: 'ecommerce', stat: 'revenue', effort: 'medium', title: 'Email your list one restock or offer' },
  { id: 'rev_ecom_page', type: 'ecommerce', stat: 'revenue', effort: 'heavy', title: 'Improve one product page' },
  { id: 'rev_ecom_bundle', type: 'ecommerce', stat: 'revenue', effort: 'medium', title: 'Sketch one bundle or upsell you could offer this week' },

  // ---- Revenue — Services & freelance ----
  { id: 'rev_svc_past', type: 'services', stat: 'revenue', effort: 'medium', title: 'Reach out to 3 past clients for a referral or repeat order' },
  { id: 'rev_svc_proposal', type: 'services', stat: 'revenue', effort: 'light', title: 'Follow up one open proposal' },
  { id: 'rev_svc_offer', type: 'services', stat: 'revenue', effort: 'heavy', title: 'Rewrite your core offer in one sentence a stranger would understand' },
  { id: 'rev_svc_raise', type: 'services', stat: 'revenue', effort: 'medium', title: 'Price your next project 10% higher and write the justification' },

  // ---- Revenue — Local & in-person ----
  { id: 'rev_loc_review', type: 'local', stat: 'revenue', effort: 'light', title: 'Ask one completed customer for a Google review' },
  { id: 'rev_loc_gbp', type: 'local', stat: 'revenue', effort: 'light', title: 'Check your Google Business ranking for one keyword' },
  { id: 'rev_loc_repeat', type: 'local', stat: 'revenue', effort: 'medium', title: 'Text one past customer a seasonal offer' },
  { id: 'rev_loc_partner', type: 'local', stat: 'revenue', effort: 'heavy', title: 'Pitch one nearby business on referring each other' },

  // ---- Revenue — Content & audience ----
  { id: 'rev_con_offer', type: 'content', stat: 'revenue', effort: 'medium', title: 'Mention your paid thing in today’s content — once, naturally' },
  { id: 'rev_con_sponsor', type: 'content', stat: 'revenue', effort: 'heavy', title: 'Draft one sponsor or affiliate pitch' },
  { id: 'rev_con_product', type: 'content', stat: 'revenue', effort: 'medium', title: 'List 3 things your audience asks for that they’d pay for' },

  // ---- Revenue — generic fallback ('other') ----
  { id: 'rev_any_ask', type: 'any', stat: 'revenue', effort: 'medium', title: 'Make one direct ask for money today' },
  { id: 'rev_any_blocker', type: 'any', stat: 'revenue', effort: 'medium', title: 'Write down the #1 thing blocking your next sale — and one fix' },

  // ---- Marketing — type-specific ----
  { id: 'mkt_app_aso', type: 'digital_product', stat: 'marketing', effort: 'medium', title: 'Test one new App Store screenshot or subtitle idea' },
  { id: 'mkt_app_short', type: 'digital_product', stat: 'marketing', effort: 'medium', title: 'Post one short video showing the app solving a real problem' },
  { id: 'mkt_ecom_ugc', type: 'ecommerce', stat: 'marketing', effort: 'light', title: 'Repost one customer photo or review' },
  { id: 'mkt_ecom_content', type: 'ecommerce', stat: 'marketing', effort: 'medium', title: 'Ship one piece of content showing the product in use' },
  { id: 'mkt_svc_proof', type: 'services', stat: 'marketing', effort: 'medium', title: 'Turn one past project into a before/after post' },
  { id: 'mkt_svc_niche', type: 'services', stat: 'marketing', effort: 'light', title: 'Comment usefully in one place your clients hang out' },
  { id: 'mkt_loc_photo', type: 'local', stat: 'marketing', effort: 'light', title: 'Post one photo of today’s job with location tagged' },
  { id: 'mkt_con_study', type: 'content', stat: 'marketing', effort: 'light', title: 'Study one competitor’s top-performing post — note why it worked' },
  { id: 'mkt_con_post', type: 'content', stat: 'marketing', effort: 'medium', title: 'Post one piece of content in your niche' },
  { id: 'mkt_any_hook', type: 'any', stat: 'marketing', effort: 'medium', title: 'Write 3 hooks for the same message; keep the best' },
  { id: 'mkt_any_channel', type: 'any', stat: 'marketing', effort: 'medium', title: 'Show up once today where your buyers already are' },

  // ---- Product (shared) ----
  { id: 'prod_any_friction', type: 'any', stat: 'product', effort: 'medium', title: 'Fix one piece of friction a customer hit this week' },
  { id: 'prod_any_feedback', type: 'any', stat: 'product', effort: 'medium', title: 'Ask one recent customer what almost stopped them from buying' },
  { id: 'prod_any_polish', type: 'any', stat: 'product', effort: 'heavy', title: 'Spend 45 focused minutes making the thing itself better' },
  { id: 'prod_any_cut', type: 'any', stat: 'product', effort: 'medium', title: 'Cut or simplify one thing nobody uses' },

  // ---- Operations (shared) ----
  { id: 'ops_any_checklist', type: 'any', stat: 'operations', effort: 'medium', title: 'Turn one recurring task into a checklist' },
  { id: 'ops_any_automate', type: 'any', stat: 'operations', effort: 'heavy', title: 'Automate or delegate one thing you did manually this week' },
  { id: 'ops_any_inbox', type: 'any', stat: 'operations', effort: 'light', title: 'Clear every open customer message' },
  { id: 'ops_any_bottleneck', type: 'any', stat: 'operations', effort: 'medium', title: 'Name this week’s bottleneck and one way around it' },

  // ---- Finance (shared) ----
  { id: 'fin_any_numbers', type: 'any', stat: 'finance', effort: 'light', title: 'Review yesterday’s numbers — money in, money out' },
  { id: 'fin_any_expense', type: 'any', stat: 'finance', effort: 'light', title: 'Find one expense to cut or renegotiate' },
  { id: 'fin_any_runway', type: 'any', stat: 'finance', effort: 'medium', title: 'Update your runway — how many months at current burn?' },
  { id: 'fin_any_invoice', type: 'any', stat: 'finance', effort: 'light', title: 'Chase one unpaid invoice or pending payout' },

  // ---- Habits (light, third slot) ----
  { id: 'hab_any_numbers', type: 'any', stat: 'finance', effort: 'light', habit: true, title: 'Glance at your numbers before noon' },
  { id: 'hab_any_note', type: 'any', stat: 'operations', effort: 'light', habit: true, title: 'Write tomorrow’s top task before closing the day' },
  { id: 'hab_any_customer', type: 'any', stat: 'marketing', effort: 'light', habit: true, title: 'Talk to one customer or prospect today' },
  { id: 'hab_app_metrics', type: 'digital_product', stat: 'revenue', effort: 'light', habit: true, title: 'Check installs and trials — 2 minutes, no rabbit holes' },
  { id: 'hab_con_engage', type: 'content', stat: 'marketing', effort: 'light', habit: true, title: 'Reply to every comment on your latest post' },
  { id: 'hab_loc_photos', type: 'local', stat: 'marketing', effort: 'light', habit: true, title: 'Take one job-site photo for the content bank' },

  // ---- Chapter-pull — Act I (placeholder set until the authoring pass, SPEC §13) ----
  { id: 'ch1_any_offer', type: 'any', stat: 'revenue', effort: 'medium', chapter: 'act1_ch1', title: 'Write your offer in one sentence' },
  { id: 'ch1_any_prospects', type: 'any', stat: 'marketing', effort: 'heavy', chapter: 'act1_ch1', title: 'Put your offer in front of 10 people today' },
  { id: 'ch1_any_close', type: 'any', stat: 'revenue', effort: 'heavy', chapter: 'act1_ch1', title: 'Ask one warm prospect to buy — today' },
  { id: 'ch2_any_volume', type: 'any', stat: 'revenue', effort: 'heavy', chapter: 'act1_ch2', title: 'Do the single activity most likely to produce a sale, twice' },
  { id: 'ch2_any_pipeline', type: 'any', stat: 'operations', effort: 'medium', chapter: 'act1_ch2', title: 'List every open lead and its next step' },
  { id: 'ch3_any_return', type: 'any', stat: 'product', effort: 'medium', chapter: 'act1_ch3', title: 'Fix one reason customers don’t return' },
  { id: 'ch3_any_followup', type: 'any', stat: 'marketing', effort: 'medium', chapter: 'act1_ch3', title: 'Follow up with every past buyer you haven’t talked to in 30 days' },
];
