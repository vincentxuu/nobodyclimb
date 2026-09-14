-- Phase 2 upgrade: hook on_failure/matcher/timeout, hook_execution audit, unified enablement

-- 1. Hook table: add matcher, handler, blocking, timeout, on_failure, source_plugin_id
ALTER TABLE hooks ADD COLUMN matcher TEXT;
ALTER TABLE hooks ADD COLUMN handler_type TEXT NOT NULL DEFAULT 'builtin';
ALTER TABLE hooks ADD COLUMN handler_ref TEXT;
ALTER TABLE hooks ADD COLUMN blocking INTEGER NOT NULL DEFAULT 1;
ALTER TABLE hooks ADD COLUMN timeout_ms INTEGER NOT NULL DEFAULT 5000;
ALTER TABLE hooks ADD COLUMN on_failure TEXT NOT NULL DEFAULT 'fail_open';
ALTER TABLE hooks ADD COLUMN source_plugin_id TEXT;

-- Set on_failure per builtin hook
UPDATE hooks SET on_failure = 'fail_closed', blocking = 1, timeout_ms = 5000 WHERE name = 'input_guard';
UPDATE hooks SET on_failure = 'fail_open', blocking = 0, timeout_ms = 100 WHERE name = 'token_budget';
UPDATE hooks SET on_failure = 'fail_open', blocking = 0, timeout_ms = 100 WHERE name = 'tool_failure_circuit';
UPDATE hooks SET on_failure = 'fail_closed', blocking = 1, timeout_ms = 5000 WHERE name = 'output_guard';
UPDATE hooks SET on_failure = 'fail_open', blocking = 0, timeout_ms = 10000 WHERE name = 'async_judge';
UPDATE hooks SET on_failure = 'fail_open', blocking = 0, timeout_ms = 10000 WHERE name = 'memory_extraction';

-- Set handler_ref from implementation column
UPDATE hooks SET handler_ref = implementation WHERE handler_type = 'builtin';

-- 2. Hook execution audit table
CREATE TABLE IF NOT EXISTS hook_execution (
  id TEXT PRIMARY KEY,
  hook_id TEXT NOT NULL,
  session_id TEXT,
  decision TEXT,
  duration_ms INTEGER,
  error TEXT,
  executed_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_hook_execution_hook ON hook_execution(hook_id, executed_at);

-- 3. Unified enablement table
CREATE TABLE IF NOT EXISTS enablement (
  subject_type TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  component_type TEXT NOT NULL,
  component_id TEXT NOT NULL,
  pinned_version_id TEXT,
  source_plugin_id TEXT,
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (subject_type, subject_id, component_type, component_id)
);

-- Migrate skill_binding → enablement
INSERT OR IGNORE INTO enablement (subject_type, subject_id, component_type, component_id, pinned_version_id, enabled)
  SELECT subject_type, subject_id, 'skill', skill_id, pinned_version_id, enabled
  FROM skill_binding;

-- Migrate hooks → enablement
INSERT OR IGNORE INTO enablement (subject_type, subject_id, component_type, component_id, enabled)
  SELECT 'agent', 'default', 'hook', id, enabled
  FROM hooks;

-- Migrate tools → enablement
INSERT OR IGNORE INTO enablement (subject_type, subject_id, component_type, component_id, enabled)
  SELECT 'agent', 'default', 'tool', id, enabled
  FROM tools;
