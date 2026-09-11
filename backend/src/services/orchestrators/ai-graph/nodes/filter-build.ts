import { endSpan, startSpan } from '../../../../utils/langfuse'
import { buildFilters } from '../../../tools/build-filters'
import { GraphState } from '../state'

export async function filterBuildNode(state: GraphState): Promise<Partial<GraphState>> {
  const span = startSpan(state.langfuseTrace ?? null, 'filter-build', {
    query: state.request.query,
  })
  try {
    const { queryService } = state

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
        query: state.request.query,
        existingFilter: state.vectorFilter,
        parsedQuery: state.parsedQuery as Record<string, unknown> | null | undefined,
        queryType: state.queryType,
        preloadedCrags: state.preloadedCrags ?? [],
        preloadedAreas: state.preloadedAreas ?? [],
        recentHistory: state.recentHistory,
        isSimRouteSearch: state.isSimRouteSearch,
      }
    )

    endSpan(span, {
      output: {
        filterSource: result.trace.filter.source,
        filterKeys: Object.keys(result.vectorFilter),
      },
    })
    return {
      vectorFilter: result.vectorFilter,
      trace: {
        ...state.trace,
        ...result.trace,
      },
    }
  } catch (err) {
    endSpan(span, { level: 'ERROR', metadata: { error: String(err) } })
    throw err
  }
}
