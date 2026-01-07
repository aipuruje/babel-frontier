-- ============================================
-- WEEK 4: TITAN PHASE (DAYS 22-28)
-- ============================================

-- ============================================
-- DAY 22: SPATIAL RAIDS (WebVR Integration)
-- ============================================

-- VR session tracking
CREATE TABLE IF NOT EXISTS vr_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  scenario_type TEXT NOT NULL, -- 'london_underground', 'london_citadel', etc.
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP,
  gyroscope_enabled BOOLEAN DEFAULT 0,
  spatial_audio_enabled BOOLEAN DEFAULT 0,
  artifacts_found INTEGER DEFAULT 0,
  completion_percentage REAL DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Gyroscope movement tracking
CREATE TABLE IF NOT EXISTS gyroscope_movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL,
  timestamp_ms INTEGER NOT NULL,
  alpha REAL, -- Z-axis rotation (0-360)
  beta REAL,  -- X-axis rotation (-180 to 180)
  gamma REAL, -- Y-axis rotation (-90 to 90)
  FOREIGN KEY (session_id) REFERENCES vr_sessions(id)
);

-- Spatial audio zones
CREATE TABLE IF NOT EXISTS spatial_audio_zones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scenario_type TEXT NOT NULL,
  speaker_name TEXT NOT NULL, -- 'Professor', 'Student', 'Background'
  position_x REAL NOT NULL,
  position_y REAL NOT NULL,
  position_z REAL NOT NULL,
  audio_url TEXT NOT NULL,
  volume_base REAL DEFAULT 1.0
);

-- 3D artifacts (Reading passages as objects)
CREATE TABLE IF NOT EXISTS vr_artifacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scenario_type TEXT NOT NULL,
  artifact_name TEXT NOT NULL,
  artifact_type TEXT NOT NULL, -- 'book', 'blueprint', 'scroll'
  position_x REAL NOT NULL,
  position_y REAL NOT NULL,
  position_z REAL NOT NULL,
  reading_passage_id INTEGER,
  difficulty TEXT DEFAULT 'intermediate',
  unlocked_by_default BOOLEAN DEFAULT 1
);

-- User artifact discoveries
CREATE TABLE IF NOT EXISTS artifact_discoveries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  session_id INTEGER NOT NULL,
  artifact_id INTEGER NOT NULL,
  discovered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  quiz_completed BOOLEAN DEFAULT 0,
  quiz_score REAL,
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (session_id) REFERENCES vr_sessions(id),
  FOREIGN KEY (artifact_id) REFERENCES vr_artifacts(id)
);

-- Seed spatial audio zones
INSERT OR IGNORE INTO spatial_audio_zones (scenario_type, speaker_name, position_x, position_y, position_z, audio_url) VALUES
('london_underground', 'Professor', -2.0, 0.0, 3.0, '/audio/professor_lecture.mp3'),
('london_underground', 'Student', 2.0, 0.0, 3.0, '/audio/student_question.mp3'),
('london_underground', 'Background', 0.0, 0.0, -5.0, '/audio/ambient_noise.mp3');

CREATE INDEX IF NOT EXISTS idx_vr_sessions_user ON vr_sessions(user_id, started_at);
CREATE INDEX IF NOT EXISTS idx_gyro_session ON gyroscope_movements(session_id, timestamp_ms);

-- ============================================
-- DAY 23: NEURAL MIRRORING (Phonetic Twinning)
-- ============================================

-- Waveform comparisons
CREATE TABLE IF NOT EXISTS waveform_analyses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  recording_id TEXT NOT NULL,
  native_model_id TEXT NOT NULL, -- Reference to native speaker sample
  similarity_score REAL, -- 0-100, how closely waveforms match
  stress_alignment_score REAL,
  intonation_alignment_score REAL,
  rhythm_score REAL,
  analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Native speaker models
