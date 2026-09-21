/**
 * AI 問答請求：SSE 串流為主、一次性請求為 fallback
 * 對應 web：apps/web/src/lib/api/ai.ts 的 askAIStream / askAI
 *
 * React Native 內建 fetch 讀不到 response body stream，串流改用 `expo/fetch`
 * （支援 `response.body.getReader()` 與 AbortSignal）。
 */
import type { AiQuota, ApiResponse } from '@nobodyclimb/types'
import { apiClient } from '@/lib/api'
import { tokenStorage } from '@/lib/tokenStorage'
import { AIChatError, createErrorFromResponse } from './errors'
import {
  type AIStreamDoneEvent,
  type AIStreamProgressEvent,
  type AIStreamSource,
  createSSEParser,
  reduceStreamText,
} from './sse'

export interface AIChatHistoryMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface AIAskRequest {
  query: string
  include_sources: true
  chat_history?: AIChatHistoryMessage[]
  no_cache?: boolean
  /** 帶了就由後端寫入 user / assistant 訊息，前端不可再另外儲存 */
  session_id?: string
  /** 搭配 session_id：以新回答取代最後一則 assistant 訊息，不新增 user 訊息 */
  regenerate?: boolean
}

export interface AIAskResult {
  answer: string
  sources: AIStreamSource[]
  queryId?: string
  suggestedQuestions: string[]
  /** 串流路徑只回剩餘次數 */
  quotaRemaining?: number
  /** 一次性請求回完整配額 */
  quota?: AiQuota
}

export interface AIAskStreamHandlers {
  onToken: (token: string) => void
  /** 已推送的文字作廢，需清空畫面上累積的內容 */
  onTokenReset: () => void
  onProgress: (event: AIStreamProgressEvent) => void
}

interface AIAskResponse {
  answer: string
  sources?: AIStreamSource[]
  query_id?: string
  suggested_questions?: string[]
  quota?: AiQuota
}

function toResult(event: AIStreamDoneEvent, streamedText: string): AIAskResult {
  return {
    // done.answer 是後處理過的最終版，覆蓋串流累積的文字
    answer: event.answer ?? streamedText,
    sources: event.sources,
    queryId: event.query_id,
    suggestedQuestions: event.suggested_questions,
    quotaRemaining: event.quota_remaining,
  }
}

/**
 * SSE 串流問答。
 * - 建立連線階段失敗：丟出原始錯誤（非 AIChatError），由呼叫端決定是否 fallback
 * - HTTP 錯誤 / SSE error 事件 / 串流中途斷線：丟出 AIChatError
 * - 使用者中止：丟出的錯誤不具特定型別（expo/fetch 不是 AbortError），呼叫端以 signal.aborted 判斷
 */
export async function askAIStream(
  request: AIAskRequest,
  handlers: AIAskStreamHandlers,
  signal: AbortSignal
): Promise<AIAskResult> {
  // 延後載入：expo/fetch 依賴原生模組，模組不可用（舊 dev client、jest）時只會讓這次串流
  // 在建立連線階段失敗並退回一次性請求，不會讓整個 ChatWidget 載入失敗
  const { fetch: expoFetch } = await import('expo/fetch')
  const token = tokenStorage.getAccessToken()
  const response = await expoFetch(`${apiClient.defaults.baseURL}/ai/ask?stream=true`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(request),
    signal,
  })

  if (!response.ok) {
    let body: unknown = null
    try {
      body = await response.json()
    } catch {
      // 非 JSON 錯誤頁，僅依 status 判斷
    }
    throw createErrorFromResponse(response.status, body)
  }

  if (!response.body) throw new AIChatError('internal', { status: response.status })

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  const parser = createSSEParser()
  let streamedText = ''
  let doneEvent: AIStreamDoneEvent | null = null

  try {
    while (!doneEvent) {
      const { done, value } = await reader.read()
      const events = done ? parser.flush() : parser.push(decoder.decode(value, { stream: true }))

      for (const event of events) {
        streamedText = reduceStreamText(streamedText, event)
        if (event.type === 'token') {
          handlers.onToken(event.token)
        } else if (event.type === 'token_reset') {
          handlers.onTokenReset()
        } else if (event.type === 'progress') {
          handlers.onProgress(event)
        } else if (event.type === 'error') {
          throw new AIChatError(event.code, { serverMessage: event.message })
        } else {
          doneEvent = event
        }
      }

      if (done) break
    }
  } catch (error) {
    if (error instanceof AIChatError || signal.aborted) throw error
    throw new AIChatError('interrupted')
  } finally {
    reader.cancel().catch(() => {})
  }

  // 沒收到 done 就結束：連線中途被切斷
  if (!doneEvent) throw new AIChatError('interrupted')
  return toResult(doneEvent, streamedText)
}

/** 一次性問答（串流不可用時的 fallback） */
export async function askAIOnce(request: AIAskRequest, signal: AbortSignal): Promise<AIAskResult> {
  try {
    const response = await apiClient.post<ApiResponse<AIAskResponse>>('/ai/ask', request, {
      timeout: 60000,
      signal,
    })
    const data = response.data.data
    if (!response.data.success || !data) {
      throw createErrorFromResponse(response.status, response.data)
    }
    return {
      answer: data.answer,
      sources: data.sources ?? [],
      queryId: data.query_id,
      suggestedQuestions: data.suggested_questions ?? [],
      quota: data.quota,
    }
  } catch (error) {
    if (error instanceof AIChatError) throw error
    const axiosError = error as { response?: { status?: number; data?: unknown } }
    if (axiosError.response?.status) {
      throw createErrorFromResponse(axiosError.response.status, axiosError.response.data)
    }
    throw error
  }
}

/**
 * 串流優先；僅在「建立連線階段失敗且非 4xx」時退回一次性請求。
 * 例外：401 也退回一次性請求，讓 axios interceptor 走既有的 token refresh 流程
 * （此時後端尚未扣配額、也未寫入訊息，不會重複）。
 */
export async function askAI(
  request: AIAskRequest,
  handlers: AIAskStreamHandlers,
  signal: AbortSignal
): Promise<AIAskResult> {
  let streamStarted = false
  try {
    return await askAIStream(
      request,
      {
        onToken: (token) => {
          streamStarted = true
          handlers.onToken(token)
        },
        onTokenReset: handlers.onTokenReset,
        onProgress: (event) => {
          streamStarted = true
          handlers.onProgress(event)
        },
      },
      signal
    )
  } catch (error) {
    if (signal.aborted || streamStarted) throw error

    if (error instanceof AIChatError) {
      const status = error.status
      // 沒有 status = 串流已開始後的錯誤（SSE error 事件 / 中途斷線），不重送
      if (status === undefined) throw error
      if (status >= 400 && status < 500 && status !== 401) throw error
    }

    return askAIOnce(request, signal)
  }
}
