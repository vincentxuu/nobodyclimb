/**
 * AI 問答 SSE 串流解析（純函式，不依賴 React Native / 網路層）
 *
 * 後端 `POST /ai/ask?stream=true` 每行送一筆 `data: <json>`；
 * 以 `:` 開頭的行是 heartbeat comment，需忽略。
 * 對應 web：apps/web/src/lib/api/ai.ts 的 askAIStream
 */

export interface AIStreamSource {
  id: string
  type: 'route' | 'crag' | 'video'
  title: string
  excerpt: string
  url?: string
  score: number
}

export interface AIStreamTokenEvent {
  type: 'token'
  token: string
}

// 先前推送的 token 作廢（agent 該輪改為呼叫工具或 LLM 重試），client 需清空已累積的文字
export interface AIStreamTokenResetEvent {
  type: 'token_reset'
}

// 同名 tool 並行時以 id 區分 invocation；executing 帶 input、done 帶 output / is_error / duration_ms
export interface AIStreamProgressEvent {
  type: 'progress'
  id: string
  tool: string
  status: 'executing' | 'done'
  input?: unknown
  output?: string
  is_error?: boolean
  duration_ms?: number
}

export interface AIStreamDoneEvent {
  type: 'done'
  query_id?: string
  /** 後處理過的最終回答，需覆蓋串流累積的文字 */
  answer?: string
  sources: AIStreamSource[]
  suggested_questions: string[]
  quota_remaining?: number
}

export interface AIStreamErrorEvent {
  type: 'error'
  code: string
  message?: string
}

export type AIStreamEvent =
  | AIStreamTokenEvent
  | AIStreamTokenResetEvent
  | AIStreamProgressEvent
  | AIStreamDoneEvent
  | AIStreamErrorEvent

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isSource(value: unknown): value is AIStreamSource {
  return isRecord(value) && typeof value.id === 'string' && typeof value.title === 'string'
}

/** 解析單行 SSE；heartbeat、空行、非 data 行、壞 JSON、未知事件一律回 null */
export function parseSSELine(rawLine: string): AIStreamEvent | null {
  const line = rawLine.endsWith('\r') ? rawLine.slice(0, -1) : rawLine
  if (!line || line.startsWith(':')) return null
  if (!line.startsWith('data:')) return null

  const jsonStr = line.slice(5).trim()
  if (!jsonStr) return null

  let payload: unknown
  try {
    payload = JSON.parse(jsonStr)
  } catch {
    return null
  }
  if (!isRecord(payload)) return null

  switch (payload.type) {
    case 'token':
      return typeof payload.token === 'string' ? { type: 'token', token: payload.token } : null
    case 'token_reset':
      return { type: 'token_reset' }
    case 'progress': {
      if (typeof payload.tool !== 'string') return null
      if (payload.status !== 'executing' && payload.status !== 'done') return null
      return {
        type: 'progress',
        // 舊後端可能沒送 id，退回以 tool 名合併
        id: typeof payload.id === 'string' && payload.id ? payload.id : payload.tool,
        tool: payload.tool,
        status: payload.status,
        input: payload.input,
        output: typeof payload.output === 'string' ? payload.output : undefined,
        is_error: typeof payload.is_error === 'boolean' ? payload.is_error : undefined,
        duration_ms: typeof payload.duration_ms === 'number' ? payload.duration_ms : undefined,
      }
    }
    case 'done':
      return {
        type: 'done',
        query_id: typeof payload.query_id === 'string' ? payload.query_id : undefined,
        answer: typeof payload.answer === 'string' ? payload.answer : undefined,
        sources: Array.isArray(payload.sources) ? payload.sources.filter(isSource) : [],
        suggested_questions: Array.isArray(payload.suggested_questions)
          ? payload.suggested_questions.filter((item): item is string => typeof item === 'string')
          : [],
        quota_remaining:
          typeof payload.quota_remaining === 'number' ? payload.quota_remaining : undefined,
      }
    case 'error':
      return {
        type: 'error',
        code: typeof payload.code === 'string' && payload.code ? payload.code : 'internal',
        message: typeof payload.message === 'string' ? payload.message : undefined,
      }
    default:
      return null
  }
}

/** 依事件更新「目前這則回答已累積的文字」：token 往後接、token_reset 清空，其餘事件不影響 */
export function reduceStreamText(text: string, event: AIStreamEvent): string {
  if (event.type === 'token') return text + event.token
  if (event.type === 'token_reset') return ''
  return text
}

export interface SSEParser {
  /** 餵入一段已解碼的文字，回傳這段湊齊的完整事件（未滿一行的尾巴會留到下次） */
  push: (chunk: string) => AIStreamEvent[]
  /** 串流結束時呼叫，處理最後一行沒有換行結尾的殘留 */
  flush: () => AIStreamEvent[]
}

export function createSSEParser(): SSEParser {
  let buffer = ''

  const parseLines = (lines: string[]) => {
    const events: AIStreamEvent[] = []
    for (const line of lines) {
      const event = parseSSELine(line)
      if (event) events.push(event)
    }
    return events
  }

  return {
    push(chunk) {
      buffer += chunk
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      return parseLines(lines)
    },
    flush() {
      const rest = buffer
      buffer = ''
      return rest ? parseLines([rest]) : []
    },
  }
}
