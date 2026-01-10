-- learner_state table for Brain Pack learner model
CREATE TABLE IF NOT EXISTS learner_state (
  user_id TEXT PRIMARY KEY,
  
  -- Mastery vector (6 skills, 0.0-1.0 range)
  mastery_json TEXT NOT NULL DEFAULT '{"comprehension_reading":0.12,"comprehension_listening":0.12,"language_grammar":0.12,"language_vocab":0.12,"production_writing":0.12,"production_speaking":0.12}',
  
  -- Error fingerprint (top 20 error tags with counts)
  error_fingerprint_json TEXT NOT NULL DEFAULT '[]',
  
  -- Fatigue tracking (0.0-1.0)
  fatigue REAL NOT NULL DEFAULT 0.0,
  
  -- Engagement metrics
  streak_days INTEGER NOT NULL DEFAULT 0,
  last_active_date TEXT,
  
  -- Device constraints
  device_class TEXT DEFAULT 'android_mid',
  network_hint TEXT DEFAULT 'wifi',
  low_power_mode INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_learner_state_updated ON learner_state(updated_at);
CREATE INDEX IF NOT EXISTS idx_learner_state_device ON learner_state(device_class);

-- Session regularities tracking
CREATE TABLE IF NOT EXISTS session_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  duration_seconds INTEGER,
  quests_attempted INTEGER DEFAULT 0,
  device_class TEXT,
  network_hint TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_session_user_time ON session_history(user_id, started_at);

-- Friction signals tracking
CREATE TABLE IF NOT EXISTS friction_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'rage_quit', 'hint_used', 'slow_task'
  quest_id TEXT,
  task_id TEXT,
  ts TEXT NOT NULL DEFAULT (datetime('now')),
  metadata_json TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_friction_user_type_ts ON friction_events(user_id, event_type, ts);
