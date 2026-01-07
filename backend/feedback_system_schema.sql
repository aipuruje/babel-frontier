-- ============================================
-- PROFESSIONAL-GRADE FEEDBACK SYSTEM SCHEMA
-- Speaking & Writing with Confidence Filtering
-- ============================================

-- Speaking submissions with confidence metadata
CREATE TABLE IF NOT EXISTS speaking_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  audio_url TEXT NOT NULL, -- R2 storage URL
  
  -- Transcription data
  raw_transcript TEXT NOT NULL,
  sanitized_transcript TEXT NOT NULL, -- With [unclear] tags
  confidence_data TEXT NOT NULL, -- JSON: [{word, confidence, start, end}]
  
  -- Fluency metrics (extracted from audio analysis)
  filler_count INTEGER DEFAULT 0,
  long_pause_count INTEGER DEFAULT 0, -- Pauses > 2s
  pause_data TEXT, -- JSON: [{start, end, duration}]
  total_duration_seconds REAL,
  
  -- IELTS Scoring (4 criteria for Speaking)
  fluency_score REAL,
  lexical_resource_score REAL,
  grammatical_range_score REAL,
  pronunciation_score REAL,
  overall_band REAL,
  raw_band_score REAL, -- Unrounded score for internal tracking
  
  -- Feedback & Next Steps
  feedback TEXT, -- JSON with criterion-specific feedback
  improvement_priority TEXT, -- 'fluency', 'lexical', 'grammar', or 'pronunciation'
  actionable_tip TEXT, -- Next mission suggestion
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Progress history for motivation tracking
-- Stores raw scores over time to show "You're 0.08 away from Band 7.0!"
CREATE TABLE IF NOT EXISTS progress_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  skill_domain TEXT NOT NULL, -- 'speaking', 'writing', 'listening', 'reading'
  raw_score REAL NOT NULL, -- e.g., 6.22
  rounded_band REAL NOT NULL, -- e.g., 6.0 (or 6.5 if rounded up)
  submission_id INTEGER, -- Links to speaking_submissions or writing_submissions
  submission_type TEXT, -- 'speaking', 'writing'
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Add raw score tracking to existing writing_submissions
-- This allows us to show internal progress even when band score hasn't changed
ALTER TABLE writing_submissions ADD COLUMN raw_band_score REAL;
ALTER TABLE writing_submissions ADD COLUMN correction_count INTEGER DEFAULT 0;
ALTER TABLE writing_submissions ADD COLUMN high_impact_corrections TEXT; -- JSON array

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_speaking_submissions_user ON speaking_submissions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_progress_history_user_skill ON progress_history(user_id, skill_domain, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_progress_history_recent ON progress_history(recorded_at DESC);

-- Migration note: Existing writing_submissions rows will have raw_band_score = NULL
-- The system will backfill these on next submission or we can run a one-time migration
