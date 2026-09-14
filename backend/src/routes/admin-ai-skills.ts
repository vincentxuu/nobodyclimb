import { Hono } from 'hono'
import { validator } from 'hono-openapi'
import { z } from 'zod'
import { adminMiddleware, authMiddleware } from '../middleware/auth'
import { loadSkillContent, parseSkillMd, saveSkillContent } from '../services/agent/skills/loader'
import { Env } from '../types'

export const adminAiSkillsRoutes = new Hono<{ Bindings: Env }>()

adminAiSkillsRoutes.use('*', authMiddleware, adminMiddleware)

// GET /skills — list all skills
adminAiSkillsRoutes.get('/skills', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM skills ORDER BY priority, name').all()
  return c.json({ success: true, data: results })
})

// POST /skills — create a new skill
const createSkillSchema = z.object({
  name: z.string().min(1).max(64),
  description: z.string().min(1),
  triggers: z.array(z.string()).optional().default([]),
  execution_mode: z
    .enum(['tool_group', 'sub_agent', 'multi_step'])
    .optional()
    .default('tool_group'),
  required_tools: z.array(z.string()).optional().default([]),
  requires_auth: z.number().int().min(0).max(1).optional().default(0),
  skill_md: z.string().optional(),
})

adminAiSkillsRoutes.post('/skills', validator('json', createSkillSchema), async (c) => {
  const body = c.req.valid('json')
  const id = crypto.randomUUID().replace(/-/g, '')

  await c.env.DB.prepare(
    `INSERT INTO skills (id, name, description, triggers, execution_mode, required_tools, requires_auth, source, r2_key)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'admin', ?)`
  )
    .bind(
      id,
      body.name,
      body.description,
      JSON.stringify(body.triggers),
      body.execution_mode,
      JSON.stringify(body.required_tools),
      body.requires_auth,
      body.skill_md ? `skills/${body.name}/SKILL.md` : null
    )
    .run()

  if (body.skill_md) {
    await saveSkillContent(c.env.AGENT_STORAGE, body.name, body.skill_md)
  }

  return c.json({ success: true, data: { id } }, 201)
})

// GET /skills/:id — get skill detail (with R2 content if available)
adminAiSkillsRoutes.get('/skills/:id', async (c) => {
  const id = c.req.param('id')
  const skill = await c.env.DB.prepare('SELECT * FROM skills WHERE id = ?').bind(id).first()

  if (!skill) {
    return c.json({ success: false, error: 'NotFound' }, 404)
  }

  let skill_md: string | null = null
  if (skill.name) {
    const content = await loadSkillContent(c.env.AGENT_STORAGE, skill.name as string)
    if (content) {
      skill_md = content.body
    }
  }

  return c.json({ success: true, data: { ...skill, skill_md } })
})

// PUT /skills/:id — update skill
const updateSkillSchema = z.object({
  name: z.string().min(1).max(64).optional(),
  description: z.string().min(1).optional(),
  triggers: z.array(z.string()).optional(),
  execution_mode: z.enum(['tool_group', 'sub_agent', 'multi_step']).optional(),
  required_tools: z.array(z.string()).optional(),
  requires_auth: z.number().int().min(0).max(1).optional(),
  enabled: z.number().int().min(0).max(1).optional(),
  priority: z.number().int().min(1).max(999).optional(),
  skill_md: z.string().optional(),
})

adminAiSkillsRoutes.put('/skills/:id', validator('json', updateSkillSchema), async (c) => {
  const id = c.req.param('id')
  const body = c.req.valid('json')

  const sets: string[] = []
  const values: unknown[] = []

  if (body.name !== undefined) {
    sets.push('name = ?')
    values.push(body.name)
  }
  if (body.description !== undefined) {
    sets.push('description = ?')
    values.push(body.description)
  }
  if (body.triggers !== undefined) {
    sets.push('triggers = ?')
    values.push(JSON.stringify(body.triggers))
  }
  if (body.execution_mode !== undefined) {
    sets.push('execution_mode = ?')
    values.push(body.execution_mode)
  }
  if (body.required_tools !== undefined) {
    sets.push('required_tools = ?')
    values.push(JSON.stringify(body.required_tools))
  }
  if (body.requires_auth !== undefined) {
    sets.push('requires_auth = ?')
    values.push(body.requires_auth)
  }
  if (body.enabled !== undefined) {
    sets.push('enabled = ?')
    values.push(body.enabled)
  }
  if (body.priority !== undefined) {
    sets.push('priority = ?')
    values.push(body.priority)
  }

  if (sets.length === 0 && !body.skill_md) {
    return c.json({ success: false, error: 'NoChanges' }, 400)
  }

  if (sets.length > 0) {
    sets.push("updated_at = datetime('now')")
    const result = await c.env.DB.prepare(`UPDATE skills SET ${sets.join(', ')} WHERE id = ?`)
      .bind(...values, id)
      .run()
    if (result.meta.changes === 0) {
      return c.json({ success: false, error: 'NotFound' }, 404)
    }
  }

  if (body.skill_md) {
    const skill = await c.env.DB.prepare('SELECT name FROM skills WHERE id = ?')
      .bind(id)
      .first<{ name: string }>()
    if (skill) {
      await saveSkillContent(c.env.AGENT_STORAGE, skill.name, body.skill_md)
      if (!sets.some((s) => s.startsWith('r2_key'))) {
        await c.env.DB.prepare(
          "UPDATE skills SET r2_key = ?, updated_at = datetime('now') WHERE id = ?"
        )
          .bind(`skills/${skill.name}/SKILL.md`, id)
          .run()
      }
    }
  }

  return c.json({ success: true })
})

