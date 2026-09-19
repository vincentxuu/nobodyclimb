import { getMemoriesSummary, getUserMemories } from '../../../repositories/memory'
import type { Tool, ToolContext, ToolResult } from '../types'

export const recallMemoryTool: Tool = {
  name: 'recall_memory',
  tags: ['memory', 'personal'],
  alwaysLoad: false,
  concurrencySafe: true,
  maxResultChars: 2000,
  cacheTTL: 60,
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: '搜尋記憶的關鍵字（如「偏好」「目標」「程度」）',
      },
    },
    required: [],
  },

  prompt(ctx: ToolContext): string {
    if (!ctx.userId) {
      return '回想使用者過去分享的攀岩偏好和目標。（目前用戶未登入，無法使用此工具）'
    }
    return '回想使用者過去分享的攀岩經歷、偏好、程度和目標，用於個人化對話。當使用者提到「之前說過」「我的偏好」等字眼時使用。'
  },

  async execute(input: unknown, ctx: ToolContext): Promise<unknown> {
    if (!ctx.userId) {
      return { error: '用戶未登入，無法查詢記憶' }
    }

    const { query } = input as { query?: string }

    // 如果有 query 關鍵字，取全部記憶再過濾；否則回傳摘要
    if (query) {
      const memories = await getUserMemories(ctx.userId, ctx.env.DB)
      const filtered = memories.filter(
        (m) => m.content.includes(query) || m.memory_key.includes(query)
      )
      return {
        memories: filtered.map((m) => ({
          key: m.memory_key,
          type: m.memory_type,
          content: m.content,
        })),
        count: filtered.length,
        totalMemories: memories.length,
      }
    }

    const summary = await getMemoriesSummary(ctx.userId, ctx.env.DB)
    return { summary, hasMemories: summary !== null }
  },

  formatResult(raw: unknown): ToolResult {
    const data = raw as {
      error?: string
      summary?: string | null
      hasMemories?: boolean
      memories?: Array<{ key: string; type: string; content: string }>
      count?: number
      totalMemories?: number
    }

    if (data.error) {
      return { content: data.error }
    }

    if (data.memories) {
      if (data.count === 0) {
        return {
          content: `未找到相關記憶（共有 ${data.totalMemories} 筆記憶）。`,
          metadata: { count: 0 },
        }
      }
      const lines = data.memories.map((m) => `- ${m.key}：${m.content}`)
      return {
        content: `找到 ${data.count} 筆相關記憶：\n${lines.join('\n')}`,
        metadata: { count: data.count },
      }
    }

    if (!data.hasMemories) {
      return { content: '使用者目前沒有儲存任何記憶。', metadata: { count: 0 } }
    }

    return {
      content: `使用者記憶：\n${data.summary}`,
      metadata: { hasMemories: true },
    }
  },
}
