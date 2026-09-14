-- Phase 3 (v2): Skill Layer — multi-tenant, immutable versions, invocation tracking
-- Replaces the simplified single-table design.

-- Drop old simplified table if it exists
DROP TABLE IF EXISTS skills;

-- 1. Skill identity (immutable slug, mutable display_name)
CREATE TABLE IF NOT EXISTS skill (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL DEFAULT 'default',
  slug TEXT NOT NULL,
  display_name TEXT,
  scope TEXT NOT NULL DEFAULT 'org',
  owner_id TEXT,
  source TEXT NOT NULL DEFAULT 'custom',
  latest_version_id TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE (tenant_id, scope, slug)
);

-- 2. Immutable versions: published versions are never modified, only new ones created
CREATE TABLE IF NOT EXISTS skill_version (
  id TEXT PRIMARY KEY,
  skill_id TEXT NOT NULL REFERENCES skill(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  body TEXT,
  allowed_tools TEXT,
  content_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  token_count INTEGER,
  metadata TEXT,
  published_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE (skill_id, version_number)
);

-- 3. File pointers: actual content in R2, content-addressed for dedup
CREATE TABLE IF NOT EXISTS skill_file (
  id TEXT PRIMARY KEY,
  version_id TEXT NOT NULL REFERENCES skill_version(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  blob_key TEXT NOT NULL,
  size_bytes INTEGER,
  content_type TEXT,
  UNIQUE (version_id, path)
);

-- 4. Binding: who enabled what, with optional version pinning
CREATE TABLE IF NOT EXISTS skill_binding (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL DEFAULT 'default',
  subject_type TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  skill_id TEXT NOT NULL REFERENCES skill(id) ON DELETE CASCADE,
  pinned_version_id TEXT,
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE (subject_type, subject_id, skill_id)
);

-- 5. Invocation tracking: detect description precision issues
CREATE TABLE IF NOT EXISTS skill_invocation (
  id TEXT PRIMARY KEY,
  version_id TEXT NOT NULL,
  session_id TEXT,
  triggered_at TEXT DEFAULT (datetime('now')),
  outcome TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_skill_tenant_scope ON skill(tenant_id, scope);
CREATE INDEX IF NOT EXISTS idx_skill_version_skill ON skill_version(skill_id, status);
CREATE INDEX IF NOT EXISTS idx_skill_binding_subject ON skill_binding(subject_type, subject_id, enabled);
CREATE INDEX IF NOT EXISTS idx_skill_invocation_version ON skill_invocation(version_id, triggered_at);

-- Seed builtin skills: skill + version + binding for each

INSERT OR IGNORE INTO skill (id, tenant_id, slug, display_name, scope, source) VALUES
  ('sk_search', 'default', 'search', '搜尋路線與岩場', 'org', 'builtin'),
  ('sk_weather', 'default', 'weather', '天氣查詢', 'org', 'builtin'),
  ('sk_data', 'default', 'data', '資料查詢與統計', 'org', 'builtin'),
  ('sk_profile', 'default', 'profile', '個人攀登檔案', 'org', 'builtin'),
  ('sk_memory', 'default', 'memory', '記憶召回', 'org', 'builtin'),
  ('sk_goals', 'default', 'goals', '目標追蹤', 'org', 'builtin'),
  ('sk_recommend', 'default', 'recommend', '路線推薦', 'org', 'builtin'),
  ('sk_coaching', 'default', 'coaching', '訓練教練', 'org', 'builtin');

INSERT OR IGNORE INTO skill_version (id, skill_id, version_number, name, description, allowed_tools, content_hash, status, published_at) VALUES
  ('skv_search_1', 'sk_search', 1, 'search', '搜尋攀岩路線和岩場（混合向量 + 全文檢索）。當使用者問路線、岩場、搜尋、找、有哪些、在哪、怎麼去時觸發。', '["search_routes","search_crags"]', 'seed', 'published', datetime('now')),
  ('skv_weather_1', 'sk_weather', 1, 'weather', '查詢岩場天氣預報，判斷是否適合攀岩。當使用者問天氣、下雨、適合攀岩嗎時觸發。', '["weather"]', 'seed', 'published', datetime('now')),
  ('skv_data_1', 'sk_data', 1, 'data', '結構化資料查詢與統計（路線數量、難度分佈、排名等）。當使用者問幾條、有多少、統計、排名、FA、影片時觸發。', '["sql_query","crag_info"]', 'seed', 'published', datetime('now')),
  ('skv_profile_1', 'sk_profile', 1, 'profile', '使用者個人攀登檔案與記錄。當使用者問我的、我爬過、我的記錄、完攀時觸發。需登入。', '["user_profile"]', 'seed', 'published', datetime('now')),
  ('skv_memory_1', 'sk_memory', 1, 'memory', '使用者記憶召回。當使用者說記得、之前說過、上次、我的偏好時觸發。需登入。', '["recall_memory"]', 'seed', 'published', datetime('now')),
  ('skv_goals_1', 'sk_goals', 1, 'goals', '攀岩目標設定與追蹤。當使用者說目標、挑戰、想要達到、進度時觸發。需登入。', '["manage_goals"]', 'seed', 'published', datetime('now')),
  ('skv_recommend_1', 'sk_recommend', 1, 'recommend', '個人化路線推薦（根據攀登歷史和能力分析推薦下一條路線）。當使用者說推薦、建議、適合我、下一條時觸發。需登入。', '["recommend_agent"]', 'seed', 'published', datetime('now')),
  ('skv_coaching_1', 'sk_coaching', 1, 'coaching', '訓練計畫建議（分析弱點、制定針對性訓練計畫）。當使用者說訓練、練習、怎麼進步、弱點、指力時觸發。需登入。', '["coaching_agent"]', 'seed', 'published', datetime('now'));

-- Point latest_version_id
UPDATE skill SET latest_version_id = 'skv_search_1' WHERE id = 'sk_search';
UPDATE skill SET latest_version_id = 'skv_weather_1' WHERE id = 'sk_weather';
UPDATE skill SET latest_version_id = 'skv_data_1' WHERE id = 'sk_data';
UPDATE skill SET latest_version_id = 'skv_profile_1' WHERE id = 'sk_profile';
UPDATE skill SET latest_version_id = 'skv_memory_1' WHERE id = 'sk_memory';
UPDATE skill SET latest_version_id = 'skv_goals_1' WHERE id = 'sk_goals';
UPDATE skill SET latest_version_id = 'skv_recommend_1' WHERE id = 'sk_recommend';
UPDATE skill SET latest_version_id = 'skv_coaching_1' WHERE id = 'sk_coaching';

-- Default bindings (all skills bound to the default agent)
INSERT OR IGNORE INTO skill_binding (id, tenant_id, subject_type, subject_id, skill_id, enabled) VALUES
  ('sb_search', 'default', 'agent', 'default', 'sk_search', 1),
  ('sb_weather', 'default', 'agent', 'default', 'sk_weather', 1),
  ('sb_data', 'default', 'agent', 'default', 'sk_data', 1),
  ('sb_profile', 'default', 'agent', 'default', 'sk_profile', 1),
  ('sb_memory', 'default', 'agent', 'default', 'sk_memory', 1),
  ('sb_goals', 'default', 'agent', 'default', 'sk_goals', 1),
  ('sb_recommend', 'default', 'agent', 'default', 'sk_recommend', 1),
  ('sb_coaching', 'default', 'agent', 'default', 'sk_coaching', 1);
