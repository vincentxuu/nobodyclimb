import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { z } from 'zod'
import { adminMiddleware, authMiddleware } from '../middleware/auth'
import { Env } from '../types'

export const adminAiToolsRoutes = new Hono<{ Bindings: Env }>()

adminAiToolsRoutes.use('*', authMiddleware, adminMiddleware)

adminAiToolsRoutes.get(
  '/tools',
  describeRoute({
    tags: ['Admin AI Tools'],
    summary: '列出所有工具',
    responses: { 200: { description: '工具清單' } },
  }),
  async (c) => {
    const { results } = await c.env.DB.prepare('SELECT * FROM tools ORDER BY category, name').all()
    return c.json({ success: true, data: results })
  }
)

const updateToolSchema = z.object({
  enabled: z.number().int().min(0).max(1).optional(),
  description_override: z.string().nullable().optional(),
  config: z.string().nullable().optional(),
})

adminAiToolsRoutes.put(
  '/tools/:name',
  describeRoute({
    tags: ['Admin AI Tools'],
    summary: '更新工具設定',
    responses: {
      200: { description: '更新成功' },
      400: { description: '無變更' },
      404: { description: '工具不存在' },
    },
  }),
  validator('json', updateToolSchema),
  async (c) => {
    const name = c.req.param('name')
    const body = c.req.valid('json')

    const sets: string[] = []
    const values: unknown[] = []

    if (body.enabled !== undefined) {
      sets.push('enabled = ?')
      values.push(body.enabled)
    }
    if (body.description_override !== undefined) {
      sets.push('description_override = ?')
      values.push(body.description_override)
    }
    if (body.config !== undefined) {
      sets.push('config = ?')
      values.push(body.config)
    }

    if (sets.length === 0) {
      return c.json({ success: false, error: 'NoChanges', message: '沒有任何變更' }, 400)
    }

    sets.push("updated_at = datetime('now')")

    const result = await c.env.DB.prepare(`UPDATE tools SET ${sets.join(', ')} WHERE name = ?`)
      .bind(...values, name)
      .run()

    if (result.meta.changes === 0) {
      return c.json({ success: false, error: 'NotFound', message: '工具不存在' }, 404)
    }

    return c.json({ success: true })
  }
)

adminAiToolsRoutes.get(
  '/tools/stats',
  describeRoute({
    tags: ['Admin AI Tools'],
    summary: '工具使用統計',
    responses: { 200: { description: '統計資料' } },
  }),
  async (c) => {
    const { results } = await c.env.DB.prepare(
      'SELECT name, category, stats_call_count, stats_error_count, stats_avg_latency_ms FROM tools WHERE stats_call_count > 0 ORDER BY stats_call_count DESC'
    ).all()
    return c.json({ success: true, data: results })
  }
)
