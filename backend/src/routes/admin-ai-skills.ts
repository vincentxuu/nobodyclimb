import { Hono } from 'hono'
import { validator } from 'hono-openapi'
import { z } from 'zod'
import { adminMiddleware, authMiddleware } from '../middleware/auth'
import {
  computeContentHash,
  estimateTokenCount,
  parseSkillMd,
  saveSkillContent,
} from '../services/agent/skills/loader'
import { Env } from '../types'

export const adminAiSkillsRoutes = new Hono<{ Bindings: Env }>()

adminAiSkillsRoutes.use('*', authMiddleware, adminMiddleware)

// GET /skills — list all skills with latest version info
adminAiSkillsRoutes.get('/skills', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT
      s.id, s.tenant_id, s.slug, s.display_name, s.scope, s.source, s.created_at,
      sv.id AS version_id, sv.version_number, sv.name, sv.description,
      sv.allowed_tools, sv.status, sv.token_count, sv.published_at,
      sb.enabled AS binding_enabled, sb.pinned_version_id
    FROM skill s
    LEFT JOIN skill_version sv ON sv.id = s.latest_version_id
    LEFT JOIN skill_binding sb ON sb.skill_id = s.id AND sb.subject_type = 'agent' AND sb.subject_id = 'default'
    ORDER BY s.slug`
  ).all()
  return c.json({ success: true, data: results })
})

// POST /skills — create skill + first version
const createSkillSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/),
  display_name: z.string().max(255).optional(),
  scope: z.enum(['personal', 'team', 'org', 'public']).optional().default('org'),
  description: z.string().min(1).max(1024),
  allowed_tools: z.array(z.string()).optional().default([]),
  body: z.string().optional(),
  skill_md: z.string().optional(),
})

adminAiSkillsRoutes.post('/skills', validator('json', createSkillSchema), async (c) => {
  const body = c.req.valid('json')
  const skillId = `sk_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`
  const versionId = `skv_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`
  const bindingId = `sb_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`

  const skillBody = body.body ?? ''
  const contentHash = computeContentHash(body.description + skillBody)
  const tokenCount = estimateTokenCount(body.description + skillBody)

  await c.env.DB.batch([
    c.env.DB.prepare(
      `INSERT INTO skill (id, tenant_id, slug, display_name, scope, source, latest_version_id)
       VALUES (?, 'default', ?, ?, ?, 'custom', ?)`
    ).bind(skillId, body.slug, body.display_name ?? null, body.scope, versionId),
    c.env.DB.prepare(
      `INSERT INTO skill_version (id, skill_id, version_number, name, description, body, allowed_tools, content_hash, status, token_count, published_at)
       VALUES (?, ?, 1, ?, ?, ?, ?, ?, 'published', ?, datetime('now'))`
    ).bind(
      versionId,
      skillId,
      body.slug,
      body.description,
      skillBody,
      JSON.stringify(body.allowed_tools),
      contentHash,
      tokenCount
    ),
    c.env.DB.prepare(
      `INSERT INTO skill_binding (id, tenant_id, subject_type, subject_id, skill_id, enabled)
       VALUES (?, 'default', 'agent', 'default', ?, 1)`
    ).bind(bindingId, skillId),
  ])

  if (body.skill_md) {
    await saveSkillContent(c.env.AGENT_STORAGE, body.slug, body.skill_md)
  }

  return c.json({ success: true, data: { id: skillId, version_id: versionId } }, 201)
})

// GET /skills/:id — detail with versions + bindings
adminAiSkillsRoutes.get('/skills/:id', async (c) => {
  const id = c.req.param('id')

  const [skill, versions, bindings, files] = await Promise.all([
    c.env.DB.prepare('SELECT * FROM skill WHERE id = ?').bind(id).first(),
    c.env.DB.prepare('SELECT * FROM skill_version WHERE skill_id = ? ORDER BY version_number DESC')
      .bind(id)
      .all(),
    c.env.DB.prepare('SELECT * FROM skill_binding WHERE skill_id = ?').bind(id).all(),
    c.env.DB.prepare(
      `SELECT sf.* FROM skill_file sf
       JOIN skill_version sv ON sf.version_id = sv.id
       WHERE sv.skill_id = ? ORDER BY sf.path`
    )
      .bind(id)
      .all(),
  ])

  if (!skill) {
    return c.json({ success: false, error: 'NotFound' }, 404)
  }

  let skill_md: string | null = null
  if (skill.slug) {
    try {
      const obj = await c.env.AGENT_STORAGE.get(`skills/${skill.slug}/SKILL.md`)
      if (obj) skill_md = await obj.text()
    } catch {
      /* R2 read failure is non-fatal */
    }
  }

  return c.json({
    success: true,
    data: {
      ...skill,
      versions: versions.results ?? [],
      bindings: bindings.results ?? [],
      files: files.results ?? [],
      skill_md,
    },
  })
})

// PUT /skills/:id — update identity (display_name, scope; slug is immutable)
const updateSkillSchema = z.object({
  display_name: z.string().max(255).nullable().optional(),
  scope: z.enum(['personal', 'team', 'org', 'public']).optional(),
})

adminAiSkillsRoutes.put('/skills/:id', validator('json', updateSkillSchema), async (c) => {
  const id = c.req.param('id')
  const body = c.req.valid('json')

  const sets: string[] = []
  const values: unknown[] = []

  if (body.display_name !== undefined) {
    sets.push('display_name = ?')
    values.push(body.display_name)
  }
  if (body.scope !== undefined) {
    sets.push('scope = ?')
    values.push(body.scope)
  }

  if (sets.length === 0) return c.json({ success: false, error: 'NoChanges' }, 400)

  const result = await c.env.DB.prepare(`UPDATE skill SET ${sets.join(', ')} WHERE id = ?`)
    .bind(...values, id)
    .run()

  if (result.meta.changes === 0) return c.json({ success: false, error: 'NotFound' }, 404)
  return c.json({ success: true })
})

// POST /skills/:id/versions — publish new immutable version
const createVersionSchema = z.object({
  description: z.string().min(1).max(1024),
  body: z.string().optional(),
  allowed_tools: z.array(z.string()).optional().default([]),
  metadata: z.record(z.unknown()).optional(),
  skill_md: z.string().optional(),
})

adminAiSkillsRoutes.post(
  '/skills/:id/versions',
  validator('json', createVersionSchema),
  async (c) => {
    const skillId = c.req.param('id')
    const body = c.req.valid('json')

    const skill = await c.env.DB.prepare('SELECT slug FROM skill WHERE id = ?')
      .bind(skillId)
      .first<{ slug: string }>()
    if (!skill) return c.json({ success: false, error: 'NotFound' }, 404)

    const lastVersion = await c.env.DB.prepare(
      'SELECT MAX(version_number) AS max_ver FROM skill_version WHERE skill_id = ?'
    )
      .bind(skillId)
      .first<{ max_ver: number | null }>()
    const nextVersion = (lastVersion?.max_ver ?? 0) + 1

    const versionId = `skv_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`
    const skillBody = body.body ?? ''
    const contentHash = computeContentHash(body.description + skillBody)
    const tokenCount = estimateTokenCount(body.description + skillBody)

    await c.env.DB.batch([
      c.env.DB.prepare(
        `INSERT INTO skill_version (id, skill_id, version_number, name, description, body, allowed_tools, content_hash, status, token_count, metadata, published_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'published', ?, ?, datetime('now'))`
      ).bind(
        versionId,
        skillId,
        nextVersion,
        skill.slug,
        body.description,
        skillBody,
        JSON.stringify(body.allowed_tools),
        contentHash,
        tokenCount,
        body.metadata ? JSON.stringify(body.metadata) : null
      ),
      c.env.DB.prepare('UPDATE skill SET latest_version_id = ? WHERE id = ?').bind(
        versionId,
        skillId
      ),
    ])

    if (body.skill_md) {
      await saveSkillContent(c.env.AGENT_STORAGE, skill.slug, body.skill_md)
    }

    return c.json({ success: true, data: { id: versionId, version_number: nextVersion } }, 201)
  }
)

// PUT /skills/:id/versions/:versionId/status — change version status
const updateStatusSchema = z.object({
  status: z.enum(['draft', 'published', 'deprecated']),
})

adminAiSkillsRoutes.put(
  '/skills/:id/versions/:versionId/status',
  validator('json', updateStatusSchema),
  async (c) => {
    const { status } = c.req.valid('json')
    const versionId = c.req.param('versionId')
    const skillId = c.req.param('id')

    const sets: string[] = ['status = ?']
    const values: unknown[] = [status]

    if (status === 'published') {
      sets.push("published_at = datetime('now')")
    }

    const result = await c.env.DB.prepare(
      `UPDATE skill_version SET ${sets.join(', ')} WHERE id = ? AND skill_id = ?`
    )
      .bind(...values, versionId, skillId)
      .run()

    if (result.meta.changes === 0) return c.json({ success: false, error: 'NotFound' }, 404)

    if (status === 'published') {
      await c.env.DB.prepare('UPDATE skill SET latest_version_id = ? WHERE id = ?')
        .bind(versionId, skillId)
        .run()
    }

    return c.json({ success: true })
  }
)

// PUT /skills/:id/binding — update binding (enable/disable, pin version)
const updateBindingSchema = z.object({
  enabled: z.number().int().min(0).max(1).optional(),
  pinned_version_id: z.string().nullable().optional(),
  subject_type: z.string().optional().default('agent'),
  subject_id: z.string().optional().default('default'),
})

adminAiSkillsRoutes.put(
  '/skills/:id/binding',
  validator('json', updateBindingSchema),
  async (c) => {
    const skillId = c.req.param('id')
    const body = c.req.valid('json')

    const sets: string[] = []
    const values: unknown[] = []

    if (body.enabled !== undefined) {
      sets.push('enabled = ?')
      values.push(body.enabled)
    }
    if (body.pinned_version_id !== undefined) {
      sets.push('pinned_version_id = ?')
      values.push(body.pinned_version_id)
    }

    if (sets.length === 0) return c.json({ success: false, error: 'NoChanges' }, 400)

    const result = await c.env.DB.prepare(
      `UPDATE skill_binding SET ${sets.join(', ')} WHERE skill_id = ? AND subject_type = ? AND subject_id = ?`
    )
      .bind(...values, skillId, body.subject_type, body.subject_id)
      .run()

    if (result.meta.changes === 0) {
      return c.json({ success: false, error: 'NotFound' }, 404)
    }
    return c.json({ success: true })
  }
)

// DELETE /skills/:id
adminAiSkillsRoutes.delete('/skills/:id', async (c) => {
  const id = c.req.param('id')
  const skill = await c.env.DB.prepare('SELECT slug, source FROM skill WHERE id = ?')
    .bind(id)
    .first<{ slug: string; source: string }>()

  if (!skill) return c.json({ success: false, error: 'NotFound' }, 404)
  if (skill.source === 'builtin') {
    return c.json(
      { success: false, error: 'CannotDeleteBuiltin', message: '無法刪除內建 skill' },
      400
    )
  }

  await c.env.DB.prepare('DELETE FROM skill WHERE id = ?').bind(id).run()

  try {
    await c.env.AGENT_STORAGE.delete(`skills/${skill.slug}/SKILL.md`)
  } catch {
    /* ignore */
  }

  return c.json({ success: true })
})

// POST /skills/import — import from SKILL.md content
const importSkillSchema = z.object({
  content: z.string().min(10),
})

adminAiSkillsRoutes.post('/skills/import', validator('json', importSkillSchema), async (c) => {
  const { content } = c.req.valid('json')
  const parsed = parseSkillMd(content)

  const name = (parsed.frontmatter.name as string) ?? ''
  const description = (parsed.frontmatter.description as string) ?? ''
  if (!name || !description) {
    return c.json(
      {
        success: false,
        error: 'InvalidSkillMd',
        message: 'SKILL.md 必須包含 name 和 description',
      },
      400
    )
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9-]/g, '-')
  const allowedTools = Array.isArray(parsed.frontmatter['allowed-tools'])
    ? parsed.frontmatter['allowed-tools']
    : []

  const skillId = `sk_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`
  const versionId = `skv_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`
  const bindingId = `sb_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`
  const contentHash = computeContentHash(content)
  const tokenCount = estimateTokenCount(content)

  await saveSkillContent(c.env.AGENT_STORAGE, slug, content)

  await c.env.DB.batch([
    c.env.DB.prepare(
      `INSERT OR IGNORE INTO skill (id, tenant_id, slug, display_name, scope, source, latest_version_id)
       VALUES (?, 'default', ?, ?, 'org', 'custom', ?)`
    ).bind(skillId, slug, (parsed.frontmatter.display_name as string) ?? name, versionId),
    c.env.DB.prepare(
      `INSERT INTO skill_version (id, skill_id, version_number, name, description, body, allowed_tools, content_hash, status, token_count, published_at)
       VALUES (?, ?, 1, ?, ?, ?, ?, ?, 'published', ?, datetime('now'))`
    ).bind(
      versionId,
      skillId,
      slug,
      description,
      parsed.body,
      JSON.stringify(allowedTools),
      contentHash,
      tokenCount
    ),
    c.env.DB.prepare(
      `INSERT OR IGNORE INTO skill_binding (id, tenant_id, subject_type, subject_id, skill_id, enabled)
       VALUES (?, 'default', 'agent', 'default', ?, 1)`
    ).bind(bindingId, skillId),
  ])

  return c.json({ success: true, data: { id: skillId, slug } }, 201)
})

// GET /skills/:id/export — export as SKILL.md
adminAiSkillsRoutes.get('/skills/:id/export', async (c) => {
  const id = c.req.param('id')
  const skill = await c.env.DB.prepare('SELECT slug FROM skill WHERE id = ?')
    .bind(id)
    .first<{ slug: string }>()

  if (!skill) return c.json({ success: false, error: 'NotFound' }, 404)

  const obj = await c.env.AGENT_STORAGE.get(`skills/${skill.slug}/SKILL.md`)
  if (!obj) return c.json({ success: false, error: 'NoContent' }, 404)

  const text = await obj.text()
  return new Response(text, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `attachment; filename="${skill.slug}-SKILL.md"`,
    },
  })
})

// POST /skills/test-trigger — test which skills would match a query
const testTriggerSchema = z.object({
  query: z.string().min(1),
})

adminAiSkillsRoutes.post(
  '/skills/test-trigger',
  validator('json', testTriggerSchema),
  async (c) => {
    const { query } = c.req.valid('json')

    const { results } = await c.env.DB.prepare(
      `SELECT s.slug, sv.description
     FROM skill_binding sb
     JOIN skill s ON sb.skill_id = s.id
     JOIN skill_version sv ON sv.id = s.latest_version_id
     WHERE sb.subject_type = 'agent' AND sb.subject_id = 'default' AND sb.enabled = 1
       AND sv.status = 'published'`
    ).all()

    const skills = (results ?? []).map((r) => {
      const desc = r.description as string
      const triggerMatch = desc.match(/當使用者[^。]*?([^。]+)觸發/)
      const triggers = triggerMatch
        ? triggerMatch[1]
            .split(/[、，,]/)
            .map((t) => t.trim())
            .filter(Boolean)
        : []
      const matchedTriggers = triggers.filter((t) => query.includes(t))
      return {
        slug: r.slug as string,
        triggers,
        matched_triggers: matchedTriggers,
        matched: matchedTriggers.length > 0,
      }
    })

    return c.json({
      success: true,
      data: {
        query,
        matched: skills.filter((s) => s.matched),
        all: skills,
      },
    })
  }
)

// GET /skills/:id/invocations — invocation history
adminAiSkillsRoutes.get('/skills/:id/invocations', async (c) => {
  const skillId = c.req.param('id')
  const limit = Math.min(parseInt(c.req.query('limit') ?? '50', 10), 200)

  const { results } = await c.env.DB.prepare(
    `SELECT si.* FROM skill_invocation si
     JOIN skill_version sv ON si.version_id = sv.id
     WHERE sv.skill_id = ?
     ORDER BY si.triggered_at DESC LIMIT ?`
  )
    .bind(skillId, limit)
    .all()

  const stats = await c.env.DB.prepare(
    `SELECT
      si.outcome, COUNT(*) as count
     FROM skill_invocation si
     JOIN skill_version sv ON si.version_id = sv.id
     WHERE sv.skill_id = ?
     GROUP BY si.outcome`
  )
    .bind(skillId)
    .all()

  return c.json({
    success: true,
    data: {
      invocations: results ?? [],
      stats: stats.results ?? [],
    },
  })
})
