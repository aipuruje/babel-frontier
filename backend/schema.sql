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

-- ============================================
-- WEEK 2: MONETIZATION & WRITING FOUNDRY
-- ============================================

-- Payment transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  transaction_id TEXT UNIQUE NOT NULL,
  payment_provider TEXT NOT NULL, -- 'click', 'payme', or 'mock'
  product_type TEXT NOT NULL, -- 'plov_potion', 'sultan_pass', 'scholarship_oracle'
  amount_uzs INTEGER NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'
  provider_response TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- User inventory (energy potions, passes, etc.)
CREATE TABLE IF NOT EXISTS user_inventory (
  user_id TEXT PRIMARY KEY,
  energy_potions INTEGER DEFAULT 0,
  current_energy INTEGER DEFAULT 5, -- Current available energy
  max_energy INTEGER DEFAULT 5, -- Max energy capacity
  sultan_pass_expires TIMESTAMP,
  scholarship_oracle_count INTEGER DEFAULT 0,
  total_spent_uzs INTEGER DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Writing submissions table
CREATE TABLE IF NOT EXISTS writing_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  prompt TEXT NOT NULL,
  essay_text TEXT NOT NULL,
  word_count INTEGER NOT NULL,
  band_score REAL,
  task_response_score REAL,
  cohesion_score REAL,
  lexical_score REAL,
  grammar_score REAL,
  feedback_json TEXT, -- Store Grand Vizier feedback
  xp_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Real-time writing analysis cache
CREATE TABLE IF NOT EXISTS writing_analysis_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  text_hash TEXT UNIQUE NOT NULL,
  analysis_json TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User energy usage tracking
CREATE TABLE IF NOT EXISTS energy_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  activity_type TEXT NOT NULL, -- 'speaking_battle', 'writing_session', etc.
  energy_cost INTEGER NOT NULL,
  win_streak INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_transactions_provider ON transactions(payment_provider, created_at);
CREATE INDEX IF NOT EXISTS idx_writing_user ON writing_submissions(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_energy_usage ON energy_usage(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_cache_hash ON writing_analysis_cache(text_hash);

-- ============================================
-- WEEK 2 DAY 5: SOCIAL WARFARE
-- ============================================

-- Guilds (teams/clans)
CREATE TABLE IF NOT EXISTS guilds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  name_uz TEXT,
  region TEXT NOT NULL, -- Chilanzar, Yunusabad, Samarkand, etc.
  founder_id TEXT NOT NULL,
  member_count INTEGER DEFAULT 1,
  total_influence_points INTEGER DEFAULT 0,
  average_band_score REAL DEFAULT 0.0,
  guild_rank INTEGER DEFAULT 999,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (founder_id) REFERENCES users(user_id)
);

-- Guild memberships
CREATE TABLE IF NOT EXISTS guild_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT DEFAULT 'member', -- 'founder', 'officer', 'member'
  contribution_points INTEGER DEFAULT 0,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (guild_id) REFERENCES guilds(id),
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  UNIQUE(guild_id, user_id)
);

-- Regional statistics (aggregated by city/district)
CREATE TABLE IF NOT EXISTS regional_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  region TEXT UNIQUE NOT NULL, -- e.g., "Chilanzar, Tashkent"
  country TEXT DEFAULT 'UZ',
  total_users INTEGER DEFAULT 0,
  average_band_score REAL DEFAULT 0.0,
  total_xp INTEGER DEFAULT 0,
  dominant_skill TEXT, -- 'speaking', 'writing', etc.
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User location (selected by user, not GPS)
CREATE TABLE IF NOT EXISTS user_locations (
  user_id TEXT PRIMARY KEY,
  region TEXT NOT NULL,
  city TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- User rivalries (friend challenges)
CREATE TABLE IF NOT EXISTS rivalries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  challenger_id TEXT NOT NULL,
  rival_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'declined'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (challenger_id) REFERENCES users(user_id),
  FOREIGN KEY (rival_id) REFERENCES users(user_id),
  UNIQUE(challenger_id, rival_id)
);

-- Guild battles (text-based challenges)
CREATE TABLE IF NOT EXISTS guild_battles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  challenger_guild_id INTEGER NOT NULL,
  opponent_guild_id INTEGER NOT NULL,
  prompt TEXT NOT NULL,
  winner_guild_id INTEGER,
  influence_reward INTEGER DEFAULT 50000,
  battle_start TIMESTAMP,
  battle_end TIMESTAMP,
  status TEXT DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed'
  battle_results TEXT, -- JSON with scores
  FOREIGN KEY (challenger_guild_id) REFERENCES guilds(id),
  FOREIGN KEY (opponent_guild_id) REFERENCES guilds(id),
  FOREIGN KEY (winner_guild_id) REFERENCES guilds(id)
);

