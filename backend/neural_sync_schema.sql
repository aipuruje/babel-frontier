-- The Autopoietic Brain: Missions Schema
CREATE TABLE IF NOT EXISTS missions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    title TEXT,
    type TEXT,
    difficulty TEXT,
    content TEXT, -- JSON structure
    cullen_checksum_passed BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast retrieval by user
CREATE INDEX IF NOT EXISTS idx_missions_user_id ON missions(user_id);
