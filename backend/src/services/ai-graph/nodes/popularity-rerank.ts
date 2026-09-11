import { endSpan, startSpan } from '../../../utils/langfuse'
import { popularityRerank } from '../../tools/popularity-rerank'
import { GraphState } from '../state'

export async function popularityRerankNode(state: GraphState): Promise<Partial<GraphState>> {
  const span = startSpan(state.langfuseTrace ?? null, 'popularity-rerank', {
    rerankedCount: (state.rerankedMatches ?? []).length,
  })
  try {
    if (state.skipPostRetrieval) {
      endSpan(span, { output: { skipped: true } })
      return {}
    }

    const result = await popularityRerank(
      state.env,
      {
        rerankedMatches:
          state.rerankedMatches ??
          (state.scoredCandidates ?? state.candidateMatches ?? []).map((m) => ({
            ...m,
            finalScore: m.score,
          })),
        documents: state.documents ?? new Map(),
        climbedRouteIds: state.climbed_route_ids ?? undefined,
        referenceRouteInfo: state.referenceRouteInfo,
        config: {
          reranker_weight: state.pipelineConfig.reranker_weight,
          popularity_weight: state.pipelineConfig.popularity_weight,
        },
      },
      {
        userId: state.userId,
        abilityLevel: state.abilityLevel,
        memorySummary: state.memorySummary,
        ascentContext: state.ascentContext,
      }
    )

    endSpan(span, { output: { sourcesCount: result.sources.length } })
    return {
      rerankedMatches: result.rerankedMatches,
      videoCountMap: Object.fromEntries(result.videoCountMap),
      latestVideoMap: Object.fromEntries(result.latestVideoMap),
      sources: result.sources,
      context: result.context,
      trace: {
        mmr_selection: { top_selected: result.trace.popularity_rerank.top_selected },
        generation: result.trace.generation,
      },
    }
  } catch (err) {
    endSpan(span, { level: 'ERROR', metadata: { error: String(err) } })
    throw err
  }
}