-- ============================================
-- WEEK 2 DAY 6: INFINITE PEDAGOGY
-- ============================================

-- AI-generated content (missions/passages)
CREATE TABLE IF NOT EXISTS ai_generated_content (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content_type TEXT NOT NULL, -- 'reading', 'writing_prompt', 'speaking_question'
  skill_domain TEXT NOT NULL,
  difficulty_band REAL NOT NULL,
  topic TEXT NOT NULL,
  title TEXT,
  content_text TEXT NOT NULL,
  question_json TEXT, -- Store questions/answers as JSON
  target_skill TEXT, -- 'heading_matching', 'true_false_ng', etc.
  usage_count INTEGER DEFAULT 0,
  quality_score REAL DEFAULT 5.0, -- User ratings
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  generated_by TEXT DEFAULT 'gemini-2.0-flash'
);

-- Live events (boss raids, tournaments)
CREATE TABLE IF NOT EXISTS live_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL, -- 'boss_raid', 'tournament', 'global_challenge'
  title TEXT NOT NULL,
  title_uz TEXT,
  description TEXT NOT NULL,
  boss_name TEXT, -- e.g., "Spectre of the Passive Voice"
  goal_metric TEXT, -- 'complex_sentences', 'total_xp', etc.
  goal_target INTEGER, -- e.g., 10000 sentences
  current_progress INTEGER DEFAULT 0,
  reward_description TEXT,
  scheduled_start TIMESTAMP NOT NULL,
  scheduled_end TIMESTAMP NOT NULL,
  status TEXT DEFAULT 'upcoming', -- 'upcoming', 'active', 'completed', 'failed'
  participant_count INTEGER DEFAULT 0
);

-- Event participations
CREATE TABLE IF NOT EXISTS event_participations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  contribution INTEGER DEFAULT 0, -- e.g., sentences contributed
  reward_claimed BOOLEAN DEFAULT 0,
  participated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES live_events(id),
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  UNIQUE(event_id, user_id)
);

-- User notifications
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  notification_type TEXT NOT NULL, -- 'rivalry', 'guild_invite', 'event_start', 'achievement'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT, -- Deep link to relevant page
  is_read BOOLEAN DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE INDEX IF NOT EXISTS idx_guilds_region ON guilds(region, total_influence_points);
CREATE INDEX IF NOT EXISTS idx_guild_members_user ON guild_members(user_id);
CREATE INDEX IF NOT EXISTS idx_regional_stats_avg_band ON regional_stats(average_band_score DESC);
CREATE INDEX IF NOT EXISTS idx_ai_content_skill ON ai_generated_content(skill_domain, difficulty_band);
CREATE INDEX IF NOT EXISTS idx_live_events_status ON live_events(status, scheduled_start);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);

-- ============================================
-- WEEK 2 DAY 7: GRAND ORACLE MOCK EXAMS
-- ============================================

