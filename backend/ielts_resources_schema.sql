-- IELTS Knowledge Chunks Table
CREATE TABLE IF NOT EXISTS ielts_knowledge_chunks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_book TEXT NOT NULL,
  chunk_type TEXT NOT NULL, -- 'grammar_rule', 'common_mistake', 'writing_template', 'vocabulary'
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  difficulty TEXT, -- 'intermediate', 'advanced', 'band_7+'
  skill_area TEXT, -- 'grammar', 'vocabulary', 'writing', 'reading', 'speaking'
  audio_file TEXT, -- path to associated audio (if any)
  page_reference TEXT,
  metadata TEXT, -- JSON for additional data
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Unlocked Resources Table
CREATE TABLE IF NOT EXISTS user_unlocked_resources (
  user_id TEXT NOT NULL,
  resource_type TEXT NOT NULL, -- 'grammar_rule', 'template', 'vocabulary_card', 'audio_drill'
  resource_id INTEGER NOT NULL, -- FK to ielts_knowledge_chunks.id
  unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, resource_id)
);

-- Audio Files Metadata Table
CREATE TABLE IF NOT EXISTS audio_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT NOT NULL UNIQUE,
  source_book TEXT NOT NULL,
  duration_seconds INTEGER,
  exercise_type TEXT, -- 'grammar_drill', 'vocabulary_pronunciation', 'listening_comprehension'
  difficulty TEXT,
  related_chunk_id INTEGER, -- FK to ielts_knowledge_chunks.id
  storage_path TEXT, -- R2 path or Worker asset path
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_chunks_skill ON ielts_knowledge_chunks(skill_area);
CREATE INDEX IF NOT EXISTS idx_chunks_difficulty ON ielts_knowledge_chunks(difficulty);
CREATE INDEX IF NOT EXISTS idx_chunks_type ON ielts_knowledge_chunks(chunk_type);
CREATE INDEX IF NOT EXISTS idx_user_unlocks ON user_unlocked_resources(user_id);
CREATE INDEX IF NOT EXISTS idx_audio_book ON audio_files(source_book);