// DELETE /skills/:id
adminAiSkillsRoutes.delete('/skills/:id', async (c) => {
  const id = c.req.param('id')

  const skill = await c.env.DB.prepare('SELECT name, source FROM skills WHERE id = ?')
    .bind(id)
    .first<{ name: string; source: string }>()

  if (!skill) {
    return c.json({ success: false, error: 'NotFound' }, 404)
  }

  if (skill.source === 'builtin') {
    return c.json(
      { success: false, error: 'CannotDeleteBuiltin', message: '無法刪除內建 skill' },
      400
    )
  }

  await c.env.DB.prepare('DELETE FROM skills WHERE id = ?').bind(id).run()

  // Clean up R2
  try {
    await c.env.AGENT_STORAGE.delete(`skills/${skill.name}/SKILL.md`)
  } catch {
    /* ignore R2 cleanup errors */
  }

  return c.json({ success: true })
})

// POST /skills/import — import SKILL.md
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
      { success: false, error: 'InvalidSkillMd', message: 'SKILL.md 必須包含 name 和 description' },
      400
    )
  }

  const triggers = Array.isArray(parsed.frontmatter.triggers)
    ? parsed.frontmatter.triggers
    : ((parsed.frontmatter.triggers as string)?.split(',').map((t: string) => t.trim()) ?? [])
  const required_tools = Array.isArray(parsed.frontmatter['allowed-tools'])
    ? parsed.frontmatter['allowed-tools']
    : []
  const execution_mode = (parsed.frontmatter.execution_mode as string) ?? 'tool_group'
  const requires_auth = parsed.frontmatter.requires_auth === true ? 1 : 0

  const id = crypto.randomUUID().replace(/-/g, '')

  await saveSkillContent(c.env.AGENT_STORAGE, name, content)

  await c.env.DB.prepare(
    `INSERT OR REPLACE INTO skills (id, name, description, triggers, execution_mode, required_tools, requires_auth, source, r2_key)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'admin', ?)`
  )
    .bind(
      id,
      name,
      description,
      JSON.stringify(triggers),
      execution_mode,
      JSON.stringify(required_tools),
      requires_auth,
      `skills/${name}/SKILL.md`
    )
    .run()

  return c.json({ success: true, data: { id, name } }, 201)
})

// GET /skills/:id/export — export as SKILL.md
adminAiSkillsRoutes.get('/skills/:id/export', async (c) => {
  const id = c.req.param('id')
  const skill = await c.env.DB.prepare('SELECT name FROM skills WHERE id = ?')
    .bind(id)
    .first<{ name: string }>()

  if (!skill) {
    return c.json({ success: false, error: 'NotFound' }, 404)
  }

  const obj = await c.env.AGENT_STORAGE.get(`skills/${skill.name}/SKILL.md`)
  if (!obj) {
    return c.json({ success: false, error: 'NoContent', message: 'R2 中無 SKILL.md 檔案' }, 404)
  }

  const text = await obj.text()
  return new Response(text, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `attachment; filename="${skill.name}-SKILL.md"`,
    },
  })
})

// POST /skills/:id/test — test trigger matching
const testSkillSchema = z.object({
  query: z.string().min(1),
})

adminAiSkillsRoutes.post('/skills/:id/test', validator('json', testSkillSchema), async (c) => {
  const { query } = c.req.valid('json')

  const { results } = await c.env.DB.prepare(
    'SELECT id, name, triggers, execution_mode, requires_auth, priority FROM skills WHERE enabled = 1 ORDER BY priority'
  ).all()

  const skills = (results ?? []).map((r) => ({
    id: r.id as string,
    name: r.name as string,
    triggers: JSON.parse((r.triggers as string) ?? '[]') as string[],
    execution_mode: r.execution_mode as string,
    matched_triggers: (JSON.parse((r.triggers as string) ?? '[]') as string[]).filter((t) =>
      query.includes(t)
    ),
  }))

  const matched = skills.filter((s) => s.matched_triggers.length > 0)

  return c.json({
    success: true,
    data: {
      query,
      matched_skills: matched,
      all_skills: skills.map((s) => ({
        name: s.name,
        triggers: s.triggers,
        matched: s.matched_triggers.length > 0,
      })),
    },
  })
})
