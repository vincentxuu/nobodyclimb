/**
 * 工具執行進度的彙整與顯示名稱
 * 對應 web：apps/web/src/lib/chat/tool-progress.ts（mobile 為精簡版，不含 Request / Response）
 */
import type { AIStreamProgressEvent } from './sse'

export interface ToolProgressItem {
  id: string
  tool: string
  status: 'executing' | 'done'
  isError: boolean
}

// 單一事件併入既有列表：同一 id 視為同一次呼叫，保留首次出現順序、取最新狀態
export function upsertToolProgress(
  list: ToolProgressItem[],
  event: AIStreamProgressEvent
): ToolProgressItem[] {
  const item: ToolProgressItem = {
    id: event.id,
    tool: event.tool,
    status: event.status,
    isError: event.is_error === true,
  }
  const index = list.findIndex((current) => current.id === event.id)
  if (index < 0) return [...list, item]

  const next = [...list]
  next[index] = item
  return next
}

// 與 web messages/zh.json 的 Chat.tools 對齊
const TOOL_LABELS: Record<string, string> = {
  search_routes: '搜尋路線',
  search_crags: '搜尋岩場',
  crag_info: '查詢岩場資訊',
  sql_query: '查詢資料庫',
  weather: '查詢天氣',
  recall_memory: '回想記憶',
  user_profile: '讀取攀登紀錄',
  manage_goals: '查詢目標',
  recommend: '產生推薦',
  suggest_training: '分析訓練建議',
  coaching_agent: '教練分析',
  recommend_agent: '個人化推薦',
}

export function getToolLabel(tool: string): string {
  return TOOL_LABELS[tool] ?? tool
}