CREATE TABLE IF NOT EXISTS native_speaker_models (
  id TEXT PRIMARY KEY,
  speaker_name TEXT NOT NULL,
  accent TEXT NOT NULL, -- 'british_rp', 'american_general', etc.
  phrase TEXT NOT NULL,
  audio_url TEXT NOT NULL,
  waveform_data TEXT, -- JSON array of amplitude values
  stress_pattern TEXT, -- JSON array of stress timings
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Nuance detection (irony, sarcasm)
CREATE TABLE IF NOT EXISTS nuance_detections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  phrase TEXT NOT NULL,
  detected_nuance TEXT, -- 'irony', 'sarcasm', 'understatement', 'none'
  confidence_score REAL,
  emotional_tone TEXT, -- 'amused', 'serious', 'neutral'
  diplomatic_immunity_earned BOOLEAN DEFAULT 0,
  detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Seed native speaker models
INSERT OR IGNORE INTO native_speaker_models (id, speaker_name, accent, phrase, audio_url) VALUES
('ns_001', 'Dr. Smith', 'british_rp', 'The implications are quite significant', '/audio/native/implications.mp3'),
('ns_002', 'Prof. Johnson', 'american_general', 'That being said, we must consider', '/audio/native/that_being_said.mp3');

CREATE INDEX IF NOT EXISTS idx_waveform_user ON waveform_analyses(user_id, analyzed_at);

-- ============================================
-- DAY 24: NATIONAL TOURNAMENT ($1M Prize)
-- ============================================

-- Tournament structure
CREATE TABLE IF NOT EXISTS tournaments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tournament_name TEXT NOT NULL,
  tournament_type TEXT NOT NULL, -- 'national', 'regional', 'city'
  prize_pool_uzs INTEGER DEFAULT 0,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP,
  status TEXT DEFAULT 'scheduled', -- 'scheduled', 'active', 'completed'
  max_participants INTEGER DEFAULT 100000,
  current_participants INTEGER DEFAULT 0
);

-- Tournament brackets
CREATE TABLE IF NOT EXISTS tournament_brackets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tournament_id INTEGER NOT NULL,
  round_number INTEGER NOT NULL,
  match_number INTEGER NOT NULL,
  player1_id TEXT,
  player2_id TEXT,
  winner_id TEXT,
  player1_score REAL,
  player2_score REAL,
  match_type TEXT DEFAULT 'speaking', -- 'speaking', 'writing', 'mixed'
  completed BOOLEAN DEFAULT 0,
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id)
);

-- Tournament registrations
CREATE TABLE IF NOT EXISTS tournament_registrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tournament_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  city TEXT NOT NULL,
  current_band REAL NOT NULL,
  registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  eliminated BOOLEAN DEFAULT 0,
  final_rank INTEGER,
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id),
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Prize payments (mock until Payme/Click integrated)
CREATE TABLE IF NOT EXISTS prize_payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tournament_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  amount_uzs INTEGER NOT NULL,
  payment_provider TEXT, -- 'payme', 'click', 'mock'
  payment_status TEXT DEFAULT 'pending', -- 'pending', 'verified', 'paid'
  transaction_id TEXT,
  paid_at TIMESTAMP,
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id),
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE INDEX IF NOT EXISTS idx_tournament_brackets ON tournament_brackets(tournament_id, round_number);
CREATE INDEX IF NOT EXISTS idx_tournament_registrations ON tournament_registrations(tournament_id, city);

-- ============================================
-- DAY 25: SERIES A DATA ROOM (Investor Metrics)
-- ============================================

-- Daily metrics snapshot
CREATE TABLE IF NOT EXISTS daily_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  metric_date DATE NOT NULL UNIQUE,
  dau INTEGER DEFAULT 0, -- Daily Active Users
  new_users INTEGER DEFAULT 0,
  revenue_uzs INTEGER DEFAULT 0,
  energy_purchases INTEGER DEFAULT 0,
  sultan_pass_sales INTEGER DEFAULT 0,
  avg_session_duration_seconds INTEGER DEFAULT 0,
  total_sessions INTEGER DEFAULT 0
);

