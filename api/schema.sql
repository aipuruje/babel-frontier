-- Users Table
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_id TEXT UNIQUE NOT NULL,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  photo_url TEXT,
  language_code TEXT DEFAULT 'en',
  is_premium BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_active DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_telegram_id ON users(telegram_id);

-- User Progress Table
CREATE TABLE user_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  module_id TEXT NOT NULL,
  xp INTEGER DEFAULT 0,
  progress INTEGER DEFAULT 0,
  mastery_level INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  first_started DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_practiced DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, module_id)
);

CREATE INDEX idx_user_progress ON user_progress(user_id, module_id);

-- Practice Attempts Table
CREATE TABLE practice_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  module_id TEXT NOT NULL,
  passage_id INTEGER,
  questions_total INTEGER NOT NULL,
  questions_correct INTEGER NOT NULL,
  time_spent INTEGER NOT NULL,
  xp_earned INTEGER DEFAULT 0,
  completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_attempts_user ON practice_attempts(user_id);
CREATE INDEX idx_attempts_module ON practice_attempts(module_id);

-- Analytics Events Table
CREATE TABLE analytics_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  event_data TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_events_user ON analytics_events(user_id);
CREATE INDEX idx_events_type ON analytics_events(event_type);
CREATE INDEX idx_events_date ON analytics_events(created_at);

-- User Streaks Table
CREATE TABLE user_streaks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id)
);
