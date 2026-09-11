/**
 * build-filters 共用工具
 *
 * 從 parsedQuery 或 regex fallback 建構 Vectorize metadata filter，
 * 並從對話歷史補充位置資訊。純 NLP，無 LLM 呼叫。
 */

// ---------------------------------------------------------------------------
// 依賴介面（避免直接依賴 QueryService）
// ---------------------------------------------------------------------------

export interface BuildFiltersDeps {
  buildFiltersFromParsed: (parsedQuery: Record<string, unknown>) => Promise<Record<string, unknown>>
  extractGradeFilter: (query: string) => Record<string, unknown> | null
  extractLocationFilter: (
    query: string,
    crags: Array<{ id: string; name: string; region: string | null }>,
    areas: Array<{ id: string; name: string }>
  ) => { cragIds?: string[]; areaId?: string; region?: string }
  extractTypeFilter: (query: string) => string | null
  isContextDependentQuery: (query: string) => boolean
  extractRouteReference: (
    text: string
  ) => Promise<{ cragId?: string | null; routeId: string } | null>
}

// ---------------------------------------------------------------------------
// Input / Output
// ---------------------------------------------------------------------------

export interface BuildFiltersInput {
  query: string
  existingFilter?: Record<string, unknown>
  parsedQuery?: Record<string, unknown> | null
  queryType?: string
  preloadedCrags: Array<{ id: string; name: string; region: string | null }>
  preloadedAreas: Array<{ id: string; name: string }>
  recentHistory: Array<{ content: string }>
  isSimRouteSearch?: boolean
}

export interface BuildFiltersOutput {
  vectorFilter: Record<string, unknown>
  trace: {
    filter: Record<string, unknown>
    /** 只在 parsedQuery 為 null 時產出 */
    query_parsing?: Record<string, unknown>
  }
}

// ---------------------------------------------------------------------------
// 主函式
// ---------------------------------------------------------------------------

