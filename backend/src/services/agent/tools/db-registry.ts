import { ToolRegistry } from '../registry'
import type { Tool, ToolContext, TurnRecord } from '../types'
import { TOOL_MAP } from './index'

interface DBToolRecord {
  name: string
  enabled: number
  description_override: string | null
  config: string | null
}

function withDescriptionOverride(tool: Tool, override: string): Tool {
  return {
    ...tool,
    prompt: (_ctx: ToolContext) => override,
  }
}

export async function createDBToolRegistry(
  db: D1Database,
  opts: { isAuthenticated: boolean; requiredTools?: string[] }
): Promise<{ registry: ToolRegistry }> {
  const { results: dbTools } = await db
    .prepare('SELECT name, enabled, description_override, config FROM tools WHERE enabled = 1')
    .all<DBToolRecord>()

  const enabledNames = new Set((dbTools ?? []).map((r) => r.name))
  const overrides = new Map((dbTools ?? []).map((r) => [r.name, r]))

  const activeToolNames = opts.requiredTools ? new Set(opts.requiredTools) : enabledNames

  const registry = new ToolRegistry()
  for (const name of activeToolNames) {
    if (!enabledNames.has(name)) continue
    const tool = TOOL_MAP[name]
    if (!tool) continue
    const dbRecord = overrides.get(name)
    if (dbRecord?.description_override) {
      registry.registerTool(withDescriptionOverride(tool, dbRecord.description_override))
    } else {
      registry.registerTool(tool)
    }
  }

  return { registry }
}

export async function updateToolStats(db: D1Database, turns: TurnRecord[]): Promise<void> {
  for (const turn of turns) {
    for (const tc of turn.toolCalls) {
      try {
        await db
          .prepare(
            `UPDATE tools SET
            stats_call_count = stats_call_count + 1,
            stats_avg_latency_ms = CASE
              WHEN stats_avg_latency_ms IS NULL THEN ?
              ELSE (stats_avg_latency_ms * 0.9 + ? * 0.1)
            END,
            updated_at = datetime('now')
          WHERE name = ?`
          )
          .bind(tc.latencyMs, tc.latencyMs, tc.name)
          .run()
      } catch {
        /* non-blocking */
      }
    }
  }
}
