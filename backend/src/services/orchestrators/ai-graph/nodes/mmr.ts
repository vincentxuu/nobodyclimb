import { endSpan, startSpan } from '../../../../utils/langfuse'
import { mmrSelect } from '../../../tools/mmr'
import { GraphState } from '../state'

export async function mmrNode(state: GraphState): Promise<Partial<GraphState>> {
  const span = startSpan(state.langfuseTrace ?? null, 'mmr', {
    candidateCount: (state.scoredCandidates ?? []).length,
  })
  try {
    if (state.skipPostRetrieval) {
      endSpan(span, { output: { skipped: true } })
      return {
        rerankedMatches: (state.scoredCandidates ?? []).map((m) => ({ ...m, finalScore: m.score })),
        trace: { mmr_selection: { skipped_reason: 'skipPostRetrieval' } },
      }
    }

    const result = mmrSelect({
      scoredCandidates: state.scoredCandidates ?? [],
      documents: state.documents ?? new Map(),
      config: {
        mmr_lambda: state.pipelineConfig.mmr_lambda,
        max_results: state.pipelineConfig.max_results,
      },
    })

    endSpan(span, { output: { selectedCount: result.rerankedMatches.length } })
    return {
      rerankedMatches: result.rerankedMatches,
      trace: {
        mmr_selection: {
          ...result.trace,
          popularity_weight: state.pipelineConfig.popularity_weight,
        },
      },
    }
  } catch (err) {
    endSpan(span, { level: 'ERROR', metadata: { error: String(err) } })
    throw err
  }
}
