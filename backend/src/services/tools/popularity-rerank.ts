/**
 * popularity-rerank 共用工具
 *
 * 依影片數量加權排序路線，排除已完攀路線，
 * 組合最終的 sources 和 context 文字。
 *
 * 注意：這不只是 reranking，也包含「結果組裝」（sources + context）。
 */

import type { AIDocument, AIDocumentMetadata, AISource, Env } from '../../types'
import { buildExcerpt, buildUrl, extractTitle } from '../core/documents'
import type { SearchResult } from '../orchestrators/pipeline/types'

// ---------------------------------------------------------------------------
// Input / Output
// ---------------------------------------------------------------------------

export interface PopularityRerankInput {
  rerankedMatches: Array<SearchResult & { finalScore: number }>
  documents: Map<string, AIDocument>
  climbedRouteIds?: string[] | null
  /** 推薦情境：參考路線資訊（會加在 context 前面） */
  referenceRouteInfo?: string | null
  config: {
    reranker_weight: number
    popularity_weight: number
  }
}

export interface PopularityRerankOutput {
  rerankedMatches: Array<SearchResult & { finalScore: number }>
  videoCountMap: Map<string, number>
  latestVideoMap: Map<string, string>
  sources: AISource[]
  context: string
  trace: {
    popularity_rerank: Record<string, unknown>
    generation: Record<string, unknown>
  }
}

// ---------------------------------------------------------------------------
// 主函式
// ---------------------------------------------------------------------------

export async function popularityRerank(
  env: Env,
  input: PopularityRerankInput,
  /** 額外的 generation trace 欄位（personalization 相關） */
  generationMeta?: {
    userId?: string | null
    abilityLevel?: string | number | null
    memorySummary?: string | null
    ascentContext?: string | null
  }
): Promise<PopularityRerankOutput> {
  const { documents, referenceRouteInfo, config } = input
  let { rerankedMatches } = input

  // --- 排除已完攀路線 ---
  let climbedExcluded = 0
  if (input.climbedRouteIds?.length) {
    const climbedSet = new Set(input.climbedRouteIds)
    const before = rerankedMatches.length
    rerankedMatches = rerankedMatches.filter((match) => {
      const doc = documents.get(match.id)
      return !doc || doc.type !== 'route' || !climbedSet.has(doc.source_id)
    })
    climbedExcluded = before - rerankedMatches.length
  }

  // --- 查詢影片數量（限制 500 筆避免超過 D1 bind 參數上限） ---
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

  // --- 熱門度加權排序 ---
  const maxVideoCount = videoCountMap.size > 0 ? Math.max(...videoCountMap.values()) : 1
  const safeMax = Math.max(maxVideoCount, 1)

  const finalReranked = rerankedMatches
    .map((match) => {
      const doc = documents.get(match.id)
      if (!doc || doc.type !== 'route') return { ...match, finalScore: match.score }
      const videoCount = videoCountMap.get(doc.source_id) ?? 0
      const normalizedPop = videoCount / safeMax
      return {
        ...match,
        finalScore: match.score * config.reranker_weight + normalizedPop * config.popularity_weight,
      }
    })
    .sort((a, b) => b.finalScore - a.finalScore)

  // --- popularity_rerank trace ---
  const topSelected = finalReranked.map((m) => {
    const doc = documents.get(m.id)
    const videoCount = doc?.source_id ? (videoCountMap.get(doc.source_id) ?? 0) : 0
    const normalizedPop = safeMax > 0 ? videoCount / safeMax : 0
    return {
      title: doc ? extractTitle(doc) : m.id,
      relevance_score: Math.round(m.score * 1000) / 1000,
      popularity_score: Math.round(normalizedPop * 1000) / 1000,
      final_score: Math.round(m.finalScore * 1000) / 1000,
    }
  })

  // --- 組合 sources ---
  const sources: AISource[] = finalReranked
    .map((match) => {
      const doc = documents.get(match.id)
      if (!doc) return null
      return {
        id: doc.source_id,
        type: doc.type,
        title: extractTitle(doc),
        excerpt: buildExcerpt(doc),
        url: buildUrl(doc),
        score: match.finalScore,
        latestVideoUrl: doc.type === 'route' ? latestVideoMap.get(doc.source_id) : undefined,
      } as AISource
    })
    .filter((s): s is AISource => s !== null)

  // --- 組合 context 文字 ---
  const orderedDocs = finalReranked
    .map((m) => documents.get(m.id))
    .filter((d): d is AIDocument => d !== undefined)

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

  const context = referenceRouteInfo
    ? `${referenceRouteInfo}\n\n以下是相近難度的推薦路線：\n\n${docsText}`
    : docsText

  // --- generation trace ---
  const isPersonalized = !!(generationMeta?.memorySummary || generationMeta?.ascentContext?.length)
  const generationTrace = {
    context_doc_count: orderedDocs.length,
    personalized: !!generationMeta?.userId,
    regen_triggered: false,
    ability_level: generationMeta?.abilityLevel,
    memory_summary_length: generationMeta?.memorySummary ? generationMeta.memorySummary.length : 0,
    context_doc_titles: orderedDocs.slice(0, 10).map((d) => extractTitle(d)),
    prompt_template: isPersonalized ? 'personalized' : 'default',
    memory_summary_preview: generationMeta?.memorySummary
      ? generationMeta.memorySummary.slice(0, 200)
      : null,
  }

  return {
    rerankedMatches: finalReranked,
    videoCountMap,
    latestVideoMap,
    sources,
    context,
    trace: {
      popularity_rerank: {
        top_selected: topSelected,
        popularity_weight: config.popularity_weight,
        doc_count: finalReranked.length,
        ...(climbedExcluded > 0 ? { climbed_excluded: climbedExcluded } : {}),
      },
      generation: generationTrace,
    },
  }
}
