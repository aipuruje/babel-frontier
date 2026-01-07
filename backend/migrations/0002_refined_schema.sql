-- Final Production-Ready Master Schema
-- Optimized for 2026 Pedagogical Analytics

-- Main Submissions Table
CREATE TABLE IF NOT EXISTS submissions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    mission_id TEXT NOT NULL,
    mission_type TEXT CHECK(mission_type IN ('writing', 'speaking')),
    
    -- References
    r2_key TEXT,         -- Path to audio in R2 (for speaking)
    kv_draft_key TEXT,   -- Temporary key in KV (for writing)
    
    -- Status Tracking
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'completed', 'failed')),
    
    -- IELTS Scoring Data (Official Rounding)
    overall_band REAL,
    criteria_scores TEXT, -- JSON Object: {"TR": 6.5, "CC": 7.0, "LR": 6.0, "GRA": 6.5}
    
    -- AI Output (Aura & Examiner)
    feedback_json TEXT,
    
    -- Timestamps
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    completed_at INTEGER
) STRICT;

-- Performance Indices
CREATE INDEX IF NOT EXISTS idx_user_history ON submissions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_processing_queue ON submissions (status) WHERE status = 'pending';

-- Analytics View
DROP VIEW IF EXISTS v_user_growth;
CREATE VIEW v_user_growth AS
SELECT user_id, mission_type, AVG(overall_band) as current_avg
FROM submissions 
WHERE status = 'completed'
GROUP BY user_id, mission_type;
