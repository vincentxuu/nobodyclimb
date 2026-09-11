import { EmbeddingService } from '../../core/embedding'
import { loadPipelineConfig } from '../../core/config'
import { buildExcerpt, extractTitle } from '../../core/documents'
import { hybridSearch } from '../../tools/hybrid-search'
import type { Tool, ToolContext, ToolResult } from '../types'

export const searchCragsTool: Tool = {
  name: 'search_crags',
  tags: ['retrieval', 'crags'],
  alwaysLoad: true,
  concurrencySafe: true,
  maxResultChars: 2000,
  cacheTTL: 21600,
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: '搜尋岩場的查詢文字',
      },
    },
    required: ['query'],
  },

  prompt(_ctx: ToolContext): string {
    return '搜尋台灣攀岩岩場資料庫（混合向量 + 全文檢索）。回傳岩場的名稱、位置、路線數量、難度範圍、特色等。'
  },

  async execute(input: unknown, ctx: ToolContext): Promise<unknown> {
    const { query } = input as { query: string }

    const vectorFilter: Record<string, unknown> = { type: { $eq: 'crag' } }

    // Embed query
    const embeddingService = new EmbeddingService(ctx.env)
    const queryVector = await embeddingService.embed(query)

    // 載入檢索設定
    const cfg = await loadPipelineConfig(ctx.env.DB)

    // 執行混合搜尋
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

    // 轉換為 Agent 格式
    const crags = result.candidateMatches
      .slice(0, 5)
      .map((match) => {
        const doc = result.documents.get(match.id)
        if (!doc) return null
        return {
          title: extractTitle(doc),
          excerpt: buildExcerpt(doc),
          score: Math.round(match.score * 1000) / 1000,
          text: doc.text.slice(0, 500),
        }
      })
      .filter(Boolean)

    return { results: crags, count: crags.length }
  },

  formatResult(raw: unknown): ToolResult {
    const data = raw as {
      results: Array<{ title: string; excerpt?: string; text?: string }>
      count: number
    }
    if (!data.results?.length) {
      return { content: '未找到符合條件的岩場。', metadata: { resultCount: 0 } }
    }
    const lines = data.results.map(
      (r, i) =>
        `${i + 1}. ${r.title}${r.excerpt ? `\n   ${r.excerpt}` : ''}${r.text ? `\n   ${r.text.slice(0, 200)}` : ''}`
    )
    return {
      content: `找到 ${data.count} 個岩場：\n\n${lines.join('\n\n')}`,
      metadata: { resultCount: data.count },
    }
  },
}
