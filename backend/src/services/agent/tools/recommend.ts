import { gradeToNumeric } from '../../core/climbing-schema'
import { loadPipelineConfig } from '../../core/config'
import { buildExcerpt, extractTitle } from '../../core/documents'
import { EmbeddingService } from '../../core/embedding'
import { hybridSearch } from '../../tools/hybrid-search'
import type { Tool, ToolContext, ToolResult } from '../types'

export const recommendTool: Tool = {
  name: 'recommend',
  tags: ['recommendation', 'personal'],
  alwaysLoad: false,
  concurrencySafe: false,
  maxResultChars: 3000,
  cacheTTL: 300,
  parameters: {
    type: 'object',
    properties: {
      crag: {
        type: 'string',
        description: '（可選）限定推薦的岩場名稱',
      },
      grade: {
        type: 'string',
        description: '（可選）限定推薦的難度，例如 5.10、5.11a',
      },
    },
    required: [],
  },

  prompt(ctx: ToolContext): string {
    if (!ctx.userId) {
      return '為用戶推薦個人化攀岩路線。（目前用戶未登入，無法使用此工具）'
    }
    return '根據用戶的攀登歷史，推薦個人化的進階攀岩路線，會排除已完攀的路線。僅適合「推薦我下一條」「適合我的」等以用戶歷史為基礎的推薦場景。若用戶明確指定難度（如 5.11）或想查特定條件路線清單，請改用 search_routes 工具。'
  },

  async execute(input: unknown, ctx: ToolContext): Promise<unknown> {
    if (!ctx.userId) {
      return { error: '用戶未登入，無法產生個人化推薦' }
    }

    const { crag, grade } = input as { crag?: string; grade?: string }
    const db = ctx.env.DB

    // 取得用戶近期攀登記錄
    const ascents = await db
      .prepare(
        `SELECT r.name AS route_name, r.grade, ra.ascent_type AS style, c.name AS crag_name
         FROM user_route_ascents ra
         LEFT JOIN routes r ON ra.route_id = r.id
         LEFT JOIN crags c ON r.crag_id = c.id
         WHERE ra.user_id = ?
         ORDER BY ra.ascent_date DESC
         LIMIT 10`
      )
      .bind(ctx.userId)
      .all<{ route_name: string; grade: string; style: string; crag_name: string | null }>()

    // 取得已攀登路線 ID
    const climbedRoutes = await db
      .prepare('SELECT DISTINCT route_id FROM user_route_ascents WHERE user_id = ?')
      .bind(ctx.userId)
      .all<{ route_id: string }>()
    const climbedRouteIds = new Set((climbedRoutes.results ?? []).map((r) => r.route_id))

    // 建構查詢與篩選
    const query = crag
      ? `推薦適合我的 ${crag}${grade ? ` ${grade}` : ''} 攀岩路線`
      : `推薦適合我的${grade ? ` ${grade}` : ''} 攀岩路線`

    const vectorFilter: Record<string, unknown> = { type: { $eq: 'route' } }
    if (crag) {
      const cragRow = await db
        .prepare('SELECT id FROM crags WHERE name LIKE ? LIMIT 1')
        .bind(`%${crag}%`)
        .first<{ id: string }>()
      if (cragRow) vectorFilter['crag_id'] = { $eq: cragRow.id }
    }

    // Embed + hybrid search
    const embeddingService = new EmbeddingService(ctx.env)
    const queryVector = await embeddingService.embed(query)
    const cfg = await loadPipelineConfig(db)

    const searchResult = await hybridSearch(ctx.env, {
      query,
      queryVector,
      vectorFilter,
      retrievalMethod: 'hybrid',
      config: {
        bm25_top_k: cfg.bm25_top_k,
        merge_top_k: Math.max(cfg.merge_top_k, 20), // 多撈一些，post-filter 後取 10
        min_rrf_score: cfg.min_rrf_score,
        min_rrf_score_filtered: cfg.min_rrf_score_filtered,
      },
    })

    // 從近期攀登紀錄推算用戶程度（最高 grade）
    const gradeNumerics = (ascents.results ?? [])
      .map((a) => gradeToNumeric(a.grade))
      .filter((n) => n > 0)
    const userMaxGrade = gradeNumerics.length > 0 ? Math.max(...gradeNumerics) : null

    // 轉換並排除已攀登路線
    let filtered = searchResult.candidateMatches
      .map((match) => {
        const doc = searchResult.documents.get(match.id)
        if (!doc) return null
        if (climbedRouteIds.has(doc.source_id)) return null
        return {
          id: doc.source_id,
          title: extractTitle(doc),
          excerpt: buildExcerpt(doc),
          score: match.score,
          text: doc.text.slice(0, 300),
        }
      })
      .filter(Boolean) as Array<{
      id: string
      title: string
      excerpt: string
      score: number
      text: string
    }>

    // 難度過濾
    if (grade) {
      const requestedGrade = gradeToNumeric(grade)
      if (requestedGrade > 0) {
        const majorBase = Math.floor(requestedGrade / 10) * 10
        const gradeFiltered = filtered.filter((r) => {
          const gradeNum = gradeToNumeric(r.excerpt?.match(/5\.\d+[a-d]?/)?.[0])
          if (gradeNum === 0) return true
          return Math.floor(gradeNum / 10) * 10 === majorBase
        })
        if (gradeFiltered.length >= 1) filtered = gradeFiltered
      }
    } else if (userMaxGrade !== null) {
      const minGrade = userMaxGrade
      const maxGrade = userMaxGrade + 10
      const gradeFiltered = filtered.filter((r) => {
        const gradeNum = gradeToNumeric(r.excerpt?.match(/5\.\d+[a-d]?/)?.[0])
        if (gradeNum === 0) return true
        return gradeNum >= minGrade && gradeNum <= maxGrade
      })
      if (gradeFiltered.length >= 1) filtered = gradeFiltered
    }

    filtered = filtered.slice(0, 10)

    return {
      recentAscents: ascents.results ?? [],
      recommendations: filtered,
      count: filtered.length,
    }
  },

  formatResult(raw: unknown): ToolResult {
    const data = raw as {
      error?: string
      recentAscents?: Array<{ route_name: string; grade: string }>
      recommendations?: Array<{ title: string; excerpt?: string; text?: string }>
      count?: number
    }

    if (data.error) {
      return { content: data.error }
    }

    const lines: string[] = []
    if (data.recommendations?.length) {
      lines.push(`推薦路線（${data.count} 條）：`)
      for (const [i, r] of data.recommendations.entries()) {
        lines.push(
          `${i + 1}. ${r.title}${r.excerpt ? `\n   ${r.excerpt}` : ''}${r.text ? `\n   ${r.text.slice(0, 200)}` : ''}`
        )
      }
    } else {
      lines.push('目前沒有推薦路線。')
    }

    return {
      content: lines.join('\n'),
      metadata: { resultCount: data.count ?? 0 },
    }
  },
}
