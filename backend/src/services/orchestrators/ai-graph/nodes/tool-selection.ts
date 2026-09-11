import { endSpan, startSpan } from '../../../../utils/langfuse'
import {
  inferPersonalTemplate,
  PERSONAL_QUERY_PATTERN,
  parseQuery,
  RECOMMENDATION_PATTERN,
} from '../../../tools/parse-query'
import { GraphState } from '../state'

export async function toolSelectionNode(state: GraphState): Promise<Partial<GraphState>> {
  const span = startSpan(state.langfuseTrace ?? null, 'tool-selection', {
    query: state.request.query,
  })
  try {
    const { env, request, pipelineConfig, prompts, gatewayOptions, tokenBreakdown, trace } = state
    const { query } = request
    const llmModel = pipelineConfig.llm_model

    // --- Graph 獨有：sim-route intent（多條路線版） ---
    const hasSimRouteIntent = state.queryService.hasSimilarRouteIntent(query)
    const wantsRecommendation = RECOMMENDATION_PATTERN.test(query)
    const isPersonalQuery = PERSONAL_QUERY_PATTERN.test(query) && !wantsRecommendation

    if (isPersonalQuery) {
      endSpan(span, { output: { queryType: 'sql', personal_query_fallback: true } })
      return {
        queryType: 'sql',
        sqlTemplate: inferPersonalTemplate(query),
        sqlParams: {},
        effectiveLlmModel: pipelineConfig.lightweight_model,
        trace: {
          query_parsing: { personal_query_fallback: true, tool: 'search_sql', query_type: 'sql' },
        },
      }
    }

    if (hasSimRouteIntent) {
      const updates: Partial<GraphState> = { isSimRouteSearch: true }

      const [routeRefs, hydeDocResult] = await Promise.all([
        state.queryService.extractRouteReferences(query),
        state.queryService.generateHyDE(query, llmModel, gatewayOptions, prompts['HYDE_PROMPT']),
      ])

      updates.hydeDoc = hydeDocResult.doc
      if (hydeDocResult.usage) {
        updates.tokenBreakdown = {
          ...tokenBreakdown,
          hyde: { ...hydeDocResult.usage, model: llmModel },
        }
      }
      if (hydeDocResult.doc) {
        updates.trace = { ...updates.trace, hyde: { document: hydeDocResult.doc.slice(0, 300) } }
      }

      if (routeRefs.length > 0) {
        const vectorFilter: Record<string, unknown> = { ...(state.vectorFilter ?? {}) }
        const cragIds = [...new Set(routeRefs.map((r) => r.cragId).filter(Boolean))] as string[]
        if (cragIds.length === 1) vectorFilter['crag_id'] = { $eq: cragIds[0] }
        else if (cragIds.length > 1) vectorFilter['crag_id'] = { $in: cragIds }

        const gradeNumerics = routeRefs.map((r) => r.gradeNumeric).filter((g) => g > 0)
        if (gradeNumerics.length > 0) {
          const minRange = state.queryService.similarGradeRange(Math.min(...gradeNumerics), 3)
          const maxRange = state.queryService.similarGradeRange(Math.max(...gradeNumerics), 3)
          vectorFilter['grade_numeric'] = { $gte: minRange.$gte, $lte: maxRange.$lte }
        }
        vectorFilter['type'] = { $eq: 'route' }
        updates.vectorFilter = vectorFilter
        updates.excludeRouteIds = routeRefs.map((r) => r.routeId)
        updates.excludeRouteId = routeRefs[0].routeId

        const routeInfoLines = routeRefs.map((r) => {
          const typeLabel = r.routeType ? `，類型：${r.routeType}` : ''
          return `${r.name}（難度：${r.grade ?? '未知'}${typeLabel}）`
        })
        updates.referenceRouteInfo =
          routeRefs.length === 1
            ? `使用者剛爬完的路線：${routeInfoLines[0]}`
            : `使用者提及的路線（共 ${routeRefs.length} 條）：\n${routeInfoLines.map((l) => `- ${l}`).join('\n')}`
      }

      updates.queryType = 'complex'
      updates.effectiveLlmModel = llmModel
      updates.trace = {
        ...updates.trace,
        query_parsing: {
          tool: 'search_routes',
          query_type: 'complex',
          confidence: 1.0,
          params: {
            sim_route_search: true,
            reference_routes: routeRefs.map((r) => r.name),
            reference_grades: routeRefs.map((r) => r.grade),
            route_count: routeRefs.length,
            hyde_generated: !!hydeDocResult.doc,
          },
          fallback_used: false,
          confidence_fallback: false,
        },
      }

      endSpan(span, {
        output: {
          queryType: 'complex',
          isSimRouteSearch: true,
          routeCount: routeRefs.length,
        },
      })
      return updates
    }

    // --- 共用路徑：預載岩場 + LLM 分類 + queryType 判定 ---
    const [cragsResult, areasResult] = await Promise.all([
      env.DB.prepare('SELECT id, name, region FROM crags WHERE name IS NOT NULL').all<{
        id: string
        name: string
        region: string | null
      }>(),
      env.DB.prepare('SELECT id, name FROM areas WHERE name IS NOT NULL').all<{
        id: string
        name: string
      }>(),
    ])
    const preloadedCrags = cragsResult.results
    const preloadedAreas = areasResult.results
    const cragNames = preloadedCrags.map((c) => c.name)
    const areaNames = preloadedAreas.map((a) => a.name)
    const regionNames = [
      ...new Set(preloadedCrags.map((c) => c.region).filter(Boolean)),
    ] as string[]

    const result = await parseQuery(
      { parseQueryWithLLM: state.queryService.parseQueryWithLLM.bind(state.queryService) },
      {
        query,
        llmModel,
        cragNames,
        areaNames,
        regionNames,
        gatewayOptions,
        toolSelectionPromptTemplate: prompts['TOOL_SELECTION_PROMPT'] || '',
        config: {
          lightweight_model: pipelineConfig.lightweight_model,
          simple_model: pipelineConfig.simple_model,
          rag_strategy: pipelineConfig.rag_strategy,
          tool_confidence_threshold: pipelineConfig.tool_confidence_threshold,
        },
      }
    )

    // 型別窄化：ParseQueryOutput 用寬鬆的 string，GraphState 用 union literal
    const updates: Partial<GraphState> = {
      parsedQuery: result.parsedQuery as GraphState['parsedQuery'],
      preloadedCrags,
      preloadedAreas,
      queryType: result.queryType as GraphState['queryType'],
      effectiveLlmModel: result.effectiveLlmModel,
      toolConfidence: result.toolConfidence,
      alternativeTool: result.alternativeTool,
      fallbackEnabled: result.fallbackEnabled,
    }
    if (result.sqlTemplate) updates.sqlTemplate = result.sqlTemplate
    if (result.sqlParams) updates.sqlParams = result.sqlParams
    if (result.clarificationType)
      updates.clarificationType = result.clarificationType as GraphState['clarificationType']
    if (result.strategyHint) updates.strategyHint = result.strategyHint
    if (result.retrievalMethod)
      updates.retrievalMethod = result.retrievalMethod as GraphState['retrievalMethod']
    if (result.multiToolPlan)
      updates.multiToolPlan = result.multiToolPlan as unknown as GraphState['multiToolPlan']
    if (result.usage) {
      updates.tokenBreakdown = {
        ...tokenBreakdown,
        tool_selection: { ...result.usage, model: llmModel, estimated: false },
      }
    }
    updates.trace = {
      ...trace,
      query_parsing: result.trace.query_parsing,
      tool_selection: result.trace.tool_selection,
    }

    endSpan(span, {
      output: {
        queryType: result.queryType,
        tool: result.parsedQuery?.tool,
        confidence: result.toolConfidence,
      },
    })
    return updates
  } catch (err) {
    endSpan(span, { level: 'ERROR', metadata: { error: String(err) } })
    throw err
  }
}
