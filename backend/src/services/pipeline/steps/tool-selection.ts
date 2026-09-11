import {
  inferPersonalTemplate,
  PERSONAL_QUERY_PATTERN,
  parseQuery,
  RECOMMENDATION_PATTERN,
} from '../../tools/parse-query'
import { PipelineContext, PipelineStep } from '../types'

export const toolSelectionStep: PipelineStep = {
  id: 'tool-selection',
  name: 'Tool Calling (LLM A)',
  description: '解析查詢意圖、分類 queryType，提取搜尋參數',
  phase: 'pre-retrieval',
  defaultEnabled: true,
  defaultOrder: 1,
  requires: [],
  provides: [
    'queryType',
    'parsedQuery',
    'effectiveLlmModel',
    'preloadedCrags',
    'preloadedAreas',
    'sqlTemplate',
    'sqlParams',
    'clarificationType',
    'toolConfidence',
    'fallbackEnabled',
    'alternativeTool',
    'retrievalMethod',
  ],

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    const { env, request, pipelineConfig, prompts, gatewayOptions, tokenBreakdown, trace } = ctx
    const { query } = request
    const llmModel = pipelineConfig.llm_model

    // --- Pipeline 獨有：sim-route intent（單條路線版） ---
    const hasSimRouteIntent = ctx.queryService.hasSimilarRouteIntent(query)
    const wantsRecommendation = RECOMMENDATION_PATTERN.test(query)
    const isPersonalQuery = PERSONAL_QUERY_PATTERN.test(query) && !wantsRecommendation

    if (isPersonalQuery) {
      ctx.queryType = 'sql'
      ctx.sqlTemplate = inferPersonalTemplate(query)
      ctx.sqlParams = {}
      ctx.effectiveLlmModel = pipelineConfig.lightweight_model
      trace.query_parsing = { personal_query_fallback: true, tool: 'search_sql', query_type: 'sql' }
      return ctx
    }

    if (hasSimRouteIntent) {
      ctx.isSimRouteSearch = true
      const [routeRef, hydeDocResult] = await Promise.all([
        ctx.queryService.extractRouteReference(query),
        ctx.queryService.generateHyDE(query, llmModel, gatewayOptions, prompts['HYDE_PROMPT']),
      ])
      ctx.hydeDoc = hydeDocResult.doc
      if (hydeDocResult.usage) tokenBreakdown.hyde = { ...hydeDocResult.usage, model: llmModel }
      if (ctx.hydeDoc) trace.hyde = { document: ctx.hydeDoc.slice(0, 300) }

      if (routeRef) {
        ctx.vectorFilter = ctx.vectorFilter ?? {}
        if (routeRef.cragId) ctx.vectorFilter['crag_id'] = { $eq: routeRef.cragId }
        if (routeRef.gradeNumeric > 0) {
          ctx.vectorFilter['grade_numeric'] = ctx.queryService.similarGradeRange(
            routeRef.gradeNumeric,
            3
          )
        }
        ctx.vectorFilter['type'] = { $eq: 'route' }
        ctx.excludeRouteId = routeRef.routeId
        const typeLabel = routeRef.routeType ? `，類型：${routeRef.routeType}` : ''
        ctx.referenceRouteInfo = `使用者剛爬完的路線：${routeRef.name}（難度：${routeRef.grade ?? '未知'}${typeLabel}）`
      }
      ctx.queryType = 'complex'
      ctx.effectiveLlmModel = llmModel
      trace.query_parsing = {
        tool: 'search_routes',
        query_type: 'complex',
        confidence: 1.0,
        params: {
          sim_route_search: true,
          reference_route: routeRef?.name ?? null,
          reference_grade: routeRef?.grade ?? null,
          hyde_generated: !!ctx.hydeDoc,
        },
        fallback_used: false,
        confidence_fallback: false,
      }
      return ctx
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
    ctx.preloadedCrags = cragsResult.results
    ctx.preloadedAreas = areasResult.results
    const cragNames = ctx.preloadedCrags.map((c) => c.name)
    const areaNames = ctx.preloadedAreas.map((a) => a.name)
    const regionNames = [
      ...new Set(ctx.preloadedCrags.map((c) => c.region).filter(Boolean)),
    ] as string[]

    const result = await parseQuery(
      { parseQueryWithLLM: ctx.queryService.parseQueryWithLLM.bind(ctx.queryService) },
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

    // 寫回 PipelineContext（型別窄化：ParseQueryOutput 用寬鬆的 string，PipelineContext 用 union literal）
    ctx.parsedQuery = result.parsedQuery as PipelineContext['parsedQuery']
    ctx.queryType = result.queryType as PipelineContext['queryType']
    ctx.effectiveLlmModel = result.effectiveLlmModel
    ctx.toolConfidence = result.toolConfidence
    ctx.alternativeTool = result.alternativeTool
    ctx.fallbackEnabled = result.fallbackEnabled
    if (result.sqlTemplate) ctx.sqlTemplate = result.sqlTemplate
    if (result.sqlParams) ctx.sqlParams = result.sqlParams
    if (result.clarificationType)
      ctx.clarificationType = result.clarificationType as PipelineContext['clarificationType']
    if (result.strategyHint) ctx.strategyHint = result.strategyHint
    if (result.retrievalMethod)
      ctx.retrievalMethod = result.retrievalMethod as PipelineContext['retrievalMethod']
    if (result.multiToolPlan)
      ctx.multiToolPlan = result.multiToolPlan as unknown as PipelineContext['multiToolPlan']
    if (result.usage)
      tokenBreakdown.tool_selection = { ...result.usage, model: llmModel, estimated: false }
    trace.query_parsing = result.trace.query_parsing
    trace.tool_selection = result.trace.tool_selection

    return ctx
  },
}
