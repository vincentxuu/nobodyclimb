/**
 * hybrid-search 共用工具
 *
 * 從 ai-graph/nodes/hybrid-search.ts 與 pipeline/steps/hybrid-search.ts 的
 * 共用 baseline 邏輯抽取而來。執行：並行 Vector + HyDE + BM25 + expanded vectors
 * → RRF merge → sim-route fallback → CRAG grade fallback → document fetch。
 *
 * 被三個消費者呼叫：
 * - ai-graph node（薄 wrapper：GraphState ↔ HybridSearchInput）
 * - pipeline step（薄 wrapper：PipelineContext ↔ HybridSearchInput）
 * - agent tool（wrapper 加上自動 embedding）
 */

import type { AIDocument, Env } from '../../types'
import { getDocuments } from '../core/documents'
import { mergeResults, searchBM25 } from '../core/retrieval'
import type { SearchResult } from '../orchestrators/pipeline/types'

// ---------------------------------------------------------------------------
// Input / Output
// ---------------------------------------------------------------------------

export interface HybridSearchInput {
  query: string

  /** 預先計算的向量（pipeline/graph 由上游步驟提供，agent 由 wrapper 自動 embed） */
  queryVector: number[]
  hydeVector?: number[] | null
  expandedVectors?: number[][]

  /** Vectorize metadata 篩選條件 */
  vectorFilter?: Record<string, unknown>

  /** 搜尋模式：vector = 只向量，bm25 = 只全文，hybrid = 兩者並行（預設） */
  retrievalMethod?: 'vector' | 'bm25' | 'hybrid'

  /** 相似路線搜尋（放寬 crag filter 做 fallback） */
  isSimRouteSearch?: boolean
  excludeRouteIds?: string[]

  /** 設定值（從 PipelineConfig 挑出來的子集） */
  config: {
    bm25_top_k: number
    merge_top_k: number
    min_rrf_score: number
    min_rrf_score_filtered: number
  }
}

export interface HybridSearchOutput {
  candidateMatches: SearchResult[]
  documents: Map<string, AIDocument>
  retrievalScore: number
  trace: HybridSearchTrace
}

export interface HybridSearchTrace {
  retrieval_method: string
  paths: string[]
  path_counts: Record<string, number>
  path_results: Record<string, PathDoc[]>
  bm25_fts_query: string | null
  candidates_before_filter: number
  candidates_after_filter: number
  crag_fallback: boolean
  crag_fallback_stage: 'grade' | null
  reranker_used: boolean
  rrf: {
    paths_count: number
    merged_count: number
    min_score_threshold: number
    after_threshold_count: number
  }
  crag_fallback_detail: null | {
    trigger_reason: string
    retries: { removed_filter: string; candidates_after: number }[]
  }
}

type PathDoc = { id: string; score: number; name?: string }

// ---------------------------------------------------------------------------
// 主函式
// ---------------------------------------------------------------------------

