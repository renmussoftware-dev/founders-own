import { type SQLiteDatabase } from 'expo-sqlite';

/**
 * Versioned migrations driven by PRAGMA user_version.
 * Add a new entry to MIGRATIONS for every schema change; never edit old ones.
 */
const MIGRATIONS: string[] = [
  // v1 — initial schema, SPEC §7
  `
  CREATE TABLE character (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    business_name TEXT NOT NULL,
    business_initial TEXT NOT NULL,
    business_type TEXT NOT NULL CHECK (business_type IN
      ('digital_product','ecommerce','services','local','content','other')),
    overall_level INTEGER NOT NULL DEFAULT 1,
    rank_title TEXT NOT NULL DEFAULT 'Apprentice Founder',
    gems INTEGER NOT NULL DEFAULT 0,
    streak INTEGER NOT NULL DEFAULT 0,
    product_level INTEGER NOT NULL DEFAULT 1,
    product_xp INTEGER NOT NULL DEFAULT 0,
    marketing_level INTEGER NOT NULL DEFAULT 1,
    marketing_xp INTEGER NOT NULL DEFAULT 0,
    revenue_level INTEGER NOT NULL DEFAULT 1,
    revenue_xp INTEGER NOT NULL DEFAULT 0,
    operations_level INTEGER NOT NULL DEFAULT 1,
    operations_xp INTEGER NOT NULL DEFAULT 0,
    finance_level INTEGER NOT NULL DEFAULT 1,
    finance_xp INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE chapter_progress (
    chapter_id TEXT PRIMARY KEY,
    act INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'locked' CHECK (status IN
      ('locked','active','done','verified')),
    objectives_total INTEGER NOT NULL DEFAULT 0,
    objectives_done INTEGER NOT NULL DEFAULT 0,
    objective_flags TEXT NOT NULL DEFAULT '{}',
    completed_at TEXT
  );

  CREATE TABLE quest_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quest_date TEXT NOT NULL,
    template_id TEXT NOT NULL,
    slot TEXT NOT NULL CHECK (slot IN ('weakest_stat','chapter','habit')),
    title TEXT NOT NULL,
    stat TEXT NOT NULL CHECK (stat IN
      ('product','marketing','revenue','operations','finance')),
    effort TEXT NOT NULL CHECK (effort IN ('light','medium','heavy')),
    xp INTEGER NOT NULL,
    completed_at TEXT
  );
  CREATE INDEX idx_quest_log_date ON quest_log (quest_date);

  CREATE TABLE journal (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entry_date TEXT NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('daily','milestone')),
    body TEXT NOT NULL,
    xp_summary TEXT NOT NULL DEFAULT '{}',
    perfect_day INTEGER NOT NULL DEFAULT 0,
    founder_card_ref TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX idx_journal_date ON journal (entry_date);

  CREATE TABLE verification_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT NOT NULL CHECK (source IN ('stripe','revenuecat')),
    event_type TEXT NOT NULL,
    chapter_id TEXT,
    payload TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  `,

  // v2 — key/value app metadata (e.g. last custom-questline refresh, Phase 5)
  `
  CREATE TABLE app_meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
  `,

  // v3 — daily RevenueCat metric snapshots (powers the revenue sparkline + trend)
  `
  CREATE TABLE metric_snapshots (
    snapshot_date TEXT PRIMARY KEY,
    mrr REAL NOT NULL DEFAULT 0,
    revenue REAL NOT NULL DEFAULT 0,
    active_subscriptions INTEGER NOT NULL DEFAULT 0,
    active_users INTEGER NOT NULL DEFAULT 0,
    captured_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  `,

  // v4 — relax quest_log.slot CHECK to allow new slots (e.g. 'chain', #2)
  `
  CREATE TABLE quest_log_v4 (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quest_date TEXT NOT NULL,
    template_id TEXT NOT NULL,
    slot TEXT NOT NULL,
    title TEXT NOT NULL,
    stat TEXT NOT NULL CHECK (stat IN
      ('product','marketing','revenue','operations','finance')),
    effort TEXT NOT NULL CHECK (effort IN ('light','medium','heavy')),
    xp INTEGER NOT NULL,
    completed_at TEXT
  );
  INSERT INTO quest_log_v4
    (id, quest_date, template_id, slot, title, stat, effort, xp, completed_at)
    SELECT id, quest_date, template_id, slot, title, stat, effort, xp, completed_at
    FROM quest_log;
  DROP TABLE quest_log;
  ALTER TABLE quest_log_v4 RENAME TO quest_log;
  CREATE INDEX idx_quest_log_date ON quest_log (quest_date);
  `,

  // v5 — streak freezes: spendable tokens that bridge a single missed day
  `
  ALTER TABLE character ADD COLUMN streak_freezes INTEGER NOT NULL DEFAULT 0;
  `,
];

export async function migrateDbIfNeeded(db: SQLiteDatabase) {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let version = row?.user_version ?? 0;

  if (version >= MIGRATIONS.length) return;

  await db.execAsync('PRAGMA journal_mode = WAL');
  for (; version < MIGRATIONS.length; version++) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(MIGRATIONS[version]);
    });
  }
  await db.execAsync(`PRAGMA user_version = ${MIGRATIONS.length}`);
}
