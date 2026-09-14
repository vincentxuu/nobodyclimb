-- Phase 3: Skill Layer — DB metadata index for skills stored in R2

CREATE TABLE IF NOT EXISTS skills (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  triggers TEXT,                                     -- JSON array of keyword strings
  execution_mode TEXT NOT NULL DEFAULT 'tool_group',  -- 'tool_group' | 'sub_agent' | 'multi_step'
  required_tools TEXT NOT NULL DEFAULT '[]',          -- JSON array of tool names
  requires_auth INTEGER NOT NULL DEFAULT 0,
  version INTEGER NOT NULL DEFAULT 1,
  source TEXT NOT NULL DEFAULT 'builtin',             -- 'builtin' | 'plugin' | 'admin'
  enabled INTEGER NOT NULL DEFAULT 1,
  priority INTEGER NOT NULL DEFAULT 100,
  r2_key TEXT,                                        -- R2 object key (skills/{name}/SKILL.md)
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_skills_enabled ON skills(enabled);

-- Seed 8 builtin skills
INSERT OR IGNORE INTO skills (id, name, description, triggers, required_tools, execution_mode, requires_auth, source) VALUES
  (hex(randomblob(16)), 'search', '搜尋攀岩路線和岩場（混合向量 + 全文檢索）', '["路線","岩場","搜尋","找","有哪些","推薦路線","在哪","怎麼去"]', '["search_routes","search_crags"]', 'tool_group', 0, 'builtin'),
  (hex(randomblob(16)), 'weather', '查詢岩場天氣預報，判斷是否適合攀岩', '["天氣","下雨","適合攀岩嗎","出門","會不會下雨"]', '["weather"]', 'tool_group', 0, 'builtin'),
  (hex(randomblob(16)), 'data', '結構化資料查詢與統計（路線數量、難度分佈、排名等）', '["幾條","有多少","統計","分佈","排名","列出","清單","FA","首攀","影片"]', '["sql_query","crag_info"]', 'tool_group', 0, 'builtin'),
  (hex(randomblob(16)), 'profile', '使用者個人攀登檔案與記錄', '["我的","我爬過","我的記錄","我的等級","個人","完攀"]', '["user_profile"]', 'tool_group', 1, 'builtin'),
  (hex(randomblob(16)), 'memory', '使用者記憶召回', '["記得","之前說過","上次","我的偏好","我喜歡"]', '["recall_memory"]', 'tool_group', 1, 'builtin'),
  (hex(randomblob(16)), 'goals', '攀岩目標設定與追蹤', '["目標","挑戰","想要達到","進度","計畫","我想爬到","我想挑戰"]', '["manage_goals"]', 'tool_group', 1, 'builtin'),
  (hex(randomblob(16)), 'recommend', '個人化路線推薦（根據攀登歷史和能力分析）', '["推薦","建議","適合我","下一條","推薦我"]', '["recommend_agent"]', 'sub_agent', 1, 'builtin'),
  (hex(randomblob(16)), 'coaching', '訓練計畫建議（分析弱點、制定針對性訓練）', '["訓練","練習","怎麼進步","弱點","加強","指力","耐力"]', '["coaching_agent"]', 'sub_agent', 1, 'builtin');
