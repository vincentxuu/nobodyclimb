import { selectManifests } from '../classifier'
import { ToolRegistry } from '../registry'
import type { ToolManifest } from '../types'
import { suggestTrainingTool } from './coaching'
import { cragInfoTool } from './crag-info'
import { getActiveManifests } from './manifests'
import { recallMemoryTool } from './memory'
import { recommendTool } from './recommend'
import { searchCragsTool } from './search-crags'
import { searchRoutesTool } from './search-routes'
import { sqlQueryTool } from './sql-query'
import { userProfileTool } from './user-profile'
import { weatherTool } from './weather'

const TOOL_MAP: Record<string, import('../types').Tool> = {
  search_routes: searchRoutesTool,
  search_crags: searchCragsTool,
  sql_query: sqlQueryTool,
  weather: weatherTool,
  user_profile: userProfileTool,
  recommend: recommendTool,
  crag_info: cragInfoTool,
  recall_memory: recallMemoryTool,
  suggest_training: suggestTrainingTool,
}

/** manifest-driven 條件式工具註冊。query 有值時啟用動態載入。 */
export function createToolRegistry(opts?: {
  isAuthenticated?: boolean
  query?: string
}): { registry: ToolRegistry; manifests: ToolManifest[] } {
  const isAuthenticated = opts?.isAuthenticated ?? false
  let manifests = getActiveManifests(isAuthenticated)

  if (opts?.query) {
    manifests = selectManifests(opts.query, manifests)
  }

  const registry = new ToolRegistry()
  const activeToolNames = new Set(manifests.flatMap((m) => m.tools))
  for (const name of activeToolNames) {
    const tool = TOOL_MAP[name]
    if (tool) registry.registerTool(tool)
  }

  return { registry, manifests }
}
