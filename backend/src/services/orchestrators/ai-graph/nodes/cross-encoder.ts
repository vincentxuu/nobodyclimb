import { endSpan, startSpan } from '../../../../utils/langfuse'
import { crossEncoderRerank } from '../../../tools/cross-encoder'
import { GraphState } from '../state'

export async function crossEncoderNode(state: GraphState): Promise<Partial<GraphState>> {
  const span = startSpan(state.langfuseTrace ?? null, 'cross-encoder', {
    candidateCount: (state.candidateMatches ?? []).length,
  })
  try {
    const existingRetrievalTrace = (state.trace?.retrieval ?? {}) as Record<string, unknown>

    if (state.skipPostRetrieval) {
      endSpan(span, { output: { skipped: true } })
      return {
        scoredCandidates: state.candidateMatches ?? [],
        trace: {
          retrieval: {
            ...existingRetrievalTrace,
            reranker: { skipped_reason: 'skipPostRetrieval' },
          },
        },
      }
    }

    const result = await crossEncoderRerank(state.env, {
      query: state.request.query,
      candidateMatches: state.candidateMatches ?? [],
      documents: state.documents ?? new Map(),
      config: {
        reranker_relevance_threshold: state.pipelineConfig.reranker_relevance_threshold,
        reranker_min_keep: state.pipelineConfig.reranker_min_keep,
      },
    })

    endSpan(span, { output: { scoredCount: result.scoredCandidates.length } })
    return {
      scoredCandidates: result.scoredCandidates,
      trace: { retrieval: { ...existingRetrievalTrace, ...result.trace } },
    }
  } catch (err) {
    endSpan(span, { level: 'ERROR', metadata: { error: String(err) } })
    throw err
  }
}
