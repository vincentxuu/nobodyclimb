import { TextDecoder, TextEncoder } from 'node:util'
import en from '../../../../messages/en.json'
import ja from '../../../../messages/ja.json'
import zh from '../../../../messages/zh.json'
import type { AIRequestError, AIStreamDoneEvent } from '../ai'
import {
  AI_ERROR_CODES,
  askAIStream,
  normalizeAIErrorCode,
  parseAIErrorResponse,
  toAIRequestError,
} from '../ai'

jest.mock('../client', () => ({ __esModule: true, default: {} }))
jest.mock('../../constants', () => ({ API_BASE_URL: 'https://api.test/api/v1' }))
jest.mock('@nobodyclimb/api-client/web', () => ({ getAccessToken: () => 'token' }))

describe('normalizeAIErrorCode', () => {
  it('已知錯誤碼原樣回傳', () => {
    for (const code of AI_ERROR_CODES) expect(normalizeAIErrorCode(code)).toBe(code)
  })

  it('後端的 InvalidInput 統一成 invalid_input', () => {
    expect(normalizeAIErrorCode('InvalidInput')).toBe('invalid_input')
  })

  it('不認得或型別不對的一律 unknown', () => {
    expect(normalizeAIErrorCode('something_else')).toBe('unknown')
    expect(normalizeAIErrorCode(undefined)).toBe('unknown')
    expect(normalizeAIErrorCode(42)).toBe('unknown')
  })
})

describe('parseAIErrorResponse', () => {
  it('429 quota_exceeded 帶出配額資料', () => {
    const data = { tier: 'foothill', daily_limit: 2, daily_used: 2, resets_at: 'x' }
    expect(
      parseAIErrorResponse(429, { success: false, error: 'quota_exceeded', message: '…', data })
    ).toEqual({ code: 'quota_exceeded', status: 429, data })
  })

  it('429 的其他錯誤碼維持原樣', () => {
    expect(parseAIErrorResponse(429, { error: 'rate_limited' }).code).toBe('rate_limited')
    expect(parseAIErrorResponse(429, { error: 'token_quota_exceeded' }).code).toBe(
      'token_quota_exceeded'
    )
  })

  it('舊後端的 429 沒帶 code 時視為次數配額用盡', () => {
    expect(parseAIErrorResponse(429, { message: '配額用盡' }).code).toBe('quota_exceeded')
  })

  it('404 session_not_found、400 InvalidInput', () => {
    expect(parseAIErrorResponse(404, { error: 'session_not_found' })).toEqual({
      code: 'session_not_found',
      status: 404,
    })
    expect(parseAIErrorResponse(400, { error: 'InvalidInput' }).code).toBe('invalid_input')
  })

  it('回應不是 JSON 物件時為 unknown', () => {
    expect(parseAIErrorResponse(502, undefined)).toEqual({ code: 'unknown', status: 502 })
    expect(parseAIErrorResponse(500, 'oops')).toEqual({ code: 'unknown', status: 500 })
  })
})

describe('toAIRequestError', () => {
  it('axios 錯誤帶 response 時解析錯誤碼', () => {
    const error = { response: { status: 429, data: { error: 'rate_limited' } } }
    expect(toAIRequestError(error)).toEqual({ code: 'rate_limited', status: 429 })
  })

  it('沒有 response（連不上 / 逾時）為 network', () => {
    expect(toAIRequestError(new Error('Network Error'))).toEqual({ code: 'network' })
    expect(toAIRequestError(null)).toEqual({ code: 'network' })
  })
})

describe('Chat.errors 訊息 key', () => {
  it('三個語系都涵蓋所有錯誤碼', () => {
    for (const messages of [zh, en, ja]) {
      expect(Object.keys(messages.Chat.errors).sort()).toEqual([...AI_ERROR_CODES].sort())
    }
  })
})

describe('askAIStream', () => {
  const originalFetch = global.fetch
  const globals = global as unknown as { TextDecoder?: unknown }
  const originalTextDecoder = globals.TextDecoder

  beforeAll(() => {
    globals.TextDecoder = TextDecoder
  })

  afterAll(() => {
    global.fetch = originalFetch
    globals.TextDecoder = originalTextDecoder
  })

  // 以假的 reader 模擬 SSE body：每個 chunk 一次 read
  function mockStream(chunks: string[], failWith?: Error) {
    const encoder = new TextEncoder()
    const queue = [...chunks]
    const reader = {
      read: jest.fn(async () => {
        const next = queue.shift()
        if (next !== undefined) return { done: false, value: encoder.encode(next) }
        if (failWith) throw failWith
        return { done: true, value: undefined }
      }),
      releaseLock: jest.fn(),
    }
    global.fetch = jest.fn(async () => ({
      ok: true,
      body: { getReader: () => reader },
    })) as unknown as typeof fetch
  }

  function run(signal?: AbortSignal) {
    const tokens: string[] = []
    const done: AIStreamDoneEvent[] = []
    const errors: AIRequestError[] = []
    const promise = askAIStream(
      { query: 'q' },
      (token) => tokens.push(token),
      (event) => done.push(event),
      (error) => errors.push(error),
      signal
    )
    return { tokens, done, errors, promise }
  }

  it('HTTP 錯誤回傳結構化錯誤碼，不帶寫死的語系字串', async () => {
    global.fetch = jest.fn(async () => ({
      ok: false,
      status: 429,
      body: null,
      json: async () => ({ success: false, error: 'quota_exceeded', data: { daily_limit: 2 } }),
    })) as unknown as typeof fetch
    const { errors, promise } = run()
    await promise
    expect(errors).toEqual([{ code: 'quota_exceeded', status: 429, data: { daily_limit: 2 } }])
  })

  it('token 與 done 事件（含跨 chunk 的行）', async () => {
    mockStream([
      'data: {"type":"token","token":"龍"}\n\ndata: {"type":"tok',
      'en","token":"洞"}\n\n',
      'data: {"type":"done","query_id":"q1","answer":"龍洞","sources":[],"suggested_questions":[],"quota_remaining":1}\n\n',
    ])
    const { tokens, done, errors, promise } = run()
    await promise
    expect(tokens).toEqual(['龍', '洞'])
    expect(done).toHaveLength(1)
    expect(done[0].query_id).toBe('q1')
    expect(errors).toEqual([])
  })

  it('SSE error 事件帶出 code', async () => {
    mockStream(['data: {"type":"error","code":"timeout","message":"逾時"}\n\n'])
    const { errors, promise } = run()
    await promise
    expect(errors).toEqual([{ code: 'timeout' }])
  })

  it('串流沒有 done 就結束時補 network 錯誤', async () => {
    mockStream(['data: {"type":"token","token":"a"}\n\n'])
    const { errors, promise } = run()
    await promise
    expect(errors).toEqual([{ code: 'network' }])
  })

  it('讀取途中斷線為 network；使用者 abort 則靜默', async () => {
    mockStream([], new Error('boom'))
    const failed = run()
    await failed.promise
    expect(failed.errors).toEqual([{ code: 'network' }])

    const abortError = new Error('aborted')
    abortError.name = 'AbortError'
    mockStream([], abortError)
    const aborted = run()
    await aborted.promise
    expect(aborted.errors).toEqual([])

    global.fetch = jest.fn(async () => {
      throw abortError
    }) as unknown as typeof fetch
    const abortedBeforeResponse = run()
    await abortedBeforeResponse.promise
    expect(abortedBeforeResponse.errors).toEqual([])
  })
})
