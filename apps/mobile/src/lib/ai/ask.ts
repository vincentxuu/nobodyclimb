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
import { loadExpoFetch } from './expoFetch'
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

/**
 * 串流請求在「送出之前」就失敗（expo/fetch 模組載入失敗、原生模組不可用）。
 * 只有這種情況能確定請求沒到後端，才可安全地退回一次性請求而不重複扣配額。
 */
export class AIStreamUnavailableError extends Error {
  constructor(cause: unknown) {
    super('AI 串流不可用', { cause })
    this.name = 'AIStreamUnavailableError'
  }
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
 * - 送出前失敗（expo/fetch 模組不可用）：丟出 AIStreamUnavailableError，請求確定未送達
 * - fetch 本身被拒（網路錯誤）：丟出 AIChatError('interrupted')；請求可能已送達後端，不可重送
 * - HTTP 錯誤 / SSE error 事件 / 串流中途斷線：丟出 AIChatError
 * - 使用者中止：丟出的錯誤不具特定型別（expo/fetch 不是 AbortError），呼叫端以 signal.aborted 判斷
 */
export async function askAIStream(
  request: AIAskRequest,
  handlers: AIAskStreamHandlers,
  signal: AbortSignal
): Promise<AIAskResult> {
  // 模組不可用（舊 dev client、jest）時在送出前失敗並退回一次性請求
  let expoFetch: Awaited<ReturnType<typeof loadExpoFetch>>['fetch']
  try {
    expoFetch = (await loadExpoFetch()).fetch
  } catch (error) {
    throw new AIStreamUnavailableError(error)
  }

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
  }).catch((error: unknown) => {
    if (signal.aborted) throw error
    // 後端在回 header 前就已扣配額，網路錯誤不代表請求沒送出，交由使用者自行重試
    throw new AIChatError('interrupted')
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
 * 串流優先；只在「確定請求沒送達後端」時才退回一次性請求，避免重複扣配額、多跑一次 LLM：
 * - 送出前失敗（AIStreamUnavailableError：expo/fetch 模組不可用）
 * - 401：後端在驗證階段就拒絕，退回 axios 讓 interceptor 走既有的 token refresh 流程
 * 其餘（網路錯誤、5xx、SSE error、中途斷線）一律原樣丟出，由使用者自行重試。
 */
export async function askAI(
  request: AIAskRequest,
  handlers: AIAskStreamHandlers,
  signal: AbortSignal
): Promise<AIAskResult> {
  try {
    return await askAIStream(request, handlers, signal)
  } catch (error) {
    if (signal.aborted) throw error
    if (error instanceof AIStreamUnavailableError) return askAIOnce(request, signal)
    if (error instanceof AIChatError && error.status === 401) return askAIOnce(request, signal)
    throw error
  }
}
