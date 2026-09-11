import { endSpan, startSpan } from '../../../../utils/langfuse'
import { GraphState } from '../state'

export async function multiSourceRetrievalNode(state: GraphState): Promise<Partial<GraphState>> {
  if (state.queryType !== 'multi-tool' || !state.multiToolPlan) return {}

  const span = startSpan(state.langfuseTrace ?? null, 'multi-source-retrieval', {
    queryType: state.queryType,
  })
  try {
    const { request, pipelineConfig, queryService } = state
    const { query } = request
    const plan = state.multiToolPlan
    const multiToolStart = Date.now()

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
      const { results: stepResults } = await queryService.executePlan(
        execPlan,
        pipelineConfig,
        state.gatewayOptions
      )
      const {
        context: synthesizedContext,
        sources,
        usage: synthUsage,
      } = await queryService.synthesize(
        query,
        stepResults,
        pipelineConfig,
        state.prompts['SYNTHESIS_PROMPT'],
        state.gatewayOptions
      )

      const tokenBreakdown = synthUsage
        ? {
            ...state.tokenBreakdown,
            synthesis: { ...synthUsage, model: pipelineConfig.llm_model },
          }
        : state.tokenBreakdown

      const retrievalScore =
        sources.length > 0 ? Math.max(...sources.map((s) => s.score ?? 0)) : 0

      endSpan(span, { output: { docCount: sources.length } })
      return {
        context: synthesizedContext,
        sources,
        skipPostRetrieval: true,
        candidateMatches: [],
        documents: new Map(),
        retrievalScore,
        tokenBreakdown,
        trace: {
          multi_tool: {
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
          },
          generation: {
            context_doc_count: sources.length,
            personalized: !!state.userId,
            regen_triggered: false,
            ability_level: state.abilityLevel,
            strategy: 'multi-tool',
          },
        },
      }
    } catch (err) {
      const bm25Matches = await queryService.searchBM25(query, pipelineConfig.bm25_top_k)
      const documents = await queryService.getDocuments(bm25Matches.map((m) => m.id))
      const retrievalScore =
        bm25Matches.length > 0 ? Math.max(...bm25Matches.map((m) => m.score)) : 0

      endSpan(span, { output: { docCount: bm25Matches.length } })
      return {
        candidateMatches: bm25Matches,
        documents,
        retrievalScore,
        degradedStages: ['multi-tool-fallback'],
        trace: {
          multi_tool: {
            fallback: true,
            error: err instanceof Error ? err.message : String(err),
            total_duration_ms: Date.now() - multiToolStart,
          },
        },
      }
    }
  } catch (err) {
    endSpan(span, { level: 'ERROR', metadata: { error: String(err) } })
    throw err
  }
}
