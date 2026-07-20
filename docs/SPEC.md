# Founders Own — Build Spec & Handoff

_(Formerly "Founder RPG" — renamed to **Founders Own**. The repo directory, dev DB filename, and the design-canvas file keep the old `founder-rpg` name.)_

_Solo RPG that maps a real business onto a persistent character sheet. The player IS the character; their actual business is the campaign. Vendor-agnostic, universal for entrepreneurs, engineered for TikTok/Reels shareability._

---

## 1. Concept Summary

A single-player RPG where the player's real business progress drives a persistent character sheet. Five stats level up as the founder does real work; an authored questline provides the slow, meaningful arc; AI-assembled daily quests provide fast, frequent dopamine. Early milestones are self-reported (zero-friction onboarding); later money milestones are revenue-verified via integrations (un-fakeable, prestige-tier). Every milestone generates a shareable "founder card" — the built-in marketing engine.

**Design north star:** the loop must be intrinsically satisfying in solo mode. No leagues, no social feed, no moderation. Retention comes from persistent compounding progress (Stardew "my farm grew" → "my business grew"), a daily "just one more day" quest board, and a founder journal that becomes a personal record too valuable to abandon.

**What this is NOT:** a to-do list with badges. The anti-pattern to avoid at all costs is hollow tap-to-complete achievements. Verification and authored narrative are what separate this from Habitica-style generic gamification.

---

> **Design handoff integrated (Turn 7 "Arcane").** This spec incorporates the Claude Design bundle (`Founder RPG.dc.html`). That file is an iterative canvas of 7 turns; **Turn 7 is canonical** and the earlier turns are superseded exploration. The two imported files (`ios-frame.jsx`, `support.js`) are prototype scaffolding — a generic iOS device frame and the design runtime — with no app design content; do not port them. Recreate the Turn 7 screens pixel-faithfully in the RN/Expo stack; don't copy the prototype's HTML structure.
>
> **Two decisions applied on top of the design (differing from the Turn 7 prototype):**
> - **Fifth stat is "Finance," not "Grit."** The prototype shows Grit as the fifth stat; we're using **Finance** (money-management as a tracked domain) to keep the five stats mapped to real business competencies: Product · Marketing · Revenue · Operations · **Finance**. Anywhere the prototype art shows "Grit," substitute "Finance."
> - **Added a "Digital product / app" business type.** The prototype's onboarding offers Services / E-commerce / Content / Local / Not-sure — with no bucket for anonymous-download apps (the Fretionary case). We add **Digital product / app** as its own type so the quest engine can serve funnel/ASO/ad quests instead of nonsense like "reach out to past clients."

---

## 2. Core Design Decisions (locked)

| Decision | Choice | Rationale |
|---|---|---|
| Mode | Solo RPG | No cold-start, no moderation, matches solo-founder identity |
| Content model | Authored questline + AI-assembled daily quests | Polish where it matters, freshness where it's cheap |
| Questline structure | One universal spine, parameterized copy | Avoids authoring N trees per business type |
| Verification line | Act 1 self-reported → Act 2 transition → Act 3–4 verified | Frictionless start, un-fakeable where it counts |
| Verification framing | Verified = visibly different (gold) trophy | Verification is a flex, not a chore |
| Daily quests | On-device selection from tagged template pool | Protects margins under a lifetime (one-time) revenue model |
| Business type | 6 types chosen at onboarding (incl. Digital product/app); tags Revenue/Marketing templates | "Reach out to past clients" is nonsense for an anonymous-download app founder |
| Stats | Product · Marketing · Revenue · Operations · Finance | Real competencies; prototype's "Grit" replaced by Finance |
| v1 integration | Stripe-only (OAuth) + RevenueCat | Cleanest path; avoid the "every processor" scope trap |
| Monetization | Free = Act 1 + self-report; Paywall at Act 1→2 boundary; Lifetime hero $44.99 | Paywall lands at highest-intent moment |

---

## 3. The Margin Trap (critical constraint)

