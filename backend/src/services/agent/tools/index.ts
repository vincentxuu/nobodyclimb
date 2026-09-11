import { ToolRegistry } from '../registry'
import type { ToolManifest } from '../types'
import { cragInfoTool } from './crag-info'
import { getActiveManifests } from './manifests'
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
}

/** manifest-driven 條件式工具註冊 */
export function createToolRegistry(opts?: {
  isAuthenticated?: boolean
}): { registry: ToolRegistry; manifests: ToolManifest[] } {
  const isAuthenticated = opts?.isAuthenticated ?? false
  const manifests = getActiveManifests(isAuthenticated)
  const registry = new ToolRegistry()

  const activeToolNames = new Set(manifests.flatMap((m) => m.tools))
  for (const name of activeToolNames) {
    const tool = TOOL_MAP[name]
    if (tool) registry.registerTool(tool)
  }

  return { registry, manifests }
}
