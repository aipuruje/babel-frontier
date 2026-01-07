-- ============================================
-- DAYS 18-20: SOVEREIGN PHASE
-- ============================================

-- ============================================
-- DAY 18: PHILOSOPHER'S DUEL (CRITICAL THINKING)
-- ============================================

-- Debate sessions with AI philosophers
CREATE TABLE IF NOT EXISTS debate_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  philosopher TEXT NOT NULL, -- 'socrates', 'al_khwarizmi', 'steve_jobs'
  task2_prompt TEXT NOT NULL,
  user_thesis TEXT, -- Student's initial position
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  final_score REAL,
  argument_depth_score REAL DEFAULT 0,
  cohesion_score REAL DEFAULT 0,
  complexity_score REAL DEFAULT 0,
  turns_count INTEGER DEFAULT 0,
  won BOOLEAN DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Individual arguments in debate
CREATE TABLE IF NOT EXISTS logical_arguments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  debate_id INTEGER NOT NULL,
  turn_number INTEGER NOT NULL,
  speaker TEXT NOT NULL, -- 'student' or 'ai'
  argument_text TEXT NOT NULL,
  fallacies_detected TEXT, -- JSON array of detected fallacies
  sentence_structures TEXT, -- JSON array: ['conditional', 'concession', 'contrast']
  complexity_score REAL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (debate_id) REFERENCES debate_sessions(id)
);

-- Achievements for debate mastery
CREATE TABLE IF NOT EXISTS debate_achievements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  achievement_type TEXT NOT NULL, -- 'enlightened_scribe', 'logic_master', etc.
  debates_won INTEGER DEFAULT 0,
  debates_required INTEGER DEFAULT 3,
  unlocked BOOLEAN DEFAULT 0,
  unlocked_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  UNIQUE(user_id, achievement_type)
);

-- Task 2 prompts library
CREATE TABLE IF NOT EXISTS task2_prompts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  topic TEXT NOT NULL,
  prompt_text TEXT NOT NULL,
  difficulty TEXT DEFAULT 'intermediate', -- 'beginner', 'intermediate', 'advanced'
  usage_count INTEGER DEFAULT 0
);

-- Seed Task 2 prompts
INSERT OR IGNORE INTO task2_prompts (topic, prompt_text, difficulty) VALUES
('Space Exploration', 'Some people believe that space exploration is a waste of resources. To what extent do you agree or disagree?', 'intermediate'),
('Technology', 'Social media has made people less social. Do you agree or disagree?', 'beginner'),
('Education', 'University education should be free for all students. Discuss both views and give your opinion.', 'intermediate'),
('Environment', 'Individual actions cannot make a difference to environmental problems. Only governments and large companies can make a real impact. To what extent do you agree?', 'advanced'),
('Work-Life', 'Many people work long hours, leaving very little time for leisure activities. Does this situation have more advantages than disadvantages?', 'intermediate'),
('Globalization', 'Globalization is destroying local cultures and traditions. To what extent do you agree or disagree?', 'advanced');

CREATE INDEX IF NOT EXISTS idx_debate_sessions_user ON debate_sessions(user_id, completed_at);
CREATE INDEX IF NOT EXISTS idx_arguments_debate ON logical_arguments(debate_id, turn_number);

-- ============================================
-- DAY 19: THE GREAT GAME (NATIONAL SYNC)
-- ============================================

-- Regional battles (city vs city)
CREATE TABLE IF NOT EXISTS regional_battles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  battle_name TEXT NOT NULL,
  city_a TEXT NOT NULL, -- 'Tashkent', 'Samarkand', etc.
  city_b TEXT NOT NULL,
  scheduled_time TIMESTAMP NOT NULL,
  battle_start TIMESTAMP,
  battle_end TIMESTAMP,
  winner_city TEXT,
  city_a_total_score INTEGER DEFAULT 0,
  city_b_total_score INTEGER DEFAULT 0,
  city_a_participants INTEGER DEFAULT 0,
  city_b_participants INTEGER DEFAULT 0,
  status TEXT DEFAULT 'scheduled', -- 'scheduled', 'active', 'completed'
  rewards_distributed BOOLEAN DEFAULT 0
);

-- Territory control map
CREATE TABLE IF NOT EXISTS territory_control (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  region_name TEXT UNIQUE NOT NULL, -- 'Fergana Valley', 'Khorezm', etc.
  controlling_city TEXT,
  captured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  score_advantage REAL DEFAULT 0,
  battles_won_here INTEGER DEFAULT 0
);