The lifetime IAP model means revenue is **one-time** but any live per-user-per-day API call is a **recurring cost with no marginal income** after purchase. This quietly inverts unit economics at scale.

**Therefore:** "AI-generated daily quests" means **AI-assembled from a parameterized template pool with on-device selection logic** — nearly free, offline-capable. Reserve true live LLM generation for a **premium weekly "custom questline" refresh** so token cost tracks a paid action, never a free user's daily open.

---

## 4. Questline Architecture (authored)

Three-level hierarchy, universal spine:

- **Acts** (macro arc): `Survival → Traction → Growth → Scale`
- **Chapters** = real milestones, each gated by a trigger (e.g. Act 1: "First Dollar," "First Repeat Customer," "First $1k Month")
- **Objectives** = authored 2–4 steps that make a milestone feel like a quest, not a number (e.g. "write your offer," "reach 10 prospects," "close one")

Business type changes **flavor text and tips only**, never structure.

**Verification by Act:**
- **Act 1 (Survival)** — fully self-reported. No integration ask.
- **Act 2 (Traction)** — money chapters offer *optional* verification; verified completion earns a gold trophy vs. standard.
- **Act 3–4 (Growth/Scale)** — verification expected; verified trophies are the prestige layer and paywall's emotional home.

---

## 5. Stats

Five stats, leveled by quest completion, never reset. Each carries a jewel tone (tile, progress bar, XP text) from the Arcane palette:

| Stat | Meaning | Jewel tone | Gradient · tint |
|---|---|---|---|
| **Product** | build/quality | Violet | `#9D8CF2→#7C68E8→#4F3EAE` · `#A493FF` |
| **Marketing** | reach/demand | Magenta | `#E89CD4→#B45C9E→#7E3A6E` · `#E89CD4` |
| **Revenue** | money in | Amber/gold | `#F0B865→#D68A3E→#9A5F1E` · `#F0B865` |
| **Operations** | systems/delivery | Teal | `#8ED2E8→#4A9CBE→#2E6A86` · `#8ED2E8` |
| **Finance** | money management / runway | Mint | `#7FD0A0→#3FA46C→#276A44` · `#7FD0A0` |

Each stat row: rounded tile with the stat initial, name, `LV.n` badge, progress bar, XP fraction (e.g. `820/1k`). The character sheet is a living RPG-styled dashboard — an avatar circle bearing the **business initial** (not a fantasy avatar), the business name, and a `Level n · [rank title]` line (e.g. "Journeyman Merchant"). Compounding feeling comes from these never resetting.

_(Note: prototype art labels the fifth stat "Grit" — render it as **Finance**. Mint tone retained.)_

---

## 6. Daily Quest Engine

- Author a large pool of **quest templates** tagged by `business_type`, `stat`, `chapter`, `effort`.
- On-device engine filters by `business_type` **first**, then picks **3 per day**: one for the weakest stat, one pulling toward the current chapter's objectives, one habit.
- Template slots filled locally. Free, offline, feels personalized.
- Drives the **streak** mechanic (retention insurance for solo mode).
- **Effort tiers** prevent burnout — never serve three heavy quests in one day. Habit quests are low-effort (minutes); weakest-stat and chapter quests can be medium/heavy.

### Business types (the divergence problem)

The authored **spine** stays universal — every business has Product/Marketing/Revenue/Operations/Finance. But the **revenue motion diverges hard** by business type, so a single template pool produces nonsense quests ("reach out to past clients" means nothing to a founder whose customers are anonymous App Store downloads).

Fix: a `business_type` field on `character`, chosen at onboarding (§8), plus a type tag on quest templates. Only **Revenue** (and some **Marketing**) templates need type-specific pools; Product/Ops/Finance overlap enough to stay shared with light parameterization ("review your numbers" is near-universal).

