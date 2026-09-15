-- Add manage_skill tool to tools table
INSERT OR IGNORE INTO tools (id, name, description, parameters, enabled, category, tags, source, requires_auth)
  VALUES (hex(randomblob(16)), 'manage_skill', '建立、更新或刪除 managed skill', '{}', 1, 'system', '["system","skill"]', 'builtin', 0);
