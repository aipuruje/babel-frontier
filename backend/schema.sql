CREATE TABLE IF NOT EXISTS users (
  user_id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  telegram_id INTEGER UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_brain_state (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL UNIQUE,
  speaking_band REAL DEFAULT 4.0,
  listening_band REAL DEFAULT 0.0,
  reading_band REAL DEFAULT 0.0,
  writing_band REAL DEFAULT 0.0,
  total_xp INTEGER DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS equipment (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  item_type TEXT NOT NULL,
  item_name TEXT NOT NULL,
  band_unlocked REAL NOT NULL,
  equipped BOOLEAN DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS mistakes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  skill_domain TEXT NOT NULL,
  error_type TEXT NOT NULL,
  transcription TEXT,
  correction TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  skill_domain TEXT NOT NULL,
  question_text TEXT NOT NULL,
  difficulty_level TEXT NOT NULL,
  band_level REAL NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_mistakes ON mistakes(user_id, skill_domain);
CREATE INDEX IF NOT EXISTS idx_user_equipment ON equipment(user_id, equipped);

-- Seed sample questions
INSERT OR IGNORE INTO questions (skill_domain, question_text, difficulty_level, band_level) VALUES
('speaking', 'Describe your hometown.', 'beginner', 4.5),
('speaking', 'Talk about a memorable journey you took.', 'intermediate', 6.0),
('speaking', 'Discuss the impact of globalization on local cultures.', 'advanced', 8.0),
('speaking', 'What do you like to do in your free time?', 'beginner', 4.0),
('speaking', 'Describe a person who has influenced you.', 'intermediate', 6.5),
('speaking', 'Do you think technology makes us more or less social?', 'advanced', 7.5);
