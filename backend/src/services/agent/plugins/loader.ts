import { computeContentHash } from '../skills/loader'
import type { PluginManifest } from './types'

export async function installPlugin(
  db: D1Database,
  storage: R2Bucket,
  pluginVersionId: string,
  manifest: PluginManifest,
  tenantId = 'default',
  subjectType = 'agent',
  subjectId = 'default'
): Promise<{ skills: number; mcpServers: number }> {
  let skillCount = 0
  let mcpCount = 0

  if (manifest.skills) {
    for (const skillDef of manifest.skills) {
      const skillId = crypto.randomUUID()
      const versionId = crypto.randomUUID()
      const slug = skillDef.name
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
      const contentHash = computeContentHash(skillDef.content ?? skillDef.description)

      await db
        .prepare(
          `INSERT OR IGNORE INTO skill (id, tenant_id, slug, display_name, scope, source, created_at)
         VALUES (?, ?, ?, ?, 'org', 'plugin', datetime('now'))`
        )
        .bind(skillId, tenantId, slug, skillDef.name)
        .run()

      const existingSkill = await db
        .prepare('SELECT id FROM skill WHERE tenant_id = ? AND slug = ?')
        .bind(tenantId, slug)
        .first<{ id: string }>()
      const actualSkillId = existingSkill?.id ?? skillId

      await db
        .prepare(
          `INSERT INTO skill_version (id, skill_id, version_number, name, description, body, content_hash, status, published_at, created_at)
         VALUES (?, ?, 1, ?, ?, ?, ?, 'published', datetime('now'), datetime('now'))`
        )
        .bind(
          versionId,
          actualSkillId,
          skillDef.name,
          skillDef.description,
          skillDef.content ?? null,
          contentHash
        )
        .run()

      await db
        .prepare('UPDATE skill SET latest_version_id = ? WHERE id = ?')
        .bind(versionId, actualSkillId)
        .run()

      await db
        .prepare(
          `INSERT OR IGNORE INTO enablement (subject_type, subject_id, component_type, component_id, source_plugin_id, enabled)
         VALUES (?, ?, 'skill', ?, ?, 1)`
        )
        .bind(subjectType, subjectId, actualSkillId, pluginVersionId)
        .run()

      if (skillDef.content) {
        await storage.put(`skills/${slug}/SKILL.md`, skillDef.content, {
          httpMetadata: { contentType: 'text/markdown' },
        })
      }

      skillCount++
    }
  }

  if (manifest.mcp_servers) {
    for (const serverDef of manifest.mcp_servers) {
      const serverId = crypto.randomUUID()
      await db
        .prepare(
          `INSERT OR IGNORE INTO mcp_server (id, tenant_id, name, description, transport, url, auth_type, source_plugin_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
        )
        .bind(
          serverId,
          tenantId,
          serverDef.name,
          serverDef.description ?? null,
          serverDef.transport,
          serverDef.url,
          serverDef.auth_type ?? 'none',
          pluginVersionId
        )
        .run()

      const existing = await db
        .prepare('SELECT id FROM mcp_server WHERE tenant_id = ? AND name = ?')
        .bind(tenantId, serverDef.name)
        .first<{ id: string }>()
      if (existing) {
        await db
          .prepare(
            `INSERT OR IGNORE INTO enablement (subject_type, subject_id, component_type, component_id, source_plugin_id, enabled)
           VALUES (?, ?, 'tool', ?, ?, 1)`
          )
          .bind(subjectType, subjectId, existing.id, pluginVersionId)
          .run()
      }

      mcpCount++
    }
  }

  await db
    .prepare(
      `INSERT INTO plugin_install (id, tenant_id, subject_type, subject_id, plugin_version_id)
     VALUES (?, ?, ?, ?, ?)`
    )
    .bind(crypto.randomUUID(), tenantId, subjectType, subjectId, pluginVersionId)
    .run()

  return { skills: skillCount, mcpServers: mcpCount }
}

export async function uninstallPlugin(
  db: D1Database,
  pluginVersionId: string,
  tenantId = 'default'
): Promise<{ removed: number }> {
  let removed = 0

  const result1 = await db
    .prepare('DELETE FROM enablement WHERE source_plugin_id = ?')
    .bind(pluginVersionId)
    .run()
  removed += result1.meta.changes

  await db.prepare('DELETE FROM mcp_server WHERE source_plugin_id = ?').bind(pluginVersionId).run()

  await db
    .prepare('DELETE FROM plugin_install WHERE plugin_version_id = ? AND tenant_id = ?')
    .bind(pluginVersionId, tenantId)
    .run()

  return { removed }
}
