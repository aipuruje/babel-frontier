-- Neural Cross-Pollination Schema (SQLite Compatible)
-- Brain Evolution Step 4: Golden Thread System

CREATE TABLE IF NOT EXISTS active_memory_buffer (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    captured_phrase TEXT NOT NULL,
    source_context TEXT, -- 'reading', 'listening'
    skill_domain TEXT,
    activated INTEGER DEFAULT 0,
    expires_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
) STRICT;

CREATE TABLE IF NOT EXISTS phrase_activation_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    buffer_id INTEGER,
    user_id TEXT NOT NULL,
    deployed_in TEXT, -- 'speaking_mission', 'writing_task'
    mission_id TEXT,
    activated_at TEXT DEFAULT (datetime('now'))
) STRICT;

CREATE TABLE IF NOT EXISTS cognitive_load_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    typing_latency_ms INTEGER,
    speaking_hesitation_count INTEGER,
    correction_rate REAL,
    recorded_at TEXT DEFAULT (datetime('now'))
) STRICT;

CREATE TABLE IF NOT EXISTS scaffold_interventions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    intervention_type TEXT, -- 'visual_scaffold', 'prompt_nudge'
    context TEXT,
    created_at TEXT DEFAULT (datetime('now'))
) STRICT;

CREATE TABLE IF NOT EXISTS cullen_audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mission_id INTEGER,
    mission_type TEXT,
    template_detection_passed INTEGER DEFAULT 0,
    lexical_range_passed INTEGER DEFAULT 0,
    ielts_validity_passed INTEGER DEFAULT 0,
    band_calibration_passed INTEGER DEFAULT 0,
    cullen_checksum_passed INTEGER DEFAULT 0,
    rejection_reason TEXT,
    regeneration_count INTEGER DEFAULT 0,
    generated_by_model TEXT DEFAULT 'gemini-2.0-flash-exp',
    validation_prompt TEXT,
    audited_at TEXT DEFAULT (datetime('now'))
) STRICT;

CREATE TABLE IF NOT EXISTS user_mastery_progression (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    skill_domain TEXT,
    scaffold_level INTEGER DEFAULT 5,
    confidence_threshold REAL DEFAULT 0.7,
    last_updated TEXT DEFAULT (datetime('now'))
) STRICT;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_buffer_user_active ON active_memory_buffer(user_id, activated, expires_at);
CREATE INDEX IF NOT EXISTS idx_buffer_expires ON active_memory_buffer(expires_at);
CREATE INDEX IF NOT EXISTS idx_activation_user ON phrase_activation_log(user_id, activated_at);
CREATE INDEX IF NOT EXISTS idx_cognitive_metrics_user ON cognitive_load_metrics(user_id, recorded_at);
CREATE INDEX IF NOT EXISTS idx_scaffold_user ON scaffold_interventions(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_cullen_audit_passed ON cullen_audit_log(cullen_checksum_passed, audited_at);