-- Mock exam sessions
CREATE TABLE IF NOT EXISTS mock_exams (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  exam_date DATE NOT NULL,
  exam_type TEXT DEFAULT 'grand_oracle', -- 'grand_oracle', 'scholarship_oracle'
  status TEXT DEFAULT 'scheduled', -- 'scheduled', 'active', 'completed'
  listening_questions TEXT, -- JSON array of questions
  reading_questions TEXT, -- JSON array of questions
  writing_prompts TEXT, -- JSON object {task1, task2}
  speaking_prompts TEXT, -- JSON array of part 1/2/3 questions
  difficulty_level TEXT DEFAULT 'band_6.0',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User exam attempts
CREATE TABLE IF NOT EXISTS exam_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  exam_id INTEGER NOT NULL,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  status TEXT DEFAULT 'in_progress', -- 'in_progress', 'completed', 'abandoned'
  time_spent_seconds INTEGER DEFAULT 0,
  tab_switches INTEGER DEFAULT 0, -- Anti-cheat tracking
  current_section TEXT DEFAULT 'listening', -- 'listening', 'reading', 'writing', 'speaking'
  progress_data TEXT, -- JSON with saved answers
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (exam_id) REFERENCES mock_exams(id),
  UNIQUE(user_id, exam_id)
);

-- Exam answers and scores
CREATE TABLE IF NOT EXISTS exam_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  attempt_id INTEGER NOT NULL UNIQUE,
  
  -- Listening
  listening_answers TEXT, -- JSON array
  listening_score REAL,
  listening_band REAL,
  
  -- Reading
  reading_answers TEXT, -- JSON array
  reading_score REAL,
  reading_band REAL,
  
  -- Writing
  writing_task1_text TEXT,
  writing_task1_band REAL,
  writing_task2_text TEXT,
  writing_task2_band REAL,
  writing_overall_band REAL,
  
  -- Speaking (text-based responses)
  speaking_part1_text TEXT,
  speaking_part2_text TEXT,
  speaking_part3_text TEXT,
  speaking_overall_band REAL,
  
  -- Overall
  overall_band REAL,
  predicted_ielts_score REAL,
  
  -- AI Analysis
  strengths TEXT, -- JSON array
  weaknesses TEXT, -- JSON array
  improvement_plan TEXT, -- Markdown text
  
  graded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (attempt_id) REFERENCES exam_attempts(id)
);

-- Dual reports (student + parent)
CREATE TABLE IF NOT EXISTS exam_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  result_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  
  -- Student report (gamer-focused, English)
  student_report_html TEXT,
  student_headline TEXT, -- "Your Speaking power is 15% higher!"
  
  -- Parent report (formal, Uzbek/Russian)
  parent_report_html TEXT,
  parent_report_language TEXT DEFAULT 'uz', -- 'uz', 'ru'
  parent_summary_uz TEXT,
  parent_summary_ru TEXT,
  
  -- Delivery
  telegram_message_sent BOOLEAN DEFAULT 0,
  report_viewed BOOLEAN DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (result_id) REFERENCES exam_results(id),
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Weekly weakness analysis (for Week 3 generation)
CREATE TABLE IF NOT EXISTS weekly_analytics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  week_number INTEGER NOT NULL,
  year INTEGER NOT NULL,
  
  -- Collective weaknesses
  top_weakness_1 TEXT, -- e.g., "heading_matching"
  top_weakness_2 TEXT,
  top_weakness_3 TEXT,
  
  -- Regional breakdowns
  weakness_by_region TEXT, -- JSON {"Chilanzar": "listening_maps", ...}
  
  -- Performance metrics
  avg_overall_band REAL,
  total_exams_taken INTEGER,
  completion_rate REAL,
  
  -- Auto-generated content IDs
  generated_mission_ids TEXT, -- JSON array of ai_generated_content IDs
  
  analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(week_number, year)
);

-- Conversion triggers (Sultan's Pass upsells)
CREATE TABLE IF NOT EXISTS conversion_triggers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  trigger_type TEXT NOT NULL, -- 'oracle_low_score', 'weakness_detected', 'competitor_ahead'
  triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  trigger_context TEXT, -- JSON with details
  modal_shown BOOLEAN DEFAULT 0,
  conversion_completed BOOLEAN DEFAULT 0,
  product_purchased TEXT,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE INDEX IF NOT EXISTS idx_exam_attempts_user ON exam_attempts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_exam_results_band ON exam_results(overall_band);
CREATE INDEX IF NOT EXISTS idx_exam_reports_user ON exam_reports(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_weekly_analytics_week ON weekly_analytics(week_number, year);
CREATE INDEX IF NOT EXISTS idx_conversion_triggers_user ON conversion_triggers(user_id, triggered_at);

