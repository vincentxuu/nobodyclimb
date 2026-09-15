-- Seed 6 Anthropic official skills (R2 files already uploaded via wrangler)

-- 1. docx
INSERT OR IGNORE INTO skill (id, tenant_id, slug, display_name, scope, source, created_at)
  VALUES ('sk_docx', 'default', 'docx', 'Word Document', 'org', 'marketplace', datetime('now'));
INSERT OR IGNORE INTO skill_version (id, skill_id, version_number, name, description, content_hash, status, token_count, published_at, created_at)
  VALUES ('skv_docx_1', 'sk_docx', 1, 'docx',
    'Use this skill whenever the user wants to create, read, edit, or manipulate Word documents (.docx files) or Word templates (.dotx files).',
    'anthropic-official', 'published', 1800, datetime('now'), datetime('now'));
UPDATE skill SET latest_version_id = 'skv_docx_1' WHERE id = 'sk_docx';
INSERT OR IGNORE INTO skill_binding (id, tenant_id, subject_type, subject_id, skill_id, enabled)
  VALUES ('sb_docx', 'default', 'agent', 'default', 'sk_docx', 1);

-- 2. pdf
INSERT OR IGNORE INTO skill (id, tenant_id, slug, display_name, scope, source, created_at)
  VALUES ('sk_pdf', 'default', 'pdf', 'PDF Processing', 'org', 'marketplace', datetime('now'));
INSERT OR IGNORE INTO skill_version (id, skill_id, version_number, name, description, content_hash, status, token_count, published_at, created_at)
  VALUES ('skv_pdf_1', 'sk_pdf', 1, 'pdf',
    'Use this skill whenever the user wants to do anything with PDF files. This includes reading, extracting, combining, splitting, rotating, watermarking, creating, filling forms, encrypting, and OCR.',
    'anthropic-official', 'published', 2100, datetime('now'), datetime('now'));
UPDATE skill SET latest_version_id = 'skv_pdf_1' WHERE id = 'sk_pdf';
INSERT OR IGNORE INTO skill_binding (id, tenant_id, subject_type, subject_id, skill_id, enabled)
  VALUES ('sb_pdf', 'default', 'agent', 'default', 'sk_pdf', 1);

-- 3. pptx
INSERT OR IGNORE INTO skill (id, tenant_id, slug, display_name, scope, source, created_at)
  VALUES ('sk_pptx', 'default', 'pptx', 'PowerPoint', 'org', 'marketplace', datetime('now'));
INSERT OR IGNORE INTO skill_version (id, skill_id, version_number, name, description, content_hash, status, token_count, published_at, created_at)
  VALUES ('skv_pptx_1', 'sk_pptx', 1, 'pptx',
    'Use this skill any time a .pptx or .potx file is involved — creating slide decks, reading/parsing presentations, editing, combining, or working with templates, layouts, speaker notes.',
    'anthropic-official', 'published', 5400, datetime('now'), datetime('now'));
UPDATE skill SET latest_version_id = 'skv_pptx_1' WHERE id = 'sk_pptx';
INSERT OR IGNORE INTO skill_binding (id, tenant_id, subject_type, subject_id, skill_id, enabled)
  VALUES ('sb_pptx', 'default', 'agent', 'default', 'sk_pptx', 1);

-- 4. xlsx
INSERT OR IGNORE INTO skill (id, tenant_id, slug, display_name, scope, source, created_at)
  VALUES ('sk_xlsx', 'default', 'xlsx', 'Excel Spreadsheet', 'org', 'marketplace', datetime('now'));
INSERT OR IGNORE INTO skill_version (id, skill_id, version_number, name, description, content_hash, status, token_count, published_at, created_at)
  VALUES ('skv_xlsx_1', 'sk_xlsx', 1, 'xlsx',
    'Use this skill any time a spreadsheet file is the primary input or output — open, read, edit, create .xlsx/.xlsm/.xltx/.csv/.tsv files, compute formulas, format, chart, clean messy data.',
    'anthropic-official', 'published', 2200, datetime('now'), datetime('now'));
UPDATE skill SET latest_version_id = 'skv_xlsx_1' WHERE id = 'sk_xlsx';
INSERT OR IGNORE INTO skill_binding (id, tenant_id, subject_type, subject_id, skill_id, enabled)
  VALUES ('sb_xlsx', 'default', 'agent', 'default', 'sk_xlsx', 1);

-- 5. mcp-builder
INSERT OR IGNORE INTO skill (id, tenant_id, slug, display_name, scope, source, created_at)
  VALUES ('sk_mcp_builder', 'default', 'mcp-builder', 'MCP Server Builder', 'org', 'marketplace', datetime('now'));
INSERT OR IGNORE INTO skill_version (id, skill_id, version_number, name, description, content_hash, status, token_count, published_at, created_at)
  VALUES ('skv_mcp_builder_1', 'sk_mcp_builder', 1, 'mcp-builder',
    'Guide for creating high-quality MCP (Model Context Protocol) servers that enable LLMs to interact with external services through well-designed tools.',
    'anthropic-official', 'published', 2400, datetime('now'), datetime('now'));
UPDATE skill SET latest_version_id = 'skv_mcp_builder_1' WHERE id = 'sk_mcp_builder';
INSERT OR IGNORE INTO skill_binding (id, tenant_id, subject_type, subject_id, skill_id, enabled)
  VALUES ('sb_mcp_builder', 'default', 'agent', 'default', 'sk_mcp_builder', 1);

-- 6. skill-creator
INSERT OR IGNORE INTO skill (id, tenant_id, slug, display_name, scope, source, created_at)
  VALUES ('sk_skill_creator', 'default', 'skill-creator', 'Skill Creator', 'org', 'marketplace', datetime('now'));
INSERT OR IGNORE INTO skill_version (id, skill_id, version_number, name, description, content_hash, status, token_count, published_at, created_at)
  VALUES ('skv_skill_creator_1', 'sk_skill_creator', 1, 'skill-creator',
    'Create new skills, modify and improve existing skills, and measure skill performance. Use when users want to create a skill from scratch, edit, optimize, run evals, or benchmark skill performance.',
    'anthropic-official', 'published', 8600, datetime('now'), datetime('now'));
UPDATE skill SET latest_version_id = 'skv_skill_creator_1' WHERE id = 'sk_skill_creator';
INSERT OR IGNORE INTO skill_binding (id, tenant_id, subject_type, subject_id, skill_id, enabled)
  VALUES ('sb_skill_creator', 'default', 'agent', 'default', 'sk_skill_creator', 1);
