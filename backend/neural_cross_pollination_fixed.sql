-- ============================================
-- NEURAL CROSS-POLLINATION SCHEMA
-- Brain Evolution Step 4: Golden Thread System
-- ============================================

-- Active Memory Buffer: Stores phrases captured from reading/listening
-- that must be deployed in speaking/writing within 4 hours
) STRICT;

-- Phrase Activation Log: Records successful deployments
) STRICT;

-- Cognitive Load Metrics: Real-time performance indicators
) STRICT;

-- Scaffold Interventions: Dynamic difficulty adjustments
) STRICT;

-- Cullen Audit Log: Quality assurance for auto-generated content
CREATE TABLE IF NOT EXISTS cullen_audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mission_id INTEGER, -- ID in user_weakness_missions or ai_generated_content
    mission_type TEXT,
    
    -- Validation checks
    template_detection_passed INTEGER DEFAULT 0,
    lexical_range_passed INTEGER DEFAULT 0,
    ielts_validity_passed INTEGER DEFAULT 0,
    band_calibration_passed INTEGER DEFAULT 0,
    
    -- Overall result
    cullen_checksum_passed INTEGER DEFAULT 0,
    
    -- Failure details
    rejection_reason TEXT,
    regeneration_count INTEGER DEFAULT 0, -- How many times it was regenerated
    
    -- AI metadata
    generated_by_model TEXT DEFAULT 'gemini-2.0-flash-exp',
    validation_prompt TEXT, -- The prompt used for validation
    
    audited_at TEXT DEFAULT CURRENT_TEXT
) STRICT;

-- User Mastery Progression: Tracks scaffold fade-out
) STRICT;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_buffer_user_active ON active_memory_buffer(user_id, activated, expires_at);
CREATE INDEX IF NOT EXISTS idx_buffer_expires ON active_memory_buffer(expires_at);
CREATE INDEX IF NOT EXISTS idx_activation_user ON phrase_activation_log(user_id, activated_at);
CREATE INDEX IF NOT EXISTS idx_cognitive_metrics_user ON cognitive_load_metrics(user_id, recorded_at);
CREATE INDEX IF NOT EXISTS idx_scaffold_user ON scaffold_interventions(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_cullen_audit_passed ON cullen_audit_log(cullen_checksum_passed, audited_at);
