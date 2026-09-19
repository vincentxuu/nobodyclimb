-- Phase 2: Hook Layer — lifecycle event interception

CREATE TABLE IF NOT EXISTS hooks (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  event TEXT NOT NULL,
  hook_type TEXT NOT NULL DEFAULT 'gate',
  implementation TEXT NOT NULL,
  config TEXT,
  priority INTEGER NOT NULL DEFAULT 100,
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_hooks_event ON hooks(event, enabled, priority);

-- Seed built-in hooks
INSERT OR IGNORE INTO hooks (id, name, description, event, hook_type, implementation, priority, enabled) VALUES
  (hex(randomblob(16)), 'input_guard', '輸入層防護：偵測 prompt injection、jailbreak、封鎖詞', 'pre_loop', 'gate', 'builtin:input_guard', 10, 1),
  (hex(randomblob(16)), 'token_budget', 'Token 預算守衛', 'pre_turn', 'gate', 'builtin:token_budget', 10, 1),
  (hex(randomblob(16)), 'tool_failure_circuit', '工具連續失敗斷路器', 'post_tool', 'gate', 'builtin:tool_failure_circuit', 10, 1),
  (hex(randomblob(16)), 'output_guard', '輸出層防護：過短/工具洩漏/prompt 洩漏', 'post_loop', 'gate', 'builtin:output_guard', 10, 1),
  (hex(randomblob(16)), 'async_judge', 'LLM 品質評分（非阻塞）', 'post_response', 'observe', 'builtin:async_judge', 100, 1),
  (hex(randomblob(16)), 'memory_extraction', '記憶萃取（非阻塞）', 'post_response', 'observe', 'builtin:memory_extraction', 200, 1);