export async function hybridSearch(
  env: Env,
  input: HybridSearchInput
): Promise<HybridSearchOutput> {
  const {
    query,
    queryVector,
    hydeVector = null,
    expandedVectors = [],
    vectorFilter = {},
    retrievalMethod = 'hybrid',
    isSimRouteSearch = false,
    excludeRouteIds = [],
    config,
  } = input

  // --- 動態調整 MERGE_TOP_K（多岩場時加倍） ---
  const cragFilter = vectorFilter['crag_id'] as { $in?: string[] } | undefined
  const isMultiCrag = Array.isArray(cragFilter?.$in) && cragFilter.$in.length > 1
  const MERGE_TOP_K = isMultiCrag ? Math.max(20, config.merge_top_k * 2) : config.merge_top_k

  // --- 有篩選條件時放寬 RRF 門檻 ---
  const hasFilter = Object.keys(vectorFilter).some((k) =>
    ['grade_numeric', 'crag_id', 'area_id', 'region', 'route_type'].includes(k)
  )
  const minScore = hasFilter ? config.min_rrf_score_filtered : config.min_rrf_score

  // --- 為 HyDE 和 expanded vectors 建立各自的 filter ---
  const hydeFilter: Record<string, unknown> =
    vectorFilter['crag_id'] || vectorFilter['area_id']
      ? { ...vectorFilter }
      : vectorFilter['type']
        ? { type: vectorFilter['type'] }
        : {}
  const expandedFilter = vectorFilter['type'] ? { type: vectorFilter['type'] } : undefined

  // --- 依 retrievalMethod 跳過某些路徑 ---
  const skipVector = retrievalMethod === 'bm25'
  const skipBM25 = retrievalMethod === 'vector'

  // --- 並行執行所有搜尋路徑 ---
  const allSearchPromises: Promise<{ matches: SearchResult[] } | SearchResult[]>[] = [
    !skipVector
      ? env.VECTOR_INDEX.query(queryVector, {
          topK: MERGE_TOP_K,
          returnMetadata: 'all',
          filter: Object.keys(vectorFilter).length > 0 ? vectorFilter : undefined,
        })
      : Promise.resolve({ matches: [] as SearchResult[] }),
    !skipVector && hydeVector
      ? env.VECTOR_INDEX.query(hydeVector, {
          topK: MERGE_TOP_K,
          returnMetadata: 'all',
          filter: Object.keys(hydeFilter).length > 0 ? hydeFilter : undefined,
        })
      : Promise.resolve({ matches: [] as SearchResult[] }),
    !skipBM25
      ? searchBM25(env.DB, query, config.bm25_top_k)
      : Promise.resolve([] as SearchResult[]),
    ...(!skipVector
      ? expandedVectors.map((vec) =>
          env.VECTOR_INDEX.query(vec, {
            topK: MERGE_TOP_K,
            returnMetadata: 'all',
            filter: expandedFilter,
          })
        )
      : []),
  ]

  const allResults = await Promise.all(allSearchPromises)
  const queryVecResult = allResults[0] as { matches: SearchResult[] }
  const hydeVecResult = allResults[1] as { matches: SearchResult[] }
  const bm25Matches = allResults[2] as SearchResult[]
  const expandedVecResults = !skipVector
    ? (allResults.slice(3) as { matches: SearchResult[] }[]).map((r) =>
        r.matches.map((m) => ({
          id: m.id,
          score: m.score,
          metadata: m.metadata,
        }))
      )
    : []

  let queryMatches: SearchResult[] = queryVecResult.matches.map((m) => ({
    id: m.id,
    score: m.score,
    metadata: m.metadata,
  }))
  let rawHydeMatches: SearchResult[] =
    hydeVector && !skipVector
      ? hydeVecResult.matches.map((m) => ({
          id: m.id,
          score: m.score,
          metadata: m.metadata,
        }))
      : []

  // --- 相似路線 fallback：放寬 crag filter ---
  if (isSimRouteSearch && queryMatches.length === 0 && vectorFilter['crag_id']) {
    const relaxedFilter: Record<string, unknown> = { type: { $eq: 'route' } }
    if (vectorFilter['grade_numeric'])
      relaxedFilter['grade_numeric'] = vectorFilter['grade_numeric']

    const [fbQueryResult, fbHydeResult] = await Promise.all([
      env.VECTOR_INDEX.query(queryVector, {
        topK: MERGE_TOP_K,
        returnMetadata: 'all',
        filter: relaxedFilter,
      }),
      hydeVector
        ? env.VECTOR_INDEX.query(hydeVector, {
            topK: MERGE_TOP_K,
            returnMetadata: 'all',
            filter: relaxedFilter,
          })
        : Promise.resolve({ matches: [] as SearchResult[] }),
    ])
    queryMatches = fbQueryResult.matches.map((m) => ({
      id: m.id,
      score: m.score,
      metadata: m.metadata,
    }))
    rawHydeMatches = fbHydeResult.matches.map((m) => ({
      id: m.id,
      score: m.score,
      metadata: m.metadata,
    }))
  }

  // --- 地點篩選時如果主向量無結果，捨棄 HyDE（避免 HyDE 帶進無關岩場） ---
  const hasLocationFilter = !!(
    vectorFilter['crag_id'] ||
    vectorFilter['area_id'] ||
    vectorFilter['region']
  )
  const hydeMatches = hasLocationFilter && queryMatches.length === 0 ? [] : rawHydeMatches

  // --- RRF 合併 ---
  const mergedMatches = mergeResults(
    [queryMatches, hydeMatches, bm25Matches, ...expandedVecResults],
    MERGE_TOP_K
  )
  let candidateMatches = mergedMatches.filter((m) => m.score >= minScore)
  const retrievalScore =
    mergedMatches.length > 0 ? Math.max(...mergedMatches.map((m) => m.score)) : 0

  // --- Trace 建構 ---
  const tracePaths = ['query_vec']
  if (hydeVector) tracePaths.push('hyde_vec')
  tracePaths.push('bm25')
  expandedVectors.forEach((_, i) => tracePaths.push(`expanded_${i}`))

  const toPathDocs = (results: SearchResult[], limit = 20): PathDoc[] =>
    results.slice(0, limit).map((m) => ({
      id: m.id,
      score: Math.round(m.score * 1000) / 1000,
      name:
        (m.metadata?.['name'] as string | undefined) ??
        (m.metadata?.['crag_name'] as string | undefined),
    }))

  const pathCounts: Record<string, number> = { query_vec: queryMatches.length }
  const pathResults: Record<string, PathDoc[]> = { query_vec: toPathDocs(queryMatches) }
  if (hydeVector) {
    pathCounts['hyde_vec'] = hydeMatches.length
    pathResults['hyde_vec'] = toPathDocs(hydeMatches)
  }
  pathCounts['bm25'] = bm25Matches.length
  pathResults['bm25'] = toPathDocs(bm25Matches)
  expandedVectors.forEach((_, i) => {
    const results = expandedVecResults[i] ?? []
    pathCounts[`expanded_${i}`] = results.length
    pathResults[`expanded_${i}`] = toPathDocs(results)
  })

  const bm25FtsQuery = query.replace(/["\x00-\x1f()*^[\]]/g, ' ').trim() || null

  const trace: HybridSearchTrace = {
    retrieval_method: retrievalMethod,
    paths: tracePaths,
    path_counts: pathCounts,
    path_results: pathResults,
    bm25_fts_query: bm25FtsQuery,
    candidates_before_filter: mergedMatches.length,
    candidates_after_filter: candidateMatches.length,
    crag_fallback: false,
    crag_fallback_stage: null,
    reranker_used: false,
    rrf: {
      paths_count: tracePaths.length,
      merged_count: mergedMatches.length,
      min_score_threshold: minScore,
      after_threshold_count: candidateMatches.length,
    },
    crag_fallback_detail: null,
  }

  // --- CRAG fallback：移除 grade filter 重試 ---
  if (candidateMatches.length === 0 && vectorFilter['grade_numeric']) {
    const relaxedFilter = { ...vectorFilter }
    delete relaxedFilter['grade_numeric']
    const retryResult = await env.VECTOR_INDEX.query(queryVector, {
      topK: MERGE_TOP_K,
      returnMetadata: 'all',
      filter: Object.keys(relaxedFilter).length > 0 ? relaxedFilter : undefined,
    })
    const retryMatches = retryResult.matches.map((m) => ({
      id: m.id,
      score: m.score,
      metadata: m.metadata,
    }))
    const retryMerged = mergeResults([retryMatches, bm25Matches], MERGE_TOP_K)
    candidateMatches = retryMerged.filter((m) => m.score >= minScore)
    if (candidateMatches.length > 0) {
      trace.crag_fallback = true
      trace.crag_fallback_stage = 'grade'
      trace.crag_fallback_detail = {
        trigger_reason: 'no_results_with_grade_filter',
        retries: [{ removed_filter: 'grade_numeric', candidates_after: candidateMatches.length }],
      }
    }
  }

  // --- 取得完整文件 ---
  const documents = await getDocuments(
    env.DB,
    candidateMatches.map((m) => m.id)
  )

  // --- 排除指定路線 ---
  if (excludeRouteIds.length > 0) {
    const excludeSet = new Set(excludeRouteIds)
    for (const [embeddingId, doc] of documents) {
      if (excludeSet.has(doc.source_id)) documents.delete(embeddingId)
    }
  }

  return { candidateMatches, documents, retrievalScore, trace }
}
