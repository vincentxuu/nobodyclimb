import { selectManifests } from '../classifier'
import { ToolRegistry } from '../registry'
import type { Tool, ToolContext, ToolManifest, TurnRecord } from '../types'
import { TOOL_MAP } from './index'
import { getActiveManifests } from './manifests'

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
  opts: { isAuthenticated: boolean; query?: string; requiredTools?: string[] }
): Promise<{ registry: ToolRegistry; manifests: ToolManifest[] }> {
  const { results: dbTools } = await db
    .prepare('SELECT name, enabled, description_override, config FROM tools WHERE enabled = 1')
    .all<DBToolRecord>()

  const enabledNames = new Set((dbTools ?? []).map((r) => r.name))
  const overrides = new Map((dbTools ?? []).map((r) => [r.name, r]))

  // If requiredTools provided (from SkillResolver), use those directly
  // Otherwise fall back to manifest-based selection
  let activeToolNames: Set<string>
  let manifests: ToolManifest[]

  if (opts.requiredTools) {
    activeToolNames = new Set(opts.requiredTools)
    manifests = []
  } else {
    manifests = getActiveManifests(opts.isAuthenticated)
    if (opts.query) {
      manifests = selectManifests(opts.query, manifests)
    }
    activeToolNames = new Set(manifests.flatMap((m) => m.tools))
  }

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

  return { registry, manifests }
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
