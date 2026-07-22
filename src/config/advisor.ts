/**
 * Config for the weekly LLM deep-dive (SPEC #4, the one live-LLM feature).
 *
 * The Anthropic key never lives on-device — the app POSTs a PII-free metrics
 * snapshot to a Renmus-owned serverless endpoint that calls Claude and returns
 * prose. Set the endpoint at build time via an Expo public env var:
 *
 *   EXPO_PUBLIC_ADVISOR_ENDPOINT=https://<your-deployment>/api/advisor-deepdive
 *
 * Deploy the function in /server (see server/README.md). When unset, the
 * deep-dive degrades to the "coming to Pro" message and no request is made.
 */
export const ADVISOR_ENDPOINT: string =
  process.env.EXPO_PUBLIC_ADVISOR_ENDPOINT?.trim() || '';

export const ADVISOR_CONFIGURED = ADVISOR_ENDPOINT.length > 0;
