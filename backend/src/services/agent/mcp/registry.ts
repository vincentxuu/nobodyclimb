import type { ToolRegistry } from '../registry'
import { adaptMCPTool } from './adapter'
import type { MCPToolDefinition } from './client'
import { WorkersMCPClient } from './client'

interface ToolSnapshotRow {
  tool_name: string
  qualified_key: string
  description: string
  input_schema: string
  server_name: string
  server_url: string
  server_auth_type: string
  server_secret_ref: string | null
}

export async function registerMCPTools(
  db: D1Database,
  registry: ToolRegistry,
  env: Record<string, unknown>
): Promise<void> {
  const { results } = await db
    .prepare(
      `SELECT ts.tool_name, ts.qualified_key, ts.description, ts.input_schema,
           ms.name AS server_name, ms.url AS server_url, ms.auth_type AS server_auth_type, ms.secret_ref AS server_secret_ref
    FROM tool_snapshot ts
    JOIN mcp_server ms ON ts.server_id = ms.id
    WHERE ms.enabled = 1 AND ts.removed_at IS NULL
    ORDER BY ms.name, ts.tool_name`
    )
    .all<ToolSnapshotRow>()

  if (!results?.length) return

  const clientCache = new Map<string, WorkersMCPClient>()

  for (const row of results) {
    if (!clientCache.has(row.server_name)) {
      const authToken = row.server_secret_ref
        ? ((env[row.server_secret_ref] as string) ?? undefined)
        : undefined
      clientCache.set(
        row.server_name,
        new WorkersMCPClient(
          {
            name: row.server_name,
            url: row.server_url,
            transport: 'streamable_http',
            auth_type: row.server_auth_type as 'none' | 'api_key' | 'oauth',
            secret_ref: row.server_secret_ref,
          },
          authToken
        )
      )
    }

    const client = clientCache.get(row.server_name)!
    const mcpTool: MCPToolDefinition = {
      name: row.tool_name,
      description: row.description,
      inputSchema: JSON.parse(row.input_schema),
    }
    registry.registerTool(adaptMCPTool(mcpTool, client, row.server_name))
  }
}

export function computeSchemaHash(tool: MCPToolDefinition): string {
  const content = JSON.stringify({
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema,
  })
  let hash = 0x811c9dc5
  for (let i = 0; i < content.length; i++) {
    hash ^= content.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

export async function discoverAndSync(
  db: D1Database,
  serverId: string,
  serverName: string,
  client: WorkersMCPClient
): Promise<{ added: number; updated: number; removed: number }> {
  const tools = await client.listTools()
  const now = new Date().toISOString()
  let added = 0
  let updated = 0
  let removed = 0

  const { results: existing } = await db
    .prepare(
      'SELECT id, tool_name, schema_hash FROM tool_snapshot WHERE server_id = ? AND removed_at IS NULL'
    )
    .bind(serverId)
    .all<{ id: string; tool_name: string; schema_hash: string }>()

  const existingMap = new Map((existing ?? []).map((e) => [e.tool_name, e]))
  const seenTools = new Set<string>()

  for (const tool of tools) {
    seenTools.add(tool.name)
    const hash = computeSchemaHash(tool)
    const qualifiedKey = `${serverName}__${tool.name}`
    const ex = existingMap.get(tool.name)

    if (!ex) {
      await db
        .prepare(
          'INSERT INTO tool_snapshot (id, server_id, tool_name, qualified_key, description, input_schema, schema_hash, first_seen_at, last_seen_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
        )
        .bind(
          crypto.randomUUID(),
          serverId,
          tool.name,
          qualifiedKey,
          tool.description,
          JSON.stringify(tool.inputSchema),
          hash,
          now,
          now
        )
        .run()
      added++
    } else if (ex.schema_hash !== hash) {
      await db
        .prepare('UPDATE tool_snapshot SET removed_at = ? WHERE id = ?')
        .bind(now, ex.id)
        .run()
      await db
        .prepare(
          'INSERT INTO tool_snapshot (id, server_id, tool_name, qualified_key, description, input_schema, schema_hash, first_seen_at, last_seen_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
        )
        .bind(
          crypto.randomUUID(),
          serverId,
          tool.name,
          qualifiedKey,
          tool.description,
          JSON.stringify(tool.inputSchema),
          hash,
          now,
          now
        )
        .run()
      updated++
    } else {
      await db
        .prepare('UPDATE tool_snapshot SET last_seen_at = ? WHERE id = ?')
        .bind(now, ex.id)
        .run()
    }
  }

  for (const [name, ex] of existingMap) {
    if (!seenTools.has(name)) {
      await db
        .prepare('UPDATE tool_snapshot SET removed_at = ? WHERE id = ?')
        .bind(now, ex.id)
        .run()
      removed++
    }
  }

  return { added, updated, removed }
}
