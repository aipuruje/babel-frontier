-- Grading Queue Schema
-- Extends submissions table to support asynchronous grading with status tracking

-- Add status tracking columns to submissions table
ALTER TABLE submissions ADD COLUMN status TEXT DEFAULT 'COMPLETED' CHECK(status IN ('PENDING', 'COMPLETED', 'FAILED'));
ALTER TABLE submissions ADD COLUMN submitted_at TEXT DEFAULT (datetime('now'));
ALTER TABLE submissions ADD COLUMN completed_at TEXT;
ALTER TABLE submissions ADD COLUMN error_message TEXT;
ALTER TABLE submissions ADD COLUMN retry_count INTEGER DEFAULT 0;

-- Create index for efficient polling queries
CREATE INDEX IF NOT EXISTS idx_submissions_user_status ON submissions(userId, status);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);

-- Migration note: Existing rows will have status='COMPLETED' by default
-- New async submissions will be created with status='PENDING'

-- Example query for polling:
-- SELECT id, status, band_score, feedback, completed_at FROM submissions WHERE id = ? AND userId = ?;

-- Example query for monitoring pending jobs:
-- SELECT COUNT(*) as pending_count, AVG(julianday('now') - julianday(submitted_at)) * 24 * 60 as avg_wait_minutes 
-- FROM submissions WHERE status = 'PENDING';
