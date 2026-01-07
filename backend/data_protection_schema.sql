-- ========== DATA PROTECTION SCHEMA UPDATES ==========
-- Schema additions for encryption, audit logging, and GDPR compliance

-- Note: ALTER TABLE doesn't support IF NOT EXISTS in SQLite
-- Run this only once, or check if column exists first

-- Security audit logs table (CRITICAL for compliance)
CREATE TABLE IF NOT EXISTS security_audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    event_type TEXT NOT NULL,
    user_id TEXT,
    ip_address TEXT,
    user_agent TEXT,
    action TEXT NOT NULL,
    resource TEXT,
    before_value TEXT,
    after_value TEXT,
    severity TEXT DEFAULT 'INFO', -- INFO, WARNING, CRITICAL
    previous_log_hash TEXT,
    log_hash TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_user ON security_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_event ON security_audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON security_audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_severity ON security_audit_logs(severity);

-- User data consent table (GDPR compliance)
CREATE TABLE IF NOT EXISTS user_data_consent (
    user_id TEXT PRIMARY KEY,
    collective_learning INTEGER DEFAULT 0, -- Consent to use data for hive analytics
    elite_profile_sharing INTEGER DEFAULT 0, -- Consent to share profile with universities
    marketing_emails INTEGER DEFAULT 0,
    data_analytics INTEGER DEFAULT 1, -- General analytics (non-PII)
    consent_given_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_consent_collective ON user_data_consent(collective_learning);
CREATE INDEX IF NOT EXISTS idx_consent_elite ON user_data_consent(elite_profile_sharing);

-- Encryption key rotation log (track key changes)
CREATE TABLE IF NOT EXISTS encryption_key_rotations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rotated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    key_version TEXT NOT NULL,
    rotated_by TEXT, -- Admin user ID
    tables_affected TEXT, -- JSON array of table names
    records_updated INTEGER DEFAULT 0
);

-- Data retention policy log
CREATE TABLE IF NOT EXISTS data_retention_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    retention_days INTEGER NOT NULL,
    audit_logs_deleted INTEGER DEFAULT 0,
    writing_submissions_deleted INTEGER DEFAULT 0,
    other_records_deleted INTEGER DEFAULT 0
);

-- GDPR data subject requests log
CREATE TABLE IF NOT EXISTS gdpr_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    request_type TEXT NOT NULL, -- 'export', 'delete', 'rectify'
    requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    status TEXT DEFAULT 'pending', -- pending, completed, failed
    request_data TEXT, -- Additional request details
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE INDEX IF NOT EXISTS idx_gdpr_user ON gdpr_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_gdpr_status ON gdpr_requests(status);

-- Partner API logs table (already in collective_intelligence_schema.sql, but adding if missing)
CREATE TABLE IF NOT EXISTS partner_api_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    partner_id INTEGER NOT NULL,
    endpoint TEXT NOT NULL,
    ip_address TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    response_code INTEGER,
    FOREIGN KEY (partner_id) REFERENCES institutional_partners(id)
);

CREATE INDEX IF NOT EXISTS idx_partner_logs_partner ON partner_api_logs(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_logs_timestamp ON partner_api_logs(timestamp);

-- Add indexes for encrypted field searches (via hash)
-- Note: Encrypted fields can't be searched directly, use hashForSearch() for lookups
CREATE INDEX IF NOT EXISTS idx_users_email_hash ON users(email); -- Will store hash for lookup
CREATE INDEX IF NOT EXISTS idx_users_phone_hash ON users(phone_number); -- Will store hash

-- Comments on encrypted columns (for documentation)
-- ENCRYPTED FIELDS (AES-256-GCM):
-- users: email, phone_number
-- user_locations: region, district
-- institutional_partners: contact_email, contact_phone
-- elite_profiles: user_id (until claimed)
-- user_transactions: transaction_id, payment_details
