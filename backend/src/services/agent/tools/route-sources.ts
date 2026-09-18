import type { AISource } from '../../../types'

// Agent tool 回傳的路線／岩場來源（可轉為 AISource 供 injectRouteLinks 使用）
export interface AgentRouteSource {
  id: string
  type: 'route' | 'crag'
  title: string
  url?: string
  excerpt?: string
  score?: number
  latestVideoUrl?: string
}

// 查詢路線最新影片（與 popularity-rerank 共用同一張表邏輯）
export async function fetchLatestVideoMap(
  db: D1Database,
  routeIds: string[]
): Promise<Map<string, string>> {
  const result = new Map<string, string>()
  if (routeIds.length === 0) return result
  const ids = routeIds.slice(0, 500)
  const placeholders = ids.map(() => '?').join(', ')
  try {
    const rows = await db
      .prepare(
        `SELECT rv.route_id, v.youtube_id
         FROM route_videos rv
         JOIN videos v ON rv.video_id = v.id
         WHERE rv.route_id IN (${placeholders}) AND v.youtube_id IS NOT NULL
         ORDER BY rv.route_id, COALESCE(v.published_at, rv.created_at) DESC`
      )
      .bind(...ids)
      .all<{ route_id: string; youtube_id: string }>()
    const seen = new Set<string>()
    for (const row of rows.results ?? []) {
      if (!seen.has(row.route_id)) {
        result.set(row.route_id, `https://youtube.com/watch?v=${row.youtube_id}`)
        seen.add(row.route_id)
      }
    }
  } catch {
    // route_videos 表不存在或查詢失敗時靜默略過，不擋主流程
  }
  return result
}

// AgentRouteSource 轉 AISource（供 injectRouteLinks 使用）
export function toAISource(s: AgentRouteSource): AISource {
  return {
    id: s.id,
    type: s.type,
    title: s.title,
    excerpt: s.excerpt ?? '',
    url: s.url,
    score: s.score ?? 0,
    latestVideoUrl: s.latestVideoUrl,
  }
}

// 合併多輪 tool 結果的 sources（依 id 去重）
export function mergeSources(lists: Array<AgentRouteSource[] | undefined>): AgentRouteSource[] {
  const seen = new Set<string>()
  const merged: AgentRouteSource[] = []
  for (const list of lists) {
    for (const s of list ?? []) {
      const key = `${s.type}:${s.id}`
      if (seen.has(key)) continue
      seen.add(key)
      merged.push(s)
    }
  }
  return merged
}
