import type {
  AIChatHistoryMessage,
  AIErrorCode,
  AIQuotaErrorData,
  AISource,
  AIStreamProgressEvent,
  AiQuota,
  ChatMessage as StoredChatMessage,
} from '@/lib/api/ai'

// =============================================
// 型別
// =============================================

// 錯誤提示所需的資料；顯示文字由 UI 以 Chat.errors.<code> 翻譯，不寫進 content
export interface ChatMessageError {
  code: AIErrorCode
  /** quota_exceeded 顯示「已用 / 上限」用 */
  used?: number
  limit?: number
}

export interface ChatMessageData {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: AISource[]
  queryId?: string
  suggestedQuestions?: string[]
  /** 串流中：尚未收到 done 事件 */
  isStreaming?: boolean
  /** 工具使用過程（SSE progress 事件） */
  toolProgress?: AIStreamProgressEvent[]
  /** stopped = 使用者中斷；error = 生成失敗。content 只放模型實際產生的文字 */
  status?: 'stopped' | 'error'
  error?: ChatMessageError
}

type ChatErrorTranslator = (
  _key: `errors.${AIErrorCode}`,
  _values?: Record<string, string | number>
) => string

// 錯誤碼 → 當前語系的提示文字（t 為 useTranslations('Chat')）
export function formatChatError(t: ChatErrorTranslator, error: ChatMessageError): string {
  if (error.code === 'quota_exceeded') {
    return t('errors.quota_exceeded', { used: error.used ?? 0, limit: error.limit ?? 0 })
  }
  return t(`errors.${error.code}`)
}

// =============================================
// 對話歷史
// =============================================

// 後端只取最近 6 則，前端統一送 6 則
export const CHAT_HISTORY_LIMIT = 6

// 組裝送給後端的 chat_history：排除串流中的訊息與沒有實際內容的錯誤 / 中斷提示。
// 「已停止」「生成中斷」等字樣由 UI 依 status 顯示，不在 content 裡，所以不會進到歷史
export function buildChatHistory(messages: ChatMessageData[]): AIChatHistoryMessage[] {
  return messages
    .filter((m) => !m.isStreaming && m.content.trim() !== '')
    .slice(-CHAT_HISTORY_LIMIT)
    .map((m) => ({ role: m.role, content: m.content }))
}

// =============================================
// 重新生成
// =============================================

export interface RegenerateTarget {
  /** 要重問的 user 訊息內容 */
  query: string
  /** 保留的訊息（到該則 user 訊息為止，其後的 assistant 訊息移除） */
  kept: ChatMessageData[]
  /** 該則 user 訊息之前的訊息，用來組 chat_history */
  before: ChatMessageData[]
}

// 只有「最後一則是已結束、非錯誤的 assistant 訊息」才能重新生成：
// 錯誤時後端可能沒有寫入這一輪，帶 regenerate 會取代到上一輪的回答
export function getRegenerateTarget(messages: ChatMessageData[]): RegenerateTarget | null {
  const last = messages[messages.length - 1]
  if (!last || last.role !== 'assistant' || last.isStreaming || last.status === 'error') return null
  let userIndex = -1
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user') {
      userIndex = i
      break
    }
  }
  if (userIndex < 0) return null
  return {
    query: messages[userIndex].content,
    kept: messages.slice(0, userIndex + 1),
    before: messages.slice(0, userIndex),
  }
}

// =============================================
// 後端儲存的訊息 → 前端訊息
// =============================================

// suggested_questions 可能是 JSON 字串或陣列（舊資料），壞資料視為沒有
function parseStringArray(value: string[] | string | null | undefined): string[] | undefined {
  if (!value) return undefined
  if (Array.isArray(value)) return value
  try {
    const parsed: unknown = JSON.parse(value)
    return Array.isArray(parsed)
      ? parsed.filter((q): q is string => typeof q === 'string')
      : undefined
  } catch {
    return undefined
  }
}

export function mapStoredMessages(stored: StoredChatMessage[]): ChatMessageData[] {
  return stored.map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content,
    sources: Array.isArray(m.sources) && m.sources.length > 0 ? m.sources : undefined,
    queryId: m.query_id,
    suggestedQuestions: parseStringArray(m.suggested_questions),
    ...(m.status === 'stopped' ? { status: 'stopped' as const } : {}),
  }))
}

// =============================================
// 配額
// =============================================

// 後端沒附配額資料、前端也還沒拿到配額時的每日上限 fallback（最低等級的上限）
const FALLBACK_DAILY_LIMIT = 2

// 配額用盡提示要顯示的「已用 / 上限」
export function getQuotaExceededUsage(
  prev: AiQuota | null,
  data: AIQuotaErrorData | undefined
): { used: number; limit: number } {
  const limit = data?.daily_limit ?? prev?.daily_limit ?? FALLBACK_DAILY_LIMIT
  return { used: data?.daily_used ?? limit, limit }
}

// 次數配額用盡（429 quota_exceeded）：以後端附帶的 data 更新配額，沒有 data 就把剩餘歸零
export function applyQuotaExceeded(
  prev: AiQuota | null,
  data: AIQuotaErrorData | undefined
): AiQuota | null {
  if (!data) return prev ? { ...prev, remaining: 0, daily_used: prev.daily_limit } : prev
  const { limit } = getQuotaExceededUsage(prev, data)
  return {
    tier: (data.tier ?? prev?.tier ?? 'foothill') as AiQuota['tier'],
    tier_display: data.tier_display ?? prev?.tier_display ?? '',
    daily_limit: limit,
    daily_used: data.daily_used ?? limit,
    remaining: 0,
    score: prev?.score ?? 0,
    resets_at: data.resets_at ?? prev?.resets_at ?? '',
    token_limit: prev?.token_limit ?? 0,
    token_used: prev?.token_used ?? 0,
    token_remaining: prev?.token_remaining ?? 0,
  }
}

// done 事件的 quota_remaining（-1 = 無限制，不更新）
export function applyQuotaRemaining(prev: AiQuota | null, remaining: number): AiQuota | null {
  if (!prev || remaining < 0) return prev
  return { ...prev, remaining, daily_used: prev.daily_limit - remaining }
}
