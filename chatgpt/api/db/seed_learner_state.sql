-- Initial data for learner_state table (if needed for testing)
-- In production, learner states are created on first user activity

-- Example: Create a test user's initial learner state
INSERT OR IGNORE INTO learner_state (
  user_id,
  mastery_json,
  error_fingerprint_json,
  fatigue,
  streak_days,
  device_class,
  network_hint,
  created_at,
  updated_at
) VALUES (
  'demo_player',
  '{"comprehension_reading":0.12,"comprehension_listening":0.12,"language_grammar":0.12,"language_vocab":0.12,"production_writing":0.12,"production_speaking":0.12}',
  '[]',
  0.0,
  0,
  'android_mid',
  'wifi',
  datetime('now'),
  datetime('now')
);
