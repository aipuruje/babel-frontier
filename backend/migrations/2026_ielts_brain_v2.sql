/**
 * Database Migration - 2026 IELTS Examiner Brain
 * Updates writing submissions table for enhanced feedback
 * 
 * Run this migration against your D1 database:
 * wrangler d1 execute DB --file=backend/migrations/2026_ielts_brain_v2.sql
 */

-- Create submissions table for async queue grading (if it doesn't exist)
CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId TEXT NOT NULL,
    username TEXT DEFAULT 'anonymous',
    essay TEXT NOT NULL,
    prompt TEXT DEFAULT NULL,
    word_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'COMPLETED', 'FAILED')),
    
    -- Band scores
    band_score REAL DEFAULT NULL,
    task_achievement REAL DEFAULT NULL,
    coherence_cohesion REAL DEFAULT NULL,
    lexical_resource REAL DEFAULT NULL,
    grammatical_range_accuracy REAL DEFAULT NULL,
    
    -- Enhanced feedback (2026)
    feedback TEXT DEFAULT NULL,  -- JSON object
    detailed_corrections TEXT DEFAULT NULL,  -- JSON array
    strengths TEXT DEFAULT NULL,  -- JSON array
    actionable_improvements TEXT DEFAULT NULL,  -- JSON array
    improvement_priority TEXT DEFAULT NULL,  -- "TR", "CC", "LR", or "GRA"
    
    -- Timestamps and metadata
    submitted_at TEXT DEFAULT (datetime('now')),
    completed_at TEXT DEFAULT NULL,
    grading_duration_seconds REAL DEFAULT NULL,
    
    -- Error handling
    error_message TEXT DEFAULT NULL,
    retry_count INTEGER DEFAULT 0
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_submissions_user_status 
ON submissions(userId, status);

CREATE INDEX IF NOT EXISTS idx_submissions_status 
ON submissions(status);

CREATE INDEX IF NOT EXISTS idx_submissions_completed_at 
ON submissions(completed_at DESC);

-- Create Cullen Checksum audit log table
CREATE TABLE IF NOT EXISTS cullen_audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    submission_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    cullen_checksum_passed INTEGER NOT NULL DEFAULT 0,  -- 0 = failed, 1 = passed
    failure_reason TEXT DEFAULT NULL,
    regeneration_count INTEGER DEFAULT 0,
    audited_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cullen_audit_user 
ON cullen_audit_log(user_id, audited_at DESC);

CREATE INDEX IF NOT EXISTS idx_cullen_audit_passed 
ON cullen_audit_log(cullen_checksum_passed);

-- Optional: Create analytics summary table for faster reporting
CREATE TABLE IF NOT EXISTS grading_analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,  -- YYYY-MM-DD
    total_submissions INTEGER DEFAULT 0,
    avg_band_score REAL DEFAULT NULL,
    avg_grading_duration_seconds REAL DEFAULT NULL,
    cullen_pass_rate REAL DEFAULT NULL,
    created_at TEXT NOT NULL,
    UNIQUE(date)
);

CREATE INDEX IF NOT EXISTS idx_grading_analytics_date 
ON grading_analytics(date DESC);