-- Team contributions to battles
CREATE TABLE IF NOT EXISTS team_contributions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  battle_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  city TEXT NOT NULL,
  contribution_type TEXT NOT NULL, -- 'speaking', 'writing', 'reading'
  score REAL NOT NULL,
  contributed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (battle_id) REFERENCES regional_battles(id),
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- User city affiliations
CREATE TABLE IF NOT EXISTS city_registrations (
  user_id TEXT PRIMARY KEY,
  city_name TEXT NOT NULL,
  region_name TEXT,
  is_captain BOOLEAN DEFAULT 0,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  total_contributions INTEGER DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Seed territory data (12 regions of Uzbekistan)
INSERT OR IGNORE INTO territory_control (region_name, controlling_city) VALUES
('Tashkent City', NULL),
('Tashkent Region', NULL),
('Samarkand', NULL),
('Bukhara', NULL),
('Fergana Valley', NULL),
('Andijan', NULL),
('Namangan', NULL),
('Khorezm', NULL),
('Karakalpakstan', NULL),
('Kashkadarya', NULL),
('Surkhandarya', NULL),
('Jizzakh', NULL);

CREATE INDEX IF NOT EXISTS idx_battles_status ON regional_battles(status, scheduled_time);
CREATE INDEX IF NOT EXISTS idx_contributions_battle ON team_contributions(battle_id, city);
CREATE INDEX IF NOT EXISTS idx_city_registrations_city ON city_registrations(city_name);

-- ============================================
-- DAY 20: ORACLE'S SEAL (PREDICTIVE ANALYTICS)
-- ============================================

-- Prediction models for users
CREATE TABLE IF NOT EXISTS prediction_models (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  current_band REAL NOT NULL,
  target_band REAL DEFAULT 7.5,
  predicted_date DATE NOT NULL,
  confidence_pct REAL NOT NULL, -- 0-100
  days_to_target INTEGER NOT NULL,
  weakest_area TEXT, -- 'fluency', 'vocabulary', 'grammar', 'task_response'
  improvement_rate REAL, -- Points per day
  practice_frequency REAL, -- Sessions per week
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  achieved BOOLEAN DEFAULT 0,
  achieved_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Exam bookings
CREATE TABLE IF NOT EXISTS exam_bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  booking_id TEXT UNIQUE NOT NULL,
  exam_type TEXT DEFAULT 'academic', -- 'academic' or 'general'
  exam_date DATE NOT NULL,
  test_center TEXT NOT NULL,
  exam_fee_uzs INTEGER NOT NULL DEFAULT 2500000,
  commission_uzs INTEGER NOT NULL DEFAULT 250000, -- 10%
  payment_status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'confirmed'
  payment_provider TEXT, -- 'click', 'payme'
  booking_reference TEXT,
  booked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Readiness seals (certificates)
CREATE TABLE IF NOT EXISTS readiness_seals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  prediction_id INTEGER NOT NULL,
  seal_number TEXT UNIQUE NOT NULL,
  current_band REAL NOT NULL,
  predicted_band REAL NOT NULL,
  readiness_percentage REAL NOT NULL,
  issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  valid_until TIMESTAMP,
  certificate_url TEXT, -- Path to PDF
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (prediction_id) REFERENCES prediction_models(id)
);

-- Vocabulary recommendations
CREATE TABLE IF NOT EXISTS vocabulary_recommendations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  word TEXT NOT NULL,
  definition TEXT,
  example_sentence TEXT,
  importance_score REAL DEFAULT 5.0,
  mastered BOOLEAN DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Performance snapshots for prediction analysis
CREATE TABLE IF NOT EXISTS daily_performance_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  snapshot_date DATE NOT NULL,
  speaking_band REAL,
  fluency_score REAL,
  vocabulary_diversity REAL, -- Unique words / 100 words
  grammar_accuracy REAL, -- 1 - error_rate
  task_response_depth REAL, -- From debate scores
  practice_sessions_today INTEGER DEFAULT 0,
  total_xp INTEGER DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  UNIQUE(user_id, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_predictions_user ON prediction_models(user_id, generated_at);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON exam_bookings(user_id, exam_date);
CREATE INDEX IF NOT EXISTS idx_snapshots_user_date ON daily_performance_snapshots(user_id, snapshot_date);
CREATE INDEX IF NOT EXISTS idx_vocab_rec_user ON vocabulary_recommendations(user_id, mastered);