| Type | Who | Revenue quest examples |
|---|---|---|
| **Digital product / app** (anonymous downloads/subs) | Fretionary, Keytionary | "Check yesterday's install→trial conversion, note one drop-off point"; "Write one new ad hook to test"; "Reply to 3 App Store reviews" |
| **E-commerce** (physical products, customers) | Shopify stores, makers | "Recover one abandoned cart"; "Email your list one restock or offer"; "Improve one product page" |
| **Services & freelance** (few named clients) | freelancers, agencies, Boss Bros | "Reach out to 3 past clients for a referral or repeat order"; "Follow up one open proposal" |
| **Local & in-person** (physical, local demand) | hauling, trades, food | "Ask one completed customer for a Google review"; "Check GBP ranking for one keyword" |
| **Content & audience** (monetize attention) | creators, media | "Post one piece of content in your niche"; "Study one competitor's top-performing post" |

A sixth onboarding choice — **"Something else / not sure"** — falls back to a generic Revenue pool until the founder reclassifies (changeable anytime).

---

## 7. Data Model (expo-sqlite)

- `character` — 5 stat levels + XP (Product/Marketing/Revenue/Operations/**Finance**), overall level + rank title (e.g. "Journeyman Merchant"), `business_type` (Digital product/app · E-commerce · Services · Local · Content · Other — see §6/§8), business name/initial, total XP "gems" balance, current streak count
- `chapter_progress` — current act/chapter, per-objective completion flags, objective counter (e.g. `4/7`)
- `quest_log` — daily quests issued + completed + timestamp; drives streak and the "perfect day" flag (all 3 done)
- `journal` — auto-written daily entries + milestone entries with timestamps (content engine + personal record). _See §10 margin note on prose generation._
- Verified milestone events (RevenueCat/Stripe) write completions straight into `chapter_progress`

---

## 8. Onboarding Flow (3 steps — from design)

The design specifies a concrete 3-step flow (light/teal themed, before the app flips to the dark Arcane home). A progress bar (3 segments) runs across all three.

1. **"What are you building?"** — pick a business type from a card grid: **Digital product / app** (you have _users_) · **E-commerce** (you have _customers_) · **Services & freelance** (you have _clients_) · **Local & in-person** (you have _regulars_) · **Content & audience** (you have _followers_) · **Something else / not sure** (changeable anytime). Copy: "This shapes your quests — the work is different for a studio than a shop." This selection sets the `business_type` filter for the daily quest engine (§6). _(The **Digital product / app** card is our addition to the prototype's grid — it covers the anonymous-download case like Fretionary.)_
2. **"Mark how far you've come"** — a self-report checklist of early milestones ("I've told people about my idea" +Finance, "I have something I could sell today" +Product, "I've made my first sale" +Revenue, "I've sold to a stranger" +Marketing, "I've had a repeat customer" +Revenue). Each checked item grants stat XP and the screen live-computes a **starting level** (e.g. "Your character starts at Level 2 — Product 2 · Revenue 1 · Finance 2"). CTA: "Create my character." Copy sets the verification expectation: "We take your word for the early stuff. Money milestones get verified later — that's where the gold is."
3. **"Unlock the gold tier"** — the verification pitch, framed as opt-in reward not chore: gold-sealed milestones on your founder card, revenue chart on your quest board (auto-updated), and the trust line **"Read-only. We never touch your money."** Primary CTA **"Connect Stripe"** (gold button); secondary **"Later — start with self-report."**

After onboarding: straight into the Today/quest board (dark Arcane). Verification, if skipped here, is re-offered **contextually** at the first money chapter, never nagged.

---

## 9. Monetization

- **Free:** Act 1 + self-reported everything + basic daily quests
- **Paywall trigger:** Act 1→2 boundary (also the first real milestone = highest intent)
- **Premium unlocks:** verification integrations, verified-trophy tier, full journal history, AI custom questlines, premium card designs
- **Hero:** Lifetime "Founder's Edition" @ $44.99 (RevenueCat, hard paywall, monthly as price anchor)

---

## 10. Shareable Founder Cards (marketing engine)

Every chapter completion + level-up generates a shareable trophy card. **Design detail:** the card is deliberately **cream/light** (`#FAF9F5`) — a bright artifact that pops against the dark Arcane app and reads well in a feed. Milestone title is set in **Newsreader serif**; a gold circular seal + "Verified · Stripe" caps sit above it; below, business name + "N days in," then a 3-stat monospace footer (e.g. `Lv 7 Founder` · `34 Day streak` · `217 Quests done`), a `FOUNDERS OWN · [MONTH YEAR]` wordmark, and the tagline **"Un-fakeable. Pulled straight from your revenue."** Actions: **"Share founder card"** (gold) / **"Keep it in the journal."** Verified cards carry credibility — the antidote to fake-guru screenshots. Concept itself is a hook: "I turned my business into a video game." Author a **9:16 story variant** for Reels/TikTok.

**Margin note:** journal entries in the design read as written prose ("Shipped a glaze-day reel, asked three past clients for referrals — one said yes on the spot…"). Per §3, do **not** LLM-generate this per user per day on the free tier — assemble from the day's completed-quest data via templates, and reserve true prose generation for the premium tier.

---

## 11. Stack

React Native / Expo · TypeScript · Zustand · Expo Router · expo-sqlite · RevenueCat. Stripe Connect (OAuth) for revenue verification in v1. Renmus Software LLC.

---

## 11a. Visual Design System (Arcane — from design handoff)

**Theme:** dark "Arcane" indigo-violet. Onboarding is a lighter teal/cream lead-in; the app proper is dark.

- **App background:** radial gradient `#2A2450 → #1C1838 (55%) → #120F26`.
- **Surface cards:** `linear-gradient(180deg,#2C2652,#231E42)`, 1px border `rgba(237,234,251,.1)`, inner top highlight + soft drop shadow, radius 14–18px.
- **Primary text** `#EDEAFB`; secondary `rgba(237,234,251,.5–.6)`.
- **Stat jewel tones:** see §5 table (violet/magenta/amber/teal/mint).
- **Success** = mint (`#3FA46C` family). **Gold = verified, everywhere** (`#F0CD79 / #C89441 / #8A6224`) — verified milestones use a **hexagon seal** (`clip-path:polygon(50% 0,93% 25%,93% 75%,50% 100%,7% 75%,7% 25%)`) and a `VERIFIED` bordered caps badge.
- **Founder card** deliberately breaks the dark theme — cream `#FAF9F5` (see §10).

**Typography:**
- **Nunito** (600–900) — all UI: headings, stat names, buttons, badges, numbers on the quest board.
- **Newsreader** (serif, italic 400) — journal prose entries and founder-card milestone titles; the reflective/editorial voice.
- **ui-monospace / Menlo** — founder-card stat numbers and small tracked-caps labels.

**Motion (keyframes already named in the prototype):** `popIn` (badge pop, cubic-bezier overshoot), `floatUp` (rising "+25 Revenue XP" chip), `twinkle` (sparkles), `ringPulse` (active-quest halo), `shine` (sweep). Use these on quest-complete and milestone celebration.

**Navigation:** 4-tab bottom bar — **⌂ Today** (quest board / home) · **◆ Questline** · **✦ Character** · **✎ Journal**. Active tab is a raised violet gradient circle; inactive are low-opacity glyphs.

---

## 11b. Screen Inventory (Turn 7 canonical)

Build these screens. Each is a 390×844 iOS frame in the prototype.

1. **Today / Quest board** (home) — top bar: business-initial avatar, XP "gem" counter (e.g. `2,365`), streak flame (e.g. `34`). Heading "Complete today's quests" with a **completion ring** (`67%`, "2 of 3 done"). Three quest cards — completed (struck-through, `+15 ✓`), the just-completed one firing the celebration animation ("Quest complete!", floating `+25 Revenue XP`, sparkles, mint ring pulse), and a pending one ("One left — finish for a perfect day"). Bottom: the relevant stat's progress bar (`415 / 1,000 → LV.5`).
2. **Character sheet** — avatar (business initial) + business name + `Level 7 · Journeyman Merchant`; tab switcher **Stats / Milestones / Journal**; five stat rows; "Latest milestone" gold verified card.
3. **Questline map** — Act header ("Act I — Proof it works"); vertical spine timeline with node states: **done** (mint check), **verified-done** (gold hexagon, "Verified via Stripe"), **active** (violet ring, `4/7` objective count, italic chapter tagline e.g. "Make your offer worth coming back for," progress bar, "today's chapter quest"), **locked** (dashed), **gold gate** (money milestone, "Revenue-verified · gold tier," `GATE`). Footer: "Act II unlocks at Chapter 5 · 3 acts authored."
4. **Journal** — month streak calendar strip (gold = perfect day, violet = quest day, empty, dashed = today); auto-written daily entries in Newsreader italic serif with stat-XP chips and "PERFECT DAY" badges; milestone entries linking a saved founder card. Footer: "Day 114 of [business]. Every day is written down."
5. **Quest-complete (animated)** — the celebratory state of the Today board (see #1); this is a state, not a separate route.
6. **Verified milestone celebration** — full-screen takeover: radial rays + sparkles, cream card with a `$1K` hexagon seal, "VERIFIED · STRIPE," milestone name in a violet gradient. Fires when a verified money milestone lands.
7. **Founder card (shareable)** — see §10. Plus a 9:16 story export.
8. **Onboarding 1–3** — see §8 (business type → self-report starting point → verification pitch).

---

## 11c. Design Source Files

Bundle at `/mnt/user-data/uploads/`: `Founder_RPG_dc.html` (the canvas — read Turn 7 / anchors `7a`–`7e`, plus onboarding `4a`,`4b`,`5a`, and founder card `1c`). `ios-frame.jsx` and `support.js` are prototype scaffolding only — **do not port**. Recreate visuals in RN/Expo; don't copy prototype DOM structure.

---

## 12. Build Tasks (ordered)

### Phase 0 — Scaffold
- [x] Init Expo + TypeScript project, Expo Router, Zustand store, expo-sqlite
- [x] Set up the 5 SQLite tables per §7 with migrations
- [x] RevenueCat SDK wired (reuse Renmus pattern), hard paywall, lifetime $44.99 + monthly anchor
- [x] Establish the Arcane design system (§11a): theme tokens (colors/gradients/jewel tones), Nunito + Newsreader fonts, shared card/badge/hexagon-seal components, the 5 named animations, 4-tab bottom nav shell

### Phase 1 — Character & daily loop (free tier, no integrations)
- [x] 3-step onboarding per §8 (business type grid → self-report starting-point checklist that live-computes starting level/stats → verification pitch with "Later" path). _Note: a business-name field was added to step 2 (the design omits it, but the character sheet needs a name/initial)._
- [x] Character-sheet screen (§11b #2): avatar, name, level + rank title, Stats/Milestones/Journal tabs, 5 jewel-tone stat rows, latest-milestone card (empty state until Phase 2 milestones)
- [x] **Today / quest board** screen (§11b #1): avatar + XP gem counter + streak flame, "Complete today's quests," completion %, 3 quest cards, stat progress bar
- [x] Daily quest template pool (seed authored templates, tagged **business_type** + stat/chapter/effort) — `src/content/questTemplates.ts`; full per-chapter/per-type authoring pass still open (§13)
- [x] Model-specific Revenue/Marketing pools for each business type (see §6 table)
- [x] On-device daily-quest selection engine (filter by business_type → weakest-stat + chapter-pull + habit; respect effort tiers) — deterministic per-day seed, `src/logic/dailyQuests.ts`. **Stage-aware:** each template carries a journey `stage` (foundation/early/growth/scale) derived from the active chapter; the engine prefers a quest that is both business-type-specific AND stage-appropriate, then relaxes (type any-stage → universal at-stage → universal any-stage). Keeps "run an existing business" quests away from foundation founders who haven't started.
- [x] Quest completion → stat XP + gems → persist; streak + "perfect day" (all 3) tracking in `quest_log`
- [x] Quest-complete celebration animations (popIn / floatUp XP chip / twinkle / ringPulse) per §11a

### Phase 2 — Authored questline
- [x] Encode Acts → Chapters → Objectives as structured content (universal spine, parameterized flavor text) — `src/content/questline.ts` (4 acts, 12 chapters; Act I full per 7b, later acts have titles/taglines/objectives). Deep per-type flavor pass still open (§13).
- [x] **Questline map** screen (§11b #3): vertical spine, all node states (done / verified / active / locked / gold gate), act header + footer — `src/app/(tabs)/questline.tsx`
- [x] Self-reported completion flow (Act 1) — chapter-detail modal `src/app/chapter/[id].tsx`; DB helpers `src/db/chapters.ts`
- [x] **Journal** screen (§11b #4): streak calendar strip, auto-assembled daily entries (templated, not live-LLM), milestone entries, perfect-day badges — `src/app/(tabs)/journal.tsx`, engine `src/logic/journal.ts`

### Phase 3 — Verification (premium)
- [~] Stripe Connect OAuth flow — **UI + write-path built, OAuth launch stubbed pending Stripe credentials.** Verify screen `src/app/verify/[id].tsx`; the webhook target is `markChapterVerified` in `src/logic/verification.ts`. Dev-only "simulate" button exercises the path.
- [~] RevenueCat-based verification for applicable milestones — write-path shares `markChapterVerified(source:'revenuecat')`; trigger pending keys
- [x] Verified vs. standard trophy distinction (gold hexagon seal + VERIFIED badge) — questline/journal/founder-card/celebration all branch on `status='verified'`
- [x] Contextual verification prompt at first money chapter (re-uses onboarding step 3 content) — gold banner in chapter detail → verify screen
- [x] **Verified milestone celebration** full-screen takeover (§11b #6) — `src/app/milestone/[id].tsx` (verified vs self-reported variants)
- [x] Verified events write to `chapter_progress` (+ `verification_events` audit row)

### Phase 4 — Shareable cards & paywall
- [x] Founder-card generator (cream card, Newsreader title, gold seal, monospace stat footer, tagline) + **9:16 story export** — `src/components/FounderCard.tsx`, screen `src/app/founder-card/[id].tsx` (Post/Story toggle)
- [x] Share/export from journal — react-native-view-shot capture + expo-sharing (native); web falls back to capture-only with a note
- [x] Paywall at Act 1→2 boundary; gate premium features per §9 — `src/app/paywall.tsx`, triggered on completing `act1_ch5` for non-pro; renders RevenueCat packages when keys exist, static hero copy otherwise

### Phase 5 — Premium AI (margin-safe)
- [~] Weekly "custom questline" live-LLM refresh, gated to paid tier only — `src/logic/customQuestline.ts`: pro + 7-day-cooldown gate wired; the single live-LLM entry point `generateCustomQuestline` throws `not-configured` until the Renmus LLM proxy endpoint exists. Last-refresh persisted in `app_meta` (migration v2).

---

## 13. Open Questions for Next Session

**Still open:**
- Exact Act/Chapter/Objective content — the authored tree needs a dedicated writing pass (design shows Act I chapters: First Sale → First $1,000 month → First Repeat Customer → A Week That Runs Itself → First $10,000 month; extend to all acts).
- Which specific milestones are Stripe-verifiable vs. RevenueCat vs. self-report in the Act 2 transition zone.
- Full type-specific Revenue/Marketing template pools (chapter-pull quests especially — author by hand per chapter/type, across all 6 business types).
- Journal prose: exact templated-assembly approach vs. premium live generation (per §10 margin note).
- Rank-title ladder (design shows "Journeyman Merchant") — author the full level→title progression.

**Resolved:** fifth stat = **Finance** (not Grit) · added **Digital product / app** business type · onboarding flow · card visual direction · palette/typography · navigation model.
