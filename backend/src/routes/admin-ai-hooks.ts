import { Hono } from 'hono'
import { validator } from 'hono-openapi'
import { z } from 'zod'
import { adminMiddleware, authMiddleware } from '../middleware/auth'
import type { Env } from '../types'

export const adminAiHooksRoutes = new Hono<{ Bindings: Env }>()
adminAiHooksRoutes.use('*', authMiddleware, adminMiddleware)

adminAiHooksRoutes.get('/hooks', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM hooks ORDER BY event, priority').all()
  return c.json({ success: true, data: results })
})

const updateHookSchema = z.object({
  enabled: z.number().int().min(0).max(1).optional(),
  config: z.string().nullable().optional(),
  priority: z.number().int().min(1).max(999).optional(),
  description: z.string().nullable().optional(),
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
