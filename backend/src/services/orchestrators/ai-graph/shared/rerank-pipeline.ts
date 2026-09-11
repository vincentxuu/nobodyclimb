import { AIDocumentMetadata, AISource } from '../../../../types'
import { SearchResult } from '../../pipeline/types'

export interface RerankInput {
  query: string
  candidateMatches: SearchResult[]
  documents: Map<string, import('../../../../types').AIDocument>
  env: {
    AI: { run: Function }
    DB: { prepare: (sql: string) => { bind: (...args: unknown[]) => { all: <T>() => Promise<{ results: T[] }> } } }
  }
  config: {
    reranker_relevance_threshold: number
    reranker_min_keep: number
    mmr_lambda: number
    max_results: number
    reranker_weight: number
    popularity_weight: number
  }
  queryService: {
    applyMMR: (candidates: SearchResult[], documents: Map<string, import('../../../../types').AIDocument>, lambda: number, limit: number) => SearchResult[]
    extractTitle: (doc: import('../../../../types').AIDocument) => string
    buildExcerpt: (doc: import('../../../../types').AIDocument) => string
    buildUrl: (doc: import('../../../../types').AIDocument) => string
  }
  climbedRouteIds?: string[] | null
  referenceRouteInfo?: string | null
}

export interface RerankOutput {
  scoredCandidates: SearchResult[]
  rerankedMatches: Array<SearchResult & { finalScore: number }>
  sources: AISource[]
  context: string
  videoCountMap: Record<string, number>
  latestVideoMap: Record<string, string>
  trace: {
    reranker?: Record<string, unknown>
    mmr_selection?: Record<string, unknown>
    generation?: Record<string, unknown>
  }
}

