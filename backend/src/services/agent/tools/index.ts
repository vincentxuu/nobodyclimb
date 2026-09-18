import { coachingAgentTool, recommendAgentTool } from '../sub-agents'
import { suggestTrainingTool } from './coaching'
import { cragInfoTool } from './crag-info'
import { goalsTool } from './goals'
import { manageSkillTool } from './manage-skill'
import { recallMemoryTool } from './memory'
import { recommendTool } from './recommend'
import { searchCragsTool } from './search-crags'
import { searchRoutesTool } from './search-routes'
import { sqlQueryTool } from './sql-query'
import { userProfileTool } from './user-profile'
import { weatherTool } from './weather'

export const TOOL_MAP: Record<string, import('../types').Tool> = {
  search_routes: searchRoutesTool,
  search_crags: searchCragsTool,
  sql_query: sqlQueryTool,
  weather: weatherTool,
  user_profile: userProfileTool,
  recommend: recommendTool,
  crag_info: cragInfoTool,
  recall_memory: recallMemoryTool,
  suggest_training: suggestTrainingTool,
  recommend_agent: recommendAgentTool,
  coaching_agent: coachingAgentTool,
  manage_goals: goalsTool,
  manage_skill: manageSkillTool,
}
