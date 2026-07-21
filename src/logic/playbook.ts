import { type SQLiteDatabase } from 'expo-sqlite';
import { PLAYBOOK_TOTAL } from '@/content/playbook';

/** Persisted Launch Playbook progress — a set of completed item ids in app_meta. */

const KEY = 'playbook_done';

export async function getPlaybookDone(db: SQLiteDatabase): Promise<Set<string>> {
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM app_meta WHERE key = ?',
    KEY
  );
  if (!row) return new Set();
  try {
    return new Set(JSON.parse(row.value) as string[]);
  } catch {
    return new Set();
  }
}

async function save(db: SQLiteDatabase, done: Set<string>) {
  const value = JSON.stringify([...done]);
  await db.runAsync(
    'INSERT INTO app_meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?',
    KEY,
    value,
    value
  );
}

export async function togglePlaybookItem(
  db: SQLiteDatabase,
  id: string
): Promise<Set<string>> {
  const done = await getPlaybookDone(db);
  if (done.has(id)) done.delete(id);
  else done.add(id);
  await save(db, done);
  return done;
}

export function playbookProgress(done: Set<string>): { done: number; total: number } {
  return { done: done.size, total: PLAYBOOK_TOTAL };
}
