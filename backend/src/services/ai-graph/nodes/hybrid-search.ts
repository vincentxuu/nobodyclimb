import { endSpan, startSpan } from '../../../utils/langfuse'
import { hybridSearch } from '../../tools/hybrid-search'
import { GraphState } from '../state'

/**
 * hybrid-search graph node — 薄 wrapper
 * 把 GraphState 轉成 HybridSearchInput，呼叫共用工具，再把結果寫回 GraphState。
 */
export async function hybridSearchNode(state: GraphState): Promise<Partial<GraphState>> {
  const span = startSpan(state.langfuseTrace ?? null, 'hybrid-search', {
    queryType: state.queryType,
  })
  try {
    const { env, request, pipelineConfig } = state

    const excludeIds = state.excludeRouteIds ?? (state.excludeRouteId ? [state.excludeRouteId] : [])

    const result = await hybridSearch(env, {
      query: request.query,
      queryVector: state.queryVector!,
      hydeVector: state.hydeVector ?? null,
      expandedVectors: state.expandedVectors ?? [],
      vectorFilter: state.vectorFilter ?? {},
      retrievalMethod: state.retrievalMethod ?? 'hybrid',
      isSimRouteSearch: state.isSimRouteSearch,
      excludeRouteIds: excludeIds,
      config: {
        bm25_top_k: pipelineConfig.bm25_top_k,
        merge_top_k: pipelineConfig.merge_top_k,
        min_rrf_score: pipelineConfig.min_rrf_score,
        min_rrf_score_filtered: pipelineConfig.min_rrf_score_filtered,
      },
    })

    endSpan(span, { output: { docCount: result.candidateMatches.length } })
    return {
      skipPostRetrieval: false,
      candidateMatches: result.candidateMatches,
      documents: result.documents,
      retrievalScore: result.retrievalScore,
      trace: { retrieval: result.trace },
    }
  } catch (err) {
    endSpan(span, { level: 'ERROR', metadata: { error: String(err) } })
    throw err
  }
}
