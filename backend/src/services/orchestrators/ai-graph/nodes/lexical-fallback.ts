import { endSpan, startSpan } from '../../../../utils/langfuse'
import { GraphState } from '../state'

export async function lexicalFallbackNode(state: GraphState): Promise<Partial<GraphState>> {
  if (!state.embeddingFailed) return {}

  const span = startSpan(state.langfuseTrace ?? null, 'lexical-fallback', {
    queryType: state.queryType,
  })
  try {
    const { request, pipelineConfig, queryService } = state
    const vectorFilter = state.vectorFilter ?? {}

    const hasFilter = Object.keys(vectorFilter).some((k) =>
      ['grade_numeric', 'crag_id', 'area_id', 'region', 'route_type'].includes(k)
    )
    const minScore = hasFilter
      ? pipelineConfig.min_rrf_score_filtered
      : pipelineConfig.min_rrf_score
    const bm25Matches = await queryService.searchBM25(
      state.retrievalQuery ?? request.query,
      pipelineConfig.bm25_top_k
    )
    const candidateMatches = bm25Matches.filter((m) => m.score >= minScore)
    const retrievalScore = bm25Matches.length > 0 ? Math.max(...bm25Matches.map((m) => m.score)) : 0

    const documents = await queryService.getDocuments(candidateMatches.map((m) => m.id))
    const excludeIds = state.excludeRouteIds ?? (state.excludeRouteId ? [state.excludeRouteId] : [])
    if (excludeIds.length > 0) {
      const excludeSet = new Set(excludeIds)
      for (const [embeddingId, doc] of documents) {
        if (excludeSet.has(doc.source_id)) documents.delete(embeddingId)
      }
    }

    endSpan(span, { output: { docCount: candidateMatches.length } })
    return {
      candidateMatches,
      documents,
      retrievalScore,
      trace: {
        retrieval: {
          paths: ['bm25_only'],
          degraded: true,
          degraded_reason: 'embedding_timeout',
          bm25_count: bm25Matches.length,
          candidates_after_filter: candidateMatches.length,
        },
      },
    }
  } catch (err) {
    endSpan(span, { level: 'ERROR', metadata: { error: String(err) } })
    throw err
  }
}
