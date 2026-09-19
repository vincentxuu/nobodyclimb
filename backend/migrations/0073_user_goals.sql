-- 使用者攀岩目標追蹤
CREATE TABLE IF NOT EXISTS user_goals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  goal_type TEXT NOT NULL CHECK (goal_type IN ('grade', 'route', 'volume', 'custom')),
  title TEXT NOT NULL,
  target TEXT NOT NULL,
  current_value TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'achieved', 'paused', 'abandoned')),
  notes TEXT,
  target_date TEXT,
  achieved_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_user_goals_user_id ON user_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_goals_status ON user_goals(user_id, status);
