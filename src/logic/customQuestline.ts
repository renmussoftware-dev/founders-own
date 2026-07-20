import { type SQLiteDatabase } from 'expo-sqlite';
import { type CharacterRow } from '@/db/character';

/**
 * Phase 5 — weekly "custom questline" refresh (SPEC §3, §12 Phase 5).
 *
 * THE MARGIN RULE: this is the ONLY place the app is allowed to make a live
 * LLM call, and it is gated behind (a) a paid entitlement and (b) a 7-day
 * cooldown, so token cost always tracks a paid action — never a free user's
 * daily open. Daily quests remain on-device template assembly (see
 * logic/dailyQuests.ts). Do not add live generation anywhere else.
 */

const LAST_REFRESH_KEY = 'custom_questline_last_refresh';
const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

async function getMeta(db: SQLiteDatabase, key: string): Promise<string | null> {
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM app_meta WHERE key = ?',
    key
  );
  return row?.value ?? null;
}

async function setMeta(db: SQLiteDatabase, key: string, value: string) {
  await db.runAsync(
    'INSERT INTO app_meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?',
    key,
    value,
    value
  );
}

export interface CustomQuestlineStatus {
  eligible: boolean;
  reason: 'ok' | 'not_pro' | 'cooldown';
  nextAvailableAt: number | null;
}

export async function getCustomQuestlineStatus(
  db: SQLiteDatabase,
  isPro: boolean
): Promise<CustomQuestlineStatus> {
  if (!isPro) return { eligible: false, reason: 'not_pro', nextAvailableAt: null };

  const last = await getMeta(db, LAST_REFRESH_KEY);
  if (last) {
    const next = new Date(last).getTime() + COOLDOWN_MS;
    if (Date.now() < next) {
      return { eligible: false, reason: 'cooldown', nextAvailableAt: next };
    }
  }
  return { eligible: true, reason: 'ok', nextAvailableAt: null };
}

export interface GeneratedQuest {
  title: string;
  stat: string;
  effort: 'light' | 'medium' | 'heavy';
}

/**
 * The single live-LLM entry point. Wiring it to Claude (Renmus backend proxy)
 * is the remaining Phase 5 task; the prompt is assembled from the character's
 * business type, weakest stat, and active chapter. Throws until the endpoint
 * exists so callers surface "coming soon" rather than silently no-op.
 */
export async function generateCustomQuestline(
  _character: CharacterRow
): Promise<GeneratedQuest[]> {
  // TODO(Phase 5): POST the assembled prompt to the Renmus LLM proxy and map
  // the response into GeneratedQuest[]. Endpoint + auth pending.
  throw new Error('custom-questline-endpoint-not-configured');
}

export async function refreshCustomQuestline(
  db: SQLiteDatabase,
  character: CharacterRow,
  isPro: boolean
): Promise<GeneratedQuest[]> {
  const status = await getCustomQuestlineStatus(db, isPro);
  if (!status.eligible) {
    throw new Error(status.reason === 'not_pro' ? 'requires-pro' : 'on-cooldown');
  }
  const quests = await generateCustomQuestline(character);
  await setMeta(db, LAST_REFRESH_KEY, new Date().toISOString());
  return quests;
}
