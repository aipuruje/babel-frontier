/**
 * Database Migration - 2026 IELTS Examiner Brain
 * Adds columns for categorized feedback and detailed corrections
 * 
 * Run this migration against your D1 database:
 * wrangler d1 execute DB --file=backend/migrations/2026_ielts_brain.sql
 */

-- Add new columns to submissions table for enhanced feedback
ALTER TABLE submissions 
ADD COLUMN detailed_corrections TEXT DEFAULT NULL;  -- JSON array of correction objects

ALTER TABLE submissions 
ADD COLUMN strengths TEXT DEFAULT NULL;  -- JSON array of strengths

ALTER TABLE submissions 
ADD COLUMN actionable_improvements TEXT DEFAULT NULL;  -- JSON array of actionable improvements

ALTER TABLE submissions 
ADD COLUMN improvement_priority TEXT DEFAULT NULL;  -- Single focus area (TR, CC, LR, GRA)

ALTER TABLE submissions
ADD COLUMN grading_duration_seconds REAL DEFAULT NULL;  -- Time taken to grade

-- Create index for faster user queries
CREATE INDEX IF NOT EXISTS idx_submissions_user_status 
ON submissions(userId, status);

-- Create index for analytics queries
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
    audited_at TEXT NOT NULL,
    FOREIGN KEY (submission_id) REFERENCES submissions(id)
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
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_grading_analytics_date 
ON grading_analytics(date DESC);
