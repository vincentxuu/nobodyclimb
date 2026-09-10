import { GraphState } from '../state'

export async function retrievalFallbackNode(state: GraphState): Promise<Partial<GraphState>> {
  if (!state.fallbackEnabled || (state.candidateMatches ?? []).length > 0 || !state.alternativeTool)
    return {}

  const fromTool = state.parsedQuery?.tool
  const toTool = state.alternativeTool
  const { trace } = state

  const updatedParsedQuery = state.parsedQuery
    ? {
        ...state.parsedQuery,
        tool: toTool as typeof state.parsedQuery.tool,
      }
    : state.parsedQuery

  let queryType = state.queryType
  let effectiveLlmModel = state.effectiveLlmModel
  if (toTool === 'general_knowledge') {
    queryType = 'general-knowledge'
    effectiveLlmModel = state.pipelineConfig.lightweight_model
  } else if (toTool === 'search_sql') {
    queryType = 'sql'
    effectiveLlmModel = state.pipelineConfig.lightweight_model
  } else if (toTool === 'hybrid') {
    queryType = 'hybrid'
  } else {
    queryType = state.parsedQuery?.query_type ?? 'complex'
  }

  const existingToolSelection = (trace.tool_selection ?? {}) as Record<string, unknown>
  return {
    parsedQuery: updatedParsedQuery,
    queryType,
    effectiveLlmModel,
    fallbackEnabled: false,
    vectorFilter: {},
    loopBack: {
      targetPhase: 'pre-retrieval',
      reason: 'tool_fallback',
    },
    trace: {
      tool_selection: {
        ...existingToolSelection,
        fallback: {
          triggered: true,
          from_tool: fromTool,
          to_tool: toTool,
          reason: 'empty_results',
        },
      },
    },
  }
}
