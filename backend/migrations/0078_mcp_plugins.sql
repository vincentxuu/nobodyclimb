-- Phase 4: MCP + Plugin Layer

-- MCP Server connections
CREATE TABLE IF NOT EXISTS mcp_server (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL DEFAULT 'default',
  name TEXT NOT NULL,
  description TEXT,
  transport TEXT NOT NULL DEFAULT 'streamable_http',
  url TEXT,
  auth_type TEXT DEFAULT 'none',
  secret_ref TEXT,
  enabled INTEGER NOT NULL DEFAULT 1,
  health_status TEXT DEFAULT 'unknown',
  last_health_check TEXT,
  source_plugin_id TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE (tenant_id, name)
);

-- Tool snapshots (from MCP servers, not source of truth)
CREATE TABLE IF NOT EXISTS tool_snapshot (
  id TEXT PRIMARY KEY,
  server_id TEXT NOT NULL REFERENCES mcp_server(id) ON DELETE CASCADE,
  tool_name TEXT NOT NULL,
  qualified_key TEXT NOT NULL,
  description TEXT NOT NULL,
  input_schema TEXT NOT NULL,
  schema_hash TEXT NOT NULL,
  first_seen_at TEXT DEFAULT (datetime('now')),
  last_seen_at TEXT DEFAULT (datetime('now')),
  removed_at TEXT,
  UNIQUE (server_id, tool_name, schema_hash)
);

CREATE INDEX IF NOT EXISTS idx_tool_snapshot_server ON tool_snapshot(server_id, removed_at);
CREATE INDEX IF NOT EXISTS idx_tool_snapshot_qualified ON tool_snapshot(qualified_key);

-- MCP credentials (per-user)
CREATE TABLE IF NOT EXISTS mcp_credential (
  user_id TEXT NOT NULL,
  server_id TEXT NOT NULL,
  token_ref TEXT NOT NULL,
  scopes TEXT,
  expires_at TEXT,
  PRIMARY KEY (user_id, server_id)
);

-- Plugin versions (immutable)
CREATE TABLE IF NOT EXISTS plugin_version (
  id TEXT PRIMARY KEY,
  plugin_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  semver TEXT NOT NULL,
  manifest TEXT NOT NULL,
  source_type TEXT,
  signature TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE (plugin_id, semver)
);

-- Plugin installations
CREATE TABLE IF NOT EXISTS plugin_install (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL DEFAULT 'default',
  subject_type TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  plugin_version_id TEXT NOT NULL REFERENCES plugin_version(id),
  installed_at TEXT DEFAULT (datetime('now')),
  UNIQUE (tenant_id, subject_type, subject_id, plugin_version_id)
);

CREATE INDEX IF NOT EXISTS idx_plugin_install_subject ON plugin_install(subject_type, subject_id);
