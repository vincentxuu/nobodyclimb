import { crossEncoderRerank } from '../../../tools/cross-encoder'
import { PipelineContext, PipelineStep } from '../types'

export const crossEncoderStep: PipelineStep = {
  id: 'cross-encoder',
  name: 'Cross-encoder Reranking',
  description: '使用 bge-reranker-base 對候選文件重新評分',
  phase: 'post-retrieval',
  defaultEnabled: true,
  defaultOrder: 8,
  requires: ['candidateMatches', 'documents'],
  provides: ['scoredCandidates'],
  skipWhen: [
    {
      field: 'queryType',
      operator: 'in',
      value: ['general-knowledge', 'sql', 'hybrid', 'clarification-needed', 'multi-tool'],
    },
  ],

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    if (ctx.skipPostRetrieval) {
      ctx.scoredCandidates = ctx.candidateMatches ?? []
      if (ctx.trace.retrieval) {
        ;(ctx.trace.retrieval as Record<string, unknown>).reranker = {
          skipped_reason: 'skipPostRetrieval',
        }
      }
      return ctx
    }

    const result = await crossEncoderRerank(ctx.env, {
      query: ctx.request.query,
      candidateMatches: ctx.candidateMatches ?? [],
      documents: ctx.documents ?? new Map(),
      config: {
        reranker_relevance_threshold: ctx.pipelineConfig.reranker_relevance_threshold,
        reranker_min_keep: ctx.pipelineConfig.reranker_min_keep,
      },
    })

    ctx.scoredCandidates = result.scoredCandidates
    if (ctx.trace.retrieval) {
      Object.assign(ctx.trace.retrieval as Record<string, unknown>, result.trace)
    }

    return ctx
  },
}
