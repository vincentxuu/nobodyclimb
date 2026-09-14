import { Hono } from 'hono'
import { validator } from 'hono-openapi'
import { z } from 'zod'
import { adminMiddleware, authMiddleware } from '../middleware/auth'
import { WorkersMCPClient } from '../services/agent/mcp/client'
import { discoverAndSync } from '../services/agent/mcp/registry'
import type { Env } from '../types'

export const adminAiMcpRoutes = new Hono<{ Bindings: Env }>()
adminAiMcpRoutes.use('*', authMiddleware, adminMiddleware)

// GET /mcp — List all MCP servers with tool counts
adminAiMcpRoutes.get('/mcp', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT ms.*,
       (SELECT COUNT(*) FROM tool_snapshot ts WHERE ts.server_id = ms.id AND ts.removed_at IS NULL) AS tool_count
     FROM mcp_server ms ORDER BY ms.name`
  ).all()
  return c.json({ success: true, data: results })
})

// POST /mcp — Add MCP server + auto-discover tools
const createMcpSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/),
  description: z.string().optional(),
  transport: z.enum(['streamable_http', 'sse']).default('streamable_http'),
  url: z.string().url(),
  auth_type: z.enum(['none', 'api_key', 'oauth']).default('none'),
  secret_ref: z.string().nullable().optional(),
})

adminAiMcpRoutes.post('/mcp', validator('json', createMcpSchema), async (c) => {
  const body = c.req.valid('json')
  const id = crypto.randomUUID()

  await c.env.DB.prepare(
    `INSERT INTO mcp_server (id, tenant_id, name, description, transport, url, auth_type, secret_ref)
     VALUES (?, 'default', ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      body.name,
      body.description ?? null,
      body.transport,
      body.url,
      body.auth_type,
      body.secret_ref ?? null
    )
    .run()

  // Auto-discover tools
  let discovery = null
  try {
    const authToken = body.secret_ref
      ? ((c.env as unknown as Record<string, string>)[body.secret_ref] ?? undefined)
      : undefined
    const client = new WorkersMCPClient(
      {
        name: body.name,
        url: body.url,
        transport: body.transport,
        auth_type: body.auth_type,
        secret_ref: body.secret_ref ?? null,
      },
      authToken
    )
    discovery = await discoverAndSync(c.env.DB, id, body.name, client)

    await c.env.DB.prepare(
      "UPDATE mcp_server SET health_status = 'healthy', last_health_check = datetime('now') WHERE id = ?"
    )
      .bind(id)
      .run()
  } catch (err) {
    await c.env.DB.prepare(
      "UPDATE mcp_server SET health_status = 'unhealthy', last_health_check = datetime('now') WHERE id = ?"
    )
      .bind(id)
      .run()
  }

  return c.json({ success: true, data: { id, discovery } }, 201)
})

// PUT /mcp/:id — Update server config
const updateMcpSchema = z.object({
  description: z.string().nullable().optional(),
  url: z.string().url().optional(),
  auth_type: z.enum(['none', 'api_key', 'oauth']).optional(),
  secret_ref: z.string().nullable().optional(),
  enabled: z.number().int().min(0).max(1).optional(),
})

adminAiMcpRoutes.put('/mcp/:id', validator('json', updateMcpSchema), async (c) => {
  const id = c.req.param('id')
  const body = c.req.valid('json')

  const sets: string[] = []
  const values: unknown[] = []

  if (body.description !== undefined) {
    sets.push('description = ?')
    values.push(body.description)
  }
  if (body.url !== undefined) {
    sets.push('url = ?')
    values.push(body.url)
  }
  if (body.auth_type !== undefined) {
    sets.push('auth_type = ?')
    values.push(body.auth_type)
  }
  if (body.secret_ref !== undefined) {
    sets.push('secret_ref = ?')
    values.push(body.secret_ref)
  }
  if (body.enabled !== undefined) {
    sets.push('enabled = ?')
    values.push(body.enabled)
  }

  if (sets.length === 0) return c.json({ success: false, error: 'NoChanges' }, 400)

  sets.push("updated_at = datetime('now')")
  const result = await c.env.DB.prepare(`UPDATE mcp_server SET ${sets.join(', ')} WHERE id = ?`)
    .bind(...values, id)
    .run()

  if (result.meta.changes === 0) return c.json({ success: false, error: 'NotFound' }, 404)
  return c.json({ success: true })
})

// DELETE /mcp/:id
adminAiMcpRoutes.delete('/mcp/:id', async (c) => {
  const id = c.req.param('id')
  const result = await c.env.DB.prepare('DELETE FROM mcp_server WHERE id = ?').bind(id).run()
  if (result.meta.changes === 0) return c.json({ success: false, error: 'NotFound' }, 404)
  return c.json({ success: true })
})

