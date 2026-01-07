INSERT INTO mistakes (user_id, skill_domain, error_type, transcription, correction, created_at) VALUES
('test_alisher', 'speaking', 'subordination', 'Although the rain, I went outside', 'Despite the rain, I went outside', datetime('now')),
('test_alisher', 'speaking', 'subordination', 'Although being tired, she continued', 'Despite being tired, she continued', datetime('now')),
('test_alisher', 'speaking', 'subordination', 'Although my efforts, I failed', 'Despite my efforts, I failed', datetime('now')),
('test_alisher', 'writing', 'cohesion', 'I like apples. I like oranges. I like bananas.', 'I like apples, oranges, and bananas.', datetime('now')),
('test_alisher', 'writing', 'cohesion', 'The weather was bad. The weather was cold.', 'The weather was bad and cold.', datetime('now')),
('test_alisher', 'speaking', 'grammar', 'He go to school every day', 'He goes to school every day', datetime('now'));
