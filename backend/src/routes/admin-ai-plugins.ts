import { Hono } from 'hono'
import { validator } from 'hono-openapi'
import { z } from 'zod'
import { adminMiddleware, authMiddleware } from '../middleware/auth'
import { installPlugin, uninstallPlugin } from '../services/agent/plugins/loader'
import type { PluginManifest } from '../services/agent/plugins/types'
import type { Env } from '../types'

export const adminAiPluginsRoutes = new Hono<{ Bindings: Env }>()
adminAiPluginsRoutes.use('*', authMiddleware, adminMiddleware)

// GET /plugins — List installed plugins
adminAiPluginsRoutes.get('/plugins', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT pi.*, pv.name, pv.semver, pv.description, pv.source_type
     FROM plugin_install pi
     JOIN plugin_version pv ON pi.plugin_version_id = pv.id
     WHERE pi.tenant_id = 'default'
     ORDER BY pi.installed_at DESC`
  ).all()
  return c.json({ success: true, data: results })
})

// POST /plugins — Install plugin from manifest
const installPluginSchema = z.object({
  manifest: z.object({
    name: z.string().min(1).max(64),
    version: z.string().optional().default('1.0.0'),
    description: z.string().optional(),
    author: z.string().optional(),
    keywords: z.array(z.string()).optional(),
    skills: z
      .array(
        z.object({
          name: z.string(),
          description: z.string(),
          content: z.string().optional(),
        })
      )
      .optional(),
    mcp_servers: z
      .array(
        z.object({
          name: z.string(),
          description: z.string().optional(),
          transport: z.string(),
          url: z.string(),
          auth_type: z.string().optional(),
        })
      )
      .optional(),
  }),
  source_type: z.enum(['registry', 'git', 'local', 'manual']).default('manual'),
})

adminAiPluginsRoutes.post('/plugins', validator('json', installPluginSchema), async (c) => {
  const { manifest, source_type } = c.req.valid('json')

  const pluginId = manifest.name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
  const versionId = crypto.randomUUID()

  // Check if this version already exists
  const existing = await c.env.DB.prepare(
    'SELECT id FROM plugin_version WHERE plugin_id = ? AND semver = ?'
  )
    .bind(pluginId, manifest.version ?? '1.0.0')
    .first()

  if (existing) {
    return c.json(
      {
        success: false,
        error: 'VersionExists',
        message: `Plugin ${pluginId}@${manifest.version} already installed`,
      },
      409
    )
  }

  // Create plugin version
  await c.env.DB.prepare(
    `INSERT INTO plugin_version (id, plugin_id, name, description, semver, manifest, source_type)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      versionId,
      pluginId,
      manifest.name,
      manifest.description ?? null,
      manifest.version ?? '1.0.0',
      JSON.stringify(manifest),
      source_type
    )
    .run()

  // Install components
  const result = await installPlugin(
    c.env.DB,
    c.env.AGENT_STORAGE,
    versionId,
    manifest as PluginManifest
  )

  return c.json(
    {
      success: true,
      data: {
        plugin_version_id: versionId,
        plugin_id: pluginId,
        installed: result,
      },
    },
    201
  )
})

// GET /plugins/:id — Plugin detail with manifest and installed components
adminAiPluginsRoutes.get('/plugins/:id', async (c) => {
  const id = c.req.param('id')

  const install = await c.env.DB.prepare(
    `SELECT pi.*, pv.name, pv.semver, pv.description, pv.manifest, pv.source_type
     FROM plugin_install pi
     JOIN plugin_version pv ON pi.plugin_version_id = pv.id
     WHERE pi.id = ?`
  )
    .bind(id)
    .first()

  if (!install) return c.json({ success: false, error: 'NotFound' }, 404)

  // Get components created by this plugin
  const { results: enablements } = await c.env.DB.prepare(
    'SELECT * FROM enablement WHERE source_plugin_id = ?'
  )
    .bind(install.plugin_version_id)
    .all()

  const { results: mcpServers } = await c.env.DB.prepare(
    'SELECT * FROM mcp_server WHERE source_plugin_id = ?'
  )
    .bind(install.plugin_version_id)
    .all()

  return c.json({
    success: true,
    data: {
      ...install,
      manifest: JSON.parse((install.manifest as string) ?? '{}'),
      components: { enablements, mcp_servers: mcpServers },
    },
  })
})

// DELETE /plugins/:id — Uninstall plugin (transactional)
adminAiPluginsRoutes.delete('/plugins/:id', async (c) => {
  const id = c.req.param('id')

  const install = await c.env.DB.prepare(
    'SELECT plugin_version_id FROM plugin_install WHERE id = ?'
  )
    .bind(id)
    .first<{ plugin_version_id: string }>()

  if (!install) return c.json({ success: false, error: 'NotFound' }, 404)

  const result = await uninstallPlugin(c.env.DB, install.plugin_version_id)

  return c.json({ success: true, data: result })
})
