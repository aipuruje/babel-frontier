-- Minimal security tables for immediate deployment
-- No ALTER TABLE commands (not supported with IF NOT EXISTS)

-- Security audit logs
CREATE TABLE IF NOT EXISTS security_audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    event_type TEXT NOT NULL,
    user_id TEXT,
    ip_address TEXT,
    action TEXT NOT NULL,
    resource TEXT,
    severity TEXT DEFAULT 'INFO',
    previous_log_hash TEXT,
    log_hash TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_user ON security_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_event ON security_audit_logs(event_type);

-- User consent table
CREATE TABLE IF NOT EXISTS user_data_consent (
    user_id TEXT PRIMARY KEY,
    collective_learning INTEGER DEFAULT 0,
    elite_profile_sharing INTEGER DEFAULT 0,
    consent_given_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