export async function buildFilters(
  deps: BuildFiltersDeps,
  input: BuildFiltersInput
): Promise<BuildFiltersOutput> {
  const {
    query,
    parsedQuery,
    queryType,
    preloadedCrags,
    preloadedAreas,
    recentHistory,
    isSimRouteSearch,
  } = input
  const vectorFilter: Record<string, unknown> = { ...(input.existingFilter ?? {}) }

  // sim-route 已在 tool-selection 建立 filter，跳過
  if (isSimRouteSearch) {
    return {
      vectorFilter,
      trace: { filter: { applied: vectorFilter, source: 'sim_route' } },
    }
  }

  let queryParsingTrace: Record<string, unknown> | undefined

  if (parsedQuery) {
    const builtFilters = await deps.buildFiltersFromParsed(parsedQuery)
    Object.assign(vectorFilter, builtFilters)

    // 補充保底：LLM 未抽取 grade
    if (!vectorFilter['grade_numeric']) {
      const gradeFilter = deps.extractGradeFilter(query)
      if (gradeFilter) vectorFilter['grade_numeric'] = gradeFilter
    }

    // 補充保底：多岩場偵測
    const locationFilter = deps.extractLocationFilter(query, preloadedCrags, preloadedAreas)

    if (locationFilter.areaId && !vectorFilter['area_id']) {
      vectorFilter['area_id'] = { $eq: locationFilter.areaId }
    } else if (locationFilter.cragIds && locationFilter.cragIds.length > 1) {
      vectorFilter['crag_id'] = { $in: locationFilter.cragIds }
    } else if (
      locationFilter.cragIds &&
      locationFilter.cragIds.length === 1 &&
      !vectorFilter['crag_id']
    ) {
      vectorFilter['crag_id'] = { $eq: locationFilter.cragIds[0] }
    } else if (
      locationFilter.region &&
      !vectorFilter['crag_id'] &&
      !vectorFilter['area_id'] &&
      !vectorFilter['region']
    ) {
      vectorFilter['region'] = { $eq: locationFilter.region }
    }
  } else {
    // Fallback：regex 方法
    queryParsingTrace = {
      tool: null,
      query_type: queryType,
      alternatives: ['search_routes', 'search_crags', 'general_knowledge'],
      params: {},
      fallback_used: true,
    }

    const gradeFilter = deps.extractGradeFilter(query)
    const locationFilter = deps.extractLocationFilter(query, preloadedCrags, preloadedAreas)
    const typeFilter = deps.extractTypeFilter(query)

    if (gradeFilter) vectorFilter['grade_numeric'] = gradeFilter
    if (locationFilter.areaId) {
      vectorFilter['area_id'] = { $eq: locationFilter.areaId }
      vectorFilter['type'] = { $eq: 'route' }
    } else if (locationFilter.cragIds && locationFilter.cragIds.length > 0) {
      vectorFilter['crag_id'] =
        locationFilter.cragIds.length === 1
          ? { $eq: locationFilter.cragIds[0] }
          : { $in: locationFilter.cragIds }
      if (typeFilter) vectorFilter['type'] = { $eq: typeFilter }
    } else if (locationFilter.region) {
      vectorFilter['region'] = { $eq: locationFilter.region }
      if (typeFilter) vectorFilter['type'] = { $eq: typeFilter }
    } else if (typeFilter) {
      vectorFilter['type'] = { $eq: typeFilter }
    }
  }

  // --- filter trace ---
  const filterSource = isSimRouteSearch
    ? 'sim_route'
    : queryParsingTrace
      ? 'regex_fallback'
      : 'llm_parsed'
  const matchedTexts: Record<string, string> = {}
  if (parsedQuery?.params) {
    const p = parsedQuery.params as Record<string, string | undefined>
    if (p.area_name) matchedTexts.area_name = p.area_name
    if (p.crag_name) matchedTexts.crag_name = p.crag_name
    if (p.grade) matchedTexts.grade = p.grade
    if (p.route_type) matchedTexts.route_type = p.route_type
    if (p.region) matchedTexts.region = p.region
  }
  const resolvedIds: Record<string, string | string[] | null> = {}
  const areaIdVal = vectorFilter['area_id'] as { $eq?: string } | undefined
  if (areaIdVal?.$eq) resolvedIds.area_id = areaIdVal.$eq
  const cragIdVal = vectorFilter['crag_id'] as { $eq?: string; $in?: string[] } | undefined
  if (cragIdVal?.$eq) resolvedIds.crag_id = cragIdVal.$eq
  else if (cragIdVal?.$in) resolvedIds.crag_id = cragIdVal.$in

  const filterTrace: Record<string, unknown> = {
    applied: vectorFilter,
    source: filterSource,
    ...(Object.keys(matchedTexts).length > 0 ? { matched_texts: matchedTexts } : {}),
    ...(Object.keys(resolvedIds).length > 0 ? { resolved_ids: resolvedIds } : {}),
  }

  // --- 對話歷史補充位置 ---
  let historySupplementedLocation = false
  const hasExplicitLocationFilter = !!(
    vectorFilter['crag_id'] ||
    vectorFilter['area_id'] ||
    vectorFilter['region']
  )
  if (
    !hasExplicitLocationFilter &&
    recentHistory.length > 0 &&
    deps.isContextDependentQuery(query)
  ) {
    const historyText = recentHistory.map((m) => m.content).join(' ')
    const historyLocation = deps.extractLocationFilter(historyText, preloadedCrags, preloadedAreas)

    if (historyLocation.areaId) {
      vectorFilter['area_id'] = { $eq: historyLocation.areaId }
      vectorFilter['type'] = { $eq: 'route' }
      historySupplementedLocation = true
    } else if (historyLocation.cragIds && historyLocation.cragIds.length > 0) {
      vectorFilter['crag_id'] =
        historyLocation.cragIds.length === 1
          ? { $eq: historyLocation.cragIds[0] }
          : { $in: historyLocation.cragIds }
      if (!vectorFilter['type']) vectorFilter['type'] = { $eq: 'route' }
      historySupplementedLocation = true
    } else if (historyLocation.region) {
      vectorFilter['region'] = { $eq: historyLocation.region }
      historySupplementedLocation = true
    } else {
      const routeRef = await deps.extractRouteReference(historyText)
      if (routeRef?.cragId) {
        vectorFilter['crag_id'] = { $eq: routeRef.cragId }
        if (!vectorFilter['type']) vectorFilter['type'] = { $eq: 'route' }
        historySupplementedLocation = true
      }
    }
  }

  filterTrace.history_supplemented = historySupplementedLocation
  if (historySupplementedLocation) {
    const historyText = recentHistory.map((m) => m.content).join(' ')
    const existingMatchedTexts =
      (filterTrace.matched_texts as Record<string, string> | undefined) ?? {}
    filterTrace.matched_texts = {
      ...existingMatchedTexts,
      from_history: historyText.slice(0, 100),
    }
  }

  return {
    vectorFilter,
    trace: {
      filter: filterTrace,
      ...(queryParsingTrace ? { query_parsing: queryParsingTrace } : {}),
    },
  }
}
