import { popularityRerank } from '../../../tools/popularity-rerank'
import { PipelineContext, PipelineStep } from '../types'

export const popularityRerankStep: PipelineStep = {
  id: 'popularity-rerank',
  name: '熱門度加權排序',
  description: '依影片數量加權排序路線，組合 sources 和 context 文字',
  phase: 'post-retrieval',
  defaultEnabled: true,
  defaultOrder: 10,
  requires: ['scoredCandidates', 'documents'],
  provides: ['sources', 'context'],
  skipWhen: [
    {
      field: 'queryType',
      operator: 'in',
      value: ['general-knowledge', 'sql', 'hybrid', 'clarification-needed', 'multi-tool'],
    },
  ],

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    if (ctx.skipPostRetrieval) return ctx

    const result = await popularityRerank(
      ctx.env,
      {
        rerankedMatches:
          ctx.rerankedMatches ??
          (ctx.scoredCandidates ?? ctx.candidateMatches ?? []).map((m) => ({
            ...m,
            finalScore: m.score,
          })),
        documents: ctx.documents ?? new Map(),
        climbedRouteIds: ctx.climbed_route_ids,
        referenceRouteInfo: ctx.referenceRouteInfo,
        config: {
          reranker_weight: ctx.pipelineConfig.reranker_weight,
          popularity_weight: ctx.pipelineConfig.popularity_weight,
        },
      },
      {
        userId: ctx.userId,
        abilityLevel: ctx.abilityLevel,
        memorySummary: ctx.memorySummary,
        ascentContext: ctx.ascentContext,
      }
    )

    ctx.rerankedMatches = result.rerankedMatches
    ctx.videoCountMap = result.videoCountMap
    ctx.latestVideoMap = result.latestVideoMap
    ctx.sources = result.sources
    ctx.context = result.context
    ctx.trace.popularity_rerank = result.trace.popularity_rerank
    ctx.trace.generation = result.trace.generation

    return ctx
  },
}
