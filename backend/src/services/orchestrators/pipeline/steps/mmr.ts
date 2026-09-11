import { mmrSelect } from '../../../tools/mmr'
import { PipelineContext, PipelineStep } from '../types'

export const mmrStep: PipelineStep = {
  id: 'mmr',
  name: 'MMR 多樣性選取',
  description: '從重排候選中兼顧相關性與多樣性選取 top-N',
  phase: 'post-retrieval',
  defaultEnabled: true,
  defaultOrder: 9,
  requires: ['candidateMatches', 'documents'],
  provides: ['rerankedMatches'],
  skipWhen: [
    {
      field: 'queryType',
      operator: 'in',
      value: ['general-knowledge', 'sql', 'hybrid', 'clarification-needed', 'multi-tool'],
    },
  ],

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    if (ctx.skipPostRetrieval) {
      ctx.rerankedMatches = (ctx.scoredCandidates ?? []).map((m) => ({ ...m, finalScore: m.score }))
      ctx.trace.mmr_selection = { skipped_reason: 'skipPostRetrieval' }
      return ctx
    }

    const result = mmrSelect({
      scoredCandidates: ctx.scoredCandidates ?? ctx.candidateMatches ?? [],
      documents: ctx.documents ?? new Map(),
      config: {
        mmr_lambda: ctx.pipelineConfig.mmr_lambda,
        max_results: ctx.pipelineConfig.max_results,
      },
    })

    ctx.rerankedMatches = result.rerankedMatches
    ctx.trace.mmr_selection = {
      ...result.trace,
      popularity_weight: ctx.pipelineConfig.popularity_weight,
    }

    return ctx
  },
}