// POST /mcp/:id/discover — Re-discover tools from server
adminAiMcpRoutes.post('/mcp/:id/discover', async (c) => {
  const id = c.req.param('id')
  const server = await c.env.DB.prepare('SELECT * FROM mcp_server WHERE id = ?').bind(id).first<{
    name: string
    url: string
    transport: string
    auth_type: string
    secret_ref: string | null
  }>()

  if (!server) return c.json({ success: false, error: 'NotFound' }, 404)

  const authToken = server.secret_ref
    ? ((c.env as unknown as Record<string, string>)[server.secret_ref] ?? undefined)
    : undefined
  const client = new WorkersMCPClient(
    {
      name: server.name,
      url: server.url,
      transport: server.transport as 'streamable_http' | 'sse',
      auth_type: server.auth_type as 'none' | 'api_key' | 'oauth',
      secret_ref: server.secret_ref,
    },
    authToken
  )

  try {
    const result = await discoverAndSync(c.env.DB, id, server.name, client)
    await c.env.DB.prepare(
      "UPDATE mcp_server SET health_status = 'healthy', last_health_check = datetime('now') WHERE id = ?"
    )
      .bind(id)
      .run()
    return c.json({ success: true, data: result })
  } catch (err) {
    await c.env.DB.prepare(
      "UPDATE mcp_server SET health_status = 'unhealthy', last_health_check = datetime('now') WHERE id = ?"
    )
      .bind(id)
      .run()
    return c.json(
      {
        success: false,
        error: 'DiscoveryFailed',
        message: err instanceof Error ? err.message : String(err),
      },
      502
    )
  }
})

// POST /mcp/:id/health — Health check
adminAiMcpRoutes.post('/mcp/:id/health', async (c) => {
  const id = c.req.param('id')
  const server = await c.env.DB.prepare('SELECT * FROM mcp_server WHERE id = ?').bind(id).first<{
    name: string
    url: string
    transport: string
    auth_type: string
    secret_ref: string | null
  }>()

  if (!server) return c.json({ success: false, error: 'NotFound' }, 404)

  const authToken = server.secret_ref
    ? ((c.env as unknown as Record<string, string>)[server.secret_ref] ?? undefined)
    : undefined
  const client = new WorkersMCPClient(
    {
      name: server.name,
      url: server.url,
      transport: server.transport as 'streamable_http' | 'sse',
      auth_type: server.auth_type as 'none' | 'api_key' | 'oauth',
      secret_ref: server.secret_ref,
    },
    authToken
  )

  const healthy = await client.healthCheck()
  const status = healthy ? 'healthy' : 'unhealthy'
  await c.env.DB.prepare(
    "UPDATE mcp_server SET health_status = ?, last_health_check = datetime('now') WHERE id = ?"
  )
    .bind(status, id)
    .run()

  return c.json({ success: true, data: { status } })
})

// GET /mcp/:id/tools — List tool snapshots for a server
adminAiMcpRoutes.get('/mcp/:id/tools', async (c) => {
  const id = c.req.param('id')
  const includeRemoved = c.req.query('include_removed') === 'true'

  const query = includeRemoved
    ? 'SELECT * FROM tool_snapshot WHERE server_id = ? ORDER BY tool_name'
    : 'SELECT * FROM tool_snapshot WHERE server_id = ? AND removed_at IS NULL ORDER BY tool_name'

  const { results } = await c.env.DB.prepare(query).bind(id).all()
  return c.json({ success: true, data: results })
})

// POST /mcp/:id/tools/:toolName/test — Test call an MCP tool
const testToolSchema = z.object({
  arguments: z.record(z.unknown()).default({}),
})

adminAiMcpRoutes.post(
  '/mcp/:id/tools/:toolName/test',
  validator('json', testToolSchema),
  async (c) => {
    const id = c.req.param('id')
    const toolName = c.req.param('toolName')
    const { arguments: args } = c.req.valid('json')

    const server = await c.env.DB.prepare('SELECT * FROM mcp_server WHERE id = ?').bind(id).first<{
      name: string
      url: string
      transport: string
      auth_type: string
      secret_ref: string | null
    }>()

    if (!server) return c.json({ success: false, error: 'NotFound' }, 404)

    const authToken = server.secret_ref
      ? ((c.env as unknown as Record<string, string>)[server.secret_ref] ?? undefined)
      : undefined
    const client = new WorkersMCPClient(
      {
        name: server.name,
        url: server.url,
        transport: server.transport as 'streamable_http' | 'sse',
        auth_type: server.auth_type as 'none' | 'api_key' | 'oauth',
        secret_ref: server.secret_ref,
      },
      authToken
    )

    try {
      const startMs = Date.now()
      const result = await client.callTool(toolName, args)
      const durationMs = Date.now() - startMs
      return c.json({ success: true, data: { result, duration_ms: durationMs } })
    } catch (err) {
      return c.json(
        {
          success: false,
          error: 'ToolCallFailed',
          message: err instanceof Error ? err.message : String(err),
        },
        502
      )
    }
  }
)
