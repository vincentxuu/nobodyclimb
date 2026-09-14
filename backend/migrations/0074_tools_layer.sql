-- Phase 1: Tool Layer — rename ai_tools → tools, add management columns, seed builtin tools

-- Rename table
ALTER TABLE ai_tools RENAME TO tools;

-- Add management columns
ALTER TABLE tools ADD COLUMN category TEXT;
ALTER TABLE tools ADD COLUMN tags TEXT;
ALTER TABLE tools ADD COLUMN description_override TEXT;
ALTER TABLE tools ADD COLUMN config TEXT;
ALTER TABLE tools ADD COLUMN source TEXT NOT NULL DEFAULT 'builtin';
ALTER TABLE tools ADD COLUMN requires_auth INTEGER NOT NULL DEFAULT 0;
ALTER TABLE tools ADD COLUMN stats_call_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE tools ADD COLUMN stats_error_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE tools ADD COLUMN stats_avg_latency_ms REAL;

-- Seed 12 builtin tools
INSERT OR IGNORE INTO tools (id, name, description, parameters, enabled, category, tags, source, requires_auth) VALUES
  (hex(randomblob(16)), 'search_routes', '搜尋攀岩路線（混合向量 + 全文檢索）', '{}', 1, 'search', '["search","routes"]', 'builtin', 0),
  (hex(randomblob(16)), 'search_crags', '搜尋岩場資料', '{}', 1, 'search', '["search","crags"]', 'builtin', 0),
  (hex(randomblob(16)), 'sql_query', '結構化資料查詢（路線統計、難度分佈、岩場資訊等）', '{}', 1, 'data', '["data","sql"]', 'builtin', 0),
  (hex(randomblob(16)), 'weather', '查詢岩場天氣預報', '{}', 1, 'external', '["weather","external"]', 'builtin', 0),
  (hex(randomblob(16)), 'crag_info', '岩場詳細資訊查詢', '{}', 1, 'data', '["data","crag"]', 'builtin', 0),
  (hex(randomblob(16)), 'user_profile', '使用者攀登檔案', '{}', 1, 'personal', '["personal","profile"]', 'builtin', 1),
  (hex(randomblob(16)), 'recall_memory', '使用者記憶召回', '{}', 1, 'personal', '["personal","memory"]', 'builtin', 1),
  (hex(randomblob(16)), 'recommend', '路線推薦', '{}', 1, 'personal', '["personal","recommend"]', 'builtin', 1),
  (hex(randomblob(16)), 'suggest_training', '訓練建議', '{}', 1, 'personal', '["personal","training"]', 'builtin', 1),
  (hex(randomblob(16)), 'recommend_agent', '個人化路線推薦 sub-agent', '{}', 1, 'sub-agent', '["sub-agent","recommend"]', 'builtin', 1),
  (hex(randomblob(16)), 'coaching_agent', '教練分析 sub-agent', '{}', 1, 'sub-agent', '["sub-agent","coaching"]', 'builtin', 1),
  (hex(randomblob(16)), 'manage_goals', '攀岩目標設定與追蹤', '{}', 1, 'personal', '["personal","goals"]', 'builtin', 1);
