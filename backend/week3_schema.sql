-- ============================================
-- WEEK 3: EMOTIONAL INTELLIGENCE & AR
-- ============================================

-- ============================================
-- DAY 15: CONFIDENCE ENGINE & PROSODY ANALYSIS
-- ============================================

-- Confidence scores (real-time analysis per speech session)
CREATE TABLE IF NOT EXISTS confidence_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  chunk_number INTEGER NOT NULL, -- For 2-second chunks
  confidence_index REAL NOT NULL, -- 0-100 scale
  pitch_variance REAL, -- Hz variance
  speech_rate REAL, -- Words per minute
  hesitation_count INTEGER DEFAULT 0,
  filler_words TEXT, -- JSON array of detected fillers
  long_pauses INTEGER DEFAULT 0, -- Pauses > 2s
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Prosody analytics (historical trends)
CREATE TABLE IF NOT EXISTS prosody_analytics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  date DATE NOT NULL,
  avg_confidence_index REAL,
  avg_pitch_variance REAL,
  avg_speech_rate REAL,
  total_hesitations INTEGER DEFAULT 0,
  total_long_pauses INTEGER DEFAULT 0,
  sessions_count INTEGER DEFAULT 0,
  improvement_trend TEXT, -- 'improving', 'stable', 'declining'
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  UNIQUE(user_id, date)
);

-- Filler spell suggestions (context-aware hints)
CREATE TABLE IF NOT EXISTS filler_suggestions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  context TEXT NOT NULL, -- Topic/situation
  filler_phrase TEXT NOT NULL, -- "Actually...", "That's an interesting question..."
  usage_count INTEGER DEFAULT 0,
  effectiveness_score REAL DEFAULT 5.0 -- User ratings
);

-- Combat aura multipliers (gamification)
CREATE TABLE IF NOT EXISTS aura_multipliers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  confidence_tier TEXT NOT NULL, -- 'titan', 'warrior', 'novice', 'spectre'
  damage_multiplier REAL NOT NULL, -- 2.0 for titan, 0.5 for spectre
  visual_effect TEXT, -- 'golden_glow', 'armor_crack', 'screen_glitch'
  duration_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Seed filler suggestions
INSERT OR IGNORE INTO filler_suggestions (context, filler_phrase, effectiveness_score) VALUES
('thinking_time', 'Actually, let me think about that...', 8.5),
('pause_recovery', 'That''s an interesting question.', 9.0),
('topic_transition', 'Speaking of which...', 7.5),
('agreement', 'I couldn''t agree more.', 8.0),
('elaboration', 'To put it another way...', 8.5),
('personal_experience', 'In my experience...', 9.0),
('example_intro', 'For instance...', 8.5),
('opinion_softener', 'I would say that...', 7.5),
('time_reference', 'These days...', 7.0),
('contrast', 'On the other hand...', 8.5);

CREATE INDEX IF NOT EXISTS idx_confidence_user_session ON confidence_scores(user_id, session_id);
CREATE INDEX IF NOT EXISTS idx_prosody_user_date ON prosody_analytics(user_id, date);
CREATE INDEX IF NOT EXISTS idx_aura_user_session ON aura_multipliers(user_id, session_id);

-- ============================================
-- DAY 16: AR SCANNER & MULTIMODAL READING
-- ============================================

-- AR scans (user scan history)
CREATE TABLE IF NOT EXISTS ar_scans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  object_detected TEXT NOT NULL, -- 'pepsi_bottle', 'street_sign', etc.
  object_category TEXT, -- 'beverage', 'signage', 'food', etc.
  scan_location TEXT, -- User-provided location context
  passage_id INTEGER, -- Link to generated passage
  quiz_completed BOOLEAN DEFAULT 0,
  quiz_score REAL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (passage_id) REFERENCES generated_passages(id)
);

