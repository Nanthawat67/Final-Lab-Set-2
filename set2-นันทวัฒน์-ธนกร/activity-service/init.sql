CREATE TABLE IF NOT EXISTS activity_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  username VARCHAR(50),
  event_type VARCHAR(100),
  entity_type VARCHAR(50),
  entity_id INTEGER,
  summary TEXT,
  meta JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);