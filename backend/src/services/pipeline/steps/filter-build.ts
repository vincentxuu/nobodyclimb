import { buildFilters } from '../../tools/build-filters'
import { PipelineContext, PipelineStep } from '../types'

export const filterBuildStep: PipelineStep = {
  id: 'filter-build',
  name: 'Filter 建構',
  description: '從查詢中提取 grade/crag/region/area 過濾條件',
  phase: 'pre-retrieval',
  defaultEnabled: true,
  defaultOrder: 5,
  requires: ['queryType'],
  provides: ['vectorFilter'],
  skipWhen: [
    {
      field: 'queryType',
      operator: 'in',
      value: ['general-knowledge', 'sql', 'hybrid', 'clarification-needed', 'multi-tool'],
    },
  ],

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    const { queryService } = ctx

    const result = await buildFilters(
      {
        buildFiltersFromParsed: (pq: Record<string, unknown>) =>
          queryService.buildFiltersFromParsed(
            pq as unknown as Parameters<typeof queryService.buildFiltersFromParsed>[0]
          ),
        extractGradeFilter: queryService.extractGradeFilter.bind(queryService),
        extractLocationFilter: queryService.extractLocationFilter.bind(queryService),
        extractTypeFilter: queryService.extractTypeFilter.bind(queryService),
        isContextDependentQuery: queryService.isContextDependentQuery.bind(queryService),
        extractRouteReference: (text: string) => queryService.extractRouteReference(text),
      },
      {
        query: ctx.request.query,
        existingFilter: ctx.vectorFilter,
        parsedQuery: ctx.parsedQuery as Record<string, unknown> | null | undefined,
        queryType: ctx.queryType,
        preloadedCrags: ctx.preloadedCrags ?? [],
        preloadedAreas: ctx.preloadedAreas ?? [],
        recentHistory: ctx.recentHistory,
        isSimRouteSearch: ctx.isSimRouteSearch,
      }
    )

    ctx.vectorFilter = result.vectorFilter
    if (result.trace.query_parsing) ctx.trace.query_parsing = result.trace.query_parsing
    ctx.trace.filter = result.trace.filter

    return ctx
  },
}
