import { Hono } from 'hono'
import { validator } from 'hono-openapi'
import { z } from 'zod'
import { adminMiddleware, authMiddleware } from '../middleware/auth'
import type { Env } from '../types'

export const adminAiHooksRoutes = new Hono<{ Bindings: Env }>()
adminAiHooksRoutes.use('*', authMiddleware, adminMiddleware)

// GET /hooks — list all hooks
adminAiHooksRoutes.get('/hooks', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM hooks ORDER BY event, priority').all()
  return c.json({ success: true, data: results })
})

// PUT /hooks/:id — update hook settings
const updateHookSchema = z.object({
  enabled: z.number().int().min(0).max(1).optional(),
  config: z.string().nullable().optional(),
  priority: z.number().int().min(1).max(999).optional(),
  description: z.string().nullable().optional(),
  matcher: z.string().nullable().optional(),
  timeout_ms: z.number().int().min(50).max(30000).optional(),
  on_failure: z.enum(['fail_open', 'fail_closed']).optional(),
  blocking: z.number().int().min(0).max(1).optional(),
})

adminAiHooksRoutes.put('/hooks/:id', validator('json', updateHookSchema), async (c) => {
  const id = c.req.param('id')
  const body = c.req.valid('json')

  const sets: string[] = []
  const values: unknown[] = []

  if (body.enabled !== undefined) {
    sets.push('enabled = ?')
    values.push(body.enabled)
  }
  if (body.config !== undefined) {
    sets.push('config = ?')
    values.push(body.config)
  }
  if (body.priority !== undefined) {
    sets.push('priority = ?')
    values.push(body.priority)
  }
  if (body.description !== undefined) {
    sets.push('description = ?')
    values.push(body.description)
  }
  if (body.matcher !== undefined) {
    sets.push('matcher = ?')
    values.push(body.matcher)
  }
  if (body.timeout_ms !== undefined) {
    sets.push('timeout_ms = ?')
    values.push(body.timeout_ms)
  }
  if (body.on_failure !== undefined) {
    sets.push('on_failure = ?')
    values.push(body.on_failure)
  }
  if (body.blocking !== undefined) {
    sets.push('blocking = ?')
    values.push(body.blocking)
  }

  if (sets.length === 0) {
    return c.json({ success: false, error: 'NoChanges' }, 400)
  }

  sets.push("updated_at = datetime('now')")

  const result = await c.env.DB.prepare(`UPDATE hooks SET ${sets.join(', ')} WHERE id = ?`)
    .bind(...values, id)
    .run()

  if (result.meta.changes === 0) {
    return c.json({ success: false, error: 'NotFound' }, 404)
  }

  return c.json({ success: true })
})

// GET /hooks/:id/executions — execution history for a hook
adminAiHooksRoutes.get('/hooks/:id/executions', async (c) => {
  const hookId = c.req.param('id')
  const limit = Math.min(parseInt(c.req.query('limit') ?? '50', 10), 200)
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM hook_execution WHERE hook_id = ? ORDER BY executed_at DESC LIMIT ?'
  )
    .bind(hookId, limit)
    .all()
  return c.json({ success: true, data: results })
})

// GET /hooks/executions/stats — aggregate execution stats per hook
adminAiHooksRoutes.get('/hooks/executions/stats', async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT
      he.hook_id,
      h.name AS hook_name,
      h.event,
      COUNT(*) AS total,
      SUM(CASE WHEN he.decision = 'allow' THEN 1 ELSE 0 END) AS allow_count,
      SUM(CASE WHEN he.decision = 'deny' THEN 1 ELSE 0 END) AS deny_count,
      SUM(CASE WHEN he.error IS NOT NULL THEN 1 ELSE 0 END) AS error_count,
      ROUND(AVG(he.duration_ms), 1) AS avg_duration_ms
    FROM hook_execution he
    JOIN hooks h ON he.hook_id = h.id
    GROUP BY he.hook_id
    ORDER BY total DESC
  `).all()
  return c.json({ success: true, data: results })
})

// GET /enablement — unified view of all enabled components for a subject
adminAiHooksRoutes.get('/enablement', async (c) => {
  const subjectType = c.req.query('subject_type') ?? 'agent'
  const subjectId = c.req.query('subject_id') ?? 'default'
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM enablement WHERE subject_type = ? AND subject_id = ? ORDER BY component_type, component_id'
  )
    .bind(subjectType, subjectId)
    .all()
  return c.json({ success: true, data: results })
})
