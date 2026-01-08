-- Content Forge Schema (SQLite Compatible)

CREATE TABLE IF NOT EXISTS pdf_teaching_points (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_pdf TEXT NOT NULL,
    chapter TEXT,
    feature_type TEXT NOT NULL,
    feature_name TEXT NOT NULL,
    band_requirement REAL,
    teaching_example TEXT,
    common_mistake TEXT,
    target_skill TEXT,
    created_at TEXT DEFAULT (datetime('now'))
) STRICT;

CREATE TABLE IF NOT EXISTS user_weakness_missions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    weakness_pattern TEXT NOT NULL,
    mission_title TEXT NOT NULL,
    mission_type TEXT NOT NULL,
    mission_content TEXT NOT NULL,
    difficulty TEXT,
    auto_generated INTEGER DEFAULT 1,
    triggered_by TEXT,
    created_at TEXT DEFAULT (datetime('now'))
) STRICT;

CREATE INDEX IF NOT EXISTS idx_teaching_points_type ON pdf_teaching_points(feature_type, band_requirement);
CREATE INDEX IF NOT EXISTS idx_weakness_missions_user ON user_weakness_missions(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_weakness_missions_pattern ON user_weakness_missions(weakness_pattern);