export async function runRerankPipeline(input: RerankInput): Promise<RerankOutput> {
  const { query, candidateMatches, documents, env, config, queryService, climbedRouteIds } = input

  // ---- Step 1: Semantic Rerank (Cross-Encoder) ----
  let scoredCandidates: SearchResult[] = candidateMatches
  let rerankerTrace: Record<string, unknown> = {}

  const rerankCandidates = candidateMatches.filter((m) => documents.has(m.id))
  if (rerankCandidates.length > 1) {
    try {
      const contexts = rerankCandidates.map((m) => ({ text: documents.get(m.id)!.text }))
      const rerankerResult = (await env.AI.run('@cf/baai/bge-reranker-base', {
        query,
        contexts,
      })) as { response: { id: number; score: number }[] }

      if (rerankerResult?.response?.length > 0) {
        const scoreByIdx = new Map(rerankerResult.response.map((r) => [r.id, r.score]))
        const scored = rerankCandidates.map((m, idx) => ({
          ...m,
          score: scoreByIdx.get(idx) ?? m.score,
        }))

        const threshold = config.reranker_relevance_threshold
        const minKeep = config.reranker_min_keep
        const sorted = [...scored].sort((a, b) => b.score - a.score)
        const filtered = sorted.filter((m) => m.score >= threshold)
        const beforeCount = sorted.length
        scoredCandidates = filtered.length >= minKeep ? filtered : sorted.slice(0, minKeep)
        const filteredCount = beforeCount - scoredCandidates.length

        rerankerTrace = {
          reranker_used: true,
          reranker: {
            input_count: rerankCandidates.length,
            filtered_count: filteredCount,
            threshold_used: threshold,
            top_scores: scoredCandidates.map((m) => {
              const doc = documents.get(m.id)
              return {
                title: doc ? queryService.extractTitle(doc) : m.id,
                score: Math.round(m.score * 1000) / 1000,
              }
            }),
          },
        }
      }
    } catch {
      rerankerTrace = { reranker_used: false, reranker: { skipped_reason: 'reranker_error' } }
    }
  } else {
    rerankerTrace = { reranker_used: false, reranker: { skipped_reason: 'too_few_candidates' } }
  }

  // ---- Step 2: Diversity Filter (MMR) ----
  const mmrSelected = queryService.applyMMR(
    scoredCandidates,
    documents,
    config.mmr_lambda,
    config.max_results
  )
  let rerankedMatches = mmrSelected.map((m) => ({ ...m, finalScore: m.score }))

  // ---- Step 3: Domain Rerank (Popularity + Climbed Exclusion) ----
  if (climbedRouteIds && climbedRouteIds.length > 0) {
    const climbedSet = new Set(climbedRouteIds)
    rerankedMatches = rerankedMatches.filter((match) => {
      const doc = documents.get(match.id)
      return !doc || doc.type !== 'route' || !climbedSet.has(doc.source_id)
    })
  }

  const routeSourceIds = [...documents.values()]
    .filter((d) => d.type === 'route')
    .map((d) => d.source_id)
    .slice(0, 500)

  const videoCountMap = new Map<string, number>()
  const latestVideoMap = new Map<string, string>()

  if (routeSourceIds.length > 0) {
    const placeholders = routeSourceIds.map(() => '?').join(', ')
    const [vcResult, latestVideoResult] = await Promise.all([
      env.DB.prepare(
        `SELECT route_id, COUNT(*) as cnt FROM route_videos WHERE route_id IN (${placeholders}) GROUP BY route_id`
      )
        .bind(...routeSourceIds)
        .all<{ route_id: string; cnt: number }>(),
      env.DB.prepare(
        `SELECT rv.route_id, v.youtube_id
         FROM route_videos rv
         JOIN videos v ON rv.video_id = v.id
         WHERE rv.route_id IN (${placeholders}) AND v.youtube_id IS NOT NULL
         ORDER BY rv.route_id, COALESCE(v.published_at, rv.created_at) DESC`
      )
        .bind(...routeSourceIds)
        .all<{ route_id: string; youtube_id: string }>(),
    ])
    for (const row of vcResult.results) {
      videoCountMap.set(row.route_id, row.cnt)
    }
    const seenRoutes = new Set<string>()
    for (const row of latestVideoResult.results) {
      if (!seenRoutes.has(row.route_id)) {
        latestVideoMap.set(row.route_id, `https://youtube.com/watch?v=${row.youtube_id}`)
        seenRoutes.add(row.route_id)
      }
    }
  }

  const maxVideoCount = videoCountMap.size > 0 ? Math.max(...videoCountMap.values()) : 1
  const safeMax = Math.max(maxVideoCount, 1)

  const finalReranked = rerankedMatches
    .map((match) => {
      const doc = documents.get(match.id)
      if (!doc || doc.type !== 'route') return match
      const videoCount = videoCountMap.get(doc.source_id) ?? 0
      const normalizedPop = videoCount / safeMax
      return {
        ...match,
        finalScore:
          match.score * config.reranker_weight +
          normalizedPop * config.popularity_weight,
      }
    })
    .sort((a, b) => b.finalScore - a.finalScore)

  // ---- Build sources and context ----
  const sources: AISource[] = finalReranked
    .map((match) => {
      const doc = documents.get(match.id)
      if (!doc) return null
      return {
        id: doc.source_id,
        type: doc.type,
        title: queryService.extractTitle(doc),
        excerpt: queryService.buildExcerpt(doc),
        url: queryService.buildUrl(doc),
        score: match.finalScore,
        latestVideoUrl: doc.type === 'route' ? latestVideoMap.get(doc.source_id) : undefined,
      } as AISource
    })
    .filter((s): s is AISource => s !== null)

  const orderedDocs = finalReranked
    .map((m) => documents.get(m.id))
    .filter((d): d is import('../../../../types').AIDocument => d !== undefined)

  const docsText =
    orderedDocs.length > 0
      ? orderedDocs
          .map((d) => {
            if (d.type === 'route') {
              const vc = videoCountMap.get(d.source_id) ?? 0
              let text = d.text
              const meta = d.metadata
                ? (JSON.parse(d.metadata) as AIDocumentMetadata)
                : ({} as AIDocumentMetadata)
              if (meta.crag_id) {
                text += `\n路線連結：/crag/${meta.crag_id}/route/${d.source_id}`
              }
              if (vc > 0) {
                text += `\n影片數量：${vc}`
              }
              return text
            }
            return d.text
          })
          .join('\n\n---\n\n')
      : '目前沒有找到相關資料。'

  const context = input.referenceRouteInfo
    ? `${input.referenceRouteInfo}\n\n以下是相近難度的推薦路線：\n\n${docsText}`
    : docsText

  const mmrTrace = {
    lambda: config.mmr_lambda,
    input_count: scoredCandidates.length,
    selected_count: mmrSelected.length,
    top_selected: finalReranked.map((m) => {
      const doc = documents.get(m.id)
      const videoCount = doc?.source_id ? (videoCountMap.get(doc.source_id) ?? 0) : 0
      const normalizedPop = safeMax > 0 ? videoCount / safeMax : 0
      return {
        title: doc ? queryService.extractTitle(doc) : m.id,
        relevance_score: Math.round(m.score * 1000) / 1000,
        popularity_score: Math.round(normalizedPop * 1000) / 1000,
        final_score: Math.round(m.finalScore * 1000) / 1000,
      }
    }),
  }

  return {
    scoredCandidates,
    rerankedMatches: finalReranked,
    sources,
    context,
    videoCountMap: Object.fromEntries(videoCountMap),
    latestVideoMap: Object.fromEntries(latestVideoMap),
    trace: {
      reranker: rerankerTrace,
      mmr_selection: mmrTrace,
      generation: {
        context_doc_count: orderedDocs.length,
        context_doc_titles: orderedDocs.slice(0, 10).map((d) => queryService.extractTitle(d)),
      },
    },
  }
}
