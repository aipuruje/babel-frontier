-- Babel Frontier Load Testing: Database Migration
-- Run with: wrangler d1 execute babel-frontier-db --file=load-testing-migration.sql --remote

-- Create speaking_sessions table for R2 streaming architecture
CREATE TABLE IF NOT EXISTS speaking_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT UNIQUE NOT NULL,
    user_id TEXT NOT NULL,
    mission_id TEXT NOT NULL,
    topic TEXT,
    status TEXT DEFAULT 'initialized',
    chunks_uploaded INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    last_chunk_at TEXT,
    finalized_at TEXT
);

-- Indexes for fast session lookups
CREATE INDEX IF NOT EXISTS idx_speaking_sessions_user 
    ON speaking_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_speaking_sessions_session_id 
    ON speaking_sessions(session_id);

-- Ensure submissions table has proper indexes for writing analytics
CREATE INDEX IF NOT EXISTS idx_submissions_user_id 
    ON submissions(userId);

CREATE INDEX IF NOT EXISTS idx_submissions_created_at 
    ON submissions(submitted_at);