-- Generated passages (AI-generated reading content)
CREATE TABLE IF NOT EXISTS generated_passages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_object TEXT NOT NULL, -- What was scanned
  passage_text TEXT NOT NULL, -- 200-word IELTS passage
  difficulty_band REAL DEFAULT 6.0,
  topic TEXT NOT NULL,
  headings TEXT NOT NULL, -- JSON array of 5 headings
  correct_heading INTEGER, -- Index of correct heading (0-4)
  reading_time_estimate INTEGER DEFAULT 120, -- seconds
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AR achievements
CREATE TABLE IF NOT EXISTS ar_achievements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  achievement_type TEXT NOT NULL, -- 'samarkand_scholar', 'vision_master', etc.
  scans_required INTEGER DEFAULT 3,
  scans_completed INTEGER DEFAULT 0,
  unlocked BOOLEAN DEFAULT 0,
  unlocked_at TIMESTAMP,
  reward_description TEXT,
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  UNIQUE(user_id, achievement_type)
);

CREATE INDEX IF NOT EXISTS idx_ar_scans_user ON ar_scans(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_generated_passages_object ON generated_passages(source_object);
CREATE INDEX IF NOT EXISTS idx_ar_achievements_user ON ar_achievements(user_id, unlocked);

-- ============================================
-- DAY 17: B2B UNIVERSITY BRIDGE
-- ============================================

-- University partners
CREATE TABLE IF NOT EXISTS university_partners (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  name_uz TEXT,
  country TEXT DEFAULT 'UK', -- 'UK', 'US', 'UZ', etc.
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  auth_token TEXT UNIQUE, -- Simple authentication
  placement_fee_uzs INTEGER DEFAULT 1000000, -- Per lead
  subscription_tier TEXT DEFAULT 'basic', -- 'basic', 'premium', 'enterprise'
  active BOOLEAN DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Placement leads (qualified students)
CREATE TABLE IF NOT EXISTS placement_leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  partner_id INTEGER NOT NULL,
  band_score REAL NOT NULL, -- Must be >= 7.5
  speaking_band REAL,
  listening_band REAL,
  reading_band REAL,
  writing_band REAL,
  student_name TEXT,
  student_email TEXT,
  student_phone TEXT,
  student_location TEXT,
  target_country TEXT, -- Student's study destination
  status TEXT DEFAULT 'new', -- 'new', 'contacted', 'consultation_booked', 'placed', 'rejected'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (partner_id) REFERENCES university_partners(id)
);

-- Consultation bookings
CREATE TABLE IF NOT EXISTS consultation_bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  partner_id INTEGER NOT NULL,
  consultation_date TIMESTAMP NOT NULL,
  consultation_type TEXT DEFAULT 'online', -- 'online', 'in_person'
  meeting_link TEXT,
  status TEXT DEFAULT 'scheduled', -- 'scheduled', 'completed', 'cancelled'
  student_notes TEXT,
  partner_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lead_id) REFERENCES placement_leads(id),
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (partner_id) REFERENCES university_partners(id)
);

-- Placement fees (revenue tracking)
CREATE TABLE IF NOT EXISTS placement_fees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  partner_id INTEGER NOT NULL,
  lead_id INTEGER NOT NULL,
  amount_uzs INTEGER NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'disputed'
  invoice_number TEXT UNIQUE,
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (partner_id) REFERENCES university_partners(id),
  FOREIGN KEY (lead_id) REFERENCES placement_leads(id)
);

-- Seed demo university partners
INSERT OR IGNORE INTO university_partners (name, name_uz, country, contact_email, auth_token, placement_fee_uzs) VALUES
('Cambridge International College', 'Kembrij Xalqaro Kolleji', 'UK', 'admissions@cambridge-demo.edu', 'partner_uk_001', 1000000),
('Westminster University Tashkent', 'Vestminster Universiteti Toshkent', 'UZ', 'info@westminster.uz', 'partner_uz_001', 800000),
('American University of Central Asia', 'Markaziy Osiyo Amerika Universiteti', 'US', 'admissions@auca-demo.edu', 'partner_us_001', 1200000);

CREATE INDEX IF NOT EXISTS idx_partners_active ON university_partners(active, country);
CREATE INDEX IF NOT EXISTS idx_placement_leads_partner ON placement_leads(partner_id, status);
CREATE INDEX IF NOT EXISTS idx_placement_leads_score ON placement_leads(band_score DESC);
CREATE INDEX IF NOT EXISTS idx_consultation_bookings_partner ON consultation_bookings(partner_id, status);
CREATE INDEX IF NOT EXISTS idx_placement_fees_partner ON placement_fees(partner_id, status);
