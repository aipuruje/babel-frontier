-- Archive of Tongues MVP (D1/SQLite) schema
PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  tg_id TEXT UNIQUE,
  locale TEXT NOT NULL DEFAULT 'uz',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS player_state (
  user_id TEXT PRIMARY KEY,
  rank INTEGER NOT NULL DEFAULT 0,
  xp INTEGER NOT NULL DEFAULT 0,
  streak INTEGER NOT NULL DEFAULT 0,
  fatigue REAL NOT NULL DEFAULT 0,
  mastery_json TEXT NOT NULL,
  error_fingerprint_json TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS quests (
  id TEXT PRIMARY KEY,
  zone TEXT NOT NULL,
  template TEXT NOT NULL,
  difficulty INTEGER NOT NULL,
  canon INTEGER NOT NULL DEFAULT 0,
  json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_quest_progress (
  user_id TEXT NOT NULL,
  quest_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('UNLOCKED','COMPLETED')),
  completed_at TEXT,
  PRIMARY KEY (user_id, quest_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (quest_id) REFERENCES quests(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS quest_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  quest_id TEXT NOT NULL,
  ts TEXT NOT NULL,
  score INTEGER NOT NULL,
  max_score INTEGER NOT NULL,
  errors_json TEXT NOT NULL,
  time_spent_ms INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (quest_id) REFERENCES quests(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_items (
  user_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  qty INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (user_id, item_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

-- Social (Clan Lite)
CREATE TABLE IF NOT EXISTS clans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  region TEXT NOT NULL DEFAULT 'UZ',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS clan_members (
  clan_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'MEMBER',
  joined_at TEXT NOT NULL,
  PRIMARY KEY (clan_id, user_id),
  FOREIGN KEY (clan_id) REFERENCES clans(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_attempts_user_ts ON quest_attempts(user_id, ts);
CREATE INDEX IF NOT EXISTS idx_quests_zone ON quests(zone);
