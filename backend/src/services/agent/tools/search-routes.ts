import { loadPipelineConfig } from '../../core/config'
import { buildExcerpt, buildUrl, extractTitle } from '../../core/documents'
import { EmbeddingService } from '../../core/embedding'
import { extractGradeFilter, extractTypeFilter } from '../../core/nlp'
import { hybridSearch } from '../../tools/hybrid-search'
import type { Tool, ToolContext, ToolResult } from '../types'
import { isSmallModel } from '../types'
import { type AgentRouteSource, fetchLatestVideoMap } from './route-sources'

export const searchRoutesTool: Tool = {
  name: 'search_routes',
  tags: ['retrieval', 'routes'],
  alwaysLoad: true,
  concurrencySafe: true,
  maxResultChars: 3000,
  cacheTTL: 3600,
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: '搜尋攀岩路線的查詢文字（中文或英文）',
      },
      crag: {
        type: 'string',
        description: '（可選）限定搜尋的岩場名稱',
      },
    },
    required: ['query'],
  },

  prompt(ctx: ToolContext): string {
    let desc =
      '搜尋台灣攀岩路線資料庫（混合向量 + 全文檢索）。輸入自然語言描述想找的路線（例如「龍洞 5.10 運動攀」、「適合新手的路線」）。回傳相關路線的名稱、難度、岩場、類型等資訊。'

    if (isSmallModel(ctx.models.orchestrator)) {
      desc +=
        '\n\n使用範例：\n- 「龍洞 5.10 的裂隙路線」→ { "query": "裂隙", "crag": "龍洞" }\n- 「適合新手的 sport 路線」→ { "query": "新手 sport" }\n- 「大砲岩簡單的路線」→ { "query": "簡單", "crag": "大砲岩" }'
    }

    if (ctx.availableTools.includes('weather')) {
      desc += '\n\n提示：如果用戶問適不適合去某個岩場，建議先用 weather 確認天氣再搜路線。'
    }

    return desc
  },

  async execute(input: unknown, ctx: ToolContext): Promise<unknown> {
    const { query, crag } = input as { query: string; crag?: string }

    // 建構 vector filter
    const vectorFilter: Record<string, unknown> = { type: { $eq: 'route' } }

    // 岩場篩選
    if (crag) {
      const cragRow = await ctx.env.DB.prepare('SELECT id FROM crags WHERE name LIKE ? LIMIT 1')
        .bind(`%${crag}%`)
        .first<{ id: string }>()
      if (cragRow) vectorFilter['crag_id'] = { $eq: cragRow.id }
    }

    // NLP 提取難度和類型篩選
    const gradeFilter = extractGradeFilter(query)
    if (gradeFilter) vectorFilter['grade_numeric'] = gradeFilter
    const typeFilter = extractTypeFilter(query)
    if (typeFilter) vectorFilter['route_type'] = { $eq: typeFilter }

    // Embed query
    const embeddingService = new EmbeddingService(ctx.env)
    const embedStart = Date.now()
    const queryVector = await embeddingService.embed(query)
    const embeddingMs = Date.now() - embedStart

    // 載入檢索設定
    const cfg = await loadPipelineConfig(ctx.env.DB)

    // 執行混合搜尋
    const retrievalStart = Date.now()
    const result = await hybridSearch(ctx.env, {
      query,
      queryVector,
      vectorFilter,
      retrievalMethod: 'hybrid',
      config: {
        bm25_top_k: cfg.bm25_top_k,
        merge_top_k: cfg.merge_top_k,
        min_rrf_score: cfg.min_rrf_score,
        min_rrf_score_filtered: cfg.min_rrf_score_filtered,
      },
    })
    const retrievalMs = Date.now() - retrievalStart

    // 轉換為 Agent 格式（保留 url，供後續注入站內連結）
    const routes = result.candidateMatches
      .slice(0, 10)
      .map((match) => {
        const doc = result.documents.get(match.id)
        if (!doc) return null
        return {
          id: doc.source_id,
          title: extractTitle(doc),
          excerpt: buildExcerpt(doc),
          score: Math.round(match.score * 1000) / 1000,
          text: doc.text.slice(0, 500),
          url: buildUrl(doc),
        }
      })
      .filter(Boolean) as Array<{
      id: string
      title: string
      excerpt: string
      score: number
      text: string
      url?: string
    }>

    // 補上最新影片連結（與 pipeline 的 popularity-rerank 共用同一資料來源）
    const latestVideoMap = await fetchLatestVideoMap(
      ctx.env.DB,
      routes.map((r) => r.id)
    )
    const enriched = routes.map((r) => ({
      ...r,
      latestVideoUrl: latestVideoMap.get(r.id),
    }))

    return {
      results: enriched,
      count: enriched.length,
      _trace: {
        embedding: { duration_ms: embeddingMs },
        filter: { applied: vectorFilter },
        retrieval: {
          ...result.trace,
          duration_ms: retrievalMs,
          top_score: result.retrievalScore,
          doc_count: enriched.length,
        },
      },
    }
  },

  formatResult(raw: unknown): ToolResult {
    const data = raw as {
      results: Array<{
        id: string
        title: string
        excerpt?: string
        score?: number
        text?: string
        url?: string
        latestVideoUrl?: string
      }>
      count: number
      _trace?: Record<string, unknown>
    }
    if (!data.results?.length) {
      return {
        content: '未找到符合條件的路線。',
        metadata: { resultCount: 0, _trace: data._trace },
      }
    }
    const lines = data.results.map(
      (r, i) =>
        `${i + 1}. ${r.title}${r.excerpt ? `\n   ${r.excerpt}` : ''}${r.text ? `\n   ${r.text.slice(0, 200)}` : ''}`
    )
    // 結構化來源保留給 post_loop 注入站內連結與影片連結用
    const sources: AgentRouteSource[] = data.results
      .filter((r) => r.url)
      .map((r) => ({
        id: r.id,
        type: 'route' as const,
        title: r.title,
        url: r.url,
        excerpt: r.excerpt,
        score: r.score,
        latestVideoUrl: r.latestVideoUrl,
      }))
    return {
      content: `找到 ${data.count} 條路線：\n\n${lines.join('\n\n')}`,
      metadata: { resultCount: data.count, _trace: data._trace, sources },
    }
  },
}
