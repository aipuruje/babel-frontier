-- ============================================
-- BRAIN EVOLUTION STEP 6: COLLECTIVE INTELLIGENCE
-- The Hive-Mind Linguistic Governance System
-- ============================================

-- Regional Performance Clusters (Hive-Mind Aggregation)
CREATE TABLE IF NOT EXISTS regional_performance_clusters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    region TEXT NOT NULL,
    skill_domain TEXT NOT NULL, -- 'listening', 'reading', 'writing', 'speaking'
    criteria TEXT, -- 'listening_section_4', 'coherence', 'lexical_resource', etc.
    avg_score REAL DEFAULT 0.0,
    avg_band REAL DEFAULT 0.0,
    user_count INTEGER DEFAULT 0,
    national_avg_score REAL DEFAULT 0.0,
    deviation_from_national REAL DEFAULT 0.0, -- Positive = above average, negative = below
    last_aggregated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(region, skill_domain, criteria)
);

CREATE INDEX IF NOT EXISTS idx_regional_clusters_deviation ON regional_performance_clusters(deviation_from_national);
CREATE INDEX IF NOT EXISTS idx_regional_clusters_region ON regional_performance_clusters(region, skill_domain);

-- Linguistic Weakness Detection (Auto-Diagnosis)
CREATE TABLE IF NOT EXISTS linguistic_weakness_detection (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    region TEXT NOT NULL,
    skill_domain TEXT NOT NULL,
    criteria TEXT NOT NULL,
    weakness_severity REAL NOT NULL, -- Magnitude of deviation (e.g., -0.15 = 15% below national)
    affected_user_count INTEGER NOT NULL,
    pattern_description TEXT, -- AI-generated description of the weakness
    recommended_intervention TEXT, -- 'regional_event', 'targeted_content', 'accent_training'
    status TEXT DEFAULT 'detected', -- 'detected', 'intervention_active', 'resolved'
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_weakness_status ON linguistic_weakness_detection(status, weakness_severity);

-- Auto-Generated Regional Events (The "Regional Patch")
CREATE TABLE IF NOT EXISTS auto_generated_regional_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    weakness_id INTEGER, -- Links to linguistic_weakness_detection
    event_type TEXT NOT NULL, -- 'regional_quest', 'daily_challenge', 'accent_drill'
    title TEXT NOT NULL,
    title_uz TEXT,
    target_region TEXT NOT NULL,
    target_skill TEXT NOT NULL,
    target_criteria TEXT,
    
    -- Cultural Customization
    local_landmark TEXT, -- e.g., "Gates of Kokand", "Registan Square"
    cultural_context TEXT, -- JSON with region-specific flavor text
    
    -- Content
    mission_content TEXT NOT NULL, -- JSON structure matching ai_generated_content
    difficulty_band REAL DEFAULT 6.0,
    
    -- Engagement Metrics
    participant_count INTEGER DEFAULT 0,
    completion_rate REAL DEFAULT 0.0,
    avg_improvement REAL DEFAULT 0.0, -- Average band increase after completing
    
    -- Lifecycle
    active_from TIMESTAMP NOT NULL,
    active_until TIMESTAMP NOT NULL,
    status TEXT DEFAULT 'scheduled', -- 'scheduled', 'active', 'completed', 'expired'
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (weakness_id) REFERENCES linguistic_weakness_detection(id)
);

CREATE INDEX IF NOT EXISTS idx_regional_events_active ON auto_generated_regional_events(target_region, status, active_from);

-- News Content Pipeline (Infinite Lore Generator)
CREATE TABLE IF NOT EXISTS news_content_pipeline (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT NOT NULL, -- 'tashkent_times', 'itpark_uz', 'bbc_central_asia', 'kun_uz'
    article_title TEXT NOT NULL,
    article_url TEXT,
    article_summary TEXT,
    full_text TEXT,
    
    -- Relevance Scoring
    relevance_score REAL DEFAULT 0.0, -- 0-10: How relevant to Uzbekistan/education/economy
    topic_category TEXT, -- 'technology', 'economy', 'education', 'infrastructure', etc.
    
    -- Content Generation Status
    dungeon_generated BOOLEAN DEFAULT 0,
    generated_content_id INTEGER, -- Links to ai_generated_content
    generation_error TEXT,
    
    -- Metadata
    published_date TIMESTAMP,
    scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    
    FOREIGN KEY (generated_content_id) REFERENCES ai_generated_content(id)
);