-- User lifetime value tracking
CREATE TABLE IF NOT EXISTS user_ltv (
  user_id TEXT PRIMARY KEY,
  total_revenue_uzs INTEGER DEFAULT 0,
  acquisition_date DATE NOT NULL,
  last_active_date DATE,
  days_active INTEGER DEFAULT 0,
  retention_day_1 BOOLEAN DEFAULT 0,
  retention_day_7 BOOLEAN DEFAULT 0,
  retention_day_30 BOOLEAN DEFAULT 0,
  ltv_calculated REAL DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Cohort analysis
CREATE TABLE IF NOT EXISTS user_cohorts (
  cohort_id TEXT PRIMARY KEY, -- Format: YYYY-MM
  users_acquired INTEGER DEFAULT 0,
  month_1_retained INTEGER DEFAULT 0,
  month_3_retained INTEGER DEFAULT 0,
  month_6_retained INTEGER DEFAULT 0,
  avg_revenue_per_user REAL DEFAULT 0
);

-- Market projections
CREATE TABLE IF NOT EXISTS market_projections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  country TEXT NOT NULL,
  population_youth INTEGER NOT NULL,
  ielts_takers_annual INTEGER,
  avg_exam_price_usd REAL,
  projected_year_1_revenue_usd REAL,
  projected_year_3_revenue_usd REAL,
  competition_level TEXT, -- 'low', 'medium', 'high'
  market_readiness_score REAL, -- 0-100
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed market projections
INSERT OR IGNORE INTO market_projections (country, population_youth, ielts_takers_annual, avg_exam_price_usd, projected_year_1_revenue_usd, competition_level) VALUES
('Uzbekistan', 10000000, 50000, 200, 500000, 'low'),
('Kazakhstan', 6000000, 30000, 220, 300000, 'medium'),
('Turkey', 25000000, 100000, 180, 800000, 'high');

CREATE INDEX IF NOT EXISTS idx_daily_metrics_date ON daily_metrics(metric_date);

-- ============================================
-- DAY 26: MULTI-REGION CLONING
-- ============================================

-- Regional configurations
CREATE TABLE IF NOT EXISTS regional_configs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  country_code TEXT UNIQUE NOT NULL, -- 'UZ', 'KZ', 'TR'
  country_name TEXT NOT NULL,
  currency TEXT NOT NULL,
  locale TEXT NOT NULL, -- 'uz_UZ', 'kk_KZ', 'tr_TR'
  citadel_name TEXT NOT NULL, -- 'Samarkand Citadel', 'Almaty Zenith', 'Istanbul Spire'
  payment_provider TEXT, -- 'payme', 'click', 'kaspi', 'iyzico'
  edge_nodes_count INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT 0
);

-- Localized content
CREATE TABLE IF NOT EXISTS localized_content (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content_key TEXT NOT NULL,
  country_code TEXT NOT NULL,
  content_type TEXT NOT NULL, -- 'text', 'audio', 'image'
  content_value TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(content_key, country_code)
);

-- L1-specific phonetic errors
CREATE TABLE IF NOT EXISTS l1_phonetic_patterns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  country_code TEXT NOT NULL,
  error_type TEXT NOT NULL,
  source_sound TEXT NOT NULL,
  target_sound TEXT NOT NULL,
  example_word TEXT NOT NULL,
  correction_hint TEXT NOT NULL
);

-- Seed regional configs
INSERT OR IGNORE INTO regional_configs (country_code, country_name, currency, locale, citadel_name, payment_provider) VALUES
('UZ', 'Uzbekistan', 'UZS', 'uz_UZ', 'Samarkand Citadel', 'payme'),
('KZ', 'Kazakhstan', 'KZT', 'kk_KZ', 'Almaty Zenith', 'kaspi'),
('TR', 'Turkey', 'TRY', 'tr_TR', 'Istanbul Spire', 'iyzico');

