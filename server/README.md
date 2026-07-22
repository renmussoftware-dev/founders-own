# Founders Own — Advisor deep-dive backend

A single serverless function that powers the app's **weekly AI deep-dive** (SPEC #4). It's the one place an Anthropic API key lives — the mobile app never holds it.

## What it does

1. The app POSTs a **PII-free metrics snapshot** (users, subs, MRR, churn %, conversion %, ARPU, MRR trend — no names, no user IDs, no keys) to `POST /api/advisor-deepdive`.
2. The function calls Claude (`claude-opus-4-8`) with that snapshot and a growth-advisor system prompt.
3. It returns `{ "read": "…" }` — a 150–220 word weekly read the app renders in the advisor card.

The app gates this behind **Pro + a 7-day cooldown** (`advisorDeepDiveEligible`), so per-user cost is ~one Opus call per week. The cooldown is only stamped on a successful response.

## Deploy (Vercel)

```bash
cd server
npm install
npx vercel link          # first time: create/link a project
vercel env add ANTHROPIC_API_KEY production   # paste your Anthropic key
npm run deploy           # vercel deploy --prod
```

Your endpoint will be `https://<project>.vercel.app/api/advisor-deepdive`.

### Environment variables

| Var | Required | Notes |
|-----|----------|-------|
| `ANTHROPIC_API_KEY` | ✅ | Your Anthropic key. Server-side only — never shipped to the app. |
| `ADVISOR_MODEL` | — | Override the model (default `claude-opus-4-8`). |

`maxDuration` is set to 60s in `vercel.json` so an adaptive-thinking turn can finish; the function streams internally and returns one JSON body.

## Point the app at it

Set the endpoint as an Expo public env var at build time, then rebuild:

```bash
# .env at the repo root (founder-rpg/), or your EAS build env
EXPO_PUBLIC_ADVISOR_ENDPOINT=https://<project>.vercel.app/api/advisor-deepdive
```

When unset, the app degrades gracefully — the deep-dive button shows "coming to Pro shortly" and no request is made (`src/config/advisor.ts`).

## Test it

```bash
curl -s https://<project>.vercel.app/api/advisor-deepdive \
  -H 'Content-Type: application/json' \
  -d '{"connected":true,"users":4200,"subs":180,"mrr":1610,"trials":90,"arpu":8.94,"mrrTrend":"up","churnRate":12,"trialConversion":21,"conversionToPaying":3.1,"questsThisWeek":4,"next":{"title":"First $2K month","label":"MRR","gap":390}}'
```

Expect a JSON `{ "read": "…" }`. Errors return `{ "error": "<code>" }` with a matching HTTP status (`invalid_snapshot`, `server_misconfigured`, `advisor_failed`, …).

## Other hosts

The handler is a standard `(req, res)` Node function. To run it on AWS Lambda, Cloudflare Workers, a plain Express route, etc., adapt the signature — the Claude call in the middle is unchanged. Keep `ANTHROPIC_API_KEY` server-side.