CREATE INDEX IF NOT EXISTS idx_news_pipeline_relevance ON news_content_pipeline(relevance_score DESC, dungeon_generated);
CREATE INDEX IF NOT EXISTS idx_news_pipeline_source ON news_content_pipeline(source, published_date);

-- Institutional Partners (Sultan's API - B2G/B2B)
CREATE TABLE IF NOT EXISTS institutional_partners (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    partner_type TEXT NOT NULL, -- 'government', 'university', 'ngo', 'corporate'
    organization_name TEXT NOT NULL,
    contact_email TEXT,
    contact_phone TEXT,
    
    -- Access Control
    api_key TEXT UNIQUE NOT NULL,
    access_tier TEXT DEFAULT 'basic', -- 'basic', 'premium', 'enterprise'
    access_scopes TEXT, -- JSON array: ['literacy_heatmap', 'elite_profiles', 'weakness_stream']
    
    -- Billing
    subscription_plan TEXT, -- 'free', 'monthly_500', 'annual_5000'
    subscription_expires TIMESTAMP,
    total_revenue_uzs INTEGER DEFAULT 0,
    
    -- Usage Limits
    api_calls_this_month INTEGER DEFAULT 0,
    api_call_limit INTEGER DEFAULT 1000,
    
    -- Status
    status TEXT DEFAULT 'active', -- 'active', 'suspended', 'trial'
    onboarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_access TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_partners_api_key ON institutional_partners(api_key);
CREATE INDEX IF NOT EXISTS idx_partners_type ON institutional_partners(partner_type, status);

-- Elite Profiles (University Recruiting Pipeline)
CREATE TABLE IF NOT EXISTS elite_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    
    -- Performance Metrics (Anonymized in API)
    overall_band REAL NOT NULL,
    speaking_band REAL,
    writing_band REAL,
    reading_band REAL,
    listening_band REAL,
    
    -- Intelligence Signals
    performance_velocity REAL, -- How fast they improved (bands/week)
    logical_reasoning_score REAL, -- Derived from problem-solving tasks
    consistency_score REAL, -- Standard deviation of attempts
    
    -- Geographic Context (for "Diamond in the Rough" detection)
    region TEXT,
    is_rural BOOLEAN DEFAULT 0,
    
    -- Consent & Privacy
    user_consent BOOLEAN DEFAULT 0, -- User must opt-in to be shared
    anonymized_profile_data TEXT, -- JSON with sanitized info for universities
    
    -- Recruitment Status
    profile_status TEXT DEFAULT 'available', -- 'available', 'claimed', 'expired'
    claimed_by_partner_id INTEGER,
    claimed_at TIMESTAMP,
    placement_fee_uzs INTEGER, -- Fee charged to university
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP, -- Profiles expire after 90 days
    
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (claimed_by_partner_id) REFERENCES institutional_partners(id)
);

CREATE INDEX IF NOT EXISTS idx_elite_profiles_band ON elite_profiles(overall_band DESC, profile_status);
CREATE INDEX IF NOT EXISTS idx_elite_profiles_velocity ON elite_profiles(performance_velocity DESC);
CREATE INDEX IF NOT EXISTS idx_elite_profiles_consent ON elite_profiles(user_consent, profile_status);

-- Daily National Challenges (4AM Auto-Generation)
CREATE TABLE IF NOT EXISTS daily_national_challenges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    challenge_date DATE UNIQUE NOT NULL,
    
    -- Weakness Analysis Input
    top_weakness_1 TEXT NOT NULL, -- e.g., "listening_section_4"
    top_weakness_2 TEXT,
    top_weakness_3 TEXT,
    weakness_analysis TEXT, -- AI-generated summary of yesterday's data
    
    -- Challenge Content
    title TEXT NOT NULL,
    title_uz TEXT,
    description TEXT NOT NULL,
    mission_ids TEXT, -- JSON array of generated mission IDs
    
    -- Collective Goal
    goal_metric TEXT NOT NULL, -- 'total_completions', 'avg_improvement', 'regional_parity'
    goal_target INTEGER NOT NULL,
    current_progress INTEGER DEFAULT 0,
    
    -- Rewards
    reward_description TEXT,
    reward_badge_name TEXT,
    
    -- Engagement
    participants INTEGER DEFAULT 0,
    completed_count INTEGER DEFAULT 0,
    avg_score REAL DEFAULT 0.0,
    
    -- Status
    status TEXT DEFAULT 'upcoming', -- 'upcoming', 'active', 'completed', 'failed'
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_daily_challenges_date ON daily_national_challenges(challenge_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_challenges_status ON daily_national_challenges(status, challenge_date);

-- National Mastery Velocity (Self-Healing Monitor)
CREATE TABLE IF NOT EXISTS national_mastery_velocity (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    measurement_date DATE NOT NULL,
    
    -- Aggregate Performance
    total_active_users INTEGER DEFAULT 0,
    avg_overall_band REAL DEFAULT 0.0,
    avg_speaking_band REAL DEFAULT 0.0,
    avg_listening_band REAL DEFAULT 0.0,
    avg_reading_band REAL DEFAULT 0.0,
    avg_writing_band REAL DEFAULT 0.0,
    
    -- Velocity Metrics (change from previous period)
    band_velocity REAL DEFAULT 0.0, -- Change in avg_overall_band per day
    user_growth_rate REAL DEFAULT 0.0, -- % change in active users
    
    -- Economic Alignment
    users_above_threshold INTEGER DEFAULT 0, -- Count at Band 6.5+
    economic_opportunity_percentage REAL DEFAULT 0.0, -- % above threshold
    
    -- Health Indicators
    stalled_days INTEGER DEFAULT 0, -- Consecutive days with negative/zero velocity
    alert_triggered BOOLEAN DEFAULT 0,
    alert_message TEXT,
    
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(measurement_date)
);

CREATE INDEX IF NOT EXISTS idx_mastery_velocity_date ON national_mastery_velocity(measurement_date DESC);
CREATE INDEX IF NOT EXISTS idx_mastery_velocity_health ON national_mastery_velocity(stalled_days, alert_triggered);

-- Partner API Access Logs (Audit Trail)
CREATE TABLE IF NOT EXISTS partner_api_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    partner_id INTEGER NOT NULL,
    endpoint TEXT NOT NULL,
    method TEXT DEFAULT 'GET',
    request_params TEXT, -- JSON
    response_status INTEGER,
    data_rows_returned INTEGER DEFAULT 0,
    access_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (partner_id) REFERENCES institutional_partners(id)
);

CREATE INDEX IF NOT EXISTS idx_partner_logs_partner ON partner_api_logs(partner_id, access_timestamp);
CREATE INDEX IF NOT EXISTS idx_partner_logs_endpoint ON partner_api_logs(endpoint, access_timestamp);

-- User Opt-In for Data Sharing
CREATE TABLE IF NOT EXISTS user_data_consent (
    user_id TEXT PRIMARY KEY,
    collective_learning BOOLEAN DEFAULT 1, -- Contribute anonymized data to regional analytics
    elite_profile_sharing BOOLEAN DEFAULT 0, -- Allow profile sharing with universities
    government_insights BOOLEAN DEFAULT 1, -- Anonymized contribution to national heatmap
    consent_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Regional Event Participations
CREATE TABLE IF NOT EXISTS regional_event_participations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    score REAL DEFAULT 0.0,
    band_before REAL,
    band_after REAL,
    improvement REAL, -- band_after - band_before
    completed BOOLEAN DEFAULT 0,
    participated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES auto_generated_regional_events(id),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    UNIQUE(event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_regional_participation_event ON regional_event_participations(event_id, completed);
CREATE INDEX IF NOT EXISTS idx_regional_participation_user ON regional_event_participations(user_id, participated_at);

-- Daily Challenge Participations
CREATE TABLE IF NOT EXISTS daily_challenge_participations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    challenge_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    missions_completed INTEGER DEFAULT 0,
    total_score REAL DEFAULT 0.0,
    reward_claimed BOOLEAN DEFAULT 0,
    participated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (challenge_id) REFERENCES daily_national_challenges(id),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    UNIQUE(challenge_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_daily_participation_challenge ON daily_challenge_participations(challenge_id);
CREATE INDEX IF NOT EXISTS idx_daily_participation_user ON daily_challenge_participations(user_id, participated_at);
