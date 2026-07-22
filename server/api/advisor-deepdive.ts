import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';

/**
 * Weekly LLM deep-dive for the Founders Own advisor (SPEC #4).
 *
 * The app POSTs a PII-free metrics snapshot; this function holds the Anthropic
 * key (never on-device), asks Claude for a focused weekly growth read, and
 * returns `{ read }`. Deploy on Vercel (or any Node serverless host) and set
 * ANTHROPIC_API_KEY. The app points at it via EXPO_PUBLIC_ADVISOR_ENDPOINT.
 */

const MODEL = process.env.ADVISOR_MODEL || 'claude-opus-4-8';

/** Mirrors DeepDiveRequest in the app (src/logic/advisor.ts). No PII. */
interface DeepDiveRequest {
  connected: boolean;
  users: number;
  subs: number;
  mrr: number;
  trials: number;
  arpu: number;
  mrrTrend: 'up' | 'flat' | 'down' | 'unknown';
  churnRate: number | null;
  trialConversion: number | null;
  conversionToPaying: number | null;
  next: { title: string; label: string; gap: number } | null;
}

const SYSTEM = `You are a seasoned growth advisor for solo and indie app founders who monetize with in-app subscriptions (tracked via RevenueCat). You are speaking to one founder about their own app, using their real numbers.

Write a weekly read that does exactly three things, in this order and with no headings:
1. Name the single biggest bottleneck holding their revenue back right now.
2. Explain why, grounded in the specific numbers you were given — cite the actual figures.
3. Give 2–3 concrete, doable-this-week actions that attack that bottleneck.

Rules:
- Second person, direct, specific. No hype, no filler, no congratulating them for connecting data.
- 150–200 words. Be economical — every sentence must earn its place. Plain prose in short paragraphs. No markdown, no bullet symbols, no headings.
- Only reason from the numbers provided. If a metric is marked "not available", do not invent it — reason from what you have. Every number you cite must be one you were given or a direct calculation from them — never invent a metric you weren't handed.
- Benchmarks to anchor against: trial→paid conversion is typically 25–35%; monthly subscriber churn above ~8–10% is a leak worth fixing first; ARPU below ~$3 usually means pricing or upsell headroom.
- Pick ONE bottleneck and commit to it. Do not hedge across five things.`;

function money(n: number): string {
  return `$${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
}

function pct(n: number | null): string {
  return n === null ? 'not available' : `${Math.round(n)}%`;
}

function buildUserPrompt(s: DeepDiveRequest): string {
  const lines = [
    `Active users: ${s.users.toLocaleString('en-US')}`,
    `Active paying subscribers: ${s.subs.toLocaleString('en-US')}`,
    `Active trials: ${s.trials.toLocaleString('en-US')}`,
    `MRR: ${money(s.mrr)} (${s.mrrTrend} over the last two weeks)`,
    `Revenue per subscriber (ARPU): ${money(s.arpu)}/mo`,
    `Monthly subscriber churn: ${pct(s.churnRate)}`,
    `Trial-to-paid conversion: ${pct(s.trialConversion)}`,
    `New-customer-to-paying conversion: ${pct(s.conversionToPaying)}`,
  ];
  if (s.next) {
    lines.push(
      `Next milestone they're chasing: "${s.next.title}" — ${s.next.gap.toLocaleString(
        'en-US'
      )} ${s.next.label} to go`
    );
  }
  return `Here are this founder's current numbers:\n\n${lines.join(
    '\n'
  )}\n\nWrite their weekly read.`;
}

function isValid(b: unknown): b is DeepDiveRequest {
  if (!b || typeof b !== 'object') return false;
  const r = b as Record<string, unknown>;
  return (
    typeof r.users === 'number' &&
    typeof r.subs === 'number' &&
    typeof r.mrr === 'number' &&
    typeof r.arpu === 'number'
  );
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // The native app has no CORS; permissive headers only help the web dev preview.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  // Browser-checkable health probe: confirms the function deployed and whether
  // the Anthropic key is attached, without spending a Claude call.
  if (req.method === 'GET') {
    return res.status(200).json({ ok: true, keyConfigured: !!process.env.ANTHROPIC_API_KEY });
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'server_misconfigured' });
  }

  const body = typeof req.body === 'string' ? safeParse(req.body) : req.body;
  if (!isValid(body)) return res.status(400).json({ error: 'invalid_snapshot' });

  const client = new Anthropic();

  try {
    // Stream internally so a long turn doesn't hit the platform's HTTP timeout;
    // return the assembled prose as one JSON response to the app.
    const stream = client.messages.stream({
      model: MODEL,
      max_tokens: 1500,
      thinking: { type: 'adaptive' },
      output_config: { effort: 'medium' },
      system: SYSTEM,
      messages: [{ role: 'user', content: buildUserPrompt(body) }],
    });
    const message = await stream.finalMessage();
    const read = message.content
      .filter((blk): blk is Anthropic.TextBlock => blk.type === 'text')
      .map(blk => blk.text)
      .join('\n')
      .trim();
    if (!read) return res.status(502).json({ error: 'empty_read' });
    return res.status(200).json({ read });
  } catch (err) {
    const status = err instanceof Anthropic.APIError ? err.status ?? 502 : 502;
    return res.status(status).json({ error: 'advisor_failed' });
  }
}

function safeParse(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}