-- Seed L1 patterns
INSERT OR IGNORE INTO l1_phonetic_patterns (country_code, error_type, source_sound, target_sound, example_word, correction_hint) VALUES
('UZ', 'consonant_cluster', 'sp', 's-p', 'speak', 'Don''t add vowel: say /spiːk/ not /ɪspiːk/'),
('KZ', 'vowel_reduction', 'ə', 'a', 'about', 'Use schwa /ə/ not /a/'),
('TR', 'word_stress', 'initial', 'varies', 'photograph', 'English stress varies: PHOtograph vs phoTOGraphy');

CREATE INDEX IF NOT EXISTS idx_localized_content ON localized_content(country_code, content_key);

-- ============================================
-- DAY 27: AI AUTONOMOUS GOVERNANCE
-- ============================================

-- System monitoring
CREATE TABLE IF NOT EXISTS system_health (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  cpu_usage_percent REAL,
  memory_usage_percent REAL,
  active_connections INTEGER,
  requests_per_minute INTEGER,
  error_rate_percent REAL,
  avg_response_time_ms REAL,
  status TEXT DEFAULT 'healthy' -- 'healthy', 'degraded', 'critical'
);

-- Automated alerts
CREATE TABLE IF NOT EXISTS automated_alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  alert_type TEXT NOT NULL, -- 'revenue_drop', 'black_swan_bug', 'b2b_partnership'
  severity TEXT NOT NULL, -- 'low', 'medium', 'high', 'critical'
  message TEXT NOT NULL,
  triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved BOOLEAN DEFAULT 0,
  resolved_at TIMESTAMP,
  action_taken TEXT
);

-- A/B test experiments
CREATE TABLE IF NOT EXISTS ab_experiments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  experiment_name TEXT NOT NULL,
  variant_a_description TEXT NOT NULL,
  variant_b_description TEXT NOT NULL,
  start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  end_date TIMESTAMP,
  variant_a_users INTEGER DEFAULT 0,
  variant_b_users INTEGER DEFAULT 0,
  variant_a_conversion REAL DEFAULT 0,
  variant_b_conversion REAL DEFAULT 0,
  winner TEXT, -- 'a', 'b', 'inconclusive'
  auto_deployed BOOLEAN DEFAULT 0
);

-- Self-healing actions log
CREATE TABLE IF NOT EXISTS self_healing_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  issue_detected TEXT NOT NULL,
  action_taken TEXT NOT NULL,
  success BOOLEAN DEFAULT 0,
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  execution_time_ms INTEGER
);

CREATE INDEX IF NOT EXISTS idx_system_health_time ON system_health(checked_at);
CREATE INDEX IF NOT EXISTS idx_alerts_unresolved ON automated_alerts(resolved, triggered_at);

-- ============================================
-- DAY 28: CORONATION & FINALE
-- ============================================

-- Founder achievements
CREATE TABLE IF NOT EXISTS founder_achievements (
  user_id TEXT PRIMARY KEY,
  founder_number INTEGER UNIQUE NOT NULL, -- 1-10000
  title TEXT DEFAULT 'Founder',
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  special_badge TEXT,
  lifetime_benefits TEXT, -- JSON array
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Finale events
CREATE TABLE IF NOT EXISTS finale_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL, -- 'fireworks', 'coronation', 'video_message'
  triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  participants INTEGER DEFAULT 0,
  status TEXT DEFAULT 'completed'
);

-- Legacy dashboard access
CREATE TABLE IF NOT EXISTS legacy_access (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  access_type TEXT NOT NULL, -- 'founder', 'investor', 'admin'
  user_id TEXT,
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  dashboard_url TEXT,
  api_key TEXT UNIQUE
);
