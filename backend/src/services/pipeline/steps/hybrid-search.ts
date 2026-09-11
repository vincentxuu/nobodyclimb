import { ANTI_STYLE_KEYWORDS } from '@nobodyclimb/constants'
import { getDocuments } from '../../query/documents'
import { mergeResults, searchBM25 } from '../../query/retrieval'
import { hybridSearch } from '../../tools/hybrid-search'
import {
  AgenticStepTrace,
  PipelineContext,
  PipelineStep,
  SearchResult,
  StageTokenUsage,
} from '../types'

export const hybridSearchStep: PipelineStep = {
  id: 'hybrid-search',
  name: 'Vector + BM25 混合搜尋',
  description: '並行 Vectorize + BM25 搜尋，RRF 合併，含 Agentic 模式分支',
  phase: 'retrieval',
  defaultEnabled: true,
  defaultOrder: 7,
  requires: ['queryVector'],
  provides: ['candidateMatches', 'documents', 'retrievalScore'],
  skipWhen: [
    {
      field: 'queryType',
      operator: 'in',
      value: ['general-knowledge', 'sql', 'hybrid', 'clarification-needed'],
    },
  ],

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    const { env, request, pipelineConfig, trace, queryService } = ctx
    const { query } = request
    const vectorFilter = ctx.vectorFilter ?? {}

    // Embedding 降級：僅使用 BM25 搜尋（向量不可用）
    if (ctx.embeddingFailed) {
      const qs = queryService
      const hasFilter = Object.keys(vectorFilter).some((k) =>
        ['grade_numeric', 'crag_id', 'area_id', 'region', 'route_type'].includes(k)
      )
      const minScore = hasFilter
        ? pipelineConfig.min_rrf_score_filtered
        : pipelineConfig.min_rrf_score
      const bm25Matches = await qs.searchBM25(query, pipelineConfig.bm25_top_k)
      const candidateMatches = bm25Matches.filter((m) => m.score >= minScore)
      const retrievalScore =
        bm25Matches.length > 0 ? Math.max(...bm25Matches.map((m) => m.score)) : 0

      trace.retrieval = {
        paths: ['bm25_only'],
        degraded: true,
        degraded_reason: 'embedding_timeout',
        bm25_count: bm25Matches.length,
        candidates_after_filter: candidateMatches.length,
      }

      const documents = await qs.getDocuments(candidateMatches.map((m) => m.id))
      if (ctx.excludeRouteId) {
        for (const [embeddingId, doc] of documents) {
          if (doc.source_id === ctx.excludeRouteId) documents.delete(embeddingId)
        }
      }
      ctx.candidateMatches = candidateMatches
      ctx.documents = documents
      ctx.retrievalScore = retrievalScore
      return ctx
    }

    // Multi-Tool 分支：直接復用 executePlan + synthesize
    if (ctx.queryType === 'multi-tool' && ctx.multiToolPlan) {
      const qs = queryService
      const multiToolStart = Date.now()
      const plan = ctx.multiToolPlan

      // 將 MultiToolPlan 轉換為 ExecutionPlan 格式
      const execPlan = {
        steps: plan.steps.map((s, i) => ({
          id: i + 1,
          query: s.query || query,
          tool: s.tool,
          filters: s.params || {},
          depends_on: plan.execution_mode === 'sequential' && i > 0 ? [i] : [],
        })),
        execution_mode: plan.execution_mode,
      }

      try {
        const { results: stepResults } = await qs.executePlan(
          execPlan,
          pipelineConfig,
          ctx.gatewayOptions
        )
        const {
          context: synthesizedContext,
          sources,
          usage: synthUsage,
        } = await qs.synthesize(
          query,
          stepResults,
          pipelineConfig,
          ctx.prompts['SYNTHESIS_PROMPT'],
          ctx.gatewayOptions
        )

        if (synthUsage) {
          ctx.tokenBreakdown.synthesis = { ...synthUsage, model: pipelineConfig.llm_model }
        }

        ctx.context = synthesizedContext
        ctx.sources = sources
        ctx.skipPostRetrieval = true
        ctx.candidateMatches = []
        ctx.documents = new Map()
        ctx.retrievalScore = sources.length > 0 ? Math.max(...sources.map((s) => s.score ?? 0)) : 0

        trace.multi_tool = {
          steps: stepResults.map((r) => ({
            stepId: r.stepId,
            query: r.query,
            tool: r.tool,
            result_count: r.candidates.length + (r.sqlContext ? 1 : 0),
            duration_ms: r.durationMs,
            error: r.error,
          })),
          execution_mode: plan.execution_mode,
          total_duration_ms: Date.now() - multiToolStart,
          sources_count: sources.length,
        }

        trace.generation = {
          context_doc_count: sources.length,
          personalized: !!ctx.userId,
          regen_triggered: false,
          ability_level: ctx.abilityLevel,
          strategy: 'multi-tool',
        }

        return ctx
      } catch (err) {
        // multi-tool 執行失敗 → BM25 降級（embedding 已被 skipWhen 跳過，queryVector 不可用）
        trace.multi_tool = {
          fallback: true,
          error: err instanceof Error ? err.message : String(err),
          total_duration_ms: Date.now() - multiToolStart,
        }
        const bm25Matches = await qs.searchBM25(query, pipelineConfig.bm25_top_k)
        const documents = await qs.getDocuments(bm25Matches.map((m) => m.id))
        ctx.candidateMatches = bm25Matches
        ctx.documents = documents
        ctx.retrievalScore =
          bm25Matches.length > 0 ? Math.max(...bm25Matches.map((m) => m.score)) : 0
        if (!ctx.degradedStages) ctx.degradedStages = []
        ctx.degradedStages.push('multi-tool-fallback')
        return ctx
      }
    }

    const queryVector = ctx.queryVector!
    const hydeVector = ctx.hydeVector ?? null
    const expandedVectors = ctx.expandedVectors ?? []

    const qs = queryService

    const cragFilter = vectorFilter['crag_id'] as { $in?: string[] } | undefined
    const isMultiCrag = Array.isArray(cragFilter?.$in) && cragFilter.$in.length > 1
    const MERGE_TOP_K = isMultiCrag
      ? Math.max(20, pipelineConfig.merge_top_k * 2)
      : pipelineConfig.merge_top_k
    const hasFilter = Object.keys(vectorFilter).some((k) =>
      ['grade_numeric', 'crag_id', 'area_id', 'region', 'route_type'].includes(k)
    )
    const minScore = hasFilter
      ? pipelineConfig.min_rrf_score_filtered
      : pipelineConfig.min_rrf_score

    let candidateMatches: SearchResult[]
    let retrievalScore = 0

    // 決定有效策略
    const effectiveStrategy =
      pipelineConfig.rag_strategy === 'auto'
        ? (ctx.strategyHint ?? 'baseline')
        : pipelineConfig.rag_strategy

    // Plan-and-Execute 分支（重置 skipPostRetrieval 防止 loopBack 殘留）
    ctx.skipPostRetrieval = false
    let planExecuteFallbackToAgentic = false
    if (effectiveStrategy === 'plan-execute' && ctx.queryType === 'complex') {
      const planExecuteStart = Date.now()
      const cragNames = (ctx.preloadedCrags ?? []).map((c) => c.name)
      const areaNames = (ctx.preloadedAreas ?? []).map((a) => a.name)

      const {
        plan,
        failureReason,
        usage: planUsage,
      } = await qs.planQuery(
        query,
        pipelineConfig,
        cragNames,
        areaNames,
        ctx.prompts['PLANNING_PROMPT'],
        ctx.gatewayOptions
      )
      const planningDurationMs = Date.now() - planExecuteStart

      if (planUsage) {
        ctx.tokenBreakdown.planning = { ...planUsage, model: pipelineConfig.llm_model }
      }

      if (!plan) {
        // Planning 失敗 → fallback 到 agentic
        trace.plan_execute = {
          strategy: 'plan-execute',
          planning_duration_ms: planningDurationMs,
          plan_fallback: { reason: failureReason ?? 'planning_failed', target: 'agentic' },
          total_duration_ms: Date.now() - planExecuteStart,
        }
        planExecuteFallbackToAgentic = true
      } else if (
        pipelineConfig.rag_strategy === 'auto' &&
        plan.steps.length < pipelineConfig.plan_execute_min_entities
      ) {
        // auto 模式：子任務太少 → 降級為 agentic
        trace.plan_execute = {
          strategy: 'plan-execute',
          planning_duration_ms: planningDurationMs,
          plan,
          plan_fallback: {
            reason: 'too_few_steps',
            step_count: plan.steps.length,
            min_required: pipelineConfig.plan_execute_min_entities,
            target: 'agentic',
          },
          total_duration_ms: Date.now() - planExecuteStart,
        }
        planExecuteFallbackToAgentic = true
      } else {
        // 正常執行計畫
        try {
          const executionStart = Date.now()
          const {
            results: stepResults,
            adaptiveReplan,
            adaptiveReplanInfo,
          } = await qs.executePlan(plan, pipelineConfig, ctx.gatewayOptions)
          const executionDurationMs = Date.now() - executionStart

          const synthesisStart = Date.now()
          const {
            context: synthesizedContext,
            sources,
            usage: synthUsage,
          } = await qs.synthesize(
            query,
            stepResults,
            pipelineConfig,
            ctx.prompts['SYNTHESIS_PROMPT'],
            ctx.gatewayOptions
          )
          const synthesisDurationMs = Date.now() - synthesisStart

          if (synthUsage) {
            ctx.tokenBreakdown.synthesis = { ...synthUsage, model: pipelineConfig.llm_model }
          }

          ctx.context = synthesizedContext
          ctx.sources = sources
          ctx.skipPostRetrieval = true
          ctx.candidateMatches = []
          ctx.documents = new Map()
          ctx.retrievalScore =
            sources.length > 0 ? Math.max(...sources.map((s) => s.score ?? 0)) : 0

          trace.plan_execute = {
            strategy: 'plan-execute',
            planning_duration_ms: planningDurationMs,
            plan,
            steps: stepResults.map((r) => ({
              stepId: r.stepId,
              query: r.query,
              tool: r.tool,
              result_count: r.candidates.length + (r.sqlContext ? 1 : 0),
              duration_ms: r.durationMs,
              error: r.error,
            })),
            execution_duration_ms: executionDurationMs,
            synthesis_duration_ms: synthesisDurationMs,
            total_duration_ms: Date.now() - planExecuteStart,
            sources_count: sources.length,
            adaptive_replan: adaptiveReplan,
            ...(adaptiveReplanInfo ? { adaptive_replan_info: adaptiveReplanInfo } : {}),
          }

          // Plan-and-Execute 成功時提供 generation trace（popularity-rerank 被跳過不會設定）
          trace.generation = {
            context_doc_count: sources.length,
            personalized: !!ctx.userId,
            regen_triggered: false,
            ability_level: ctx.abilityLevel,
            strategy: 'plan-execute',
          }

          return ctx
        } catch (err) {
          // executePlan 或 synthesize 拋出異常 → fallback 到 agentic
          trace.plan_execute = {
            strategy: 'plan-execute',
            planning_duration_ms: planningDurationMs,
            plan,
            plan_fallback: {
              reason: 'execution_error',
              error: err instanceof Error ? err.message : String(err),
              target: 'agentic',
            },
            total_duration_ms: Date.now() - planExecuteStart,
          }
          planExecuteFallbackToAgentic = true
        }
      }
    }

    if (
      (effectiveStrategy === 'agentic' || planExecuteFallbackToAgentic) &&
      ctx.queryType === 'complex'
    ) {
      // Agentic Multi-Step RAG（也作為 Plan-and-Execute fallback）
      const agenticSteps: AgenticStepTrace[] = []
      const agenticDecisionUsages: Array<StageTokenUsage & { step: number }> = []
      const {
        candidates: agenticCandidates,
        terminationReason: agenticTermReason,
        initialSearch,
      } = await qs.agenticRetrieve(
        query,
        vectorFilter,
        pipelineConfig,
        agenticSteps,
        ctx.prompts['AGENTIC_DECISION_PROMPT'],
        agenticDecisionUsages
      )
      candidateMatches = agenticCandidates
      if (agenticDecisionUsages.length > 0) {
        ctx.tokenBreakdown.agentic_decisions = agenticDecisionUsages
      }
      retrievalScore =
        candidateMatches.length > 0 ? Math.max(...candidateMatches.map((m) => m.score)) : 0
      trace.agentic = {
        steps: agenticSteps,
        total_paths: agenticSteps.length + 1,
        final_doc_count: candidateMatches.length,
        termination_reason: agenticTermReason,
        initial_search: initialSearch,
      }
    } else {
      // Baseline：委派給共用工具
      const baselineResult = await hybridSearch(env, {
        query,
        queryVector,
        hydeVector,
        expandedVectors,
        vectorFilter,
        retrievalMethod: ctx.retrievalMethod ?? 'hybrid',
        isSimRouteSearch: ctx.isSimRouteSearch,
        excludeRouteIds: ctx.excludeRouteId ? [ctx.excludeRouteId] : [],
        config: {
          bm25_top_k: pipelineConfig.bm25_top_k,
          merge_top_k: pipelineConfig.merge_top_k,
          min_rrf_score: pipelineConfig.min_rrf_score,
          min_rrf_score_filtered: pipelineConfig.min_rrf_score_filtered,
        },
      })

      candidateMatches = baselineResult.candidateMatches
      retrievalScore = baselineResult.retrievalScore
      const baselineTrace = { ...baselineResult.trace }

      // Pipeline 獨有：反風格補充檢索
      const bodyAxis = ctx.personalityType?.[0]
      if (bodyAxis === 'P' || bodyAxis === 'T') {
        const antiKeywords = ANTI_STYLE_KEYWORDS[bodyAxis]
        const antiQuery = antiKeywords.join(' ')
        const antiTopK = pipelineConfig.personality_anti_retrieve_count
        const antiBm25 = await searchBM25(env.DB, antiQuery, antiTopK)
        if (antiBm25.length > 0) {
          const allMerged = mergeResults(
            [candidateMatches, antiBm25],
            pipelineConfig.merge_top_k + antiTopK
          )
          const hasFilter = Object.keys(vectorFilter).some((k) =>
            ['grade_numeric', 'crag_id', 'area_id', 'region', 'route_type'].includes(k)
          )
          const minScore = hasFilter
            ? pipelineConfig.min_rrf_score_filtered
            : pipelineConfig.min_rrf_score
          candidateMatches = allMerged.filter((m) => m.score >= minScore)
          retrievalScore = allMerged.length > 0 ? Math.max(...allMerged.map((m) => m.score)) : 0
        }
        ;(baselineTrace as Record<string, unknown>).anti_style = {
          body_axis: bodyAxis,
          results: antiBm25.length,
        }
      }

      trace.retrieval = baselineTrace
      ctx.candidateMatches = candidateMatches
      ctx.documents = baselineResult.documents
      ctx.retrievalScore = retrievalScore
    }

    // Pipeline 獨有 baseline 路徑：取得文件已在共用工具中完成
    // agentic 路徑：仍需取得文件
    if (!ctx.documents || ctx.documents.size === 0) {
      ctx.documents = await getDocuments(
        env.DB,
        candidateMatches.map((m) => m.id)
      )
    }

    // 排除來源路線（agentic 路徑用）
    if (ctx.excludeRouteId && ctx.documents) {
      for (const [embeddingId, doc] of ctx.documents) {
        if (doc.source_id === ctx.excludeRouteId) {
          ctx.documents.delete(embeddingId)
        }
      }
    }

    if (!ctx.candidateMatches) ctx.candidateMatches = candidateMatches
    if (!ctx.retrievalScore) ctx.retrievalScore = retrievalScore

    // Tool Fallback：中等信心 + 空結果 → 切換到備選工具並重新執行
    if (ctx.fallbackEnabled && candidateMatches.length === 0 && ctx.alternativeTool) {
      const fromTool = ctx.parsedQuery?.tool
      const toTool = ctx.alternativeTool

      // 更新 queryType 和 parsedQuery
      if (ctx.parsedQuery) {
        ctx.parsedQuery.tool = toTool as typeof ctx.parsedQuery.tool
      }
      // 根據目標工具決定 queryType
      if (toTool === 'general_knowledge') {
        ctx.queryType = 'general-knowledge'
        ctx.effectiveLlmModel = ctx.pipelineConfig.lightweight_model
      } else if (toTool === 'search_sql') {
        ctx.queryType = 'sql'
        ctx.effectiveLlmModel = ctx.pipelineConfig.lightweight_model
      } else if (toTool === 'hybrid') {
        ctx.queryType = 'hybrid'
      } else {
        ctx.queryType = ctx.parsedQuery?.query_type ?? 'complex'
      }

      // 防止重複 fallback
      ctx.fallbackEnabled = false
      // 清除舊的 vectorFilter，讓 filter-build 重新建構
      ctx.vectorFilter = {}
      // 觸發 loopBack 從 filter-build 重新執行
      ctx.loopBack = { targetPhase: 'pre-retrieval', reason: 'tool_fallback' }

      // Trace 記錄
      const toolSelectionTrace = (ctx.trace.tool_selection ?? {}) as Record<string, unknown>
      toolSelectionTrace.fallback = {
        triggered: true,
        from_tool: fromTool,
        to_tool: toTool,
        reason: 'empty_results',
      }
      ctx.trace.tool_selection = toolSelectionTrace
    }

    return ctx
  },
}
